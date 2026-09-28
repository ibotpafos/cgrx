//! HTTP handlers only inspect bounded in-memory state. Project work never holds
//! a catalogue/cache lock, and is serialized independently for each runtime.
use super::{
    HttpRequest, HttpResponse, Visualizer, managed_state_path, open_managed_runtime, pool::Pool,
};
use serde_json::{Value, json};
use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{Arc, Mutex, MutexGuard};
use std::time::{Duration, Instant};
const MAX_PROJECTS: usize = 200;
const MAX_DIRECTORY_ENTRIES: usize = 2000;
const MAX_OPEN_PROJECTS: usize = 4;
const MAX_CACHE_BYTES: usize = 128 * 1024 * 1024;
const REFRESH_INTERVAL: Duration = Duration::from_millis(500);
fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner)
}

#[derive(Clone)]
struct Project {
    id: String,
    name: String,
    root: PathBuf,
    indexed: bool,
}
impl Project {
    fn new(root: PathBuf) -> Self {
        Self {
            id: project_id(&root),
            name: root
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .into_owned(),
            indexed: managed_state_path(&root).is_ok_and(|p| p.join(".cgrx/CURRENT").is_file()),
            root,
        }
    }
}
struct Catalogue {
    projects: Vec<Project>,
    truncated: bool,
    warnings: Vec<String>,
    discovering: bool,
}
struct State {
    phase: &'static str,
    snapshot: Value,
    error: Option<String>,
    busy: bool,
    refreshed: Option<Instant>,
}
struct Slot {
    project: Project,
    state: Mutex<State>,
    runtime: Mutex<Option<Visualizer>>,
}
struct WorkGuard(Arc<Slot>);
impl Drop for WorkGuard {
    fn drop(&mut self) {
        let mut state = lock(&self.0.state);
        if state.busy {
            state.busy = false;
            state.phase = "error";
            state.error = Some("Project worker stopped unexpectedly".into());
        }
    }
}
struct Open {
    slots: BTreeMap<String, Arc<Slot>>,
    recent: VecDeque<String>,
}
struct Cached {
    project: String,
    snapshot: Value,
    key: String,
    response: HttpResponse,
    created: Instant,
}
#[derive(Default)]
struct Cache {
    entries: VecDeque<Cached>,
    bytes: usize,
}
impl Cache {
    fn get(
        &mut self,
        project: &str,
        snapshot: &Value,
        key: &str,
        fresh: bool,
    ) -> Option<HttpResponse> {
        let i = self.entries.iter().position(|e| {
            e.project == project
                && &e.snapshot == snapshot
                && e.key == key
                && (!fresh || e.created.elapsed() < REFRESH_INTERVAL)
        })?;
        let e = self.entries.remove(i)?;
        let response = e.response.clone();
        self.entries.push_back(e);
        Some(response)
    }
    fn remove_project(&mut self, project: &str) {
        self.entries.retain(|e| e.project != project);
        self.bytes = self.entries.iter().map(|e| e.response.bytes()).sum();
    }
    fn insert(&mut self, entry: Cached) {
        self.entries.retain(|e| {
            !(e.project == entry.project && (e.snapshot != entry.snapshot || e.key == entry.key))
        });
        self.bytes = self.entries.iter().map(|e| e.response.bytes()).sum();
        let size = entry.response.bytes();
        if size > MAX_CACHE_BYTES {
            return;
        }
        while self.bytes + size > MAX_CACHE_BYTES || self.entries.len() >= 512 {
            if let Some(e) = self.entries.pop_front() {
                self.bytes -= e.response.bytes();
            } else {
                break;
            }
        }
        self.bytes += size;
        self.entries.push_back(entry);
    }
}
pub(super) struct ProjectServer {
    default_id: String,
    default_root: PathBuf,
    directories: Vec<PathBuf>,
    token: String,
    catalogue: Mutex<Catalogue>,
    open: Mutex<Open>,
    cache: Mutex<Cache>,
    work: Pool,
    queries: Pool,
    discovery: Pool,
}
impl ProjectServer {
    pub(super) fn new(
        root: PathBuf,
        directories: Vec<PathBuf>,
        token: String,
    ) -> Result<Arc<Self>, String> {
        let initial = Project::new(root.clone());
        let server = Arc::new(Self {
            default_id: initial.id.clone(),
            default_root: root,
            directories,
            token,
            catalogue: Mutex::new(Catalogue {
                projects: vec![initial],
                truncated: false,
                warnings: vec![],
                discovering: false,
            }),
            open: Mutex::new(Open {
                slots: BTreeMap::new(),
                recent: VecDeque::new(),
            }),
            cache: Mutex::new(Cache::default()),
            work: Pool::new("cgrx-project", 2, 16)?,
            queries: Pool::new("cgrx-query", 4, 16)?,
            discovery: Pool::new("cgrx-discover", 1, 1)?,
        });
        server.discover();
        // Opening the initial project is asynchronous, just like subsequent ones.
        let project = lock(&server.catalogue).projects[0].clone();
        let _ = server.slot(project);
        Ok(server)
    }
    fn discover(self: &Arc<Self>) {
        {
            let mut c = lock(&self.catalogue);
            if c.discovering {
                return;
            }
            c.discovering = true;
        }
        let server = Arc::clone(self);
        if !self.discovery.submit(move || {
            let mut roots = BTreeSet::from([server.default_root.clone()]);
            let mut warnings = vec![];
            let mut truncated = false;
            for directory in &server.directories {
                if let Some(root) = repository_root(directory) {
                    roots.insert(root);
                }
                let entries = match std::fs::read_dir(directory) {
                    Ok(e) => e,
                    Err(e) => {
                        warnings.push(format!("{}: {e}", directory.display()));
                        continue;
                    }
                };
                let mut candidates = vec![];
                for (index, entry) in entries.enumerate() {
                    if index >= MAX_DIRECTORY_ENTRIES {
                        truncated = true;
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
                        truncated = true;
                        break;
                    }
                    if let Some(root) = repository_root(&candidate) {
                        roots.insert(root);
                    }
                }
            }
            let mut projects: Vec<_> = roots.into_iter().map(Project::new).collect();
            projects.sort_by(|a, b| {
                a.name
                    .to_lowercase()
                    .cmp(&b.name.to_lowercase())
                    .then(a.root.cmp(&b.root))
            });
            *lock(&server.catalogue) = Catalogue {
                projects,
                truncated,
                warnings,
                discovering: false,
            };
        }) {
            lock(&self.catalogue).discovering = false;
        }
    }
    fn slot(self: &Arc<Self>, project: Project) -> Result<Arc<Slot>, HttpResponse> {
        let mut open = lock(&self.open);
        let id = project.id.clone();
        if let Some(slot) = open.slots.get(&id).cloned() {
            open.recent.retain(|p| p != &id);
            open.recent.push_back(id);
            return Ok(slot);
        }
        if open.slots.len() >= MAX_OPEN_PROJECTS {
            let oldest = open
                .recent
                .iter()
                .find(|id| {
                    open.slots
                        .get(*id)
                        .is_some_and(|s| Arc::strong_count(s) == 1)
                })
                .cloned();
            let Some(oldest) = oldest else {
                return Err(overloaded());
            };
            open.slots.remove(&oldest);
            open.recent.retain(|p| p != &oldest);
            lock(&self.cache).remove_project(&oldest);
        }
        let slot = Arc::new(Slot {
            project,
            runtime: Mutex::new(None),
            state: Mutex::new(State {
                phase: "queued",
                snapshot: Value::Null,
                error: None,
                busy: true,
                refreshed: None,
            }),
        });
        let server = Arc::clone(self);
        let task = Arc::clone(&slot);
        if !self.work.submit(move || {
            let _guard = WorkGuard(Arc::clone(&task));
            lock(&task.state).phase = "indexing";
            let result = (|| {
                if repository_root(&task.project.root).as_ref() != Some(&task.project.root) {
                    return Err("Project directory is no longer available.".to_owned());
                }
                let state = managed_state_path(&task.project.root)?;
                let runtime = open_managed_runtime(&task.project.root, &state)?;
                let risk_baseline = runtime.risk_baseline();
                let snapshot =
                    serde_json::to_value(runtime.snapshot()).map_err(|e| e.to_string())?;
                *lock(&task.runtime) = Some(Visualizer {
                    root: task.project.root.clone(),
                    state,
                    runtime,
                    risk_baseline,
                    token: server.token.clone(),
                });
                Ok(snapshot)
            })();
            let mut state = lock(&task.state);
            state.busy = false;
            match result {
                Ok(snapshot) => {
                    state.snapshot = snapshot;
                    state.phase = "ready";
                    state.refreshed = Some(Instant::now());
                }
                Err(error) => {
                    state.phase = "error";
                    state.error = Some(error);
                }
            }
        }) {
            return Err(overloaded());
        }
        open.slots.insert(id.clone(), Arc::clone(&slot));
        open.recent.push_back(id);
        Ok(slot)
    }
    fn state(&self, slot: Option<&Slot>, id: &str) -> Value {
        let open = lock(&self.open);
        let cache = lock(&self.cache);
        let resources = json!({ "open_runtimes": open.slots.len(), "runtime_limit": MAX_OPEN_PROJECTS, "cache_entries": cache.entries.len(), "cache_bytes": cache.bytes, "cache_limit_bytes": MAX_CACHE_BYTES });
        drop(cache);
        drop(open);
        if let Some(slot) = slot {
            let s = lock(&slot.state);
            json!({ "project": id, "state": s.phase, "snapshot": s.snapshot, "error": s.error, "stale": s.phase != "ready", "retry_after_ms": 100, "resources": resources })
        } else {
            json!({ "project": id, "state": "queued", "snapshot": null, "stale": true, "retry_after_ms": 100, "resources": resources })
        }
    }
    pub(super) fn handle(self: &Arc<Self>, request: &HttpRequest) -> HttpResponse {
        let head = request.method == "HEAD";
        if !matches!(request.method.as_str(), "GET" | "HEAD") {
            return HttpResponse::json_error(
                405,
                "cgrx.method_not_allowed",
                "GET or HEAD required",
            )
            .with_header("Allow", "GET, HEAD")
            .head(head);
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
        if !request.path.starts_with("/api/") {
            return super::static_response(&request.path)
                .unwrap_or_else(|| {
                    HttpResponse::json_error(404, "cgrx.not_found", "route not found")
                })
                .head(head);
        }
        if request.path == "/api/projects" {
            if request.query("refresh") == Some("1") {
                self.discover();
            }
            let c = lock(&self.catalogue);
            return HttpResponse::json(json!({ "default_project": self.default_id, "projects": c.projects.iter().map(|p| json!({ "id":p.id,"name":p.name,"path":p.root,"indexed":p.indexed })).collect::<Vec<_>>(), "directories":self.directories,"truncated":c.truncated,"warnings":c.warnings,"discovering":c.discovering })).head(head);
        }
        let id = request.query("project").unwrap_or(&self.default_id);
        let project = lock(&self.catalogue)
            .projects
            .iter()
            .find(|p| p.id == id)
            .cloned();
        let Some(project) = project else {
            return HttpResponse::json_error(
                404,
                "cgrx.unknown_project",
                "Project is not in the catalogue. Refresh the project list.",
            )
            .head(head);
        };
        if request.path == "/api/project-status" {
            let slot = lock(&self.open).slots.get(id).cloned();
            return HttpResponse::json(self.state(slot.as_deref(), id)).head(head);
        }
        let slot = match self.slot(project) {
            Ok(s) => s,
            Err(e) => return e.head(head),
        };
        let key = request.cache_key();
        {
            let s = lock(&slot.state);
            if s.phase == "error" {
                return HttpResponse::json_error(
                    503,
                    "cgrx.project_unavailable",
                    s.error.as_deref().unwrap_or("Could not open project"),
                )
                .head(head);
            }
            if let Some(response) = lock(&self.cache).get(id, &s.snapshot, &key, true) {
                return response.head(head);
            }
        }
        let mut s = lock(&slot.state);
        if !s.busy {
            // One periodic status refresh replaces refresh-on-every-panel-request.
            // Read queries use the last observed snapshot on a separate pool, so
            // two cold repositories cannot monopolize ready-project queries.
            let refresh = request.path == "/api/status"
                && s.refreshed.is_none_or(|t| t.elapsed() >= REFRESH_INTERVAL);
            let pool = if refresh { &self.work } else { &self.queries };
            s.busy = true;
            s.phase = "refreshing";
            let task = Arc::clone(&slot);
            let server = Arc::clone(self);
            let mut req = request.clone();
            req.method = "GET".into();
            if !pool.submit(move || {
                let _guard = WorkGuard(Arc::clone(&task));
                let mut runtime = lock(&task.runtime);
                let Some(runtime) = runtime.as_mut() else {
                    return;
                };
                let result = if refresh { runtime.refresh() } else { Ok(()) };
                let refresh_error = result.as_ref().err().cloned();
                let response = match result {
                    Ok(()) => {
                        let snapshot =
                            serde_json::to_value(runtime.runtime.snapshot()).unwrap_or(Value::Null);
                        let reusable = !matches!(
                            req.path.as_str(),
                            "/api/status"
                                | "/api/runtime-status"
                                | "/api/refactors"
                                | "/api/git-history"
                                | "/api/git-diff"
                        );
                        let cached = if reusable {
                            lock(&server.cache).get(&task.project.id, &snapshot, &key, false)
                        } else {
                            None
                        };
                        cached.unwrap_or_else(|| runtime.handle(&req))
                    }
                    Err(e) => {
                        HttpResponse::json_error(503, "cgrx.project_unavailable", &e.to_string())
                    }
                };
                let snapshot =
                    serde_json::to_value(runtime.runtime.snapshot()).unwrap_or(Value::Null);
                let mut state = lock(&task.state);
                state.snapshot = snapshot.clone();
                state.busy = false;
                state.phase = if refresh_error.is_some() {
                    "error"
                } else {
                    "ready"
                };
                state.error = refresh_error;
                if refresh {
                    state.refreshed = Some(Instant::now());
                }
                lock(&server.cache).insert(Cached {
                    project: task.project.id.clone(),
                    snapshot,
                    key,
                    response,
                    created: Instant::now(),
                });
            }) {
                s.busy = false;
                s.phase = "ready";
                return overloaded().head(head);
            }
        }
        drop(s);
        HttpResponse::json(self.state(Some(&slot), id))
            .status(202)
            .with_header("Retry-After", "1")
            .head(head)
    }
}
pub(super) fn overloaded() -> HttpResponse {
    HttpResponse::json_error(
        503,
        "cgrx.queue_full",
        "Project work queue is full. Retry later.",
    )
    .with_header("Retry-After", "1")
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

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn cache_is_snapshot_bound_and_globally_byte_bounded() {
        let mut cache = Cache::default();
        for i in 0..140 {
            cache.insert(Cached {
                project: format!("p{}", i % 4),
                snapshot: json!(1),
                key: i.to_string(),
                response: HttpResponse::javascript(&"x".repeat(1024 * 1024)),
                created: Instant::now(),
            });
            assert!(cache.bytes <= MAX_CACHE_BYTES);
        }
        assert!(cache.get("p3", &json!(1), "139", false).is_some());
        assert!(cache.get("p3", &json!(2), "139", false).is_none());
        cache.remove_project("p3");
        assert!(cache.entries.iter().all(|e| e.project != "p3"));
    }
}
