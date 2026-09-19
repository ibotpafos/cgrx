"""Static release hygiene checks without network access."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    version = (ROOT / "RELEASE_VERSION").read_text().strip()
    if not re.fullmatch(r"v\d+\.\d+\.\d+-alpha\.\d+", version):
        raise SystemExit("invalid release version")
    for path in [ROOT / "install.sh", ROOT / "README.md", ROOT / "docs" / "installation.md"]:
        if version not in path.read_text():
            raise SystemExit(f"missing version in {path}")
    if not (ROOT / ".github" / "release-notes" / f"{version}.md").exists():
        raise SystemExit("missing release notes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
