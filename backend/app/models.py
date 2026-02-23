from typing import Literal

from pydantic import BaseModel, Field, model_validator


class Action(BaseModel):
    id: str = Field(..., min_length=1)
    label: str = Field(..., min_length=1)
    child: str = Field(..., min_length=1)


class Payoff(BaseModel):
    by_player: dict[str, float]


class DecisionNode(BaseModel):
    id: str = Field(..., min_length=1)
    node_type: Literal["decision"] = "decision"
    player: str = Field(..., min_length=1)
    actions: list[Action] = Field(..., min_length=1)


class TerminalNode(BaseModel):
    id: str = Field(..., min_length=1)
    node_type: Literal["terminal"] = "terminal"
    payoff: Payoff


GameNode = DecisionNode | TerminalNode


class GameTree(BaseModel):
    root: str = Field(..., min_length=1)
    players: list[str] = Field(..., min_length=1)
    nodes: list[GameNode] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_graph(self) -> "GameTree":
        ids = [node.id for node in self.nodes]
        id_set = set(ids)
        if len(ids) != len(id_set):
            raise ValueError("Node ids must be unique.")
        if self.root not in id_set:
            raise ValueError("Root node must exist in nodes.")
        for node in self.nodes:
            if isinstance(node, DecisionNode):
                seen_action_ids = set()
                for action in node.actions:
                    if action.id in seen_action_ids:
                        raise ValueError(f"Duplicate action id '{action.id}' in node '{node.id}'.")
                    seen_action_ids.add(action.id)
                    if action.child not in id_set:
                        raise ValueError(
                            f"Action '{action.id}' in node '{node.id}' points to unknown child '{action.child}'."
                        )
        return self


class SolveRequest(BaseModel):
    game: GameTree


class SolveStep(BaseModel):
    node_id: str
    player: str
    chosen_action_id: str
    chosen_action_label: str
    continuation_payoff: dict[str, float]


class SolveResponse(BaseModel):
    root_value: dict[str, float]
    strategy_by_node: dict[str, str]
    steps: list[SolveStep]
