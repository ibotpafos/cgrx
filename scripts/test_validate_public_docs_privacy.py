"""Regression checks for publishing-safe documentation."""

from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_TEXT_SUFFIXES = {
    ".css",
    ".html",
    ".js",
    ".json",
    ".md",
    ".py",
    ".rs",
    ".sh",
    ".toml",
    ".ts",
    ".tsx",
    ".yaml",
    ".yml",
}
PUBLIC_TEXT_FILES = sorted(
    path
    for path in ROOT.rglob("*")
    if path.is_file()
    and path.suffix in PUBLIC_TEXT_SUFFIXES
    and not any(part in {".git", ".worktrees", "node_modules", "target"} for part in path.parts)
)
ARCHITECTURE_BENCHMARKS = (
    ROOT / "docs/benchmarks/architecture-communities-2026-09-07.md",
    ROOT / "docs/benchmarks/architecture-futures-2026-09-07.md",
)
PATCH_EVALUATION_REPORT = ROOT / "docs/agent-patch-evaluation.md"
PRIVATE_CORPUS_LABELS = tuple(f"Private corpus {letter}" for letter in "ABCD")


class PublicDocsPrivacyTests(unittest.TestCase):
    def test_public_text_has_no_machine_specific_paths(self):
        forbidden = re.compile(r"(?:/(?:Users|Volumes)/[^\s`]+|[A-Za-z]:\\Users\\[^\s`]+)")
        violations = []
        for path in PUBLIC_TEXT_FILES:
            for line_number, line in enumerate(path.read_text().splitlines(), 1):
                if forbidden.search(line):
                    violations.append(f"{path.relative_to(ROOT)}:{line_number}")
        self.assertEqual(violations, [], "machine-specific paths: " + ", ".join(violations))

    def test_private_architecture_corpora_use_stable_aliases(self):
        for path in ARCHITECTURE_BENCHMARKS:
            text = path.read_text()
            for label in PRIVATE_CORPUS_LABELS:
                self.assertIn(f"| {label} |", text, path.relative_to(ROOT))
            self.assertIn("<path-to-private-corpus-a>", text, path.relative_to(ROOT))
            self.assertIn("<path-to-private-corpus-d>", text, path.relative_to(ROOT))

    def test_patch_evaluation_report_does_not_embed_local_evidence(self):
        self.assertTrue(PATCH_EVALUATION_REPORT.is_file())
        text = PATCH_EVALUATION_REPORT.read_text()
        self.assertNotRegex(text, r"(?:/(?:Users|Volumes)/[^\s`]+|[A-Za-z]:\\Users\\[^\s`]+)")
        self.assertNotIn("diff --git ", text)
        self.assertNotIn("BEGIN PRIVATE", text)


if __name__ == "__main__":
    unittest.main()
