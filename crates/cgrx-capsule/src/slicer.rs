use cgrx_core::ByteRange;

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct ContextWindow {
    lines: usize,
}

impl ContextWindow {
    #[must_use]
    pub const fn lines(lines: usize) -> Self {
        Self { lines }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SourceSlice {
    pub range: ByteRange,
    pub bytes: Vec<u8>,
}

impl SourceSlice {
    #[must_use]
    pub fn len(&self) -> u64 {
        self.bytes.len() as u64
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.bytes.is_empty()
    }
}

#[must_use]
pub fn slice_source(source: &[u8], requested: ByteRange, window: ContextWindow) -> SourceSlice {
    let mut start = requested.start.min(source.len());
    let mut end = requested.end.min(source.len()).max(start);
    start = clamp_start_to_utf8(source, start);
    end = clamp_end_to_utf8(source, end);

    if start == end {
        return SourceSlice {
            range: ByteRange::new(start, end),
            bytes: Vec::new(),
        };
    }

    start = line_start(source, start);
    end = line_end(source, end);
    for _ in 0..window.lines {
        start = previous_line_start(source, start);
        end = next_line_end(source, end);
    }

    SourceSlice {
        range: ByteRange::new(start, end),
        bytes: source[start..end].to_vec(),
    }
}

#[must_use]
pub fn merge_slices(
    source: &[u8],
    ranges: &[ByteRange],
    window: ContextWindow,
) -> Vec<SourceSlice> {
    let mut expanded: Vec<_> = ranges
        .iter()
        .copied()
        .map(|range| slice_source(source, range, window))
        .filter(|slice| !slice.is_empty())
        .collect();
    expanded.sort_by_key(|slice| (slice.range.start, slice.range.end));

    let mut merged: Vec<SourceSlice> = Vec::new();
    for slice in expanded {
        if let Some(previous) = merged.last_mut()
            && slice.range.start <= previous.range.end
        {
            previous.range.end = previous.range.end.max(slice.range.end);
            previous.bytes = source[previous.range.start..previous.range.end].to_vec();
            continue;
        }
        merged.push(slice);
    }
    merged
}

fn clamp_start_to_utf8(source: &[u8], mut position: usize) -> usize {
    while position > 0 && position < source.len() && is_utf8_continuation(source[position]) {
        position -= 1;
    }
    position
}

fn clamp_end_to_utf8(source: &[u8], mut position: usize) -> usize {
    while position < source.len() && is_utf8_continuation(source[position]) {
        position += 1;
    }
    position
}

const fn is_utf8_continuation(byte: u8) -> bool {
    byte & 0b1100_0000 == 0b1000_0000
}

fn line_start(source: &[u8], position: usize) -> usize {
    source[..position]
        .iter()
        .rposition(|byte| *byte == b'\n')
        .map_or(0, |index| index + 1)
}

fn line_end(source: &[u8], position: usize) -> usize {
    source[position..]
        .iter()
        .position(|byte| *byte == b'\n')
        .map_or(source.len(), |index| position + index + 1)
}

fn previous_line_start(source: &[u8], current_start: usize) -> usize {
    if current_start == 0 {
        return 0;
    }
    line_start(source, current_start.saturating_sub(1))
}

fn next_line_end(source: &[u8], current_end: usize) -> usize {
    if current_end >= source.len() {
        return source.len();
    }
    line_end(source, current_end)
}
