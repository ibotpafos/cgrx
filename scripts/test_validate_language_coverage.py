"""Regressions for the supported-language coverage contract."""
import copy
import json
from pathlib import Path
import unittest
from unittest.mock import patch

import validate_language_coverage as coverage


ROOT = Path(__file__).resolve().parents[1]


class LanguageCoverageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.corpus = json.loads((ROOT / 'contracts/real_tasks_v1.json').read_text())
        cls.contract = json.loads((ROOT / 'contracts/language_coverage_v1.json').read_text())

    def invalid(self, contract=None, corpus=None):
        with self.assertRaises(ValueError):
            coverage.validate_coverage(
                self.contract if contract is None else contract,
                self.corpus if corpus is None else corpus,
                ROOT,
            )

    def test_complete_registered_matrix(self):
        self.assertEqual(coverage.validate_coverage(self.contract, self.corpus, ROOT), (7, 10, 40, 40))

    def test_missing_relation_or_extension_cell_fails(self):
        contract = copy.deepcopy(self.contract)
        del contract['languages'][0]['cells']['tsx']['UNRESOLVED']
        self.invalid(contract)
        contract = copy.deepcopy(self.contract)
        del contract['languages'][0]['cells']['tsx']
        self.invalid(contract)

    def test_missing_wrong_relation_or_wrong_extension_task_fails(self):
        for task in ('missing', 'pyramid-tsx-main-import-app', 'vocal-chat-rooms-getRooms'):
            with self.subTest(task=task):
                contract = copy.deepcopy(self.contract)
                contract['languages'][0]['cells']['tsx']['CALLS'] = [task]
                self.invalid(contract)

    def test_source_extension_or_registered_pack_drift_fails(self):
        contract = copy.deepcopy(self.contract)
        contract['languages'][0]['extensions'] = ['ts']
        del contract['languages'][0]['cells']['tsx']
        self.invalid(contract)
        contract = copy.deepcopy(self.contract)
        contract['languages'].pop()
        self.invalid(contract)

    def test_registry_mismatch_names_missing_and_extra_modules(self):
        contract = copy.deepcopy(self.contract)
        # Keep id/source consistent, otherwise the id guard rejects this before
        # registry equality is ever exercised.
        contract['languages'][0]['module'] = 'future_pack'
        with self.assertRaises(ValueError) as error:
            coverage.validate_coverage(contract, self.corpus, ROOT)
        self.assertEqual(
            str(error.exception),
            "registered language packs differ from coverage contract: "
            "missing=['typescript'] extra=['future_pack']",
        )

    def test_newly_registered_pack_requires_a_coverage_contract(self):
        read_text = Path.read_text
        registry = ROOT / 'crates/cgrx-languages/src/pack.rs'

        def read_with_new_registration(path, *args, **kwargs):
            contents = read_text(path, *args, **kwargs)
            if path == registry:
                contents = contents.replace(
                    '&crate::c::C_PACK as &dyn LanguagePack,',
                    '&crate::future_pack::FUTURE_PACK as &dyn LanguagePack,\n'
                    '        &crate::c::C_PACK as &dyn LanguagePack,',
                )
            return contents

        with patch.object(Path, 'read_text', read_with_new_registration):
            with self.assertRaises(ValueError) as error:
                coverage.validate_coverage(self.contract, self.corpus, ROOT)
        self.assertEqual(
            str(error.exception),
            "registered language packs differ from coverage contract: "
            "missing=['future_pack'] extra=[]",
        )


if __name__ == '__main__':
    unittest.main()
