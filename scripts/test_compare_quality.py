"""Synthetic gate tests; these are NOT CGRX/CBM measurements."""
import copy
import unittest

import compare_quality as gate


def fixture():
    rows = []
    for language in ['go', 'typescript', 'python', 'rust']:
        for negative in [False, True]:
            expected = [] if negative else ['file:target:10']
            snapshot = {'repo': '/repo/' + language, 'revision': 'a' * 40, 'source_digest': 'b' * 64}
            result = {'snapshot': snapshot, 'actual': expected, 'success': True,
                      'complete': True, 'latency_ms': [1, 2, 3], 'peak_rss_bytes': 100,
                      'response_tokens': 20}
            rows.append({'id': language + str(negative), 'language': language,
                         'split': 'heldout', 'snapshot': snapshot, 'expected': expected,
                         'cgrx': copy.deepcopy(result), 'cbm': copy.deepcopy(result)})
    rows[0]['cbm']['actual'] = []
    return {'schema_version': 1, 'environment': 'same-host-single-worker',
            'tokenizer': 'same-tokenizer-v1', 'engines': {
                'cgrx': {'version': 'new', 'mode': 'default'},
                'cbm': {'version': 'reference', 'mode': 'full'}}, 'cases': rows}


def evaluate(data):
    return gate.compare(data, minimum_cases=8, minimum_per_language=2, minimum_gain=0.005)


class ComparisonTests(unittest.TestCase):
    def test_duplicate_json_keys_invalid(self):
        with self.assertRaises(ValueError):
            gate.read_json('{"cases": [], "cases": [1]}')

    def test_json_nonfinite_constants_invalid(self):
        for literal in ['NaN', 'Infinity', '-Infinity']:
            with self.assertRaises(ValueError):
                gate.read_json('{"metric": ' + literal + '}')

    def test_real_improvement_passes(self):
        result = evaluate(fixture())
        self.assertTrue(result['passed'])
        self.assertEqual(result['quality']['cgrx']['fn'], 0)
        self.assertEqual(result['quality']['cbm']['fn'], 1)

    def test_tie_is_not_superiority(self):
        data = fixture(); data['cases'][0]['cbm']['actual'] = data['cases'][0]['expected']
        self.assertFalse(evaluate(data)['passed'])

    def test_one_language_regression_cannot_hide_in_aggregate(self):
        data = fixture(); data['cases'][2]['cgrx']['actual'] = []
        self.assertFalse(evaluate(data)['passed'])

    def test_negative_false_positive_fails(self):
        data = fixture(); data['cases'][1]['cgrx']['actual'] = ['bogus']
        self.assertFalse(evaluate(data)['passed'])

    def test_resource_regression_fails(self):
        for field, value in [('latency_ms', [100, 101, 102]), ('peak_rss_bytes', 101), ('response_tokens', 21)]:
            data = fixture(); data['cases'][0]['cgrx'][field] = value
            self.assertFalse(evaluate(data)['passed'], field)

    def test_mismatched_snapshot_invalid(self):
        for field in ['repo', 'revision', 'source_digest']:
            data = fixture(); data['cases'][0]['cbm']['snapshot'][field] = 'wrong'
            with self.assertRaises(ValueError): evaluate(data)

    def test_failed_or_truncated_collection_invalid(self):
        for engine in ['cgrx', 'cbm']:
            for field in ['success', 'complete']:
                data = fixture(); data['cases'][0][engine][field] = False
                with self.assertRaises(ValueError): evaluate(data)

    def test_duplicate_ids_or_records_invalid(self):
        data = fixture(); data['cases'].append(copy.deepcopy(data['cases'][0]))
        with self.assertRaises(ValueError): evaluate(data)
        data = fixture(); data['cases'][0]['cgrx']['actual'] *= 2
        with self.assertRaises(ValueError): evaluate(data)

    def test_bad_numbers_invalid(self):
        for value in [True, -1, float('nan'), float('inf')]:
            data = fixture(); data['cases'][0]['cgrx']['latency_ms'] = [value]
            with self.assertRaises(ValueError): evaluate(data)

    def test_missing_measurement_invalid(self):
        data = fixture(); del data['cases'][0]['cbm']['response_tokens']
        with self.assertRaises(ValueError): evaluate(data)

    def test_default_sample_gate_rejects_small_fixture(self):
        self.assertFalse(gate.compare(fixture())['passed'])

    def test_training_rows_do_not_count_for_heldout_gate(self):
        data = fixture(); data['cases'][0]['split'] = 'train'
        self.assertFalse(evaluate(data)['passed'])

    def test_missing_language_fails(self):
        data = fixture(); data['cases'] = data['cases'][:-2]
        self.assertFalse(evaluate(data)['passed'])

    def test_empty_positive_or_negative_stratum_fails(self):
        data = fixture()
        for row in data['cases']:
            row['expected'] = []; row['cgrx']['actual'] = []; row['cbm']['actual'] = []
        self.assertFalse(evaluate(data)['passed'])


if __name__ == '__main__': unittest.main()
