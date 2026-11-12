//! Bounded syntax-only review hints, never proof of a vulnerability.
use ast_grep_core::tree_sitter::{LanguageExt, StrDoc, TSLanguage};
use ast_grep_core::{Language, Pattern, PatternError, matcher::PatternBuilder};
use serde::Serialize;
use std::borrow::Cow;

#[derive(Clone)]
struct Grammar(TSLanguage);
impl Language for Grammar {
    fn pre_process_pattern<'q>(&self, query: &'q str) -> Cow<'q, str> {
        Cow::Owned(query.replace('$', "µ"))
    }
    fn expando_char(&self) -> char {
        'µ'
    }
    fn kind_to_id(&self, kind: &str) -> u16 {
        self.0.id_for_node_kind(kind, true)
    }
    fn field_to_id(&self, field: &str) -> Option<u16> {
        self.0.field_id_for_name(field).map(|id| id.get())
    }
    fn build_pattern(&self, builder: &PatternBuilder) -> Result<Pattern, PatternError> {
        builder.build(|source| StrDoc::try_new(source, self.clone()))
    }
}
impl LanguageExt for Grammar {
    fn get_ts_language(&self) -> TSLanguage {
        self.0.clone()
    }
}

#[derive(Debug, Serialize)]
pub struct QualityFinding {
    pub rule: &'static str,
    pub start_byte: usize,
    pub end_byte: usize,
    pub confidence: &'static str,
}
#[derive(Debug, Serialize)]
pub struct QualityCheck {
    pub engine: &'static str,
    pub status: &'static str,
    pub findings: Vec<QualityFinding>,
    pub truncated: bool,
}
/// Offsets are relative to the supplied snippet. No code or secret values are emitted.
/// The result covers only these syntax rules, not dataflow or whole-project security.
pub fn check_quality(language: &str, source: &str) -> QualityCheck {
    let mut result = QualityCheck {
        engine: "ast-grep-core",
        status: "checked",
        findings: vec![],
        truncated: false,
    };
    let (grammar, rules): (TSLanguage, &[(&str, &str)]) = match language {
        "rust" => (
            tree_sitter_rust::LANGUAGE.into(),
            &[
                ("RUST_UNWRAP", "$VALUE.unwrap()"),
                ("RUST_EXPECT", "$VALUE.expect($MESSAGE)"),
            ],
        ),
        "typescript" => (
            tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into(),
            &[("DYNAMIC_EVAL", "eval($$$ARGS)")],
        ),
        "python" => (
            tree_sitter_python::LANGUAGE.into(),
            &[
                ("DYNAMIC_EVAL", "eval($$$ARGS)"),
                ("DYNAMIC_EXEC", "exec($$$ARGS)"),
            ],
        ),
        _ => {
            result.status = "unsupported";
            return result;
        }
    };
    if source.len() > 64 * 1024 {
        result.status = "budget_exceeded";
        return result;
    }
    let grammar = Grammar(grammar);
    let Ok(ast) = ast_grep_core::AstGrep::try_new(source, grammar.clone()) else {
        result.status = "parse_failed";
        return result;
    };
    if ast
        .root()
        .find_all(ast_grep_core::matcher::KindMatcher::new(
            "ERROR",
            grammar.clone(),
        ))
        .next()
        .is_some()
    {
        result.status = "partial_parse";
    }
    for &(rule, pattern) in rules {
        let Ok(pattern) = Pattern::try_new(pattern, grammar.clone()) else {
            result.status = "rule_failed";
            continue;
        };
        for found in ast.root().find_all(pattern) {
            if result.findings.len() == 20 {
                result.truncated = true;
                break;
            }
            let span = found.range();
            result.findings.push(QualityFinding {
                rule,
                start_byte: span.start,
                end_byte: span.end,
                confidence: "syntax_candidate",
            });
        }
    }
    result
        .findings
        .sort_by_key(|finding| (finding.start_byte, finding.rule));
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn quality_patterns_ignore_comments_and_strings() {
        let result = check_quality(
            "typescript",
            "// eval(bad)\nconst s = 'eval(bad)'; eval(input);",
        );
        assert_eq!(result.status, "checked");
        assert_eq!(result.findings.len(), 1);
        assert_eq!(result.findings[0].rule, "DYNAMIC_EVAL");
    }
    #[test]
    fn quality_supported_languages_and_budgets() {
        assert_eq!(
            check_quality("rust", "fn f() { value.unwrap(); }")
                .findings
                .len(),
            1
        );
        assert_eq!(
            check_quality("python", "exec(value)\neval(value)")
                .findings
                .len(),
            2
        );
        assert_eq!(check_quality("go", "anything").status, "unsupported");
        assert_eq!(
            check_quality("rust", &"x".repeat(65537)).status,
            "budget_exceeded"
        );
    }
}

/// Assignment literals only; strings in comments, calls and docstrings are excluded.
#[derive(Debug, Serialize)]
pub struct HardcodeSite {
    pub start: usize,
    pub end: usize,
    pub rule: &'static str,
    pub sensitive: bool,
    pub binding: String,
    pub signature: String,
}
pub fn hardcode_sites(language: &str, source: &str) -> Result<Vec<HardcodeSite>, String> {
    let grammar = match language {
        "rust" => tree_sitter_rust::LANGUAGE.into(),
        "typescript" => tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into(),
        "python" => tree_sitter_python::LANGUAGE.into(),
        _ => return Err("unsupported_language".into()),
    };
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&grammar).map_err(|e| e.to_string())?;
    let tree = parser.parse(source, None).ok_or("parse_failed")?;
    if tree.root_node().has_error() {
        return Err("partial_parse".into());
    }
    let mut stack = vec![tree.root_node()];
    let mut sites = vec![];
    while let Some(node) = stack.pop() {
        if matches!(
            node.kind(),
            "let_declaration" | "variable_declarator" | "assignment"
        ) {
            let name = node
                .child_by_field_name("name")
                .or_else(|| node.child_by_field_name("pattern"))
                .or_else(|| node.child_by_field_name("left"));
            let value = node
                .child_by_field_name("value")
                .or_else(|| node.child_by_field_name("right"));
            if let (Some(name), Some(value)) = (name, value) {
                let key = source[name.byte_range()].to_ascii_lowercase();
                let text = &source[value.byte_range()];
                let literal = matches!(
                    value.kind(),
                    "string" | "string_literal" | "raw_string_literal"
                );
                // No interpolation: extracting it could change evaluation order/scope.
                let interpolated = text.contains("${")
                    || value.kind() == "concatenated_string"
                    || (language == "python" && (text.starts_with('f') || text.starts_with('F')));
                let sensitive = [
                    "password",
                    "secret",
                    "api_key",
                    "apikey",
                    "token",
                    "authorization",
                    "private_key",
                ]
                .iter()
                .any(|word| key.contains(word))
                    || text.contains("@")
                    || text.to_ascii_lowercase().contains("token=")
                    || text.to_ascii_lowercase().contains("key=");
                let endpoint = text.contains("https://")
                    || text.contains("http://")
                    || text.contains("/Users/")
                    || text.contains("/home/");
                if literal && !interpolated && text.len() > 4 && (sensitive || endpoint) {
                    sites.push(HardcodeSite {
                        start: value.start_byte(),
                        end: value.end_byte(),
                        sensitive,
                        binding: source[name.byte_range()].to_owned(),
                        signature: blake3::hash(source[node.byte_range()].as_bytes())
                            .to_hex()
                            .to_string(),
                        rule: if sensitive {
                            "HARDCODED_CREDENTIAL_CANDIDATE"
                        } else {
                            "HARDCODED_ENDPOINT_OR_PATH"
                        },
                    });
                }
            }
        }
        let mut cursor = node.walk();
        stack.extend(node.named_children(&mut cursor));
    }
    sites.sort_by_key(|s| s.start);
    Ok(sites)
}

#[cfg(test)]
mod hardcode_tests {
    use super::*;
    #[test]
    fn hardcode_sites_are_ast_assignments_and_redact_values() {
        for (lang, code) in [
            (
                "rust",
                "fn f() { let password = \"fixture-secret-value\"; }",
            ),
            ("python", "password = 'fixture-secret-value'"),
            ("typescript", "const password = 'fixture-secret-value';"),
        ] {
            let sites = hardcode_sites(lang, code).unwrap();
            assert_eq!(sites.len(), 1, "{lang}");
            assert!(sites[0].sensitive);
            assert!(!serde_json_for_test(&sites[0]).contains("fixture-secret-value"));
        }
        assert!(
            hardcode_sites(
                "typescript",
                "// const password = 'not-code';\nconst text = \"const password = 'not-code'\";"
            )
            .unwrap()
            .is_empty()
        );
        assert!(
            hardcode_sites("python", "value = f'https://host/{name}'")
                .unwrap()
                .is_empty()
        );
        assert!(hardcode_sites("ruby", "value = 'https://host'").is_err());
    }
    fn serde_json_for_test(site: &HardcodeSite) -> String {
        format!("{:?}", site)
    }
}
