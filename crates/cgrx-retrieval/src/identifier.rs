/// Split code identifiers and prose into lowercase search terms.
///
/// Separators, camel/Pascal case, acronym-to-word boundaries, and transitions
/// between letters and numbers delimit terms. For example, `HTTPRequest2`
/// becomes `http`, `request`, `2`. Unicode character classes and lowercase
/// mappings are supported; no stemming or Unicode normalization is applied.
/// Terms retain their input order and repetitions so BM25 can count frequency.
#[must_use]
pub fn identifier_tokens(value: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut buffer = String::new();
    visit_identifier_tokens(value, &mut buffer, |token| tokens.push(token.to_owned()));
    tokens
}

/// Visit terms with one reusable allocation for document-sized search text.
pub(crate) fn visit_identifier_tokens(
    value: &str,
    buffer: &mut String,
    mut visit: impl FnMut(&str),
) {
    buffer.clear();
    let mut characters = value.chars().peekable();
    let mut previous: Option<char> = None;
    while let Some(character) = characters.next() {
        if character.is_alphanumeric() {
            let boundary = previous.is_some_and(|previous| {
                (previous.is_lowercase() && character.is_uppercase())
                    || (previous.is_uppercase()
                        && character.is_uppercase()
                        && characters.peek().is_some_and(|next| next.is_lowercase()))
                    || (previous.is_alphabetic()
                        && character.is_numeric()
                        && !character.is_alphabetic())
                    || (previous.is_numeric()
                        && !previous.is_alphabetic()
                        && character.is_alphabetic())
            });
            if boundary && !buffer.is_empty() {
                visit(buffer);
                buffer.clear();
            }
            buffer.extend(character.to_lowercase());
            previous = Some(character);
        } else if character == '\u{307}' && !buffer.is_empty() {
            // Unicode lowercase expands İ to i + COMBINING DOT ABOVE.
            // Keep that expansion searchable when it already occurs in input.
            buffer.push(character);
        } else {
            if !buffer.is_empty() {
                visit(buffer);
                buffer.clear();
            }
            previous = None;
        }
    }
    if !buffer.is_empty() {
        visit(buffer);
    }
    buffer.clear();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn common_code_naming_styles_share_search_terms() {
        for identifier in [
            "HTTPRequest",
            "httpRequest",
            "http_request",
            "HTTP_REQUEST",
            "http-request",
            "http request",
        ] {
            assert_eq!(
                identifier_tokens(identifier),
                ["http", "request"],
                "{identifier}"
            );
        }
    }

    #[test]
    fn acronym_boundaries_keep_abbreviations_intact() {
        assert_eq!(
            identifier_tokens("XMLHttpRequest parseURL HTTP URLParser"),
            [
                "xml", "http", "request", "parse", "url", "http", "url", "parser"
            ]
        );
    }

    #[test]
    fn qualified_names_paths_and_repeated_separators_are_delimited() {
        assert_eq!(
            identifier_tokens("__client::HTTPRequest /src/http_client.rs..."),
            ["client", "http", "request", "src", "http", "client", "rs"]
        );
        assert!(identifier_tokens(" :: / _ -- \n\t ").is_empty());
        assert!(identifier_tokens("").is_empty());
    }

    #[test]
    fn unicode_case_and_uncased_scripts_are_preserved() {
        assert_eq!(
            identifier_tokens("ОбработатьHTTPЗапрос ÉlèveÉcole ΔοκιμήHTTP 名称"),
            [
                "обработать",
                "http",
                "запрос",
                "élève",
                "école",
                "δοκιμή",
                "http",
                "名称"
            ]
        );
        assert_eq!(
            identifier_tokens("İstanbulClient"),
            ["i\u{307}stanbul", "client"]
        );
        assert_eq!(
            identifier_tokens("İstanbul"),
            identifier_tokens(&"İstanbul".to_lowercase())
        );
        assert!(identifier_tokens("\u{307}").is_empty());
    }

    #[test]
    fn numeric_versions_retain_their_complete_value() {
        assert_eq!(
            identifier_tokens("HTTP2Request SHA256 v12 JSON2XML file٣Name 0123"),
            [
                "http", "2", "request", "sha", "256", "v", "12", "json", "2", "xml", "file", "٣",
                "name", "0123"
            ]
        );
        assert_ne!(identifier_tokens("v12"), identifier_tokens("v21"));
        assert_ne!(identifier_tokens("SHA256"), identifier_tokens("SHA512"));
    }

    #[test]
    fn term_order_and_frequency_survive_normalization() {
        assert_eq!(
            identifier_tokens("HTTP http HTTPRequest"),
            ["http", "http", "http", "request"]
        );
        assert_ne!(identifier_tokens("requester"), identifier_tokens("request"));
        assert_ne!(identifier_tokens("ship"), identifier_tokens("HTTP"));
    }

    #[test]
    fn reusable_buffer_does_not_leak_terms_between_documents() {
        let mut buffer = "old contents".to_owned();
        let mut tokens = Vec::new();
        for value in ["HTTPRequest", "", "___", "plain"] {
            visit_identifier_tokens(value, &mut buffer, |token| tokens.push(token.to_owned()));
            assert!(buffer.is_empty());
        }
        assert_eq!(tokens, ["http", "request", "plain"]);
    }
}
