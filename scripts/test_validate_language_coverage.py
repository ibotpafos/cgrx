"""Regressions for the supported-language coverage contract."""
import copy
import json
from pathlib import Path
import unittest

import validate_language_coverage as coverage


ROOT=Path(__file__).resolve().parents[1]


class LanguageCoverageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.corpus=json.loads((ROOT/'contracts/real_tasks_v1.json').read_text())
        cls.contract=json.loads((ROOT/'contracts/language_coverage_v1.json').read_text())

    def invalid(self,contract=None,corpus=None):
        with self.assertRaises(ValueError):
            coverage.validate_coverage(contract or self.contract,corpus or self.corpus,ROOT)

    def test_complete_registered_matrix(self):
        self.assertEqual(coverage.validate_coverage(self.contract,self.corpus,ROOT),(7,10,40,40))

    def test_missing_relation_or_extension_cell_fails(self):
        contract=copy.deepcopy(self.contract); del contract['languages'][0]['cells']['tsx']['UNRESOLVED']; self.invalid(contract)
        contract=copy.deepcopy(self.contract); del contract['languages'][0]['cells']['tsx']; self.invalid(contract)

    def test_missing_wrong_relation_or_wrong_extension_task_fails(self):
        contract=copy.deepcopy(self.contract); contract['languages'][0]['cells']['tsx']['CALLS']=['missing']; self.invalid(contract)
        contract=copy.deepcopy(self.contract); contract['languages'][0]['cells']['tsx']['CALLS']=['pyramid-tsx-main-import-app']; self.invalid(contract)
        contract=copy.deepcopy(self.contract); contract['languages'][0]['cells']['tsx']['CALLS']=['vocal-chat-rooms-getRooms']; self.invalid(contract)

    def test_source_extension_or_registered_pack_drift_fails(self):
        contract=copy.deepcopy(self.contract); contract['languages'][0]['extensions']=['ts']; del contract['languages'][0]['cells']['tsx']; self.invalid(contract)
        contract=copy.deepcopy(self.contract); contract['languages'].pop(); self.invalid(contract)

    def test_registry_mismatch_names_missing_and_extra_modules(self):
        contract=copy.deepcopy(self.contract)
        contract['languages'][0]['module']='future_pack'
        contract['languages'][0]['id']='futurepack'
        contract['languages'][0]['source']='crates/cgrx-languages/src/typescript.rs'
        with self.assertRaisesRegex(ValueError, r"missing=\\['typescript'\\].*extra=\\['future_pack'\\]"):
            coverage.validate_coverage(contract,self.corpus,ROOT)


if __name__ == '__main__': unittest.main()
