use cgrx_capsule::{ContextWindow, merge_slices, slice_source};
use cgrx_core::ByteRange;

#[test]
fn overlapping_windows_merge_without_double_counting() {
    let source = b"one\ntwo\nthree\nfour\n";
    let slices = merge_slices(
        source,
        &[ByteRange::new(4, 7), ByteRange::new(8, 13)],
        ContextWindow::lines(1),
    );

    assert_eq!(slices.len(), 1);
    assert_eq!(slices[0].bytes, source);
    assert_eq!(slices[0].len(), source.len() as u64);
}

#[test]
fn utf8_midpoint_ranges_expand_to_codepoint_and_line_boundaries() {
    let source = "αβ\nnext\n".as_bytes();
    let slice = slice_source(source, ByteRange::new(1, 3), ContextWindow::lines(0));

    assert_eq!(slice.range, ByteRange::new(0, 5));
    assert_eq!(slice.bytes, "αβ\n".as_bytes());
}

#[test]
fn crlf_bytes_are_preserved_exactly() {
    let source = b"one\r\ntwo\r\nthree\r\n";
    let slices = merge_slices(source, &[ByteRange::new(6, 9)], ContextWindow::lines(1));

    assert_eq!(slices.len(), 1);
    assert_eq!(slices[0].range, ByteRange::new(0, source.len()));
    assert_eq!(slices[0].bytes, source);
}

#[test]
fn out_of_bounds_and_reversed_ranges_clamp_without_panicking() {
    let source = b"first\nlast";

    let beyond = slice_source(source, ByteRange::new(100, 200), ContextWindow::lines(0));
    let reversed = slice_source(source, ByteRange::new(9, 2), ContextWindow::lines(0));

    assert_eq!(beyond.range, ByteRange::new(source.len(), source.len()));
    assert!(beyond.bytes.is_empty());
    assert_eq!(reversed.range, ByteRange::new(9, 9));
    assert!(reversed.bytes.is_empty());
}
