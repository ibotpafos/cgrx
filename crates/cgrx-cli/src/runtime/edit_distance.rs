//! Bounded Unicode-scalar edit distance for fuzzy symbol discovery.

const MAX_DISTANCE: usize = 3;
const BAND_WIDTH: usize = 2 * MAX_DISTANCE + 1;

/// Exact Unicode-scalar Levenshtein distance when it does not exceed the limit.
///
/// The caller lowercases both operands before comparison, caches `query` only
/// when needed, and guarantees `max_distance <= 3`. Input characters stream;
/// two seven-cell stack rows hold only columns within the active edit band.
///
/// A path costing at most k edits cannot leave |row - column| <= k. Cells
/// outside that band or costing more than k use the sentinel k + 1. If every
/// active cell in a row exceeds k, no completion can meet the limit. This
/// preserves exact distances within the limit with O(k) scratch and at most
/// 2k + 1 cells per input character, without allocating input characters.
pub(super) fn bounded_levenshtein(
    value: &str,
    query: &[char],
    max_distance: usize,
) -> Option<usize> {
    debug_assert!(max_distance <= MAX_DISTANCE);
    let infinity = max_distance + 1;
    let mut previous = [infinity; BAND_WIDTH];
    let mut previous_start = 0;
    let mut previous_end = query.len().min(max_distance);
    for (column, cell) in previous.iter_mut().enumerate().take(previous_end + 1) {
        *cell = column;
    }

    let mut row = 0_usize;
    for character in value.chars() {
        row += 1;
        if row > query.len().saturating_add(max_distance) {
            return None;
        }
        let start = row.saturating_sub(max_distance);
        let end = query.len().min(row.saturating_add(max_distance));
        let mut current = [infinity; BAND_WIDTH];
        let mut row_minimum = infinity;
        for column in start..=end {
            let distance = if column == 0 {
                row.min(infinity)
            } else {
                let deletion =
                    band_cell(&previous, previous_start, previous_end, column, infinity) + 1;
                let insertion = if column > start {
                    current[column - start - 1] + 1
                } else {
                    infinity
                };
                let substitution = band_cell(
                    &previous,
                    previous_start,
                    previous_end,
                    column - 1,
                    infinity,
                ) + usize::from(character != query[column - 1]);
                deletion.min(insertion).min(substitution).min(infinity)
            };
            current[column - start] = distance;
            row_minimum = row_minimum.min(distance);
        }
        if row_minimum > max_distance {
            return None;
        }
        previous = current;
        previous_start = start;
        previous_end = end;
    }

    let distance = band_cell(
        &previous,
        previous_start,
        previous_end,
        query.len(),
        infinity,
    );
    (distance <= max_distance).then_some(distance)
}

fn band_cell(
    cells: &[usize; BAND_WIDTH],
    start: usize,
    end: usize,
    column: usize,
    infinity: usize,
) -> usize {
    if (start..=end).contains(&column) {
        cells[column - start]
    } else {
        infinity
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn words(alphabet: &[char], max_length: usize) -> Vec<String> {
        let mut all = vec![String::new()];
        let mut previous = vec![String::new()];
        for _ in 0..max_length {
            let mut next = Vec::new();
            for prefix in &previous {
                for character in alphabet {
                    let mut word = prefix.clone();
                    word.push(*character);
                    next.push(word);
                }
            }
            all.extend(next.iter().cloned());
            previous = next;
        }
        all
    }

    #[test]
    fn exhaustive_short_string_parity_with_existing_levenshtein() {
        let strings = words(&['a', 'b', 'é', '\u{307}'], 4);
        assert_eq!(strings.len(), 341);
        let mut comparisons = 0;
        for query in &strings {
            let query_chars: Vec<_> = query.chars().collect();
            for value in &strings {
                let expected = levenshtein::levenshtein(value, query);
                for max_distance in 0..=MAX_DISTANCE {
                    assert_eq!(
                        bounded_levenshtein(value, &query_chars, max_distance),
                        (expected <= max_distance).then_some(expected),
                        "value={value:?}, query={query:?}, k={max_distance}"
                    );
                    comparisons += 1;
                }
            }
        }
        assert_eq!(comparisons, 465_124);
    }

    #[test]
    fn unicode_scalar_edits_and_transpositions_have_standard_costs() {
        for (value, query, expected) in [
            ("", "", 0),
            ("", "abc", 3),
            ("abc", "", 3),
            ("", "abcd", 4),
            ("abcd", "", 4),
            ("ab", "ba", 2),
            ("abcd", "acbd", 2),
            ("汉字猫", "汉字狗", 1),
            ("汉字", "汉猫字", 1),
            ("漢猫字", "漢字", 1),
            ("😀a", "a😀", 2),
            ("café", "cafe\u{301}", 2),
            ("i\u{307}stanbul", "istanbul", 1),
            ("straße", "strasse", 2),
            ("http2", "http12", 1),
            ("абв", "абг", 1),
        ] {
            assert_eq!(levenshtein::levenshtein(value, query), expected);
            let query_chars: Vec<_> = query.chars().collect();
            for max_distance in 0..=MAX_DISTANCE {
                assert_eq!(
                    bounded_levenshtein(value, &query_chars, max_distance),
                    (expected <= max_distance).then_some(expected),
                    "value={value:?}, query={query:?}, k={max_distance}"
                );
            }
        }
    }

    #[test]
    fn caller_lowercasing_retains_expanding_unicode_mappings() {
        for (value, query, expected) in [
            ("İSTANBUL", "İstanbul", 0),
            ("İstanbul", "istanbul", 1),
            ("CAFÉ", "café", 0),
            ("Обработка", "ОБРАБОТКА", 0),
            ("STRAẞE", "straße", 0),
            ("STRASSE", "Straße", 2),
        ] {
            let value = value.to_lowercase();
            let query = query.to_lowercase();
            assert_eq!(levenshtein::levenshtein(&value, &query), expected);
            let query_chars: Vec<_> = query.chars().collect();
            for max_distance in 0..=MAX_DISTANCE {
                assert_eq!(
                    bounded_levenshtein(&value, &query_chars, max_distance),
                    (expected <= max_distance).then_some(expected)
                );
            }
        }
    }

    #[test]
    fn long_identifiers_keep_exact_hit_distance_and_reject_misses() {
        let query = vec!['a'; 16_000];
        for max_distance in 0..=MAX_DISTANCE {
            for length in 15_996_usize..=16_004 {
                let distance = length.abs_diff(query.len());
                assert_eq!(
                    bounded_levenshtein(&"a".repeat(length), &query, max_distance),
                    (distance <= max_distance).then_some(distance)
                );
            }
            assert_eq!(
                bounded_levenshtein(&"b".repeat(16_000), &query, max_distance),
                None
            );
            assert_eq!(
                bounded_levenshtein(&format!("b{}", "a".repeat(15_999)), &query, max_distance),
                (max_distance >= 1).then_some(1)
            );
            assert_eq!(
                bounded_levenshtein(&format!("{}b", "a".repeat(15_999)), &query, max_distance),
                (max_distance >= 1).then_some(1)
            );
            assert_eq!(
                bounded_levenshtein(&format!("a{}a", "b".repeat(15_998)), &query, max_distance),
                None
            );
        }
        let mut three_substitutions = query.clone();
        for index in [0, 8_000, 15_999] {
            three_substitutions[index] = 'b';
        }
        let three_substitutions: String = three_substitutions.iter().collect();
        assert_eq!(
            bounded_levenshtein(&three_substitutions, &query, 3),
            Some(3)
        );
        assert_eq!(bounded_levenshtein(&three_substitutions, &query, 2), None);
    }
}
