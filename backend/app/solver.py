from dataclasses import dataclass

from .models import DecisionNode, GameTree, SolveResponse, SolveStep, TerminalNode


@dataclass(frozen=True)
class _NodeResult:
    payoff: dict[str, float]
    strategy: dict[str, str]
    steps: list[SolveStep]


def solve_perfect_information(tree: GameTree) -> SolveResponse:
    node_map = {node.id: node for node in tree.nodes}

    def eval_node(node_id: str) -> _NodeResult:
        node = node_map[node_id]

        if isinstance(node, TerminalNode):
            return _NodeResult(
                payoff=node.payoff.by_player.copy(),
                strategy={},
                steps=[],
            )

        best_action_id = None
        best_action_label = None
        best_payoff = None
        best_strategy = None
        best_steps = None

        for action in node.actions:
            child_result = eval_node(action.child)
            current_payoff = child_result.payoff

            if best_payoff is None:
                pick = True
            else:
                # Deterministic tie-breaker: higher payoff for active player, then lexical action id.
                active = node.player
                current = current_payoff.get(active, 0.0)
                previous = best_payoff.get(active, 0.0)
                pick = current > previous or (current == previous and action.id < best_action_id)

            if pick:
                best_action_id = action.id
                best_action_label = action.label
                best_payoff = current_payoff
                best_strategy = child_result.strategy
                best_steps = child_result.steps

        step = SolveStep(
            node_id=node.id,
            player=node.player,
            chosen_action_id=best_action_id,
            chosen_action_label=best_action_label,
            continuation_payoff=best_payoff,
        )

        strategy = dict(best_strategy)
        strategy[node.id] = best_action_id

        steps = list(best_steps)
        steps.append(step)

        return _NodeResult(payoff=best_payoff, strategy=strategy, steps=steps)

    result = eval_node(tree.root)

    return SolveResponse(
        root_value=result.payoff,
        strategy_by_node=result.strategy,
        steps=result.steps,
    )
