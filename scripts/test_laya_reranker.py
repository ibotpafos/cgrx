"""Tests for the optional Laya sidecar without loading model weights."""

import importlib.util
from pathlib import Path
import unittest


SCRIPT = Path(__file__).with_name("laya_reranker.py")
SPEC = importlib.util.spec_from_file_location("laya_reranker", SCRIPT)
laya_reranker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(laya_reranker)


class FakeRouter:
    def __init__(self):
        self.last = None

    def predict(self, state, questions, model=None):
        self.last = (state, questions, model)
        return {
            "answers": {
                key: {"noul": 0.91 if key == "22" else 0.12}
                for key in questions
            }
        }


class LayaRerankerTests(unittest.TestCase):
    def payload(self):
        return {
            "schema": laya_reranker.SCHEMA,
            "task": "найди обработчик платежа",
            "candidates": [
                {
                    "node_id": 11,
                    "qualified_name": "noise",
                    "path": "src/noise.rs",
                    "text": "fn noise() {}",
                },
                {
                    "node_id": 22,
                    "qualified_name": "payment_handler",
                    "path": "src/payment.rs",
                    "text": "fn payment_handler() {}",
                },
            ],
        }

    def test_scores_each_candidate_and_preserves_ids(self):
        router = FakeRouter()
        result = laya_reranker.score_request(router, self.payload())
        self.assertEqual(result["schema"], laya_reranker.SCHEMA)
        self.assertEqual(
            result["scores"],
            [
                {"node_id": 11, "relevance": 120},
                {"node_id": 22, "relevance": 910},
            ],
        )
        state, questions, model = router.last
        self.assertEqual(state, "найди обработчик платежа")
        self.assertIsNone(model)
        self.assertIn("payment_handler", questions["22"]["instructions"])

    def test_rejects_duplicate_nodes_and_oversized_candidate_sets(self):
        payload = self.payload()
        payload["candidates"][1]["node_id"] = 11
        with self.assertRaises(ValueError):
            laya_reranker.validate_request(payload)

        payload = self.payload()
        payload["candidates"] = payload["candidates"] * 7
        for index, candidate in enumerate(payload["candidates"]):
            candidate = dict(candidate)
            candidate["node_id"] = index
            payload["candidates"][index] = candidate
        with self.assertRaises(ValueError):
            laya_reranker.validate_request(payload)


if __name__ == "__main__":
    unittest.main()
