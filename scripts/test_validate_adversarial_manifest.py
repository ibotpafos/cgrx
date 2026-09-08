"""Regressions for the adversarial fixture manifest."""
import copy
import json
from pathlib import Path
import unittest

import validate_adversarial_manifest as manifest_validator


ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures" / "adversarial"


class AdversarialManifestTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads((FIXTURES / "manifest.json").read_text())

    def test_manifest_covers_every_frozen_case_with_current_hashes(self):
        self.assertEqual(
            manifest_validator.validate_manifest(self.manifest, FIXTURES),
            len(list((FIXTURES / "cases").glob("*/gold.json"))),
        )

    def test_missing_duplicate_and_stale_entries_fail(self):
        missing = copy.deepcopy(self.manifest)
        missing["cases"].pop()
        with self.assertRaises(ValueError):
            manifest_validator.validate_manifest(missing, FIXTURES)

        duplicate = copy.deepcopy(self.manifest)
        duplicate["cases"].append(copy.deepcopy(duplicate["cases"][0]))
        with self.assertRaises(ValueError):
            manifest_validator.validate_manifest(duplicate, FIXTURES)

        stale = copy.deepcopy(self.manifest)
        stale["cases"][0]["sha256"] = "0" * 64
        with self.assertRaises(ValueError):
            manifest_validator.validate_manifest(stale, FIXTURES)


if __name__ == "__main__":
    unittest.main()
