"""Release metadata consistency checks; no network access."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
VERSION = (ROOT / "RELEASE_VERSION").read_text().strip()

class ReleaseMetadataTests(unittest.TestCase):
    def test_version_shape_and_workspace_package(self):
        self.assertRegex(VERSION, r"^v\d+\.\d+\.\d+-alpha\.\d+$")

        workspace_manifest = (ROOT / "Cargo.toml").read_text()
        workspace_package = workspace_manifest.split("[workspace.package]", 1)[1]
        workspace_package = workspace_package.split("\n[", 1)[0]
        workspace_version = re.search(
            r'^version = "([^"]+)"$',
            workspace_package,
            re.M,
        )
        self.assertIsNotNone(workspace_version)

        cli_manifest = (ROOT / "crates/cgrx-cli/Cargo.toml").read_text()
        self.assertRegex(cli_manifest, r"(?m)^version\.workspace = true$")
        self.assertTrue(VERSION.startswith("v" + workspace_version.group(1) + "-"))


    def test_installer_defaults_to_release(self):
        installer = (ROOT / "install.sh").read_text()
        self.assertIn(f"version=${{CGRX_VERSION:-{VERSION}}}", installer)
        self.assertIn(f"CGRX_VERSION={VERSION}", installer)

    def test_public_install_docs_pin_release(self):
        readme = (ROOT / "README.md").read_text()
        install_doc = (ROOT / "docs/installation.md").read_text()
        for text in (readme, install_doc):
            self.assertIn(f"/{VERSION}/install.sh", text)
            self.assertIn(VERSION, text)
        self.assertIn(f"git checkout {VERSION}", readme)
        self.assertIn(f"git checkout {VERSION}", install_doc)

    def test_release_notes_exist_for_exact_version(self):
        notes = ROOT / ".github" / "release-notes" / f"{VERSION}.md"
        self.assertTrue(notes.is_file())
        self.assertIn(VERSION, notes.read_text())

if __name__ == "__main__":
    unittest.main()
