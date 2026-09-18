import copy
import json
from pathlib import Path
import tempfile
import unittest

from validate_php_validation import load, validate


class PhpValidationMatrixTests(unittest.TestCase):
    def setUp(self):
        self.manifest = load()

    def rejects(self, mutate):
        changed = copy.deepcopy(self.manifest)
        mutate(changed)
        with self.assertRaises(ValueError):
            validate(changed)

    def test_local_matrix_has_six_extensions_and_24_source_cells(self):
        self.assertEqual(validate(self.manifest), (6, 24))

    def test_missing_duplicate_and_reordered_extensions_are_rejected(self):
        self.rejects(lambda doc: doc['cases'].pop())
        self.rejects(lambda doc: doc['cases'].append(doc['cases'][0]))
        self.rejects(lambda doc: doc['cases'].reverse())

    def test_source_hash_and_endpoint_tampering_are_rejected(self):
        self.rejects(lambda doc: doc['cases'][0].update(sha256='00' * 32))
        self.rejects(lambda doc: doc['cases'][0]['caller'].update(symbol='Other'))
        self.rejects(lambda doc: doc['cases'][0]['target']['span'].update(start=0))
        self.rejects(lambda doc: doc['cases'][0].update(path='../other.php'))

    def test_missing_cells_and_invented_unresolved_target_are_rejected(self):
        self.rejects(lambda doc: doc['cases'][0]['cells'].pop('REFERENCE'))
        self.rejects(lambda doc: doc['cases'][0]['cells']['UNRESOLVED'].update(target='Helper'))
        self.rejects(lambda doc: doc['cases'][0]['cells']['CALLS'].update(target='Other'))

    def test_invalid_byte_bounds_and_nonexperimental_claims_are_rejected(self):
        for value in [-1, True, 10**9]:
            self.rejects(lambda doc: doc['cases'][0]['cells']['CALLS']['span'].update(start=value))
        self.rejects(lambda doc: doc.update(maturity='production'))

    def test_duplicate_json_keys_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'matrix.json'
            path.write_text('{"schema_version":1,"schema_version":1}')
            with self.assertRaisesRegex(ValueError, 'duplicate JSON key'):
                load(path)
            path.write_text(json.dumps(self.manifest))
            self.assertEqual(validate(load(path)), (6, 24))


if __name__ == '__main__':
    unittest.main()
