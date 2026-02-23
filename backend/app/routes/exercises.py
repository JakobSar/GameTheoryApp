import random

from fastapi import APIRouter

from ..exercise_models import (
    BayesEx1CheckRequest,
    BayesEx1CheckResponse,
    BayesEx1NewResponse,
    BayesEx2aCheckRequest,
    BayesEx2aCheckResponse,
    BayesEx2aNewResponse,
    BayesEx2bCheckRequest,
    BayesEx2bCheckResponse,
    BayesEx2bNewResponse,
    Choice,
    Ex1CheckRequest,
    Ex1CheckResponse,
    Ex1NewResponse,
    Ex2CheckRequest,
    Ex2CheckResponse,
    Ex2NewResponse,
    Ex3CheckRequest,
    Ex3CheckResponse,
    Ex3NewResponse,
    Ex4CheckRequest,
    Ex4CheckResponse,
    Ex4NewResponse,
    Ex5CheckRequest,
    Ex5CheckResponse,
    Ex5NewResponse,
    Ex6CheckRequest,
    Ex6CheckResponse,
    Ex6NewResponse,
    Ex7CheckRequest,
    Ex7CheckResponse,
    Ex7NewResponse,
    Ex8CheckRequest,
    Ex8CheckResponse,
    Ex8NewResponse,
    Ex9CheckRequest,
    Ex9CheckResponse,
    Ex9NewResponse,
)
from ..exercises import (
    P1_STRATS_EX1,
    P2_STRATS_EX1,
    ex1_correct_choice_id_and_label,
    ex1_new_question,
    ex2_choices,
    ex2_correct_choice_id_and_label,
    ex2_explanation,
    ex3_correct_choice_id_and_label,
    ex3_explanation,
    ex4_choices,
    ex4_correct_ids_and_text,
    ex4_explanation,
    ex5_cell_choices,
    ex5_expected_map,
    ex6_choices,
    ex6_correct_fraction,
    ex7_choices,
    ex7_correct_ids,
    ex7_details_text,
    ex8_choices,
    ex8_correct_ids,
    ex8_details_text,
    ex9_choices,
    ex9_correct_choice,
    bayes_ex1_correct_ids,
    bayes_ex1_games_by_type,
    bayes_ex1_profiles,
    bayes_ex2a_choices_and_correct,
    bayes_ex2a_intermediate_text,
    bayes_ex2b_choices,
    bayes_ex2b_correct_ids,
    bayes_ex2b_details,
    generate_bayes_ex2_params,
    generate_random_game_bayes_ex1_params,
    generate_random_game_ex1,
    generate_random_game_ex2,
    generate_random_game_ex3,
    generate_random_game_ex4,
    generate_random_game_ex5,
    generate_random_game_ex6,
    generate_random_game_ex7,
    generate_random_game_ex8,
    generate_random_game_ex9,
    subset_choice_defs,
    tr,
)

router = APIRouter(prefix="/api/v1/exercises", tags=["exercises"])


@router.get("/ex1/new", response_model=Ex1NewResponse)
def ex1_new(lang: str = "de") -> Ex1NewResponse:
    game = generate_random_game_ex1()
    question = ex1_new_question()
    strats = P1_STRATS_EX1 if question.responder == 1 else P2_STRATS_EX1
    choices = subset_choice_defs(strats, lang if lang in ("de", "en") else "de")
    return Ex1NewResponse(game=game, question=question, choices=choices)


@router.post("/ex1/check", response_model=Ex1CheckResponse)
def ex1_check(payload: Ex1CheckRequest) -> Ex1CheckResponse:
    correct_choice_id, correct_label = ex1_correct_choice_id_and_label(
        payload.game, payload.question, payload.lang
    )
    is_correct = payload.selected_choice_id == correct_choice_id
    feedback = (
        tr(
            payload.lang,
            f"Richtig. {correct_label} ist die beste Antwort.",
            f"Correct. {correct_label} is the best response.",
        )
        if is_correct
        else tr(
            payload.lang,
            f"Falsch. Richtig ist: {correct_label}.",
            f"Incorrect. Correct is: {correct_label}.",
        )
    )
    return Ex1CheckResponse(
        correct=is_correct,
        correct_choice_id=correct_choice_id,
        correct_label=correct_label,
        feedback=feedback,
    )


@router.get("/ex2/new", response_model=Ex2NewResponse)
def ex2_new(lang: str = "de") -> Ex2NewResponse:
    game = generate_random_game_ex2()
    return Ex2NewResponse(game=game, choices=ex2_choices(lang if lang in ("de", "en") else "de"))


@router.post("/ex2/check", response_model=Ex2CheckResponse)
def ex2_check(payload: Ex2CheckRequest) -> Ex2CheckResponse:
    correct_choice_id, correct_label, r_dom, c_dom = ex2_correct_choice_id_and_label(
        payload.game, payload.lang
    )
    is_correct = payload.selected_choice_id == correct_choice_id
    explanation = ex2_explanation(payload.lang, r_dom, c_dom)
    feedback = (
        tr(payload.lang, f"Richtig. {correct_label}.", f"Correct. {correct_label}.")
        if is_correct
        else tr(
            payload.lang,
            f"Falsch. Richtig ist: {correct_label}.",
            f"Incorrect. Correct is: {correct_label}.",
        )
    )
    return Ex2CheckResponse(
        correct=is_correct,
        correct_choice_id=correct_choice_id,
        correct_label=correct_label,
        explanation=explanation,
        feedback=feedback,
    )


@router.get("/ex3/new", response_model=Ex3NewResponse)
def ex3_new(lang: str = "de") -> Ex3NewResponse:
    game = generate_random_game_ex3()
    return Ex3NewResponse(game=game, choices=ex2_choices(lang if lang in ("de", "en") else "de"))


@router.post("/ex3/check", response_model=Ex3CheckResponse)
def ex3_check(payload: Ex3CheckRequest) -> Ex3CheckResponse:
    correct_choice_id, correct_label, r_dom, r_type, c_dom, c_type = ex3_correct_choice_id_and_label(
        payload.game, payload.lang
    )
    is_correct = payload.selected_choice_id == correct_choice_id
    explanation = ex3_explanation(payload.lang, r_dom, r_type, c_dom, c_type)
    feedback = (
        tr(payload.lang, f"Richtig. {correct_label}.", f"Correct. {correct_label}.")
        if is_correct
        else tr(
            payload.lang,
            f"Falsch. Richtig ist: {correct_label}.",
            f"Incorrect. Correct is: {correct_label}.",
        )
    )
    return Ex3CheckResponse(
        correct=is_correct,
        correct_choice_id=correct_choice_id,
        correct_label=correct_label,
        explanation=explanation,
        feedback=feedback,
    )


@router.get("/ex4/new", response_model=Ex4NewResponse)
def ex4_new() -> Ex4NewResponse:
    game = generate_random_game_ex4()
    return Ex4NewResponse(game=game, choices=ex4_choices())


@router.post("/ex4/check", response_model=Ex4CheckResponse)
def ex4_check(payload: Ex4CheckRequest) -> Ex4CheckResponse:
    correct_choice_ids, correct_text = ex4_correct_ids_and_text(payload.game, payload.lang)
    chosen = sorted(payload.selected_choice_ids or [])
    is_correct = chosen == correct_choice_ids
    explanation = ex4_explanation(payload.lang, len(correct_choice_ids) > 0)
    if is_correct:
        feedback = tr(payload.lang, f"Richtig. {correct_text}.", f"Correct. {correct_text}.")
    else:
        prefix = tr(payload.lang, "Richtig sind: " if len(correct_choice_ids) > 1 else "Richtig ist: ", "Correct are: " if len(correct_choice_ids) > 1 else "Correct is: ")
        feedback = tr(
            payload.lang,
            f"Falsch. {prefix}{correct_text}.",
            f"Incorrect. {prefix}{correct_text}.",
        )
    return Ex4CheckResponse(
        correct=is_correct,
        correct_choice_ids=correct_choice_ids,
        correct_text=correct_text,
        explanation=explanation,
        feedback=feedback,
    )


@router.get("/ex5/new", response_model=Ex5NewResponse)
def ex5_new(lang: str = "de") -> Ex5NewResponse:
    game = generate_random_game_ex5()
    return Ex5NewResponse(game=game, cell_choices=ex5_cell_choices(lang if lang in ("de", "en") else "de"))


@router.post("/ex5/check", response_model=Ex5CheckResponse)
def ex5_check(payload: Ex5CheckRequest) -> Ex5CheckResponse:
    expected = ex5_expected_map(payload.game)
    answer_map = {(a.row, a.col): a.value for a in payload.answers}
    missing = 0
    wrong = 0
    for r in ["A", "B", "C", "D"]:
        for c in ["X", "Y", "Z"]:
            key = (r, c)
            # Default is "no"; unanswered fields are treated as "no".
            value = answer_map.get(key, "no")
            if value != expected[key]:
                wrong += 1

    if wrong == 0:
        return Ex5CheckResponse(
            correct=True,
            missing=0,
            wrong=0,
            feedback=tr(payload.lang, "Richtig! Alle Felder sind korrekt.", "Correct! All fields are correct."),
        )
    return Ex5CheckResponse(
        correct=False,
        missing=0,
        wrong=wrong,
        feedback=tr(
            payload.lang,
            f"Falsch. Falsche Antworten: {wrong}.",
            f"Incorrect. Wrong answers: {wrong}.",
        ),
    )


@router.get("/ex6/new", response_model=Ex6NewResponse)
def ex6_new() -> Ex6NewResponse:
    game = generate_random_game_ex6()
    return Ex6NewResponse(game=game, choices=ex6_choices())


@router.post("/ex6/check", response_model=Ex6CheckResponse)
def ex6_check(payload: Ex6CheckRequest) -> Ex6CheckResponse:
    correct_frac = ex6_correct_fraction(payload.game)
    if correct_frac is None:
        return Ex6CheckResponse(
            correct=False,
            correct_choice_id="",
            feedback=tr(payload.lang, "Keine eindeutige Lösung für p.", "No unique solution for p."),
        )

    is_correct = payload.selected_choice_id == correct_frac
    feedback = (
        tr(
            payload.lang,
            f"Richtig! p = {correct_frac}. Damit ist Spieler 2 indifferent zwischen X und Y.",
            f"Correct! p = {correct_frac}. This makes Player 2 indifferent between X and Y.",
        )
        if is_correct
        else tr(
            payload.lang,
            f"Falsch. Richtig ist: p = {correct_frac}.",
            f"Incorrect. Correct is: p = {correct_frac}.",
        )
    )
    return Ex6CheckResponse(correct=is_correct, correct_choice_id=correct_frac, feedback=feedback)


@router.get("/ex7/new", response_model=Ex7NewResponse)
def ex7_new(lang: str = "de") -> Ex7NewResponse:
    game = generate_random_game_ex7()
    return Ex7NewResponse(game=game, choices=ex7_choices(lang if lang in ("de", "en") else "de"))


@router.post("/ex7/check", response_model=Ex7CheckResponse)
def ex7_check(payload: Ex7CheckRequest) -> Ex7CheckResponse:
    chosen = sorted(payload.selected_choice_ids or [])
    correct_ids = ex7_correct_ids(payload.game, payload.lang)
    details = ex7_details_text(payload.game, payload.lang)
    is_correct = chosen == correct_ids
    correct_text = ", ".join(correct_ids)
    feedback = (
        tr(payload.lang, "Richtig!", "Correct!")
        if is_correct
        else tr(
            payload.lang,
            f"Falsch. Richtig ist: {correct_text}.",
            f"Incorrect. Correct is: {correct_text}.",
        )
    )
    return Ex7CheckResponse(
        correct=is_correct,
        correct_choice_ids=correct_ids,
        feedback=feedback,
        details=details,
    )


@router.get("/ex8/new", response_model=Ex8NewResponse)
def ex8_new(lang: str = "de") -> Ex8NewResponse:
    game = generate_random_game_ex8()
    return Ex8NewResponse(game=game, choices=ex8_choices(lang if lang in ("de", "en") else "de"))


@router.post("/ex8/check", response_model=Ex8CheckResponse)
def ex8_check(payload: Ex8CheckRequest) -> Ex8CheckResponse:
    chosen = sorted(payload.selected_choice_ids or [])
    correct_ids = ex8_correct_ids(payload.game, payload.lang)
    details = ex8_details_text(payload.game, payload.lang)
    is_correct = chosen == correct_ids
    correct_text = ", ".join(correct_ids)
    feedback = (
        tr(payload.lang, "Richtig!", "Correct!")
        if is_correct
        else tr(
            payload.lang,
            f"Falsch. Richtig ist: {correct_text}.",
            f"Incorrect. Correct is: {correct_text}.",
        )
    )
    return Ex8CheckResponse(
        correct=is_correct,
        correct_choice_ids=correct_ids,
        feedback=feedback,
        details=details,
    )


@router.get("/ex9/new", response_model=Ex9NewResponse)
def ex9_new() -> Ex9NewResponse:
    game, a = generate_random_game_ex9()
    return Ex9NewResponse(game=game, a=a, choices=ex9_choices())


@router.post("/ex9/check", response_model=Ex9CheckResponse)
def ex9_check(payload: Ex9CheckRequest) -> Ex9CheckResponse:
    correct_choice_id, correct_text = ex9_correct_choice(payload.a)
    is_correct = payload.selected_choice_id == correct_choice_id
    feedback = (
        tr(
            payload.lang,
            f"Richtig! Für a = {payload.a} gilt als vollständig gemischtes Nash-Gleichgewicht: {correct_text}.",
            f"Correct! For a = {payload.a}, the fully mixed Nash equilibrium is: {correct_text}.",
        )
        if is_correct
        else tr(
            payload.lang,
            f"Falsch. Für a = {payload.a} ist korrekt: {correct_text}.",
            f"Incorrect. For a = {payload.a}, the correct answer is: {correct_text}.",
        )
    )
    return Ex9CheckResponse(
        correct=is_correct,
        correct_choice_id=correct_choice_id,
        correct_text=correct_text,
        feedback=feedback,
    )


@router.get("/bayes/ex1/new", response_model=BayesEx1NewResponse)
def bayes_ex1_new() -> BayesEx1NewResponse:
    params = generate_random_game_bayes_ex1_params()
    game_t1, game_t2 = bayes_ex1_games_by_type(params)
    choices = [Choice(id=p, label=p) for p in bayes_ex1_profiles()]
    return BayesEx1NewResponse(game_t1=game_t1, game_t2=game_t2, params=params, choices=choices)


@router.post("/bayes/ex1/check", response_model=BayesEx1CheckResponse)
def bayes_ex1_check(payload: BayesEx1CheckRequest) -> BayesEx1CheckResponse:
    correct_ids = bayes_ex1_correct_ids(payload.params)
    chosen = sorted(payload.selected_choice_ids or [])
    is_correct = chosen == correct_ids
    correct_text = ", ".join(correct_ids) if correct_ids else tr(
        payload.lang,
        "keines der Profile",
        "none of the profiles",
    )
    feedback = (
        tr(payload.lang, "Richtig!", "Correct!")
        if is_correct
        else tr(payload.lang, f"Falsch. Richtig ist: {correct_text}.", f"Incorrect. Correct is: {correct_text}.")
    )
    return BayesEx1CheckResponse(correct=is_correct, correct_choice_ids=correct_ids, feedback=feedback)


@router.get("/bayes/ex2a/new", response_model=BayesEx2aNewResponse)
def bayes_ex2a_new() -> BayesEx2aNewResponse:
    params = generate_bayes_ex2_params()
    choices, _ = bayes_ex2a_choices_and_correct(params)
    return BayesEx2aNewResponse(params=params, choices=choices)


@router.post("/bayes/ex2a/check", response_model=BayesEx2aCheckResponse)
def bayes_ex2a_check(payload: BayesEx2aCheckRequest) -> BayesEx2aCheckResponse:
    _, correct_id = bayes_ex2a_choices_and_correct(payload.params.model_dump())
    is_correct = payload.selected_choice_id == correct_id
    intermediate = bayes_ex2a_intermediate_text(payload.params.model_dump())
    feedback = (
        tr(payload.lang, "Richtig!", "Correct!")
        if is_correct
        else tr(payload.lang, "Falsch.", "Incorrect.")
    )
    return BayesEx2aCheckResponse(
        correct=is_correct,
        correct_choice_id=correct_id,
        feedback=feedback,
        intermediate=intermediate,
    )


@router.get("/bayes/ex2b/new", response_model=BayesEx2bNewResponse)
def bayes_ex2b_new(lang: str = "de") -> BayesEx2bNewResponse:
    alt_key = random.choice(["ab_xy", "ba_xx", "bb_yx"])
    params = generate_bayes_ex2_params()
    choices = bayes_ex2b_choices(alt_key, lang if lang in ("de", "en") else "de")
    return BayesEx2bNewResponse(params=params, alt_key=alt_key, choices=choices)


@router.post("/bayes/ex2b/check", response_model=BayesEx2bCheckResponse)
def bayes_ex2b_check(payload: BayesEx2bCheckRequest) -> BayesEx2bCheckResponse:
    correct_ids = bayes_ex2b_correct_ids(payload.params.model_dump(), payload.alt_key, payload.lang)
    chosen = sorted(payload.selected_choice_ids or [])
    is_correct = chosen == correct_ids
    details = bayes_ex2b_details(payload.params.model_dump(), payload.alt_key, payload.lang)
    correct_text = ", ".join(correct_ids)
    feedback = (
        tr(payload.lang, f"Richtig. Richtig ist: {correct_text}.", f"Correct. Correct is: {correct_text}.")
        if is_correct
        else tr(payload.lang, f"Falsch. Richtig ist: {correct_text}.", f"Incorrect. Correct is: {correct_text}.")
    )
    return BayesEx2bCheckResponse(
        correct=is_correct,
        correct_choice_ids=correct_ids,
        feedback=feedback,
        details=details,
    )
