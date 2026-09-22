//! A bounded catalogue of explicitly selected project directories. No recursive
//! disk scan, and HTTP callers can only select catalogue IDs, never arbitrary paths.
use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::path::{Path, PathBuf};
use std::process::Command;

use serde_json::{Value, json};

use super::{HttpRequest, HttpResponse, Visualizer, managed_state_path, open_managed_runtime};

const MAX_PROJECTS: usize = 200;
const MAX_DIRECTORY_ENTRIES: usize = 2000;
const MAX_OPEN_PROJECTS: usize = 4;

struct Project {
    id: String,
    name: String,
    root: PathBuf,
}

pub(super) struct ProjectServer {
    default_id: String,
    default_root: PathBuf,
    directories: Vec<PathBuf>,
    projects: Vec<Project>,
    truncated: bool,
    warnings: Vec<String>,
    token: String,
    open: BTreeMap<String, Visualizer>,
    recent: VecDeque<String>,
}

impl ProjectServer {
    pub(super) fn new(initial: Visualizer, directories: Vec<PathBuf>) -> Self {
        let id = project_id(&initial.root);
        let mut server = Self {
            default_id: id.clone(),
            default_root: initial.root.clone(),
            directories,
            projects: Vec::new(),
            truncated: false,
            warnings: Vec::new(),
            token: initial.token.clone(),
            open: BTreeMap::from([(id.clone(), initial)]),
            recent: VecDeque::from([id]),
        };
        server.discover();
        server
    }

    fn discover(&mut self) {
        let mut roots = BTreeSet::from([self.default_root.clone()]);
        self.truncated = false;
        self.warnings.clear();
        for directory in &self.directories {
            if let Some(root) = repository_root(directory) {
                roots.insert(root);
            }
            let entries = match std::fs::read_dir(directory) {
                Ok(entries) => entries,
                Err(error) => {
                    self.warnings
                        .push(format!("{}: {error}", directory.display()));
                    continue;
                }
            };
            let mut candidates = Vec::new();
            for (index, entry) in entries.enumerate() {
                if index >= MAX_DIRECTORY_ENTRIES {
                    self.truncated = true;
                    break;
                }
                if let Ok(entry) = entry
                    && !entry.file_name().to_string_lossy().starts_with('.')
                    && entry.path().join(".git").exists()
                {
                    candidates.push(entry.path());
                }
            }
            candidates.sort();
            for candidate in candidates {
                if roots.len() >= MAX_PROJECTS {
                    self.truncated = true;
                    break;
                }
                if let Some(root) = repository_root(&candidate) {
                    roots.insert(root);
                }
            }
        }
        self.projects = roots
            .into_iter()
            .map(|root| Project {
                id: project_id(&root),
                name: root
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .into_owned(),
                root,
            })
            .collect();
        self.projects.sort_by(|a, b| {
            a.name
                .to_lowercase()
                .cmp(&b.name.to_lowercase())
                .then(a.root.cmp(&b.root))
        });
    }

    fn catalogue(&self) -> Value {
        json!({
            "default_project":self.default_id,
            "projects":self.projects.iter().map(|project| json!({
                "id":project.id, "name":project.name, "path":project.root,
                "indexed":managed_state_path(&project.root).is_ok_and(|p| p.join(".cgrx/CURRENT").is_file()),
            })).collect::<Vec<_>>(),
            "directories":self.directories, "truncated":self.truncated, "warnings":self.warnings
        })
    }

    pub(super) fn handle(&mut self, request: &HttpRequest) -> HttpResponse {
        let head = request.method == "HEAD";
        // Check the capability before catalogue discovery or opening any index.
        if !matches!(request.method.as_str(), "GET" | "HEAD") {
            return HttpResponse::json_error(
                405,
                "cgrx.method_not_allowed",
                "GET or HEAD required",
            )
            .with_header("Allow", "GET, HEAD");
        }
        if request.path.starts_with("/api/") && request.header("x-cgrx-token") != Some(&self.token)
        {
            return HttpResponse::json_error(
                401,
                "cgrx.invalid_capability",
                "a valid X-CGRX-Token header is required",
            )
            .head(head);
        }
        if request.path == "/api/projects" {
            self.discover();
            return HttpResponse::json(self.catalogue()).head(head);
        }
        // Assets do not need to open the selected repository. This also keeps
        // the project chooser usable after an indexing failure or missing HEAD.
        if !request.path.starts_with("/api/") {
            return self
                .open
                .values_mut()
                .next()
                .expect("one cached runtime")
                .handle(request);
        }
        let id = request
            .query("project")
            .unwrap_or(&self.default_id)
            .to_owned();
        let Some(project) = self.projects.iter().find(|project| project.id == id) else {
            return HttpResponse::json_error(
                404,
                "cgrx.unknown_project",
                "Project is not in the catalogue. Refresh the project list.",
            )
            .head(head);
        };
        if !self.open.contains_key(&id) {
            // A symlink changed since discovery must not redirect a catalogue ID.
            if repository_root(&project.root).as_ref() != Some(&project.root) {
                return HttpResponse::json_error(
                    404,
                    "cgrx.project_unavailable",
                    "Project directory is no longer available.",
                )
                .head(head);
            }
            let loaded = managed_state_path(&project.root).and_then(|state| {
                open_managed_runtime(&project.root, &state).map(|runtime| (state, runtime))
            });
            let (state, runtime) = match loaded {
                Ok(loaded) => loaded,
                Err(error) => {
                    return HttpResponse::json_error(
                        503,
                        "cgrx.project_unavailable",
                        &format!("Could not open {}: {error}", project.name),
                    )
                    .head(head);
                }
            };
            let risk_baseline = runtime.risk_baseline();
            self.open.insert(
                id.clone(),
                Visualizer {
                    root: project.root.clone(),
                    state,
                    runtime,
                    risk_baseline,
                    token: self.token.clone(),
                },
            );
            if self.open.len() > MAX_OPEN_PROJECTS
                && let Some(oldest) = self.recent.pop_front()
            {
                self.open.remove(&oldest);
            }
        }
        self.recent.retain(|previous| previous != &id);
        self.recent.push_back(id.clone());
        self.open
            .get_mut(&id)
            .expect("selected runtime loaded")
            .handle(request)
    }
}

fn project_id(root: &Path) -> String {
    blake3::hash(root.as_os_str().as_encoded_bytes())
        .to_hex()
        .to_string()
}

fn repository_root(path: &Path) -> Option<PathBuf> {
    if !path.join(".git").exists() {
        return None;
    }
    let canonical = path.canonicalize().ok()?;
    let result = Command::new(cgrx_cli::git_executable())
        .args(["rev-parse", "--show-toplevel"])
        .current_dir(&canonical)
        .output()
        .ok()?;
    if !result.status.success() {
        return None;
    }
    let root = PathBuf::from(String::from_utf8_lossy(&result.stdout).trim())
        .canonicalize()
        .ok()?;
    (root == canonical).then_some(root)
}
