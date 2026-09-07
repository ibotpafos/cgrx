//! Bounded test-selection hints. Proven CALLS do not prove test discovery.
use super::*;

pub(super) fn build(
    stored: &StoredIndex,
    impacts: &[Value],
    pairs: &BTreeMap<(u64, u64), &EdgeEvidence>,
    reader: &mut EvidenceReader<'_>,
    limit: usize,
    gaps: &mut BTreeSet<(String, String)>,
) -> Value {
    let mut by_name = BTreeMap::<(&str, &str), Vec<&StoredDocument>>::new();
    let mut by_id = BTreeMap::new();
    for doc in stored
        .documents
        .iter()
        .take(DOCUMENT_LIMIT)
        .filter(|d| d.provenance == "SYNTAX")
    {
        by_name
            .entry((&doc.path, &doc.qualified_name))
            .or_default()
            .push(doc);
        by_id.insert(doc.node_id, doc);
    }
    let mut incoming = BTreeMap::<u64, Vec<(u64, &EdgeEvidence)>>::new();
    for (&(source, target), &proof) in pairs {
        incoming.entry(target).or_default().push((source, proof));
    }
    let mut tests = Vec::new();
    let mut dedup = BTreeSet::new();
    let mut truncated = false;
    for (index, impact) in impacts.iter().enumerate() {
        let (Some(path), Some(symbol), Some(target_path), Some(target_symbol)) = (
            impact["caller"]["path"].as_str(),
            impact["caller"]["symbol"].as_str(),
            impact["changed_target"]["path"].as_str(),
            impact["changed_target"]["symbol"].as_str(),
        ) else {
            continue;
        };
        let Some(callers) = by_name.get(&(path, symbol)) else {
            continue;
        };
        let Some(targets) = by_name.get(&(target_path, target_symbol)) else {
            continue;
        };
        let ([caller], [target]) = (callers.as_slice(), targets.as_slice()) else {
            gaps.insert((path.to_owned(), "AMBIGUOUS_REVIEW_ENDPOINT".to_owned()));
            continue;
        };
        // Verify both endpoints on disk, not only the original impact callsite.
        if reader.line(target_path, target.span_start).is_none() {
            gaps.insert((
                target_path.to_owned(),
                "SOURCE_UNVERIFIED_OR_BUDGET".to_owned(),
            ));
            continue;
        }
        let mut candidates = vec![(*caller, None)];
        if let Some(edges) = incoming.get(&caller.node_id) {
            candidates.extend(
                edges
                    .iter()
                    .filter_map(|(id, proof)| by_id.get(id).map(|d| (*d, Some(*proof)))),
            );
        }
        for (test, upstream) in candidates {
            if !test_convention(test) || !dedup.insert((test.node_id, target.node_id)) {
                continue;
            }
            let reasons = path_gaps(&stored.coverage, &test.path);
            // An unrelated unresolved call does not invalidate this proven
            // positive edge. Keep its uncertainty visible, but abstain for
            // parser/stale/excluded source where the candidate itself is unsafe.
            let material_gap = reasons.iter().any(|code| *code != "DYNAMIC_DISPATCH");
            gaps.extend(
                reasons
                    .into_iter()
                    .map(|code| (test.path.clone(), code.to_owned())),
            );
            if material_gap {
                continue;
            }
            let Some(line) = reader.line(&test.path, test.span_start) else {
                gaps.insert((test.path.clone(), "SOURCE_UNVERIFIED_OR_BUDGET".to_owned()));
                continue;
            };
            if tests.len() >= limit {
                truncated = true;
                gaps.insert((".".to_owned(), "VERIFICATION_PLAN_LIMIT".to_owned()));
                break;
            }
            let mut chain = Vec::new();
            if let Some(proof) = upstream {
                chain.push(json!(proof));
            }
            chain.push(impact["current_edge"].clone());
            let call_depth = chain.len();
            tests.push(json!({
                "path":test.path,"symbol":test.qualified_name,"line":line,
                "source_hash":stored.path_hashes.get(&test.path),
                "selection":"test_convention_candidate","execution_status":"not_run",
                "impact_index":index,"call_chain":chain,
                "reach":{
                    "status":"proven_call_path","call_depth":call_depth,
                    "test_identity":"convention_candidate",
                    "behavioral_coverage":"unknown"
                },
            }));
        }
        if truncated {
            break;
        }
    }
    let discovery = if tests.is_empty() {
        "no_candidates_in_bounded_graph"
    } else {
        "candidates_found"
    };
    let test_reach = (0..impacts.len())
        .map(|impact_index| {
            let candidate_test_indexes = tests
                .iter()
                .enumerate()
                .filter_map(|(test_index, test)| {
                    (test["impact_index"].as_u64() == Some(impact_index as u64))
                        .then_some(test_index)
                })
                .collect::<Vec<_>>();
            let depths = candidate_test_indexes
                .iter()
                .filter_map(|&test_index| tests[test_index]["reach"]["call_depth"].as_u64())
                .collect::<Vec<_>>();
            let status = if candidate_test_indexes.is_empty() {
                "no_candidate_in_bounded_graph"
            } else {
                "candidate_paths_found"
            };
            json!({
                "impact_index":impact_index,"status":status,
                "candidate_test_indexes":candidate_test_indexes,
                "min_call_depth":depths.iter().min(),"max_call_depth":depths.iter().max(),
                "test_identity":"convention_candidate","behavioral_coverage":"unknown",
                "execution_status":"not_run"
            })
        })
        .collect::<Vec<_>>();
    json!({
        "execution_status":"not_run","related_tests":tests,"test_reach":test_reach,
        "test_discovery":discovery,
        "review_impacts":(0..impacts.len()).collect::<Vec<_>>(),
        "truncated":truncated,"max_call_depth":2,"complete_test_suite":false,
        "coverage_reference":"coverage_gaps",
        "limitations":[
            "Seeded only by returned baseline-backed changed-callee impacts; new/removed symbols and deeper paths require manual review.",
            "Test names/files are conventions, not runner discovery or behavioral coverage. Confirm test identity and use repository test instructions.",
            "No commands were executed; no absence or complete-suite claim."
        ]
    })
}

fn test_convention(doc: &StoredDocument) -> bool {
    let name = doc.qualified_name.rsplit([':', '.']).next().unwrap_or("");
    let file = doc.path.rsplit('/').next().unwrap_or("");
    name.starts_with("test_")
        || name
            .strip_prefix("Test")
            .is_some_and(|suffix| suffix.chars().next().is_some_and(char::is_uppercase))
        || doc
            .path
            .split('/')
            .any(|part| matches!(part, "tests" | "__tests__"))
        || file.ends_with("_test.go")
        || file.ends_with("Test.java")
        || file.ends_with("Tests.java")
        || [
            ".test.ts",
            ".test.tsx",
            ".test.js",
            ".spec.ts",
            ".spec.tsx",
            ".spec.js",
        ]
        .iter()
        .any(|suffix| file.ends_with(suffix))
}
