#!/usr/bin/env python3
"""Validate that every adversarial gold file is pinned exactly once."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys


def require(value, message):
    if not value:
        raise ValueError(message)


def validate_manifest(manifest, fixture_root):
    require(isinstance(manifest, dict) and set(manifest) == {"cases", "version"}, "invalid manifest fields")
    require(manifest["version"] == 1, "unsupported manifest version")
    require(isinstance(manifest["cases"], list), "manifest cases must be a list")

    fixture_root = Path(fixture_root).resolve()
    expected = {
        path.relative_to(fixture_root).as_posix()
        for path in (fixture_root / "cases").glob("*/gold.json")
    }
    seen = set()
    for case in manifest["cases"]:
        require(isinstance(case, dict) and set(case) == {"path", "sha256"}, "invalid case fields")
        relative = Path(case["path"])
        require(not relative.is_absolute() and ".." not in relative.parts, "unsafe case path")
        path = fixture_root / relative
        require(path.resolve() == path and path.is_file(), "case file unavailable")
        require(relative.as_posix() not in seen, "duplicate case path")
        seen.add(relative.as_posix())
        digest = case["sha256"]
        require(isinstance(digest, str) and re.fullmatch(r"[0-9a-f]{64}", digest), "invalid case hash")
        require(hashlib.sha256(path.read_bytes()).hexdigest() == digest, "stale case hash")

    require(seen == expected, "manifest does not match frozen cases")
    return len(seen)


def main():
    root = Path(__file__).resolve().parents[1] / "fixtures" / "adversarial"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", nargs="?", type=Path, default=root / "manifest.json")
    args = parser.parse_args()
    try:
        manifest = json.loads(args.manifest.read_text())
        count = validate_manifest(manifest, args.manifest.resolve().parent)
    except (OSError, ValueError, TypeError, json.JSONDecodeError) as exc:
        print("INVALID: " + str(exc), file=sys.stderr)
        return 1
    print(f"VALID adversarial_cases={count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
