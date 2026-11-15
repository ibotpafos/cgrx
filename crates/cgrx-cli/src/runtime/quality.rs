//! Snapshot-bound, bounded quality candidate inventory. Never edits source files.
use super::{
    Runtime, RuntimeError, StoredDocument, coverage_for_scope, coverage_gap_count,
    definitive_stored_arcs,
};
use cgrx_core::{Hash32, Scope};
use serde_json::{Value, json};
use std::{
    collections::{BTreeMap, BTreeSet, VecDeque},
    fs,
    path::Path,
};
mod continuous;
mod project_checks;
mod verification;
pub use continuous::QualityWorker;
const VERSION: &str = "quality-index-v3";
fn error(code: &'static str, message: &str) -> RuntimeError {
    RuntimeError::new(code, message)
}
fn all() -> Scope {
    Scope {
        include: vec![],
        exclude: vec![],
        relation_kinds: vec![],
        max_depth: 2,
    }
}
fn hash(bytes: &[u8]) -> String {
    blake3::hash(bytes).to_hex().to_string()
}
fn symbol(d: &StoredDocument) -> Value {
    json!({"node_id":d.node_id,"path":d.path,"symbol":d.qualified_name,"span":{"start":d.span_start,"end":d.span_end}})
}
fn read_source(root: &Path, path: &str) -> Result<String, RuntimeError> {
    let canonical = root
        .join(path)
        .canonicalize()
        .map_err(|_| error("cgrx.quality_source_unavailable", "source unavailable"))?;
    let canonical_root = root
        .canonicalize()
        .map_err(|_| error("cgrx.quality_source_unavailable", "repository unavailable"))?;
    if !canonical.starts_with(&canonical_root) || !canonical.is_file() {
        return Err(error(
            "cgrx.quality_unsafe_path",
            "source escapes repository",
        ));
    }
    let size = fs::metadata(&canonical)
        .map_err(|_| error("cgrx.quality_source_unavailable", "metadata unavailable"))?
        .len();
    if size > 262144 {
        return Err(error(
            "cgrx.quality_budget_exceeded",
            "file exceeds 256 KiB",
        ));
    }
    fs::read_to_string(canonical).map_err(|_| {
        error(
            "cgrx.quality_source_unavailable",
            "UTF-8 source unavailable",
        )
    })
}
impl Runtime {
    fn quality_index(&self, root: &Path) -> Result<Value, RuntimeError> {
        let _index_guard = self.quality_file_lock("quality-index.lock")?;
        self.quality_check_cancel()?;
        let snapshot = json!(self.snapshot());
        let key = format!("{VERSION}:{}", hash(snapshot.to_string().as_bytes()));
        // Reuse the runtime's snapshot-keyed cache; persist only IDs, spans and evidence, never literals.
        if let Some(value) = self.architecture_cache.read().unwrap().get(&key) {
            return Ok(value.clone());
        }
        let cache_path = self.state_root.join("quality-candidates-v1.json");
        if let Ok(bytes) = fs::read(&cache_path)
            && bytes.len() <= 16 * 1024 * 1024
            && let Ok(value) = serde_json::from_slice::<Value>(&bytes)
            && value["version"] == VERSION
            && value["snapshot"] == snapshot
            && value["candidates"].as_array().is_some_and(|cs| {
                cs.iter().all(|c| {
                    c["id"].is_string()
                        && c["finding_id"].is_string()
                        && c["content_fingerprint"].is_string()
                        && c["evidence"].is_object()
                        && matches!(
                            c["kind"].as_str(),
                            Some("hardcode" | "duplicate" | "dead_code")
                        )
                })
            })
        {
            self.architecture_cache
                .write()
                .unwrap()
                .insert(key, value.clone());
            return Ok(value);
        }
        let mut scope = all();
        scope.relation_kinds = self
            .stored
            .arcs
            .iter()
            .map(|a| a.kind)
            .collect::<BTreeSet<_>>()
            .into_iter()
            .collect();
        let arcs = definitive_stored_arcs(&self.stored, &scope);
        let mut incoming = BTreeMap::<u64, Vec<u64>>::new();
        for arc in &arcs {
            // References/imports (when available) also suppress false dead-code reports.
            if format!("{:?}", arc.kind) != "Contains" && arc.source != arc.target {
                incoming.entry(arc.target).or_default().push(arc.source);
            }
        }
        let docs = self
            .stored
            .documents
            .iter()
            .filter(|d| d.provenance == "SYNTAX")
            .map(|d| (d.node_id, d))
            .collect::<BTreeMap<_, _>>();
        let gaps = coverage_gap_count(&coverage_for_scope(&self.stored.coverage, &scope));
        let memo_path = self.state_root.join("quality-file-facts-v2.json");
        let old_memo = fs::read(&memo_path)
            .ok()
            .filter(|b| b.len() <= 16 * 1024 * 1024)
            .and_then(|b| serde_json::from_slice::<Value>(&b).ok())
            .unwrap_or(json!({}));
        let mut memo = json!({});
        let mut parsed_files = 0usize;
        let mut reused_files = 0usize;
        let mut candidates = vec![];
        let mut partial = false;
        let mut scan_gaps = vec![];
        let mut dropped_candidates = 0usize;
        let mut kind_counts = BTreeMap::<String, usize>::new();
        let mut add = |kind: &str, identity: String, evidence: Value, ids: Vec<u64>, score: u16| {
            let count = kind_counts.entry(kind.to_owned()).or_default();
            if *count >= 300 {
                dropped_candidates += 1;
                return;
            }
            *count += 1;
            let id = format!(
                "quality1.{}",
                &hash(format!("{key}:{kind}:{identity}").as_bytes())[..32]
            );
            let mut visited = ids.iter().copied().collect::<BTreeSet<_>>();
            let mut queue = ids.iter().map(|id| (*id, 0)).collect::<VecDeque<_>>();
            let mut impacted = vec![];
            let mut impact_partial = false;
            while let Some((node, depth)) = queue.pop_front() {
                if depth == 2 {
                    if incoming.get(&node).is_some_and(|v| !v.is_empty()) {
                        impact_partial = true;
                    }
                    continue;
                }
                for parent in incoming.get(&node).into_iter().flatten() {
                    if visited.contains(parent) {
                        continue;
                    }
                    if impacted.len() == 50 {
                        impact_partial = true;
                        break;
                    }
                    visited.insert(*parent);
                    queue.push_back((*parent, depth + 1));
                    if let Some(doc) = docs.get(parent) {
                        impacted.push(symbol(doc));
                    }
                }
            }
            let stable = if kind == "hardcode" {
                json!([
                    kind,
                    evidence["path"],
                    evidence["symbol"]["symbol"],
                    evidence["binding"],
                    evidence["rule"],
                    evidence["occurrence"]
                ])
            } else if kind == "dead_code" {
                json!([
                    kind,
                    evidence["symbol"]["path"],
                    evidence["symbol"]["symbol"]
                ])
            } else {
                json!([
                    kind,
                    evidence["left"]["path"],
                    evidence["left"]["symbol"],
                    evidence["right"]["path"],
                    evidence["right"]["symbol"]
                ])
            };
            let finding_id = format!("finding1.{}", &hash(stable.to_string().as_bytes())[..32]);
            let content_fingerprint = hash(
                if kind == "hardcode" {
                    evidence["signature"].to_string()
                } else if kind == "dead_code" {
                    ids.iter()
                        .filter_map(|id| docs.get(id))
                        .map(|d| d.search_text.clone())
                        .collect::<Vec<_>>()
                        .join("\n")
                } else {
                    ids.iter()
                        .filter_map(|id| docs.get(id))
                        .map(|d| d.search_text.clone())
                        .collect::<Vec<_>>()
                        .join("\n")
                }
                .as_bytes(),
            );
            candidates.push(json!({"id":id,"finding_id":finding_id,"content_fingerprint":content_fingerprint,"kind":kind,"score":score,"confidence":"review_required","evidence":evidence,"context":{"incoming_uses":ids.iter().map(|id|incoming.get(id).map_or(0,Vec::len)).sum::<usize>(),"impact_depth":2,"impacted_symbols":impacted,"impact_truncated":impact_partial,"coverage_gap_count":gaps,"absence_is_not_proof":true}}));
        };
        let duplicates = self.suggest_refactors(&scope, None, 760, 50, 2000, 20000)?;
        partial |= duplicates["partial"].as_bool().unwrap_or(true);
        for c in duplicates["candidates"].as_array().into_iter().flatten() {
            let ids = [&c["left"], &c["right"]]
                .iter()
                .filter_map(|n| n["node_id"].as_u64())
                .collect::<Vec<_>>();
            add(
                "duplicate",
                c["projection"]["id"].to_string(),
                json!({"left":c["left"],"right":c["right"],"similarity":c["similarity"],"strategies":c["strategies"]}),
                ids,
                c["similarity"]["total"].as_u64().unwrap_or(760) as u16,
            );
        }
        let mut inspected_documents = 0;
        let mut prefix_cache = BTreeMap::<String, String>::new();
        let mut prefix_bytes = 0usize;
        let mut dead_pool = BTreeSet::new();
        for doc in docs.values().take(2000) {
            self.quality_check_cancel()?;
            inspected_documents += 1;
            let source = &doc.search_text;
            let name = doc.qualified_name.rsplit([':', '.']).next().unwrap_or("");
            let callable =
                source.contains("fn ") || source.contains("def ") || source.contains("function ");
            let visibility_key = doc.node_id.to_string();
            let cached_visibility = &old_memo[&doc.path]["visibility"][&visibility_key];
            let externally_visible = if old_memo[&doc.path]["hash"]
                == json!(self.stored.path_hashes.get(&doc.path))
                && cached_visibility.is_boolean()
            {
                cached_visibility.as_bool().unwrap()
            } else {
                if !prefix_cache.contains_key(&doc.path) {
                    if prefix_cache.len() >= 500 || prefix_bytes >= 8 * 1024 * 1024 {
                        partial = true;
                        scan_gaps.push(json!({"code":"VISIBILITY_BUDGET","path":doc.path}));
                        continue;
                    }
                    match read_source(root, &doc.path) {
                        Ok(text) => {
                            prefix_bytes += text.len();
                            prefix_cache.insert(doc.path.clone(), text);
                        }
                        Err(_) => {
                            partial = true;
                            scan_gaps.push(json!({"code":"VISIBILITY_UNKNOWN","path":doc.path}));
                            continue;
                        }
                    }
                }
                let prefix = prefix_cache[&doc.path]
                    .get(..doc.span_start)
                    .and_then(|s| s.rsplit('\n').next())
                    .unwrap_or("");
                let file_source = &prefix_cache[&doc.path];
                let callable_language = super::pack_for_path(Path::new(&doc.path))
                    .map(|p| p.id())
                    .unwrap_or("");
                let nearby_attributes = file_source
                    .get(..doc.body_start)
                    .map(|s| s.lines().rev().take(3).collect::<Vec<_>>().join("\n"))
                    .unwrap_or_default();
                let public_python = callable_language == "python" && !name.starts_with('_');
                let public_go = callable_language == "go"
                    && name.chars().next().is_some_and(char::is_uppercase);

                public_python
                    || public_go
                    || nearby_attributes.contains("#[")
                    || nearby_attributes.contains('@')
                    || file_source.contains("export {")
                    || file_source.contains("module.exports")
                    || source.contains("public ")
                    || source.contains("protected ")
                    || prefix.contains("export ")
                    || prefix.contains("pub ")
                    || prefix.contains("pub(")
                    || source.contains("pub ")
                    || source.contains("pub(")
                    || source.contains("export ")
                    || source.contains('@')
                    || source.contains("#[")
                    || source.contains("extern ")
            };
            memo[&doc.path]["hash"] = json!(self.stored.path_hashes.get(&doc.path));
            memo[&doc.path]["visibility"][&visibility_key] = json!(externally_visible);
            let entry = matches!(name, "main" | "__init__" | "__new__" | "setUp" | "tearDown")
                || name.starts_with("test")
                || name.starts_with("__")
                || doc
                    .path
                    .split('/')
                    .any(|p| matches!(p, "tests" | "fixtures" | "examples"));
            if callable && !externally_visible && !entry {
                dead_pool.insert(doc.node_id);
            }
        }
        // Root every non-private/unknown node, including callers outside syntax documents.
        // Follow ALL proven non-containment uses: callback references must retain targets.
        let mut outgoing = BTreeMap::<u64, Vec<u64>>::new();
        let mut reachable = docs
            .keys()
            .filter(|id| !dead_pool.contains(id))
            .copied()
            .collect::<BTreeSet<_>>();
        for (target, sources) in &incoming {
            for source in sources {
                outgoing.entry(*source).or_default().push(*target);
                if !docs.contains_key(source) {
                    reachable.insert(*source);
                }
            }
        }
        let mut queue = reachable.iter().copied().collect::<VecDeque<_>>();
        while let Some(node) = queue.pop_front() {
            self.quality_check_cancel()?;
            for target in outgoing.get(&node).into_iter().flatten() {
                if reachable.insert(*target) {
                    queue.push_back(*target);
                }
            }
        }
        // Weak components of the remaining graph include mutually recursive islands.
        let mut remaining = dead_pool
            .difference(&reachable)
            .copied()
            .collect::<BTreeSet<_>>();
        while let Some(first) = remaining.pop_first() {
            let mut members = vec![first];
            let mut queue = VecDeque::from([first]);
            while let Some(node) = queue.pop_front() {
                self.quality_check_cancel()?;
                for next in incoming
                    .get(&node)
                    .into_iter()
                    .flatten()
                    .chain(outgoing.get(&node).into_iter().flatten())
                {
                    if remaining.remove(next) {
                        members.push(*next);
                        queue.push_back(*next);
                    }
                }
            }
            members.sort_unstable();
            let doc = docs[&first];
            add(
                "dead_code",
                first.to_string(),
                json!({"symbol":symbol(doc),"members":members.iter().map(|id|symbol(docs[id])).collect::<Vec<_>>(),
                    "analysis":"root_reachability","reachable_node_count":reachable.len(),
                    "reason":"Private component unreachable from conservative roots in the proven graph. Exports, hooks and unknown callers retained. Dynamic/missing edges still require manual review.",
                    "absence_is_not_proof":true,"coverage_gap_count":gaps}),
                members,
                400,
            );
        }
        if docs.len() > 2000 {
            partial = true;
            scan_gaps.push(json!({"code":"DOCUMENT_LIMIT"}));
        }
        let mut file_count = 0;
        let mut input_bytes = 0usize;
        for (path, expected) in self.stored.path_hashes.iter().take(500) {
            self.quality_check_cancel()?;
            file_count += 1;
            let language = super::pack_for_path(Path::new(path))
                .map(|p| p.id())
                .unwrap_or("");
            if !matches!(language, "rust" | "typescript" | "python") {
                partial = true;
                scan_gaps.push(json!({"path":path,"code":"HARDCODE_LANGUAGE_UNSUPPORTED"}));
                continue;
            }
            let cached = &old_memo[path];
            let sites: Vec<Value> = if cached["hash"] == json!(expected)
                && cached["sites"].as_array().is_some_and(|sites| {
                    sites.iter().all(|s| {
                        s["start"]
                            .as_u64()
                            .zip(s["end"].as_u64())
                            .is_some_and(|(a, b)| a <= b && b <= 262144)
                            && s["sensitive"].is_boolean()
                            && s["binding"].is_string()
                            && s["signature"].is_string()
                            && s["rule"].is_string()
                            && s["line"].as_u64().is_some()
                    })
                }) {
                reused_files += 1;
                cached["sites"].as_array().unwrap().clone()
            } else {
                let source = match read_source(root, path) {
                    Ok(s) => s,
                    Err(e) => {
                        partial = true;
                        scan_gaps.push(json!({"path":path,"code":e.code()}));
                        continue;
                    }
                };
                if Hash32(*blake3::hash(source.as_bytes()).as_bytes()) != *expected {
                    return Err(error(
                        "cgrx.quality_stale_source",
                        "source differs from indexed snapshot; refresh required",
                    ));
                }
                input_bytes += source.len();
                if input_bytes > 8 * 1024 * 1024 {
                    partial = true;
                    scan_gaps.push(json!({"code":"BYTE_LIMIT"}));
                    break;
                }
                let raw = match cgrx_languages::hardcode_sites(language, &source) {
                    Ok(v) => v,
                    Err(e) => {
                        partial = true;
                        scan_gaps.push(json!({"path":path,"code":e}));
                        continue;
                    }
                };
                parsed_files += 1;
                raw.into_iter()
                    .map(|site| {
                        let mut v = json!(site);
                        v["line"] =
                            json!(source[..site.start].bytes().filter(|b| *b == b'\n').count() + 1);
                        v
                    })
                    .collect()
            };
            let sites_truncated = sites.len() > 100
                || (cached["hash"] == json!(expected) && cached["truncated"] == true);
            let sites = sites.into_iter().take(100).collect::<Vec<_>>();
            memo[path]["truncated"] = json!(sites_truncated);
            memo[path]["hash"] = json!(expected);
            memo[path]["sites"] = json!(sites);
            if memo[path].get("visibility").is_none() && old_memo[path]["hash"] == json!(expected) {
                memo[path]["visibility"] = old_memo[path]["visibility"].clone();
            }
            if sites_truncated {
                partial = true;
                scan_gaps.push(json!({"path":path,"code":"HARDCODE_SITE_LIMIT"}));
            }
            let mut occurrences = BTreeMap::<String, usize>::new();
            for site in sites.into_iter().take(100) {
                let start = site["start"].as_u64().unwrap() as usize;
                let end = site["end"].as_u64().unwrap() as usize;
                let owner = docs
                    .values()
                    .filter(|d| d.path == *path && d.body_start <= start && d.body_end >= end)
                    .min_by_key(|d| d.body_end - d.body_start);
                let ids = owner.map(|d| vec![d.node_id]).unwrap_or_default();
                let occurrence = occurrences
                    .entry(format!(
                        "{}:{}:{}",
                        owner.map(|d| d.qualified_name.as_str()).unwrap_or("module"),
                        site["binding"],
                        site["rule"]
                    ))
                    .or_default();
                let ordinal = *occurrence;
                *occurrence += 1;
                add(
                    "hardcode",
                    format!("{path}:{start}:{end}"),
                    json!({"path":path,"language":language,"source_hash":expected,"span":{"start":start,"end":end},"line":site["line"],"rule":site["rule"],"sensitive":site["sensitive"],"binding":site["binding"],"signature":site["signature"],"occurrence":ordinal,"value":"REDACTED","symbol":owner.map(|d|symbol(d))}),
                    ids,
                    if site["sensitive"] == true { 950 } else { 650 },
                );
            }
        }
        if self.stored.path_hashes.len() > 500 {
            partial = true;
            scan_gaps.push(json!({"code":"FILE_LIMIT"}));
        }
        if dropped_candidates > 0 {
            partial = true;
            scan_gaps.push(json!({"code":"CANDIDATE_LIMIT","omitted":dropped_candidates}));
        }
        candidates.sort_by(|a, b| {
            b["score"]
                .as_u64()
                .cmp(&a["score"].as_u64())
                .then_with(|| a["id"].as_str().cmp(&b["id"].as_str()))
        });
        if let Err(e) = self.quality_write_json(&memo_path, &memo) {
            partial = true;
            scan_gaps.push(json!({"code":e.code(),"component":"incremental_cache"}));
        }
        let value = json!({"version":VERSION,"snapshot":snapshot,"candidates":candidates,"partial":partial||gaps>0,"coverage_gap_count":gaps,"scan_gaps":scan_gaps,"duplicates_partial":duplicates["partial"],"inspected_documents":inspected_documents,"inspected_files":file_count,"analysis":{"parsed_files":parsed_files,"reused_files":reused_files,"graph_context_recomputed":true},"llm_used":false});
        self.quality_check_cancel()?;

        self.quality_check_cancel()?;
        self.quality_write_json(&cache_path, &value)?;
        let mut cache = self.architecture_cache.write().unwrap();
        cache.retain(|k, _| !k.starts_with(VERSION));
        cache.insert(key, value.clone());
        Ok(value)
    }
    pub fn quality_tool(
        &self,
        root: &Path,
        operation: &str,
        args: Value,
    ) -> Result<Value, RuntimeError> {
        if !args.is_object() {
            return Err(error(
                "cgrx.invalid_arguments",
                "arguments must be an object",
            ));
        }
        for key in ["offset", "limit"] {
            if args.get(key).is_some_and(|v| v.as_u64().is_none()) {
                return Err(error(
                    "cgrx.invalid_arguments",
                    "pagination must use nonnegative integers",
                ));
            }
        }
        if args.get("kind").is_some_and(|v| !v.is_string()) {
            return Err(error("cgrx.invalid_arguments", "kind must be a string"));
        }
        if operation == "get_quality_index_status" {
            return self.quality_worker_status();
        }
        if args.get("status").is_some_and(|v| !v.is_string())
            || ["include_resolved", "include_inactive"]
                .iter()
                .any(|key| args.get(*key).is_some_and(|v| !v.is_boolean()))
        {
            return Err(error(
                "cgrx.invalid_arguments",
                "invalid status or inclusion flag type",
            ));
        }
        let mut index = self.quality_index(root)?;
        self.quality_attach_states(&mut index)?;
        if operation == "list_quality_candidates" {
            let offset = args.get("offset").and_then(Value::as_u64).unwrap_or(0) as usize;
            let limit = args.get("limit").and_then(Value::as_u64).unwrap_or(20) as usize;
            if !(1..=100).contains(&limit) || offset > 100000 {
                return Err(error(
                    "cgrx.invalid_arguments",
                    "limit 1..100 and offset <=100000 required",
                ));
            }
            let kind = args.get("kind").and_then(Value::as_str);
            if kind.is_some_and(|k| !matches!(k, "duplicate" | "dead_code" | "hardcode")) {
                return Err(error("cgrx.invalid_arguments", "invalid candidate kind"));
            }
            if let Some(expected) = args.get("expected_snapshot")
                && expected != &index["snapshot"]
            {
                return Err(error(
                    "cgrx.quality_stale_candidate",
                    "snapshot changed; restart listing",
                ));
            }
            let status = args.get("status").and_then(Value::as_str);
            if status.is_some_and(|s| !matches!(s, "new" | "confirmed" | "dismissed" | "fixed")) {
                return Err(error("cgrx.invalid_arguments", "invalid finding status"));
            }
            let include_resolved = args
                .get("include_resolved")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            let rows = index["candidates"]
                .as_array()
                .unwrap()
                .iter()
                .filter(|c| kind.is_none_or(|k| c["kind"] == k))
                .filter(|c| {
                    status.map_or(
                        include_resolved
                            || (c["triage"]["status"] != "dismissed"
                                && c["triage"]["status"] != "fixed"),
                        |s| c["triage"]["status"] == s,
                    )
                })
                .collect::<Vec<_>>();
            return Ok(
                json!({"snapshot":index["snapshot"],"candidates":rows.iter().skip(offset).take(limit).copied().collect::<Vec<_>>(),"total":rows.len(),"next_offset":(offset+limit<rows.len()).then_some(offset+limit),"partial":index["partial"],"coverage_gap_count":index["coverage_gap_count"],"scan_gaps":index["scan_gaps"],"index_version":VERSION,"analysis":index["analysis"],"inactive_findings":if args["include_inactive"]==true {self.quality_inactive_states(&index)?} else {json!([])},"llm_used":false}),
            );
        }
        if operation == "update_quality_candidate_status" && args.get("finding_id").is_some() {
            if args.get("candidate_id").is_some() {
                return Err(error(
                    "cgrx.invalid_arguments",
                    "use either candidate_id or finding_id",
                ));
            }
            let fid = args["finding_id"]
                .as_str()
                .ok_or_else(|| error("cgrx.invalid_arguments", "finding_id must be a string"))?;
            if let Some(c) = index["candidates"]
                .as_array()
                .unwrap()
                .iter()
                .find(|c| c["finding_id"] == fid)
            {
                return self.quality_update_state(c, &args);
            }
            let old = self.quality_saved_finding(fid)?;
            let inactive = json!({"id":old["last_candidate_id"],"finding_id":fid,"kind":old["kind"],"content_fingerprint":old["content_fingerprint"],"evidence":{"path":old["path"]},"inactive":true});
            return self.quality_update_state(&inactive, &args);
        }
        let id = args
            .get("candidate_id")
            .and_then(Value::as_str)
            .ok_or_else(|| error("cgrx.invalid_arguments", "candidate_id required"))?;
        let c = index["candidates"]
            .as_array()
            .unwrap()
            .iter()
            .find(|c| c["id"] == id)
            .ok_or_else(|| {
                error(
                    "cgrx.quality_stale_candidate",
                    "candidate not present in current snapshot; list again",
                )
            })?;
        if operation == "update_quality_candidate_status" {
            return self.quality_update_state(c, &args);
        }
        if operation == "get_candidate_details" {
            return Ok(
                json!({"snapshot":index["snapshot"],"candidate":c,"partial":index["partial"],"scan_gaps":index["scan_gaps"]}),
            );
        }
        if operation != "prepare_candidate_patch" {
            return Err(error("cgrx.invalid_arguments", "unknown quality operation"));
        }
        let blocked = |reason: &str| {
            Ok(
                json!({"snapshot":index["snapshot"],"candidate_id":id,"status":"blocked","reason":reason,"diff":null,"source_modified":false}),
            )
        };
        if c["kind"] != "hardcode" {
            return blocked(
                "MVP will not delete unproven dead code or consolidate similar functions automatically; review graph evidence and design a semantics-preserving change.",
            );
        }
        let e = &c["evidence"];
        if e["sensitive"] == true {
            return blocked(
                "Credential candidates require rotation and an explicit configuration contract; secret values are never included in patches.",
            );
        }
        let path = e["path"].as_str().unwrap();
        let source = read_source(root, path)?;
        if hash(source.as_bytes()) != e["source_hash"] {
            return Err(error(
                "cgrx.quality_stale_source",
                "source changed; list candidates again",
            ));
        }
        // Python module placement has docstring/future-import constraints. Keep this first safe patch subset narrow.
        if e["language"] != "typescript" {
            return blocked(
                "Automatic patch MVP supports TypeScript endpoint/path literal extraction only.",
            );
        }
        if source.contains("@ts-")
            || source.contains("@jsx")
            || source.lines().any(|l| l.trim_start().starts_with("///"))
            || source.contains("use asm")
            || source.starts_with("#!")
            || source.contains("use strict")
            || source.contains("use client")
            || source.contains("use server")
            || source.starts_with('\u{feff}')
        {
            return blocked("Module directives require manual insertion planning.");
        }
        let start = e["span"]["start"].as_u64().unwrap() as usize;
        let end = e["span"]["end"].as_u64().unwrap() as usize;
        let literal = source
            .get(start..end)
            .ok_or_else(|| error("cgrx.quality_stale_source", "invalid source span"))?;
        let name = format!(
            "CGRX_QUALITY_{}",
            id.trim_start_matches("quality1.").to_ascii_uppercase()
        );
        if source.contains(&name) {
            return blocked("Generated constant name already exists.");
        }
        if literal.contains('\n') {
            return blocked("Multiline literal extraction requires manual review.");
        }
        if cgrx_languages::hardcode_sites("typescript", &source)
            .unwrap_or_default()
            .iter()
            .any(|s| s.sensitive)
        {
            return blocked(
                "File contains credential candidates; patch output is withheld to prevent secret disclosure.",
            );
        }
        let changed = format!(
            "const {name} = {literal};\n{}{}{}",
            &source[..start],
            name,
            &source[end..]
        );
        let mut diff = similar::TextDiff::from_lines(source.as_str(), changed.as_str())
            .unified_diff()
            .context_radius(1)
            .header(&format!("a/{path}"), &format!("b/{path}"))
            .to_string();
        if diff.len() > 16384 {
            return blocked("Diff exceeds patch output budget.");
        }
        let run_checks = match args.get("run_project_checks") {
            None | Some(Value::Bool(false)) => false,
            Some(Value::Bool(true)) => true,
            _ => {
                return Err(error(
                    "cgrx.invalid_arguments",
                    "run_project_checks must be boolean",
                ));
            }
        };
        let mut patch_verification = if run_checks {
            project_checks::verify(root, path, &source, &changed, &diff)
        } else {
            verification::verify(path, &source, &changed, &diff)
        };
        if let Some(formatted) = patch_verification
            .get("formatted_diff")
            .and_then(Value::as_str)
        {
            diff = formatted.to_owned();
        }
        if let Some(object) = patch_verification.as_object_mut() {
            object.remove("formatted_diff");
        }
        if read_source(root, path)? != source {
            return Err(error(
                "cgrx.quality_stale_source",
                "source changed during verification; list candidates again",
            ));
        }
        Ok(
            json!({"patch_verification":patch_verification,"snapshot":index["snapshot"],"candidate_id":id,"status":"prepared","diff":diff,"precondition":{"path":path,"blake3":e["source_hash"]},"source_modified":false,"requires_review":true,"verification":["Apply only if precondition source hash still matches","Run project typecheck and tests before merging"],"limitations":"Literal extraction only; this is not external configuration or credential remediation."}),
        )
    }
}
