import tempfile
import unittest
from pathlib import Path

from scripts.validate_community import validate


REQUIRED_FILES = (
    "README.md",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "ROADMAP.md",
    "GOVERNANCE.md",
    ".github/ISSUE_TEMPLATE/bug.yml",
    ".github/ISSUE_TEMPLATE/missing-relationship.yml",
    ".github/ISSUE_TEMPLATE/feature.yml",
    ".github/ISSUE_TEMPLATE/config.yml",
    ".github/pull_request_template.md",
    "docs/contributing/first-issues/README.md",
)


class CommunityValidationTests(unittest.TestCase):
    def make_complete_repository(self, root: Path) -> None:
        common = "Safe public contribution documentation."
        for relative in REQUIRED_FILES:
            path = root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(common, encoding="utf-8")

        (root / "README.md").write_text(
            """# Project
## Who CGRX is for
## See the difference
## First useful result
Your source stays on your machine.
[Contributing](CONTRIBUTING.md)
[Discussions](https://github.com/ibotpafos/cgrx/discussions)
""",
            encoding="utf-8",
        )
        (root / "CONTRIBUTING.md").write_text(
            """# Contributing
## Prerequisites
## Setup
## Choosing and claiming work
## Verification
## Pull requests
## Review expectations
We target a first response within two business days.
## Privacy
Do not submit credentials, production logs, private source, or unredacted repository data.
## Resolver changes
""",
            encoding="utf-8",
        )
        (root / "CODE_OF_CONDUCT.md").write_text(
            "Contributor Covenant 2.1. Report conduct incidents privately using the contact in SECURITY.md.",
            encoding="utf-8",
        )
        (root / "GOVERNANCE.md").write_text(
            "Maintainer-led governance. Triage and maintainer roles are earned. First response target: two business days.",
            encoding="utf-8",
        )

        privacy = "Do not submit credentials, production logs, private source, or unredacted repository data."
        form = f"""name: Report
description: Structured report
body:
  - type: markdown
    attributes:
      value: {privacy}
Version, platform, reproducer, expected result, actual result, and coverage status are required.
"""
        for relative in (
            ".github/ISSUE_TEMPLATE/bug.yml",
            ".github/ISSUE_TEMPLATE/missing-relationship.yml",
            ".github/ISSUE_TEMPLATE/feature.yml",
        ):
            (root / relative).write_text(form, encoding="utf-8")

        (root / ".github/pull_request_template.md").write_text(
            "Linked issue, synthetic reproducer, coverage status, verification commands and results, privacy, AI assistance, rollback.",
            encoding="utf-8",
        )

        issue_dir = root / "docs/contributing/first-issues"
        for number in range(1, 9):
            labels = "good first issue" if number <= 5 else "help wanted"
            (issue_dir / f"{number:02d}-issue.md").write_text(
                f"""# Issue {number}
Labels: {labels}
Outcome: A bounded improvement.
## Why this matters
It improves onboarding.
## Scope
One documented change. Non-goal: core resolver changes.
## Acceptance criteria
- The documented behavior is reproducible.
## Verification
`python3 -m unittest scripts.test_validate_community -v`
Maintainer help: ask in the issue. Availability: unclaimed.
""",
                encoding="utf-8",
            )

    def test_reports_missing_required_files(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            errors = validate(Path(directory))
        self.assertTrue(any("missing required file: README.md" in error for error in errors))

    def test_rejects_placeholders(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.make_complete_repository(root)
            (root / "ROADMAP.md").write_text("TODO: decide later", encoding="utf-8")
            errors = validate(root)
        self.assertTrue(any("forbidden placeholder" in error for error in errors))

    def test_requires_privacy_warning(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.make_complete_repository(root)
            (root / "CONTRIBUTING.md").write_text("public contributions", encoding="utf-8")
            errors = validate(root)
        self.assertTrue(any("privacy warning" in error for error in errors))

    def test_requires_eight_drafts_and_five_beginner_tasks(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.make_complete_repository(root)
            for path in sorted((root / "docs/contributing/first-issues").glob("0[5-8]-*.md")):
                path.unlink()
            errors = validate(root)
        self.assertTrue(any("at least 8" in error for error in errors))
        self.assertTrue(any("at least 5" in error for error in errors))

    def test_requires_complete_draft_sections(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.make_complete_repository(root)
            (root / "docs/contributing/first-issues/01-issue.md").write_text(
                "Labels: good first issue\nOutcome: Incomplete", encoding="utf-8"
            )
            errors = validate(root)
        self.assertTrue(any("01-issue.md: missing draft field" in error for error in errors))

    def test_complete_fixture_passes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.make_complete_repository(root)
            errors = validate(root)
        self.assertEqual([], errors)

    def test_real_readme_has_activation_path(self) -> None:
        root = Path(__file__).resolve().parents[1]
        errors = validate(root)
        readme_errors = [error for error in errors if error.startswith("README.md:")]
        self.assertEqual([], readme_errors)

    def test_real_repository_has_contributor_contract(self) -> None:
        root = Path(__file__).resolve().parents[1]
        errors = validate(root)
        document_prefixes = (
            "CONTRIBUTING.md:",
            "CODE_OF_CONDUCT.md:",
            "GOVERNANCE.md:",
            "missing required file: CODE_OF_CONDUCT.md",
            "missing required file: ROADMAP.md",
            "missing required file: GOVERNANCE.md",
        )
        document_errors = [
            error for error in errors if error.startswith(document_prefixes)
        ]
        self.assertEqual([], document_errors)

    def test_real_repository_has_github_templates(self) -> None:
        root = Path(__file__).resolve().parents[1]
        errors = validate(root)
        template_errors = [
            error
            for error in errors
            if ".github/ISSUE_TEMPLATE/" in error
            or ".github/pull_request_template.md" in error
        ]
        self.assertEqual([], template_errors)

if __name__ == "__main__":
    unittest.main()
