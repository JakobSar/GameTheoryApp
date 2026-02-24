from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_ex1_new_and_check_roundtrip():
    new_res = client.get("/api/v1/exercises/ex1/new?lang=de")
    assert new_res.status_code == 200
    body = new_res.json()
    assert "game" in body
    assert "question" in body
    assert len(body["choices"]) == 8

    first_choice = body["choices"][0]["id"]
    check_res = client.post(
        "/api/v1/exercises/ex1/check",
        json={
            "game": body["game"],
            "question": body["question"],
            "selected_choice_id": first_choice,
            "lang": "de",
        },
    )
    assert check_res.status_code == 200
    check_body = check_res.json()
    assert "correct" in check_body
    assert "correct_choice_id" in check_body
    assert "feedback" in check_body


def test_ex2_new_and_check_roundtrip():
    new_res = client.get("/api/v1/exercises/ex2/new?lang=en")
    assert new_res.status_code == 200
    body = new_res.json()
    assert "game" in body
    assert len(body["choices"]) == 20

    first_choice = body["choices"][0]["id"]
    check_res = client.post(
        "/api/v1/exercises/ex2/check",
        json={
            "game": body["game"],
            "selected_choice_id": first_choice,
            "lang": "en",
        },
    )
    assert check_res.status_code == 200
    check_body = check_res.json()
    assert "correct" in check_body
    assert "correct_choice_id" in check_body
    assert "explanation" in check_body


def test_ex3_new_and_check_roundtrip():
    new_res = client.get("/api/v1/exercises/ex3/new?lang=de")
    assert new_res.status_code == 200
    body = new_res.json()
    assert "game" in body
    assert len(body["choices"]) == 20

    first_choice = body["choices"][0]["id"]
    check_res = client.post(
        "/api/v1/exercises/ex3/check",
        json={
            "game": body["game"],
            "selected_choice_id": first_choice,
            "lang": "de",
        },
    )
    assert check_res.status_code == 200
    check_body = check_res.json()
    assert "correct" in check_body
    assert "correct_choice_id" in check_body
    assert "explanation" in check_body


def test_ex4_new_and_check_roundtrip():
    new_res = client.get("/api/v1/exercises/ex4/new")
    assert new_res.status_code == 200
    body = new_res.json()
    assert "game" in body
    assert len(body["choices"]) == 12

    first_choice = body["choices"][0]["id"]
    check_res = client.post(
        "/api/v1/exercises/ex4/check",
        json={
            "game": body["game"],
            "selected_choice_ids": [first_choice],
            "lang": "de",
        },
    )
    assert check_res.status_code == 200
    check_body = check_res.json()
    assert "correct" in check_body
    assert "correct_choice_ids" in check_body
    assert "correct_text" in check_body


def test_ex5_new_and_check_roundtrip():
    new_res = client.get("/api/v1/exercises/ex5/new?lang=de")
    assert new_res.status_code == 200
    body = new_res.json()
    assert "game" in body
    assert len(body["cell_choices"]) == 3

    answers = []
    for r in body["game"]["rows"]:
        for c in body["game"]["cols"]:
            answers.append({"row": r, "col": c, "value": "no"})
    check_res = client.post(
        "/api/v1/exercises/ex5/check",
        json={"game": body["game"], "answers": answers, "lang": "de"},
    )
    assert check_res.status_code == 200
    check_body = check_res.json()
    assert "correct" in check_body
    assert "wrong" in check_body


def test_ex6_new_and_check_roundtrip():
    new_res = client.get("/api/v1/exercises/ex6/new")
    assert new_res.status_code == 200
    body = new_res.json()
    assert "game" in body
    assert len(body["choices"]) == 6

    first_choice = body["choices"][0]["id"]
    check_res = client.post(
        "/api/v1/exercises/ex6/check",
        json={"game": body["game"], "selected_choice_id": first_choice, "lang": "de"},
    )
    assert check_res.status_code == 200
    check_body = check_res.json()
    assert "correct" in check_body
    assert "correct_choice_id" in check_body


def test_ex7_new_and_check_roundtrip():
    new_res = client.get("/api/v1/exercises/ex7/new?lang=de")
    assert new_res.status_code == 200
    body = new_res.json()
    assert "game" in body
    assert len(body["choices"]) == 10

    first_choice = body["choices"][0]["id"]
    check_res = client.post(
        "/api/v1/exercises/ex7/check",
        json={"game": body["game"], "selected_choice_ids": [first_choice], "lang": "de"},
    )
    assert check_res.status_code == 200
    check_body = check_res.json()
    assert "correct" in check_body
    assert "correct_choice_ids" in check_body
    assert "details" in check_body


def test_ex8_new_and_check_roundtrip():
    new_res = client.get("/api/v1/exercises/ex8/new?lang=de")
    assert new_res.status_code == 200
    body = new_res.json()
    assert "game" in body
    assert len(body["choices"]) == 10

    first_choice = body["choices"][0]["id"]
    check_res = client.post(
        "/api/v1/exercises/ex8/check",
        json={"game": body["game"], "selected_choice_ids": [first_choice], "lang": "de"},
    )
    assert check_res.status_code == 200
    check_body = check_res.json()
    assert "correct" in check_body
    assert "correct_choice_ids" in check_body
    assert "details" in check_body


def test_ex9_new_and_check_roundtrip():
    new_res = client.get("/api/v1/exercises/ex9/new")
    assert new_res.status_code == 200
    body = new_res.json()
    assert "game" in body
    assert body["a"] in [1, 3, 4]
    assert len(body["choices"]) == 7

    first_choice = body["choices"][0]["id"]
    check_res = client.post(
        "/api/v1/exercises/ex9/check",
        json={
            "game": body["game"],
            "a": body["a"],
            "selected_choice_id": first_choice,
            "lang": "de",
        },
    )
    assert check_res.status_code == 200
    check_body = check_res.json()
    assert "correct" in check_body
    assert "correct_choice_id" in check_body
    assert "correct_text" in check_body


def test_bayes_ex1_new_and_check_roundtrip():
    new_res = client.get("/api/v1/exercises/bayes/ex1/new")
    assert new_res.status_code == 200
    body = new_res.json()
    assert "game_t1" in body
    assert "game_t2" in body
    assert "params" in body
    assert len(body["choices"]) == 8

    first_choice = body["choices"][0]["id"]
    check_res = client.post(
        "/api/v1/exercises/bayes/ex1/check",
        json={"params": body["params"], "selected_choice_ids": [first_choice], "lang": "de"},
    )
    assert check_res.status_code == 200
    check_body = check_res.json()
    assert "correct" in check_body
    assert "correct_choice_ids" in check_body


def test_bayes_ex2a_new_and_check_roundtrip():
    new_res = client.get("/api/v1/exercises/bayes/ex2a/new")
    assert new_res.status_code == 200
    body = new_res.json()
    assert "params" in body
    assert len(body["choices"]) == 4

    first_choice = body["choices"][0]["id"]
    check_res = client.post(
        "/api/v1/exercises/bayes/ex2a/check",
        json={"params": body["params"], "selected_choice_id": first_choice, "lang": "de"},
    )
    assert check_res.status_code == 200
    check_body = check_res.json()
    assert "correct" in check_body
    assert "correct_choice_id" in check_body
    assert "intermediate" in check_body


def test_bayes_ex2b_new_and_check_roundtrip():
    new_res = client.get("/api/v1/exercises/bayes/ex2b/new?lang=de")
    assert new_res.status_code == 200
    body = new_res.json()
    assert "params" in body
    assert "alt_key" in body
    assert len(body["choices"]) == 3

    first_choice = body["choices"][0]["id"]
    check_res = client.post(
        "/api/v1/exercises/bayes/ex2b/check",
        json={
            "params": body["params"],
            "alt_key": body["alt_key"],
            "selected_choice_ids": [first_choice],
            "lang": "de",
        },
    )
    assert check_res.status_code == 200
    check_body = check_res.json()
    assert "correct" in check_body
    assert "correct_choice_ids" in check_body
    assert "details" in check_body
