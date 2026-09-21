import unittest
import runpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class ReleaseInventoryAlpha10D(unittest.TestCase):
    def test_release_inventory(self):
        module = runpy.run_path(str(ROOT / "scripts" / "release_inventory_check.py"))
        self.assertEqual(module["main"](), 0)

if __name__ == "__main__":
    unittest.main()
