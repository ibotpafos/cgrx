import unittest
from await_release_gates import ready
class Gates(unittest.TestCase):
    def test_exact_sha_and_newest_status(self):
        runs = [{'name': n, 'head_sha': 'candidate', 'conclusion': 'success'} for n in ['CI', 'PHP validation']]
        status = [{'context': 'alpha15/real-gpu', 'state': 'success'}]
        self.assertTrue(ready(runs, status, 'candidate'))
        self.assertFalse(ready(runs, status, 'other'))
        self.assertFalse(ready(runs[:1], status, 'candidate'))
        self.assertFalse(ready(runs, [], 'candidate'))
        self.assertFalse(ready(runs, [{'context': 'alpha15/real-gpu', 'state': 'pending'}] + status, 'candidate'))
