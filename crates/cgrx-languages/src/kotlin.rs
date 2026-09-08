use crate::pack::{
    Edge, ExtractError, Extraction, LanguagePack, Provenance, RelationKind, Span, Symbol,
    UnresolvedKind, evidence_span, normalize_extraction, symbol, text, unresolved, walk_with,
};
use std::collections::BTreeSet;
use tree_sitter::{Language, Node, Parser};

pub(crate) static KOTLIN: Kotlin = Kotlin;

pub(crate) struct Kotlin;

impl LanguagePack for Kotlin {
    fn id(&self) -> &'static str {
        "kotlin"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["kt", "kts"]
    }

    fn language(&self) -> Language {
        tree_sitter_kotlin_ng::LANGUAGE.into()
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
        let context = KotlinContext::collect(tree.root_node(), source);
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
        classify(node, source, extraction, &KotlinContext::default());
    }
}

struct KotlinContext {
    declared_functions: BTreeSet<String>,
}

impl KotlinContext {
    fn default() -> Self {
        Self {
            declared_functions: BTreeSet::new(),
        }
    }

    fn collect(root: Node<'_>, source: &[u8]) -> Self {
        let mut context = Self::default();
        visit(root, &mut |node| {
            if node.kind() == "function_declaration" {
                let mut cursor = node.walk();
                for child in node.named_children(&mut cursor) {
                    if child.kind() == "identifier" {
                        context.declared_functions.insert(text(child, source));
                        break;
                    }
                }
            }
        });
        context
    }
}

fn classify(node: Node<'_>, source: &[u8], extraction: &mut Extraction, context: &KotlinContext) {
    match node.kind() {
        "function_declaration" => {
            let mut cursor = node.walk();
            for child in node.named_children(&mut cursor) {
                if child.kind() == "identifier" {
                    extraction.symbols.push(Symbol {
                        name: text(child, source),
                        span: Span::from(child),
                        search_span: Span::from(node),
                    });
                    break;
                }
            }
        }
        "type_alias" => {
            let mut cursor = node.walk();
            for child in node.named_children(&mut cursor) {
                if child.kind() == "identifier" {
                    extraction.symbols.push(Symbol {
                        name: text(child, source),
                        span: Span::from(child),
                        search_span: Span::from(node),
                    });
                    break;
                }
            }
        }
        "class_declaration" | "object_declaration" | "enum_class_declaration" => {
            symbol(node, source, extraction);
        }
        "import" => extraction.edges.push(Edge {
            relation: RelationKind::Imports,
            target: text(node, source).trim().to_owned(),
            span: Span::from(node),
            context_span: Span::from(node),
            provenance: Provenance::Syntax,
        }),
        "call_expression" => {
            let mut cursor = node.walk();
            let function = node
                .named_children(&mut cursor)
                .find(|n| n.kind() == "identifier");
            if let Some(function) = function {
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
                                "property_declaration",
                                "call_expression",
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
    fn kotlin_symbols_imports_calls_and_dispatch_are_fail_closed() {
        let source = br#"import java.util.List
import kotlin.collections.Map

data class User(val name: String, val age: Int)

fun greet(): String = "hello"

fun caller(): String {
    val message = greet()
    println(message)
    return message
}
"#;
        let path = Path::new("src/main.kt");
        let pack = pack_for_path(path).expect("Kotlin source has a language pack");
        let extraction = pack.extract(path, source).expect("Kotlin source extracts");

        let names: Vec<_> = extraction
            .symbols
            .iter()
            .map(|symbol| symbol.name.as_str())
            .collect();
        assert_eq!(names, ["User", "caller", "greet"]);
        assert!(extraction.edges.iter().any(|edge| {
            edge.relation == RelationKind::Imports && edge.target == "import java.util.List"
        }));
        assert!(
            extraction
                .edges
                .iter()
                .any(|edge| { edge.relation == RelationKind::Calls && edge.target == "greet" })
        );
        let calls: Vec<_> = extraction
            .edges
            .iter()
            .filter(|e| e.relation == RelationKind::Calls)
            .map(|e| e.target.as_str())
            .collect();
        assert_eq!(calls, ["greet"]);
        assert!(
            extraction
                .unresolved
                .iter()
                .any(|c| c.text == "println(message)" && c.kind == UnresolvedKind::Dispatch)
        );
        assert!(extraction.parser_error_ranges.is_empty());
    }

    #[test]
    fn kotlin_method_call_on_object_is_dispatch() {
        let source = br#"import java.util.ArrayList

fun process() {
    val list = ArrayList<String>()
    list.add("item")
    list.forEach { println(it) }
}
"#;
        let path = Path::new("src/main.kt");
        let extraction = pack_for_path(path)
            .expect("Kotlin language pack registered")
            .extract(path, source)
            .expect("Kotlin source extracts");

        let dispatches: Vec<_> = extraction
            .unresolved
            .iter()
            .filter(|candidate| candidate.kind == UnresolvedKind::Dispatch)
            .map(|candidate| candidate.text.as_str())
            .collect();

        assert!(dispatches.contains(&"list.add(\"item\")"));
        assert!(dispatches.contains(&"list.forEach { println(it) }"));
    }

    #[test]
    fn kotlin_class_and_object_symbols() {
        let source = br#"class Service {
    fun execute(): String = "done"
}

object Singleton {
    fun instance(): Singleton = this
}

enum class Status {
    ACTIVE, INACTIVE
}

typealias Handler = (String) -> Unit
"#;
        let path = Path::new("src/main.kt");
        let extraction = pack_for_path(path)
            .expect("Kotlin language pack registered")
            .extract(path, source)
            .expect("Kotlin source extracts");

        let names: Vec<_> = extraction
            .symbols
            .iter()
            .map(|symbol| symbol.name.as_str())
            .collect();
        assert!(names.contains(&"Service"));
        assert!(names.contains(&"Singleton"));
        assert!(names.contains(&"Status"));
        assert!(names.contains(&"Handler"));
    }
}
