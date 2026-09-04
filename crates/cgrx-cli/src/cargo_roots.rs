//! Conservative same-package Cargo target ownership. No cargo subprocesses.
use cgrx_languages::RustFileFacts;
use std::collections::{BTreeMap, BTreeSet};
use std::path::{Component, Path};

#[derive(Clone)]
struct Package {
    unsupported_modules: bool,
    library: Option<(String, String)>,
    dependencies: BTreeSet<String>,
    modules: BTreeMap<(String, String), BTreeSet<String>>,
}

pub(crate) struct CargoRoots<'a> {
    files: &'a BTreeMap<String, RustFileFacts>,
    packages: Vec<Package>,
    owners: BTreeMap<String, Vec<(usize, String)>>,
}

fn relative_join(dir: &str, path: &str) -> Option<String> {
    if path.is_empty()
        || Path::new(path)
            .components()
            .any(|p| !matches!(p, Component::Normal(_)))
    {
        return None;
    }
    Some(Path::new(dir).join(path).to_str()?.to_owned())
}

fn boundary<'a>(path: &str, manifests: &'a BTreeMap<String, String>) -> Option<&'a str> {
    manifests
        .keys()
        .map(String::as_str)
        .filter(|dir| dir.is_empty() || Path::new(path).starts_with(dir))
        .max_by_key(|dir| dir.len())
}

fn dependency_names(value: &toml::Value, names: &mut BTreeSet<String>) {
    if let Some(table) = value.as_table() {
        for (key, value) in table {
            if matches!(
                key.as_str(),
                "dependencies" | "dev-dependencies" | "build-dependencies"
            ) {
                if let Some(deps) = value.as_table() {
                    names.extend(deps.keys().map(|s| s.replace('-', "_")));
                }
            } else if value.is_table() {
                dependency_names(value, names);
            }
        }
    }
}

impl<'a> CargoRoots<'a> {
    pub(crate) fn new(
        manifests: &BTreeMap<String, String>,
        files: &'a BTreeMap<String, RustFileFacts>,
    ) -> Self {
        let mut this = Self {
            files,
            packages: Vec::new(),
            owners: BTreeMap::new(),
        };
        for (dir, source) in manifests {
            let Ok(value) = source.parse::<toml::Value>() else {
                continue;
            };
            let Some(package) = value.get("package") else {
                continue;
            };
            let Some(name) = package.get("name").and_then(toml::Value::as_str) else {
                continue;
            };
            let edition = package
                .get("edition")
                .and_then(toml::Value::as_str)
                .or_else(|| {
                    if package
                        .get("edition")
                        .and_then(|v| v.get("workspace"))
                        .and_then(toml::Value::as_bool)
                        != Some(true)
                    {
                        return None;
                    }
                    // Inherited edition needs a parsed ancestor workspace. Resolve
                    // below separately; unknown editions reject named-library calls.
                    Some("workspace")
                })
                .unwrap_or("2015");
            let edition_supported = matches!(edition, "2018" | "2021" | "2024")
                || edition == "workspace"
                    && manifests.iter().any(|(parent, text)| {
                        (parent.is_empty() || Path::new(dir).starts_with(parent))
                            && text
                                .parse::<toml::Value>()
                                .ok()
                                .and_then(|v| {
                                    v.get("workspace")?
                                        .get("package")?
                                        .get("edition")?
                                        .as_str()
                                        .map(str::to_owned)
                                })
                                .is_some_and(|e| matches!(e.as_str(), "2018" | "2021" | "2024"))
                    });
            if [
                "autolib",
                "autobins",
                "autotests",
                "autobenches",
                "autoexamples",
            ]
            .iter()
            .any(|key| package.get(key).is_some_and(|v| !v.is_bool()))
            {
                continue;
            }
            let lib = value.get("lib");
            if lib.is_some_and(|v| {
                !v.is_table()
                    || ["name", "path"]
                        .iter()
                        .any(|key| v.get(key).is_some_and(|v| !v.is_str()))
            }) {
                continue;
            }
            let library = if package.get("autolib").and_then(toml::Value::as_bool) == Some(false)
                && lib.is_none()
            {
                None
            } else {
                let name = lib
                    .and_then(|v| v.get("name"))
                    .and_then(toml::Value::as_str)
                    .unwrap_or(name)
                    .replace('-', "_");
                let path = lib
                    .and_then(|v| v.get("path"))
                    .and_then(toml::Value::as_str)
                    .unwrap_or("src/lib.rs");
                relative_join(dir, path)
                    .filter(|p| files.contains_key(p))
                    .map(|path| (name, path))
            };
            let mut roots: Vec<String> = library.iter().map(|(_, path)| path.clone()).collect();
            let mut invalid_targets = false;
            for (kind, directory) in [
                ("bin", "src/bin"),
                ("test", "tests"),
                ("bench", "benches"),
                ("example", "examples"),
            ] {
                if let Some(targets) = value.get(kind) {
                    let Some(targets) = targets.as_array() else {
                        invalid_targets = true;
                        break;
                    };
                    for target in targets {
                        if !target.is_table()
                            || ["name", "path"]
                                .iter()
                                .any(|key| target.get(key).is_some_and(|v| !v.is_str()))
                        {
                            invalid_targets = true;
                            break;
                        }
                        if let Some(path) = target
                            .get("path")
                            .and_then(toml::Value::as_str)
                            .and_then(|p| relative_join(dir, p))
                        {
                            if files.contains_key(&path) {
                                roots.push(path);
                            }
                        } else if let Some(name) = target.get("name").and_then(toml::Value::as_str)
                        {
                            if kind == "bin"
                                && let Some(main) = relative_join(dir, "src/main.rs")
                                    .filter(|p| files.contains_key(p))
                            {
                                roots.push(main);
                            }
                            for candidate in [
                                format!("{directory}/{name}.rs"),
                                format!("{directory}/{name}/main.rs"),
                            ] {
                                if let Some(path) =
                                    relative_join(dir, &candidate).filter(|p| files.contains_key(p))
                                {
                                    roots.push(path);
                                }
                            }
                        }
                    }
                }
                let auto = match kind {
                    "bin" => "autobins",
                    "test" => "autotests",
                    "bench" => "autobenches",
                    _ => "autoexamples",
                };
                if package.get(auto).and_then(toml::Value::as_bool) != Some(false) {
                    let Some(base) = relative_join(dir, directory) else {
                        continue;
                    };
                    for path in files.keys() {
                        let Ok(rest) = Path::new(path).strip_prefix(&base) else {
                            continue;
                        };
                        let count = rest.components().count();
                        if count == 1
                            || count == 2 && rest.file_name().is_some_and(|n| n == "main.rs")
                        {
                            roots.push(path.clone());
                        }
                    }
                    if kind == "bin"
                        && let Some(main) =
                            relative_join(dir, "src/main.rs").filter(|p| files.contains_key(p))
                    {
                        roots.push(main);
                    }
                }
            }
            if invalid_targets {
                continue;
            }
            roots.sort();
            roots.dedup();
            let mut dependencies = BTreeSet::new();
            dependency_names(&value, &mut dependencies);
            // Edition 2015 has no automatic external-library prelude.
            if !edition_supported && let Some((name, _)) = &library {
                dependencies.insert(name.clone());
            }
            let index = this.packages.len();
            let mut unsupported_modules = false;
            let mut modules = BTreeMap::<(String, String), BTreeSet<String>>::new();
            for root in &roots {
                let mut pending = vec![(root.clone(), true, 0usize, Vec::<String>::new())];
                let mut seen = BTreeSet::new();
                while let Some((file, is_root, depth, module_path)) = pending.pop() {
                    if depth > 64 || seen.len() > 10000 {
                        unsupported_modules = true;
                        continue;
                    }
                    if !seen.insert(file.clone())
                        || boundary(&file, manifests) != Some(dir.as_str())
                    {
                        continue;
                    }
                    let Some(facts) = files.get(&file).filter(|f| !f.blocked) else {
                        continue;
                    };
                    unsupported_modules |= facts.unsupported_modules;
                    this.owners
                        .entry(file.clone())
                        .or_default()
                        .push((index, root.clone()));
                    modules
                        .entry((root.clone(), module_path.join("::")))
                        .or_default()
                        .insert(file.clone());
                    let path = Path::new(&file);
                    let parent = path.parent().unwrap_or(Path::new(""));
                    let module_dir = if is_root || path.file_name().is_some_and(|n| n == "mod.rs") {
                        parent.to_path_buf()
                    } else {
                        parent.join(path.file_stem().unwrap_or_default())
                    };
                    for module in &facts.modules {
                        let base = module_dir.join(module);
                        let candidates = [base.with_extension("rs"), base.join("mod.rs")];
                        let live: Vec<_> = candidates
                            .iter()
                            .filter_map(|p| p.to_str())
                            .filter(|p| files.contains_key(*p))
                            .collect();
                        if let [child] = live.as_slice() {
                            let mut child_path = module_path.clone();
                            child_path.push(module.clone());
                            pending.push(((*child).to_owned(), false, depth + 1, child_path));
                        }
                    }
                }
            }
            this.packages.push(Package {
                unsupported_modules,
                library,
                dependencies,
                modules,
            });
        }
        this
    }

    pub(crate) fn target(
        &self,
        path: &str,
        start: usize,
        end: usize,
        qualified: &str,
    ) -> Option<(&str, usize, usize)> {
        let facts = self.files.get(path).filter(|f| !f.blocked)?;
        if !facts.calls.contains(&(start, end)) {
            return None;
        }
        let (qualifier, name) = qualified.rsplit_once("::")?;
        if qualifier.is_empty() || name.contains("::") {
            return None;
        }
        let [owner] = self.owners.get(path)?.as_slice() else {
            return None;
        };
        let package = &self.packages[owner.0];
        if package.unsupported_modules {
            return None;
        }
        // Expand only source-file aliases with a unique explicit import. The
        // existing call-span, Cargo ownership and visibility guards still apply.
        let expanded = facts
            .module_aliases
            .iter()
            .find(|(alias, _)| alias == qualifier)
            .map(|(_, module)| format!("crate::{module}"));
        let qualifier = expanded.as_deref().unwrap_or(qualifier);
        let (target, requires_public) = if qualifier == "crate" {
            (owner.1.as_str(), false)
        } else if let Some((_, lib_path)) =
            package.library.as_ref().filter(|(lib_name, lib_path)| {
                qualifier == lib_name.as_str()
                    && &owner.1 != lib_path
                    && !package.dependencies.contains(qualifier)
                    && !facts.blocked_names.iter().any(|n| n == qualifier)
            })
        {
            (lib_path.as_str(), true)
        } else if let Some(module) = qualifier.strip_prefix("crate::").or_else(|| {
            (path == owner.1 && !matches!(qualifier, "self" | "super")).then_some(qualifier)
        }) {
            let paths = package.modules.get(&(owner.1.clone(), module.to_owned()))?;
            let mut targets = paths.iter();
            let target = targets.next()?;
            if targets.next().is_some() {
                return None;
            }
            // Crossing from a crate root into a child module requires target
            // visibility proof. The compact facts currently prove only plain
            // `pub`; restricted visibility remains an explicit gap.
            (target.as_str(), true)
        } else {
            return None;
        };
        // Both target and source must belong to this exact package/root.
        let target_facts = self.files.get(target).filter(|f| !f.blocked)?;
        if !self
            .owners
            .get(target)?
            .iter()
            .any(|(i, root)| *i == owner.0 && (root == target || root == &owner.1))
        {
            return None;
        }
        let mut matches = target_facts
            .functions
            .iter()
            .filter(|(n, _, _, public)| n == name && (!requires_public || *public));
        let (_, start, end, _) = matches.next()?;
        if matches.next().is_some() {
            return None;
        }
        Some((target, *start, *end))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn exhausted_module_budget_never_certifies_partial_ownership() {
        let manifests = BTreeMap::from([(
            String::new(),
            "[package]\nname=\"sample\"\nversion=\"0.1.0\"\nedition=\"2021\"".to_owned(),
        )]);
        let mut files = BTreeMap::from([(
            "src/lib.rs".to_owned(),
            RustFileFacts {
                modules: vec!["deep".into()],
                functions: vec![("target".into(), 3, 9, true)],
                calls: vec![(20, 30)],
                ..Default::default()
            },
        )]);
        let mut dir = "src".to_owned();
        for _ in 0..66 {
            files.insert(
                format!("{dir}/deep.rs"),
                RustFileFacts {
                    modules: vec!["deep".into()],
                    ..Default::default()
                },
            );
            dir.push_str("/deep");
        }
        assert!(
            CargoRoots::new(&manifests, &files)
                .target("src/lib.rs", 20, 30, "crate::target")
                .is_none()
        );
    }

    #[test]
    fn resolves_a_direct_child_module_function_from_the_crate_root() {
        let manifests = BTreeMap::from([(
            String::new(),
            "[package]\nname=\"sample\"\nversion=\"0.1.0\"\nedition=\"2024\"".to_owned(),
        )]);
        let files = BTreeMap::from([
            (
                "src/lib.rs".to_owned(),
                RustFileFacts {
                    modules: vec!["worker".into()],
                    calls: vec![(20, 36)],
                    ..Default::default()
                },
            ),
            (
                "src/worker.rs".to_owned(),
                RustFileFacts {
                    functions: vec![("target".into(), 7, 13, true)],
                    ..Default::default()
                },
            ),
        ]);
        let roots = CargoRoots::new(&manifests, &files);
        assert_eq!(
            roots.target("src/lib.rs", 20, 36, "worker::target"),
            Some(("src/worker.rs", 7, 13))
        );

        let mut private_files = files;
        private_files.get_mut("src/worker.rs").unwrap().functions[0].3 = false;
        assert_eq!(
            CargoRoots::new(&manifests, &private_files).target(
                "src/lib.rs",
                20,
                36,
                "worker::target"
            ),
            None
        );
    }

    #[test]
    fn isolates_equal_module_paths_between_library_and_binary_roots() {
        let manifests = BTreeMap::from([(
            String::new(),
            "[package]\nname=\"sample\"\nversion=\"0.1.0\"\nedition=\"2024\"".to_owned(),
        )]);
        let root = |call| RustFileFacts {
            modules: vec!["worker".into()],
            calls: vec![call],
            ..Default::default()
        };
        let target = |start, end| RustFileFacts {
            functions: vec![("target".into(), start, end, true)],
            ..Default::default()
        };
        let files = BTreeMap::from([
            ("src/lib.rs".to_owned(), root((20, 36))),
            ("src/worker.rs".to_owned(), target(7, 13)),
            ("src/bin/tool.rs".to_owned(), root((40, 56))),
            ("src/bin/worker.rs".to_owned(), target(17, 23)),
        ]);
        let roots = CargoRoots::new(&manifests, &files);
        assert_eq!(
            roots.target("src/lib.rs", 20, 36, "worker::target"),
            Some(("src/worker.rs", 7, 13))
        );
        assert_eq!(
            roots.target("src/bin/tool.rs", 40, 56, "worker::target"),
            Some(("src/bin/worker.rs", 17, 23))
        );
    }
}
