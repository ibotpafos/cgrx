import unittest
from await_release_gates import ready, gpu_context
class Gates(unittest.TestCase):
    def test_exact_sha_and_newest_status(self):
        runs = [{'name': n, 'head_sha': 'candidate', 'conclusion': 'success'} for n in ['CI', 'PHP validation']]
        status = [{'context': 'alpha16/real-gpu', 'state': 'success'}]
        version = 'v0.1.0-alpha.16'
        self.assertTrue(ready(runs, status, 'candidate', version))
        self.assertFalse(ready(runs, status, 'other', version))
        self.assertFalse(ready(runs[:1], status, 'candidate', version))
        self.assertFalse(ready(runs, [], 'candidate', version))
        self.assertFalse(ready(runs, [{'context': 'alpha16/real-gpu', 'state': 'pending'}] + status, 'candidate', version))
        self.assertFalse(ready(runs, [{'context': 'alpha15/real-gpu', 'state': 'success'}], 'candidate', version))

    def test_context_is_derived_from_exact_release_version(self):
        self.assertEqual(gpu_context('v0.1.0-alpha.15'), 'alpha15/real-gpu')
        self.assertEqual(gpu_context('v0.1.0-alpha.16'), 'alpha16/real-gpu')
        with self.assertRaises(ValueError):
            gpu_context('v0.1.0')
