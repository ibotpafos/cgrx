import unittest
import runpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class ReleaseInventoryAlpha10C(unittest.TestCase):
    def test_release_inventory(self):
        runpy.run_path(str(ROOT / "scripts" / "release_inventory_check.py"), run_name="__main__")

if __name__ == "__main__":
    unittest.main()
