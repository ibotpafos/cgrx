import json
from pathlib import Path
import re
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ReleaseIdentityTests(unittest.TestCase):
    def test_every_cgrx_package_and_installer_advertise_one_release_version(self):
        metadata = subprocess.run(
            [
                "cargo",
                "+1.89.0",
                "metadata",
                "--no-deps",
                "--format-version",
                "1",
                "--locked",
                "--offline",
            ],
            cwd=ROOT,
            check=True,
            text=True,
            capture_output=True,
            timeout=30,
        )
        packages = json.loads(metadata.stdout)["packages"]
        versions = {
            package["name"]: package["version"]
            for package in packages
            if package["name"].startswith("cgrx-")
        }
        self.assertTrue(versions)
        self.assertEqual(len(set(versions.values())), 1, versions)

        installer = subprocess.run(
            ["sh", str(ROOT / "install.sh"), "--help"],
            check=True,
            text=True,
            capture_output=True,
            timeout=10,
        )
        match = re.search(r"(?:^|\s)CGRX_VERSION=v([^\s]+)", installer.stdout)
        self.assertIsNotNone(match, installer.stdout)
        self.assertEqual(match.group(1), next(iter(versions.values())))


if __name__ == "__main__":
    unittest.main()
