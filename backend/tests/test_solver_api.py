from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"


def test_solve_tree():
    payload = {
        "game": {
            "root": "n0",
            "players": ["P1", "P2"],
            "nodes": [
                {
                    "id": "n0",
                    "node_type": "decision",
                    "player": "P1",
                    "actions": [
                        {"id": "a", "label": "Left", "child": "n1"},
                        {"id": "b", "label": "Right", "child": "n2"},
                    ],
                },
                {
                    "id": "n1",
                    "node_type": "terminal",
                    "payoff": {"by_player": {"P1": 2, "P2": 1}},
                },
                {
                    "id": "n2",
                    "node_type": "terminal",
                    "payoff": {"by_player": {"P1": 3, "P2": 0}},
                },
            ],
        }
    }
    response = client.post("/api/v1/game-tree/solve", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["root_value"]["P1"] == 3
    assert body["strategy_by_node"]["n0"] == "b"
