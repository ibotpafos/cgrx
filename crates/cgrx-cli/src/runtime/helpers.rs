//! Small utility functions used throughout the runtime.

use std::path::Path;

use cgrx_languages::Span;

use super::EXTRACTION_REVISION;

/// Deterministic structural fingerprint of a declaration body.
///
/// blake3 over whitespace-normalized source with every whole-token occurrence
/// of the declaration's own name removed. Equal fingerprints prove byte-identical
/// bodies modulo whitespace and self-naming.
pub(super) fn body_fingerprint(declaration_name: &str, body: &str) -> Option<String> {
    let mut normalized = String::with_capacity(body.len());
    let mut pending_space = false;
    for character in body.chars() {
        if character.is_whitespace() {
            pending_space = !normalized.is_empty();
        } else {
            if pending_space {
                normalized.push(' ');
                pending_space = false;
            }
            normalized.push(character);
        }
    }
    let mut filtered = String::with_capacity(normalized.len());
    let mut token = String::new();
    for character in normalized.chars() {
        if character.is_alphanumeric() || character == '_' {
            token.push(character);
        } else {
            if !token.is_empty() {
                if token != declaration_name {
                    filtered.push_str(&token);
                }
                token.clear();
            }
            filtered.push(character);
        }
    }
    if !token.is_empty() && token != declaration_name {
        filtered.push_str(&token);
    }
    if filtered.trim().is_empty() {
        return None;
    }
    Some(blake3::hash(filtered.as_bytes()).to_hex().to_string())
}

/// Stable node ID from path + span + name.
pub(super) fn stable_node_id(path: &str, span: Span, name: &str) -> u64 {
    let mut hasher = blake3::Hasher::new();
    hasher.update(path.as_bytes());
    hasher.update(&(span.start as u64).to_le_bytes());
    hasher.update(&(span.end as u64).to_le_bytes());
    hasher.update(name.as_bytes());
    let mut bytes = [0_u8; 8];
    bytes.copy_from_slice(&hasher.finalize().as_bytes()[..8]);
    u64::from_le_bytes(bytes)
}

/// Generation ID from revision + extraction revision.
pub(super) fn generation_id(revision: &str) -> u64 {
    let mut hasher = blake3::Hasher::new();
    hasher.update(revision.as_bytes());
    hasher.update(&EXTRACTION_REVISION.to_le_bytes());
    let digest = hasher.finalize();
    let mut bytes = [0_u8; 8];
    bytes.copy_from_slice(&digest.as_bytes()[..8]);
    u64::from_le_bytes(bytes) % 10_000_000_000_000_000
}

/// Compute the declaration span (line-level) for a symbol.
pub(super) fn declaration_span(source: &[u8], symbol: Span, path: &Path) -> Option<Span> {
    let line_start = source[..symbol.start]
        .iter()
        .rposition(|byte| *byte == b'\n')
        .map_or(0, |offset| offset + 1);
    let line_end = source[symbol.end..]
        .iter()
        .position(|byte| *byte == b'\n')
        .map_or(source.len(), |offset| symbol.end + offset);
    let line = &source[line_start..line_end];
    let leading = line.iter().position(|byte| !byte.is_ascii_whitespace())?;
    let extension = path.extension()?.to_str()?;
    let start = if extension == "py" {
        line_start + leading
    } else {
        symbol.start
    };
    let terminator = if extension == "py" { b':' } else { b'{' };
    let relative_end = source[start..line_end]
        .iter()
        .position(|byte| *byte == terminator)
        .unwrap_or(line_end - start);
    let mut end = start + relative_end;
    while end > start && source[end - 1].is_ascii_whitespace() {
        end -= 1;
    }
    (start < end).then_some(Span { start, end })
}

/// Find implements spans in TypeScript class declarations.
pub(super) fn implements_spans(source: &[u8], path: &Path) -> Vec<Span> {
    if path.extension().and_then(|value| value.to_str()) != Some("ts")
        && path.extension().and_then(|value| value.to_str()) != Some("tsx")
    {
        return Vec::new();
    }
    let mut spans = Vec::new();
    let mut offset = 0;
    for line in source.split_inclusive(|byte| *byte == b'\n') {
        let content = line.strip_suffix(b"\n").unwrap_or(line);
        let leading = content
            .iter()
            .position(|byte| !byte.is_ascii_whitespace())
            .unwrap_or(content.len());
        let trimmed = &content[leading..];
        if trimmed.starts_with(b"class ")
            && trimmed
                .windows(b" implements ".len())
                .any(|window| window == b" implements ")
        {
            let end = trimmed
                .iter()
                .position(|byte| *byte == b'{')
                .unwrap_or(trimmed.len());
            let mut end = offset + leading + end;
            while end > offset + leading && source[end - 1].is_ascii_whitespace() {
                end -= 1;
            }
            spans.push(Span {
                start: offset + leading,
                end,
            });
        }
        offset += line.len();
    }
    spans
}

/// Extract declaration name from text like "fn foo" or "function bar".
pub(super) fn declaration_name(text: &str) -> Option<String> {
    let value = text.trim();
    let value = value.strip_prefix("function ").unwrap_or(value);
    let name = value.split('(').next()?.trim();
    (!name.is_empty()).then(|| name.to_owned())
}
