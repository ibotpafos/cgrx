#!/usr/bin/env python3
"""Validate the public contributor contract without network access."""

from __future__ import annotations

import re
import sys
from pathlib import Path


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

PLACEHOLDER_PATTERN = re.compile(r"\b(?:TBD|TODO|FIXME|XXX)\b|example@example\.com", re.I)
PRIVACY_TERMS = ("credentials", "production logs", "private source", "unredacted repository data")
DRAFT_FIELDS = (
    "Labels:",
    "Outcome:",
    "## Why this matters",
    "## Scope",
    "## Acceptance criteria",
    "## Verification",
)
README_MARKERS = (
    "## Who CGRX is for",
    "## See the difference",
    "## First useful result",
    "stays on your machine",
    "CONTRIBUTING.md",
    "github.com/ibotpafos/cgrx/discussions",
)
CONTRIBUTING_MARKERS = (
    "## Prerequisites",
    "## Setup",
    "## Choosing and claiming work",
    "## Verification",
    "## Pull requests",
    "## Review expectations",
    "two business days",
    "## Privacy",
    "## Resolver changes",
)


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _require_markers(relative: str, content: str, markers: tuple[str, ...]) -> list[str]:
    return [f"{relative}: missing required marker: {marker}" for marker in markers if marker not in content]


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    existing: dict[str, str] = {}

    for relative in REQUIRED_FILES:
        path = root / relative
        if not path.is_file():
            errors.append(f"missing required file: {relative}")
            continue
        content = _read(path)
        existing[relative] = content
        match = PLACEHOLDER_PATTERN.search(content)
        if match:
            errors.append(f"{relative}: forbidden placeholder: {match.group(0)}")

    readme = existing.get("README.md")
    if readme is not None:
        errors.extend(_require_markers("README.md", readme, README_MARKERS))

    contributing = existing.get("CONTRIBUTING.md")
    if contributing is not None:
        errors.extend(_require_markers("CONTRIBUTING.md", contributing, CONTRIBUTING_MARKERS))
        missing_privacy = [term for term in PRIVACY_TERMS if term not in contributing.lower()]
        if missing_privacy:
            errors.append("CONTRIBUTING.md: missing privacy warning terms: " + ", ".join(missing_privacy))

    conduct = existing.get("CODE_OF_CONDUCT.md")
    if conduct is not None:
        errors.extend(
            _require_markers("CODE_OF_CONDUCT.md", conduct, ("Contributor Covenant 2.1", "SECURITY.md"))
        )

    governance = existing.get("GOVERNANCE.md")
    if governance is not None:
        errors.extend(
            _require_markers(
                "GOVERNANCE.md", governance.lower(), ("two business days", "triage", "maintainer")
            )
        )

    issue_forms = (
        ".github/ISSUE_TEMPLATE/bug.yml",
        ".github/ISSUE_TEMPLATE/missing-relationship.yml",
        ".github/ISSUE_TEMPLATE/feature.yml",
    )
    form_markers = ("name:", "description:", "body:")
    for relative in issue_forms:
        content = existing.get(relative)
        if content is None:
            continue
        errors.extend(_require_markers(relative, content, form_markers))
        missing_privacy = [term for term in PRIVACY_TERMS if term not in content.lower()]
        if missing_privacy:
            errors.append(f"{relative}: missing privacy warning terms: " + ", ".join(missing_privacy))

    pr_template = existing.get(".github/pull_request_template.md")
    if pr_template is not None:
        errors.extend(
            _require_markers(
                ".github/pull_request_template.md",
                pr_template.lower(),
                (
                    "linked issue",
                    "synthetic reproducer",
                    "coverage status",
                    "verification commands",
                    "privacy",
                    "ai assistance",
                    "rollback",
                ),
            )
        )

    draft_dir = root / "docs/contributing/first-issues"
    drafts = sorted(path for path in draft_dir.glob("*.md") if path.name != "README.md")
    if len(drafts) < 8:
        errors.append(f"first-issue backlog requires at least 8 drafts; found {len(drafts)}")

    beginner_count = 0
    for path in drafts:
        content = _read(path)
        if PLACEHOLDER_PATTERN.search(content):
            errors.append(f"{path.name}: forbidden placeholder")
        for field in DRAFT_FIELDS:
            if field not in content:
                errors.append(f"{path.name}: missing draft field: {field}")
        label_line = next((line for line in content.splitlines() if line.startswith("Labels:")), "")
        if "good first issue" in label_line.lower():
            beginner_count += 1

    if beginner_count < 5:
        errors.append(f"first-issue backlog requires at least 5 good first issue drafts; found {beginner_count}")

    return errors


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    errors = validate(root)
    if errors:
        print("community readiness contract: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1
    print("community readiness contract: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
