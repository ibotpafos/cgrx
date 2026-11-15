use std::ops::ControlFlow;

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

/// Whether text contains every already-normalized identifier query term.
///
/// Use [`identifier_tokens`] to normalize the query first. Duplicate query
/// terms require only one occurrence, and an empty query matches any text.
/// Matching uses the same identifier boundaries and lowercase mappings as
/// tokenization, with no stemming or Unicode normalization.
///
/// Search stops once all terms are found. Working memory is bounded by the
/// query terms and their longest length, without collecting the text's tokens.
#[must_use]
pub fn contains_identifier_tokens<T: AsRef<str>>(value: &str, query_tokens: &[T]) -> bool {
    if query_tokens.is_empty() {
        return true;
    }
    let mut required: Vec<&str> = query_tokens.iter().map(AsRef::as_ref).collect();
    required.sort_unstable();
    required.dedup();
    let max_token_bytes = required.iter().map(|token| token.len()).max().unwrap_or(0);
    let mut seen = vec![false; required.len()];
    let mut remaining = required.len();
    let mut buffer = String::new();
    visit_identifier_tokens_until(value, &mut buffer, max_token_bytes, |token| {
        if let Ok(index) = required.binary_search(&token)
            && !seen[index]
        {
            seen[index] = true;
            remaining -= 1;
        }
        if remaining == 0 {
            ControlFlow::Break(())
        } else {
            ControlFlow::Continue(())
        }
    });
    remaining == 0
}

/// Visit terms with one reusable allocation for document-sized search text.
pub(crate) fn visit_identifier_tokens(
    value: &str,
    buffer: &mut String,
    mut visit: impl FnMut(&str),
) {
    visit_identifier_tokens_until(value, buffer, usize::MAX, |token| {
        visit(token);
        ControlFlow::Continue(())
    });
}

fn visit_identifier_tokens_until(
    value: &str,
    buffer: &mut String,
    max_token_bytes: usize,
    mut visit: impl FnMut(&str) -> ControlFlow<()>,
) {
    buffer.clear();
    let mut oversized = false;
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
            if boundary && flush_token(buffer, &mut oversized, &mut visit).is_break() {
                return;
            }
            if !oversized {
                buffer.extend(character.to_lowercase());
                if buffer.len() > max_token_bytes {
                    buffer.clear();
                    oversized = true;
                }
            }
            previous = Some(character);
        } else if character == '\u{307}' && (oversized || !buffer.is_empty()) {
            // Unicode lowercase expands İ to i + COMBINING DOT ABOVE.
            // Keep that expansion searchable when it already occurs in input.
            if !oversized {
                buffer.push(character);
                if buffer.len() > max_token_bytes {
                    buffer.clear();
                    oversized = true;
                }
            }
        } else {
            if flush_token(buffer, &mut oversized, &mut visit).is_break() {
                return;
            }
            previous = None;
        }
    }
    let _ = flush_token(buffer, &mut oversized, &mut visit);
}

fn flush_token(
    buffer: &mut String,
    oversized: &mut bool,
    visit: &mut impl FnMut(&str) -> ControlFlow<()>,
) -> ControlFlow<()> {
    let control = if !*oversized && !buffer.is_empty() {
        visit(buffer)
    } else {
        ControlFlow::Continue(())
    };
    buffer.clear();
    *oversized = false;
    control
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeSet;

    fn token_set_contains_all(value: &str, query_tokens: &[String]) -> bool {
        let body_tokens: BTreeSet<_> = identifier_tokens(value).into_iter().collect();
        query_tokens.iter().all(|token| body_tokens.contains(token))
    }

    #[test]
    fn membership_matches_token_sets_across_identifier_conventions() {
        let texts = [
            "",
            " ::___/-- \n\t ",
            "HTTPRequest",
            "HTTP_REQUEST HTTP_REQUEST",
            "requester shipping",
            "HTTP2Request SHA256 v12 JSON2XML file٣Name 0123",
            "src/http_client.rs client::sendHTTPRequest",
            "ОбработатьHTTPЗапрос ÉlèveÉcole ΔοκιμήHTTP 名称",
            "İstanbul İSTANBUL i\u{307}stanbulClient",
            "\u{307} foo\u{307}Bar I\u{307}stanbul",
            "ⅧⅨ café cafe\u{301}",
        ];
        let queries = [
            "",
            "___",
            "http",
            "HTTPRequest",
            "HTTP request HTTP request",
            "request HTTP client",
            "HTTPRequest requester",
            "HTTP2Request",
            "HTTP12Request",
            "2",
            "12",
            "0123",
            "SHA256",
            "file٣Name",
            "src::http_client.rs",
            "ОбработатьHTTPЗапрос",
            "École Δοκιμή",
            "名称",
            "İstanbul",
            "i\u{307}stanbul",
            "foo\u{307}Bar",
            "ⅧⅨ",
            "café",
            "cafe\u{301}",
        ];
        for text in texts {
            for query in queries {
                let tokens = identifier_tokens(query);
                assert_eq!(
                    contains_identifier_tokens(text, &tokens),
                    token_set_contains_all(text, &tokens),
                    "text={text:?}, query={query:?}"
                );
            }
        }
    }

    #[test]
    fn membership_requires_every_distinct_term_without_substring_matches() {
        assert!(contains_identifier_tokens(
            "HTTPRequest",
            &["request", "http", "http"]
        ));
        assert!(!contains_identifier_tokens(
            "request requester shipping",
            &["request", "http"]
        ));
        assert!(!contains_identifier_tokens(
            "HTTPRequest12",
            &["http", "request", "2"]
        ));
        assert!(!contains_identifier_tokens("HTTPRequest", &["requester"]));
    }

    #[test]
    fn empty_membership_query_matches_any_text() {
        for text in ["", "__", "HTTPRequest"] {
            assert!(contains_identifier_tokens(text, &[] as &[&str]));
        }
        assert!(!contains_identifier_tokens("", &["http"]));
        assert!(!contains_identifier_tokens("http", &[""]));
    }

    #[test]
    fn long_text_hits_and_misses_match_token_set_membership() {
        let padding = "unrelated identifier words __ ".repeat(20_000);
        let text = format!("{padding} HTTP2Request İstanbul {padding}");
        for query in [
            "http request 2 İstanbul",
            "http requester",
            "http request 12",
        ] {
            let tokens = identifier_tokens(query);
            assert_eq!(
                contains_identifier_tokens(&text, &tokens),
                token_set_contains_all(&text, &tokens)
            );
        }
        assert!(contains_identifier_tokens(
            &text,
            &identifier_tokens("HTTP2Request İstanbul")
        ));
        assert!(!contains_identifier_tokens(
            &text,
            &identifier_tokens("HTTPRequest MissingTerm")
        ));
    }

    #[test]
    fn oversized_tokens_do_not_hide_later_matches_or_match_shorter_prefixes() {
        let oversized = "a".repeat(200_000);
        for text in [
            format!("{oversized}HTTP2Request"),
            format!("{oversized}_HTTP2Request"),
            format!("{oversized}\u{307}HTTPRequest"),
        ] {
            for query in ["http request", "a", "requester", "HTTP12Request"] {
                let tokens = identifier_tokens(query);
                assert_eq!(
                    contains_identifier_tokens(&text, &tokens),
                    token_set_contains_all(&text, &tokens)
                );
            }
        }
    }

    #[test]
    fn streaming_visitor_bounds_its_token_buffer_and_stops_when_requested() {
        let text = format!("{} HTTPRequest ignored suffix", "a".repeat(200_000));
        let mut buffer = String::new();
        let mut visited = Vec::new();
        visit_identifier_tokens_until(&text, &mut buffer, "request".len(), |token| {
            visited.push(token.to_owned());
            if token == "request" {
                ControlFlow::Break(())
            } else {
                ControlFlow::Continue(())
            }
        });
        assert_eq!(visited, ["http", "request"]);
        assert!(buffer.is_empty());
        assert!(
            buffer.capacity() < 1024,
            "buffer grew with an oversized source token"
        );
    }

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
