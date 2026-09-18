//! Framework-aware recognition for Django/FastAPI and Express.
//!
//! Conservative, deterministic detection based on frozen positive/negative
//! fixtures in `contracts/framework_gates_v1.json`. No LLM involved.
//!
//! Detection scans indexed documents for framework-specific patterns:
//! - Django/FastAPI: route decorators (`@app.get`, `@router.post`), URL
//!   patterns (`path()`), ORM patterns (`Model.objects.*`, `models.Model`).
//! - Express: middleware (`app.use`, `router.use`), routes (`app.get`,
//!   `router.post`), imports (`import express from 'express'`).

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::BTreeMap;
use std::path::Path;

use cgrx_core::{RepoSnapshot, Scope};

/// Supported frameworks for gate detection.
#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Framework {
    Django,
    FastApi,
    Express,
}

impl Framework {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Django => "django",
            Self::FastApi => "fastapi",
            Self::Express => "express",
        }
    }

    #[allow(dead_code)]
    pub fn display_name(&self) -> &'static str {
        match self {
            Self::Django => "Django",
            Self::FastApi => "FastAPI",
            Self::Express => "Express",
        }
    }
}

/// Detection confidence for a framework.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum DetectionConfidence {
    /// Strong positive evidence from multiple pattern matches.
    High,
    /// Some positive evidence but not conclusive.
    Medium,
    /// Weak or ambiguous evidence.
    Low,
    /// No evidence found.
    None,
}

impl DetectionConfidence {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::High => "HIGH",
            Self::Medium => "MEDIUM",
            Self::Low => "LOW",
            Self::None => "NONE",
        }
    }
}

/// A single framework pattern match.
#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq)]
pub struct FrameworkMatch {
    pub framework: Framework,
    pub pattern: String,
    pub path: String,
    pub line: usize,
    pub span_start: usize,
    pub span_end: usize,
    pub match_kind: MatchKind,
}

/// Whether a match is positive evidence or a false-positive guard.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MatchKind {
    Positive,
    Negative,
}

/// Result of framework detection for a snapshot.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FrameworkDetection {
    pub snapshot: RepoSnapshot,
    pub frameworks: BTreeMap<String, FrameworkResult>,
    pub partial: bool,
}

/// Result for a single framework.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FrameworkResult {
    pub confidence: DetectionConfidence,
    pub positive_matches: Vec<FrameworkMatch>,
    pub negative_matches: Vec<FrameworkMatch>,
    pub verdict: String,
}

/// Gate rule evaluation.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GateRule {
    pub rule: String,
    pub value: usize,
    pub threshold: usize,
    pub severity: String,
    pub status: String,
}

/// Gate evaluation result.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FrameworkGateResult {
    pub snapshot: RepoSnapshot,
    pub algorithm: String,
    pub llm_used: bool,
    pub verdict: String,
    pub would_block: bool,
    pub fail_on: String,
    pub rules: Vec<GateRule>,
    pub totals: BTreeMap<String, usize>,
    pub partial: bool,
    pub frameworks: BTreeMap<String, FrameworkResult>,
    pub agent_handoff: Value,
    pub limitations: Vec<String>,
}

/// Thresholds for framework gate evaluation.
#[derive(Clone, Copy, Debug, Default)]
pub struct FrameworkGateThresholds {
    pub max_framework_confidence: usize,
    pub max_false_positive_matches: usize,
}

/// Detect frameworks in the given documents.
///
/// Scans each document for framework-specific patterns. Only documents
/// within scope are considered. Detection is conservative: a framework
/// is only reported when positive patterns are found.
pub fn detect_frameworks(
    documents: &[crate::runtime::StoredDocument],
    scope: &Scope,
    snapshot: RepoSnapshot,
    path_in_scope: impl FnMut(&str, &Scope) -> bool,
) -> FrameworkDetection {
    let mut frameworks = BTreeMap::new();
    let mut path_in_scope = path_in_scope;

    for framework in [Framework::Django, Framework::FastApi, Framework::Express] {
        let result = detect_single_framework(documents, scope, &mut path_in_scope, framework);
        frameworks.insert(framework.as_str().to_owned(), result);
    }

    FrameworkDetection {
        snapshot,
        frameworks,
        partial: false,
    }
}

fn detect_single_framework(
    documents: &[crate::runtime::StoredDocument],
    scope: &Scope,
    mut path_in_scope: impl FnMut(&str, &Scope) -> bool,
    framework: Framework,
) -> FrameworkResult {
    let mut positive_matches = Vec::new();
    let mut negative_matches = Vec::new();

    for doc in documents {
        if doc.provenance != "SYNTAX" {
            continue;
        }
        if !path_in_scope(&doc.path, scope) {
            continue;
        }

        let path = Path::new(&doc.path);
        let extension = path.extension().and_then(|e| e.to_str()).unwrap_or("");

        match framework {
            Framework::Django | Framework::FastApi => {
                if extension != "py" {
                    continue;
                }
                match_python_framework(
                    doc,
                    framework,
                    &mut positive_matches,
                    &mut negative_matches,
                );
            }
            Framework::Express => {
                if !matches!(extension, "ts" | "tsx" | "js" | "jsx" | "mjs" | "cjs") {
                    continue;
                }
                match_express(doc, &mut positive_matches, &mut negative_matches);
            }
        }
    }

    positive_matches.sort_by(|a, b| (&a.path, a.span_start).cmp(&(&b.path, b.span_start)));
    positive_matches.dedup_by(|a, b| {
        a.pattern == b.pattern && a.span_start == b.span_start && a.path == b.path
    });
    negative_matches.sort_by(|a, b| (&a.path, a.span_start).cmp(&(&b.path, b.span_start)));
    negative_matches.dedup_by(|a, b| {
        a.pattern == b.pattern && a.span_start == b.span_start && a.path == b.path
    });

    let confidence = compute_confidence(&positive_matches, &negative_matches);
    let verdict = match confidence {
        DetectionConfidence::High => "DETECTED",
        DetectionConfidence::Medium => "SUSPECTED",
        DetectionConfidence::Low => "WEAK_SIGNAL",
        DetectionConfidence::None => "ABSENT",
    };

    FrameworkResult {
        confidence,
        positive_matches,
        negative_matches,
        verdict: verdict.to_owned(),
    }
}

fn compute_confidence(
    positive: &[FrameworkMatch],
    negative: &[FrameworkMatch],
) -> DetectionConfidence {
    if positive.is_empty() {
        return DetectionConfidence::None;
    }

    let positive_count = positive.len();
    let negative_count = negative.len();

    // Strong positive evidence with no false-positive guards.
    if positive_count >= 3 && negative_count == 0 {
        DetectionConfidence::High
    } else if positive_count >= 1 && negative_count == 0 {
        DetectionConfidence::Medium
    } else if positive_count > negative_count {
        DetectionConfidence::Low
    } else {
        DetectionConfidence::None
    }
}

/// Match Django/FastAPI patterns in a Python document.
fn match_python_framework(
    doc: &crate::runtime::StoredDocument,
    framework: Framework,
    positive: &mut Vec<FrameworkMatch>,
    negative: &mut Vec<FrameworkMatch>,
) {
    let text = &doc.search_text;
    let path = &doc.path;

    // Django/FastAPI route decorators: @app.get, @app.post, @router.get, etc.
    let route_patterns = [
        "@app.get(",
        "@app.post(",
        "@app.put(",
        "@app.delete(",
        "@app.patch(",
        "@app.options(",
        "@app.head(",
        "@app.trace(",
        "@router.get(",
        "@router.post(",
        "@router.put(",
        "@router.delete(",
        "@router.patch(",
        "@router.options(",
        "@router.head(",
        "@router.trace(",
        "@bp.get(",
        "@bp.post(",
        "@bp.put(",
        "@bp.delete(",
        "@bp.patch(",
    ];

    for pattern in route_patterns {
        find_pattern_occurrences(
            text,
            path,
            pattern,
            doc.span_start,
            positive,
            MatchKind::Positive,
        );
    }

    // Django URL patterns: path('...', view)
    if path.contains("urls.py") || path.contains("urls") {
        for pattern in ["path(", "re_path("] {
            find_pattern_occurrences(
                text,
                path,
                pattern,
                doc.span_start,
                positive,
                MatchKind::Positive,
            );
        }
    }

    // Django ORM: models.Model subclass
    if text.contains("models.Model") {
        find_pattern_occurrences(
            text,
            path,
            "models.Model",
            doc.span_start,
            positive,
            MatchKind::Positive,
        );
    }

    // Django ORM: .objects. manager access
    let orm_patterns = [
        ".objects.filter(",
        ".objects.get(",
        ".objects.create(",
        ".objects.all(",
        ".objects.exclude(",
        ".objects.order_by(",
        ".objects.annotate(",
        ".objects.aggregate(",
        ".objects.count(",
        ".objects.first(",
        ".objects.last(",
        ".objects.exists(",
    ];
    for pattern in orm_patterns {
        find_pattern_occurrences(
            text,
            path,
            pattern,
            doc.span_start,
            positive,
            MatchKind::Positive,
        );
    }

    // FastAPI imports
    if framework == Framework::FastApi {
        for pattern in ["from fastapi import", "import fastapi", "FastAPI("] {
            find_pattern_occurrences(
                text,
                path,
                pattern,
                doc.span_start,
                positive,
                MatchKind::Positive,
            );
        }
    }

    // Django imports
    if framework == Framework::Django {
        for pattern in [
            "from django.urls import",
            "from django.db import",
            "from django.http import",
            "from django.views",
            "from django.shortcuts import",
            "from django.contrib",
        ] {
            find_pattern_occurrences(
                text,
                path,
                pattern,
                doc.span_start,
                positive,
                MatchKind::Positive,
            );
        }
    }

    // Negative patterns (false-positive guards).
    // Plain function named 'get'/'post' without decorator.
    if text.contains("def get(") || text.contains("def post(") {
        // Only flag as negative if no route decorator is present.
        let has_decorator =
            text.contains("@app.") || text.contains("@router.") || text.contains("@bp.");
        if !has_decorator {
            find_pattern_occurrences(
                text,
                path,
                "def get(",
                doc.span_start,
                negative,
                MatchKind::Negative,
            );
            find_pattern_occurrences(
                text,
                path,
                "def post(",
                doc.span_start,
                negative,
                MatchKind::Negative,
            );
        }
    }

    // Plain class named 'Model' without models.Model inheritance.
    if text.contains("class Model:") && !text.contains("models.Model") {
        find_pattern_occurrences(
            text,
            path,
            "class Model:",
            doc.span_start,
            negative,
            MatchKind::Negative,
        );
    }
}

/// Match Express patterns in a TypeScript/JavaScript document.
fn match_express(
    doc: &crate::runtime::StoredDocument,
    positive: &mut Vec<FrameworkMatch>,
    negative: &mut Vec<FrameworkMatch>,
) {
    let text = &doc.search_text;
    let path = &doc.path;

    // Express imports.
    for pattern in [
        "import express from 'express'",
        "import express from \"express\"",
        "const express = require('express')",
        "const express = require(\"express\")",
        "import { Router } from 'express'",
        "import { Router } from \"express\"",
        "import express, {",
    ] {
        find_pattern_occurrences(
            text,
            path,
            pattern,
            doc.span_start,
            positive,
            MatchKind::Positive,
        );
    }

    // Express middleware: app.use, router.use.
    for pattern in ["app.use(", "router.use(", "app.use (", "router.use ("] {
        find_pattern_occurrences(
            text,
            path,
            pattern,
            doc.span_start,
            positive,
            MatchKind::Positive,
        );
    }

    // Express routes: app.get, app.post, router.get, etc.
    let route_patterns = [
        "app.get(",
        "app.post(",
        "app.put(",
        "app.delete(",
        "app.patch(",
        "app.options(",
        "app.head(",
        "app.all(",
        "router.get(",
        "router.post(",
        "router.put(",
        "router.delete(",
        "router.patch(",
        "router.options(",
        "router.head(",
        "router.all(",
    ];
    for pattern in route_patterns {
        find_pattern_occurrences(
            text,
            path,
            pattern,
            doc.span_start,
            positive,
            MatchKind::Positive,
        );
    }

    // Express built-in middleware.
    for pattern in [
        "express.json(",
        "express.urlencoded(",
        "express.static(",
        "express.raw(",
        "express.text(",
    ] {
        find_pattern_occurrences(
            text,
            path,
            pattern,
            doc.span_start,
            positive,
            MatchKind::Positive,
        );
    }

    // Express app creation.
    for pattern in ["express()", "new Express()", "Express()"] {
        find_pattern_occurrences(
            text,
            path,
            pattern,
            doc.span_start,
            positive,
            MatchKind::Positive,
        );
    }

    // Negative patterns (false-positive guards).
    // Method named 'use' on a non-Express object.
    if text.contains("def use(") || text.contains("function use(") {
        let has_express = text.contains("express") || text.contains("Express");
        if !has_express {
            find_pattern_occurrences(
                text,
                path,
                "function use(",
                doc.span_start,
                negative,
                MatchKind::Negative,
            );
        }
    }

    // Plain HTTP server without Express.
    if text.contains("http.createServer(") {
        let has_express = text.contains("express") || text.contains("Express");
        if !has_express {
            find_pattern_occurrences(
                text,
                path,
                "http.createServer(",
                doc.span_start,
                negative,
                MatchKind::Negative,
            );
        }
    }
}

/// Find all occurrences of a pattern in text and add them as matches.
fn find_pattern_occurrences(
    text: &str,
    path: &str,
    pattern: &str,
    span_offset: usize,
    matches: &mut Vec<FrameworkMatch>,
    match_kind: MatchKind,
) {
    let mut search_start = 0;
    while let Some(pos) = text[search_start..].find(pattern) {
        let absolute_pos = search_start + pos;
        let line = text[..absolute_pos].lines().count();
        matches.push(FrameworkMatch {
            framework: Framework::Django, // placeholder, set by caller
            pattern: pattern.to_owned(),
            path: path.to_owned(),
            line,
            span_start: span_offset + absolute_pos,
            span_end: span_offset + absolute_pos + pattern.len(),
            match_kind,
        });
        search_start = absolute_pos + 1;
    }
}

/// Evaluate framework gates based on detection results.
pub fn evaluate_framework_gates(
    detection: &FrameworkDetection,
    fail_on: &str,
    thresholds: FrameworkGateThresholds,
) -> FrameworkGateResult {
    let mut rules = Vec::new();
    let mut totals = BTreeMap::new();

    // Rule 1: Framework confidence should not exceed threshold.
    let max_confidence_value = detection
        .frameworks
        .values()
        .map(|r| confidence_to_usize(&r.confidence))
        .max()
        .unwrap_or(0);
    let confidence_breached = max_confidence_value > thresholds.max_framework_confidence;
    rules.push(GateRule {
        rule: "max_framework_confidence".to_owned(),
        value: max_confidence_value,
        threshold: thresholds.max_framework_confidence,
        severity: "warning".to_owned(),
        status: if confidence_breached {
            "breached"
        } else {
            "passed"
        }
        .to_owned(),
    });

    // Rule 2: False-positive matches should not exceed threshold.
    let total_false_positives: usize = detection
        .frameworks
        .values()
        .map(|r| r.negative_matches.len())
        .sum();
    let fp_breached = total_false_positives > thresholds.max_false_positive_matches;
    rules.push(GateRule {
        rule: "max_false_positive_matches".to_owned(),
        value: total_false_positives,
        threshold: thresholds.max_false_positive_matches,
        severity: "error".to_owned(),
        status: if fp_breached { "breached" } else { "passed" }.to_owned(),
    });

    let errors = rules
        .iter()
        .filter(|r| r.status == "breached" && r.severity == "error")
        .count();
    let warnings = rules
        .iter()
        .filter(|r| r.status == "breached" && r.severity == "warning")
        .count();

    let partial = detection.partial;
    let verdict = if errors > 0 {
        "FAIL"
    } else if partial {
        "INCONCLUSIVE"
    } else if warnings > 0 {
        "WARN"
    } else {
        "PASS"
    };

    let would_block = match fail_on {
        "none" => false,
        "warning" => errors > 0 || warnings > 0 || partial,
        _ => errors > 0 || partial,
    };

    let failed_rules = rules
        .iter()
        .filter(|r| r.status == "breached")
        .map(|r| r.rule.clone())
        .collect::<Vec<_>>();

    totals.insert("errors".to_owned(), errors);
    totals.insert("warnings".to_owned(), warnings);
    totals.insert(
        "frameworks_detected".to_owned(),
        detection
            .frameworks
            .values()
            .filter(|r| r.verdict == "DETECTED")
            .count(),
    );
    totals.insert(
        "frameworks_suspected".to_owned(),
        detection
            .frameworks
            .values()
            .filter(|r| r.verdict == "SUSPECTED")
            .count(),
    );

    let agent_handoff = json!({
        "schema_version": "cgrx.agent.framework-gate.v1",
        "algorithm": "framework_detection_gate_v1",
        "llm_used": false,
        "snapshot": detection.snapshot,
        "verdict": verdict,
        "would_block": would_block,
        "failed_rules": failed_rules,
        "frameworks": detection.frameworks.iter().map(|(k, v)| {
            (k.clone(), json!({
                "confidence": v.confidence.as_str(),
                "verdict": v.verdict,
                "positive_count": v.positive_matches.len(),
                "negative_count": v.negative_matches.len(),
            }))
        }).collect::<BTreeMap<_, _>>(),
        "requirements": [
            "Revalidate the snapshot before acting on this gate.",
            "Inspect every referenced framework match and false-positive guard.",
            "Framework detection is pattern-based, not semantic confirmation."
        ]
    });

    FrameworkGateResult {
        snapshot: detection.snapshot.clone(),
        algorithm: "framework_detection_gate_v1".to_owned(),
        llm_used: false,
        verdict: verdict.to_owned(),
        would_block,
        fail_on: fail_on.to_owned(),
        rules,
        totals,
        partial,
        frameworks: detection.frameworks.clone(),
        agent_handoff,
        limitations: vec![
            "Framework detection is pattern-based and does not confirm semantic correctness."
                .to_owned(),
            "INCONCLUSIVE is distinct from PASS and remains blocking unless fail_on is none."
                .to_owned(),
            "False-positive guards reduce confidence but do not eliminate detection.".to_owned(),
        ],
    }
}

fn confidence_to_usize(confidence: &DetectionConfidence) -> usize {
    match confidence {
        DetectionConfidence::High => 3,
        DetectionConfidence::Medium => 2,
        DetectionConfidence::Low => 1,
        DetectionConfidence::None => 0,
    }
}

/// Compact framework gates for model-visible output.
#[allow(dead_code)]
pub fn compact_framework_gates(value: &Value) -> Value {
    json!({
        "at": snapshot_tag(value.get("snapshot")),
        "algorithm": value.get("algorithm"),
        "llm_used": value.get("llm_used"),
        "verdict": value.get("verdict"),
        "would_block": value.get("would_block"),
        "fail_on": value.get("fail_on"),
        "rules": value.get("rules"),
        "partial": value.get("partial"),
        "totals": value.get("totals"),
        "frameworks": value.get("frameworks").and_then(|f| {
            f.as_object().map(|obj| {
                obj.iter().map(|(k, v)| {
                    (k.clone(), json!({
                        "confidence": v.get("confidence"),
                        "verdict": v.get("verdict"),
                        "positive_count": v.get("positive_matches").and_then(|m| m.as_array()).map(|a| a.len()).unwrap_or(0),
                        "negative_count": v.get("negative_matches").and_then(|m| m.as_array()).map(|a| a.len()).unwrap_or(0),
                    }))
                }).collect::<BTreeMap<_, _>>()
            })
        }),
        "agent_handoff": value.get("agent_handoff"),
    })
}

#[allow(dead_code)]
fn snapshot_tag(snapshot: Option<&Value>) -> Option<String> {
    let snapshot = snapshot?;
    let revision: String = snapshot
        .get("repo_revision")?
        .as_str()?
        .chars()
        .take(12)
        .collect();
    let generation = snapshot.get("graph_generation")?.as_u64()?;
    Some(format!("{revision}@{generation}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_document(path: &str, text: &str, span_start: usize) -> crate::runtime::StoredDocument {
        crate::runtime::StoredDocument {
            php_function_target: None,
            php_type_target: None,
            rust_module_target: None,
            rust_self_target: None,
            ts_lexical_target: None,
            ts_constructor_target: None,
            go_field_target: None,
            go_local_constructor_target: None,
            java_constructor_target: None,
            semantic_fingerprint: None,
            node_id: 1,
            qualified_name: path.to_owned(),
            path: path.to_owned(),
            text: text.to_owned(),
            search_text: text.to_owned(),
            span_start,
            span_end: span_start + text.len(),
            body_start: 0,
            body_end: 0,
            provenance: "SYNTAX".to_owned(),
            semantic_tags: Vec::new(),
            go_receiver_target: None,
            go_import_path: None,
            go_import_explicit_alias: false,
            go_package: None,
        }
    }

    #[test]
    fn detect_django_route_decorators() {
        let doc = make_document(
            "views.py",
            "from django.shortcuts import render\nfrom django.http import HttpResponse\n\n@app.get('/api/users')\ndef get_users(request):\n    return HttpResponse('ok')\n",
            0,
        );
        let documents = vec![doc];
        let scope = Scope {
            include: vec![".".to_owned()],
            exclude: Vec::new(),
            relation_kinds: vec![],
            max_depth: 1,
        };
        let snapshot = RepoSnapshot {
            repo_revision: "abc123".to_owned(),
            working_tree_digest: cgrx_core::Hash32([0; 32]),
            graph_generation: 1,
        };
        let detection = detect_frameworks(&documents, &scope, snapshot, |_, _| true);
        let django = &detection.frameworks["django"];
        assert_eq!(django.verdict, "DETECTED");
        assert!(django.positive_matches.len() >= 2);
    }

    #[test]
    fn detect_fastapi_patterns() {
        let doc = make_document(
            "main.py",
            "from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/items')\ndef get_items():\n    return []\n\n@app.post('/items')\ndef create_item():\n    return {}\n",
            0,
        );
        let documents = vec![doc];
        let scope = Scope {
            include: vec![".".to_owned()],
            exclude: Vec::new(),
            relation_kinds: vec![],
            max_depth: 1,
        };
        let snapshot = RepoSnapshot {
            repo_revision: "abc123".to_owned(),
            working_tree_digest: cgrx_core::Hash32([0; 32]),
            graph_generation: 1,
        };
        let detection = detect_frameworks(&documents, &scope, snapshot, |_, _| true);
        let fastapi = &detection.frameworks["fastapi"];
        assert_eq!(fastapi.verdict, "DETECTED");
        assert!(fastapi.positive_matches.len() >= 3);
    }

    #[test]
    fn detect_express_middleware_and_routes() {
        let doc = make_document(
            "server.ts",
            "import express from 'express';\n\nconst app = express();\n\napp.use(express.json());\napp.use('/api', router);\n\napp.get('/users', (req, res) => {\n  res.json([]);\n});\n\napp.post('/users', (req, res) => {\n  res.json({});\n});\n",
            0,
        );
        let documents = vec![doc];
        let scope = Scope {
            include: vec![".".to_owned()],
            exclude: Vec::new(),
            relation_kinds: vec![],
            max_depth: 1,
        };
        let snapshot = RepoSnapshot {
            repo_revision: "abc123".to_owned(),
            working_tree_digest: cgrx_core::Hash32([0; 32]),
            graph_generation: 1,
        };
        let detection = detect_frameworks(&documents, &scope, snapshot, |_, _| true);
        let express = &detection.frameworks["express"];
        assert_eq!(express.verdict, "DETECTED");
        assert!(express.positive_matches.len() >= 4);
    }

    #[test]
    fn no_false_positive_for_plain_python() {
        let doc = make_document(
            "utils.py",
            "def get(items, key):\n    return items.get(key)\n\ndef post(data):\n    return data\n\nclass Model:\n    pass\n",
            0,
        );
        let documents = vec![doc];
        let scope = Scope {
            include: vec![".".to_owned()],
            exclude: Vec::new(),
            relation_kinds: vec![],
            max_depth: 1,
        };
        let snapshot = RepoSnapshot {
            repo_revision: "abc123".to_owned(),
            working_tree_digest: cgrx_core::Hash32([0; 32]),
            graph_generation: 1,
        };
        let detection = detect_frameworks(&documents, &scope, snapshot, |_, _| true);
        let django = &detection.frameworks["django"];
        let fastapi = &detection.frameworks["fastapi"];
        assert_eq!(django.verdict, "ABSENT");
        assert_eq!(fastapi.verdict, "ABSENT");
    }

    #[test]
    fn no_false_positive_for_plain_typescript() {
        let doc = make_document(
            "server.ts",
            "import http from 'http';\n\nconst server = http.createServer((req, res) => {\n  res.end('ok');\n});\n\nserver.listen(3000);\n",
            0,
        );
        let documents = vec![doc];
        let scope = Scope {
            include: vec![".".to_owned()],
            exclude: Vec::new(),
            relation_kinds: vec![],
            max_depth: 1,
        };
        let snapshot = RepoSnapshot {
            repo_revision: "abc123".to_owned(),
            working_tree_digest: cgrx_core::Hash32([0; 32]),
            graph_generation: 1,
        };
        let detection = detect_frameworks(&documents, &scope, snapshot, |_, _| true);
        let express = &detection.frameworks["express"];
        assert_eq!(express.verdict, "ABSENT");
    }

    #[test]
    fn gate_passes_when_no_frameworks_detected() {
        let detection = FrameworkDetection {
            snapshot: RepoSnapshot {
                repo_revision: "abc123".to_owned(),
                working_tree_digest: cgrx_core::Hash32([0; 32]),
                graph_generation: 1,
            },
            frameworks: BTreeMap::new(),
            partial: false,
        };
        let result = evaluate_framework_gates(
            &detection,
            "error",
            FrameworkGateThresholds {
                max_framework_confidence: 0,
                max_false_positive_matches: 0,
            },
        );
        assert_eq!(result.verdict, "PASS");
        assert!(!result.llm_used);
    }

    #[test]
    fn gate_warns_when_framework_detected_with_threshold() {
        let mut frameworks = BTreeMap::new();
        frameworks.insert(
            "express".to_owned(),
            FrameworkResult {
                confidence: DetectionConfidence::High,
                positive_matches: vec![
                    FrameworkMatch {
                        framework: Framework::Express,
                        pattern: "app.get(".to_owned(),
                        path: "server.ts".to_owned(),
                        line: 1,
                        span_start: 0,
                        span_end: 8,
                        match_kind: MatchKind::Positive,
                    },
                    FrameworkMatch {
                        framework: Framework::Express,
                        pattern: "import express from 'express'".to_owned(),
                        path: "server.ts".to_owned(),
                        line: 0,
                        span_start: 0,
                        span_end: 28,
                        match_kind: MatchKind::Positive,
                    },
                    FrameworkMatch {
                        framework: Framework::Express,
                        pattern: "app.use(".to_owned(),
                        path: "server.ts".to_owned(),
                        line: 2,
                        span_start: 0,
                        span_end: 8,
                        match_kind: MatchKind::Positive,
                    },
                ],
                negative_matches: Vec::new(),
                verdict: "DETECTED".to_owned(),
            },
        );
        let detection = FrameworkDetection {
            snapshot: RepoSnapshot {
                repo_revision: "abc123".to_owned(),
                working_tree_digest: cgrx_core::Hash32([0; 32]),
                graph_generation: 1,
            },
            frameworks,
            partial: false,
        };
        let result = evaluate_framework_gates(
            &detection,
            "error",
            FrameworkGateThresholds {
                max_framework_confidence: 0,
                max_false_positive_matches: 0,
            },
        );
        assert_eq!(result.verdict, "WARN");
        assert!(!result.llm_used);
    }

    #[test]
    fn gate_fails_when_false_positives_exceed_threshold() {
        let mut frameworks = BTreeMap::new();
        frameworks.insert(
            "express".to_owned(),
            FrameworkResult {
                confidence: DetectionConfidence::Low,
                positive_matches: vec![FrameworkMatch {
                    framework: Framework::Express,
                    pattern: "app.get(".to_owned(),
                    path: "server.ts".to_owned(),
                    line: 1,
                    span_start: 0,
                    span_end: 8,
                    match_kind: MatchKind::Positive,
                }],
                negative_matches: vec![FrameworkMatch {
                    framework: Framework::Express,
                    pattern: "http.createServer(".to_owned(),
                    path: "server.ts".to_owned(),
                    line: 0,
                    span_start: 0,
                    span_end: 19,
                    match_kind: MatchKind::Negative,
                }],
                verdict: "WEAK_SIGNAL".to_owned(),
            },
        );
        let detection = FrameworkDetection {
            snapshot: RepoSnapshot {
                repo_revision: "abc123".to_owned(),
                working_tree_digest: cgrx_core::Hash32([0; 32]),
                graph_generation: 1,
            },
            frameworks,
            partial: false,
        };
        let result = evaluate_framework_gates(
            &detection,
            "error",
            FrameworkGateThresholds {
                max_framework_confidence: 3,
                max_false_positive_matches: 0,
            },
        );
        assert_eq!(result.verdict, "FAIL");
    }
}
