import random
from fractions import Fraction
from math import gcd

from .exercise_models import Choice, Ex1Question, Lang, NormalFormGame, PayoffCell

P1_STRATS_EX1 = ["A", "B", "C"]
P2_STRATS_EX1 = ["X", "Y", "Z"]

P1_STRATS_EX2 = ["A", "B", "C", "D"]
P2_STRATS_EX2 = ["X", "Y", "Z"]
P1_STRATS_EX6 = ["A", "B"]
P2_STRATS_EX6 = ["X", "Y"]
P1_STRATS_EX7 = ["A", "B", "C"]
P2_STRATS_EX7 = ["X", "Y", "Z"]
P1_STRATS_EX8 = ["A", "B", "C"]
P2_STRATS_EX8 = ["A", "B", "C"]
P1_STRATS_EX9 = ["XY", "XZ", "YZ"]
P2_STRATS_EX9 = ["X", "Y", "Z"]

EX9_OPTION_TEXT = {
    "opt1": "A) Firma 1: (1/3, 1/3, 1/3) | Firma 2: (3/11, 4/11, 4/11)",
    "opt2": "B) Firma 1: (3/11, 4/11, 4/11) | Firma 2: (1/3, 1/3, 1/3)",
    "opt3": "C) Firma 1: (1/3, 1/3, 1/3) | Firma 2: (1/3, 1/3, 1/3)",
    "opt4": "D) Firma 1: (1/3, 1/3, 1/3) | Firma 2: (3/7, 2/7, 2/7)",
    "opt5": "E) Firma 1: (3/7, 2/7, 2/7) | Firma 2: (1/3, 1/3, 1/3)",
    "opt6": "F) Firma 1: (1/3, 1/3, 1/3) | Firma 2: (3/5, 1/5, 1/5)",
    "opt7": "G) Firma 1: (3/5, 1/5, 1/5) | Firma 2: (1/3, 1/3, 1/3)",
}

BAYES_EX2A_PAYOFFS_A_C = {
    ("A", "X"): (5, 3),
    ("A", "Y"): (4, 7),
    ("B", "X"): (6, 4),
    ("B", "Y"): (2, 3),
}
BAYES_EX2A_PAYOFFS_A_D = {
    ("A", "X"): (5, 7),
    ("A", "Y"): (2, 3),
    ("B", "X"): (8, 5),
    ("B", "Y"): (2, 2),
}
BAYES_EX2A_PAYOFFS_B_C = {
    ("A", "X"): (5, 7),
    ("A", "Y"): (4, 6),
    ("B", "X"): (5, 3),
    ("B", "Y"): (8, 5),
}
BAYES_EX2A_PAYOFFS_B_D = {
    ("A", "X"): (7, 2),
    ("A", "Y"): (8, 1),
    ("B", "X"): (6, 3),
    ("B", "Y"): (2, 8),
}


def tr(lang: Lang, de: str, en: str) -> str:
    return en if lang == "en" else de


def game_to_map(game: NormalFormGame) -> dict[tuple[str, str], tuple[int, int]]:
    return {(cell.row, cell.col): (cell.u1, cell.u2) for cell in game.payoffs}


def map_to_game(
    rows: list[str], cols: list[str], payoff_map: dict[tuple[str, str], tuple[int, int]]
) -> NormalFormGame:
    cells: list[PayoffCell] = []
    for r in rows:
        for c in cols:
            u1, u2 = payoff_map[(r, c)]
            cells.append(PayoffCell(row=r, col=c, u1=u1, u2=u2))
    return NormalFormGame(rows=rows, cols=cols, payoffs=cells)


def generate_random_game_ex1() -> NormalFormGame:
    payoff_map = {
        (r, c): (random.randint(0, 9), random.randint(0, 9))
        for r in P1_STRATS_EX1
        for c in P2_STRATS_EX1
    }
    return map_to_game(P1_STRATS_EX1, P2_STRATS_EX1, payoff_map)


def best_response_set(
    payoff_map: dict[tuple[str, str], tuple[int, int]], responder: int, opponent_strat: str
) -> set[str]:
    if responder == 1:
        col = opponent_strat
        values = {r: payoff_map[(r, col)][0] for r in P1_STRATS_EX1}
        m = max(values.values())
        return {r for r, v in values.items() if v == m}

    row = opponent_strat
    values = {c: payoff_map[(row, c)][1] for c in P2_STRATS_EX1}
    m = max(values.values())
    return {c for c, v in values.items() if v == m}


def subset_choice_defs(strats: list[str], lang: Lang) -> list[Choice]:
    a, b, c = strats
    return [
        Choice(id="only_1", label=tr(lang, f"Nur {a}", f"Only {a}")),
        Choice(id="only_2", label=tr(lang, f"Nur {b}", f"Only {b}")),
        Choice(id="only_3", label=tr(lang, f"Nur {c}", f"Only {c}")),
        Choice(id="pair_12", label=tr(lang, f"{a} und {b}", f"{a} and {b}")),
        Choice(id="pair_13", label=tr(lang, f"{a} und {c}", f"{a} and {c}")),
        Choice(id="pair_23", label=tr(lang, f"{b} und {c}", f"{b} and {c}")),
        Choice(id="all_123", label=tr(lang, f"{a}, {b} und {c}", f"{a}, {b}, and {c}")),
        Choice(id="none", label=tr(lang, "Keine Strategie", "No strategy")),
    ]


def choice_id_for_subset(strats: list[str], chosen: set[str]) -> str:
    s = [x for x in strats if x in chosen]
    if len(s) == 0:
        return "none"
    if len(s) == 1:
        if s[0] == strats[0]:
            return "only_1"
        if s[0] == strats[1]:
            return "only_2"
        return "only_3"
    if len(s) == 2:
        if s == [strats[0], strats[1]]:
            return "pair_12"
        if s == [strats[0], strats[2]]:
            return "pair_13"
        return "pair_23"
    return "all_123"


def ex1_new_question() -> Ex1Question:
    responder = random.choice([1, 2])
    opp = random.choice(P2_STRATS_EX1 if responder == 1 else P1_STRATS_EX1)
    return Ex1Question(responder=responder, opp=opp)


def ex1_correct_choice_id_and_label(game: NormalFormGame, question: Ex1Question, lang: Lang) -> tuple[str, str]:
    payoff_map = game_to_map(game)
    correct_set = best_response_set(payoff_map, question.responder, question.opp)
    strats = P1_STRATS_EX1 if question.responder == 1 else P2_STRATS_EX1
    choice_id = choice_id_for_subset(strats, correct_set)
    label_map = {c.id: c.label for c in subset_choice_defs(strats, lang)}
    return choice_id, label_map[choice_id]


def generate_random_game_ex2(force_prob: float = 0.85) -> NormalFormGame:
    rows = P1_STRATS_EX2
    cols = P2_STRATS_EX2
    payoffs = {(r, c): (random.randint(0, 9), random.randint(0, 9)) for r in rows for c in cols}

    if random.random() > force_prob:
        return map_to_game(rows, cols, payoffs)

    scenario = random.choices(["p2", "p1", "both"], weights=[0.55, 0.20, 0.25], k=1)[0]

    if scenario in ("p2", "both"):
        dom_c = random.choice(cols)
        for r in rows:
            u2_dom = random.randint(5, 9)
            others = [c for c in cols if c != dom_c]
            u2_o1 = random.randint(0, max(0, u2_dom - 1))
            u2_o2 = random.randint(0, max(0, u2_dom - 1))
            if u2_o2 >= u2_dom:
                u2_o2 = max(0, u2_dom - 1)
            payoffs[(r, dom_c)] = (payoffs[(r, dom_c)][0], u2_dom)
            c1, c2 = others
            payoffs[(r, c1)] = (payoffs[(r, c1)][0], min(u2_dom - 1, u2_o1))
            payoffs[(r, c2)] = (payoffs[(r, c2)][0], min(u2_dom - 1, u2_o2))

        for r in rows:
            dom_val = payoffs[(r, dom_c)][1]
            for c in cols:
                if c != dom_c and payoffs[(r, c)][1] >= dom_val:
                    payoffs[(r, c)] = (payoffs[(r, c)][0], max(0, dom_val - 1))

    if scenario in ("p1", "both"):
        dom_r = random.choice(rows)
        for c in cols:
            u1_dom = random.randint(5, 9)
            others = [r for r in rows if r != dom_r]
            payoffs[(dom_r, c)] = (u1_dom, payoffs[(dom_r, c)][1])
            for r in others:
                u1_other = random.randint(0, max(0, u1_dom - 1))
                payoffs[(r, c)] = (min(u1_dom - 1, u1_other), payoffs[(r, c)][1])

        for c in cols:
            dom_val = payoffs[(dom_r, c)][0]
            for r in rows:
                if r != dom_r and payoffs[(r, c)][0] >= dom_val:
                    payoffs[(r, c)] = (max(0, dom_val - 1), payoffs[(r, c)][1])

    return map_to_game(rows, cols, payoffs)


def strictly_dominant_row(
    payoff_map: dict[tuple[str, str], tuple[int, int]], rows: list[str], cols: list[str]
) -> str | None:
    for r in rows:
        ok = True
        for r2 in rows:
            if r2 == r:
                continue
            if not all(payoff_map[(r, c)][0] > payoff_map[(r2, c)][0] for c in cols):
                ok = False
                break
        if ok:
            return r
    return None


def strictly_dominant_col(
    payoff_map: dict[tuple[str, str], tuple[int, int]], rows: list[str], cols: list[str]
) -> str | None:
    for c in cols:
        ok = True
        for c2 in cols:
            if c2 == c:
                continue
            if not all(payoff_map[(r, c)][1] > payoff_map[(r, c2)][1] for r in rows):
                ok = False
                break
        if ok:
            return c
    return None


def ex2_choices(lang: Lang) -> list[Choice]:
    choices: list[Choice] = []
    for r in P1_STRATS_EX2:
        choices.append(Choice(id=f"r_{r}", label=tr(lang, f"Ja, {r}", f"Yes, {r}")))
    for c in P2_STRATS_EX2:
        choices.append(Choice(id=f"c_{c}", label=tr(lang, f"Ja, {c}", f"Yes, {c}")))
    for r in P1_STRATS_EX2:
        for c in P2_STRATS_EX2:
            choices.append(
                Choice(id=f"rc_{r}_{c}", label=tr(lang, f"Ja, {r} und {c}", f"Yes, {r} and {c}"))
            )
    choices.append(Choice(id="none", label=tr(lang, "Nein, keiner", "No, none")))
    return choices


def ex2_correct_choice_id_and_label(game: NormalFormGame, lang: Lang) -> tuple[str, str, str | None, str | None]:
    payoff_map = game_to_map(game)
    r_dom = strictly_dominant_row(payoff_map, P1_STRATS_EX2, P2_STRATS_EX2)
    c_dom = strictly_dominant_col(payoff_map, P1_STRATS_EX2, P2_STRATS_EX2)

    if r_dom and c_dom:
        return f"rc_{r_dom}_{c_dom}", tr(lang, f"Ja, {r_dom} und {c_dom}", f"Yes, {r_dom} and {c_dom}"), r_dom, c_dom
    if r_dom:
        return f"r_{r_dom}", tr(lang, f"Ja, {r_dom}", f"Yes, {r_dom}"), r_dom, None
    if c_dom:
        return f"c_{c_dom}", tr(lang, f"Ja, {c_dom}", f"Yes, {c_dom}"), None, c_dom
    return "none", tr(lang, "Nein, keiner", "No, none"), None, None


def ex2_explanation(lang: Lang, r_dom: str | None, c_dom: str | None) -> str:
    if r_dom and c_dom:
        return tr(
            lang,
            f"Spieler 1 hat mit {r_dom} und Spieler 2 mit {c_dom} jeweils eine strikt dominante Strategie.",
            f"Player 1 has {r_dom} and Player 2 has {c_dom} as strictly dominant strategies.",
        )
    if r_dom:
        return tr(
            lang,
            f"{r_dom} ist strikt dominant fuer Spieler 1.",
            f"{r_dom} is strictly dominant for Player 1.",
        )
    if c_dom:
        return tr(
            lang,
            f"{c_dom} ist strikt dominant fuer Spieler 2.",
            f"{c_dom} is strictly dominant for Player 2.",
        )
    return tr(
        lang,
        "Es gibt keine strikt dominante Strategie fuer die beiden Spieler.",
        "There is no strictly dominant strategy for either player.",
    )


def weakly_dominant_row(
    payoff_map: dict[tuple[str, str], tuple[int, int]], rows: list[str], cols: list[str]
) -> str | None:
    for r in rows:
        dominates_all = True
        for r2 in rows:
            if r2 == r:
                continue
            strictly_better_exists = False
            for c in cols:
                if payoff_map[(r, c)][0] < payoff_map[(r2, c)][0]:
                    dominates_all = False
                    break
                if payoff_map[(r, c)][0] > payoff_map[(r2, c)][0]:
                    strictly_better_exists = True
            else:
                if not strictly_better_exists:
                    dominates_all = False
            if not dominates_all:
                break
        if dominates_all:
            return r
    return None


def weakly_dominant_col(
    payoff_map: dict[tuple[str, str], tuple[int, int]], rows: list[str], cols: list[str]
) -> str | None:
    for c in cols:
        dominates_all = True
        for c2 in cols:
            if c2 == c:
                continue
            strictly_better_exists = False
            for r in rows:
                if payoff_map[(r, c)][1] < payoff_map[(r, c2)][1]:
                    dominates_all = False
                    break
                if payoff_map[(r, c)][1] > payoff_map[(r, c2)][1]:
                    strictly_better_exists = True
            else:
                if not strictly_better_exists:
                    dominates_all = False
            if not dominates_all:
                break
        if dominates_all:
            return c
    return None


def generate_random_game_ex3(force_prob: float = 0.9) -> NormalFormGame:
    rows = P1_STRATS_EX2
    cols = P2_STRATS_EX2
    payoffs = {(r, c): (random.randint(0, 9), random.randint(0, 9)) for r in rows for c in cols}

    if random.random() > force_prob:
        return map_to_game(rows, cols, payoffs)

    scenario = random.choices(["p2", "p1", "both"], weights=[0.45, 0.15, 0.40], k=1)[0]
    p1_type = None
    p2_type = None
    if scenario == "p1":
        p1_type = random.choice(["strict", "weak"])
    elif scenario == "p2":
        p2_type = random.choice(["strict", "weak"])
    else:
        if random.random() < 0.5:
            p1_type = "strict" if random.random() < 0.5 else "weak"
            p2_type = "weak" if p1_type == "strict" else "strict"
        else:
            t = random.choice(["strict", "weak"])
            p1_type = t
            p2_type = t

    if p2_type == "strict":
        dom_c = random.choice(cols)
        for r in rows:
            u2_dom = random.randint(5, 9)
            others = [c for c in cols if c != dom_c]
            u2_o1 = random.randint(0, max(0, u2_dom - 1))
            u2_o2 = random.randint(0, max(0, u2_dom - 1))
            if u2_o2 >= u2_dom:
                u2_o2 = max(0, u2_dom - 1)
            payoffs[(r, dom_c)] = (payoffs[(r, dom_c)][0], u2_dom)
            c1, c2 = others
            payoffs[(r, c1)] = (payoffs[(r, c1)][0], min(u2_dom - 1, u2_o1))
            payoffs[(r, c2)] = (payoffs[(r, c2)][0], min(u2_dom - 1, u2_o2))
        for r in rows:
            dom_val = payoffs[(r, dom_c)][1]
            for c in cols:
                if c != dom_c and payoffs[(r, c)][1] >= dom_val:
                    payoffs[(r, c)] = (payoffs[(r, c)][0], max(0, dom_val - 1))

    if p1_type == "strict":
        dom_r = random.choice(rows)
        for c in cols:
            u1_dom = random.randint(5, 9)
            others = [r for r in rows if r != dom_r]
            payoffs[(dom_r, c)] = (u1_dom, payoffs[(dom_r, c)][1])
            for r in others:
                u1_other = random.randint(0, max(0, u1_dom - 1))
                payoffs[(r, c)] = (min(u1_dom - 1, u1_other), payoffs[(r, c)][1])
        for c in cols:
            dom_val = payoffs[(dom_r, c)][0]
            for r in rows:
                if r != dom_r and payoffs[(r, c)][0] >= dom_val:
                    payoffs[(r, c)] = (max(0, dom_val - 1), payoffs[(r, c)][1])

    if p2_type == "weak":
        dom_c = random.choice(cols)
        for r in rows:
            u2_dom = random.randint(5, 9)
            payoffs[(r, dom_c)] = (payoffs[(r, dom_c)][0], u2_dom)
            for c in cols:
                if c != dom_c:
                    payoffs[(r, c)] = (payoffs[(r, c)][0], random.randint(0, u2_dom))
        for c2 in cols:
            if c2 == dom_c:
                continue
            exists_strict = any(payoffs[(r, dom_c)][1] > payoffs[(r, c2)][1] for r in rows)
            if not exists_strict:
                r_choice = random.choice(rows)
                if payoffs[(r_choice, dom_c)][1] > 0:
                    payoffs[(r_choice, c2)] = (
                        payoffs[(r_choice, c2)][0],
                        min(payoffs[(r_choice, dom_c)][1] - 1, payoffs[(r_choice, c2)][1]),
                    )
                else:
                    payoffs[(r_choice, c2)] = (payoffs[(r_choice, c2)][0], 0)

    if p1_type == "weak":
        dom_r = random.choice(rows)
        for c in cols:
            u1_dom = random.randint(5, 9)
            payoffs[(dom_r, c)] = (u1_dom, payoffs[(dom_r, c)][1])
            for r in rows:
                if r != dom_r:
                    payoffs[(r, c)] = (random.randint(0, u1_dom), payoffs[(r, c)][1])
        for r2 in rows:
            if r2 == dom_r:
                continue
            exists_strict = any(payoffs[(dom_r, c)][0] > payoffs[(r2, c)][0] for c in cols)
            if not exists_strict:
                c_choice = random.choice(cols)
                if payoffs[(dom_r, c_choice)][0] > 0:
                    payoffs[(r2, c_choice)] = (
                        min(payoffs[(dom_r, c_choice)][0] - 1, payoffs[(r2, c_choice)][0]),
                        payoffs[(r2, c_choice)][1],
                    )
                else:
                    payoffs[(r2, c_choice)] = (0, payoffs[(r2, c_choice)][1])

    return map_to_game(rows, cols, payoffs)


def ex3_correct_choice_id_and_label(
    game: NormalFormGame, lang: Lang
) -> tuple[str, str, str | None, str | None, str | None, str | None]:
    payoff_map = game_to_map(game)
    r_dom_strict = strictly_dominant_row(payoff_map, P1_STRATS_EX2, P2_STRATS_EX2)
    c_dom_strict = strictly_dominant_col(payoff_map, P1_STRATS_EX2, P2_STRATS_EX2)
    r_dom_weak = None if r_dom_strict else weakly_dominant_row(payoff_map, P1_STRATS_EX2, P2_STRATS_EX2)
    c_dom_weak = None if c_dom_strict else weakly_dominant_col(payoff_map, P1_STRATS_EX2, P2_STRATS_EX2)
    r_dom = r_dom_strict or r_dom_weak
    c_dom = c_dom_strict or c_dom_weak
    r_type = "strict" if r_dom_strict else ("weak" if r_dom_weak else None)
    c_type = "strict" if c_dom_strict else ("weak" if c_dom_weak else None)

    if r_dom and c_dom:
        label = tr(lang, f"Ja, {r_dom} und {c_dom}", f"Yes, {r_dom} and {c_dom}")
        return f"rc_{r_dom}_{c_dom}", label, r_dom, r_type, c_dom, c_type
    if r_dom:
        label = tr(lang, f"Ja, {r_dom}", f"Yes, {r_dom}")
        return f"r_{r_dom}", label, r_dom, r_type, None, None
    if c_dom:
        label = tr(lang, f"Ja, {c_dom}", f"Yes, {c_dom}")
        return f"c_{c_dom}", label, None, None, c_dom, c_type
    label = tr(lang, "Nein, keiner", "No, none")
    return "none", label, None, None, None, None


def ex3_explanation(
    lang: Lang, r_dom: str | None, r_type: str | None, c_dom: str | None, c_type: str | None
) -> str:
    def t(x: str | None) -> str:
        if x == "strict":
            return tr(lang, "strikt", "strictly")
        if x == "weak":
            return tr(lang, "schwach", "weakly")
        return ""

    if r_dom and c_dom:
        return tr(
            lang,
            f"Spieler 1 hat mit {r_dom} eine {t(r_type)} dominante Strategie und Spieler 2 mit {c_dom} eine {t(c_type)} dominante Strategie.",
            f"Player 1 has {r_dom} as a {t(r_type)} dominant strategy and Player 2 has {c_dom} as a {t(c_type)} dominant strategy.",
        )
    if r_dom:
        return tr(
            lang,
            f"{r_dom} ist eine {t(r_type)} dominante Strategie fuer Spieler 1.",
            f"{r_dom} is a {t(r_type)} dominant strategy for Player 1.",
        )
    if c_dom:
        return tr(
            lang,
            f"{c_dom} ist eine {t(c_type)} dominante Strategie fuer Spieler 2.",
            f"{c_dom} is a {t(c_type)} dominant strategy for Player 2.",
        )
    return tr(
        lang,
        "Kein Spieler hat eine dominante Strategie.",
        "No player has a dominant strategy.",
    )


def generate_random_game_ex4(force_prob: float = 0.9) -> NormalFormGame:
    rows = P1_STRATS_EX2
    cols = P2_STRATS_EX2
    payoffs = {(r, c): (random.randint(0, 9), random.randint(0, 9)) for r in rows for c in cols}

    if random.random() > force_prob:
        return map_to_game(rows, cols, payoffs)

    scenario = random.choices(["one", "two"], weights=[0.8, 0.2], k=1)[0]
    if scenario == "one":
        r_star = random.choice(rows)
        c_star = random.choice(cols)
        u1_val = random.randint(5, 9)
        payoffs[(r_star, c_star)] = (u1_val, payoffs[(r_star, c_star)][1])
        for r in rows:
            if r != r_star and payoffs[(r, c_star)][0] >= u1_val:
                payoffs[(r, c_star)] = (max(0, u1_val - 1), payoffs[(r, c_star)][1])

        u2_val = random.randint(5, 9)
        payoffs[(r_star, c_star)] = (payoffs[(r_star, c_star)][0], u2_val)
        for c in cols:
            if c != c_star and payoffs[(r_star, c)][1] >= u2_val:
                payoffs[(r_star, c)] = (payoffs[(r_star, c)][0], max(0, u2_val - 1))
    else:
        dom_c = random.choice(cols)
        for r in rows:
            u2_dom = random.randint(5, 9)
            others = [c for c in cols if c != dom_c]
            payoffs[(r, dom_c)] = (payoffs[(r, dom_c)][0], u2_dom)
            c1, c2 = others
            payoffs[(r, c1)] = (payoffs[(r, c1)][0], random.randint(0, max(0, u2_dom - 1)))
            payoffs[(r, c2)] = (payoffs[(r, c2)][0], random.randint(0, max(0, u2_dom - 1)))
        for r in rows:
            dom_val = payoffs[(r, dom_c)][1]
            for c in cols:
                if c != dom_c and payoffs[(r, c)][1] >= dom_val:
                    payoffs[(r, c)] = (payoffs[(r, c)][0], max(0, dom_val - 1))

        r1, r2 = random.sample(rows, 2)
        high_val = random.randint(5, 9)
        payoffs[(r1, dom_c)] = (high_val, payoffs[(r1, dom_c)][1])
        payoffs[(r2, dom_c)] = (high_val, payoffs[(r2, dom_c)][1])
        for r in rows:
            if r not in (r1, r2) and payoffs[(r, dom_c)][0] >= high_val:
                payoffs[(r, dom_c)] = (max(0, high_val - 1), payoffs[(r, dom_c)][1])

    return map_to_game(rows, cols, payoffs)


def find_nash_equilibria(
    payoff_map: dict[tuple[str, str], tuple[int, int]], rows: list[str], cols: list[str]
) -> list[tuple[str, str]]:
    ne_list: list[tuple[str, str]] = []
    for r in rows:
        for c in cols:
            p1_ok = all(payoff_map[(r2, c)][0] <= payoff_map[(r, c)][0] for r2 in rows)
            p2_ok = all(payoff_map[(r, c2)][1] <= payoff_map[(r, c)][1] for c2 in cols)
            if p1_ok and p2_ok:
                ne_list.append((r, c))
    return ne_list


def ex4_choices() -> list[Choice]:
    return [Choice(id=f"({r},{c})", label=f"({r},{c})") for r in P1_STRATS_EX2 for c in P2_STRATS_EX2]


def ex4_correct_ids_and_text(game: NormalFormGame, lang: Lang) -> tuple[list[str], str]:
    payoff_map = game_to_map(game)
    actual_ne = find_nash_equilibria(payoff_map, P1_STRATS_EX2, P2_STRATS_EX2)
    actual_set = sorted([f"({r},{c})" for (r, c) in actual_ne])

    if len(actual_set) == 0:
        text = tr(
            lang,
            "Es gibt kein Nash-Gleichgewicht in reinen Strategien",
            "There is no Nash equilibrium in pure strategies",
        )
    elif len(actual_set) == 1:
        combo = actual_set[0]
        text = tr(
            lang,
            f"{combo} ist ein Nash-Gleichgewicht in reinen Strategien",
            f"{combo} is a Nash equilibrium in pure strategies",
        )
    elif len(actual_set) == 2:
        text = tr(
            lang,
            f"{actual_set[0]} und {actual_set[1]} sind Nash-Gleichgewichte in reinen Strategien",
            f"{actual_set[0]} and {actual_set[1]} are Nash equilibria in pure strategies",
        )
    else:
        text = tr(
            lang,
            ", ".join(actual_set[:-1]) + f" und {actual_set[-1]} sind Nash-Gleichgewichte in reinen Strategien",
            ", ".join(actual_set[:-1]) + f" and {actual_set[-1]} are Nash equilibria in pure strategies",
        )
    return actual_set, text


def ex4_explanation(lang: Lang, has_ne: bool) -> str:
    if has_ne:
        return tr(
            lang,
            "Bei jeder anderen Strategiekombination kann sich mindestens einer der Spieler durch einseitiges Abweichen strikt verbessern.",
            "For any other strategy combination, at least one player can strictly improve by unilateral deviation.",
        )
    return tr(
        lang,
        "Bei jeder Strategiekombination kann sich mindestens ein Spieler strikt verbessern.",
        "For any strategy combination, at least one player can strictly improve.",
    )


def ex5_cell_choices(lang: Lang) -> list[Choice]:
    return [
        Choice(id="yes_not_strict", label=tr(lang, "ja, nicht strikt", "yes, not strict")),
        Choice(id="yes_strict", label=tr(lang, "ja, strikt", "yes, strict")),
        Choice(id="no", label=tr(lang, "nein", "no")),
    ]


def ex5_expected_map(game: NormalFormGame) -> dict[tuple[str, str], str]:
    payoff_map = game_to_map(game)
    actual_ne = find_nash_equilibria(payoff_map, P1_STRATS_EX2, P2_STRATS_EX2)
    strict_set = set()
    for (r, c) in actual_ne:
        p1_strict = all(payoff_map[(r, c)][0] > payoff_map[(r2, c)][0] for r2 in P1_STRATS_EX2 if r2 != r)
        p2_strict = all(payoff_map[(r, c)][1] > payoff_map[(r, c2)][1] for c2 in P2_STRATS_EX2 if c2 != c)
        if p1_strict and p2_strict:
            strict_set.add((r, c))

    expected: dict[tuple[str, str], str] = {}
    for r in P1_STRATS_EX2:
        for c in P2_STRATS_EX2:
            if (r, c) in strict_set:
                expected[(r, c)] = "yes_strict"
            elif (r, c) in actual_ne:
                expected[(r, c)] = "yes_not_strict"
            else:
                expected[(r, c)] = "no"
    return expected


def generate_random_game_ex5() -> NormalFormGame:
    return generate_random_game_ex4()


def generate_random_game_ex6() -> NormalFormGame:
    rows = P1_STRATS_EX6
    cols = P2_STRATS_EX6
    scenario = random.choice(["S1", "S2"])
    n = random.randint(2, 7)

    if scenario == "S2":
        d2 = random.randint(1, max(1, 9 // max(1, (n - 1))))
        d1 = (n - 1) * d2
        a_x_u2 = random.randint(0, 9 - d1)
        a_y_u2 = a_x_u2 + d1
        b_y_u2 = random.randint(0, 9 - d2)
        b_x_u2 = b_y_u2 + d2
        u2 = {("A", "X"): a_x_u2, ("A", "Y"): a_y_u2, ("B", "X"): b_x_u2, ("B", "Y"): b_y_u2}
    else:
        c2 = random.randint(1, max(1, 9 // max(1, (n - 1))))
        c1 = (n - 1) * c2
        a_y_u2 = random.randint(0, 9 - c1)
        a_x_u2 = a_y_u2 + c1
        b_x_u2 = random.randint(0, 9 - c2)
        b_y_u2 = b_x_u2 + c2
        u2 = {("A", "X"): a_x_u2, ("A", "Y"): a_y_u2, ("B", "X"): b_x_u2, ("B", "Y"): b_y_u2}

    if scenario == "S2":
        b_x_u1 = random.randint(1, 9)
        a_x_u1 = random.randint(0, b_x_u1 - 1)
        a_y_u1 = random.randint(1, 9)
        b_y_u1 = random.randint(0, a_y_u1 - 1)
    else:
        a_x_u1 = random.randint(1, 9)
        b_x_u1 = random.randint(0, a_x_u1 - 1)
        b_y_u1 = random.randint(1, 9)
        a_y_u1 = random.randint(0, b_y_u1 - 1)

    u1 = {("A", "X"): a_x_u1, ("A", "Y"): a_y_u1, ("B", "X"): b_x_u1, ("B", "Y"): b_y_u1}
    payoff_map = {(r, c): (u1[(r, c)], u2[(r, c)]) for (r, c) in u1}
    return map_to_game(rows, cols, payoff_map)


def ex6_choices() -> list[Choice]:
    return [Choice(id=v, label=v) for v in ["1/7", "1/6", "1/5", "1/4", "1/3", "1/2"]]


def ex6_correct_fraction(game: NormalFormGame) -> str | None:
    p = game_to_map(game)
    a = p[("A", "X")][1] - p[("A", "Y")][1]
    b = p[("B", "Y")][1] - p[("B", "X")][1]
    if a + b == 0:
        return None
    num = b
    den = a + b
    g = gcd(abs(num), abs(den))
    num //= g
    den //= g
    if den < 0:
        num *= -1
        den *= -1
    return f"{num}/{den}"


def generate_random_game_ex7() -> NormalFormGame:
    payoff_map = {
        (r, c): (random.randint(0, 9), random.randint(0, 9))
        for r in P1_STRATS_EX7
        for c in P2_STRATS_EX7
    }
    return map_to_game(P1_STRATS_EX7, P2_STRATS_EX7, payoff_map)


def weakly_dominated_rows(
    payoff_map: dict[tuple[str, str], tuple[int, int]], rows: list[str], cols: list[str]
) -> set[str]:
    dominated: set[str] = set()
    for r in rows:
        for r2 in rows:
            if r2 == r:
                continue
            ge_all = all(payoff_map[(r2, c)][0] >= payoff_map[(r, c)][0] for c in cols)
            gt_any = any(payoff_map[(r2, c)][0] > payoff_map[(r, c)][0] for c in cols)
            if ge_all and gt_any:
                dominated.add(r)
                break
    return dominated


def weakly_dominated_cols(
    payoff_map: dict[tuple[str, str], tuple[int, int]], rows: list[str], cols: list[str]
) -> set[str]:
    dominated: set[str] = set()
    for c in cols:
        for c2 in cols:
            if c2 == c:
                continue
            ge_all = all(payoff_map[(r, c2)][1] >= payoff_map[(r, c)][1] for r in rows)
            gt_any = any(payoff_map[(r, c2)][1] > payoff_map[(r, c)][1] for r in rows)
            if ge_all and gt_any:
                dominated.add(c)
                break
    return dominated


def trembling_hand_perfect_pure_equilibria(
    payoff_map: dict[tuple[str, str], tuple[int, int]], rows: list[str], cols: list[str]
) -> list[tuple[str, str]]:
    ne = find_nash_equilibria(payoff_map, rows, cols)
    dominated_rows = weakly_dominated_rows(payoff_map, rows, cols)
    dominated_cols = weakly_dominated_cols(payoff_map, rows, cols)
    return [(r, c) for (r, c) in ne if r not in dominated_rows and c not in dominated_cols]


def ex7_choices(lang: Lang) -> list[Choice]:
    combos = [f"({r},{c})" for r in P1_STRATS_EX7 for c in P2_STRATS_EX7]
    none_label = tr(lang, "Keines", "None")
    return [Choice(id=label, label=label) for label in combos + [none_label]]


def ex7_correct_ids(game: NormalFormGame, lang: Lang) -> list[str]:
    payoff_map = game_to_map(game)
    thp = trembling_hand_perfect_pure_equilibria(payoff_map, P1_STRATS_EX7, P2_STRATS_EX7)
    if not thp:
        return [tr(lang, "Keines", "None")]
    return sorted([f"({r},{c})" for (r, c) in thp])


def ex7_details_text(game: NormalFormGame, lang: Lang) -> str:
    payoff_map = game_to_map(game)
    ne = find_nash_equilibria(payoff_map, P1_STRATS_EX7, P2_STRATS_EX7)
    thp = trembling_hand_perfect_pure_equilibria(payoff_map, P1_STRATS_EX7, P2_STRATS_EX7)
    dom_rows = sorted(weakly_dominated_rows(payoff_map, P1_STRATS_EX7, P2_STRATS_EX7))
    dom_cols = sorted(weakly_dominated_cols(payoff_map, P1_STRATS_EX7, P2_STRATS_EX7))
    none_label = tr(lang, "Keines", "None")
    none_rows = tr(lang, "keine", "none")

    def fmt(combo_list: list[tuple[str, str]]) -> str:
        labels = [f"({r},{c})" for (r, c) in combo_list]
        if not labels:
            return none_label
        return ", ".join(labels)

    return tr(
        lang,
        f"Nash-GG: {fmt(ne)}. Schwach dominierte Zeilen: {', '.join(dom_rows) if dom_rows else none_rows}. "
        f"Schwach dominierte Spalten: {', '.join(dom_cols) if dom_cols else none_rows}. THP (rein): {fmt(thp)}.",
        f"Nash equilibria: {fmt(ne)}. Weakly dominated rows: {', '.join(dom_rows) if dom_rows else none_rows}. "
        f"Weakly dominated columns: {', '.join(dom_cols) if dom_cols else none_rows}. THP (pure): {fmt(thp)}.",
    )


def generate_random_game_ex8() -> NormalFormGame:
    rows = P1_STRATS_EX8
    cols = P2_STRATS_EX8
    u1 = {(r, c): (random.randint(0, 9)) for r in rows for c in cols}

    for s in rows:
        if random.random() < 0.75:
            col_vals = [u1[(r, s)] for r in rows]
            target = max(col_vals)
            if u1[(s, s)] < target:
                u1[(s, s)] = target

    payoff_map: dict[tuple[str, str], tuple[int, int]] = {}
    for r in rows:
        for c in cols:
            payoff_map[(r, c)] = (u1[(r, c)], u1[(c, r)])
    return map_to_game(rows, cols, payoff_map)


def symmetric_nash_strategies_ex8(
    payoff_map: dict[tuple[str, str], tuple[int, int]]
) -> list[str]:
    strats = P1_STRATS_EX8
    sym_ne: list[str] = []
    for s in strats:
        u_ss = payoff_map[(s, s)][0]
        if all(payoff_map[(sp, s)][0] <= u_ss for sp in strats):
            sym_ne.append(s)
    return sym_ne


def ess_strategies_ex8(payoff_map: dict[tuple[str, str], tuple[int, int]]) -> list[str]:
    strats = P1_STRATS_EX8
    ess: list[str] = []
    for s in strats:
        u_ss = payoff_map[(s, s)][0]
        br_to_s = [sp for sp in strats if payoff_map[(sp, s)][0] == u_ss]
        if any(payoff_map[(sp, s)][0] > u_ss for sp in strats):
            continue

        ok2 = True
        for sp in br_to_s:
            if sp == s:
                continue
            if payoff_map[(sp, sp)][0] >= payoff_map[(s, sp)][0]:
                ok2 = False
                break
        if ok2:
            ess.append(s)
    return ess


def ex8_choices(lang: Lang) -> list[Choice]:
    combos = [f"({r},{c})" for c in P2_STRATS_EX8 for r in P1_STRATS_EX8]
    none_label = tr(lang, "Keines", "None")
    return [Choice(id=label, label=label) for label in combos + [none_label]]


def ex8_correct_ids(game: NormalFormGame, lang: Lang) -> list[str]:
    payoff_map = game_to_map(game)
    ess = ess_strategies_ex8(payoff_map)
    if not ess:
        return [tr(lang, "Keines", "None")]
    return sorted([f"({s},{s})" for s in ess])


def ex8_details_text(game: NormalFormGame, lang: Lang) -> str:
    payoff_map = game_to_map(game)
    sym_ne = symmetric_nash_strategies_ex8(payoff_map)
    ess = ess_strategies_ex8(payoff_map)
    none_label = tr(lang, "Keines", "None")
    sym_ne_text = ", ".join([f"({s},{s})" for s in sym_ne]) if sym_ne else none_label
    ess_text = ", ".join([f"({s},{s})" for s in ess]) if ess else none_label
    return tr(
        lang,
        f"Symmetrische Nash-GG: {sym_ne_text}. ESS: {ess_text}.",
        f"Symmetric Nash equilibria: {sym_ne_text}. ESS: {ess_text}.",
    )


def generate_random_game_ex9() -> tuple[NormalFormGame, int]:
    a = random.choice([1, 3, 4])
    payoff_map: dict[tuple[str, str], tuple[int, int]] = {}
    for r in P1_STRATS_EX9:
        covered_markets = set(r)
        for c in P2_STRATS_EX9:
            u1 = 6 if c in covered_markets else 9
            if c in covered_markets:
                u2 = 5
            else:
                u2 = a if c == "Z" else 2
            payoff_map[(r, c)] = (u1, u2)
    return map_to_game(P1_STRATS_EX9, P2_STRATS_EX9, payoff_map), a


def ex9_choices() -> list[Choice]:
    return [Choice(id=k, label=v) for k, v in EX9_OPTION_TEXT.items()]


def ex9_correct_choice(a: int) -> tuple[str, str]:
    correct_by_a = {1: "opt2", 3: "opt5", 4: "opt7"}
    choice_id = correct_by_a[a]
    return choice_id, EX9_OPTION_TEXT[choice_id]


def generate_random_game_bayes_ex1_params() -> dict[str, int]:
    keys = list("abcdefghijklmnop")
    return {k: random.randint(0, 9) for k in keys}


def bayes_ex1_games_by_type(params: dict[str, int]) -> tuple[NormalFormGame, NormalFormGame]:
    t1 = {
        ("A", "X"): (params["a"], params["b"]),
        ("A", "Y"): (params["c"], params["d"]),
        ("B", "X"): (params["e"], params["f"]),
        ("B", "Y"): (params["g"], params["h"]),
    }
    t2 = {
        ("A", "X"): (params["i"], params["j"]),
        ("A", "Y"): (params["k"], params["l"]),
        ("B", "X"): (params["m"], params["n"]),
        ("B", "Y"): (params["o"], params["p"]),
    }
    rows = ["A", "B"]
    cols = ["X", "Y"]
    return map_to_game(rows, cols, t1), map_to_game(rows, cols, t2)


def bayes_ex1_profiles() -> list[str]:
    p1_profiles = [("A", "A"), ("A", "B"), ("B", "A"), ("B", "B")]
    p2_actions = ["X", "Y"]
    return [f"(({t1},{t2}),{a2})" for a2 in p2_actions for (t1, t2) in p1_profiles]


def bayes_ex1_is_equilibrium(params: dict[str, int], a_t1: str, a_t2: str, a2: str) -> bool:
    if a2 == "X":
        p1_t1_ok = (params["a"] >= params["e"]) if a_t1 == "A" else (params["e"] >= params["a"])
        p1_t2_ok = (params["i"] >= params["m"]) if a_t2 == "A" else (params["m"] >= params["i"])
    else:
        p1_t1_ok = (params["c"] >= params["g"]) if a_t1 == "A" else (params["g"] >= params["c"])
        p1_t2_ok = (params["k"] >= params["o"]) if a_t2 == "A" else (params["o"] >= params["k"])

    x_t1 = params["b"] if a_t1 == "A" else params["f"]
    x_t2 = params["j"] if a_t2 == "A" else params["n"]
    y_t1 = params["d"] if a_t1 == "A" else params["h"]
    y_t2 = params["l"] if a_t2 == "A" else params["p"]
    eu_x = 0.25 * x_t1 + 0.75 * x_t2
    eu_y = 0.25 * y_t1 + 0.75 * y_t2
    p2_ok = eu_x >= eu_y if a2 == "X" else eu_y >= eu_x
    return p1_t1_ok and p1_t2_ok and p2_ok


def bayes_ex1_correct_ids(params: dict[str, int]) -> list[str]:
    correct: list[str] = []
    for a_t1, a_t2 in [("A", "A"), ("A", "B"), ("B", "A"), ("B", "B")]:
        for a2 in ["X", "Y"]:
            if bayes_ex1_is_equilibrium(params, a_t1, a_t2, a2):
                correct.append(f"(({a_t1},{a_t2}),{a2})")
    return sorted(correct)


def frac_str(v: Fraction) -> str:
    return f"{v.numerator}/{v.denominator}" if v.denominator != 1 else f"{v.numerator}"


def generate_bayes_ex2_params() -> dict[str, int]:
    den = random.randint(8, 16)
    cuts = sorted(random.sample(range(1, den), 3))
    nums = [cuts[0], cuts[1] - cuts[0], cuts[2] - cuts[1], den - cuts[2]]
    random.shuffle(nums)
    return {"den": den, "w": nums[0], "x": nums[1], "y": nums[2], "z": nums[3]}


def bayes_ex2_probs(params: dict[str, int]) -> tuple[Fraction, Fraction, Fraction, Fraction]:
    w = Fraction(params["w"], params["den"])
    x = Fraction(params["x"], params["den"])
    y = Fraction(params["y"], params["den"])
    z = Fraction(params["z"], params["den"])
    return w, x, y, z


def bayes_ex2a_values(params: dict[str, int]) -> dict[str, Fraction]:
    w, x, y, z = bayes_ex2_probs(params)
    return {
        "c_a": w / (w + x),
        "d_a": x / (w + x),
        "c_b": y / (y + z),
        "d_b": z / (y + z),
        "a_c": w / (w + y),
        "b_c": y / (w + y),
        "a_d": x / (x + z),
        "b_d": z / (x + z),
    }


def bayes_ex2a_option_formulas(params: dict[str, int]) -> dict[str, str]:
    v = bayes_ex2a_values(params)
    return {
        "correct": (
            f"Prob(c|a)={frac_str(v['c_a'])}, Prob(d|a)={frac_str(v['d_a'])}, "
            f"Prob(c|b)={frac_str(v['c_b'])}, Prob(d|b)={frac_str(v['d_b'])}"
        ),
        "swap_a": (
            f"Prob(c|a)={frac_str(v['d_a'])}, Prob(d|a)={frac_str(v['c_a'])}, "
            f"Prob(c|b)={frac_str(v['c_b'])}, Prob(d|b)={frac_str(v['d_b'])}"
        ),
        "swap_b": (
            f"Prob(c|a)={frac_str(v['c_a'])}, Prob(d|a)={frac_str(v['d_a'])}, "
            f"Prob(c|b)={frac_str(v['d_b'])}, Prob(d|b)={frac_str(v['c_b'])}"
        ),
        "bayes_rev": (
            f"Prob(c|a)={frac_str(v['a_c'])}, Prob(d|a)={frac_str(v['b_c'])}, "
            f"Prob(c|b)={frac_str(v['a_d'])}, Prob(d|b)={frac_str(v['b_d'])}"
        ),
    }


def bayes_ex2a_choices_and_correct(params: dict[str, int]) -> tuple[list[Choice], str]:
    option_order = ["correct", "swap_a", "swap_b", "bayes_rev"]
    formulas = bayes_ex2a_option_formulas(params)
    letters = ["A", "B", "C", "D"]
    choices: list[Choice] = []
    correct_id = "opt1"
    for idx, tag in enumerate(option_order):
        cid = f"opt{idx + 1}"
        choices.append(Choice(id=cid, label=f"{letters[idx]}) {formulas[tag]}"))
        if tag == "correct":
            correct_id = cid
    return choices, correct_id


def bayes_ex2a_intermediate_text(params: dict[str, int]) -> str:
    v = bayes_ex2a_values(params)
    return (
        f"Prob(c|a)={frac_str(v['c_a'])}, Prob(d|a)={frac_str(v['d_a'])}, "
        f"Prob(c|b)={frac_str(v['c_b'])}, Prob(d|b)={frac_str(v['d_b'])}"
    )


def bayes_ex2b_choices(alt_key: str, lang: Lang) -> list[Choice]:
    labels = {
        "first": "((A,B),(Y,Y))",
        "ab_xy": "((A,B),(X,Y))",
        "ba_xx": "((B,A),(X,X))",
        "bb_yx": "((B,B),(Y,X))",
    }
    none = tr(lang, "Keines", "None")
    return [
        Choice(id=labels["first"], label=labels["first"]),
        Choice(id=labels[alt_key], label=labels[alt_key]),
        Choice(id=none, label=none),
    ]


def bayes_ex2b_correct_ids(params: dict[str, int], alt_key: str, lang: Lang) -> list[str]:
    w, x, y, z = bayes_ex2_probs(params)
    labels = {
        "first": "((A,B),(Y,Y))",
        "ab_xy": "((A,B),(X,Y))",
        "ba_xx": "((B,A),(X,X))",
        "bb_yx": "((B,B),(Y,X))",
    }
    first_ok = (5 * z >= 4 * x) and (2 * y >= 3 * z)
    if alt_key == "ab_xy":
        second_ok = False
    elif alt_key == "ba_xx":
        second_ok = True
    else:
        second_ok = (3 * x >= 2 * w) and (4 * y >= z) and (2 * y >= w) and (3 * x >= 5 * z)

    correct: list[str] = []
    if first_ok:
        correct.append(labels["first"])
    if second_ok:
        correct.append(labels[alt_key])
    if not correct:
        correct = [tr(lang, "Keines", "None")]
    return sorted(correct)


def bayes_ex2b_details(params: dict[str, int], alt_key: str, lang: Lang) -> str:
    w, x, y, z = bayes_ex2_probs(params)
    labels = {
        "first": "((A,B),(Y,Y))",
        "ab_xy": "((A,B),(X,Y))",
        "ba_xx": "((B,A),(X,X))",
        "bb_yx": "((B,B),(Y,X))",
    }
    first = labels["first"]
    second = labels[alt_key]
    c1 = 5 * z >= 4 * x
    c2 = 2 * y >= 3 * z
    line1 = tr(
        lang,
        f"{first}: {'Ja' if (c1 and c2) else 'Nein'}; 5·Prob(b,d) ≥ 4·Prob(a,d) ({frac_str(5*z)} ≥ {frac_str(4*x)}) {'✓' if c1 else '✗'} "
        f"und 2·Prob(b,c) ≥ 3·Prob(b,d) ({frac_str(2*y)} ≥ {frac_str(3*z)}) {'✓' if c2 else '✗'}",
        f"{first}: {'Yes' if (c1 and c2) else 'No'}; 5·Prob(b,d) ≥ 4·Prob(a,d) ({frac_str(5*z)} ≥ {frac_str(4*x)}) {'✓' if c1 else '✗'} "
        f"and 2·Prob(b,c) ≥ 3·Prob(b,d) ({frac_str(2*y)} ≥ {frac_str(3*z)}) {'✓' if c2 else '✗'}",
    )
    if alt_key == "ab_xy":
        line2 = tr(lang, f"{second}: Nein (für alle prior Wahrscheinlichkeiten).", f"{second}: No (for all prior probabilities).")
    elif alt_key == "ba_xx":
        line2 = tr(lang, f"{second}: Ja (für alle prior Wahrscheinlichkeiten).", f"{second}: Yes (for all prior probabilities).")
    else:
        d1 = 3 * x >= 2 * w
        d2 = 4 * y >= z
        d3 = 2 * y >= w
        d4 = 3 * x >= 5 * z
        ok = d1 and d2 and d3 and d4
        line2 = tr(
            lang,
            f"{second}: {'Ja' if ok else 'Nein'}; 3·Prob(a,d) ≥ 2·Prob(a,c) ({frac_str(3*x)} ≥ {frac_str(2*w)}) {'✓' if d1 else '✗'}, "
            f"4·Prob(b,c) ≥ Prob(b,d) ({frac_str(4*y)} ≥ {frac_str(z)}) {'✓' if d2 else '✗'}, "
            f"2·Prob(b,c) ≥ Prob(a,c) ({frac_str(2*y)} ≥ {frac_str(w)}) {'✓' if d3 else '✗'}, "
            f"3·Prob(a,d) ≥ 5·Prob(b,d) ({frac_str(3*x)} ≥ {frac_str(5*z)}) {'✓' if d4 else '✗'}",
            f"{second}: {'Yes' if ok else 'No'}; 3·Prob(a,d) ≥ 2·Prob(a,c) ({frac_str(3*x)} ≥ {frac_str(2*w)}) {'✓' if d1 else '✗'}, "
            f"4·Prob(b,c) ≥ Prob(b,d) ({frac_str(4*y)} ≥ {frac_str(z)}) {'✓' if d2 else '✗'}, "
            f"2·Prob(b,c) ≥ Prob(a,c) ({frac_str(2*y)} ≥ {frac_str(w)}) {'✓' if d3 else '✗'}, "
            f"3·Prob(a,d) ≥ 5·Prob(b,d) ({frac_str(3*x)} ≥ {frac_str(5*z)}) {'✓' if d4 else '✗'}",
        )
    return tr(lang, f"Begründung: {line1} {line2}", f"Reasoning: {line1} {line2}")
