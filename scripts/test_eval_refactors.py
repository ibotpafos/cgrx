import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from eval_refactors import build_report, validate_contract


REVISION = "a" * 40


def contract(repo="/tmp/example"):
    return {
        "schema_version": 1,
        "method": "bounded suggest_refactors over frozen repositories",
        "min_score": 760,
        "limit": 50,
        "projects": [
            {
                "id": "example",
                "repo": repo,
                "revision": REVISION,
                "scope": "src/**",
                "candidates": [
                    {
                        "id": "example:refactor1.abc",
                        "left": {
                            "path": "src/a.rs",
                            "symbol": "a",
                            "node_id": 1,
                            "span": {"start": 1, "end": 2},
                        },
                        "right": {
                            "path": "src/b.rs",
                            "symbol": "b",
                            "node_id": 2,
                            "span": {"start": 3, "end": 4},
                        },
                        "label": "unreviewed",
                    }
                ],
            }
        ],
    }


def response(revision=REVISION, *, truncated=False):
    structured = {
        "snapshot": {
            "repo_revision": revision,
            "working_tree_digest": "b" * 64,
            "graph_generation": 7,
        },
        "total": 1,
        "truncated": truncated,
        "partial": False,
        "coverage_gap_count": 0,
        "candidates": [
            {
                "language": "rust",
                "left": {
                    "path": "src/a.rs",
                    "symbol": "a",
                    "node_id": 1,
                    "span": {"start": 1, "end": 2},
                },
                "right": {
                    "path": "src/b.rs",
                    "symbol": "b",
                    "node_id": 2,
                    "span": {"start": 3, "end": 4},
                },
                "similarity": {"total": 900},
                "projection": {"id": "refactor1.abc", "status": "hypothetical"},
                "strategies": [
                    {
                        "policy": policy,
                        "recommended": index == 0,
                        "counterfactual": {
                            "algorithm": "counterfactual_refactor_v1",
                            "score": 900 - index * 100,
                            "rank": index + 1,
                            "llm_used": False,
                            "reasons": ["structural_duplication_reduction"],
                            "formula": {"inputs": {}},
                            "predicted_graph": {},
                        },
                    }
                    for index, policy in enumerate(
                        ["preserve_entrypoints", "canonical_entrypoint", "consolidate"]
                    )
                ],
            }
        ],
    }
    visible = {"payload_tokens": 120}
    return {
        "jsonrpc": "2.0",
        "id": 2,
        "result": {
            "structuredContent": structured,
            "content": [{"type": "text", "text": json.dumps(visible)}],
        },
    }


class ContractIntegrityTests(unittest.TestCase):
    def test_valid_contract_and_report_keep_unreviewed_precision_null(self):
        document = contract()
        validate_contract(document, check_repositories=False)
        report = build_report(document, [response()])
        self.assertEqual(report["projects"], 1)
        self.assertEqual(report["candidate_count"], 1)
        self.assertEqual(report["label_counts"]["unreviewed"], 1)
        self.assertIsNone(report["precision"])
        self.assertEqual(report["payload_tokens"], 120)
        self.assertEqual(report["rows"][0]["left"]["node_id"], 1)
        self.assertEqual(report["planner"]["validated_futures"], 3)
        self.assertFalse(report["planner"]["llm_used"])

    def test_duplicate_project_and_candidate_ids_are_rejected(self):
        document = contract()
        document["projects"].append(dict(document["projects"][0]))
        with self.assertRaisesRegex(ValueError, "duplicate project id"):
            validate_contract(document, check_repositories=False)

        document = contract()
        document["projects"][0]["candidates"].append(
            dict(document["projects"][0]["candidates"][0])
        )
        with self.assertRaisesRegex(ValueError, "duplicate candidate id"):
            validate_contract(document, check_repositories=False)

    def test_unsafe_paths_and_missing_repositories_are_rejected(self):
        document = contract("relative/repo")
        with self.assertRaisesRegex(ValueError, "absolute"):
            validate_contract(document, check_repositories=False)

        document = contract()
        document["projects"][0]["candidates"][0]["left"]["path"] = "../secret.rs"
        with self.assertRaisesRegex(ValueError, "unsafe"):
            validate_contract(document, check_repositories=False)

        missing = Path(tempfile.gettempdir()) / "cgrx-refactor-eval-missing"
        document = contract(str(missing))
        with self.assertRaisesRegex(ValueError, "repository missing"):
            validate_contract(document, check_repositories=True)

    def test_unknown_labels_and_malformed_rows_are_rejected(self):
        document = contract()
        document["projects"][0]["candidates"][0]["label"] = "accepted"
        with self.assertRaisesRegex(ValueError, "unknown label"):
            validate_contract(document, check_repositories=False)

        document = contract()
        del document["projects"][0]["candidates"][0]["right"]["symbol"]
        with self.assertRaisesRegex(ValueError, "candidate endpoint"):
            validate_contract(document, check_repositories=False)

    def test_snapshot_mismatch_and_truncation_fail_closed(self):
        with self.assertRaisesRegex(ValueError, "snapshot mismatch"):
            build_report(contract(), [response("c" * 40)])
        with self.assertRaisesRegex(ValueError, "truncated"):
            build_report(contract(), [response(truncated=True)])

        malformed = response()
        del malformed["result"]["structuredContent"]["candidates"][0]["left"]
        with self.assertRaisesRegex(ValueError, "malformed candidate row"):
            build_report(contract(), [malformed])

    def test_planner_contract_rejects_ranking_and_model_drift(self):
        malformed = response()
        malformed["result"]["structuredContent"]["candidates"][0]["strategies"][1]["counterfactual"]["score"] = 950
        with self.assertRaisesRegex(ValueError, "score-ranked"):
            build_report(contract(), [malformed])

        malformed = response()
        malformed["result"]["structuredContent"]["candidates"][0]["strategies"][0]["counterfactual"]["llm_used"] = True
        with self.assertRaisesRegex(ValueError, "model-free"):
            build_report(contract(), [malformed])


if __name__ == "__main__":
    unittest.main()
