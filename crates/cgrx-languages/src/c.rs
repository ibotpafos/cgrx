use crate::pack::{
    Edge, ExtractError, Extraction, LanguagePack, Provenance, RelationKind, Span, Symbol,
    UnresolvedKind, evidence_span, normalize_extraction, symbol, text, unresolved, walk_with,
};
use std::collections::BTreeSet;
use tree_sitter::{Language, Node, Parser};

pub(crate) static C_PACK: C = C;

pub(crate) struct C;

impl LanguagePack for C {
    fn id(&self) -> &'static str {
        "c"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["c", "h"]
    }

    fn language(&self) -> Language {
        tree_sitter_c::LANGUAGE.into()
    }

    fn extract(&self, path: &std::path::Path, source: &[u8]) -> Result<Extraction, ExtractError> {
        if path.is_absolute() {
            return Err(ExtractError::AbsolutePath);
        }
        let mut parser = Parser::new();
        parser
            .set_language(&self.language())
            .map_err(|_| ExtractError::ParserLanguage)?;
        let tree = parser
            .parse(source, None)
            .ok_or(ExtractError::ParseFailed)?;
        let context = CContext::collect(tree.root_node(), source);
        let mut extraction = Extraction::default();
        walk_with(
            tree.root_node(),
            source,
            &mut extraction,
            false,
            &mut |node, source, extraction| {
                classify(node, source, extraction, &context);
            },
        );
        normalize_extraction(&mut extraction);
        Ok(extraction)
    }

    fn classify(&self, node: Node<'_>, source: &[u8], extraction: &mut Extraction) {
        classify(node, source, extraction, &CContext::default());
    }
}

struct CContext {
    declared_functions: BTreeSet<String>,
}

impl CContext {
    fn default() -> Self {
        Self {
            declared_functions: BTreeSet::new(),
        }
    }

    fn collect(root: Node<'_>, source: &[u8]) -> Self {
        let mut context = Self::default();
        visit(root, &mut |node| {
            if node.kind() == "function_definition"
                && let Some(declarator) = node.child_by_field_name("declarator")
                && let Some(name) = declarator.child_by_field_name("declarator")
            {
                context.declared_functions.insert(text(name, source));
            }
        });
        context
    }
}

fn classify(node: Node<'_>, source: &[u8], extraction: &mut Extraction, context: &CContext) {
    match node.kind() {
        "function_definition" => {
            if let Some(declarator) = node.child_by_field_name("declarator")
                && let Some(name) = declarator.child_by_field_name("declarator")
            {
                extraction.symbols.push(Symbol {
                    name: text(name, source),
                    span: Span::from(name),
                    search_span: Span::from(node),
                });
            }
        }
        "struct_specifier" | "union_specifier" | "enum_specifier" | "type_definition" => {
            symbol(node, source, extraction);
        }
        "preproc_include" => extraction.edges.push(Edge {
            relation: RelationKind::Imports,
            target: text(node, source).trim().to_owned(),
            span: Span::from(node),
            context_span: Span::from(node),
            provenance: Provenance::Syntax,
        }),
        "call_expression" => {
            let Some(function) = node.child_by_field_name("function") else {
                return;
            };
            if function.kind() == "identifier" {
                let name = text(function, source);
                if context.declared_functions.contains(&name) {
                    extraction.edges.push(Edge {
                        relation: RelationKind::Calls,
                        target: name,
                        span: Span::from(node),
                        context_span: evidence_span(
                            node,
                            &[
                                "expression_statement",
                                "return_statement",
                                "declaration",
                                "assignment_expression",
                            ],
                        ),
                        provenance: Provenance::Syntax,
                    });
                } else {
                    unresolved(UnresolvedKind::Dispatch, node, source, extraction);
                }
            } else {
                unresolved(UnresolvedKind::Dispatch, node, source, extraction);
            }
        }
        _ => {}
    }
}

fn visit(node: Node<'_>, apply: &mut impl FnMut(Node<'_>)) {
    apply(node);
    let mut cursor = node.walk();
    for child in node.named_children(&mut cursor) {
        visit(child, apply);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pack_for_path;
    use std::path::Path;

    #[test]
    fn c_symbols_imports_calls_and_dispatch_are_fail_closed() {
        let source = br#"#include <stdio.h>
#include "myheader.h"

struct Point {
    int x;
    int y;
};

int add(int a, int b) { return a + b; }

int caller() {
    int result = add(1, 2);
    printf("result: %d\n", result);
    return result;
}
"#;
        let path = Path::new("src/main.c");
        let pack = pack_for_path(path).expect("C source has a language pack");
        let extraction = pack.extract(path, source).expect("C source extracts");

        let names: Vec<_> = extraction
            .symbols
            .iter()
            .map(|symbol| symbol.name.as_str())
            .collect();
        assert_eq!(names, ["Point", "add", "caller"]);
        assert!(extraction.edges.iter().any(|edge| {
            edge.relation == RelationKind::Imports && edge.target == "#include <stdio.h>"
        }));
        assert!(extraction.edges.iter().any(|edge| {
            edge.relation == RelationKind::Calls
                && edge.target == "add"
                && &source[edge.span.start..edge.span.end] == b"add(1, 2)"
        }));
        // printf is imported, not declared in this file - stays dispatch
        let calls: Vec<_> = extraction
            .edges
            .iter()
            .filter(|e| e.relation == RelationKind::Calls)
            .map(|e| e.target.as_str())
            .collect();
        assert_eq!(calls, ["add"]);
        assert!(
            extraction
                .unresolved
                .iter()
                .any(|c| c.text == "printf(\"result: %d\\n\", result)"
                    && c.kind == UnresolvedKind::Dispatch)
        );
        assert!(extraction.parser_error_ranges.is_empty());
    }

    #[test]
    fn c_function_pointer_call_is_dispatch() {
        let source = br#"#include <stdio.h>

void process(void (*callback)(int)) {
    callback(42);
}

void handler(int x) {
    printf("%d\n", x);
}
"#;
        let path = Path::new("src/main.c");
        let extraction = pack_for_path(path)
            .expect("C language pack registered")
            .extract(path, source)
            .expect("C source extracts");

        let dispatches: Vec<_> = extraction
            .unresolved
            .iter()
            .filter(|candidate| candidate.kind == UnresolvedKind::Dispatch)
            .map(|candidate| candidate.text.as_str())
            .collect();

        assert!(dispatches.contains(&"callback(42)"));
    }

    #[test]
    fn c_struct_member_call_is_dispatch() {
        let source = br#"#include <stdio.h>

struct Ops {
    void (*execute)(int);
};

void run(struct Ops* ops) {
    ops->execute(1);
}
"#;
        let path = Path::new("src/main.c");
        let extraction = pack_for_path(path)
            .expect("C language pack registered")
            .extract(path, source)
            .expect("C source extracts");

        let dispatches: Vec<_> = extraction
            .unresolved
            .iter()
            .filter(|candidate| candidate.kind == UnresolvedKind::Dispatch)
            .map(|candidate| candidate.text.as_str())
            .collect();

        assert_eq!(dispatches, ["ops->execute(1)"]);
    }
}
