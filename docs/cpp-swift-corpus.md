# C++/Swift extension/relation coverage

28 explicitly synthetic TRAIN assertions cover six C++ suffixes and Swift, four
relations each: CALLS, IMPORTS, REFERENCE and UNRESOLVED. These parallel parser
cases are NOT independent heldout real-world benchmark results. Existing corpus
assertions and splits are unchanged. The full matrix has 9 languages, 17 suffixes
and 68 relation cells.

Source truth is in contracts/fixtures/cpp-swift. The function-pointer/closure
cases intentionally have no concrete callee. Imports assert module dependencies,
not call bindings. Every declaration/site was read independently of graph output.

`python3 scripts/validate_cpp_swift_corpus.py` materializes the portable repo slot
in a disposable Git repository at a deterministic, pinned commit; the existing
validator rechecks every file/span SHA, source/site relation and train split.
No network, local developer checkout, generated graph answers or bypass is used.
Run the test_validate_*.py suite for full structural and provenance regressions.
