//! Conservative change-risk candidates, not a whole-program bug detector.
use super::*;
mod review;

const DOCUMENT_LIMIT: usize = 100_000;
const EDGE_LIMIT: usize = 20_000;
const EVIDENCE_BYTES: usize = 2 * 1024 * 1024;

pub struct RiskBaseline {
    snapshot: RepoSnapshot,
    symbols: BTreeMap<u64, RiskSymbol>,
    edges: Vec<StoredArc>,
    coverage: CoverageMetadata,
    partial: bool,
}

struct RiskSymbol {
    path: String,
    symbol: String,
    span: ByteRange,
    body_hash: Hash32,
}

impl Runtime {
    /// Retain only bounded proven relation metadata, not a second full index.
    #[must_use]
    pub fn risk_baseline(&self) -> RiskBaseline {
        let scope = all_scope();
        let edges = definitive_stored_arcs(&self.stored, &scope);
        let partial = self.stored.documents.len() > DOCUMENT_LIMIT || edges.len() > EDGE_LIMIT;
        RiskBaseline {
            snapshot: self.stored.snapshot.clone(),
            symbols: self
                .stored
                .documents
                .iter()
                .take(DOCUMENT_LIMIT)
                .filter(|d| d.provenance == "SYNTAX")
                .map(|d| {
                    (
                        d.node_id,
                        RiskSymbol {
                            path: d.path.clone(),
                            symbol: d.qualified_name.clone(),
                            span: ByteRange::new(d.span_start, d.span_end),
                            body_hash: body_hash(d),
                        },
                    )
                })
                .collect(),
            edges: edges.into_iter().take(EDGE_LIMIT).cloned().collect(),
            coverage: self.stored.coverage.clone(),
            partial,
        }
    }

    pub fn scan_risks(
        &self,
        baseline: &RiskBaseline,
        root: &Path,
        limit: usize,
    ) -> Result<Value, RuntimeError> {
        if !(1..=50).contains(&limit) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "limit must be 1..50",
            ));
        }
        if baseline.snapshot.repo_revision != self.base_snapshot.repo_revision {
            return Err(RuntimeError::new(
                "cgrx.stale_snapshot",
                "risk baseline differs from current HEAD; retry after refresh",
            ));
        }
        let mut gaps = BTreeSet::<(String, String)>::new();
        let mut partial = baseline.partial
            || self.stored.documents.len() > DOCUMENT_LIMIT
            || self.stored.arcs.len() > EDGE_LIMIT;
        if partial {
            gaps.insert((".".to_owned(), "SCAN_BUDGET_EXCEEDED".to_owned()));
        }
        if baseline.coverage.traversal_truncated || self.stored.coverage.traversal_truncated {
            partial = true;
            gaps.insert((".".to_owned(), "INDEX_TRAVERSAL_TRUNCATED".to_owned()));
        }
        let mut current = BTreeMap::<(&str, &str), Vec<&StoredDocument>>::new();
        let mut names = BTreeSet::new();
        let mut calls = BTreeMap::<(&str, &str), Vec<&StoredDocument>>::new();
        for d in self.stored.documents.iter().take(DOCUMENT_LIMIT) {
            if d.provenance == "SYNTAX" {
                current
                    .entry((&d.path, &d.qualified_name))
                    .or_default()
                    .push(d);
                names.insert(d.qualified_name.as_str());
            }
            if d.provenance == "CALLS" {
                calls
                    .entry((&d.path, &d.qualified_name))
                    .or_default()
                    .push(d);
            }
        }
        let live_arcs = definitive_stored_arcs(&self.stored, &all_scope());
        // Keep one actual proof per live pair; do not reuse a baseline callsite
        // whose byte span or source hash may no longer describe the working tree.
        let live_pairs: BTreeMap<_, _> = live_arcs
            .iter()
            .take(EDGE_LIMIT)
            .filter_map(|e| {
                e.evidence
                    .as_ref()
                    .map(|proof| ((e.source, e.target), proof))
            })
            .collect();
        let resolved: BTreeSet<_> = live_arcs
            .into_iter()
            .take(EDGE_LIMIT)
            .filter_map(|e| {
                e.evidence
                    .as_ref()
                    .map(|p| (p.path.as_str(), p.span.start, p.span.end))
            })
            .collect();
        for path in &self.changed_paths {
            for reason in path_gaps(&self.stored.coverage, path) {
                gaps.insert((path.clone(), reason.to_owned()));
            }
            if !self.stored.path_hashes.contains_key(path)
                && !self.base_path_hashes.contains_key(path)
            {
                gaps.insert((path.clone(), "UNINDEXED_CHANGED_PATH".to_owned()));
            }
        }
        let mut findings = Vec::new();
        let mut impacts = Vec::new();
        let mut dedup = BTreeSet::new();
        let mut evidence = EvidenceReader {
            root,
            hashes: &self.stored.path_hashes,
            cache: BTreeMap::new(),
            bytes_left: EVIDENCE_BYTES,
        };
        let global_incomplete = partial || !gaps.is_empty();
        let mut inspected = 0;
        for edge in &baseline.edges {
            let (Some(caller), Some(target)) = (
                baseline.symbols.get(&edge.source),
                baseline.symbols.get(&edge.target),
            ) else {
                continue;
            };
            if !self.changed_paths.contains(&caller.path)
                && !self.changed_paths.contains(&target.path)
            {
                continue;
            }
            inspected += 1;
            if findings.len() > limit {
                partial = true;
                gaps.insert((".".to_owned(), "RESULT_LIMIT".to_owned()));
                break;
            }
            let mut material_gap = false;
            let mut relation_gap = false;
            for path in [&caller.path, &target.path] {
                for coverage in [&baseline.coverage, &self.stored.coverage] {
                    for reason in path_gaps(coverage, path) {
                        gaps.insert((path.clone(), reason.to_owned()));
                        relation_gap = true;
                        // Missing other calls is not counter-evidence to a
                        // definitive positive edge. Keep absence checks strict.
                        material_gap |= reason != "DYNAMIC_DISPATCH";
                    }
                }
            }
            if material_gap {
                partial = true;
                continue;
            }
            let Some(callers) = current.get(&(caller.path.as_str(), caller.symbol.as_str())) else {
                continue;
            };
            let [now_caller] = callers.as_slice() else {
                partial = true;
                gaps.insert((caller.path.clone(), "AMBIGUOUS_CALLER".to_owned()));
                continue;
            };
            if let Some(targets) = current.get(&(target.path.as_str(), target.symbol.as_str())) {
                if let [now_target] = targets.as_slice()
                    && body_hash(now_target) != target.body_hash
                    && let Some(current_edge) =
                        live_pairs.get(&(now_caller.node_id, now_target.node_id))
                    && dedup.insert((
                        "impact",
                        caller.path.clone(),
                        caller.symbol.clone(),
                        target.symbol.clone(),
                    ))
                {
                    let Some(line) = evidence.line(&caller.path, now_caller.span_start) else {
                        partial = true;
                        gaps.insert((
                            caller.path.clone(),
                            "SOURCE_UNVERIFIED_OR_BUDGET".to_owned(),
                        ));
                        continue;
                    };
                    if evidence.line(&target.path, now_target.span_start).is_none() {
                        partial = true;
                        gaps.insert((
                            target.path.clone(),
                            "SOURCE_UNVERIFIED_OR_BUDGET".to_owned(),
                        ));
                        continue;
                    }
                    if impacts.len() >= limit {
                        partial = true;
                        gaps.insert((".".to_owned(), "RESULT_LIMIT".to_owned()));
                        continue;
                    }
                    impacts.push(json!({"rule":"CHANGED_CALLEE_IMPACT","severity":"info","confidence":"candidate","path":caller.path,"line":line,"caller":{"path":caller.path,"symbol":caller.symbol,"span":{"start":now_caller.span_start,"end":now_caller.span_end}},"current_source_hash":self.stored.path_hashes.get(&caller.path),"changed_target":{"path":target.path,"symbol":target.symbol},"base_edge":edge.evidence,"current_edge":current_edge,"verification":"Review this caller and run its tests; a changed dependency is not itself a bug."}));
                }
                continue;
            }
            // Absence alone is insufficient. Require prior exact proof, unchanged caller,
            // retained parsed call, clean coverage and no current alternate resolution.
            if global_incomplete
                || relation_gap
                || body_hash(now_caller) != caller.body_hash
                || names.contains(target.symbol.as_str())
            {
                continue;
            }
            let Some(candidates) = calls.get(&(caller.path.as_str(), target.symbol.as_str()))
            else {
                continue;
            };
            for call in candidates {
                if call.span_start < now_caller.body_start
                    || call.span_end > now_caller.body_end
                    || resolved.contains(&(call.path.as_str(), call.span_start, call.span_end))
                {
                    continue;
                }
                if !dedup.insert((
                    "removed",
                    call.path.clone(),
                    call.span_start.to_string(),
                    target.symbol.clone(),
                )) {
                    continue;
                }
                let Some(line) = evidence.line(&call.path, call.span_start) else {
                    partial = true;
                    gaps.insert((call.path.clone(), "SOURCE_UNVERIFIED_OR_BUDGET".to_owned()));
                    continue;
                };
                findings.push(json!({"rule":"REMOVED_TARGET_RETAINED_CALL","severity":"warning","confidence":"candidate","path":call.path,"line":line,"span":{"start":call.span_start,"end":call.span_end},"caller":caller.symbol,"removed_target":{"path":target.path,"symbol":target.symbol,"base_span":target.span},"base_edge":edge.evidence,"current_source_hash":self.stored.path_hashes.get(&call.path),"verification":"Check whether the call now resolves through an import or dynamic binding; otherwise update/remove it and run the compiler or tests."}));
                if findings.len() > limit {
                    partial = true;
                    gaps.insert((".".to_owned(), "RESULT_LIMIT".to_owned()));
                    break;
                }
            }
        }
        // One extra verified candidate distinguishes a full page from truncation.
        findings.truncate(limit);
        if findings.len() + impacts.len() > limit {
            impacts.truncate(limit.saturating_sub(findings.len()));
            partial = true;
            gaps.insert((".".to_owned(), "RESULT_LIMIT".to_owned()));
        }
        let mut verification_plan = review::build(
            &self.stored,
            &impacts,
            &live_pairs,
            &mut evidence,
            limit,
            &mut gaps,
        );
        partial |= !gaps.is_empty();
        verification_plan["partial"] = json!(partial);
        verification_plan["review_findings"] = json!((0..findings.len()).collect::<Vec<_>>());
        verification_plan["review_changed_paths"] = json!(!self.changed_paths.is_empty());
        let gap_count = gaps.len();
        Ok(
            json!({"snapshot":self.snapshot(),"base_revision":baseline.snapshot.repo_revision,"mode":"changes","findings":findings,"impacts":impacts,"verification_plan":verification_plan,"partial":partial,"coverage_gaps":gaps.into_iter().take(20).map(|(path,code)|json!({"path":path,"code":code})).collect::<Vec<_>>(),"coverage_gap_count":gap_count,"coverage_gaps_truncated":gap_count>20,"inspected_base_edges":inspected,"changed_paths":self.changed_paths.iter().take(20).collect::<Vec<_>>(),"changed_path_count":self.changed_paths.len(),"evidence_bytes":EVIDENCE_BYTES-evidence.bytes_left,"limitations":["Candidates, not confirmed bugs; no whole-program absence proof.","Compares working tree with HEAD; no historical commit-range scan.","Cycles, architecture rules and data-flow bugs are not covered by this first slice."]}),
        )
    }
}

fn all_scope() -> Scope {
    Scope {
        include: vec!["**".to_owned()],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    }
}
fn body_hash(d: &StoredDocument) -> Hash32 {
    Hash32(*blake3::hash(d.search_text.as_bytes()).as_bytes())
}
fn path_gaps(c: &CoverageMetadata, p: &str) -> Vec<&'static str> {
    let mut reasons = Vec::new();
    if c.excluded_paths.iter().any(|x| x == p) {
        reasons.push("EXCLUDED_PATH");
    }
    if c.stale_paths.iter().any(|x| x == p) {
        reasons.push("STALE_PATH");
    }
    if c.parser_error_ranges.iter().any(|x| x.path == p) {
        reasons.push("PARSER_ERROR_RANGE");
    }
    if c.dynamic_dispatch
        .iter()
        .any(|x| dynamic_dispatch_path(x) == p)
    {
        reasons.push("DYNAMIC_DISPATCH");
    }
    reasons
}

struct EvidenceReader<'a> {
    root: &'a Path,
    hashes: &'a BTreeMap<String, Hash32>,
    cache: BTreeMap<String, Option<Vec<u8>>>,
    bytes_left: usize,
}
impl EvidenceReader<'_> {
    fn line(&mut self, path: &str, offset: usize) -> Option<usize> {
        if !self.cache.contains_key(path) {
            let data = (|| {
                if self.bytes_left == 0 {
                    return None;
                }
                let canonical = self.root.join(path).canonicalize().ok()?;
                if !canonical.starts_with(self.root) {
                    return None;
                }
                let mut data = Vec::new();
                fs::File::open(canonical)
                    .ok()?
                    .take((self.bytes_left + 1) as u64)
                    .read_to_end(&mut data)
                    .ok()?;
                let fits = data.len() <= self.bytes_left;
                self.bytes_left = self.bytes_left.saturating_sub(data.len());
                if !fits || self.hashes.get(path) != Some(&Hash32(*blake3::hash(&data).as_bytes()))
                {
                    return None;
                }
                Some(data)
            })();
            self.cache.insert(path.to_owned(), data);
        }
        let data = self.cache.get(path)?.as_ref()?;
        Some(1 + data.get(..offset)?.iter().filter(|b| **b == b'\n').count())
    }
}
