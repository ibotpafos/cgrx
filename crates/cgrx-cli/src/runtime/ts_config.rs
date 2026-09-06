//! Bounded, pass-local TS configuration proof. No node_modules or name lookup.
use super::*;

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize)]
pub(super) struct TsResolutionConfig {
    pub supported: bool,
    pub aliases: BTreeMap<String, String>,
    pub dependencies: BTreeMap<String, Hash32>,
}
impl<'de> Deserialize<'de> for TsResolutionConfig {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        #[derive(Deserialize)]
        #[serde(untagged)]
        enum Wire {
            Legacy(bool),
            Current {
                supported: bool,
                aliases: BTreeMap<String, String>,
                dependencies: BTreeMap<String, Hash32>,
            },
        }
        Ok(match Wire::deserialize(deserializer)? {
            Wire::Legacy(value) => {
                let _ = value;
                Self::default()
            }
            Wire::Current {
                supported,
                aliases,
                dependencies,
            } => Self {
                supported,
                aliases,
                dependencies,
            },
        })
    }
}

#[derive(Default)]
pub(super) struct Witness {
    entries: BTreeMap<String, Option<SourceFingerprint>>,
    invalid: bool,
    #[cfg(test)]
    metadata_reads: usize,
}
impl Witness {
    fn watch(&mut self, root: &Path, path: &str) {
        let mut current = path;
        loop {
            // First observation is immutable within a pass. Every observed
            // path already has all ancestors recorded; final valid() rechecks
            // each entry, including absence, after config/content reads.
            if self.entries.contains_key(current) {
                break;
            }
            #[cfg(test)]
            {
                self.metadata_reads += 1;
            }
            let expected = match fs::symlink_metadata(root.join(current)) {
                Ok(m) => Some(source_fingerprint(&m)),
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
                Err(_) => {
                    self.invalid = true;
                    None
                }
            };
            self.entries.entry(current.to_owned()).or_insert(expected);
            if current.is_empty() {
                break;
            }
            current = parent(current);
        }
    }
    pub fn valid(&self, root: &Path) -> bool {
        !self.invalid
            && self
                .entries
                .iter()
                .all(|(p, before)| match fs::symlink_metadata(root.join(p)) {
                    Ok(m) => *before == Some(source_fingerprint(&m)),
                    Err(e) if e.kind() == std::io::ErrorKind::NotFound => before.is_none(),
                    _ => false,
                })
    }
}
impl TsResolutionConfig {
    pub fn legacy(source: &[u8]) -> Self {
        Self {
            supported: ts_resolution_config_supported(source),
            ..Self::default()
        }
    }
}
#[derive(Default)]
struct Options {
    base: Option<String>,
    paths: Option<(String, BTreeMap<String, String>)>,
}

// Canonical lexical repo-relative paths only; never escape the repository.
fn join(base: &str, value: &str) -> Option<String> {
    if value.starts_with('/') || value.contains(['\\', ':', '?', '#']) {
        return None;
    }
    let mut parts: Vec<_> = base.split('/').filter(|s| !s.is_empty()).collect();
    for part in value.split('/') {
        match part {
            "." => {}
            ".." => {
                parts.pop()?;
            }
            "" => return None,
            _ => parts.push(part),
        }
    }
    Some(parts.join("/"))
}
fn parent(path: &str) -> &str {
    path.rsplit_once('/').map_or("", |(p, _)| p)
}

// serde_json normally accepts duplicate object keys. Identity proofs must not.
#[derive(Deserialize)]
#[serde(untagged)]
enum UniqueJson {
    Object(#[serde(deserialize_with = "unique_map")] BTreeMap<String, UniqueJson>),
    Array(Vec<UniqueJson>),
    Other(Value),
}
fn unique_map<'de, D: serde::Deserializer<'de>>(
    d: D,
) -> Result<BTreeMap<String, UniqueJson>, D::Error> {
    struct Visitor;
    impl<'de> serde::de::Visitor<'de> for Visitor {
        type Value = BTreeMap<String, UniqueJson>;
        fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
            f.write_str("unique JSON object")
        }
        fn visit_map<A: serde::de::MapAccess<'de>>(
            self,
            mut map: A,
        ) -> Result<Self::Value, A::Error> {
            let mut out = BTreeMap::new();
            while let Some((k, v)) = map.next_entry::<String, UniqueJson>()? {
                if out.insert(k, v).is_some() {
                    return Err(serde::de::Error::custom("duplicate key"));
                }
            }
            Ok(out)
        }
    }
    d.deserialize_map(Visitor)
}
// A hand-written visitor avoids an untagged fallback accepting duplicate objects.
fn parse(source: &[u8]) -> Option<Value> {
    fn convert(v: UniqueJson) -> Option<Value> {
        match v {
            UniqueJson::Object(o) => Some(Value::Object(
                o.into_iter()
                    .map(|(k, v)| Some((k, convert(v)?)))
                    .collect::<Option<_>>()?,
            )),
            UniqueJson::Array(a) => Some(Value::Array(
                a.into_iter().map(convert).collect::<Option<_>>()?,
            )),
            UniqueJson::Other(v) if !v.is_object() && !v.is_array() => Some(v),
            _ => None,
        }
    }
    convert(serde_json::from_slice(source).ok()?)
}
struct Reader<'a> {
    root: &'a Path,
    dirs: &'a mut TsDirectoryCache,
    sources: BTreeMap<String, Vec<u8>>,
    needed: BTreeSet<String>,
    nested: BTreeMap<PathBuf, bool>,
    witness: Witness,
}
impl Reader<'_> {
    fn read(&mut self, path: &str) -> Option<Value> {
        self.witness.watch(self.root, path);
        self.needed.insert(path.to_owned());
        if !self.sources.contains_key(path) {
            let relative = Path::new(path);
            if !ts_path_is_plain(self.root, relative, self.dirs)
                || crosses_nested_git_boundary(self.root, relative, &mut self.nested)
                || !self.root.join(path).is_file()
            {
                return None;
            }
            let data = fs::read(self.root.join(path)).ok()?;
            if data.len() > 1024 * 1024 {
                return None;
            }
            self.sources.insert(path.to_owned(), data);
        }
        parse(&self.sources[path])
    }
    fn workspace_extend(&mut self, from: &str, spec: &str) -> Option<String> {
        let parts: Vec<_> = spec.split('/').collect();
        let n = if spec.starts_with('@') { 2 } else { 1 };
        if parts.len() <= n {
            return None;
        }
        let package = parts[..n].join("/");
        let subpath = format!("./{}", parts[n..].join("/"));
        // Installed package identity wins over a workspace declaration. Without
        // verified link identity, abstain even for symlinked installed packages.
        let mut dir = parent(from);
        loop {
            let candidate = if dir.is_empty() {
                format!("node_modules/{package}")
            } else {
                format!("{dir}/node_modules/{package}")
            };
            self.witness.watch(self.root, &candidate);
            match fs::symlink_metadata(self.root.join(&candidate)) {
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
                _ => return None,
            }
            if dir.is_empty() {
                break;
            }
            dir = parent(dir);
        }

        if !subpath.ends_with(".json") || subpath.contains("..") || subpath.contains('*') {
            return None;
        }
        let root = self.read("package.json")?;
        let authorized = ["dependencies", "devDependencies"].iter().any(|key| {
            root.get(key)
                .and_then(|d| d.get(&package))
                .and_then(Value::as_str)
                == Some("workspace:*")
        });
        if !authorized {
            return None;
        }
        let workspaces = root.get("workspaces")?.as_array()?;
        let mut dirs = BTreeSet::new();
        for entry in workspaces {
            let pattern = entry.as_str()?;
            if let Some(prefix) = pattern.strip_suffix("/*") {
                let prefix = join("", prefix)?;
                if prefix.contains('*') {
                    return None;
                }
                // Missing/unsafe workspace roots are not silently ignored.
                if !ts_path_is_plain(self.root, Path::new(&prefix), self.dirs) {
                    return None;
                }
                self.witness.watch(self.root, &prefix);
                let children = fs::read_dir(self.root.join(&prefix)).ok()?;
                for child in children {
                    let child = child.ok()?;
                    if child.file_type().ok()?.is_symlink() {
                        return None;
                    }
                    if child.file_type().ok()?.is_dir() {
                        dirs.insert(format!("{prefix}/{}", child.file_name().to_str()?));
                    }
                }
            } else {
                if pattern.contains('*') {
                    return None;
                }
                dirs.insert(join("", pattern)?);
            }
            if dirs.len() > 512 {
                return None;
            }
        }
        let mut found = Vec::new();
        for dir in dirs {
            let manifest = format!("{dir}/package.json");
            // A workspace without a manifest is not a package. An existing but
            // unreadable/invalid manifest could conceal a competing identity.
            self.witness.watch(self.root, &manifest);
            match fs::symlink_metadata(self.root.join(&manifest)) {
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                    self.needed.insert(manifest);
                    continue;
                }
                Err(_) => return None,
                Ok(_) => {}
            }
            let p = self.read(&manifest)?;
            if p.get("name").and_then(Value::as_str) == Some(package.as_str()) {
                let exported = p.get("exports")?.as_object()?.get(&subpath)?.as_str()?;
                if !exported.starts_with("./")
                    || !exported.ends_with(".json")
                    || exported.contains('*')
                {
                    return None;
                }
                let target = join(&dir, exported)?;
                if !target.starts_with(&format!("{dir}/")) {
                    return None;
                }
                found.push(target);
            }
        }
        let [target] = found.as_slice() else {
            return None;
        };
        Some(target.clone())
    }
    fn options(&mut self, path: &str, seen: &mut BTreeSet<String>) -> Option<Options> {
        if seen.len() >= 16 || !seen.insert(path.to_owned()) {
            return None;
        }
        let value = self.read(path)?;
        let obj = value.as_object()?;
        if obj.contains_key("references") {
            return None;
        }
        let mut out = if let Some(extends) = obj.get("extends") {
            let spec = extends.as_str()?;
            let next = if spec.starts_with("./") || spec.starts_with("../") {
                if !spec.ends_with(".json") {
                    return None;
                }
                join(parent(path), spec)?
            } else {
                self.workspace_extend(path, spec)?
            };
            self.options(&next, seen)?
        } else {
            Options::default()
        };
        if let Some(options) = obj.get("compilerOptions") {
            let options = options.as_object()?;
            // Only explicitly reviewed compiler options; unknown settings fail closed.
            const NEUTRAL: &[&str] = &[
                "target",
                "lib",
                "module",
                "declaration",
                "emitDecoratorMetadata",
                "experimentalDecorators",
                "outDir",
                "strict",
                "esModuleInterop",
                "skipLibCheck",
                "forceConsistentCasingInFileNames",
                "isolatedModules",
                "allowImportingTsExtensions",
                "noEmit",
                "jsx",
                "incremental",
                "plugins",
                "ignoreDeprecations",
                "types",
                "assumeChangesOnlyAffectDirectDependencies",
                "tsBuildInfoFile",
            ];
            for (key, value) in options {
                match key.as_str() {
                    "baseUrl" | "paths" => {}
                    "allowJs" | "resolveJsonModule" if value.is_boolean() => {}
                    "moduleResolution" if matches!(value.as_str(), Some("bundler" | "node")) => {}
                    key if NEUTRAL.contains(&key) => {}
                    _ => return None,
                }
            }
            if let Some(base) = options.get("baseUrl") {
                let base = join(parent(path), base.as_str()?)?;
                // Do not reinterpret inherited paths under an overriding baseUrl.
                if out.paths.is_some()
                    && !options.contains_key("paths")
                    && out.base.as_ref() != Some(&base)
                {
                    return None;
                }
                out.base = Some(base);
            }
            if let Some(paths) = options.get("paths") {
                let mut mapped = BTreeMap::new();
                for (key, values) in paths.as_object()? {
                    // Single exact mapping or single terminal wildcard, no fallback arrays.
                    if key.starts_with('.')
                        || key.starts_with('/')
                        || key.contains(['\\', ':', '?', '#'])
                    {
                        return None;
                    }
                    if key.matches('*').count() > 1 || key.contains('*') && !key.ends_with('*') {
                        return None;
                    }
                    let [value] = values.as_array()?.as_slice() else {
                        return None;
                    };
                    let value = value.as_str()?;
                    if value.matches('*').count() != key.matches('*').count()
                        || value.contains('*') && !value.ends_with('*')
                    {
                        return None;
                    }
                    mapped.insert(key.clone(), value.to_owned());
                }
                out.paths = Some((parent(path).to_owned(), mapped));
            }
        }
        Some(out)
    }
}

pub(super) fn collect(
    root: &Path,
    candidates: &BTreeSet<String>,
    dirs: &mut TsDirectoryCache,
) -> (
    BTreeMap<String, TsResolutionConfig>,
    BTreeSet<String>,
    Witness,
) {
    let mut reader = Reader {
        root,
        dirs,
        sources: BTreeMap::new(),
        needed: BTreeSet::new(),
        nested: BTreeMap::new(),
        witness: Witness::default(),
    };
    let mut configs = BTreeMap::new();
    for path in candidates
        .iter()
        .filter(|p| is_ts_resolution_config(Path::new(p)))
    {
        reader.witness.watch(root, path);
        match fs::symlink_metadata(root.join(path)) {
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => continue,
            _ => {}
        }
        let mut seen = BTreeSet::new();
        let mut config = TsResolutionConfig::default();
        if let Some(options) = reader.options(path, &mut seen) {
            config.supported = true;
            if let Some((origin, paths)) = options.paths {
                let base = options.base.as_deref().unwrap_or(&origin);
                for (key, target) in paths {
                    match join(base, &target) {
                        Some(target) => {
                            config.aliases.insert(key, target);
                        }
                        None => {
                            config.supported = false;
                        }
                    }
                }
            }
        }
        configs.insert(path.clone(), config);
    }
    // Every config proof includes the pass's actual config/package reads. This
    // deliberately conservative dependency superset also captures duplicates.
    let hashes: BTreeMap<_, _> = reader
        .sources
        .iter()
        .map(|(p, b)| (p.clone(), Hash32(*blake3::hash(b).as_bytes())))
        .collect();
    let stable = reader.sources.iter().all(|(p, b)| {
        ts_path_is_plain(root, Path::new(p), reader.dirs)
            && fs::read(root.join(p)).is_ok_and(|now| now == *b)
    });
    for config in configs.values_mut() {
        config.supported &= stable;
        config.dependencies = hashes.clone();
    }
    (configs, reader.needed, reader.witness)
}

pub(super) fn nearest<'a>(
    path: &str,
    configs: &'a BTreeMap<String, TsResolutionConfig>,
) -> Option<&'a TsResolutionConfig> {
    let mut dir = parent(path);
    loop {
        for name in ["tsconfig.json", "jsconfig.json"] {
            let p = if dir.is_empty() {
                name.to_owned()
            } else {
                format!("{dir}/{name}")
            };
            if let Some(config) = configs.get(&p) {
                return Some(config);
            }
        }
        if dir.is_empty() {
            return None;
        }
        dir = parent(dir);
    }
}
pub(super) fn mapped(
    path: &str,
    module: &str,
    configs: &BTreeMap<String, TsResolutionConfig>,
) -> Option<String> {
    if module.starts_with('.') || module.starts_with('/') || module.contains(['\\', '?', '#', ':'])
    {
        return None;
    }
    let config = nearest(path, configs)?;
    if !config.supported {
        return None;
    }
    let mut matches = Vec::new();
    for (key, target) in &config.aliases {
        if key == module {
            matches.push(target.clone());
        } else if let Some(prefix) = key.strip_suffix('*')
            && let Some(rest) = module.strip_prefix(prefix)
        {
            // No traversal/empty components in wildcard substitutions.
            if rest
                .split('/')
                .any(|c| c.is_empty() || c == "." || c == "..")
            {
                return None;
            }
            matches.push(format!("{}{rest}", target.strip_suffix('*')?));
        }
    }
    // Overlapping mappings are intentionally unsupported, not guessed by order.
    let [base] = matches.as_slice() else {
        return None;
    };
    let depth = parent(path).split('/').filter(|p| !p.is_empty()).count();
    Some(format!(
        "{}{}",
        if depth == 0 {
            "./".to_owned()
        } else {
            "../".repeat(depth)
        },
        base
    ))
}

// The injected reader keeps the final validation independently testable.
pub(super) fn validate_final(
    root: &Path,
    configs: &mut BTreeMap<String, TsResolutionConfig>,
    path_hashes: &BTreeMap<String, Hash32>,
    witness: &Witness,
    mut read: impl FnMut(&Path) -> std::io::Result<Vec<u8>>,
) -> bool {
    // Memoize observations, not verdicts: each config must still agree with
    // both its own expected hash and the inventory hash. Pass-local only.
    let paths: BTreeSet<_> = configs
        .values()
        .flat_map(|c| c.dependencies.keys())
        .collect();
    let observed: BTreeMap<_, _> = paths
        .into_iter()
        .map(|path| {
            let hash = read(&root.join(path))
                .ok()
                .map(|bytes| Hash32(*blake3::hash(&bytes).as_bytes()));
            (path.clone(), hash)
        })
        .collect();
    // Validate metadata/absence/membership AFTER the reads so a mutation during
    // the final read cannot escape a previously evaluated Witness.
    let coherent = witness.valid(root);
    let mut changed = false;
    if !coherent {
        configs.insert("tsconfig.json".to_owned(), TsResolutionConfig::default());
        changed = true;
    }
    for config in configs.values_mut() {
        if !coherent
            || config.dependencies.iter().any(|(path, expected)| {
                path_hashes.get(path) != Some(expected)
                    || observed.get(path) != Some(&Some(*expected))
            })
        {
            config.supported = false;
            changed = true;
        }
    }
    changed
}

#[cfg(test)]
pub(super) mod tests {
    use super::*;
    use std::cell::RefCell;
    use std::sync::atomic::{AtomicU64, Ordering};
    type Hook = Box<dyn FnOnce(&Path)>;
    thread_local! { static AFTER_COLLECT: RefCell<Option<Hook>> = const { RefCell::new(None) }; }
    pub fn after_collect(root: &Path) {
        let hook = AFTER_COLLECT.with(|h| h.borrow_mut().take());
        if let Some(hook) = hook {
            hook(root);
        }
    }
    static ID: AtomicU64 = AtomicU64::new(0);
    struct Temp(PathBuf);
    impl Drop for Temp {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    #[test]
    fn witness_reads_each_path_once_per_pass() {
        let (temp, _, _) = fixture();
        for _ in 0..2 {
            let mut witness = Witness::default();
            for _ in 0..10 {
                witness.watch(&temp.0, "src/sub/main.ts");
                witness.watch(&temp.0, "src/sub/tsconfig.json");
                witness.watch(&temp.0, "src/sub/jsconfig.json");
            }
            assert!(witness.valid(&temp.0));
            assert_eq!(witness.entries.len(), 6);
            assert_eq!(witness.metadata_reads, 6);
        }
    }

    #[test]
    fn witness_reuse_preserves_original_absence_and_parent_identity() {
        let (temp, _, _) = fixture();
        let mut witness = Witness::default();
        witness.watch(&temp.0, "src/sub/tsconfig.json");
        fs::write(temp.0.join("src/sub/tsconfig.json"), "{}").unwrap();
        witness.watch(&temp.0, "src/sub/tsconfig.json");
        assert!(!witness.valid(&temp.0));
        let mut next_pass = Witness::default();
        next_pass.watch(&temp.0, "src/sub/tsconfig.json");
        assert!(next_pass.valid(&temp.0));
        fs::rename(temp.0.join("src/sub"), temp.0.join("src/old")).unwrap();
        std::os::unix::fs::symlink("old", temp.0.join("src/sub")).unwrap();
        next_pass.watch(&temp.0, "src/sub/tsconfig.json");
        assert!(!next_pass.valid(&temp.0));
    }

    fn fixture() -> (
        Temp,
        BTreeMap<String, StoredTsFileFacts>,
        BTreeMap<String, Hash32>,
    ) {
        let temp = Temp(std::env::temp_dir().join(format!(
            "cgrx-config-race-{}-{}",
            std::process::id(),
            ID.fetch_add(1, Ordering::Relaxed)
        )));
        let mut files = BTreeMap::new();
        let mut hashes = BTreeMap::new();
        for (p, s) in [
            (
                "package.json",
                r#"{"workspaces":["packages/*"],"devDependencies":{"@repo/config":"workspace:*"}}"#,
            ),
            (
                "packages/config/package.json",
                r#"{"name":"@repo/config","exports":{"./base.json":"./base.json"}}"#,
            ),
            ("packages/config/base.json", "{}"),
            (
                "tsconfig.json",
                r#"{"extends":"@repo/config/base.json","compilerOptions":{"baseUrl":".","paths":{"@/*":["./*"]}}}"#,
            ),
            (
                "src/sub/main.ts",
                "import { target } from '@/worker'; function caller(){target();}",
            ),
            ("worker.ts", "export function target(){}"),
        ] {
            fs::create_dir_all(temp.0.join(p).parent().unwrap()).unwrap();
            fs::write(temp.0.join(p), s).unwrap();
            if p.ends_with(".ts") {
                let hash = Hash32(*blake3::hash(s.as_bytes()).as_bytes());
                hashes.insert(p.to_owned(), hash);
                files.insert(
                    p.to_owned(),
                    StoredTsFileFacts {
                        source_hash: hash,
                        facts: TsFileFacts::parse(p, s.as_bytes()),
                        inventory_only: false,
                    },
                );
            }
        }
        (temp, files, hashes)
    }
    #[test]
    fn absence_membership_and_bytes_races_invalidate_the_whole_pass() {
        for mutation in [0, 1, 2, 3] {
            let (temp, mut files, mut hashes) = fixture();
            let mut configs = BTreeMap::new();
            scan_ts_inventory(&temp.0, &mut hashes, &mut files, &mut configs).unwrap();
            assert!(ts_config_supported_for("src/sub/main.ts", &configs));
            AFTER_COLLECT.with(|hook| {
                *hook.borrow_mut() = Some(Box::new(move |root| match mutation {
                    0 => fs::write(
                        root.join("src/sub/tsconfig.json"),
                        r#"{"compilerOptions":{"moduleSuffixes":[".native"]}}"#,
                    )
                    .unwrap(),
                    1 => {
                        fs::create_dir_all(root.join("packages/duplicate")).unwrap();
                        fs::write(
                            root.join("packages/duplicate/package.json"),
                            r#"{"name":"@repo/config","exports":{"./base.json":"./base.json"}}"#,
                        )
                        .unwrap();
                    }
                    2 => fs::write(
                        root.join("packages/config/base.json"),
                        r#"{"compilerOptions":{"rootDirs":["other"]}}"#,
                    )
                    .unwrap(),
                    _ => fs::create_dir_all(root.join("node_modules/@repo/config")).unwrap(),
                }))
            });
            scan_ts_inventory(&temp.0, &mut hashes, &mut files, &mut configs).unwrap();
            assert!(
                !ts_config_supported_for("src/sub/main.ts", &configs),
                "mutation {mutation}"
            );
        }
    }
    #[test]
    fn legacy_boolean_decodes_only_as_blocker() {
        for source in ["true", "false"] {
            let config: TsResolutionConfig = serde_json::from_str(source).unwrap();
            assert!(!config.supported);
            assert!(config.aliases.is_empty());
        }
    }
    #[test]
    fn final_dependency_reader_is_once_per_path_and_per_pass() {
        let bytes = b"{}".to_vec();
        let hash = Hash32(*blake3::hash(&bytes).as_bytes());
        let hashes = BTreeMap::from([("a.json".to_owned(), hash), ("b.json".to_owned(), hash)]);
        let config = TsResolutionConfig {
            supported: true,
            aliases: BTreeMap::new(),
            dependencies: hashes.clone(),
        };
        let original = BTreeMap::from([
            ("tsconfig.json".to_owned(), config.clone()),
            ("sub/tsconfig.json".to_owned(), config),
        ]);
        let mut reads = BTreeMap::<PathBuf, usize>::new();
        for pass in 1..=2 {
            let mut configs = original.clone();
            assert!(!validate_final(
                Path::new("fixture"),
                &mut configs,
                &hashes,
                &Witness::default(),
                |p| {
                    *reads.entry(p.to_owned()).or_default() += 1;
                    Ok(bytes.clone())
                }
            ));
            assert!(configs.values().all(|c| c.supported));
            assert_eq!(
                reads.values().copied().collect::<Vec<_>>(),
                vec![pass, pass]
            );
        }
        let mut configs = original;
        assert!(validate_final(
            Path::new("fixture"),
            &mut configs,
            &hashes,
            &Witness::default(),
            |_| Ok(b"changed".to_vec())
        ));
        assert!(configs.values().all(|c| !c.supported));
    }

    #[test]
    fn committed_json_inventory_is_clean_and_edits_remain_visible() {
        let (temp, _, _) = fixture();
        let state = Temp(temp.0.with_extension("state"));
        fs::write(
            temp.0.join("src/sub/main.ts"),
            "import { value } from './surface-contract'; function caller(){value();}",
        )
        .unwrap();
        fs::write(temp.0.join("src/sub/surface-contract.json"), "{}").unwrap();
        for args in [
            vec!["init", "-q"],
            vec!["add", "."],
            vec![
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid",
                "commit",
                "-qm",
                "fixture",
            ],
        ] {
            assert!(
                Command::new("git")
                    .args(args)
                    .current_dir(&temp.0)
                    .status()
                    .unwrap()
                    .success()
            );
        }
        Runtime::index_committed_head(&temp.0, &state.0).unwrap();
        for _ in 0..2 {
            let mut runtime = Runtime::open(&state.0).unwrap();
            runtime.refresh(&temp.0).unwrap();
            assert_eq!(runtime.changed_paths(), Vec::<String>::new());
            runtime.refresh(&temp.0).unwrap();
            assert_eq!(runtime.changed_paths(), Vec::<String>::new());
        }
        let mut runtime = Runtime::open(&state.0).unwrap();
        fs::write(
            temp.0.join("packages/config/base.json"),
            r#"{"compilerOptions":{"strict":true}}"#,
        )
        .unwrap();
        runtime.refresh(&temp.0).unwrap();
        assert_eq!(runtime.changed_paths(), ["packages/config/base.json"]);
        fs::remove_file(temp.0.join("packages/config/base.json")).unwrap();
        runtime.refresh(&temp.0).unwrap();
        assert_eq!(runtime.changed_paths(), ["packages/config/base.json"]);
    }

    #[test]
    fn final_dependency_contradictions_errors_and_read_time_mutations_reject() {
        let bytes = b"{}".to_vec();
        let hash = Hash32(*blake3::hash(&bytes).as_bytes());
        let wrong = Hash32([99; 32]);
        let hashes = BTreeMap::from([("base.json".to_owned(), hash)]);
        let config = TsResolutionConfig {
            supported: true,
            aliases: BTreeMap::new(),
            dependencies: hashes.clone(),
        };
        let mut conflicting = config.clone();
        conflicting.dependencies.insert("base.json".into(), wrong);
        let mut configs = BTreeMap::from([
            ("tsconfig.json".to_owned(), config.clone()),
            ("sub/tsconfig.json".to_owned(), conflicting),
        ]);
        let mut reads = 0;
        assert!(validate_final(
            Path::new("fixture"),
            &mut configs,
            &hashes,
            &Witness::default(),
            |_| {
                reads += 1;
                Ok(bytes.clone())
            }
        ));
        assert_eq!(reads, 1);
        assert!(configs["tsconfig.json"].supported);
        assert!(!configs["sub/tsconfig.json"].supported);
        for fail_read in [false, true] {
            let mut configs = BTreeMap::from([("tsconfig.json".to_owned(), config.clone())]);
            let inventory = BTreeMap::from([("base.json".to_owned(), wrong)]);
            assert!(validate_final(
                Path::new("fixture"),
                &mut configs,
                if fail_read { &hashes } else { &inventory },
                &Witness::default(),
                |_| {
                    if fail_read {
                        Err(std::io::Error::from(std::io::ErrorKind::PermissionDenied))
                    } else {
                        Ok(bytes.clone())
                    }
                }
            ));
            assert!(!configs["tsconfig.json"].supported);
        }
        let (temp, _, _) = fixture();
        let mut witness = Witness::default();
        witness.watch(&temp.0, "src/sub/tsconfig.json");
        let mut configs = BTreeMap::from([("tsconfig.json".to_owned(), config)]);
        assert!(validate_final(
            &temp.0,
            &mut configs,
            &hashes,
            &witness,
            |_| {
                fs::write(temp.0.join("src/sub/tsconfig.json"), "{}").unwrap();
                Ok(bytes.clone())
            }
        ));
        assert!(configs.values().all(|c| !c.supported));
    }
}
