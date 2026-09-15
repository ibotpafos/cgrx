//! TypeScript resolution and inventory helper functions.
//!
//! These functions handle TS config parsing, module resolution,
//! inventory scanning, path validation, and source fingerprinting.

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::os::unix::fs::MetadataExt;
use std::path::{Path, PathBuf};

use cgrx_core::Hash32;
use cgrx_languages::ts_imports::TsFileFacts;
use serde_json::Value;

use super::ts_config::{self, TsResolutionConfig};
use super::{RuntimeError, SourceFingerprint, StoredIndex, StoredTsFileFacts};
use super::crosses_nested_git_boundary;

// ExtractedPath and ExtractedSource are defined in extraction.rs

pub(super) fn is_ts_resolution_config(path: &Path) -> bool {
    path.file_name()
        .and_then(|name| name.to_str())
        .is_some_and(|name| matches!(name, "tsconfig.json" | "jsconfig.json"))
}

pub(super) fn is_ts_inventory_path(path: &Path) -> bool {
    is_ts_resolution_config(path)
        || path.file_name().and_then(|name| name.to_str()) == Some("package.json")
        || matches!(
            path.extension().and_then(|extension| extension.to_str()),
            Some("js" | "jsx" | "json")
        )
}

pub(super) fn ts_resolution_config_supported(source: &[u8]) -> bool {
    let Ok(Value::Object(root)) = serde_json::from_slice(source) else {
        return false;
    };
    if root.contains_key("extends") || root.contains_key("references") {
        return false;
    }
    let Some(options) = root.get("compilerOptions") else {
        return true;
    };
    let Value::Object(options) = options else {
        return false;
    };
    const RESOLUTION_KEYS: &[&str] = &[
        "allowJs",
        "baseUrl",
        "customConditions",
        "moduleResolution",
        "moduleSuffixes",
        "paths",
        "resolveJsonModule",
        "rootDirs",
    ];
    !RESOLUTION_KEYS.iter().any(|key| options.contains_key(*key))
}

pub(super) fn ts_config_supported_for(path: &str, configs: &BTreeMap<String, TsResolutionConfig>) -> bool {
    ts_config::nearest(path, configs).is_none_or(|config| config.supported)
}

// Only immutable specifiers are deduplicated, within one source/pass. File,
// config and directory witnesses are still re-observed on every refresh.
pub(super) fn ts_module_specifiers(facts: &TsFileFacts) -> BTreeSet<&str> {
    facts
        .imports
        .iter()
        .map(|import| import.module.as_str())
        .chain(facts.exports.values().flatten().filter_map(|export| {
            if let cgrx_languages::ts_imports::Export::From { module, .. } = export {
                Some(module.as_str())
            } else {
                None
            }
        }))
        .collect()
}

pub(super) fn ts_config_modules(
    files: &BTreeMap<String, StoredTsFileFacts>,
    configs: &BTreeMap<String, TsResolutionConfig>,
) -> BTreeMap<(String, String), String> {
    let mut modules = BTreeMap::new();
    for (path, stored) in files {
        for module in ts_module_specifiers(&stored.facts) {
            if let Some(mapped) = ts_config::mapped(path, module, configs) {
                modules.insert((path.clone(), module.to_owned()), mapped);
            }
        }
    }
    modules
}

pub(super) fn ts_inventory_candidates(ts_files: &BTreeMap<String, StoredTsFileFacts>) -> BTreeSet<String> {
    let mut paths = BTreeSet::new();
    for (caller, stored) in ts_files.iter().filter(|(path, _)| {
        path.ends_with(".ts") && !path.ends_with(".d.ts") || path.ends_with(".tsx")
    }) {
        paths.insert(caller.clone());
        let mut directory: Vec<_> = caller.split('/').collect();
        directory.pop();
        let mut ancestor = directory.clone();
        loop {
            let prefix = ancestor.join("/");
            for name in ["tsconfig.json", "jsconfig.json"] {
                paths.insert(if prefix.is_empty() {
                    name.to_owned()
                } else {
                    format!("{prefix}/{name}")
                });
            }
            if ancestor.pop().is_none() {
                break;
            }
        }
        for module in ts_module_specifiers(&stored.facts) {
            paths.extend(cgrx_languages::ts_imports::module_candidates(
                caller, module,
            ));
        }
    }
    paths
}

pub(super) fn ts_paths_portable_for(
    dependencies: &[String],
    ts_files: &BTreeMap<String, StoredTsFileFacts>,
    configs: &BTreeMap<String, TsResolutionConfig>,
) -> bool {
    let dependency_files: BTreeMap<_, _> = dependencies
        .iter()
        .filter_map(|path| {
            ts_files
                .get(path)
                .map(|facts| (path.clone(), facts.clone()))
        })
        .collect();
    let mut expected = ts_inventory_candidates(&dependency_files);
    for ((from, _), mapped) in ts_config_modules(&dependency_files, configs) {
        expected.extend(cgrx_languages::ts_imports::module_candidates(
            &from, &mapped,
        ));
    }
    let mut folded = BTreeMap::<String, &str>::new();
    for path in &expected {
        let key = path.to_ascii_lowercase();
        if folded.insert(key, path).is_some_and(|prior| prior != path) {
            return false;
        }
    }
    ts_files.keys().all(|actual| {
        folded
            .get(&actual.to_ascii_lowercase())
            .is_none_or(|expected| *expected == actual)
    })
}

pub(super) fn store_ts_presence_blocker(
    relative: &str,
    marker: Hash32,
    path_hashes: &mut BTreeMap<String, Hash32>,
    ts_files: &mut BTreeMap<String, StoredTsFileFacts>,
    configs: &mut BTreeMap<String, TsResolutionConfig>,
) {
    if is_ts_resolution_config(Path::new(relative)) {
        configs.insert(relative.to_owned(), TsResolutionConfig::default());
    }
    ts_files.insert(
        relative.to_owned(),
        StoredTsFileFacts {
            source_hash: marker,
            facts: TsFileFacts::default(),
            inventory_only: true,
        },
    );
    path_hashes.insert(relative.to_owned(), marker);
}

pub(super) fn scan_ts_inventory(
    root: &Path,
    path_hashes: &mut BTreeMap<String, Hash32>,
    ts_files: &mut BTreeMap<String, StoredTsFileFacts>,
    configs: &mut BTreeMap<String, TsResolutionConfig>,
) -> Result<(bool, Vec<(String, Hash32)>), RuntimeError> {
    scan_ts_inventory_cached(root, path_hashes, ts_files, configs, &mut BTreeMap::new())
}

pub(super) fn scan_ts_inventory_cached(
    root: &Path,
    path_hashes: &mut BTreeMap<String, Hash32>,
    ts_files: &mut BTreeMap<String, StoredTsFileFacts>,
    configs: &mut BTreeMap<String, TsResolutionConfig>,
    verified_fingerprints: &mut BTreeMap<String, SourceFingerprint>,
) -> Result<(bool, Vec<(String, Hash32)>), RuntimeError> {
    let mut directory_cache = TsDirectoryCache::default();
    let mut candidates = ts_inventory_candidates(ts_files);
    let (collected_configs, config_paths, config_witness) =
        ts_config::collect(root, &candidates, &mut directory_cache);
    #[cfg(test)]
    ts_config::tests::after_collect(root);
    let mut changed = *configs != collected_configs;
    *configs = collected_configs;
    candidates.extend(config_paths.iter().cloned());
    for ((from, _), mapped) in ts_config_modules(ts_files, configs) {
        candidates.extend(cgrx_languages::ts_imports::module_candidates(
            &from, &mapped,
        ));
    }
    let mut invalid_sources = Vec::new();
    let mut nested_boundary_cache = BTreeMap::new();
    for relative in candidates {
        let absolute = root.join(&relative);
        let metadata = match fs::symlink_metadata(&absolute) {
            Ok(metadata) => metadata,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                verified_fingerprints.remove(&relative);
                if ts_files
                    .get(&relative)
                    .is_some_and(|stored| !stored.inventory_only)
                {
                    invalid_sources.push((
                        relative,
                        Hash32(*blake3::hash(b"CGRX_TS_MISSING_SOURCE").as_bytes()),
                    ));
                    continue;
                }
                if ts_files
                    .get(&relative)
                    .is_some_and(|stored| stored.inventory_only)
                {
                    ts_files.remove(&relative);
                    path_hashes.remove(&relative);
                    configs.remove(&relative);
                    changed = true;
                }
                continue;
            }
            Err(_) => {
                verified_fingerprints.remove(&relative);
                let marker = Hash32(*blake3::hash(b"CGRX_TS_UNREADABLE_SOURCE").as_bytes());
                if ts_files
                    .get(&relative)
                    .is_some_and(|stored| !stored.inventory_only)
                {
                    invalid_sources.push((relative, marker));
                } else {
                    store_ts_presence_blocker(&relative, marker, path_hashes, ts_files, configs);
                    changed = true;
                }
                continue;
            }
        };
        let plain = ts_path_is_plain(root, Path::new(&relative), &mut directory_cache);
        if ts_files
            .get(&relative)
            .is_some_and(|stored| !stored.inventory_only)
        {
            if !plain || !metadata.is_file() {
                verified_fingerprints.remove(&relative);
                invalid_sources.push((
                    relative,
                    Hash32(*blake3::hash(b"CGRX_TS_UNSUPPORTED_PATH_KIND").as_bytes()),
                ));
                continue;
            }
            let fingerprint = source_fingerprint(&metadata);
            // Reuse a content proof only after path-kind validation and only while
            // the device, inode, size, mtime and ctime identity is unchanged.
            if verified_fingerprints.get(&relative) == Some(&fingerprint) {
                continue;
            }
            let Ok(source) = fs::read(&absolute) else {
                verified_fingerprints.remove(&relative);
                invalid_sources.push((
                    relative,
                    Hash32(*blake3::hash(b"CGRX_TS_UNREADABLE_SOURCE").as_bytes()),
                ));
                continue;
            };
            let hash = Hash32(*blake3::hash(&source).as_bytes());
            if ts_files.get(&relative).map(|stored| stored.source_hash) != Some(hash) {
                verified_fingerprints.remove(&relative);
                invalid_sources.push((relative, hash));
            } else {
                verified_fingerprints.insert(relative, fingerprint);
            }
            continue;
        }
        verified_fingerprints.remove(&relative);
        let nested =
            crosses_nested_git_boundary(root, Path::new(&relative), &mut nested_boundary_cache);
        let source = if !plain || metadata.file_type().is_symlink() || !metadata.is_file() || nested
        {
            b"CGRX_TS_UNSUPPORTED_PATH_KIND".to_vec()
        } else {
            fs::read(&absolute).unwrap_or_else(|_| b"CGRX_TS_UNREADABLE_SOURCE".to_vec())
        };
        // Files discovered only through the filesystem (including ignored and
        // post-status races) are presence blockers, never traversable proof.
        let facts = TsFileFacts::default();
        let hash = Hash32(*blake3::hash(&source).as_bytes());
        let current = ts_files.get(&relative);
        if current.map(|stored| stored.source_hash) != Some(hash) {
            let inventory_only = current.is_none_or(|stored| stored.inventory_only);
            ts_files.insert(
                relative.clone(),
                StoredTsFileFacts {
                    source_hash: hash,
                    facts,
                    inventory_only,
                },
            );
            path_hashes.insert(relative.clone(), hash);
            changed = true;
        }
    }
    // Configs read during discovery must still equal the bytes inventoried in
    // this pass; a race invalidates proof rather than retargeting stale candidates.
    changed |=
        ts_config::validate_final(root, configs, path_hashes, &config_witness, |p| fs::read(p));
    Ok((changed, invalid_sources))
}

// Pass-local only: do not retain filesystem absence/presence across refreshes.
#[derive(Default)]
pub(super) struct TsDirectoryCache {
    entries: BTreeMap<PathBuf, (SourceFingerprint, BTreeSet<std::ffi::OsString>)>,
}

impl TsDirectoryCache {
    fn contains_exact(&mut self, directory: &Path, name: &std::ffi::OsStr) -> bool {
        let Ok(metadata) = fs::symlink_metadata(directory) else {
            self.entries.remove(directory);
            return false;
        };
        if !metadata.is_dir() || metadata.file_type().is_symlink() {
            self.entries.remove(directory);
            return false;
        }
        let fingerprint = source_fingerprint(&metadata);
        if let Some((cached, names)) = self.entries.get(directory)
            && *cached == fingerprint
        {
            return names.contains(name);
        }
        self.entries.remove(directory);
        let Ok(entries) = fs::read_dir(directory) else {
            return false;
        };
        let names: std::io::Result<BTreeSet<_>> = entries
            .map(|entry| entry.map(|entry| entry.file_name()))
            .collect();
        let Ok(names) = names else {
            return false;
        };
        // An enumeration racing with a directory update cannot prove identity.
        if !fs::symlink_metadata(directory)
            .is_ok_and(|after| source_fingerprint(&after) == fingerprint)
        {
            return false;
        }
        let exact = names.contains(name);
        self.entries
            .insert(directory.to_path_buf(), (fingerprint, names));
        exact
    }
}

pub(super) fn ts_path_is_plain(root: &Path, relative: &Path, cache: &mut TsDirectoryCache) -> bool {
    let mut current = root.to_path_buf();
    for component in relative.components() {
        let std::path::Component::Normal(name) = component else {
            return false;
        };
        if !cache.contains_exact(&current, name) {
            return false;
        }
        current.push(name);
        let Ok(metadata) = fs::symlink_metadata(&current) else {
            return false;
        };
        if metadata.file_type().is_symlink() {
            return false;
        }
    }
    true
}

pub(super) fn remove_path(stored: &mut StoredIndex, path: &str) {
    stored.path_hashes.remove(path);
    stored.rust_files.remove(path);
    stored.ts_files.remove(path);
    stored.ts_resolution_configs.remove(path);
    stored.coverage.stale_paths.retain(|stale| stale != path);
    if Path::new(path)
        .file_name()
        .is_some_and(|name| name == "Cargo.toml")
    {
        let dir = Path::new(path)
            .parent()
            .unwrap_or(Path::new(""))
            .to_string_lossy();
        stored.cargo_manifests.remove(dir.as_ref());
    }
    stored.documents.retain(|document| document.path != path);
    stored
        .coverage
        .parser_error_ranges
        .retain(|range| range.path != path);
    let prefix = format!("{path}:");
    stored
        .coverage
        .dynamic_dispatch
        .retain(|location| !location.starts_with(&prefix));
}

pub(super) fn source_fingerprint(metadata: &fs::Metadata) -> SourceFingerprint {
    SourceFingerprint {
        device: metadata.dev(),
        inode: metadata.ino(),
        length: metadata.size(),
        modified_seconds: metadata.mtime(),
        modified_nanoseconds: metadata.mtime_nsec(),
        changed_seconds: metadata.ctime(),
        changed_nanoseconds: metadata.ctime_nsec(),
    }
}
