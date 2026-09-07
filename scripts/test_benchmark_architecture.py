import copy
import unittest

from benchmark_architecture import validate_planner


def planner_fixture():
    strategies = []
    for rank, (policy, score) in enumerate(
        [("invert_dependency", 820), ("extract_contract", 770), ("preserve_and_monitor", 290)],
        1,
    ):
        strategies.append(
            {
                "strategy_id": f"strategy.{rank}",
                "policy": policy,
                "recommended": rank == 1,
                "counterfactual": {
                    "rank": rank,
                    "score": score,
                    "llm_used": False,
                },
            }
        )
    return {
        "architecture_plan": {
            "algorithm": "architecture_futures_v1",
            "llm_used": False,
            "issues": [
                {
                    "kind": "PACKAGE_DEPENDENCY_CYCLE",
                    "strategies": strategies,
                    "agent_handoff": {"strategy_id": "strategy.1", "llm_used": False},
                }
            ],
            "totals": {"issues": 1, "future_graphs": 3},
        }
    }


class ArchitecturePlannerValidationTests(unittest.TestCase):
    def test_accepts_three_ranked_model_free_futures(self):
        result = validate_planner(planner_fixture())
        self.assertEqual(result["validated_futures"], 3)
        self.assertEqual(result["policy_counts"]["invert_dependency"], 1)
        self.assertFalse(result["llm_used"])

    def test_rejects_llm_usage(self):
        fixture = planner_fixture()
        fixture["architecture_plan"]["issues"][0]["strategies"][0]["counterfactual"][
            "llm_used"
        ] = True
        with self.assertRaisesRegex(RuntimeError, "LLM"):
            validate_planner(fixture)

    def test_rejects_non_descending_scores(self):
        fixture = copy.deepcopy(planner_fixture())
        fixture["architecture_plan"]["issues"][0]["strategies"][1]["counterfactual"][
            "score"
        ] = 900
        with self.assertRaisesRegex(RuntimeError, "score-ranked"):
            validate_planner(fixture)


if __name__ == "__main__":
    unittest.main()
