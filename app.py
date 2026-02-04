import random
from fractions import Fraction
from shiny import App, ui, reactive, render

# =========================================================
# Fixed strategy sets
# =========================================================
P1_STRATS_EX1 = ["A", "B", "C"]
P2_STRATS_EX1 = ["X", "Y", "Z"]

P1_STRATS_EX2 = ["A", "B", "C", "D"]
P2_STRATS_EX2 = ["X", "Y", "Z"]

P1_STRATS_EX6 = ["A", "B"]
P2_STRATS_EX6 = ["X", "Y"]
P1_STRATS_T2_EX1 = ["A", "B", "C"]
P2_STRATS_T2_EX1 = ["X", "Y", "Z"]
P1_STRATS_T2_EX2 = ["A", "B", "C"]
P2_STRATS_T2_EX2 = ["A", "B", "C"]
P1_STRATS_T3_EX1 = ["XY", "XZ", "YZ"]
P2_STRATS_T3_EX1 = ["X", "Y", "Z"]
P1_STRATS_BAYES_EX1 = ["A", "B"]
P2_STRATS_BAYES_EX1 = ["X", "Y"]
P1_STRATS_BAYES_EX2A = ["A", "B"]
P2_STRATS_BAYES_EX2A = ["X", "Y"]

T3_EX1_OPTION_TEXT = {
    "opt1": "A) Firma 1: (1/3, 1/3, 1/3) | Firma 2: (3/11, 4/11, 4/11)",
    "opt2": "B) Firma 1: (3/11, 4/11, 4/11) | Firma 2: (1/3, 1/3, 1/3)",
    "opt3": "C) Firma 1: (1/3, 1/3, 1/3) | Firma 2: (1/3, 1/3, 1/3)",
    "opt4": "D) Firma 1: (1/3, 1/3, 1/3) | Firma 2: (3/7, 2/7, 2/7)",
    "opt5": "E) Firma 1: (3/7, 2/7, 2/7) | Firma 2: (1/3, 1/3, 1/3)",
    "opt6": "F) Firma 1: (1/3, 1/3, 1/3) | Firma 2: (3/5, 1/5, 1/5)",
    "opt7": "G) Firma 1: (3/5, 1/5, 1/5) | Firma 2: (1/3, 1/3, 1/3)",
}
T3_EX1_OPTION_CHOICES = {
    "opt1": ui.HTML("A)<br>Firma 1: (1/3, 1/3, 1/3)<br>Firma 2: (3/11, 4/11, 4/11)"),
    "opt2": ui.HTML("B)<br>Firma 1: (3/11, 4/11, 4/11)<br>Firma 2: (1/3, 1/3, 1/3)"),
    "opt3": ui.HTML("C)<br>Firma 1: (1/3, 1/3, 1/3)<br>Firma 2: (1/3, 1/3, 1/3)"),
    "opt4": ui.HTML("D)<br>Firma 1: (1/3, 1/3, 1/3)<br>Firma 2: (3/7, 2/7, 2/7)"),
    "opt5": ui.HTML("E)<br>Firma 1: (3/7, 2/7, 2/7)<br>Firma 2: (1/3, 1/3, 1/3)"),
    "opt6": ui.HTML("F)<br>Firma 1: (1/3, 1/3, 1/3)<br>Firma 2: (3/5, 1/5, 1/5)"),
    "opt7": ui.HTML("G)<br>Firma 1: (3/5, 1/5, 1/5)<br>Firma 2: (1/3, 1/3, 1/3)"),
}

# =========================================================
# Intro example (static)
# =========================================================
INTRO_ROWS = ["A", "B"]
INTRO_COLS = ["X", "Y", "Z"]
INTRO_PAYOFFS = {
    ("A", "X"): "4, 4",
    ("A", "Y"): "2, 8",
    ("A", "Z"): "7, 7",
    ("B", "X"): "5, 4",
    ("B", "Y"): "5, 9",
    ("B", "Z"): "1, 3",
}
BAYES_INTRO_ROWS = ["A", "B"]
BAYES_INTRO_COLS = ["X", "Y"]
BAYES_INTRO_PAYOFFS_T1 = {
    ("A", "X"): "4, 3",
    ("A", "Y"): "2, 5",
    ("B", "X"): "5, 2",
    ("B", "Y"): "1, 4",
}
BAYES_INTRO_PAYOFFS_T2 = {
    ("A", "X"): "6, 2",
    ("A", "Y"): "1, 3",
    ("B", "X"): "3, 4",
    ("B", "Y"): "2, 1",
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

# =========================================================
# Helpers
# =========================================================
def tr(lang, de, en):
    return en if lang == "en" else de

def payoff_strings_from_tuple_payoffs(payoffs):
    """(row,col)->(u1,u2)  => (row,col)-> 'u1, u2' """
    return {(r, c): f"{payoffs[(r, c)][0]}, {payoffs[(r, c)][1]}" for (r, c) in payoffs}

def payoff_table(rows, cols, payoff_strings, lang="de", label_i18n=None, row_player_label=None, col_player_label=None):
    """
    payoff_strings: dict[(row,col)] -> "u1, u2"  (with or without parentheses)
    """
    n_rows = len(rows)
    n_cols = len(cols)

    def fmt(v: str) -> str:
        return v if "(" in v else f"({v})"

    def label_attrs(label):
        if label_i18n and label in label_i18n:
            return {
                "data-i18n-de": label_i18n[label]["de"],
                "data-i18n-en": label_i18n[label]["en"],
            }
        return {}

    p1_label = row_player_label or tr(lang, "Spieler 1", "Player 1")
    p2_label = col_player_label or tr(lang, "Spieler 2", "Player 2")

    return ui.tags.table(
        ui.tags.thead(
            ui.tags.tr(
                ui.tags.th("", colspan=2),
                ui.tags.th(
                    p2_label,
                    colspan=n_cols,
                    style="font-weight:600;",
                ),
            ),
            ui.tags.tr(
                ui.tags.th(""),
                ui.tags.th("", style="border-right: 1px solid #222;"),
                *[ui.tags.th(c, **label_attrs(c)) for c in cols],
            ),
        ),
        ui.tags.tbody(
            ui.tags.tr(
                ui.tags.th(
                    p1_label,
                    rowspan=n_rows,
                    style="font-weight:600; vertical-align:middle;",
                ),
                ui.tags.th(
                    rows[0],
                    style="font-weight:600; border-right: 1px solid #222;",
                    **label_attrs(rows[0]),
                ),
                *[ui.tags.td(fmt(payoff_strings[(rows[0], c)])) for c in cols],
            ),
            *[
                ui.tags.tr(
                    ui.tags.th(
                        r,
                        style="font-weight:600; border-right: 1px solid #222;",
                        **label_attrs(r),
                    ),
                    *[ui.tags.td(fmt(payoff_strings[(r, c)])) for c in cols],
                )
                for r in rows[1:]
            ],
        ),
        class_="table table-bordered text-center align-middle w-auto",
        style="margin-left: 0; margin-right: 0;",
    )

def notation_ul(rows, cols, payoffs, lang="de"):
    row = "A" if "A" in rows else rows[0]
    col = "X" if "X" in cols else cols[0]
    u1, u2 = payoffs[(row, col)]
    return ui.tags.ul(
        ui.tags.li(ui.tags.code("N = {1, 2}")),
        ui.tags.li(tr(lang, "Spieler 1: ", "Player 1: "), ui.tags.code(f"S₁ = {{{', '.join(rows)}}}")),
        ui.tags.li(tr(lang, "Spieler 2: ", "Player 2: "), ui.tags.code(f"S₂ = {{{', '.join(cols)}}}")),
        ui.tags.li(
            tr(lang, "Beispiel: ", "Example: "),
            ui.tags.code(f"s = ({row}, {col})"),
            tr(lang, " und ", " and "),
            ui.tags.code(f"u = ({u1}, {u2})"),
        ),
        class_="mb-0",
    )

def ex5_matrix_ui(rows, cols, lang="de"):
    choices = {
        "yes_not_strict": tr(lang, "ja, nicht strikt", "yes, not strict"),
        "yes_strict": tr(lang, "ja, strikt", "yes, strict"),
        "no": tr(lang, "nein", "no"),
    }
    return ui.tags.table(
        ui.tags.thead(
            ui.tags.tr(
                ui.tags.th("", style="border-right: 1px solid #222;"),
                *[ui.tags.th(c) for c in cols],
            )
        ),
        ui.tags.tbody(
            *[
                ui.tags.tr(
                    ui.tags.th(r, style="font-weight:600; border-right: 1px solid #222;"),
                    *[
                        ui.tags.td(
                            ui.input_radio_buttons(
                                f"ex5_{r}_{c}",
                                None,
                                choices=choices,
                                selected="no",
                            )
                        )
                        for c in cols
                    ],
                )
                for r in rows
            ]
        ),
        class_="table table-bordered align-middle w-auto ex5-matrix",
    )

# =========================================================
# Exercise 1: Best response
# =========================================================
def generate_random_game_ex1():
    return {(r, c): (random.randint(0, 9), random.randint(0, 9)) for r in P1_STRATS_EX1 for c in P2_STRATS_EX1}

def best_response_set(payoffs, responder, opponent_strat):
    """
    responder: 1 or 2
    opponent_strat: if responder=1 -> column in P2_STRATS_EX1
                   if responder=2 -> row in P1_STRATS_EX1
    returns set of best-response strategies for responder
    """
    if responder == 1:
        col = opponent_strat
        values = {r: payoffs[(r, col)][0] for r in P1_STRATS_EX1}
        m = max(values.values())
        return {r for r, v in values.items() if v == m}
    else:
        row = opponent_strat
        values = {c: payoffs[(row, c)][1] for c in P2_STRATS_EX1}
        m = max(values.values())
        return {c for c, v in values.items() if v == m}

def subset_label(strats, chosen_set, lang="de"):
    s = [x for x in strats if x in chosen_set]
    if len(s) == 0:
        return tr(lang, "Keine Strategie", "No strategy")
    if len(s) == 1:
        return tr(lang, f"Nur {s[0]}", f"Only {s[0]}")
    if len(s) == 2:
        return tr(lang, f"{s[0]} und {s[1]}", f"{s[0]} and {s[1]}")
    return tr(lang, f"{s[0]}, {s[1]} und {s[2]}", f"{s[0]}, {s[1]}, and {s[2]}")

def all_subset_labels(strats, lang="de"):
    a, b, c = strats
    return [
        tr(lang, f"Nur {a}", f"Only {a}"),
        tr(lang, f"Nur {b}", f"Only {b}"),
        tr(lang, f"Nur {c}", f"Only {c}"),
        tr(lang, f"{a} und {b}", f"{a} and {b}"),
        tr(lang, f"{a} und {c}", f"{a} and {c}"),
        tr(lang, f"{b} und {c}", f"{b} and {c}"),
        tr(lang, f"{a}, {b} und {c}", f"{a}, {b}, and {c}"),
        tr(lang, "Keine Strategie", "No strategy"),
    ]

# =========================================================
# Exercise 2: Strictly dominant strategies
# =========================================================
def strictly_dominant_row(payoffs, rows, cols):
    """Return row r if r strictly dominates all other rows for player 1, else None."""
    for r in rows:
        ok = True
        for r2 in rows:
            if r2 == r:
                continue
            # r strictly dominates r2 if for all cols: u1(r,c) > u1(r2,c)
            if not all(payoffs[(r, c)][0] > payoffs[(r2, c)][0] for c in cols):
                ok = False
                break
        if ok:
            return r
    return None

def strictly_dominant_col(payoffs, rows, cols):
    """Return col c if c strictly dominates all other cols for player 2, else None."""
    for c in cols:
        ok = True
        for c2 in cols:
            if c2 == c:
                continue
            # c strictly dominates c2 if for all rows: u2(r,c) > u2(r,c2)
            if not all(payoffs[(r, c)][1] > payoffs[(r, c2)][1] for r in rows):
                ok = False
                break
        if ok:
            return c
    return None

def dominance_choices(rows, cols, lang="de"):
    # exactly your style of choices
    choices = []
    for r in rows:
        choices.append(tr(lang, f"Ja, {r}", f"Yes, {r}"))
    for c in cols:
        choices.append(tr(lang, f"Ja, {c}", f"Yes, {c}"))
    for r in rows:
        for c in cols:
            choices.append(tr(lang, f"Ja, {r} und {c}", f"Yes, {r} and {c}"))
    choices.append(tr(lang, "Nein, keiner", "No, none"))
    return choices

def generate_random_game_ex2(force_prob=0.85):
    """
    Create 4x3 game with payoffs 0..9, but usually enforce at least one strictly dominant strategy
    for player 1 or player 2 (or both), so the exercise is not too rare.
    """
    rows = P1_STRATS_EX2
    cols = P2_STRATS_EX2

    # base random
    payoffs = {(r, c): (random.randint(0, 9), random.randint(0, 9)) for r in rows for c in cols}

    if random.random() > force_prob:
        # occasionally: no forcing (can end up with none)
        return payoffs

    # choose scenario: p2 only / p1 only / both
    scenario = random.choices(["p2", "p1", "both"], weights=[0.55, 0.20, 0.25], k=1)[0]

    # enforce p2 strictly dominant column
    if scenario in ("p2", "both"):
        dom_c = random.choice(cols)
        for r in rows:
            u2_dom = random.randint(5, 9)
            # make others strictly smaller
            others = [c for c in cols if c != dom_c]
            # pick two strictly smaller values
            u2_o1 = random.randint(0, max(0, u2_dom - 1))
            u2_o2 = random.randint(0, max(0, u2_dom - 1))
            # ensure strict: if equal accidentally, nudge one down if possible
            if u2_o2 >= u2_dom:
                u2_o2 = max(0, u2_dom - 1)
            # assign u2; keep u1 random
            u1_dom = payoffs[(r, dom_c)][0]
            payoffs[(r, dom_c)] = (u1_dom, u2_dom)

            c1, c2 = others
            payoffs[(r, c1)] = (payoffs[(r, c1)][0], min(u2_dom - 1, u2_o1))
            payoffs[(r, c2)] = (payoffs[(r, c2)][0], min(u2_dom - 1, u2_o2))

        # final pass to guarantee strictness against both other cols per row
        for r in rows:
            dom_val = payoffs[(r, dom_c)][1]
            for c in cols:
                if c == dom_c:
                    continue
                if payoffs[(r, c)][1] >= dom_val:
                    payoffs[(r, c)] = (payoffs[(r, c)][0], max(0, dom_val - 1))

    # enforce p1 strictly dominant row
    if scenario in ("p1", "both"):
        dom_r = random.choice(rows)
        for c in cols:
            u1_dom = random.randint(5, 9)
            others = [r for r in rows if r != dom_r]

            # set dominant u1 for dom_r,c
            payoffs[(dom_r, c)] = (u1_dom, payoffs[(dom_r, c)][1])

            # set all other rows strictly smaller at this column
            for r in others:
                u1_other = random.randint(0, max(0, u1_dom - 1))
                payoffs[(r, c)] = (min(u1_dom - 1, u1_other), payoffs[(r, c)][1])

        # final pass: guarantee strictness at each column
        for c in cols:
            dom_val = payoffs[(dom_r, c)][0]
            for r in rows:
                if r == dom_r:
                    continue
                if payoffs[(r, c)][0] >= dom_val:
                    payoffs[(r, c)] = (max(0, dom_val - 1), payoffs[(r, c)][1])

    return payoffs

def correct_dominance_label(payoffs, lang="de"):
    r = strictly_dominant_row(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)
    c = strictly_dominant_col(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)

    if r and c:
        return tr(lang, f"Ja, {r} und {c}", f"Yes, {r} and {c}"), r, c
    if r:
        return tr(lang, f"Ja, {r}", f"Yes, {r}"), r, None
    if c:
        return tr(lang, f"Ja, {c}", f"Yes, {c}"), None, c
    return tr(lang, "Nein, keiner", "No, none"), None, None

def dominance_explanation(r_dom, c_dom, lang="de"):
    if r_dom and c_dom:
        return tr(
            lang,
            (f"Spieler 1 hat mit {r_dom} eine strikt dominante Strategie (u₁ ist in jeder Spalte strikt höher als bei den anderen Zeilen) "
             f"und Spieler 2 hat mit {c_dom} eine strikt dominante Strategie (u₂ ist in jeder Zeile strikt höher als in den anderen Spalten)."),
            (f"Player 1 has a strictly dominant strategy {r_dom} (u₁ is strictly higher in every column than in the other rows) "
             f"and Player 2 has a strictly dominant strategy {c_dom} (u₂ is strictly higher in every row than in the other columns).")
        )
    if c_dom:
        return tr(
            lang,
            (f"{c_dom} ist strikt dominant für Spieler 2: Egal, ob Spieler 1 A, B, C oder D spielt, "
             f"ist u₂ bei {c_dom} strikt größer als bei den anderen Strategien."),
            (f"{c_dom} is strictly dominant for Player 2: No matter whether Player 1 plays A, B, C, or D, "
             f"u₂ at {c_dom} is strictly higher than for the other strategies.")
        )
    if r_dom:
        return tr(
            lang,
            (f"{r_dom} ist strikt dominant für Spieler 1: Egal, ob Spieler 2 X, Y oder Z spielt, "
             f"ist u₁ bei {r_dom} strikt größer als bei den anderen Strategien."),
            (f"{r_dom} is strictly dominant for Player 1: No matter whether Player 2 plays X, Y, or Z, "
             f"u₁ at {r_dom} is strictly higher than for the other strategies.")
        )
    return tr(
        lang,
        "Keine Strategie ist für einen Spieler in allen Fällen strikt besser als jede Alternative.",
        "No strategy is strictly better for a player in all cases than any alternative."
    )

# Hilfsfunktionen für schwach dominierende Strategien
def weakly_dominant_row(payoffs, rows, cols):
    """Gibt die Zeilenstrategie zurück, die alle anderen Zeilen schwach dominiert (oder None)."""
    for r in rows:
        dominates_all = True
        for r2 in rows:
            if r2 == r:
                continue
            strictly_better_exists = False
            for c in cols:
                if payoffs[(r, c)][0] < payoffs[(r2, c)][0]:
                    dominates_all = False
                    break
                if payoffs[(r, c)][0] > payoffs[(r2, c)][0]:
                    strictly_better_exists = True
            else:
                # Schleife nicht abgebrochen: r >= r2 für alle c
                if not strictly_better_exists:
                    dominates_all = False
            if not dominates_all:
                break
        if dominates_all:
            return r
    return None

def weakly_dominant_col(payoffs, rows, cols):
    """Gibt die Spaltenstrategie zurück, die alle anderen Spalten schwach dominiert (oder None)."""
    for c in cols:
        dominates_all = True
        for c2 in cols:
            if c2 == c:
                continue
            strictly_better_exists = False
            for r in rows:
                if payoffs[(r, c)][1] < payoffs[(r, c2)][1]:
                    dominates_all = False
                    break
                if payoffs[(r, c)][1] > payoffs[(r, c2)][1]:
                    strictly_better_exists = True
            else:
                if not strictly_better_exists:
                    dominates_all = False
            if not dominates_all:
                break
        if dominates_all:
            return c
    return None

# Funktion zur Ermittlung des korrekten Antwort-Labels und der dominanten Strategie(n) in Übung 3
def correct_dominance_label_weak(payoffs, lang="de"):
    r_dom_strict = strictly_dominant_row(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)
    c_dom_strict = strictly_dominant_col(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)
    r_dom_weak = None if r_dom_strict else weakly_dominant_row(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)
    c_dom_weak = None if c_dom_strict else weakly_dominant_col(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)
    r_dom = r_dom_strict or r_dom_weak
    c_dom = c_dom_strict or c_dom_weak
    r_type = tr(lang, "strikt", "strictly") if r_dom_strict else (tr(lang, "schwach", "weakly") if r_dom_weak else None)
    c_type = tr(lang, "strikt", "strictly") if c_dom_strict else (tr(lang, "schwach", "weakly") if c_dom_weak else None)
    # Antwort-Label formen
    if r_dom and c_dom:
        label = tr(lang, f"Ja, {r_dom} und {c_dom}", f"Yes, {r_dom} and {c_dom}")
    elif r_dom:
        label = tr(lang, f"Ja, {r_dom}", f"Yes, {r_dom}")
    elif c_dom:
        label = tr(lang, f"Ja, {c_dom}", f"Yes, {c_dom}")
    else:
        label = tr(lang, "Nein, keiner", "No, none")
    return label, r_dom, r_type, c_dom, c_type

# Funktion zur Erläuterung für Übung 3 (dominante Strategien)
def dominance_explanation_weak(r_dom, r_type, c_dom, c_type, lang="de"):
    if r_dom and c_dom:
        expl_r = tr(
            lang,
            "immer mindestens so hoch wie bei den anderen Strategien und mindestens gegen eine Strategie von Spieler 2 echt höher"
            if r_type == "schwach" else
            "in jeder Spalte strikt höher als bei den anderen Strategien",
            "always at least as high as the other strategies and strictly higher against at least one of Player 2's strategies"
            if r_type == "weakly" else
            "strictly higher in every column than the other strategies"
        )
        expl_c = tr(
            lang,
            "immer mindestens so hoch wie bei den anderen Strategien und mindestens gegen eine Strategie von Spieler 1 echt höher"
            if c_type == "schwach" else
            "in jeder Zeile strikt höher als bei den anderen Strategien",
            "always at least as high as the other strategies and strictly higher against at least one of Player 1's strategies"
            if c_type == "weakly" else
            "strictly higher in every row than the other strategies"
        )
        return tr(
            lang,
            (f"Spieler 1 hat mit {r_dom} eine {r_type} dominante Strategie "
             f"(egal, ob Spieler 2 X, Y oder Z spielt, ist u₁ bei {r_dom} {expl_r}) "
             f"und Spieler 2 hat mit {c_dom} eine {c_type} dominante Strategie "
             f"(egal, ob Spieler 1 A, B, C oder D spielt, ist u₂ bei {c_dom} {expl_c})."),
            (f"Player 1 has a {r_type} dominant strategy {r_dom} "
             f"(no matter whether Player 2 plays X, Y, or Z, u₁ at {r_dom} is {expl_r}) "
             f"and Player 2 has a {c_type} dominant strategy {c_dom} "
             f"(no matter whether Player 1 plays A, B, C, or D, u₂ at {c_dom} is {expl_c}).")
        )
    if r_dom:
        if r_type == tr(lang, "schwach", "weakly"):
            return tr(
                lang,
                (f"{r_dom} ist schwach dominant für Spieler 1: Egal, ob Spieler 2 X, Y oder Z spielt, "
                 f"ist u₁ bei {r_dom} immer mindestens so hoch wie bei den anderen Strategien "
                 f"und mindestens in einem Fall strikt höher."),
                (f"{r_dom} is weakly dominant for Player 1: No matter whether Player 2 plays X, Y, or Z, "
                 f"u₁ at {r_dom} is always at least as high as the other strategies "
                 f"and strictly higher in at least one case.")
            )
        return tr(
            lang,
            (f"{r_dom} ist strikt dominant für Spieler 1: Egal, ob Spieler 2 X, Y oder Z spielt, "
             f"ist u₁ bei {r_dom} strikt größer als bei den anderen Strategien."),
            (f"{r_dom} is strictly dominant for Player 1: No matter whether Player 2 plays X, Y, or Z, "
             f"u₁ at {r_dom} is strictly higher than the other strategies.")
        )
    if c_dom:
        if c_type == tr(lang, "schwach", "weakly"):
            return tr(
                lang,
                (f"{c_dom} ist schwach dominant für Spieler 2: Egal, ob Spieler 1 A, B, C oder D spielt, "
                 f"ist u₂ bei {c_dom} immer mindestens so hoch wie bei den anderen Strategien "
                 f"und mindestens in einem Fall strikt höher."),
                (f"{c_dom} is weakly dominant for Player 2: No matter whether Player 1 plays A, B, C, or D, "
                 f"u₂ at {c_dom} is always at least as high as the other strategies "
                 f"and strictly higher in at least one case.")
            )
        return tr(
            lang,
            (f"{c_dom} ist strikt dominant für Spieler 2: Egal, ob Spieler 1 A, B, C oder D spielt, "
             f"ist u₂ bei {c_dom} strikt größer als bei den anderen Strategien."),
            (f"{c_dom} is strictly dominant for Player 2: No matter whether Player 1 plays A, B, C, or D, "
             f"u₂ at {c_dom} is strictly higher than the other strategies.")
        )
    return tr(
        lang,
        "Keine Strategie ist für einen Spieler in allen Fällen mindestens so gut wie jede alternative Strategie (kein Spieler hat eine dominante Strategie).",
        "No strategy is at least as good as every alternative in all cases for a player (no player has a dominant strategy)."
    )

# Funktion zur Generierung eines 4x3-Spiels für Übung 3 
# (meist mit einer schwach oder strikt dominanten Strategie für einen oder beide Spieler)
def generate_random_game_ex3(force_prob=0.9):
    rows = P1_STRATS_EX2  # ["A", "B", "C", "D"]
    cols = P2_STRATS_EX2  # ["X", "Y", "Z"]
    payoffs = {(r, c): (random.randint(0, 9), random.randint(0, 9)) for r in rows for c in cols}
    if random.random() > force_prob:
        return payoffs  # gelegentlich kein Dominanz-Erzwingen
    # Entscheide Szenario: welcher Spieler bekommt eine domin. Strategie (schwach/strikt)
    scenario = random.choices(["p2", "p1", "both"], weights=[0.45, 0.15, 0.40], k=1)[0]
    p1_type = None
    p2_type = None
    if scenario == "p1":
        p1_type = random.choice(["strict", "weak"])
    elif scenario == "p2":
        p2_type = random.choice(["strict", "weak"])
    elif scenario == "both":
        # Wenn beide, mische die Typen (hälftig beide gleichartig vs. unterschiedlich)
        if random.random() < 0.5:
            p1_type = "strict" if random.random() < 0.5 else "weak"
            p2_type = "weak" if p1_type == "strict" else "strict"
        else:
            t = random.choice(["strict", "weak"])
            p1_type = t
            p2_type = t
    # Erzwinge strikt dominante Spalte für Spieler 2
    if p2_type == "strict":
        dom_c = random.choice(cols)
        for r in rows:
            u2_dom = random.randint(5, 9)
            others = [c for c in cols if c != dom_c]
            # Weise für jede andere Spalte strikt niedrigere u₂ zu
            u2_o1 = random.randint(0, max(0, u2_dom - 1))
            u2_o2 = random.randint(0, max(0, u2_dom - 1))
            if u2_o2 >= u2_dom:
                u2_o2 = max(0, u2_dom - 1)
            # setzte u₂ für dominierende Spalte (u₁ bleibt zufällig wie generiert)
            payoffs[(r, dom_c)] = (payoffs[(r, dom_c)][0], u2_dom)
            c1, c2 = others
            payoffs[(r, c1)] = (payoffs[(r, c1)][0], min(u2_dom - 1, u2_o1))
            payoffs[(r, c2)] = (payoffs[(r, c2)][0], min(u2_dom - 1, u2_o2))
        # Strikte Dominanz sicherstellen (u₂ in dominierender Spalte > u₂ in anderen Spalten für alle Zeilen)
        for r in rows:
            dom_val = payoffs[(r, dom_c)][1]
            for c in cols:
                if c == dom_c:
                    continue
                if payoffs[(r, c)][1] >= dom_val:
                    payoffs[(r, c)] = (payoffs[(r, c)][0], max(0, dom_val - 1))
    # Erzwinge strikt dominante Zeile für Spieler 1
    if p1_type == "strict":
        dom_r = random.choice(rows)
        for c in cols:
            u1_dom = random.randint(5, 9)
            others = [r for r in rows if r != dom_r]
            payoffs[(dom_r, c)] = (u1_dom, payoffs[(dom_r, c)][1])
            for r in others:
                u1_other = random.randint(0, max(0, u1_dom - 1))
                payoffs[(r, c)] = (min(u1_dom - 1, u1_other), payoffs[(r, c)][1])
        # Strikte Dominanz sicherstellen (u₁ in dominierender Zeile > u₁ in anderen Zeilen für alle Spalten)
        for c in cols:
            dom_val = payoffs[(dom_r, c)][0]
            for r in rows:
                if r == dom_r:
                    continue
                if payoffs[(r, c)][0] >= dom_val:
                    payoffs[(r, c)] = (max(0, dom_val - 1), payoffs[(r, c)][1])
    # Erzwinge schwach dominante Spalte für Spieler 2
    if p2_type == "weak":
        dom_c = random.choice(cols)
        for r in rows:
            # setze u₂ in dominierender Spalte eher hoch und andere Spalten <= diesem Wert
            u2_dom = random.randint(5, 9)
            payoffs[(r, dom_c)] = (payoffs[(r, dom_c)][0], u2_dom)
            for c in cols:
                if c == dom_c:
                    continue
                u2_val = random.randint(0, u2_dom)  # <= u2_dom
                payoffs[(r, c)] = (payoffs[(r, c)][0], u2_val)
        # Stelle sicher, dass für jede andere Spalte mindestens in einer Zeile u₂(dom_c) > u₂(anderer Spalte) gilt
        for c2 in cols:
            if c2 == dom_c:
                continue
            exists_strict = False
            for r in rows:
                if payoffs[(r, dom_c)][1] > payoffs[(r, c2)][1]:
                    exists_strict = True
                    break
            if not exists_strict:
                # Wenn noch kein strikter Vorteil, reduziere u₂ in c2 bei einer zufälligen Zeile
                r_choice = random.choice(rows)
                if payoffs[(r_choice, dom_c)][1] > 0:
                    payoffs[(r_choice, c2)] = (payoffs[(r_choice, c2)][0],
                                               min(payoffs[(r_choice, dom_c)][1] - 1, payoffs[(r_choice, c2)][1]))
                else:
                    payoffs[(r_choice, c2)] = (payoffs[(r_choice, c2)][0], 0)
    # Erzwinge schwach dominante Zeile für Spieler 1
    if p1_type == "weak":
        dom_r = random.choice(rows)
        for c in cols:
            u1_dom = random.randint(5, 9)
            payoffs[(dom_r, c)] = (u1_dom, payoffs[(dom_r, c)][1])
            for r in rows:
                if r == dom_r:
                    continue
                u1_val = random.randint(0, u1_dom)  # <= u1_dom
                payoffs[(r, c)] = (u1_val, payoffs[(r, c)][1])
        # Für jede andere Zeile r2 sicherstellen, dass es mindestens eine Spalte gibt mit u1(dom_r) > u1(r2)
        for r2 in rows:
            if r2 == dom_r:
                continue
            exists_strict = False
            for c in cols:
                if payoffs[(dom_r, c)][0] > payoffs[(r2, c)][0]:
                    exists_strict = True
                    break
            if not exists_strict:
                c_choice = random.choice(cols)
                if payoffs[(dom_r, c_choice)][0] > 0:
                    payoffs[(r2, c_choice)] = (min(payoffs[(dom_r, c_choice)][0] - 1, payoffs[(r2, c_choice)][0]),
                                               payoffs[(r2, c_choice)][1])
                else:
                    payoffs[(r2, c_choice)] = (0, payoffs[(r2, c_choice)][1])
    return payoffs

# Funktion zur Bestimmung aller Nash-Gleichgewichte in einem 4x3-Spiel (Übung 4)
def find_nash_equilibria(payoffs, rows, cols):
    ne_list = []
    for r in rows:
        for c in cols:
            # Prüfe Besteantwort-Bedingungen für beide Spieler:
            # Spieler 1 darf in Spalte c keine höhere Auszahlung in einer anderen Zeile erzielen können
            p1_ok = True
            for r2 in rows:
                if payoffs[(r2, c)][0] > payoffs[(r, c)][0]:
                    p1_ok = False
                    break
            # Spieler 2 darf in Zeile r keine höhere Auszahlung in einer anderen Spalte erzielen können
            p2_ok = True
            for c2 in cols:
                if payoffs[(r, c2)][1] > payoffs[(r, c)][1]:
                    p2_ok = False
                    break
            if p1_ok and p2_ok:
                ne_list.append((r, c))
    return ne_list

def generate_random_game_t2_ex1():
    """Create a random 3x3 game for trembling-hand perfection (pure strategies)."""
    return {
        (r, c): (random.randint(0, 9), random.randint(0, 9))
        for r in P1_STRATS_T2_EX1
        for c in P2_STRATS_T2_EX1
    }

def weakly_dominated_rows(payoffs, rows, cols):
    """Rows weakly dominated by another pure row strategy for Player 1."""
    dominated = set()
    for r in rows:
        for r2 in rows:
            if r2 == r:
                continue
            ge_all = all(payoffs[(r2, c)][0] >= payoffs[(r, c)][0] for c in cols)
            gt_any = any(payoffs[(r2, c)][0] > payoffs[(r, c)][0] for c in cols)
            if ge_all and gt_any:
                dominated.add(r)
                break
    return dominated

def weakly_dominated_cols(payoffs, rows, cols):
    """Columns weakly dominated by another pure column strategy for Player 2."""
    dominated = set()
    for c in cols:
        for c2 in cols:
            if c2 == c:
                continue
            ge_all = all(payoffs[(r, c2)][1] >= payoffs[(r, c)][1] for r in rows)
            gt_any = any(payoffs[(r, c2)][1] > payoffs[(r, c)][1] for r in rows)
            if ge_all and gt_any:
                dominated.add(c)
                break
    return dominated

def trembling_hand_perfect_pure_equilibria(payoffs, rows, cols):
    """
    In this exercise setting: THP pure equilibria = pure Nash equilibria
    where neither played strategy is weakly dominated.
    """
    ne = find_nash_equilibria(payoffs, rows, cols)
    dominated_rows = weakly_dominated_rows(payoffs, rows, cols)
    dominated_cols = weakly_dominated_cols(payoffs, rows, cols)
    return [(r, c) for (r, c) in ne if r not in dominated_rows and c not in dominated_cols]

def t2_ex1_choices(lang="de"):
    combos = [f"({r},{c})" for r in P1_STRATS_T2_EX1 for c in P2_STRATS_T2_EX1]
    return combos + [tr(lang, "Keines", "None")]

def t2_ex1_correct_choice_set(payoffs, lang="de"):
    thp = trembling_hand_perfect_pure_equilibria(payoffs, P1_STRATS_T2_EX1, P2_STRATS_T2_EX1)
    if not thp:
        return {tr(lang, "Keines", "None")}
    return {f"({r},{c})" for (r, c) in thp}

def generate_random_game_t2_ex2():
    """
    Symmetric 3x3 game:
    u2(r,c) = u1(c,r). Bias diagonal entries upward to get more symmetric Nash candidates.
    """
    rows = P1_STRATS_T2_EX2
    cols = P2_STRATS_T2_EX2
    u1 = {(r, c): random.randint(0, 9) for r in rows for c in cols}

    # Encourage symmetric Nash equilibria by often making diagonal entries column maxima.
    for s in rows:
        if random.random() < 0.75:
            col_vals = [u1[(r, s)] for r in rows]
            target = max(col_vals)
            if u1[(s, s)] < target:
                u1[(s, s)] = target

    payoffs = {}
    for r in rows:
        for c in cols:
            payoffs[(r, c)] = (u1[(r, c)], u1[(c, r)])
    return payoffs

def symmetric_nash_strategies_t2_ex2(payoffs):
    """Return strategies s such that (s,s) is a Nash equilibrium in the symmetric game."""
    strats = P1_STRATS_T2_EX2
    sym_ne = []
    for s in strats:
        u_ss = payoffs[(s, s)][0]
        if all(payoffs[(sp, s)][0] <= u_ss for sp in strats):
            sym_ne.append(s)
    return sym_ne

def ess_strategies_t2_ex2(payoffs):
    """
    ESS definition for symmetric games (pure strategies):
    1) s is a best response to itself.
    2) For any tie best response s' != s against s, require u(s',s') < u(s,s').
    """
    strats = P1_STRATS_T2_EX2
    ess = []
    for s in strats:
        u_ss = payoffs[(s, s)][0]
        br_to_s = [sp for sp in strats if payoffs[(sp, s)][0] == u_ss]
        if any(payoffs[(sp, s)][0] > u_ss for sp in strats):
            continue
        ok2 = True
        for sp in br_to_s:
            if sp == s:
                continue
            if payoffs[(sp, sp)][0] >= payoffs[(s, sp)][0]:
                ok2 = False
                break
        if ok2:
            ess.append(s)
    return ess

def t2_ex2_choices(lang="de"):
    combos = [f"({r},{c})" for c in P2_STRATS_T2_EX2 for r in P1_STRATS_T2_EX2]
    return combos + [tr(lang, "Keines", "None")]

def t2_ex2_correct_choice_set(payoffs, lang="de"):
    ess = ess_strategies_t2_ex2(payoffs)
    if not ess:
        return {tr(lang, "Keines", "None")}
    return {f"({s},{s})" for s in ess}

def generate_random_game_bayes_ex1():
    """Create random parameters a..p (0..9) for Bayes exercise 1."""
    keys = list("abcdefghijklmnop")
    return {k: random.randint(0, 9) for k in keys}

def bayes_ex1_payoffs_by_type(params):
    """Return two 2x2 payoff dictionaries (type 1 and type 2 for player 1)."""
    payoffs_t1 = {
        ("A", "X"): (params["a"], params["b"]),
        ("A", "Y"): (params["c"], params["d"]),
        ("B", "X"): (params["e"], params["f"]),
        ("B", "Y"): (params["g"], params["h"]),
    }
    payoffs_t2 = {
        ("A", "X"): (params["i"], params["j"]),
        ("A", "Y"): (params["k"], params["l"]),
        ("B", "X"): (params["m"], params["n"]),
        ("B", "Y"): (params["o"], params["p"]),
    }
    return payoffs_t1, payoffs_t2

def bayes_ex1_profiles():
    p1_profiles = [("A", "A"), ("A", "B"), ("B", "A"), ("B", "B")]
    p2_actions = ["X", "Y"]
    return [f"(({t1},{t2}),{a2})" for a2 in p2_actions for (t1, t2) in p1_profiles]

def bayes_ex1_is_equilibrium(params, a_t1, a_t2, a2):
    """Check if ((a_t1, a_t2), a2) is a pure Bayes-Nash equilibrium."""
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

def bayes_ex1_correct_choice_set(params):
    correct = set()
    for a_t1, a_t2 in [("A", "A"), ("A", "B"), ("B", "A"), ("B", "B")]:
        for a2 in ["X", "Y"]:
            if bayes_ex1_is_equilibrium(params, a_t1, a_t2, a2):
                correct.add(f"(({a_t1},{a_t2}),{a2})")
    return correct

def frac_str(v: Fraction):
    return f"{v.numerator}/{v.denominator}" if v.denominator != 1 else f"{v.numerator}"

def generate_bayes_ex2_params():
    den = random.randint(8, 16)
    cuts = sorted(random.sample(range(1, den), 3))
    nums = [cuts[0], cuts[1] - cuts[0], cuts[2] - cuts[1], den - cuts[2]]
    random.shuffle(nums)
    return {"den": den, "w": nums[0], "x": nums[1], "y": nums[2], "z": nums[3]}

def bayes_ex2_probs(params):
    w = Fraction(params["w"], params["den"])
    x = Fraction(params["x"], params["den"])
    y = Fraction(params["y"], params["den"])
    z = Fraction(params["z"], params["den"])
    return w, x, y, z

def bayes_ex2a_values(params):
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

def bayes_ex2a_options(params, lang="de"):
    v = bayes_ex2a_values(params)
    return {
        "correct": (
            f"Prob(c|a)={frac_str(v['c_a'])}<br>Prob(d|a)={frac_str(v['d_a'])}<br>"
            f"Prob(c|b)={frac_str(v['c_b'])}<br>Prob(d|b)={frac_str(v['d_b'])}"
        ),
        "swap_a": (
            f"Prob(c|a)={frac_str(v['d_a'])}<br>Prob(d|a)={frac_str(v['c_a'])}<br>"
            f"Prob(c|b)={frac_str(v['c_b'])}<br>Prob(d|b)={frac_str(v['d_b'])}"
        ),
        "swap_b": (
            f"Prob(c|a)={frac_str(v['c_a'])}<br>Prob(d|a)={frac_str(v['d_a'])}<br>"
            f"Prob(c|b)={frac_str(v['d_b'])}<br>Prob(d|b)={frac_str(v['c_b'])}"
        ),
        "bayes_rev": (
            f"Prob(c|a)={frac_str(v['a_c'])}<br>Prob(d|a)={frac_str(v['b_c'])}<br>"
            f"Prob(c|b)={frac_str(v['a_d'])}<br>Prob(d|b)={frac_str(v['b_d'])}"
        ),
    }

def generate_bayes_ex2a_option_order():
    return random.sample(["correct", "swap_a", "swap_b", "bayes_rev"], 4)

def bayes_ex2a_choices_and_correct(params, option_order):
    formulas = bayes_ex2a_options(params)
    letters = ["A", "B", "C", "D"]
    choices = {}
    correct_key = None
    for idx, tag in enumerate(option_order):
        key = f"opt{idx+1}"
        choices[key] = ui.HTML(f"{letters[idx]})<br>{formulas[tag]}")
        if tag == "correct":
            correct_key = key
    return choices, correct_key

# Funktion zur Generierung eines 4x3-Spiels für Übung 4 
# (häufig mit mindestens einem Nash-Gleichgewicht, gelegentlich mit zwei oder keinem)
def generate_random_game_ex4(force_prob=0.9):
    rows = P1_STRATS_EX2
    cols = P2_STRATS_EX2
    payoffs = {(r, c): (random.randint(0, 9), random.randint(0, 9)) for r in rows for c in cols}
    if random.random() > force_prob:
        return payoffs  # kein Gleichgewicht erzwungen
    scenario = random.choices(["one", "two"], weights=[0.8, 0.2], k=1)[0]
    if scenario == "one":
        # Erzwinge ein bestimmtes Nash-Gleichgewicht (r*, c*)
        r_star = random.choice(rows)
        c_star = random.choice(cols)
        # Mache (r*, c*) zur wechselseitig besten Antwort:
        # Spieler 1: keine andere Zeile mit höherer Auszahlung in Spalte c*
        u1_val = random.randint(5, 9)
        payoffs[(r_star, c_star)] = (u1_val, payoffs[(r_star, c_star)][1])
        for r in rows:
            if r != r_star and payoffs[(r, c_star)][0] > u1_val:
                payoffs[(r, c_star)] = (random.randint(0, u1_val), payoffs[(r, c_star)][1])
            if r != r_star and payoffs[(r, c_star)][0] == u1_val:
                payoffs[(r, c_star)] = (max(0, u1_val - 1), payoffs[(r, c_star)][1])
        # Spieler 2: keine andere Spalte mit höherer Auszahlung in Zeile r*
        u2_val = random.randint(5, 9)
        payoffs[(r_star, c_star)] = (payoffs[(r_star, c_star)][0], u2_val)
        for c in cols:
            if c != c_star and payoffs[(r_star, c)][1] > u2_val:
                payoffs[(r_star, c)] = (payoffs[(r_star, c)][0], random.randint(0, u2_val))
            if c != c_star and payoffs[(r_star, c)][1] == u2_val:
                payoffs[(r_star, c)] = (payoffs[(r_star, c)][0], max(0, u2_val - 1))
    elif scenario == "two":
        # Erzwinge zwei Nash-Gleichgewichte (eine Spalte dominiert mit zwei gleich guten Zeilen)
        dom_c = random.choice(cols)
        # Mache dom_c zur strikt dominanten Spalte für Spieler 2 (P2 bevorzugt immer diese Spalte)
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
        # Wähle zwei Zeilen, die in Spalte dom_c gleich hohe (höchste) Auszahlungen für Spieler 1 bekommen
        r1, r2 = random.sample(rows, 2)
        high_val = random.randint(5, 9)
        payoffs[(r1, dom_c)] = (high_val, payoffs[(r1, dom_c)][1])
        payoffs[(r2, dom_c)] = (high_val, payoffs[(r2, dom_c)][1])
        # Stelle sicher, dass keine weitere Zeile gleichzieht (alle anderen unter high_val)
        for r in rows:
            if r not in (r1, r2) and payoffs[(r, dom_c)][0] >= high_val:
                payoffs[(r, dom_c)] = (max(0, high_val - 1), payoffs[(r, dom_c)][1])
    return payoffs

# =========================================================
# Exercise 5 and 6: Strict Nash equilibria & Mixed strategy equilibrium
# =========================================================

def generate_random_game_ex6():
    rows = P1_STRATS_EX6
    cols = P2_STRATS_EX6
    # Ensure each strategy is a strict best response to one of the opponent's strategies
    scenario = random.choice(["S1", "S2"])
    n = random.randint(2, 7)
    if scenario == "S2":
        # Scenario like Battle of the Sexes pattern (two pure NE, mixed NE exists)
        # Enforce p = 1/n for Player 1's mixing by adjusting Player 2's payoffs
        d2 = random.randint(1, max(1, 9 // max(1, (n-1))))
        d1 = (n - 1) * d2
        A_X_u2 = random.randint(0, 9 - d1)
        A_Y_u2 = A_X_u2 + d1
        B_Y_u2 = random.randint(0, 9 - d2)
        B_X_u2 = B_Y_u2 + d2
        u2 = {("A", "X"): A_X_u2, ("A", "Y"): A_Y_u2, ("B", "X"): B_X_u2, ("B", "Y"): B_Y_u2}
    else:
        # Scenario like Matching Pennies pattern (no pure NE, unique mixed NE)
        c2 = random.randint(1, max(1, 9 // max(1, (n-1))))
        c1 = (n - 1) * c2
        A_Y_u2 = random.randint(0, 9 - c1)
        A_X_u2 = A_Y_u2 + c1
        B_X_u2 = random.randint(0, 9 - c2)
        B_Y_u2 = B_X_u2 + c2
        u2 = {("A", "X"): A_X_u2, ("A", "Y"): A_Y_u2, ("B", "X"): B_X_u2, ("B", "Y"): B_Y_u2}
    # Player 1 payoffs: assign so that each strategy is a strict best response to one of opponent's strategies
    if scenario == "S2":
        # Player 1: B best against X, A best against Y
        B_X_u1 = random.randint(1, 9)
        A_X_u1 = random.randint(0, B_X_u1 - 1)
        A_Y_u1 = random.randint(1, 9)
        B_Y_u1 = random.randint(0, A_Y_u1 - 1)
    else:
        # Player 1: A best against X, B best against Y
        A_X_u1 = random.randint(1, 9)
        B_X_u1 = random.randint(0, A_X_u1 - 1)
        B_Y_u1 = random.randint(1, 9)
        A_Y_u1 = random.randint(0, B_Y_u1 - 1)
    u1 = {("A", "X"): A_X_u1, ("A", "Y"): A_Y_u1, ("B", "X"): B_X_u1, ("B", "Y"): B_Y_u1}
    payoffs = {}
    for (r, c) in u1:
        payoffs[(r, c)] = (u1[(r, c)], u2[(r, c)])
    return payoffs

def generate_random_game_t3_ex1():
    a = random.choice([1, 3, 4])
    payoffs = {}
    for r in P1_STRATS_T3_EX1:
        covered_markets = set(r)
        for c in P2_STRATS_T3_EX1:
            u1 = 6 if c in covered_markets else 9
            if c in covered_markets:
                u2 = 5
            else:
                u2 = a if c == "Z" else 2
            payoffs[(r, c)] = (u1, u2)
    return {"a": a, "payoffs": payoffs}

from fractions import Fraction

def format_p_fraction(p, allowed):
    """
    p: float
    allowed: list[str] like ["1/7","1/6","1/5","1/4","1/3","1/2"]
    """
    frac = Fraction(p).limit_denominator(20)

    frac_str = f"{frac.numerator}/{frac.denominator}"

    if frac_str in allowed:
        return frac_str
    return None

# =========================================================
# Special games rows
# =========================================================
SPECIAL_GAMES_ROWS = [
    ui.tags.div(
        ui.tags.h4("Gefangenendilemma", class_="mb-4",
                   **{"data-i18n-de": "Gefangenendilemma", "data-i18n-en": "Prisoner's Dilemma"}),
        ui.tags.div(
        ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h5("Beispielspiel", class_="card-title",
                               **{"data-i18n-de": "Beispielspiel", "data-i18n-en": "Example game"}),
                    payoff_table(
                        rows=["Kooperieren", "Defektieren"],
                        cols=["Kooperieren", "Defektieren"],
                        payoff_strings={
                            ("Kooperieren", "Kooperieren"): "3, 3",
                            ("Kooperieren", "Defektieren"): "0, 5",
                            ("Defektieren", "Kooperieren"): "5, 0",
                            ("Defektieren", "Defektieren"): "1, 1",
                        },
                        label_i18n={
                            "Kooperieren": {"de": "Kooperieren", "en": "Cooperate"},
                            "Defektieren": {"de": "Defektieren", "en": "Defect"},
                        },
                    ),
                    class_="card-body",
                ),
                class_="card shadow-sm h-100",
                style="background-color:#ffffff;",
            ),
            class_="special-col game",
        ),
        ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h5("Erklärung", class_="card-title",
                               **{"data-i18n-de": "Erklärung", "data-i18n-en": "Explanation"}),
                    ui.tags.p(
                        "Jeder Spieler hat unabhängig vom Verhalten des anderen einen Anreiz zu defektieren.",
                        **{"data-i18n-de": "Jeder Spieler hat unabhängig vom Verhalten des anderen einen Anreiz zu defektieren.",
                           "data-i18n-en": "Each player has an incentive to defect regardless of the other's behavior."},
                        class_="mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li("Defektieren ist strikt dominant für beide Spieler.",
                                   **{"data-i18n-de": "Defektieren ist strikt dominant für beide Spieler.",
                                      "data-i18n-en": "Defecting is strictly dominant for both players."}),
                        ui.tags.li("Einziges Nash-Gleichgewicht: (Defektieren, Defektieren).",
                                   **{"data-i18n-de": "Einziges Nash-Gleichgewicht: (Defektieren, Defektieren).",
                                      "data-i18n-en": "Unique Nash equilibrium: (Defect, Defect)."}),
                        ui.tags.li("Pareto-ineffiziente Nutzenkombination im Nash-Gleichgewicht: (1, 1) wird von (3, 3) Pareto-dominiert.",
                                   **{"data-i18n-de": "Pareto-ineffiziente Nutzenkombination im Nash-Gleichgewicht: (1, 1) wird von (3, 3) Pareto-dominiert.", "data-i18n-en": "Pareto-inefficient payoff combination in Nash equilibrium: (1, 1) is Pareto-dominated by (3, 3)."}),
                        class_="mb-0",
                    ),
                    class_="card-body",
                ),
                class_="card shadow-sm h-100",
                style="background-color:#ffffff;",
            ),
            class_="special-col text",
        ),
        class_="special-row",
        ),
        class_="mb-4",
    ),
    ui.tags.div(
        ui.tags.h4("Feiglingsspiel (Chicken)", class_="mb-4",
                   **{"data-i18n-de": "Feiglingsspiel (Chicken)", "data-i18n-en": "Chicken game"}),
        ui.tags.div(
        ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h5("Beispielspiel", class_="card-title",
                               **{"data-i18n-de": "Beispielspiel", "data-i18n-en": "Example game"}),
                    payoff_table(
                        rows=["Ausweichen", "Geradeaus"],
                        cols=["Ausweichen", "Geradeaus"],
                        payoff_strings={
                            ("Ausweichen", "Ausweichen"): "2, 2",
                            ("Ausweichen", "Geradeaus"): "1, 3",
                            ("Geradeaus", "Ausweichen"): "3, 1",
                            ("Geradeaus", "Geradeaus"): "0, 0",
                        },
                        label_i18n={
                            "Ausweichen": {"de": "Ausweichen", "en": "Swerve"},
                            "Geradeaus": {"de": "Geradeaus", "en": "Straight"},
                        },
                    ),
                    class_="card-body",
                ),
                class_="card shadow-sm h-100",
                style="background-color:#ffffff;",
            ),
            class_="special-col game",
        ),
        ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h5("Erklärung", class_="card-title",
                               **{"data-i18n-de": "Erklärung", "data-i18n-en": "Explanation"}),
                    ui.tags.p(
                        "Beide wollen nicht ausweichen, aber ein Zusammenstoß ist katastrophal.",
                        **{"data-i18n-de": "Beide wollen nicht ausweichen, aber ein Zusammenstoß ist katastrophal.",
                           "data-i18n-en": "Both want to stay straight, but a crash is catastrophic."},
                        class_="mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li("Zwei Nash-Gleichgewichte: (Geradeaus, Ausweichen) und (Ausweichen, Geradeaus).",
                                   **{"data-i18n-de": "Zwei Nash-Gleichgewichte: (Geradeaus, Ausweichen) und (Ausweichen, Geradeaus).",
                                      "data-i18n-en": "Two Nash equilibria: (Straight, Swerve) and (Swerve, Straight)."}),
                        ui.tags.li("Kein Spieler hat eine strikt dominante Strategie.",
                                   **{"data-i18n-de": "Kein Spieler hat eine strikt dominante Strategie.",
                                      "data-i18n-en": "No player has a strictly dominant strategy."}),
                        ui.tags.li("Es entsteht ein (Anti-)Koordinationsproblem. (Falls Kommunikation außerhalb des Spiels möglich wäre, können Commitment / glaubwürdige Drohungen relevant sein.)",
                                   **{"data-i18n-de": "Es entsteht ein (Anti-)Koordinationsproblem. (Falls Kommunikation außerhalb des Spiels möglich wäre, können Commitment / glaubwürdige Drohungen relevant sein.)",
                                      "data-i18n-en": "This game creates an (anti-)coordination problem. (If communication outside the game were possible, commitment/credible threats could be relevant.)"}),
                        class_="mb-0",
                    ),
                    class_="card-body",
                ),
                class_="card shadow-sm h-100",
                style="background-color:#ffffff;",
            ),
            class_="special-col text",
        ),
        class_="special-row",
        ),
        class_="mb-4",
    ),
    ui.tags.div(
        ui.tags.h4("Jagdspiel (Stag Hunt)", class_="mb-4",
                   **{"data-i18n-de": "Jagdspiel (Stag Hunt)", "data-i18n-en": "Stag Hunt"}),
        ui.tags.div(
        ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h5("Beispielspiel", class_="card-title",
                               **{"data-i18n-de": "Beispielspiel", "data-i18n-en": "Example game"}),
                    payoff_table(
                        rows=["Hirsch", "Hase"],
                        cols=["Hirsch", "Hase"],
                        payoff_strings={
                            ("Hirsch", "Hirsch"): "4, 4",
                            ("Hirsch", "Hase"): "0, 3",
                            ("Hase", "Hirsch"): "3, 0",
                            ("Hase", "Hase"): "2, 2",
                        },
                        label_i18n={
                            "Hirsch": {"de": "Hirsch", "en": "Stag"},
                            "Hase": {"de": "Hase", "en": "Hare"},
                        },
                    ),
                    class_="card-body",
                ),
                class_="card shadow-sm h-100",
                style="background-color:#ffffff;",
            ),
            class_="special-col game",
        ),
        ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h5("Erklärung", class_="card-title",
                               **{"data-i18n-de": "Erklärung", "data-i18n-en": "Explanation"}),
                    ui.tags.p(
                        "Koordinationsspiel, bei dem die Pareto-effiziente Nutzenkombination nur erreicht wird, wenn beide mitmachen und Fehlkoordination hierauf schmerzlicher ist.",
                        **{"data-i18n-de": "Koordinationsspiel, bei dem die Pareto-effiziente Nutzenkombination nur erreicht wird, wenn beide mitmachen und Fehlkoordination hierauf schmerzlicher ist.",
                           "data-i18n-en": "Coordination game in which the Pareto-efficient payoff combination is only achieved if both parties participate, and miscoordination is more painful in this case."},
                        class_="mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li("Zwei Nash-Gleichgewichte: (Hirsch, Hirsch) und (Hase, Hase).",
                                   **{"data-i18n-de": "Zwei Nash-Gleichgewichte: (Hirsch, Hirsch) und (Hase, Hase).",
                                      "data-i18n-en": "Two Nash equilibria: (Stag, Stag) and (Hare, Hare)."}),
                        ui.tags.li("Pareto-effizient aber riskant: (Hirsch, Hirsch).",
                                   **{"data-i18n-de": "Pareto-effizient aber riskant: (Hirsch, Hirsch).",
                                      "data-i18n-en": "Pareto-efficient but risky: (Stag, Stag)."}),
                        ui.tags.li("Typisch: Vertrauen/Koordination als Schlüsselproblem.",
                                   **{"data-i18n-de": "Typisch: Vertrauen/Koordination als Schlüsselproblem.",
                                      "data-i18n-en": "Typical: trust/coordination is the key problem."}),
                        class_="mb-0",
                    ),
                    class_="card-body",
                ),
                class_="card shadow-sm h-100",
                style="background-color:#ffffff;",
            ),
            class_="special-col text",
        ),
        class_="special-row",
        ),
        class_="mb-4",
    ),
    ui.tags.div(
        ui.tags.h4("Kampf der Geschlechter", class_="mb-4",
                   **{"data-i18n-de": "Kampf der Geschlechter", "data-i18n-en": "Battle of the Sexes"}),
        ui.tags.div(
        ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h5("Beispielspiel", class_="card-title",
                               **{"data-i18n-de": "Beispielspiel", "data-i18n-en": "Example game"}),
                    payoff_table(
                        rows=["Oper", "Fußball"],
                        cols=["Oper", "Fußball"],
                        payoff_strings={
                            ("Oper", "Oper"): "3, 2",
                            ("Oper", "Fußball"): "0, 0",
                            ("Fußball", "Oper"): "0, 0",
                            ("Fußball", "Fußball"): "2, 3",
                        },
                        label_i18n={
                            "Oper": {"de": "Oper", "en": "Opera"},
                            "Fußball": {"de": "Fußball", "en": "Football"},
                        },
                    ),
                    class_="card-body",
                ),
                class_="card shadow-sm h-100",
                style="background-color:#ffffff;",
            ),
            class_="special-col game",
        ),
        ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h5("Erklärung", class_="card-title",
                               **{"data-i18n-de": "Erklärung", "data-i18n-en": "Explanation"}),
                    ui.tags.p(
                        "Beide wollen sich koordinieren, aber bevorzugen unterschiedliche Aktivitäten.",
                        **{"data-i18n-de": "Beide wollen sich koordinieren, aber bevorzugen unterschiedliche Aktivitäten.",
                           "data-i18n-en": "Both want to coordinate, but they prefer different activities."},
                        class_="mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li("Zwei reine Nash-Gleichgewichte in reinen Strategen: (Oper, Oper) und (Fußball, Fußball).",
                                   **{"data-i18n-de": "Zwei reine Nash-Gleichgewichte in reinen Strategen: (Oper, Oper) und (Fußball, Fußball).",
                                      "data-i18n-en": "Two pure Nash equilibria in pure strategies: (Opera, Opera) and (Football, Football)."}),
                        ui.tags.li("Verteilungsproblem: Wer bekommt sein Wunsch-Ergebnis?",
                                   **{"data-i18n-de": "Koordinationsproblem: Wer bekommt sein Wunschergebnis?",
                                      "data-i18n-en": "Coordination problem: Who gets their preferred outcome?"}),
                        ui.tags.li("Zusätzlich existiert ein gemischtes Nash-Gleichgewicht.",
                                   **{"data-i18n-de": "Zusätzlich existiert ein Nash-Gleichgewicht in gemischten Strategien: ((3/5,2/5), (3/5,2/5)).",
                                      "data-i18n-en": "In addition, there is a Nash equilibrium in mixed strategies: ((3/5,2/5), (3/5,2/5))."}),
                        class_="mb-0",
                    ),
                    class_="card-body",
                ),
                class_="card shadow-sm h-100",
                style="background-color:#ffffff;",
            ),
            class_="special-col text",
        ),
        class_="special-row",
        ),
        class_="mb-4",
    ),
    ui.tags.div(
        ui.tags.h4("Ultimatumspiel (Variante mit simultaner Entscheidung)", class_="mb-4",
                   **{"data-i18n-de": "Ultimatumspiel (Variante mit simultaner Entscheidung)", "data-i18n-en": "Ultimatum game (Variant with simultaneous decision)"}),
        ui.tags.div(
        ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h5("Beispielspiel", class_="card-title",
                               **{"data-i18n-de": "Beispielspiel", "data-i18n-en": "Example game"}),
                    ui.tags.p(
                        "Vereinfacht: Spieler 1 bietet fair (50/50) oder unfair (90/10). "
                        "Spieler 2 kann annehmen oder ablehnen.",
                        **{"data-i18n-de": "Vereinfacht: Spieler 1 bietet fair (50/50) oder unfair (90/10). Spieler 2 kann annehmen oder ablehnen.",
                           "data-i18n-en": "Simplified: Player 1 offers fair (50/50) or unfair (90/10). Player 2 can accept or reject."},
                        class_="text-muted mb-3",
                    ),
                    payoff_table(
                        rows=["Fair", "Unfair"],
                        cols=["Annehmen", "Ablehnen"],
                        payoff_strings={
                            ("Fair", "Annehmen"): "5, 5",
                            ("Fair", "Ablehnen"): "0, 0",
                            ("Unfair", "Annehmen"): "9, 1",
                            ("Unfair", "Ablehnen"): "0, 0",
                        },
                        label_i18n={
                            "Fair": {"de": "Fair", "en": "Fair"},
                            "Unfair": {"de": "Unfair", "en": "Unfair"},
                            "Annehmen": {"de": "Annehmen", "en": "Accept"},
                            "Ablehnen": {"de": "Ablehnen", "en": "Reject"},
                        },
                    ),
                    class_="card-body",
                ),
                class_="card shadow-sm h-100",
                style="background-color:#ffffff;",
            ),
            class_="special-col game",
        ),
        ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h5("Erklärung", class_="card-title",
                               **{"data-i18n-de": "Erklärung", "data-i18n-en": "Explanation"}),
                    ui.tags.p(
                        "Spieler 2 nimmt jedes positive Angebot an, da Annehmen strikt besser ist als Ablehnen. Spieler 1 antizipiert dies und bietet so wenig wie möglich an.",
                        **{"data-i18n-de": "Spieler 2 nimmt jedes positive Angebot an, da Annehmen strikt besser ist als Ablehnen. Spieler 1 antizipiert dies und bietet so wenig wie möglich an.",
                           "data-i18n-en": "Player 2 accepts every positive offer, as accepting is strictly better than rejecting. Player 1 anticipates this and offers as little as possible."},
                        class_="mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li("Nash-Gleichgewicht: (Unfair, Annehmen)",
                                   **{"data-i18n-de": "Nash-Gleichgewicht: (Unfair, Annehmen)",
                                      "data-i18n-en": "Nash equilibrium: (Unfair, Accept)"}),
                        ui.tags.li("Empirie mit monetärer Auszahlung der „Nutzenwerte“ (Achtung: dann evtl. von den Auszahlungen abweichende Bewertung der Strategiekombinationen durch die Spieler): Unfaire Angebote werden oft abgelehnt (Fairness).",
                                   **{"data-i18n-de": "Empirie mit monetärer Auszahlung der „Nutzenwerte“ (Achtung: dann evtl. von den Auszahlungen abweichende Bewertung der Strategiekombinationen durch die Spieler): Unfaire Angebote werden oft abgelehnt (Fairness).",
                                      "data-i18n-en": "Empirical evidence with monetary payouts of ‘payoff values’ (note: players' assessment of strategy combinations may then differ from the payouts): Unfair offers are often rejected (fairness)."}),
                        ui.tags.li("Wichtiges Beispiel für Modell vs. Verhalten bzw. für monetäre Auszahlung ungleich Nutzen.",
                                   **{"data-i18n-de": "Wichtiges Beispiel für Modell vs. Verhalten bzw. für Nutzen ungleich monetäre Auszahlung.",
                                      "data-i18n-en": "Important example of model vs. behavior or payoff different from monetary payout."}),
                        class_="mb-0",
                    ),
                    class_="card-body",
                ),
                class_="card shadow-sm h-100",
                style="background-color:#ffffff;",
            ),
            class_="special-col text",
        ),
        class_="special-row",
        ),
        class_="mb-4",
    ),
]
# =========================================================
# UI
# =========================================================
app_ui = ui.page_fluid(
    ui.tags.head(
        ui.tags.title("Game Theory Trainer"),
    ),

    # ---------- Styles ----------
    ui.tags.style("""
    @import url("https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap");

    /* Make all rows flex containers */
.equal-height-row {
  display: flex;
}

/* Make columns stretch */
.equal-height-row > div {
  display: flex;
}

/* Make cards fill column height */
.equal-height-card {
  flex: 1 1 auto;
}
    /* Center the top nav tabs */
    :root {
        --header-bg: rgb(213, 236, 240);
        --header-height: 64px;
        --header-hover: #5f5f5f;
        --bg: #ffffff;
        --text: #1f1f1f;
        --card-bg: #ffffff;
        --muted: #6c757d;
        --border: #cfcfcf;
    }
    body {
        padding-top: var(--header-height);
        background-color: var(--bg);
        color: var(--text);
    }
    html, body {
        overflow-x: hidden;
    }
    body.dark-mode {
        --header-bg: #0b1523;
        --header-hover: #16243a;
        --bg: #111b2e;
        --text: #e8edf5;
        --card-bg: #17243a;
        --muted: #b2bdd1;
        --border: #6a7a96;
    }
    #main_tabs.nav-tabs,
    #main_tabs > .nav-tabs {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 8px;
        width: 100vw;
        margin-left: calc(50% - 50vw);
        min-height: var(--header-height);
        padding: 0 0.75rem;
        background-color: var(--header-bg);
        border-radius: 0;
        border-bottom: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
    }
    #main_tabs.nav-tabs .nav-link,
    #main_tabs > .nav-tabs .nav-link {
        color: rgb(87, 87, 86);
        font-weight: 700;
        background-color: transparent;
        border: none;
        font-size: 1.05rem;
    }
    #main_tabs.nav-tabs .nav-link[data-value="bayes_ex1"],
    #main_tabs > .nav-tabs .nav-link[data-value="bayes_ex1"],
    #main_tabs.nav-tabs .nav-link[data-value="bayes_ex2a"],
    #main_tabs > .nav-tabs .nav-link[data-value="bayes_ex2a"],
    #main_tabs.nav-tabs .nav-link[data-value="bayes_ex2b"],
    #main_tabs > .nav-tabs .nav-link[data-value="bayes_ex2b"] {
        display: none !important;
    }
    #main_tabs.nav-tabs .nav-link:hover,
    #main_tabs > .nav-tabs .nav-link:hover {
        color: #000000;
    }
    #main_tabs.nav-tabs .nav-link.active,
    #main_tabs > .nav-tabs .nav-link.active,
    #main_tabs.nav-tabs .nav-link:focus,
    #main_tabs > .nav-tabs .nav-link:focus {
        color: #000000;
        background-color: transparent;
        border: none;
        box-shadow: none;
    }
    .dark-mode #main_tabs.nav-tabs .nav-link,
    .dark-mode #main_tabs > .nav-tabs .nav-link {
        color: #e6e6e6;
    }
    .dark-mode #main_tabs.nav-tabs .nav-link.active,
    .dark-mode #main_tabs > .nav-tabs .nav-link.active,
    .dark-mode #main_tabs.nav-tabs .nav-link:focus,
    .dark-mode #main_tabs > .nav-tabs .nav-link:focus {
        color: #ffffff;
    }
    #main_tabs .dropdown-toggle::after {
        display: none;
    }
    #main_tabs .nav-item.dropdown:hover > .dropdown-menu {
        display: block;
    }
    body.nav-hover-disabled #main_tabs .nav-item.dropdown:hover > .dropdown-menu {
        display: none !important;
    }
    /* Disable dropdown menu only for menu labels used as direct navigation */
    #main_tabs .nav-item.dropdown.normalform-menu-item > .dropdown-menu {
        display: none !important;
    }
    .btn-success {
        background-color: rgb(200, 212, 0);
        border-color: rgb(200, 212, 0);
        color: rgb(87, 87, 86);
        font-weight: 600;
    }
    .btn-success:hover,
    .btn-success:focus,
    .btn-success:focus-visible {
        background-color: rgb(200, 212, 0);
        border-color: rgb(200, 212, 0);
        color: rgb(87, 87, 86);
        box-shadow: none;
    }
    .btn-success:active,
    .btn-success.active,
    .btn-check:checked + .btn-success,
    .btn-check:active + .btn-success,
    .show > .btn-success.dropdown-toggle {
        background-color: rgb(200, 212, 0);
        border-color: rgb(200, 212, 0);
        color: rgb(87, 87, 86);
        box-shadow: none;
    }
    .dark-mode .btn-success {
        background-color: #d4b24c;
        border-color: #d4b24c;
        color: #1a1a1a;
    }
    .dark-mode .btn-success:hover,
    .dark-mode .btn-success:focus,
    .dark-mode .btn-success:focus-visible,
    .dark-mode .btn-success:active,
    .dark-mode .btn-success.active,
    .dark-mode .btn-check:checked + .btn-success,
    .dark-mode .btn-check:active + .btn-success,
    .dark-mode .show > .btn-success.dropdown-toggle {
        background-color: #c2a040;
        border-color: #c2a040;
        color: #1a1a1a;
        box-shadow: none;
    }
    .lang-switch {
        position: fixed;
        top: 0;
        right: 0.75rem;
        height: var(--header-height);
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        z-index: 1002;
        font-weight: 600;
        font-size: 0.9rem;
        color: rgb(87, 87, 86);
        pointer-events: none;
    }
    .dark-mode .lang-switch {
        color: #e6e6e6;
    }
    .lang-switch * {
        pointer-events: auto;
    }
    .lang-switch .switch {
        position: relative;
        display: inline-block;
        width: 38px;
        height: 20px;
    }
    .lang-switch .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    .lang-switch .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #c0c0c0;
        transition: 0.2s;
        border-radius: 999px;
    }
    .lang-switch .slider:before {
        position: absolute;
        content: "";
        height: 14px;
        width: 14px;
        left: 3px;
        top: 3px;
        background-color: #ffffff;
        transition: 0.2s;
        border-radius: 50%;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    .lang-switch .switch input:checked + .slider {
        background-color: #7a7a7a;
    }
    .lang-switch .switch input:checked + .slider:before {
        transform: translateX(18px);
    }
    .impressum-btn {
        position: fixed;
        right: 0.75rem;
        bottom: 0.75rem;
        z-index: 1002;
        font-size: 0.85rem;
        padding: 0.35rem 0.6rem;
        font-style: italic;
    }
    .darkmode-toggle {
        position: fixed;
        left: 0.75rem;
        bottom: 0.75rem;
        z-index: 1002;
        width: 2.4rem;
        height: 2.4rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 0;
        line-height: 1;
    }
    .darkmode-toggle .icon-sun {
        display: none;
    }
    .darkmode-toggle .icon-moon {
        display: inline;
    }
    .dark-mode .darkmode-toggle .icon-sun {
        display: inline;
    }
    .dark-mode .darkmode-toggle .icon-moon {
        display: none;
    }
    .dark-mode .darkmode-toggle {
        color: #e6e6e6;
        border-color: var(--border);
    }
    .impressum-panel {
        position: fixed;
        right: 0.75rem;
        bottom: 3rem;
        width: 360px;
        background: #ffffff;
        border: 1px solid #cfcfcf;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        padding: 0.75rem;
        border-radius: 0.5rem;
        z-index: 1003;
        display: none;
    }
    .dark-mode .impressum-panel {
        background: var(--card-bg) !important;
        border-color: var(--border) !important;
        color: var(--text);
    }
    .impressum-panel a {
        color: #000000;
        text-decoration: none;
    }
    .dark-mode .impressum-panel a {
        color: var(--text);
    }
    .impressum-panel a:hover,
    .impressum-panel a:focus,
    .impressum-panel a:active,
    .impressum-panel a:visited {
        color: #000000;
    }
    .dark-mode .impressum-panel a:hover,
    .dark-mode .impressum-panel a:focus,
    .dark-mode .impressum-panel a:active,
    .dark-mode .impressum-panel a:visited {
        color: var(--text);
    }
    .impressum-panel a[href^="http"] {
        word-break: break-all;
    }
    #main_tabs.nav-tabs .impressum-nav-link,
    #main_tabs > .nav-tabs .impressum-nav-link,
    #main_tabs.nav-tabs .darkmode-nav-link,
    #main_tabs > .nav-tabs .darkmode-nav-link {
        display: inline-block;
        font-style: italic;
        padding: 0.2rem 0.45rem;
        font-size: 0.9rem;
        border: 1px solid #6c757d !important;
        border-radius: 0.375rem;
        background-color: #ffffff !important;
        color: #000000 !important;
        font-weight: 400;
        margin-right: 0.4rem;
    }
    #main_tabs.nav-tabs .darkmode-nav-link,
    #main_tabs > .nav-tabs .darkmode-nav-link {
        font-style: normal;
    }
    .impressum-panel.open {
        display: block;
    }
    .tabs-toggle {
        display: none;
    }
    @media (max-width: 1024px) {
        .container-fluid,
        .container,
        .container-fluid.px-4,
        .container.px-4 {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
        }
        .special-col.game .table.w-auto {
            width: 100% !important;
        }
        .special-col.game .table {
            font-size: 0.85rem;
        }
        .special-col.game .table th,
        .special-col.game .table td {
            padding: 0.35rem;
        }
        .impressum-btn {
            display: none;
        }
        .darkmode-toggle {
            display: none;
        }
        .lang-switch {
            left: 1.25rem;
            right: auto;
        }
        .tabs-toggle {
            display: inline-flex;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: var(--header-height);
            align-items: center;
            justify-content: flex-end;
            padding-right: 1.25rem;
            z-index: 1001;
            background-color: var(--header-bg) !important;
            border: none;
            border-radius: 0 !important;
            color: rgb(87, 87, 86);
            font-weight: 700;
            text-align: right;
            font-size: 1.05rem;
            line-height: 1;
        }
        body.tabs-open .tabs-toggle {
            color: #ffffff;
            background-color: var(--header-hover) !important;
        }
        .tabs-toggle:hover {
            color: #ffffff;
            background-color: var(--header-hover) !important;
            border-radius: 0 !important;
        }
        .tabs-toggle:hover ~ .lang-switch,
        .tabs-toggle:focus ~ .lang-switch,
        .tabs-toggle:active ~ .lang-switch {
            color: #ffffff;
        }
        .tabs-toggle:focus,
        .tabs-toggle:active,
        body.tabs-open .tabs-toggle:hover,
        body.tabs-open .tabs-toggle:focus,
        body.tabs-open .tabs-toggle:active {
            color: #ffffff;
            background-color: var(--header-hover) !important;
            border-radius: 0 !important;
        }
        #main_tabs.nav-tabs,
        #main_tabs > .nav-tabs {
            display: flex;
            position: fixed;
            top: var(--header-height);
            left: 0;
            right: 0;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
            padding: 0.5rem 0.75rem 0.75rem;
            background-color: var(--header-bg);
            z-index: 1000;
        }
        body.tabs-open #main_tabs.nav-tabs,
        body.tabs-open #main_tabs > .nav-tabs {
            display: flex !important;
            background-color: var(--header-bg) !important;
        }
        body.tabs-closed #main_tabs.nav-tabs,
        body.tabs-closed #main_tabs > .nav-tabs {
            display: none !important;
        }
        body.tabs-open #main_tabs.nav-tabs .nav-link,
        body.tabs-open #main_tabs > .nav-tabs .nav-link {
            text-align: right;
        }
        .impressum-panel {
            top: calc(var(--header-height) + 0.5rem);
            right: 0.5rem;
            bottom: auto;
        }
    body.tabs-open .lang-switch {
        color: #ffffff;
    }
    body.dark-mode.tabs-open .lang-switch {
        color: #ffffff;
    }
    }
    @media (max-aspect-ratio: 1/1) {
        .impressum-btn {
            display: none;
        }
        .darkmode-toggle {
            display: none;
        }
        .lang-switch {
            left: 1.25rem;
            right: auto;
        }
        .tabs-toggle {
            display: inline-flex;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: var(--header-height);
            align-items: center;
            justify-content: flex-end;
            padding-right: 1.25rem;
            z-index: 1001;
            background-color: var(--header-bg) !important;
            border: none;
            border-radius: 0 !important;
            color: rgb(87, 87, 86);
            font-weight: 700;
            text-align: right;
            font-size: 1.05rem;
            line-height: 1;
        }
        body.tabs-open .tabs-toggle {
            color: #ffffff;
            background-color: var(--header-hover) !important;
        }
        .tabs-toggle:hover {
            color: #ffffff;
            background-color: var(--header-hover) !important;
            border-radius: 0 !important;
        }
        .tabs-toggle:hover ~ .lang-switch,
        .tabs-toggle:focus ~ .lang-switch,
        .tabs-toggle:active ~ .lang-switch {
            color: #ffffff;
        }
        .tabs-toggle:focus,
        .tabs-toggle:active,
        body.tabs-open .tabs-toggle:hover,
        body.tabs-open .tabs-toggle:focus,
        body.tabs-open .tabs-toggle:active {
            color: #ffffff;
            background-color: var(--header-hover) !important;
            border-radius: 0 !important;
        }
        #main_tabs.nav-tabs,
        #main_tabs > .nav-tabs {
            display: flex;
            position: fixed;
            top: var(--header-height);
            left: 0;
            right: 0;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
            padding: 0.5rem 0.75rem 0.75rem;
            background-color: var(--header-bg);
            z-index: 1000;
        }
        body.tabs-open #main_tabs.nav-tabs,
        body.tabs-open #main_tabs > .nav-tabs {
            display: flex !important;
            background-color: var(--header-bg) !important;
        }
        body.tabs-closed #main_tabs.nav-tabs,
        body.tabs-closed #main_tabs > .nav-tabs {
            display: none !important;
        }
        body.tabs-open #main_tabs.nav-tabs .nav-link,
        body.tabs-open #main_tabs > .nav-tabs .nav-link {
            text-align: right;
        }
        .impressum-panel {
            top: calc(var(--header-height) + 0.5rem);
            right: 0.5rem;
            bottom: auto;
        }
    body.tabs-open .lang-switch {
        color: #ffffff;
    }
    body.dark-mode.tabs-open .lang-switch {
        color: #ffffff;
    }
    }
    body {
        font-family: "Source Sans Pro", Arial, sans-serif;
        margin: 0;
        background-color: var(--bg);
        padding-bottom: 10em;
    }
    .dark-mode .card,
    .dark-mode .card-body,
    .dark-mode .card-title {
        background-color: var(--card-bg) !important;
        color: var(--text) !important;
    }
    .dark-mode .notation-card {
        background-color: #1c2b45 !important;
        border: 1px solid #2f4463;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04), 0 6px 12px rgba(0, 0, 0, 0.2);
    }
    .dark-mode .notation-card .card-body {
        background-color: transparent !important;
    }
    .dark-mode .text-muted {
        color: var(--text) !important;
    }
    .dark-mode .table {
        color: var(--text);
        background-color: var(--card-bg);
    }
    .dark-mode .table-bordered,
    .dark-mode .table-bordered td,
    .dark-mode .table-bordered th {
        border-color: var(--border) !important;
        border-width: 1.5px !important;
    }
    .dark-mode .table thead th,
    .dark-mode .table tbody th,
    .dark-mode .table td {
        background-color: var(--card-bg) !important;
        color: var(--text) !important;
        border-top-width: 1.5px !important;
        border-right-width: 1.5px !important;
        border-bottom-width: 1.5px !important;
        border-left-width: 1.5px !important;
    }
    .dark-mode .table thead tr:last-child th {
        border-bottom: 1.5px solid var(--border) !important;
    }
    code {
        padding: 0.08em 0.32em;
        border-radius: 4px;
        background-color: #f1f3f5;
    }
    .dark-mode code {
        color: #e9eef5;
        background-color: #1b2b43;
        border: 1px solid #2b3f5c;
    }
    .dark-mode #main_tabs .dropdown-menu {
        background-color: #1c2b45;
        border-color: #2f4463;
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);
    }
    .dark-mode #main_tabs .dropdown-item {
        color: var(--text);
    }
    .dark-mode #main_tabs .dropdown-item:hover,
    .dark-mode #main_tabs .dropdown-item:focus,
    .dark-mode #main_tabs .dropdown-item.active,
    .dark-mode #main_tabs .dropdown-item:active {
        background-color: #223654;
        color: #ffffff;
    }
    .dark-mode .btn-outline-primary,
    .dark-mode .btn-outline-secondary {
        color: var(--text);
        border-color: var(--border);
    }
    .dark-mode .btn-outline-primary:hover,
    .dark-mode .btn-outline-secondary:hover,
    .dark-mode .btn-outline-primary:focus,
    .dark-mode .btn-outline-secondary:focus {
        background-color: #1c2a44;
        border-color: #1c2a44;
        color: #ffffff;
    }
    .toc-list {
        list-style: none;
        margin: 0;
        padding-left: 0.5rem;
    }
    .toc-list li {
        margin: 0.35rem 0;
    }
    .toc-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
        color: #000000;
        font-weight: 400;
        border-radius: 6px;
        padding: 0.25rem 0.4rem;
        transition: background-color 0.15s ease;
    }
    .toc-link::before {
        content: "•";
        color: #6c757d;
        font-size: 1.1rem;
        line-height: 1;
    }
    .toc-link:hover,
    .toc-link:focus {
        background-color: #f1f3f5;
        color: #000000;
    }
    .toc-card-body {
        padding-left: 1.5rem;
        padding-right: 1rem;
    }
    .dark-mode .toc-link {
        color: var(--text);
    }
    .dark-mode .toc-link:hover,
    .dark-mode .toc-link:focus {
        background-color: #223654;
        color: #ffffff;
    }

    /* Radio buttons in two columns */
    .two-col-radios .shiny-options-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 10px;
        row-gap: 10px;
    }
    .two-col-radios .form-check {
        margin: 0;
    }
    .t3-ex1-options .shiny-options-group {
        grid-template-columns: repeat(2, minmax(220px, 1fr));
        column-gap: 16px;
    }
    .t3-ex1-options .form-check-label {
        line-height: 1.35;
    }
    .three-col-radios .shiny-options-group {
        display: grid;
        grid-template-columns: repeat(3, minmax(140px, 1fr));
        column-gap: 10px;
        row-gap: 10px;
    }
    .three-col-radios .form-check {
        margin: 0;
    }
    .bayes-ex2a-options .shiny-options-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        row-gap: 10px;
        column-gap: 10px;
    }
    .bayes-ex2a-options .form-check {
        margin: 0;
        border: 1px solid #d0d7de;
        border-radius: 8px;
        padding: 0.6rem 0.75rem;
        background-color: #f8f9fa;
    }
    .dark-mode .bayes-ex2a-options .form-check {
        background-color: #1c2b45;
        border-color: #2f4463;
    }
    @media (max-width: 900px) {
        .bayes-ex2a-options .shiny-options-group {
            grid-template-columns: 1fr;
        }
    }
    @media (max-width: 1024px) {
        .three-col-radios .shiny-options-group {
            grid-template-columns: 1fr 1fr;
        }
        .t3-ex1-options .shiny-options-group {
            grid-template-columns: 1fr;
        }
    }

    /* Spacing between boxes + equal-height cards */
    .card-row,
    .exercise-row {
        row-gap: 12px;
        align-items: stretch;
    }
    .card-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px 20px;
        width: 100%;
        margin-left: 0;
        margin-top: 16px;
        margin-right: 0;
        padding-left: 0;
        padding-right: 0;
    }
    .intro-rule-row {
        margin-bottom: 40px !important;
    }
    .bayes-intro-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .exercise-row {
        display: flex;
        flex-wrap: wrap;
        column-gap: 8px;
    }
    .card-row > * {
        min-width: 0;
        display: flex;
        flex-direction: column;
        height: 100%;
        margin-left: 0;
        margin-right: 0;
        align-items: stretch;
        width: auto;
        max-width: none;
        flex: initial;
    }
    .card-row > * > .card {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        height: auto;
        align-self: stretch;
    }
    @media (max-width: 1024px) {
        .card-row {
            grid-template-columns: 1fr;
            row-gap: 8px;
        }
        .bayes-intro-grid {
            grid-template-columns: 1fr;
        }
    }
    .exercise-row > .exercise-col {
        flex: 1 1 0;
        min-width: 280px;
        display: flex;
        flex-direction: column;
    }
    .exercise-row > .exercise-col > .card {
        flex: 1 1 auto;
        height: 100%;
    }
    .exercise-row > .exercise-col .card-body {
        flex: 1 1 auto;
    }
    .intro-title {
        margin-top: 24px;
        margin-bottom: 8px;
    }
    .exercise-title {
        margin-top: 24px;
    }
    .text-muted{
        color: #000000 !important;
        margin-bottom: -8px;
    }            
    .card-body {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
    }
    .card-body.toc-card-body {
        padding-left: 1rem;
        padding-right: 1rem;
    }
    .exercise-row .card-body {
        padding-left: 1rem;
        padding-right: 1rem;
    }
    .exercise-notation-body {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
    }
    .exercise-notation-body ul {
        padding-left: 0.5rem;
        margin-left: 0.5rem;
    }
    .ex5-matrix .shiny-options-group {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        margin-top: 0.3rem !important;
        margin-left: 0.2rem !important;
        height: auto;
    }
    
    .ex5-matrix {
        table-layout: fixed;
        width: auto !important;
        display: inline-table;
    }
    .ex5-matrix th,
    .ex5-matrix td {
        padding: 0.1rem 0.3rem !important;
        width: 1% !important;
        white-space: nowrap;
        vertical-align: middle;
    }
    .ex5-matrix thead th:first-child,
    .ex5-matrix tbody th {
        width: 2.5rem !important;
        min-width: 2.5rem !important;
        text-align: center;
    }
    .ex5-matrix thead th:not(:first-child),
    .ex5-matrix td {
        padding-left: 0.4rem !important;
        padding-right: 0.4rem !important;
        width: 10rem !important;
        max-width: 10rem !important;
    }
    .ex5-matrix thead th:not(:first-child) {
        text-align: center;
        padding-left: 0.8rem !important;
        padding-right: 0.8rem !important;
        padding-bottom: 0.5rem !important;
    }
    .ex5-matrix td .form-check-label {
        white-space: normal;
        line-height: 1.2;
        display: inline-block;
    }
    .ex5-matrix td .form-check-input {
        margin-top: 0.1rem;
    }
    @media (max-width: 768px) {
        .ex5-matrix thead th:first-child,
        .ex5-matrix tbody th {
            width: 2rem !important;
            min-width: 2rem !important;
        }
        .ex5-matrix thead th:not(:first-child),
        .ex5-matrix td {
            padding-left: 0.3rem !important;
            padding-right: 0.3rem !important;
            width: 7rem !important;
            max-width: 7rem !important;
        }
        .ex5-matrix {
            font-size: 0.85rem;
        }
        .ex5-matrix .shiny-options-group {
            margin-top: 0.2rem !important;
            margin-left: 0.1rem !important;
        }
    }
    .intro-example-body {
        padding-left: 1rem;
        padding-right: 1rem;
    }
    .help-text {
        font-size: 1rem;
    }
                  /* ---------- Besondere Spiele: 40/60 Layout + Gap + Equal Height ---------- */
.special-row{
  display:flex;
  gap:20px;              /* Abstand zwischen den Boxen */
  align-items:stretch;    /* gleiche Höhe in der Zeile */
  margin-bottom:20px;
}

.special-col{
  display:flex;           /* damit die Card die Höhe füllen kann */
}

.special-col.game{  flex: 0 0 40%; }
.special-col.text{  flex: 0 0 60%; }

.special-col .card{
  flex:1 1 auto;
  height:100%;
}

.special-col .card-body{
  display:flex;
  flex-direction:column;
  height:100%;
  padding-left: 1rem;
  padding-right: 1rem;
}

/* mobil: untereinander */
@media (max-width: 992px){
  .special-row{ flex-direction:column; }
  .special-col.game, .special-col.text{ flex: 1 1 auto; }
}
    """),
    ui.tags.script(
        """
        var currentLang = "de";
        function applyLanguage(lang) {
          currentLang = lang;
          document.querySelectorAll('[data-i18n-html-en]').forEach(function (el) {
            var attr = (lang === 'en') ? 'data-i18n-html-en' : 'data-i18n-html-de';
            var html = el.getAttribute(attr);
            if (html !== null) {
              el.innerHTML = html;
            }
          });
          document.querySelectorAll('[data-i18n-en]').forEach(function (el) {
            var attr = (lang === 'en') ? 'data-i18n-en' : 'data-i18n-de';
            var text = el.getAttribute(attr);
            if (text !== null) {
              el.textContent = text;
            }
          });
          ensureImpressumLink();
        }
        function isMobileMenu() {
          return window.matchMedia('(max-width: 1024px), (max-aspect-ratio: 1/1)').matches;
        }
        function setTabsOpen(open) {
          if (open) {
            document.body.classList.add('tabs-open');
            document.body.classList.remove('tabs-closed');
          } else {
            document.body.classList.remove('tabs-open');
            document.body.classList.add('tabs-closed');
          }
        }
        function applyDarkMode(enabled) {
          document.body.classList.toggle('dark-mode', enabled);
          updateDarkModeLabel();
        }
        function updateDarkModeToggle() {
          var btn = document.querySelector('.darkmode-toggle');
          if (!btn) { return; }
          var isDark = document.body.classList.contains('dark-mode');
          btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        }
        function updateDarkModeLabel() {
          var link = document.querySelector('.darkmode-nav-link');
          if (!link) { return; }
          var isDark = document.body.classList.contains('dark-mode');
          var label = isDark
            ? ((currentLang === 'en')
              ? 'Light mode <span aria-hidden="true">☀</span>'
              : 'Tagmodus <span aria-hidden="true">☀</span>')
            : ((currentLang === 'en')
              ? 'Dark mode <span aria-hidden="true">☾</span>'
              : 'Nachtmodus <span aria-hidden="true">☾</span>');
          if (link.innerHTML !== label) {
            link.innerHTML = label;
          }
        }
        function isNightTime() {
          var hour = new Date().getHours();
          return (hour >= 18 || hour < 6);
        }
        function initDarkMode() {
          var stored = null;
          try {
            stored = localStorage.getItem('darkMode');
          } catch (e) {
            stored = null;
          }
          if (stored === '1') {
            applyDarkMode(true);
          } else if (stored === '0') {
            applyDarkMode(false);
          } else {
            applyDarkMode(isNightTime());
          }
          updateDarkModeToggle();
        }
        window.toggleTabsMenu = function () {
          if (!isMobileMenu()) { return; }
          var isOpen = document.body.classList.contains('tabs-open');
          setTabsOpen(!isOpen);
        };
        window.toggleDarkMode = function () {
          var isDark = document.body.classList.contains('dark-mode');
          applyDarkMode(!isDark);
          try {
            localStorage.setItem('darkMode', (!isDark) ? '1' : '0');
          } catch (e) {}
          updateDarkModeToggle();
        };
        function initLanguageToggle() {
          var toggle = document.getElementById('lang_toggle');
          if (!toggle) { return; }
          var lang = toggle.checked ? 'en' : 'de';
          applyLanguage(lang);
          if (window.Shiny && Shiny.setInputValue) {
            Shiny.setInputValue('lang_toggle', toggle.checked, {priority: 'event'});
          }
          toggle.addEventListener('change', function () {
            var nextLang = toggle.checked ? 'en' : 'de';
            applyLanguage(nextLang);
            if (window.Shiny && Shiny.setInputValue) {
              Shiny.setInputValue('lang_toggle', toggle.checked, {priority: 'event'});
            }
          });
        }
        document.addEventListener('click', function (e) {
          var navTabs = document.querySelector('#main_tabs > .nav-tabs') || document.querySelector('#main_tabs.nav-tabs');
          var toggleBtn = document.querySelector('.tabs-toggle');
          if (!navTabs) { return; }
          if (!document.body.classList.contains('tabs-open')) { return; }
          if (navTabs.contains(e.target)) { return; }
          if (toggleBtn && toggleBtn.contains(e.target)) { return; }
          setTabsOpen(false);
        });
        function closeNavDropdowns() {
          var navTabs = document.querySelector('#main_tabs > .nav-tabs') || document.querySelector('#main_tabs.nav-tabs');
          if (!navTabs) { return; }
          navTabs.querySelectorAll('.nav-item.dropdown.show').forEach(function (item) {
            item.classList.remove('show');
            var menu = item.querySelector('.dropdown-menu');
            if (menu) { menu.classList.remove('show'); }
            var toggle = item.querySelector('.dropdown-toggle');
            if (toggle) { toggle.setAttribute('aria-expanded', 'false'); }
          });
        }
        window.closeNavDropdowns = closeNavDropdowns;
        document.addEventListener('click', function (e) {
          var item = e.target.closest('#main_tabs .dropdown-menu .dropdown-item, #main_tabs .dropdown-menu .nav-link');
          if (!item) { return; }
          closeNavDropdowns();
          document.body.classList.add('nav-hover-disabled');
        }, true);
        document.addEventListener('shown.bs.tab', function () {
          closeNavDropdowns();
        });
        document.addEventListener('click', function (e) {
          var navTabs = document.querySelector('#main_tabs > .nav-tabs') || document.querySelector('#main_tabs.nav-tabs');
          if (!navTabs) { return; }
          if (e.target.closest('.dropdown-menu') || e.target.closest('.dropdown-toggle')) { return; }
          if (e.target.closest('.nav-item.dropdown')) { return; }
          closeNavDropdowns();
        }, true);
        document.addEventListener('click', function (e) {
          var panel = document.getElementById('impressum-panel');
          var isToggle = e.target.closest('.impressum-btn, .impressum-nav-link');
          if (panel && panel.classList.contains('open') && !panel.contains(e.target) && !isToggle) {
            panel.classList.remove('open');
          }
        });
        function initNormalformMenuClick() {
          var label = document.querySelector('.normalform-menu-toggle');
          if (!label) { return; }
          var toggle = label.closest('.dropdown-toggle');
          if (!toggle || toggle.dataset.normalformBound === '1') { return; }
          var menuItem = toggle.closest('.nav-item.dropdown');
          if (menuItem) { menuItem.classList.add('normalform-menu-item'); }
          toggle.dataset.normalformBound = '1';
          toggle.removeAttribute('data-bs-toggle');
          toggle.removeAttribute('data-toggle');
          toggle.addEventListener('click', function (e) {
            if (window.Shiny && Shiny.setInputValue) {
              Shiny.setInputValue('nav_normalform', Date.now(), {priority: 'event'});
            }
            e.preventDefault();
            e.stopPropagation();
          });
          var menu = toggle.closest('.nav-item.dropdown')?.querySelector('.dropdown-menu');
          if (menu && menu.dataset.closeBound !== '1') {
            menu.dataset.closeBound = '1';
            menu.addEventListener('click', function () {
              closeNavDropdowns();
              document.body.classList.add('nav-hover-disabled');
            });
          }
          var navTabs = document.querySelector('#main_tabs > .nav-tabs') || document.querySelector('#main_tabs.nav-tabs');
          if (navTabs && navTabs.dataset.hoverDisableBound !== '1') {
            navTabs.dataset.hoverDisableBound = '1';
            navTabs.addEventListener('pointerleave', function () {
              document.body.classList.remove('nav-hover-disabled');
            });
          }
        }
        function ensureImpressumLink() {
          var navTabs = document.querySelector('#main_tabs > .nav-tabs') || document.querySelector('#main_tabs.nav-tabs');
          if (!navTabs) { return; }
          var isMobile = isMobileMenu();
          var existing = navTabs.querySelector('.impressum-nav-link');
          var darkExisting = navTabs.querySelector('.darkmode-nav-link');
          if (isMobile) {
            if (!existing) {
              var item = document.createElement('li');
              item.className = 'nav-item';
              var link = document.createElement('a');
              link.className = 'nav-link impressum-nav-link';
              link.href = '#';
              link.textContent = (currentLang === 'en') ? 'Imprint' : 'Impressum';
              link.addEventListener('click', function (e) {
                e.preventDefault();
                toggleImpressum();
              });
              item.appendChild(link);
              navTabs.appendChild(item);
            } else {
              var label = (currentLang === 'en') ? 'Imprint' : 'Impressum';
              if (existing.textContent !== label) {
                existing.textContent = label;
              }
            }
            if (!darkExisting) {
              var darkItem = document.createElement('li');
              darkItem.className = 'nav-item';
              var darkLink = document.createElement('a');
              darkLink.className = 'nav-link impressum-nav-link darkmode-nav-link';
              darkLink.href = '#';
              darkLink.addEventListener('click', function (e) {
                e.preventDefault();
                toggleDarkMode();
              });
              darkItem.appendChild(darkLink);
              navTabs.appendChild(darkItem);
            }
            updateDarkModeLabel();
          } else if (existing) {
            existing.parentElement.remove();
            if (darkExisting) {
              darkExisting.parentElement.remove();
            }
          }
          initNormalformMenuClick();
          closeNavDropdowns();
        }
        document.addEventListener('DOMContentLoaded', function () {
          initLanguageToggle();
          initDarkMode();
          ensureImpressumLink();
          initNormalformMenuClick();
          var navTabs = document.querySelector('#main_tabs > .nav-tabs') || document.querySelector('#main_tabs.nav-tabs');
          if (navTabs) {
            var observer = new MutationObserver(ensureImpressumLink);
            observer.observe(navTabs, { childList: true });
          }
          if (isMobileMenu()) {
            setTabsOpen(false);
          } else {
            document.body.classList.remove('tabs-open');
            document.body.classList.remove('tabs-closed');
          }
          handleResize();
        });
        var lastIsMobile = null;
        function handleResize() {
          ensureImpressumLink();
          var isMobile = isMobileMenu();
          if (isMobile) {
            if (!document.body.classList.contains('tabs-open')) {
              document.body.classList.add('tabs-closed');
            }
          } else {
            document.body.classList.remove('tabs-open');
            document.body.classList.remove('tabs-closed');
          }
          lastIsMobile = isMobile;
        }
        window.addEventListener('resize', handleResize);
        function toggleImpressum() {
          var panel = document.getElementById('impressum-panel');
          if (panel) {
            panel.classList.toggle('open');
          }
        }
        function toggleImpressumEmail(e) {
          if (e) { e.preventDefault(); }
          var email = document.getElementById('impressum-email');
          if (email) {
            email.style.display = (email.style.display === 'inline') ? 'none' : 'inline';
          }
        }
        function toggleImpressumAddress(e) {
          if (e) { e.preventDefault(); }
          var addr = document.getElementById('impressum-address');
          if (addr) {
            addr.style.display = (addr.style.display === 'inline') ? 'none' : 'inline';
          }
        }
        function toggleImpressumProject(e) {
          if (e) { e.preventDefault(); }
          var link = document.getElementById('impressum-project-link');
          if (link) {
            link.style.display = (link.style.display === 'inline') ? 'none' : 'inline';
          }
        }
        """
    ),

    # ---------- Top navigation ----------
    ui.tags.button(
        "Menü",
        class_="btn btn-outline-secondary tabs-toggle mb-2",
        type="button",
        onclick="toggleTabsMenu();",
        **{"data-i18n-de": "Menü", "data-i18n-en": "Menu"},
    ),
    ui.tags.div(
        ui.tags.span("DE"),
        ui.tags.label(
            ui.tags.input(
                id="lang_toggle",
                type="checkbox",
                role="switch",
                aria_label="Sprache umschalten / Switch language",
            ),
            ui.tags.span(class_="slider"),
            class_="switch",
        ),
        ui.tags.span("EN"),
        class_="lang-switch",
    ),
    ui.input_action_button(
        "go_to_impressum",
        ui.tags.span("Impressum", **{"data-i18n-de": "Impressum", "data-i18n-en": "Imprint"}),
        class_="btn btn-outline-secondary impressum-btn",
        onclick="toggleImpressum();",
    ),
    ui.tags.button(
        ui.tags.span("☀", class_="icon-sun"),
        ui.tags.span("☾", class_="icon-moon"),
        class_="btn btn-outline-secondary darkmode-toggle",
        type="button",
        onclick="toggleDarkMode();",
        aria_label="Dark mode",
    ),
    ui.tags.div(
        ui.tags.h6("Impressum", class_="mb-2", **{"data-i18n-de": "Impressum", "data-i18n-en": "Imprint"}),
        ui.tags.p(
            ui.tags.span("Verantwortlich: ", **{"data-i18n-de": "Verantwortlich: ", "data-i18n-en": "Responsible: "}),
            ui.tags.a("Marion Ott, Jakob Sarrazin", href="#", onclick="toggleImpressumEmail(event);"),
            ui.tags.span(
                ui.tags.br(),
                ui.tags.a(
                    "sarrazin.jakob@gmail.com",
                    href="mailto:sarrazin.jakob@gmail.com",
                ),
                id="impressum-email",
                style="display:none;",
            ),
            class_="mb-1",
        ),
        ui.tags.p(
            ui.tags.span("Institution: ", **{"data-i18n-de": "Institution: ", "data-i18n-en": "Institution: "}),
            ui.tags.a("ZEW Mannheim", href="#", onclick="toggleImpressumAddress(event);"),
            ui.tags.span(
                ui.tags.br(),
                "L 7, 1, 68161 Mannheim",
                ui.tags.br(),
                ui.tags.a(
                    "https://www.zew.de/forschung/marktdesign",
                    href="https://www.zew.de/forschung/marktdesign",
                    target="_blank",
                    rel="noopener",
                ),
                id="impressum-address",
                style="display:none;",
            ),
            class_="mb-1",
        ),
        ui.tags.p(
            ui.tags.span("Github Projekt: ", **{"data-i18n-de": "Github Projekt: ", "data-i18n-en": "GitHub project: "}),
            ui.tags.a("GameTheoryApp", href="#", onclick="toggleImpressumProject(event);"),
            ui.tags.span(
                ui.tags.br(),
                ui.tags.a(
                    "https://github.com/JakobSar/GameTheoryApp",
                    href="https://github.com/JakobSar/GameTheoryApp",
                    target="_blank",
                    rel="noopener",
                ),
                id="impressum-project-link",
                style="display:none;",
            ),
            class_="mb-0",
        ),
        ui.tags.p(
            "Aus Mannheim für die Welt 🌍",
            class_="mb-0 mt-1",
            style="font-style: italic;",
            **{"data-i18n-de": "Aus Mannheim für die Welt 🌍", "data-i18n-en": "From Mannheim to the world 🌍"},
        ),
        id="impressum-panel",
        class_="impressum-panel",
    ),
    ui.navset_tab(
        ui.nav_menu(
            ui.tags.span(
                "Simultanspiele",
                class_="normalform-menu-toggle",
                **{"data-i18n-de": "Simultanspiele", "data-i18n-en": "Simultaneous games"},
            ),

        # =================================================
        # Erklärung
        # =================================================
            ui.nav_panel(
                ui.tags.span("Erklärung", **{"data-i18n-de": "Erklärung", "data-i18n-en": "Explanation"}),
                ui.tags.div(
                ui.h2("Einführung Simultanspiele", class_="intro-title",
                      **{"data-i18n-de": "Einführung Simultanspiele", "data-i18n-en": "Introduction Simultaneous games"}),
                ui.tags.p(
                    "Ein Simultanspiel beschreibt eine Situation, in der alle Spieler gleichzeitig "
                    "eine Strategie wählen und daraus für jeden Spieler ein Nutzen  entsteht.",
                    **{"data-i18n-de": "Ein Simultanspiel beschreibt eine Situation, in der alle Spieler gleichzeitig eine Strategie wählen und daraus für jeden Spieler ein Nutzen  entsteht.",
                       "data-i18n-en": "A simultaneous game describes a situation in which all players choose a strategy at the same time and each player has a payoff from the outcome of the game."},
                    class_="text-muted",
                ),
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.h5("1) Spielermenge", class_="card-title",
                                       **{"data-i18n-de": "1) Spielermenge", "data-i18n-en": "1) Player set"}),
                            ui.tags.p(
                                "Die Spielermenge ist N. "
                                "In allen Beispielen gibt es genau zwei Spieler N = {1, 2}.",
                                **{"data-i18n-de": "Die Spielermenge ist N. In allen Beispielen gibt es genau zwei Spieler N = {1, 2}.",
                                   "data-i18n-en": "The player set is N. In all examples there are exactly two players N = {1, 2}."},
                                class_="mb-0",
                            ),
                            class_="card-body",
                        ),
                        class_="card shadow-sm h-100",
                        style="background-color:#ffffff;",
                    ),
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.h5("2) Strategiemengen", class_="card-title",
                                       **{"data-i18n-de": "2) Strategiemengen", "data-i18n-en": "2) Strategy sets"}),
                            ui.tags.p(
                                "Jeder Spieler verfügt über eine endliche Menge an reinen Strategien, "
                                "aus denen er eine auswählt oder über die er randomisiert (gemischte Strategie).",
                                **{"data-i18n-de": "Jeder Spieler verfügt über eine endliche Menge an reinen Strategien, aus denen er eine auswählt oder über die er randomisiert (gemischte Strategie).",
                                   "data-i18n-en": "Each player has a finite set of pure strategies from which they select one or over which they randomize (mixed strategy)."},
                                class_="mb-0",
                            ),
                            class_="card-body",
                        ),
                        class_="card shadow-sm h-100",
                        style="background-color:#ffffff;",
                    ),
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.h5("3) Nutzenfunktionen", class_="card-title",
                                       **{"data-i18n-de": "3) Nutzenfunktionen", "data-i18n-en": "3) Payoff functions"}),
                            ui.tags.p(
                                "Jeder Strategiekombination wird ein Nutzen zugeordnet. "
                                "Bei zwei Spielern schreibt man (u₁, u₂).",
                                **{"data-i18n-de": "Jeder Strategiekombination wird für jeden Spieler ein Nutzen zugeordnet. Bei zwei Spielern schreibt man (u₁, u₂).",
                                   "data-i18n-en": "Each strategy combination is assigned a payoff for each player. With two players we write (u₁, u₂)."},
                                class_="mb-0",
                            ),
                            class_="card-body",
                        ),
                        class_="card shadow-sm h-100",
                        style="background-color:#ffffff;",
                    ),
                    class_="row row-cols-1 row-cols-lg-3 g-3 mt-2 align-items-stretch card-row intro-rule-row mb-4",
                ),
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Beispiel-Spiel in Normalform", class_="card-title",
                                           **{"data-i18n-de": "Beispiel-Spiel in Normalform", "data-i18n-en": "Example game in Normal-form"}),
                                ui.tags.p(
                                    "Spieler 1 wählt A oder B, Spieler 2 wählt X, Y oder Z. "
                                    "In jeder Zelle steht (u₁, u₂).",
                                    **{"data-i18n-de": "Spieler 1 wählt A oder B, Spieler 2 wählt X, Y oder Z. In jeder Zelle steht (u₁, u₂).",
                                       "data-i18n-en": "Player 1 chooses A or B, Player 2 chooses X, Y or Z. Each cell shows (u₁, u₂)."},
                                    class_="text-muted mb-3",
                                ),
                                payoff_table(INTRO_ROWS, INTRO_COLS, INTRO_PAYOFFS),
                                class_="col-12 col-lg-7",
                            ),
                            ui.tags.div(
                                ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h5("Notation von Normalformspielen", class_="mb-2",
                                                   **{"data-i18n-de": "Notation von Normalformspielen", "data-i18n-en": "Notation of Normal-form games"}),
                                        ui.tags.ul(
                                            ui.tags.li(
                                                ui.tags.code("N = {1, 2}"),
                                                ui.tags.span(": Zwei Spieler (Spieler 1 und Spieler 2).",
                                                             **{"data-i18n-de": ": Zwei Spieler (Spieler 1 und Spieler 2).",
                                                                "data-i18n-en": ": Two players (Player 1 and Player 2)."})
                                            ),
                                            ui.tags.li(
                                                ui.tags.code("S₁ = {A, B}"),
                                                ui.tags.span(": Strategiemenge von Spieler 1.",
                                                             **{"data-i18n-de": ": Strategiemenge von Spieler 1.",
                                                                "data-i18n-en": ": Strategy set of Player 1."})
                                            ),
                                            ui.tags.li(
                                                ui.tags.code("S₂ = {X, Y, Z}"),
                                                ui.tags.span(": Strategiemenge von Spieler 2.",
                                                             **{"data-i18n-de": ": Strategiemenge von Spieler 2.",
                                                                "data-i18n-en": ": Strategy set of Player 2."})
                                            ),
                                            ui.tags.li(
                                                ui.tags.code("s = (s₁, s₂)"),
                                                ui.tags.span(": z.B. ", **{"data-i18n-de": ": Strategiekombination z.B. ", "data-i18n-en": ": Strategy combination e.g. "}),
                                                ui.tags.code("(A, Y)"),
                                                ui.tags.span(".", **{"data-i18n-de": ".", "data-i18n-en": "."}),
                                            ),
                                            ui.tags.li(
                                                ui.tags.code("u = (u₁, u₂)"),
                                                ui.tags.span(": z.B. ", **{"data-i18n-de": ": z.B. ", "data-i18n-en": ": e.g. "}),
                                                ui.tags.code("(2, 8)"),
                                                ui.tags.span(": Auszahlung (Spieler 1, Spieler 2).",
                                                             **{"data-i18n-de": ": Nutzen (Spieler 1, Spieler 2).",
                                                                "data-i18n-en": ": Payoff (Player 1, Player 2)."}),
                                            ),
                                            class_="mb-0",
                                        ),
                                        class_="card-body",
                                    ),
                                    class_="card h-100 notation-card",
                                    style="background-color:#f7f7f7;",
                                ),
                                class_="col-12 col-lg-5",
                            ),
                            class_="row g-3 align-items-stretch",
                        ),
                        class_="card-body intro-example-body",
                    ),
                    class_="card shadow-sm h-100",
                    style="background-color:#ffffff;",
                ),
                ui.h2(
                    "Übersicht Simultanspiele",
                    class_="exercise-title",
                    **{"data-i18n-de": "Übersicht Simultanspiele", "data-i18n-en": "Overview of simultaneous games"},
                ),
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.h5(
                            "Teil 1: Grundlagen statischer Simultanspiele",
                            class_="card-title",
                            **{"data-i18n-de": "Teil 1: Grundlagen statischer Simultanspiele", "data-i18n-en": "Part 1: Foundations of static simultaneous games"},
                        ),
                        ui.tags.ul(
                            ui.tags.li(
                                ui.tags.a(
                                    "Übung 1 – Beste Antworten",
                                    href="#",
                                    onclick="if (window.Shiny && Shiny.setInputValue) { Shiny.setInputValue('start_exercise', Date.now(), {priority: 'event'}); } return false;",
                                    class_="toc-link",
                                    **{
                                        "data-i18n-de": "Übung 1 – Beste Antworten",
                                        "data-i18n-en": "Exercise 1 – Best responses",
                                    },
                                )
                            ),
                            ui.tags.li(
                                ui.tags.a(
                                    "Übung 2 – Strikt dominante Strategien",
                                    href="#",
                                    onclick="if (window.Shiny && Shiny.setInputValue) { Shiny.setInputValue('go_to_ex2', Date.now(), {priority: 'event'}); } return false;",
                                    class_="toc-link",
                                    **{
                                        "data-i18n-de": "Übung 2 – Strikt dominante Strategien",
                                        "data-i18n-en": "Exercise 2 – Strictly dominant strategies",
                                    },
                                )
                            ),
                            ui.tags.li(
                                ui.tags.a(
                                    "Übung 3 – Dominante Strategien (schwach oder strikt)",
                                    href="#",
                                    onclick="if (window.Shiny && Shiny.setInputValue) { Shiny.setInputValue('go_to_ex3', Date.now(), {priority: 'event'}); } return false;",
                                    class_="toc-link",
                                    **{
                                        "data-i18n-de": "Übung 3 – Dominante Strategien (schwach oder strikt)",
                                        "data-i18n-en": "Exercise 3 – Dominant strategies (weak or strict)",
                                    },
                                )
                            ),
                            ui.tags.li(
                                ui.tags.a(
                                    "Übung 4 – Nash-Gleichgewichte in reinen Strategien",
                                    href="#",
                                    onclick="if (window.Shiny && Shiny.setInputValue) { Shiny.setInputValue('go_to_ex4', Date.now(), {priority: 'event'}); } return false;",
                                    class_="toc-link",
                                    **{
                                        "data-i18n-de": "Übung 4 – Nash-Gleichgewichte in reinen Strategien",
                                        "data-i18n-en": "Exercise 4 – Nash equilibria in pure strategies",
                                    },
                                )
                            ),
                            ui.tags.li(
                                ui.tags.a(
                                    "Übung 5 – Nash-Gleichgewichte in reinen Strategien (strikt)",
                                    href="#",
                                    onclick="if (window.Shiny && Shiny.setInputValue) { Shiny.setInputValue('go_to_ex5', Date.now(), {priority: 'event'}); } return false;",
                                    class_="toc-link",
                                    **{
                                        "data-i18n-de": "Übung 5 – Nash-Gleichgewichte in reinen Strategien (strikt)",
                                        "data-i18n-en": "Exercise 5 – Nash equilibria in pure strategies (strict)",
                                    },
                                )
                            ),
                            ui.tags.li(
                                ui.tags.a(
                                    "Übung 6 – Nash-Gleichgewicht in gemischten Strategien",
                                    href="#",
                                    onclick="if (window.Shiny && Shiny.setInputValue) { Shiny.setInputValue('go_to_ex6', Date.now(), {priority: 'event'}); } return false;",
                                    class_="toc-link",
                                    **{
                                        "data-i18n-de": "Übung 6 – Nash-Gleichgewicht in gemischten Strategien",
                                        "data-i18n-en": "Exercise 6 – Nash equilibrium in mixed strategies",
                                    },
                                )
                            ),
                            class_="mb-0 toc-list",
                        ),
                        class_="card-body toc-card-body",
                    ),
                    class_="card shadow-sm h-100 mt-4",
                    style="background-color:#ffffff;",
                ),
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.h5(
                            "Teil 2: Gleichgewichte und Gleichgewichtsverfeinerungen in statischen Simultanspielen",
                            class_="card-title",
                            **{
                                "data-i18n-de": "Teil 2: Gleichgewichte und Gleichgewichtsverfeinerungen in statischen Simultanspielen",
                                "data-i18n-en": "Part 2: Equilibria and equilibrium refinements in static simultaneous games",
                            },
                        ),
                        ui.tags.ul(
                            ui.tags.li(
                                ui.tags.a(
                                    "Übung 1 – Trembling-Hand-Perfektion",
                                    href="#",
                                    onclick="if (window.Shiny && Shiny.setInputValue) { Shiny.setInputValue('start_teil2_ex1', Date.now(), {priority: 'event'}); } return false;",
                                    class_="toc-link",
                                    **{
                                        "data-i18n-de": "Übung 1 – Trembling-Hand-Perfektion",
                                        "data-i18n-en": "Exercise 1 – Trembling-hand perfection",
                                    },
                                )
                            ),
                            ui.tags.li(
                                ui.tags.a(
                                    "Übung 2 – Evolutionär stabile Strategien",
                                    href="#",
                                    onclick="if (window.Shiny && Shiny.setInputValue) { Shiny.setInputValue('go_to_teil2_ex2', Date.now(), {priority: 'event'}); } return false;",
                                    class_="toc-link",
                                    **{
                                        "data-i18n-de": "Übung 2 – Evolutionär stabile Strategien",
                                        "data-i18n-en": "Exercise 2 – Evolutionarily stable strategies",
                                    },
                                )
                            ),
                            class_="mb-0 toc-list",
                        ),
                        class_="card-body toc-card-body",
                    ),
                    class_="card shadow-sm h-100 mt-4",
                    style="background-color:#ffffff;",
                ),
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.h5(
                            "Teil 3: Simultanes Marktauswahlspiel",
                            class_="card-title",
                            **{
                                "data-i18n-de": "Teil 3: Simultanes Marktauswahlspiel",
                                "data-i18n-en": "Part 3: Simultaneous market selection game",
                            },
                        ),
                        ui.tags.ul(
                            ui.tags.li(
                                ui.tags.a(
                                    "Übung 1 – Gemischtes Nash-Gleichgewicht im Marktauswahlspiel",
                                    href="#",
                                    onclick="if (window.Shiny && Shiny.setInputValue) { Shiny.setInputValue('go_to_teil3_ex1', Date.now(), {priority: 'event'}); } return false;",
                                    class_="toc-link",
                                    **{
                                        "data-i18n-de": "Übung 1 – Gemischtes Nash-Gleichgewicht im Marktauswahlspiel",
                                        "data-i18n-en": "Exercise 1 – Mixed Nash equilibrium in the market selection game",
                                    },
                                )
                            ),
                            class_="mb-0 toc-list",
                        ),
                        class_="card-body toc-card-body",
                    ),
                    class_="card shadow-sm h-100 mt-4",
                    style="background-color:#ffffff;",
                ),
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.h5(
                            "Besondere Spiele",
                            class_="card-title",
                            **{
                                "data-i18n-de": "Besondere Spiele",
                                "data-i18n-en": "Special games",
                            },
                        ),
                        ui.tags.ul(
                            ui.tags.li(
                                ui.tags.a(
                                    "Zusatzteil mit 5 klassischen Spielen der Spieltheorie",
                                    href="#",
                                    onclick="if (window.Shiny && Shiny.setInputValue) { Shiny.setInputValue('go_to_special_games', Date.now(), {priority: 'event'}); } return false;",
                                    class_="toc-link",
                                    **{
                                        "data-i18n-de": "Zusatzteil mit 5 klassischen Spielen der Spieltheorie",
                                        "data-i18n-en": "Additional section with 5 classic games of game theory",
                                    },
                                )
                            ),
                            class_="mb-0 toc-list",
                        ),
                        class_="card-body toc-card-body",
                    ),
                    class_="card shadow-sm h-100 mt-4",
                    style="background-color:#ffffff;",
                ),
                ui.input_action_button(
                    "start_exercise",
                    ui.tags.span("Zu Teil 1, Übung 1", **{"data-i18n-de": "Zu Teil 1, Übung 1", "data-i18n-en": "Go to Part 1, Exercise 1"}),
                    class_="btn btn-success mt-4",
                ),
                class_="container-fluid px-4",
            ),
            value="intro",
        ),

        # =================================================
        # Übung 1
        # =================================================
        ui.nav_panel(
            ui.tags.span("Übung 1", **{"data-i18n-de": "Übung 1", "data-i18n-en": "Exercise 1"}),
            ui.tags.div(
                ui.h2("Übung 1: Beste Antworten", class_="exercise-title",
                      **{"data-i18n-de": "Übung 1: Beste Antworten", "data-i18n-en": "Exercise 1: Best responses"}),

                ui.tags.div(
                    # ---- LEFT: Game ----
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Spiel", class_="card-title",
                                           **{"data-i18n-de": "Spiel", "data-i18n-en": "Game"}),
                                ui.output_ui("game_table_1"),

                                ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h6("Notation", **{"data-i18n-de": "Notation", "data-i18n-en": "Notation"}),
                                        ui.output_ui("notation_1"),
                                        class_="card-body py-2 exercise-notation-body",
                                    ),
                                    class_="card mt-3 notation-card",
                                    style="background-color:#f7f7f7;",
                                ),

                                ui.tags.div(
                                    ui.input_action_button(
                                        "new_game_1",
                                        ui.tags.span("Neues Spiel", **{"data-i18n-de": "Neues Spiel", "data-i18n-en": "New game"}),
                                        class_="btn btn-outline-primary",
                                    ),
                                    ui.input_action_button(
                                        "help_1",
                                        ui.tags.span("Hilfe", **{"data-i18n-de": "Hilfe", "data-i18n-en": "Help"}),
                                        class_="btn btn-outline-primary",
                                    ),
                                    class_="d-flex gap-2 mt-3",
                                ),
                                ui.output_ui("help_text_1"),

                                class_="card-body",
                            ),
                            class_="card shadow-sm h-100",
                            style="background-color:#ffffff;",
                        ),
                        class_="col exercise-col",
                    ),

                    # ---- RIGHT: Question ----
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Frage", class_="card-title",
                                           **{"data-i18n-de": "Frage", "data-i18n-en": "Question"}),
                                ui.output_ui("question_text_1"),

                                ui.tags.div(
                                    ui.input_radio_buttons(
                                        "answer_1",
                                        None,
                                        choices=["— bitte warten —"],
                                    ),
                                    class_="two-col-radios",
                                ),

                            ui.tags.p(
                                "… ist / sind eine beste Antwort.",
                                class_="mt-2",
                                **{
                                    "data-i18n-de": "… ist / sind eine beste Antwort.",
                                    "data-i18n-en": "… is/are a best response.",
                                },
                            ),

                                ui.input_action_button(
                                    "check_1",
                                    ui.tags.span("Antwort prüfen", **{"data-i18n-de": "Antwort prüfen", "data-i18n-en": "Check answer"}),
                                    class_="btn btn-primary mt-3",
                                ),

                                ui.output_ui("feedback_1"),

                                class_="card-body",
                            ),
                            class_="card shadow-sm h-100",
                            style="background-color:#ffffff;",
                        ),
                        class_="col exercise-col",
                    ),

                    class_="row row-cols-1 row-cols-lg-2 g-3 mt-2 align-items-stretch exercise-row",
                ),

                ui.input_action_button(
                    "go_back_intro",
                    ui.tags.span("Zurück", **{"data-i18n-de": "Zurück", "data-i18n-en": "Back"}),
                    class_="btn btn-outline-secondary me-2 mt-4",
                ),
                ui.input_action_button(
                    "go_to_ex2",
                    ui.tags.span("Weiter zu Übung 2", **{"data-i18n-de": "Weiter zu Übung 2", "data-i18n-en": "Next to Exercise 2"}),
                    class_="btn btn-success mt-4",
                ),

                class_="container-fluid px-4 mt-3",
            ),
            value="ex1",
        ),

        # =================================================
        # Übung 2
        # =================================================
        ui.nav_panel(
            ui.tags.span("Übung 2", **{"data-i18n-de": "Übung 2", "data-i18n-en": "Exercise 2"}),
            ui.tags.div(
                ui.h2("Übung 2: Strikt dominante Strategien", class_="exercise-title",
                      **{"data-i18n-de": "Übung 2: Strikt dominante Strategien", "data-i18n-en": "Exercise 2: Strictly dominant strategies"}),

                ui.tags.div(
                    # ---- LEFT ----
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Spiel", class_="card-title",
                                           **{"data-i18n-de": "Spiel", "data-i18n-en": "Game"}),
                                ui.output_ui("game_table_2"),

                                ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h6("Notation", **{"data-i18n-de": "Notation", "data-i18n-en": "Notation"}),
                                        ui.output_ui("notation_2"),
                                        class_="card-body py-2 exercise-notation-body",
                                    ),
                                    class_="card mt-3 notation-card",
                                    style="background-color:#f7f7f7;",
                                ),

                                ui.tags.div(
                                    ui.input_action_button(
                                        "new_game_2",
                                        ui.tags.span("Neues Spiel", **{"data-i18n-de": "Neues Spiel", "data-i18n-en": "New game"}),
                                        class_="btn btn-outline-primary",
                                    ),
                                    ui.input_action_button(
                                        "help_2",
                                        ui.tags.span("Hilfe", **{"data-i18n-de": "Hilfe", "data-i18n-en": "Help"}),
                                        class_="btn btn-outline-primary",
                                    ),
                                    class_="d-flex gap-2 mt-3",
                                ),
                                ui.output_ui("help_text_2"),

                                class_="card-body",
                            ),
                            class_="card shadow-sm h-100",
                            style="background-color:#ffffff;",
                        ),
                        class_="col exercise-col",
                    ),

                    # ---- RIGHT ----
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Frage", class_="card-title",
                                           **{"data-i18n-de": "Frage", "data-i18n-en": "Question"}),
                                ui.tags.p(
                                    "Hat einer der Spieler (oder haben beide) eine strikt dominante Strategie?",
                                    **{"data-i18n-de": "Hat einer der Spieler (oder haben beide) eine strikt dominante Strategie?",
                                       "data-i18n-en": "Does either player (or both) have a strictly dominant strategy?"},
                                    class_="mt-2 mb-4",
                                ),

                            ui.tags.div(
                                ui.input_radio_buttons(
                                    "answer_2",
                                    None,
                                    choices=["— bitte warten —"],
                                ),
                                class_="three-col-radios",
                            ),

                                ui.input_action_button(
                                    "check_2",
                                    ui.tags.span("Antwort prüfen", **{"data-i18n-de": "Antwort prüfen", "data-i18n-en": "Check answer"}),
                                    class_="btn btn-primary mt-3",
                                ),

                                ui.output_ui("feedback_2"),

                                class_="card-body",
                            ),
                            class_="card shadow-sm h-100",
                            style="background-color:#ffffff;",
                        ),
                        class_="col exercise-col",
                    ),

                    class_="row row-cols-1 row-cols-lg-2 g-3 mt-2 align-items-stretch exercise-row",
                ),

        ui.tags.div(
            ui.input_action_button(
                "go_back_ex1",
                ui.tags.span("Zurück", **{"data-i18n-de": "Zurück", "data-i18n-en": "Back"}),
                class_="btn btn-outline-secondary me-2"
            ),
            ui.input_action_button(
                "go_to_ex3",
                ui.tags.span("Weiter zu Übung 3", **{"data-i18n-de": "Weiter zu Übung 3", "data-i18n-en": "Next to Exercise 3"}),
                class_="btn btn-success"
            ),
            class_="mt-4 text-start mb-3"
        ),
        class_="container-fluid px-4",
    ),
    value="ex2",
),
# Neuen Tab für Übung 3 einfügen
ui.nav_panel(
    ui.tags.span("Übung 3", **{"data-i18n-de": "Übung 3", "data-i18n-en": "Exercise 3"}),
    ui.tags.div(
        ui.h2("Übung 3: Dominante Strategien (schwach oder strikt)", class_="exercise-title",
              **{"data-i18n-de": "Übung 3: Dominante Strategien (schwach oder strikt)",
                 "data-i18n-en": "Exercise 3: Dominant strategies (weak or strict)"}),
        ui.tags.div(
            # LEFT CARD: Spieltabelle und "Neues Spiel"-Button
            ui.tags.div(
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.h5("Spiel", **{"data-i18n-de": "Spiel", "data-i18n-en": "Game"}),
                        ui.output_ui("game_table_3"),
                        ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h6("Notation", **{"data-i18n-de": "Notation", "data-i18n-en": "Notation"}),
                                        ui.output_ui("notation_3"),
                                        class_="card-body py-2 exercise-notation-body",
                                    ),
                                    class_="card mt-3 notation-card",
                                    style="background-color:#f7f7f7;",
                                ),
                        ui.tags.div(
                            ui.input_action_button(
                                "new_game_3",
                                ui.tags.span("Neues Spiel", **{"data-i18n-de": "Neues Spiel", "data-i18n-en": "New game"}),
                                class_="btn btn-outline-primary"
                            ),
                            ui.input_action_button(
                                "help_3",
                                ui.tags.span("Hilfe", **{"data-i18n-de": "Hilfe", "data-i18n-en": "Help"}),
                                class_="btn btn-outline-primary"
                            ),
                            class_="d-flex gap-2 mt-3",
                        ),
                        ui.output_ui("help_text_3"),
                        class_="card-body"
                    ),
                    class_="card shadow-sm h-100"
                ),
                class_="col exercise-col"
            ),
            # RIGHT CARD: Frage, Antwortoptionen und Feedback
            ui.tags.div(
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.h5("Frage", **{"data-i18n-de": "Frage", "data-i18n-en": "Question"}),
                        ui.tags.p(  # Feste Frage für Übung 3
                            "Hat einer der Spieler (oder haben beide) eine (strikt oder schwach) dominante Strategie?",
                            **{"data-i18n-de": "Hat einer der Spieler (oder haben beide) eine (strikt oder schwach) dominante Strategie?",
                               "data-i18n-en": "Does either player (or both) have a (strict or weak) dominant strategy?"},
                            class_="mt-2 mb-4"
                        ),
                        ui.tags.div(
                            ui.input_radio_buttons(
                                "answer_3",
                                None,
                                choices=["— bitte warten —"]  # wird dynamisch gefüllt
                            ),
                        class_="three-col-radios"
                        ),
                        ui.input_action_button(
                            "check_3",
                            ui.tags.span("Antwort prüfen", **{"data-i18n-de": "Antwort prüfen", "data-i18n-en": "Check answer"}),
                            class_="btn btn-primary mt-3"
                        ),
                        ui.output_ui("feedback_3"),
                        class_="card-body"
                    ),
                    class_="card shadow-sm h-100"
                ),
                class_="col exercise-col"
            ),
            class_="row row-cols-1 row-cols-lg-2 g-3 mt-2 align-items-stretch exercise-row"
        ),
        ui.tags.div(
            ui.input_action_button(
                "go_back_ex2",
                ui.tags.span("Zurück", **{"data-i18n-de": "Zurück", "data-i18n-en": "Back"}),
                class_="btn btn-outline-secondary me-2"
            ),
            ui.input_action_button(
                "go_to_ex4",
                ui.tags.span("Weiter zu Übung 4", **{"data-i18n-de": "Weiter zu Übung 4", "data-i18n-en": "Next to Exercise 4"}),
                class_="btn btn-success"
            ),
            class_="mt-4 text-start mb-3"
        ),
        class_="container-fluid px-4"
    ),
    value="ex3",
),
# Neuen Tab für Übung 4 einfügen
ui.nav_panel(
    ui.tags.span("Übung 4", **{"data-i18n-de": "Übung 4", "data-i18n-en": "Exercise 4"}),
    ui.tags.div(
        ui.h2("Übung 4: Nash-Gleichgewichte in reinen Strategien", class_="exercise-title",
              **{"data-i18n-de": "Übung 4: Nash-Gleichgewichte in reinen Strategien",
                 "data-i18n-en": "Exercise 4: Nash equilibria in pure strategies"}),
        ui.tags.div(
            # LEFT CARD: Spieltabelle + "Neues Spiel"
            ui.tags.div(
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.h5("Spiel", **{"data-i18n-de": "Spiel", "data-i18n-en": "Game"}),
                        ui.output_ui("game_table_4"),
                        ui.tags.div(
                                    ui.tags.div(
                        ui.tags.h6("Notation", **{"data-i18n-de": "Notation", "data-i18n-en": "Notation"}),
                          ui.output_ui("notation_4"),
                                  class_="card-body py-2 exercise-notation-body",
                                ),
                                class_="card mt-3 notation-card",
                                style="background-color:#f7f7f7;",
                                ),
                        ui.tags.div(
                            ui.input_action_button(
                                "new_game_4",
                                ui.tags.span("Neues Spiel", **{"data-i18n-de": "Neues Spiel", "data-i18n-en": "New game"}),
                                class_="btn btn-outline-primary"
                            ),
                            ui.input_action_button(
                                "help_4",
                                ui.tags.span("Hilfe", **{"data-i18n-de": "Hilfe", "data-i18n-en": "Help"}),
                                class_="btn btn-outline-primary"
                            ),
                            class_="d-flex gap-2 mt-3",
                        ),
                        ui.output_ui("help_text_4"),
                        class_="card-body"
                    ),
                    class_="card shadow-sm h-100"
                ),
                class_="col exercise-col"
            ),
            # RIGHT CARD: Frage, Mehrfachauswahl und Feedback
            ui.tags.div(
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.h5("Frage", **{"data-i18n-de": "Frage", "data-i18n-en": "Question"}),
                        ui.tags.p(
                            "Finden Sie alle Strategiekombinationen, die ein Nash-Gleichgewicht in reinen Strategien bilden.",
                            **{"data-i18n-de": "Finden Sie alle Strategiekombinationen, die ein Nash-Gleichgewicht in reinen Strategien bilden.",
                               "data-i18n-en": "Find all strategy combinations that form a Nash equilibrium in pure strategies."},
                            class_="mt-2 mb-4"
                        ),
                        ui.tags.div(
                            ui.input_checkbox_group(
                                "answer_4",
                                None,
                                choices=[f"({r},{c})" for r in P1_STRATS_EX2 for c in P2_STRATS_EX2]
                            ),
                            class_="three-col-radios"
                        ),
                        ui.input_action_button(
                            "check_4",
                            ui.tags.span("Antwort prüfen", **{"data-i18n-de": "Antwort prüfen", "data-i18n-en": "Check answer"}),
                            class_="btn btn-primary mt-3"
                        ),
                        ui.output_ui("feedback_4"),
                        class_="card-body"
                    ),
                    class_="card shadow-sm h-100"
                ),
                class_="col exercise-col"
            ),
            class_="row row-cols-1 row-cols-lg-2 g-3 mt-2 align-items-stretch exercise-row"
        ),
        ui.tags.div(
            ui.input_action_button(
                "go_back_ex3",
                ui.tags.span("Zurück", **{"data-i18n-de": "Zurück", "data-i18n-en": "Back"}),
                class_="btn btn-outline-secondary me-2"
            ),
            ui.input_action_button(
                "go_to_ex5",
                ui.tags.span("Weiter zu Übung 5", **{"data-i18n-de": "Weiter zu Übung 5", "data-i18n-en": "Next to Exercise 5"}),
                class_="btn btn-success"
            ),
            class_="mt-4 text-start mb-3"
        ),
        class_="container-fluid px-4"
    ),
    value="ex4",
),

# =================================================
        # Übung 5
        # =================================================
        ui.nav_panel(
            ui.tags.span("Übung 5", **{"data-i18n-de": "Übung 5", "data-i18n-en": "Exercise 5"}),
            ui.tags.div(
                ui.h2("Übung 5: Nash-Gleichgewichte in reinen Strategien (strikt)", class_="exercise-title",
                      **{"data-i18n-de": "Übung 5: Nash-Gleichgewichte in reinen Strategien (strikt)",
                         "data-i18n-en": "Exercise 5: Nash equilibria in pure strategies (strict)"}),
                ui.tags.div(
                    # LEFT: Game table + Notation + Buttons
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Spiel", class_="card-title",
                                           **{"data-i18n-de": "Spiel", "data-i18n-en": "Game"}),
                                ui.output_ui("game_table_5"),
                                ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h6("Notation", **{"data-i18n-de": "Notation", "data-i18n-en": "Notation"}),
                                        ui.output_ui("notation_5"),
                                        class_="card-body py-2 exercise-notation-body",
                                    ),
                                    class_="card mt-3 notation-card",
                                    style="background-color:#f7f7f7;",
                                ),
                                ui.tags.div(
                                    ui.input_action_button(
                                        "new_game_5",
                                        ui.tags.span("Neues Spiel", **{"data-i18n-de": "Neues Spiel", "data-i18n-en": "New game"}),
                                        class_="btn btn-outline-primary"
                                    ),
                                    ui.input_action_button(
                                        "help_5",
                                        ui.tags.span("Hilfe", **{"data-i18n-de": "Hilfe", "data-i18n-en": "Help"}),
                                        class_="btn btn-outline-primary"
                                    ),
                                    class_="d-flex gap-2 mt-3",
                                ),
                                ui.output_ui("help_text_5"),
                                class_="card-body",
                            ),
                            class_="card shadow-sm h-100",
                        ),
                        class_="col exercise-col",
                    ),
                    # RIGHT: Question and answers
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Frage", class_="card-title",
                                           **{"data-i18n-de": "Frage", "data-i18n-en": "Question"}),
                                ui.tags.p(
                                    "Wählen Sie für jede Strategiekombination, ob es sich dabei um ein striktes oder nicht striktes Nash GG handelt.",
                                    **{"data-i18n-de": "Wählen Sie für jede Strategiekombination, ob es sich dabei um ein striktes oder nicht striktes Nash GG handelt.",
                                       "data-i18n-en": "For each strategy combination, choose whether it is a strict or non-strict Nash equilibrium."},
                                    class_="mt-2 mb-4",
                                ),
                                ui.tags.div(
                                    ui.output_ui("ex5_matrix"),
                                ),
                                ui.input_action_button(
                                    "check_5",
                                    ui.tags.span("Antwort prüfen", **{"data-i18n-de": "Antwort prüfen", "data-i18n-en": "Check answer"}),
                                    class_="btn btn-primary mt-3"
                                ),
                                ui.output_ui("feedback_5"),
                                class_="card-body",
                            ),
                            class_="card shadow-sm h-100",
                        ),
                        class_="col exercise-col",
                    ),
                    class_="row row-cols-1 row-cols-lg-2 g-3 mt-2 align-items-stretch exercise-row",
                ),
                ui.tags.div(
                    ui.input_action_button(
                        "go_back_ex4",
                        ui.tags.span("Zurück", **{"data-i18n-de": "Zurück", "data-i18n-en": "Back"}),
                        class_="btn btn-outline-secondary me-2"
                    ),
                    ui.input_action_button(
                        "go_to_ex6",
                        ui.tags.span("Weiter zu Übung 6", **{"data-i18n-de": "Weiter zu Übung 6", "data-i18n-en": "Next to Exercise 6"}),
                        class_="btn btn-success"
                    ),
                    class_="mt-4 text-start mb-3",
                ),
                class_="container-fluid px-4",
            ),
            value="ex5",
        ),
        # =================================================
        # Übung 6
        # =================================================
            ui.nav_panel(
                ui.tags.span("Übung 6", **{"data-i18n-de": "Übung 6", "data-i18n-en": "Exercise 6"}),
            ui.tags.div(
                ui.h2("Übung 6: Nash-Gleichgewicht in gemischten Strategien", class_="exercise-title",
                      **{"data-i18n-de": "Übung 6: Nash-Gleichgewicht in gemischten Strategien",
                         "data-i18n-en": "Exercise 6: Nash equilibrium in mixed strategies"}),
                ui.tags.div(
                    # LEFT: Game table + Notation + Buttons
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Spiel", class_="card-title",
                                           **{"data-i18n-de": "Spiel", "data-i18n-en": "Game"}),
                                ui.output_ui("game_table_6"),
                                ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h6("Notation", **{"data-i18n-de": "Notation", "data-i18n-en": "Notation"}),
                                        ui.output_ui("notation_6"),
                                        class_="card-body py-2 exercise-notation-body",
                                    ),
                                    class_="card mt-3 notation-card",
                                    style="background-color:#f7f7f7;",
                                ),
                                ui.tags.div(
                                    ui.input_action_button(
                                        "new_game_6",
                                        ui.tags.span("Neues Spiel", **{"data-i18n-de": "Neues Spiel", "data-i18n-en": "New game"}),
                                        class_="btn btn-outline-primary"
                                    ),
                                    ui.input_action_button(
                                        "help_6",
                                        ui.tags.span("Hilfe", **{"data-i18n-de": "Hilfe", "data-i18n-en": "Help"}),
                                        class_="btn btn-outline-primary"
                                    ),
                                    class_="d-flex gap-2 mt-3",
                                ),
                                ui.output_ui("help_text_6"),
                                class_="card-body",
                            ),
                            class_="card shadow-sm h-100",
                        ),
                        class_="col exercise-col",
                    ),
                    # RIGHT: Question and answers
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Frage", class_="card-title",
                                           **{"data-i18n-de": "Frage", "data-i18n-en": "Question"}),
                                ui.tags.p(
                                    "Finden Sie ein Nash-Gleichgewicht in gemischten Strategien, in dem Spieler 1 mit Wahrscheinlichkeit p Strategie A wählt. Wie groß ist p?",
                                    **{"data-i18n-de": "Finden Sie ein Nash-Gleichgewicht in gemischten Strategien, in dem Spieler 1 mit Wahrscheinlichkeit p Strategie A wählt. Wie groß ist p?",
                                       "data-i18n-en": "Find a Nash equilibrium in mixed strategies where Player 1 plays strategy A with probability p. What is p?"},
                                    class_="mt-2 mb-4",
                                ),
                                ui.tags.div(
                                    ui.input_radio_buttons(
                                        "answer_6",
                                        None,
                                        choices=["1/7", "1/6", "1/5", "1/4", "1/3", "1/2"],
                                    ),
                                    class_="three-col-radios",
                                ),
                                ui.input_action_button(
                                    "check_6",
                                    ui.tags.span("Antwort prüfen", **{"data-i18n-de": "Antwort prüfen", "data-i18n-en": "Check answer"}),
                                    class_="btn btn-primary mt-3"
                                ),
                                ui.output_ui("feedback_6"),
                                class_="card-body",
                            ),
                            class_="card shadow-sm h-100",
                        ),
                        class_="col exercise-col",
                    ),
                    class_="row row-cols-1 row-cols-lg-2 g-3 mt-2 align-items-stretch exercise-row",
                ),
                ui.tags.div(
                    ui.input_action_button(
                        "go_back_ex5",
                        ui.tags.span("Zurück", **{"data-i18n-de": "Zurück", "data-i18n-en": "Back"}),
                        class_="btn btn-outline-secondary"
                    ),
                    ui.input_action_button(
                        "go_back_intro_from_ex6",
                        ui.tags.span("Zurück zur Inhaltsseite", **{"data-i18n-de": "Zurück zur Inhaltsseite", "data-i18n-en": "Back to table of contents"}),
                        class_="btn btn-success"
                    ),
                    class_="mt-4 text-start mb-3 d-flex gap-2",
                ),
                class_="container-fluid px-4",
            ),
            value="ex6",
        ),
            # =================================================
            # Teil 2: Übung 1
            # =================================================
            ui.nav_panel(
                ui.tags.span("Übung 1", **{"data-i18n-de": "Übung 1", "data-i18n-en": "Exercise 1"}),
                ui.tags.div(
                    ui.h2(
                        "Übung 1: Trembling-Hand-perfekte Gleichgewichte (reine Strategien)",
                        class_="exercise-title",
                        **{
                            "data-i18n-de": "Übung 1: Trembling-Hand-perfekte Gleichgewichte (reine Strategien)",
                            "data-i18n-en": "Exercise 1: Trembling-hand perfect equilibria (pure strategies)",
                        },
                    ),
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.div(
                                    ui.tags.h5(
                                        "Spiel",
                                        class_="card-title",
                                        **{"data-i18n-de": "Spiel", "data-i18n-en": "Game"},
                                    ),
                                    ui.output_ui("game_table_t2_1"),
                                    ui.tags.div(
                                        ui.tags.div(
                                            ui.tags.h6("Notation", **{"data-i18n-de": "Notation", "data-i18n-en": "Notation"}),
                                            ui.output_ui("notation_t2_1"),
                                            class_="card-body py-2 exercise-notation-body",
                                        ),
                                        class_="card mt-3 notation-card",
                                        style="background-color:#f7f7f7;",
                                    ),
                                    ui.tags.div(
                                        ui.input_action_button(
                                            "new_game_t2_1",
                                            ui.tags.span("Neues Spiel", **{"data-i18n-de": "Neues Spiel", "data-i18n-en": "New game"}),
                                            class_="btn btn-outline-primary",
                                        ),
                                        ui.input_action_button(
                                            "help_t2_1",
                                            ui.tags.span("Hilfe", **{"data-i18n-de": "Hilfe", "data-i18n-en": "Help"}),
                                            class_="btn btn-outline-primary",
                                        ),
                                        class_="d-flex gap-2 mt-3",
                                    ),
                                    ui.output_ui("help_text_t2_1"),
                                    class_="card-body",
                                ),
                                class_="card shadow-sm h-100",
                                style="background-color:#ffffff;",
                            ),
                            class_="col exercise-col",
                        ),
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.div(
                                    ui.tags.h5(
                                        "Frage",
                                        class_="card-title",
                                        **{"data-i18n-de": "Frage", "data-i18n-en": "Question"},
                                    ),
                                    ui.tags.p(
                                        "Bestimmen Sie die Trembling-hand-perfekten Gleichgewichte in reinen Strategien.",
                                        **{
                                            "data-i18n-de": "Bestimmen Sie die Trembling-hand-perfekten Gleichgewichte in reinen Strategien.",
                                            "data-i18n-en": "Determine the trembling-hand perfect equilibria in pure strategies.",
                                        },
                                        class_="mt-2 mb-4",
                                    ),
                                    ui.tags.p(
                                        "Nicht-exklusive Antworten (mehrere können richtig sein).",
                                        **{
                                            "data-i18n-de": "Nicht-exklusive Antworten (mehrere können richtig sein).",
                                            "data-i18n-en": "Non-exclusive answers (multiple can be correct).",
                                        },
                                        class_="text-muted mb-3",
                                    ),
                                    ui.tags.div(
                                        ui.input_checkbox_group(
                                            "answer_t2_1",
                                            None,
                                            choices=["— bitte warten —"],
                                        ),
                                        class_="three-col-radios",
                                    ),
                                    ui.input_action_button(
                                        "check_t2_1",
                                        ui.tags.span("Antwort prüfen", **{"data-i18n-de": "Antwort prüfen", "data-i18n-en": "Check answer"}),
                                        class_="btn btn-primary mt-3",
                                    ),
                                    ui.output_ui("feedback_t2_1"),
                                    class_="card-body",
                                ),
                                class_="card shadow-sm h-100",
                                style="background-color:#ffffff;",
                            ),
                            class_="col exercise-col",
                        ),
                        class_="row row-cols-1 row-cols-lg-2 g-3 mt-2 align-items-stretch exercise-row",
                    ),
                    ui.tags.div(
                        ui.input_action_button(
                            "go_back_teil2_intro",
                            ui.tags.span("Zurück", **{"data-i18n-de": "Zurück", "data-i18n-en": "Back"}),
                            class_="btn btn-outline-secondary me-2",
                        ),
                        ui.input_action_button(
                            "go_to_teil2_ex2_from_ex1",
                            ui.tags.span("Weiter zu Übung 2", **{"data-i18n-de": "Weiter zu Übung 2", "data-i18n-en": "Next to Exercise 2"}),
                            class_="btn btn-success",
                        ),
                        class_="mt-4 text-start mb-3",
                    ),
                    class_="container-fluid px-4",
                ),
                value="teil2_ex1",
            ),

            # =================================================
            # Teil 2: Übung 2
            # =================================================
            ui.nav_panel(
                ui.tags.span("Übung 2", **{"data-i18n-de": "Übung 2", "data-i18n-en": "Exercise 2"}),
                ui.tags.div(
                    ui.h2(
                        "Übung 2: Evolutionär stabile Strategien",
                        class_="exercise-title",
                        **{
                            "data-i18n-de": "Übung 2: Evolutionär stabile Strategien",
                            "data-i18n-en": "Exercise 2: Evolutionarily stable strategies",
                        },
                    ),
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.div(
                                    ui.tags.h5(
                                        "Spiel",
                                        class_="card-title",
                                        **{"data-i18n-de": "Spiel", "data-i18n-en": "Game"},
                                    ),
                                    ui.output_ui("game_table_t2_2"),
                                    ui.tags.div(
                                        ui.tags.div(
                                            ui.tags.h6("Notation", **{"data-i18n-de": "Notation", "data-i18n-en": "Notation"}),
                                            ui.output_ui("notation_t2_2"),
                                            class_="card-body py-2 exercise-notation-body",
                                        ),
                                        class_="card mt-3 notation-card",
                                        style="background-color:#f7f7f7;",
                                    ),
                                    ui.tags.div(
                                        ui.input_action_button(
                                            "new_game_t2_2",
                                            ui.tags.span("Neues Spiel", **{"data-i18n-de": "Neues Spiel", "data-i18n-en": "New game"}),
                                            class_="btn btn-outline-primary",
                                        ),
                                        ui.input_action_button(
                                            "help_t2_2",
                                            ui.tags.span("Hilfe", **{"data-i18n-de": "Hilfe", "data-i18n-en": "Help"}),
                                            class_="btn btn-outline-primary",
                                        ),
                                        class_="d-flex gap-2 mt-3",
                                    ),
                                    ui.output_ui("help_text_t2_2"),
                                    class_="card-body",
                                ),
                                class_="card shadow-sm h-100",
                                style="background-color:#ffffff;",
                            ),
                            class_="col exercise-col",
                        ),
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.div(
                                    ui.tags.h5(
                                        "Frage",
                                        class_="card-title",
                                        **{"data-i18n-de": "Frage", "data-i18n-en": "Question"},
                                    ),
                                    ui.tags.p(
                                        "Bestimmen Sie die Gleichgewichte in evolutionär stabilen Strategien (ESS), in reinen Strategien.",
                                        **{
                                            "data-i18n-de": "Bestimmen Sie die Gleichgewichte in evolutionär stabilen Strategien (ESS), in reinen Strategien.",
                                            "data-i18n-en": "Determine the equilibria in evolutionarily stable strategies (ESS), in pure strategies.",
                                        },
                                        class_="mt-2 mb-4",
                                    ),
                                    ui.tags.p(
                                        "Nicht-exklusive Antworten (mehrere können richtig sein).",
                                        **{
                                            "data-i18n-de": "Nicht-exklusive Antworten (mehrere können richtig sein).",
                                            "data-i18n-en": "Non-exclusive answers (multiple can be correct).",
                                        },
                                        class_="text-muted mb-3",
                                    ),
                                    ui.tags.div(
                                        ui.input_checkbox_group(
                                            "answer_t2_2",
                                            None,
                                            choices=["— bitte warten —"],
                                        ),
                                        class_="three-col-radios",
                                    ),
                                    ui.input_action_button(
                                        "check_t2_2",
                                        ui.tags.span("Antwort prüfen", **{"data-i18n-de": "Antwort prüfen", "data-i18n-en": "Check answer"}),
                                        class_="btn btn-primary mt-3",
                                    ),
                                    ui.output_ui("feedback_t2_2"),
                                    class_="card-body",
                                ),
                                class_="card shadow-sm h-100",
                                style="background-color:#ffffff;",
                            ),
                            class_="col exercise-col",
                        ),
                        class_="row row-cols-1 row-cols-lg-2 g-3 mt-2 align-items-stretch exercise-row",
                    ),
                    ui.tags.div(
                        ui.input_action_button(
                            "go_back_teil2_ex1_from_ex2",
                            ui.tags.span("Zurück", **{"data-i18n-de": "Zurück", "data-i18n-en": "Back"}),
                            class_="btn btn-outline-secondary me-2",
                        ),
                        ui.input_action_button(
                            "go_back_intro_from_t2_ex2",
                            ui.tags.span("Zurück zur Inhaltsseite", **{"data-i18n-de": "Zurück zur Inhaltsseite", "data-i18n-en": "Back to table of contents"}),
                            class_="btn btn-success",
                        ),
                        class_="mt-4 text-start mb-3",
                    ),
                    class_="container-fluid px-4",
                ),
                value="teil2_ex2",
            ),
            ui.nav_panel(
                ui.tags.span("Übung 1", **{"data-i18n-de": "Übung 1", "data-i18n-en": "Exercise 1"}),
                ui.tags.div(
                    ui.h2(
                        "Übung 1 – Gemischtes Nash-Gleichgewicht im Marktauswahlspiel",
                        class_="exercise-title",
                        **{
                            "data-i18n-de": "Übung 1 – Gemischtes Nash-Gleichgewicht im Marktauswahlspiel",
                            "data-i18n-en": "Exercise 1 – Mixed Nash equilibrium in the market selection game",
                        },
                    ),
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.div(
                                    ui.tags.h5("Spiel", class_="card-title",
                                               **{"data-i18n-de": "Spiel", "data-i18n-en": "Game"}),
                                    ui.tags.p(
                                        "Zwei Firmen entscheiden gleichzeitig, auf welchen lokal getrennten Märkten sie ihre Waren anbieten.",
                                        class_="text-muted mb-2",
                                        **{
                                            "data-i18n-de": "Zwei Firmen entscheiden gleichzeitig, auf welchen lokal getrennten Märkten sie ihre Waren anbieten.",
                                            "data-i18n-en": "Two firms decide simultaneously on which locally separated markets they offer their products.",
                                        },
                                    ),
                                    ui.tags.p(
                                        "Es gibt drei Märkte: X, Y und Z. "
                                        "Firma 1 bietet Tablets und Tablet-Hüllen an, Firma 2 bietet Tablet-Hüllen und Smartphone-Hüllen.",
                                        class_="text-muted mb-2",
                                        **{
                                            "data-i18n-de": "Es gibt drei Märkte: X, Y und Z. Firma 1 bietet Tablets und Tablet-Hüllen an, Firma 2 bietet Tablet-Hüllen und Smartphone-Hüllen.",
                                            "data-i18n-en": "There are three markets: X, Y, and Z. Firm 1 offers tablets and tablet cases, while Firm 2 offers tablet cases and smartphone cases.",
                                        },
                                    ),
                                    ui.tags.p(
                                        "Strategien: Firma 1 wählt zwei Märkte (XY, XZ, YZ), Firma 2 wählt einen Markt (X, Y, Z). "
                                        "Firma 1 bevorzugt keine Überschneidung, Firma 2 bevorzugt Überschneidung um auch Tablet-Hüllen zu verkaufen.",
                                        class_="text-muted mb-2",
                                        **{
                                            "data-i18n-de": "Strategien: Firma 1 wählt zwei Märkte (XY, XZ, YZ), Firma 2 wählt einen Markt (X, Y, Z). Firma 1 bevorzugt keine Überschneidung, Firma 2 bevorzugt Überschneidung um auch Tablet-Hüllen zu verkaufen.",
                                            "data-i18n-en": "Strategies: Firm 1 chooses two markets (XY, XZ, YZ), Firm 2 chooses one market (X, Y, Z). Firm 1 prefers no overlap, while Firm 2 prefers overlap to also sell tablet cases.",
                                        },
                                    ),
                                    ui.tags.p(
                                        "Nutzen bei Überschneidungen der Märkte",
                                        class_="text-muted mb-1",
                                        **{
                                            "data-i18n-de": "Nutzen bei Überschneidungen der Märkte",
                                            "data-i18n-en": "Payoffs when markets overlap",
                                        },
                                    ),
                                    ui.tags.ul(
                                        ui.tags.li(
                                            "Firma 1 hat einen Nutzen von 6",
                                            **{
                                                "data-i18n-de": "Firma 1 hat einen Nutzen von 6",
                                                "data-i18n-en": "Firm 1 gets a payoff of 6",
                                            },
                                        ),
                                        ui.tags.li(
                                            "Firma 2 hat einen Nutzen von 5",
                                            **{
                                                "data-i18n-de": "Firma 2 hat einen Nutzen von 5",
                                                "data-i18n-en": "Firm 2 gets a payoff of 5",
                                            },
                                        ),
                                        class_="text-muted mb-3",
                                    ),
                                    ui.tags.p(
                                        "Nutzen bei getrennten Märkten",
                                        class_="text-muted mb-1",
                                        **{
                                            "data-i18n-de": "Nutzen bei getrennten Märkten",
                                            "data-i18n-en": "Payoffs on separate markets",
                                        },
                                    ),
                                    ui.tags.ul(
                                        ui.tags.li(
                                            "Firma 1 hat einen Nutzen von 9",
                                            **{
                                                "data-i18n-de": "Firma 1 hat einen Nutzen von 9",
                                                "data-i18n-en": "Firm 1 gets a payoff of 9",
                                            },
                                        ),
                                        ui.tags.li(
                                            "Der Nutzen von Firma 2 hängt davon ab, in welchem Markt Firma 2 alleine aktiv ist. Ist Firma 2 alleine in Markt X oder Y, hat sie einen Nutzen von 2, ist Firma 2 alleine in Markt Z hat sie Nutzen a mit a ∈ {1,3,4}",
                                            **{
                                                "data-i18n-de": "Der Nutzen von Firma 2 hängt davon ab, in welchem Markt Firma 2 alleine aktiv ist. Ist Firma 2 alleine in Markt X oder Y, hat sie einen Nutzen von 2, ist Firma 2 alleine in Markt Z hat sie Nutzen a mit a ∈ {1,3,4}",
                                                "data-i18n-en": "The payoff of Firm 2 depends on which market it is alone in. If Firm 2 is alone on market X or Y, it gets a payoff of 2; if alone on market Z, it gets a payoff of a with a ∈ {1,3,4}",
                                            },
                                        ),
                                        class_="text-muted mb-3",
                                    ),
                                    ui.output_ui("game_table_t3_ex1"),
                                    ui.tags.div(
                                        ui.tags.div(
                                            ui.tags.h6("Notation", **{"data-i18n-de": "Notation", "data-i18n-en": "Notation"}),
                                            ui.output_ui("notation_t3_ex1"),
                                            class_="card-body py-2 exercise-notation-body",
                                        ),
                                        class_="card mt-3 notation-card",
                                        style="background-color:#f7f7f7;",
                                    ),
                                    ui.tags.div(
                                        ui.input_action_button(
                                            "new_game_t3_ex1",
                                            ui.tags.span("Neues Spiel", **{"data-i18n-de": "Neues Spiel", "data-i18n-en": "New game"}),
                                            class_="btn btn-outline-primary",
                                        ),
                                        ui.input_action_button(
                                            "help_t3_ex1",
                                            ui.tags.span("Hilfe", **{"data-i18n-de": "Hilfe", "data-i18n-en": "Help"}),
                                            class_="btn btn-outline-primary",
                                        ),
                                        class_="d-flex gap-2 mt-3",
                                    ),
                                    ui.output_ui("help_text_t3_ex1"),
                                    class_="card-body",
                                ),
                                class_="card shadow-sm h-100",
                                style="background-color:#ffffff;",
                            ),
                            class_="col exercise-col",
                        ),
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.div(
                                    ui.tags.h5("Frage", class_="card-title",
                                               **{"data-i18n-de": "Frage", "data-i18n-en": "Question"}),
                                    ui.output_ui("question_t3_ex1"),
                                    ui.tags.div(
                                        ui.input_radio_buttons(
                                            "answer_t3_ex1",
                                            None,
                                            choices=T3_EX1_OPTION_CHOICES,
                                        ),
                                        class_="two-col-radios t3-ex1-options",
                                    ),
                                    ui.input_action_button(
                                        "check_t3_ex1",
                                        ui.tags.span("Antwort prüfen", **{"data-i18n-de": "Antwort prüfen", "data-i18n-en": "Check answer"}),
                                        class_="btn btn-primary mt-3",
                                    ),
                                    ui.output_ui("feedback_t3_ex1"),
                                    class_="card-body",
                                ),
                                class_="card shadow-sm h-100",
                                style="background-color:#ffffff;",
                            ),
                            class_="col exercise-col",
                        ),
                        class_="row row-cols-1 row-cols-lg-2 g-3 mt-2 align-items-stretch exercise-row",
                    ),
                    ui.input_action_button(
                        "go_back_intro_from_t3_ex1",
                        ui.tags.span("Zurück zur Inhaltsseite", **{"data-i18n-de": "Zurück zur Inhaltsseite", "data-i18n-en": "Back to table of contents"}),
                        class_="btn btn-outline-secondary mt-4 mb-3",
                    ),
                    class_="container-fluid px-4",
                ),
                value="teil3_ex1",
            ),
            ui.nav_panel(
                ui.tags.span("Besondere Spiele", **{"data-i18n-de": "Besondere Spiele", "data-i18n-en": "Special games"}),
                ui.tags.div(
                    ui.h2(
                        "Fuenf besondere Spiele der Spieltheorie",
                        class_="exercise-title",
                        **{
                            "data-i18n-de": "Fuenf besondere Spiele der Spieltheorie",
                            "data-i18n-en": "Five special games in game theory",
                        },
                    ),
                    ui.tags.p(
                        "Ein Beispielspiel (Nutzen (u1, u2)), die zentrale Idee und typische Ergebnisse.",
                        **{
                            "data-i18n-de": "Ein Beispielspiel (Strategien, Nutzen (u₁, u₂)), die zentrale Idee und typische Ergebnisse.",
                            "data-i18n-en": "An example game (strategies, payoffs (u₁, u₂)), the central idea, and typical outcomes.",
                        },
                        class_="text-muted mb-4",
                    ),
                    *SPECIAL_GAMES_ROWS,
                    ui.tags.div(
                        ui.input_action_button(
                            "go_back_intro_from_special",
                            ui.tags.span("Zurück zur Inhaltsseite", **{"data-i18n-de": "Zurück zur Inhaltsseite", "data-i18n-en": "Back to table of contents"}),
                            class_="btn btn-outline-secondary",
                        ),
                        class_="mt-4 text-start mb-3",
                    ),
                    class_="container-fluid px-4",
                ),
                value="special_games",
            ),
        ),
        ui.nav_panel(
            ui.tags.span("Bayes-Spiele", **{"data-i18n-de": "Bayes-Spiele", "data-i18n-en": "Bayesian games"}),
            ui.tags.div(
                ui.h2(
                    "Einführung in Bayes-Spiele",
                    class_="intro-title",
                    **{"data-i18n-de": "Einführung in Bayes-Spiele", "data-i18n-en": "Introduction to Bayesian games"},
                ),
                ui.tags.p(
                    "Ein Bayes-Spiel beschreibt eine strategische Situation, in der Spieler gleichzeitig entscheiden, "
                    "aber nicht vollständig über die Eigenschaften der anderen Spieler informiert sind. Jeder Spieler kennt "
                    "vor seiner Entscheidung seinen eigenen Typ, während die Typen der anderen Spieler nur über eine "
                    "gemeinsame Wahrscheinlichkeitsverteilung (common prior) beschrieben sind.",
                    **{
                        "data-i18n-de": "Ein Bayes-Spiel beschreibt eine strategische Situation, in der Spieler gleichzeitig entscheiden, "
                        "aber nicht vollständig über die Eigenschaften der anderen Spieler informiert sind. Jeder Spieler kennt "
                        "vor seiner Entscheidung seinen eigenen Typ, während die Typen der anderen Spieler nur über eine "
                        "gemeinsame Wahrscheinlichkeitsverteilung (common prior) beschrieben sind.",
                        "data-i18n-en": "A Bayesian game describes a strategic situation in which players decide simultaneously but are not fully "
                        "informed about the characteristics of other players. Each player knows their own type before choosing, "
                        "while other players' types are described by a common probability distribution (common prior).",
                    },
                    class_="text-muted",
                ),
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.h5(
                                "1) Spielermenge",
                                class_="card-title",
                                **{"data-i18n-de": "1) Spielermenge", "data-i18n-en": "1) Player set"},
                            ),
                            ui.tags.p(
                                "Die Spielermenge ist N. In allen Beispielen gibt es genau zwei Spieler: N = {1, 2}.",
                                **{
                                    "data-i18n-de": "Die Spielermenge ist N. In allen Beispielen gibt es genau zwei Spieler: N = {1, 2}.",
                                    "data-i18n-en": "The player set is N. In all examples there are exactly two players: N = {1, 2}.",
                                },
                                class_="mb-0",
                            ),
                            class_="card-body",
                        ),
                        class_="card shadow-sm h-100",
                        style="background-color:#ffffff;",
                    ),
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.h5(
                                "2) Typenmengen & Prior",
                                class_="card-title",
                                **{
                                    "data-i18n-de": "2) Typenmengen & Prior",
                                    "data-i18n-en": "2) Type sets & prior",
                                },
                            ),
                            ui.tags.p(
                                "Jeder Spieler i hat eine endliche Typenmenge Tᵢ. Der eigene Typ ist bekannt, die Typen der anderen "
                                "nur probabilistisch. Eine gemeinsame a-priori Verteilung (common prior) beschreibt, wie wahrscheinlich "
                                "jede Typkombination ist.",
                                **{
                                    "data-i18n-de": "Jeder Spieler i hat eine endliche Typenmenge Tᵢ. Der eigene Typ ist bekannt, die Typen der anderen "
                                    "nur probabilistisch. Eine gemeinsame a-priori Verteilung (common prior) beschreibt, wie wahrscheinlich "
                                    "jede Typkombination ist.",
                                    "data-i18n-en": "Each player i has a finite type set Tᵢ. One’s own type is known, others’ types are only probabilistic. "
                                    "A common prior distribution specifies how likely each type profile is.",
                                },
                                class_="mb-0",
                            ),
                            class_="card-body",
                        ),
                        class_="card shadow-sm h-100",
                        style="background-color:#ffffff;",
                    ),
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.h5(
                                "3) Strategiemengen",
                                class_="card-title",
                                **{"data-i18n-de": "3) Strategiemengen", "data-i18n-en": "3) Strategy sets"},
                            ),
                            ui.tags.p(
                                "Eine Strategie ist ein vollständiger Handlungsplan: Für jeden möglichen eigenen Typ legt sie fest, "
                                "welche Aktion gewählt wird. Formal ist eine reine Strategie eine Abbildung sᵢ: Tᵢ → Aᵢ. "
                                "Spieler können auch typ-abhängig randomisieren (gemischte Strategie).",
                                **{
                                    "data-i18n-de": "Eine Strategie ist ein vollständiger Handlungsplan: Für jeden möglichen eigenen Typ legt sie fest, "
                                    "welche Aktion gewählt wird. Formal ist eine reine Strategie eine Abbildung sᵢ: Tᵢ → Aᵢ. "
                                    "Spieler können auch typ-abhängig randomisieren (gemischte Strategie).",
                                    "data-i18n-en": "A strategy is a complete contingency plan: for each possible own type it specifies which action to take. "
                                    "Formally, a pure strategy is a mapping sᵢ: Tᵢ → Aᵢ. Players may also randomise conditional on their type (mixed strategy).",
                                },
                                class_="mb-0",
                            ),
                            class_="card-body",
                        ),
                        class_="card shadow-sm h-100",
                        style="background-color:#ffffff;",
                    ),
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.h5(
                                "4) Nutzenfunktionen",
                                class_="card-title",
                                **{"data-i18n-de": "4) Nutzenfunktionen", "data-i18n-en": "4) Payoff functions"},
                            ),
                            ui.tags.p(
                                "Der Nutzen hängt von Aktionen und Typen ab: uᵢ(a₁, a₂, t₁, t₂). Da Typen unsicher sind, bewerten Spieler "
                                "Strategien über den erwarteten Nutzen, berechnet mit dem common prior.",
                                **{
                                    "data-i18n-de": "Der Nutzen hängt von Aktionen und Typen ab: uᵢ(a₁, a₂, t₁, t₂). Da Typen unsicher sind, bewerten Spieler "
                                    "Strategien über den erwarteten Nutzen, berechnet mit dem common prior.",
                                    "data-i18n-en": "Payoffs depend on actions and types: uᵢ(a₁, a₂, t₁, t₂). Because types are uncertain, players evaluate "
                                    "strategies using expected utility computed under the common prior.",
                                },
                                class_="mb-0",
                            ),
                            class_="card-body",
                        ),
                        class_="card shadow-sm h-100",
                        style="background-color:#ffffff;",
                    ),
                    class_="row row-cols-1 row-cols-md-2 g-3 mt-2 align-items-stretch card-row intro-rule-row bayes-intro-grid mb-4",
                ),
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5(
                                    "Beispiel (Skizze)",
                                    class_="card-title",
                                    **{"data-i18n-de": "Beispiel (Skizze)", "data-i18n-en": "Example (sketch)"},
                                ),
                                ui.tags.p(
                                    "Spieler 1 hat die Typen t₁ ∈ {1, 2} und Spieler 2 kennt nur Prob(t₁=1)=1/4, Prob(t₁=2)=3/4. "
                                    "Für jeden Typ gibt es eine eigene Auszahlungsmatrix. Eine Strategie von Spieler 1 legt daher fest, "
                                    "was er als Typ 1 und was er als Typ 2 spielt (z.B. s₁=(A,B)).",
                                    **{
                                        "data-i18n-de": "Spieler 1 hat die Typen t₁ ∈ {1, 2} und Spieler 2 kennt nur Prob(t₁=1)=1/4, Prob(t₁=2)=3/4. "
                                        "Für jeden Typ gibt es eine eigene Auszahlungsmatrix. Eine Strategie von Spieler 1 legt daher fest, "
                                        "was er als Typ 1 und was er als Typ 2 spielt (z.B. s₁=(A,B)).",
                                        "data-i18n-en": "Player 1 has types t₁ ∈ {1, 2} and Player 2 only knows Prob(t₁=1)=1/4, Prob(t₁=2)=3/4. "
                                        "There is a separate payoff matrix for each type. Therefore, a strategy of Player 1 specifies "
                                        "what to play as type 1 and as type 2 (e.g. s₁=(A,B)).",
                                    },
                                    class_="text-muted mb-3",
                                ),
                                ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h6(
                                            "Beispielmatrix: Typ 1",
                                            class_="mb-2",
                                            **{"data-i18n-de": "Beispielmatrix: Typ 1", "data-i18n-en": "Example matrix: Type 1"},
                                        ),
                                        payoff_table(
                                            BAYES_INTRO_ROWS,
                                            BAYES_INTRO_COLS,
                                            BAYES_INTRO_PAYOFFS_T1,
                                            row_player_label="Spieler 1 (Typ 1)",
                                            col_player_label="Spieler 2",
                                        ),
                                        class_="col-12 col-xl-6",
                                    ),
                                    ui.tags.div(
                                        ui.tags.h6(
                                            "Beispielmatrix: Typ 2",
                                            class_="mb-2",
                                            **{"data-i18n-de": "Beispielmatrix: Typ 2", "data-i18n-en": "Example matrix: Type 2"},
                                        ),
                                        payoff_table(
                                            BAYES_INTRO_ROWS,
                                            BAYES_INTRO_COLS,
                                            BAYES_INTRO_PAYOFFS_T2,
                                            row_player_label="Spieler 1 (Typ 2)",
                                            col_player_label="Spieler 2",
                                        ),
                                        class_="col-12 col-xl-6",
                                    ),
                                    class_="row g-3",
                                ),
                                class_="col-12 col-lg-7",
                            ),
                            ui.tags.div(
                                ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h5(
                                            "Notation",
                                            class_="mb-2",
                                            **{"data-i18n-de": "Notation", "data-i18n-en": "Notation"},
                                        ),
                                        ui.tags.ul(
                                            ui.tags.li(
                                                ui.tags.code("N = {1, 2}"),
                                                ui.tags.span(
                                                    ": Zwei Spieler.",
                                                    **{"data-i18n-de": ": Zwei Spieler.", "data-i18n-en": ": Two players."},
                                                ),
                                            ),
                                            ui.tags.li(
                                                ui.tags.code("Tᵢ"),
                                                ui.tags.span(
                                                    ": Typenmenge von Spieler i.",
                                                    **{"data-i18n-de": ": Typenmenge von Spieler i.", "data-i18n-en": ": Type set of player i."},
                                                ),
                                            ),
                                            ui.tags.li(
                                                ui.tags.code("p(t₁, t₂)"),
                                                ui.tags.span(
                                                    ": common prior über Typkombinationen.",
                                                    **{
                                                        "data-i18n-de": ": common prior über Typkombinationen.",
                                                        "data-i18n-en": ": common prior over type profiles.",
                                                    },
                                                ),
                                            ),
                                            ui.tags.li(
                                                ui.tags.code("sᵢ : Tᵢ → Aᵢ"),
                                                ui.tags.span(
                                                    ": reine Strategie (Typ ↦ Aktion).",
                                                    **{
                                                        "data-i18n-de": ": reine Strategie (Typ ↦ Aktion).",
                                                        "data-i18n-en": ": pure strategy (type ↦ action).",
                                                    },
                                                ),
                                            ),
                                            ui.tags.li(
                                                ui.tags.code("s = (s₁, s₂)"),
                                                ui.tags.span(
                                                    ": Strategieprofil.",
                                                    **{"data-i18n-de": ": Strategieprofil.", "data-i18n-en": ": strategy profile."},
                                                ),
                                            ),
                                            ui.tags.li(
                                                ui.tags.code("uᵢ(a₁, a₂, t₁, t₂)"),
                                                ui.tags.span(
                                                    ": Nutzen von Spieler i.",
                                                    **{"data-i18n-de": ": Nutzen von Spieler i.", "data-i18n-en": ": payoff of player i."},
                                                ),
                                            ),
                                            ui.tags.li(
                                                ui.tags.code("EUᵢ(s)"),
                                                ui.tags.span(
                                                    ": erwarteter Nutzen unter dem common prior.",
                                                    **{
                                                        "data-i18n-de": ": erwarteter Nutzen unter dem common prior.",
                                                        "data-i18n-en": ": expected utility under the common prior.",
                                                    },
                                                ),
                                            ),
                                            class_="mb-0",
                                        ),
                                        class_="card-body",
                                    ),
                                    class_="card h-100 notation-card",
                                    style="background-color:#f7f7f7;",
                                ),
                                class_="col-12 col-lg-5",
                            ),
                            class_="row g-3 align-items-stretch",
                        ),
                        class_="card-body intro-example-body",
                    ),
                    class_="card shadow-sm h-100",
                    style="background-color:#ffffff;",
                ),
                ui.h2(
                    "Übersicht Bayes-Spiele",
                    class_="exercise-title",
                    **{"data-i18n-de": "Übersicht Bayes-Spiele", "data-i18n-en": "Overview of Bayesian games"},
                ),
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.h5(
                            "Teil 1: Grundlagen statischer Bayes-Spiele",
                            class_="card-title",
                            **{"data-i18n-de": "Teil 1: Grundlagen statischer Bayes-Spiele", "data-i18n-en": "Part 1: Foundations of static Bayesian games"},
                        ),
                        ui.tags.ul(
                            ui.tags.li(
                                ui.tags.a(
                                    "Übung 1 – Bayes-Spiel mit einseitiger privater Information",
                                    href="#",
                                    onclick="if (window.Shiny && Shiny.setInputValue) { Shiny.setInputValue('go_to_bayes_ex1', Date.now(), {priority: 'event'}); } return false;",
                                    class_="toc-link",
                                    **{
                                        "data-i18n-de": "Übung 1 – Bayes-Spiel mit einseitiger privater Information",
                                        "data-i18n-en": "Exercise 1 – Bayesian game with one-sided private information",
                                    },
                                )
                            ),
                            ui.tags.li(
                                ui.tags.a(
                                    "Übung 2a – A-posteriori Wahrscheinlichkeiten in Bayes-Spielen",
                                    href="#",
                                    onclick="if (window.Shiny && Shiny.setInputValue) { Shiny.setInputValue('go_to_bayes_ex2a', Date.now(), {priority: 'event'}); } return false;",
                                    class_="toc-link",
                                    **{
                                        "data-i18n-de": "Übung 2a – A-posteriori Wahrscheinlichkeiten in Bayes-Spielen",
                                        "data-i18n-en": "Exercise 2a – Posterior probabilities in Bayesian games",
                                    },
                                )
                            ),
                            ui.tags.li(
                                ui.tags.a(
                                    "Übung 2b – Bayes-Nash-Gleichgewichte bei zweiseitiger privater Information",
                                    href="#",
                                    onclick="if (window.Shiny && Shiny.setInputValue) { Shiny.setInputValue('go_to_bayes_ex2b', Date.now(), {priority: 'event'}); } return false;",
                                    class_="toc-link",
                                    **{
                                        "data-i18n-de": "Übung 2b – Bayes-Nash-Gleichgewichte bei zweiseitiger privater Information",
                                        "data-i18n-en": "Exercise 2b – Bayesian Nash equilibria with two-sided private information",
                                    },
                                )
                            ),
                            class_="mb-0 toc-list",
                        ),
                        class_="card-body toc-card-body",
                    ),
                    class_="card shadow-sm h-100 mt-4",
                    style="background-color:#ffffff;",
                ),
                ui.input_action_button(
                    "go_to_bayes_ex1",
                    ui.tags.span("Zu Teil 1, Übung 1", **{"data-i18n-de": "Zu Teil 1, Übung 1", "data-i18n-en": "Go to Part 1, Exercise 1"}),
                    class_="btn btn-success mt-4",
                ),
                class_="container-fluid px-4",
            ),
            value="bayes_intro",
        ),
        ui.nav_panel(
            ui.tags.span("Bayes Übung 1", **{"data-i18n-de": "Bayes Übung 1", "data-i18n-en": "Bayes Exercise 1"}),
            ui.tags.div(
                ui.h2(
                    "Übung 1 – Bayes-Spiel mit einseitiger privater Information",
                    class_="exercise-title",
                    **{
                        "data-i18n-de": "Übung 1 – Bayes-Spiel mit einseitiger privater Information",
                        "data-i18n-en": "Exercise 1 – Bayesian game with one-sided private information",
                    },
                ),
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Spiel", class_="card-title",
                                           **{"data-i18n-de": "Spiel", "data-i18n-en": "Game"}),
                                ui.tags.p(
                                    "Spieler 1 kennt vor der Entscheidung seinen Typ (1 oder 2), Spieler 2 kennt ihn nicht. "
                                    "Common Prior: P(Typ 1)=1/4, P(Typ 2)=3/4.",
                                    **{
                                        "data-i18n-de": "Spieler 1 kennt vor der Entscheidung seinen Typ (1 oder 2), Spieler 2 kennt ihn nicht. "
                                        "Common Prior: P(Typ 1)=1/4, P(Typ 2)=3/4.",
                                        "data-i18n-en": "Player 1 knows their type (1 or 2) before acting, Player 2 does not. "
                                        "Common prior: P(Type 1)=1/4, P(Type 2)=3/4.",
                                    },
                                    class_="text-muted mb-3",
                                ),
                                ui.output_ui("bayes_ex1_game_tables"),
                                ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h6("Notation", **{"data-i18n-de": "Notation", "data-i18n-en": "Notation"}),
                                        ui.tags.ul(
                                            ui.tags.li(
                                                ui.tags.code("s₁ = (s₁(t₁=1), s₁(t₁=2)) ∈ {A,B}×{A,B}"),
                                                class_="mb-1",
                                            ),
                                            ui.tags.li(
                                                ui.tags.code("s₂ ∈ {X,Y}"),
                                                class_="mb-1",
                                            ),
                                            ui.tags.li(
                                                ui.tags.code("p(t₁=1)=1/4, p(t₁=2)=3/4"),
                                                class_="mb-0",
                                            ),
                                            class_="mb-0",
                                        ),
                                        class_="card-body py-2 exercise-notation-body",
                                    ),
                                    class_="card mt-3 notation-card",
                                    style="background-color:#f7f7f7;",
                                ),
                                ui.tags.div(
                                    ui.input_action_button(
                                        "new_game_bayes_ex1",
                                        ui.tags.span("Neues Spiel", **{"data-i18n-de": "Neues Spiel", "data-i18n-en": "New game"}),
                                        class_="btn btn-outline-primary",
                                    ),
                                    ui.input_action_button(
                                        "help_bayes_ex1",
                                        ui.tags.span("Hilfe", **{"data-i18n-de": "Hilfe", "data-i18n-en": "Help"}),
                                        class_="btn btn-outline-primary",
                                    ),
                                    class_="d-flex gap-2 mt-3",
                                ),
                                ui.output_ui("help_text_bayes_ex1"),
                                class_="card-body",
                            ),
                            class_="card shadow-sm h-100",
                            style="background-color:#ffffff;",
                        ),
                        class_="col exercise-col",
                    ),
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Frage", class_="card-title",
                                           **{"data-i18n-de": "Frage", "data-i18n-en": "Question"}),
                                ui.tags.p(
                                    "Welche der folgenden Strategieprofile sind Bayes-Gleichgewichte?",
                                    **{
                                        "data-i18n-de": "Welche der folgenden Strategieprofile sind Bayes-Gleichgewichte?",
                                        "data-i18n-en": "Which of the following strategy profiles are Bayesian equilibria?",
                                    },
                                    class_="mt-2 mb-3",
                                ),
                                ui.tags.p(
                                    "Nicht-exklusive Antworten (mehrere können richtig sein).",
                                    **{
                                        "data-i18n-de": "Nicht-exklusive Antworten (mehrere können richtig sein).",
                                        "data-i18n-en": "Non-exclusive answers (multiple can be correct).",
                                    },
                                    class_="text-muted mb-3",
                                ),
                                ui.tags.div(
                                    ui.input_checkbox_group(
                                        "answer_bayes_ex1",
                                        None,
                                        choices=["— bitte warten —"],
                                    ),
                                    class_="three-col-radios",
                                ),
                                ui.input_action_button(
                                    "check_bayes_ex1",
                                    ui.tags.span("Antwort prüfen", **{"data-i18n-de": "Antwort prüfen", "data-i18n-en": "Check answer"}),
                                    class_="btn btn-primary mt-3",
                                ),
                                ui.output_ui("feedback_bayes_ex1"),
                                class_="card-body",
                            ),
                            class_="card shadow-sm h-100",
                            style="background-color:#ffffff;",
                        ),
                        class_="col exercise-col",
                    ),
                    class_="row row-cols-1 row-cols-lg-2 g-3 mt-2 align-items-stretch exercise-row",
                ),
                ui.tags.div(
                    ui.input_action_button(
                        "go_back_bayes_intro",
                        ui.tags.span("Zurück", **{"data-i18n-de": "Zurück", "data-i18n-en": "Back"}),
                        class_="btn btn-outline-secondary",
                    ),
                    ui.input_action_button(
                        "go_to_bayes_ex2a_from_ex1",
                        ui.tags.span("Weiter zu Übung 2a", **{"data-i18n-de": "Weiter zu Übung 2a", "data-i18n-en": "Next to Exercise 2a"}),
                        class_="btn btn-success",
                    ),
                    class_="mt-4 text-start mb-3 d-flex gap-2",
                ),
                class_="container-fluid px-4",
            ),
            value="bayes_ex1",
        ),
        ui.nav_panel(
            ui.tags.span("Bayes Übung 2a", **{"data-i18n-de": "Bayes Übung 2a", "data-i18n-en": "Bayes Exercise 2a"}),
            ui.tags.div(
                ui.h2(
                    "Übung 2a – A-posteriori Wahrscheinlichkeiten in Bayes-Spielen",
                    class_="exercise-title",
                    **{
                        "data-i18n-de": "Übung 2a – A-posteriori Wahrscheinlichkeiten in Bayes-Spielen",
                        "data-i18n-en": "Exercise 2a – Posterior probabilities in Bayesian games",
                    },
                ),
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Spiel", class_="card-title",
                                           **{"data-i18n-de": "Spiel", "data-i18n-en": "Game"}),
                                ui.tags.p(
                                    "Spieler 1 ist vom Typ a oder b, Spieler 2 vom Typ c oder d. Beide kennen nur ihren eigenen Typ.",
                                    **{
                                        "data-i18n-de": "Spieler 1 ist vom Typ a oder b, Spieler 2 vom Typ c oder d. Beide kennen nur ihren eigenen Typ.",
                                        "data-i18n-en": "Player 1 is type a or b, player 2 is type c or d. Both only know their own type.",
                                    },
                                    class_="mb-2",
                                ),
                                ui.tags.p(
                                    "Common prior über Typen:",
                                    **{"data-i18n-de": "Common prior über Typen:", "data-i18n-en": "Common prior over types:"},
                                    class_="mb-2",
                                ),
                                ui.output_ui("bayes_ex2a_prior_table"),
                                ui.output_ui("bayes_ex2a_game_tables"),
                                ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h6("Notation", **{"data-i18n-de": "Notation", "data-i18n-en": "Notation"}),
                                        ui.tags.ul(
                                            ui.tags.li(ui.tags.code("Prob(a,c)+Prob(a,d)+Prob(b,c)+Prob(b,d)=1")),
                                            ui.tags.li(ui.tags.code("Prob(c|a)+Prob(d|a)=1")),
                                            ui.tags.li(ui.tags.code("Prob(c|b)+Prob(d|b)=1")),
                                            class_="mb-0",
                                        ),
                                        class_="card-body py-2 exercise-notation-body",
                                    ),
                                    class_="card mb-3 notation-card",
                                    style="background-color:#f7f7f7;",
                                ),
                                ui.tags.div(
                                    ui.input_action_button(
                                        "new_game_bayes_ex2a",
                                        ui.tags.span("Neues Spiel", **{"data-i18n-de": "Neues Spiel", "data-i18n-en": "New game"}),
                                        class_="btn btn-outline-primary mt-2",
                                    ),
                                    ui.input_action_button(
                                        "help_bayes_ex2a",
                                        ui.tags.span("Hilfe", **{"data-i18n-de": "Hilfe", "data-i18n-en": "Help"}),
                                        class_="btn btn-outline-primary mt-2",
                                    ),
                                    class_="d-flex gap-2",
                                ),
                                ui.output_ui("help_text_bayes_ex2a"),
                                class_="card-body",
                            ),
                            class_="card shadow-sm h-100",
                            style="background-color:#ffffff;",
                        ),
                        class_="col exercise-col",
                    ),
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Frage a)", class_="card-title",
                                           **{"data-i18n-de": "Frage a)", "data-i18n-en": "Question a)"}),
                                ui.tags.p(
                                    "Wie lauten Prob(c|a), Prob(d|a), Prob(c|b) und Prob(d|b)?",
                                    **{
                                        "data-i18n-de": "Wie lauten Prob(c|a), Prob(d|a), Prob(c|b) und Prob(d|b)?",
                                        "data-i18n-en": "What are Prob(c|a), Prob(d|a), Prob(c|b), and Prob(d|b)?",
                                    },
                                    class_="mt-2 mb-3",
                                ),
                                ui.tags.p(
                                    "Wähle genau eine Antwort.",
                                    **{"data-i18n-de": "Wähle genau eine Antwort.", "data-i18n-en": "Choose exactly one answer."},
                                    class_="mb-3",
                                ),
                                ui.tags.div(
                                    ui.input_radio_buttons(
                                        "answer_bayes_ex2a",
                                        None,
                                        choices=["— bitte warten —"],
                                    ),
                                    class_="bayes-ex2a-options",
                                ),
                                ui.input_action_button(
                                    "check_bayes_ex2a",
                                    ui.tags.span("Antwort prüfen", **{"data-i18n-de": "Antwort prüfen", "data-i18n-en": "Check answer"}),
                                    class_="btn btn-primary mt-3",
                                ),
                                ui.output_ui("feedback_bayes_ex2a"),
                                ui.output_ui("intermediate_bayes_ex2a"),
                                class_="card-body",
                            ),
                            class_="card shadow-sm h-100",
                            style="background-color:#ffffff;",
                        ),
                        class_="col exercise-col",
                    ),
                    class_="row row-cols-1 row-cols-lg-2 g-3 mt-2 align-items-stretch exercise-row",
                ),
                ui.tags.div(
                    ui.input_action_button(
                        "go_back_bayes_ex1_from_ex2a",
                        ui.tags.span("Zurück zu Übung 1", **{"data-i18n-de": "Zurück zu Übung 1", "data-i18n-en": "Back to Exercise 1"}),
                        class_="btn btn-outline-secondary",
                    ),
                    ui.input_action_button(
                        "go_to_bayes_ex2b_from_ex2a",
                        ui.tags.span("Weiter zu Übung 2b", **{"data-i18n-de": "Weiter zu Übung 2b", "data-i18n-en": "Next to Exercise 2b"}),
                        class_="btn btn-success",
                    ),
                    class_="mt-4 text-start mb-3 d-flex gap-2",
                ),
                class_="container-fluid px-4",
            ),
            value="bayes_ex2a",
        ),
        ui.nav_panel(
            ui.tags.span("Bayes Übung 2b", **{"data-i18n-de": "Bayes Übung 2b", "data-i18n-en": "Bayes Exercise 2b"}),
            ui.tags.div(
                ui.h2(
                    "Übung 2b – Bayes-Nash-Gleichgewichte bei zweiseitiger privater Information",
                    class_="exercise-title",
                    **{
                        "data-i18n-de": "Übung 2b – Bayes-Nash-Gleichgewichte bei zweiseitiger privater Information",
                        "data-i18n-en": "Exercise 2b – Bayesian Nash equilibria with two-sided private information",
                    },
                ),
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Spiel", class_="card-title",
                                           **{"data-i18n-de": "Spiel", "data-i18n-en": "Game"}),
                                ui.tags.p(
                                    "Spieler 1 ist vom Typ a oder b, Spieler 2 vom Typ c oder d. Beide kennen nur ihren eigenen Typ.",
                                    **{
                                        "data-i18n-de": "Spieler 1 ist vom Typ a oder b, Spieler 2 vom Typ c oder d. Beide kennen nur ihren eigenen Typ.",
                                        "data-i18n-en": "Player 1 is type a or b, player 2 is type c or d. Both only know their own type.",
                                    },
                                    class_="mb-2",
                                ),
                                ui.tags.p(
                                    "Common prior über Typen:",
                                    **{"data-i18n-de": "Common prior über Typen:", "data-i18n-en": "Common prior over types:"},
                                    class_="mb-2",
                                ),
                                ui.output_ui("bayes_ex2b_prior_table"),
                                ui.output_ui("bayes_ex2b_game_tables"),
                                ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h6("Notation", **{"data-i18n-de": "Notation", "data-i18n-en": "Notation"}),
                                        ui.tags.ul(
                                            ui.tags.li(ui.tags.code("Prob(a,c)+Prob(a,d)+Prob(b,c)+Prob(b,d)=1")),
                                            ui.tags.li(ui.tags.code("Prob(c|a)+Prob(d|a)=1")),
                                            ui.tags.li(ui.tags.code("Prob(c|b)+Prob(d|b)=1")),
                                            class_="mb-0",
                                        ),
                                        class_="card-body py-2 exercise-notation-body",
                                    ),
                                    class_="card mb-3 notation-card",
                                    style="background-color:#f7f7f7;",
                                ),
                                ui.tags.div(
                                    ui.input_action_button(
                                        "new_game_bayes_ex2a_from_ex2b",
                                        ui.tags.span("Neues Spiel (a)", **{"data-i18n-de": "Neues Spiel (a)", "data-i18n-en": "New game (a)"}),
                                        class_="btn btn-outline-primary mt-2",
                                    ),
                                    ui.input_action_button(
                                        "help_bayes_ex2b",
                                        ui.tags.span("Hilfe", **{"data-i18n-de": "Hilfe", "data-i18n-en": "Help"}),
                                        class_="btn btn-outline-primary mt-2",
                                    ),
                                    class_="d-flex gap-2",
                                ),
                                ui.output_ui("help_text_bayes_ex2b"),
                                class_="card-body",
                            ),
                            class_="card shadow-sm h-100",
                            style="background-color:#ffffff;",
                        ),
                        class_="col exercise-col",
                    ),
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Frage b)", class_="card-title",
                                           **{"data-i18n-de": "Frage b)", "data-i18n-en": "Question b)"}),
                                ui.tags.p(
                                    "Welche der folgenden Strategieprofile sind Bayes-Gleichgewichte?",
                                    **{
                                        "data-i18n-de": "Welche der folgenden Strategieprofile sind Bayes-Gleichgewichte?",
                                        "data-i18n-en": "Which of the following strategy profiles are Bayesian equilibria?",
                                    },
                                    class_="mb-3",
                                ),
                                ui.tags.p(
                                    "Nicht-exklusive Antworten (mehrere können richtig sein).",
                                    **{
                                        "data-i18n-de": "Nicht-exklusive Antworten (mehrere können richtig sein).",
                                        "data-i18n-en": "Non-exclusive answers (multiple can be correct).",
                                    },
                                    class_="mb-3",
                                ),
                                ui.tags.div(
                                    ui.input_checkbox_group(
                                        "answer_bayes_ex2b",
                                        None,
                                        choices=["— bitte warten —"],
                                    ),
                                    class_="bayes-ex2a-options",
                                ),
                                ui.tags.div(
                                    ui.input_action_button(
                                        "check_bayes_ex2b",
                                        ui.tags.span("Antwort prüfen", **{"data-i18n-de": "Antwort prüfen", "data-i18n-en": "Check answer"}),
                                        class_="btn btn-primary mt-3",
                                    ),
                                ),
                                ui.output_ui("feedback_bayes_ex2b"),
                                ui.output_ui("intermediate_bayes_ex2a_for_ex2b"),
                                class_="card-body",
                            ),
                            class_="card shadow-sm h-100",
                            style="background-color:#ffffff;",
                        ),
                        class_="col exercise-col",
                    ),
                    class_="row row-cols-1 row-cols-lg-2 g-3 mt-2 align-items-stretch exercise-row",
                ),
                ui.tags.div(
                    ui.input_action_button(
                        "go_back_bayes_ex2a_from_ex2b",
                        ui.tags.span("Zurück zu Übung 2a", **{"data-i18n-de": "Zurück zu Übung 2a", "data-i18n-en": "Back to Exercise 2a"}),
                        class_="btn btn-outline-secondary",
                    ),
                    ui.input_action_button(
                        "go_back_bayes_intro_from_ex2b",
                        ui.tags.span("Zurück zur Inhaltsseite", **{"data-i18n-de": "Zurück zur Inhaltsseite", "data-i18n-en": "Back to table of contents"}),
                        class_="btn btn-success",
                    ),
                    class_="mt-4 text-start mb-3 d-flex gap-2",
                ),
                class_="container-fluid px-4",
            ),
            value="bayes_ex2b",
        ),
        id="main_tabs",
    ),
)


# =========================================================
# SERVER
# =========================================================
def server(input, output, session):
    def current_lang():
        return "en" if input.lang_toggle() else "de"

    # -------- Intro and navigation events --------
    @reactive.effect
    @reactive.event(input.start_exercise)
    def _go_to_exercise():
        ui.update_navset("main_tabs", selected="ex1")
    @reactive.effect
    @reactive.event(input.go_to_ex2)
    def _go_to_ex2():
        ui.update_navset("main_tabs", selected="ex2")
    @reactive.effect
    @reactive.event(input.go_to_ex3)
    def _go_to_ex3():
        ui.update_navset("main_tabs", selected="ex3")
    @reactive.effect
    @reactive.event(input.go_to_ex4)
    def _go_to_ex4():
        ui.update_navset("main_tabs", selected="ex4")
    @reactive.effect
    @reactive.event(input.go_to_ex5)
    def _go_to_ex5():
        ui.update_navset("main_tabs", selected="ex5")
    @reactive.effect
    @reactive.event(input.go_to_ex6)
    def _go_to_ex6():
        ui.update_navset("main_tabs", selected="ex6")
    @reactive.effect
    @reactive.event(input.go_back_intro_from_ex6)
    def _go_back_intro_from_ex6():
        ui.update_navset("main_tabs", selected="intro")
    @reactive.effect
    @reactive.event(input.go_to_special_games)
    def _go_to_special_games():
        ui.update_navset("main_tabs", selected="special_games")
    @reactive.effect
    @reactive.event(input.go_to_teil3_ex1)
    def _go_to_teil3_ex1():
        ui.update_navset("main_tabs", selected="teil3_ex1")
    @reactive.effect
    @reactive.event(input.start_teil2_ex1)
    def _go_to_teil2_ex1():
        ui.update_navset("main_tabs", selected="teil2_ex1")
    @reactive.effect
    @reactive.event(input.go_to_teil2_ex2)
    def _go_to_teil2_ex2():
        ui.update_navset("main_tabs", selected="teil2_ex2")
    @reactive.effect
    @reactive.event(input.go_back_teil2_intro)
    def _go_back_teil2_intro():
        ui.update_navset("main_tabs", selected="intro")
    @reactive.effect
    @reactive.event(input.go_to_teil2_ex2_from_ex1)
    def _go_to_teil2_ex2_from_ex1():
        ui.update_navset("main_tabs", selected="teil2_ex2")
    @reactive.effect
    @reactive.event(input.go_back_teil2_ex1_from_ex2)
    def _go_back_teil2_ex1_from_ex2():
        ui.update_navset("main_tabs", selected="teil2_ex1")
    @reactive.effect
    @reactive.event(input.go_back_intro_from_t2_ex2)
    def _go_back_intro_from_t2_ex2():
        ui.update_navset("main_tabs", selected="intro")
    @reactive.effect
    @reactive.event(input.go_back_intro_from_special)
    def _go_back_intro_from_special():
        ui.update_navset("main_tabs", selected="intro")
    @reactive.effect
    @reactive.event(input.go_back_intro_from_t3_ex1)
    def _go_back_intro_from_t3_ex1():
        ui.update_navset("main_tabs", selected="intro")
    @reactive.effect
    @reactive.event(input.go_back_ex1)
    def _go_back_ex1():
        ui.update_navset("main_tabs", selected="ex1")
    @reactive.effect
    @reactive.event(input.go_back_ex2)
    def _go_back_ex2():
        ui.update_navset("main_tabs", selected="ex2")
    @reactive.effect
    @reactive.event(input.go_back_ex3)
    def _go_back_ex3():
        ui.update_navset("main_tabs", selected="ex3")
    @reactive.effect
    @reactive.event(input.go_back_ex4)
    def _go_back_ex4():
        ui.update_navset("main_tabs", selected="ex4")
    @reactive.effect
    @reactive.event(input.go_back_ex5)
    def _go_back_ex5():
        ui.update_navset("main_tabs", selected="ex5")
    @reactive.effect
    @reactive.event(input.nav_normalform)
    def _nav_normalform():
        ui.update_navset("main_tabs", selected="intro")
    @reactive.effect
    @reactive.event(input.go_to_bayes_ex1)
    def _go_to_bayes_ex1():
        ui.update_navset("main_tabs", selected="bayes_ex1")
    @reactive.effect
    @reactive.event(input.go_to_bayes_ex2a)
    def _go_to_bayes_ex2a():
        ui.update_navset("main_tabs", selected="bayes_ex2a")
    @reactive.effect
    @reactive.event(input.go_to_bayes_ex2b)
    def _go_to_bayes_ex2b():
        ui.update_navset("main_tabs", selected="bayes_ex2b")
    @reactive.effect
    @reactive.event(input.go_to_bayes_ex2a_from_ex1)
    def _go_to_bayes_ex2a_from_ex1():
        ui.update_navset("main_tabs", selected="bayes_ex2a")
    @reactive.effect
    @reactive.event(input.go_to_bayes_ex2b_from_ex2a)
    def _go_to_bayes_ex2b_from_ex2a():
        ui.update_navset("main_tabs", selected="bayes_ex2b")
    @reactive.effect
    @reactive.event(input.go_back_bayes_intro)
    def _go_back_bayes_intro():
        ui.update_navset("main_tabs", selected="bayes_intro")
    @reactive.effect
    @reactive.event(input.go_back_bayes_intro_from_ex2a)
    def _go_back_bayes_intro_from_ex2a():
        ui.update_navset("main_tabs", selected="bayes_intro")
    @reactive.effect
    @reactive.event(input.go_back_bayes_ex1_from_ex2a)
    def _go_back_bayes_ex1_from_ex2a():
        ui.update_navset("main_tabs", selected="bayes_ex1")
    @reactive.effect
    @reactive.event(input.go_back_bayes_ex2a_from_ex2b)
    def _go_back_bayes_ex2a_from_ex2b():
        ui.update_navset("main_tabs", selected="bayes_ex2a")
    @reactive.effect
    @reactive.event(input.go_back_bayes_intro_from_ex2b)
    def _go_back_bayes_intro_from_ex2b():
        ui.update_navset("main_tabs", selected="bayes_intro")

    # =======================
    # Exercise 1 state
    # =======================
    game1 = reactive.value(generate_random_game_ex1())
    q1 = reactive.value({"responder": 1, "opp": "Y"})
    show_fb1 = reactive.value(False)
    show_help1 = reactive.value(False)
    show_help2 = reactive.value(False)
    show_help3 = reactive.value(False)
    show_help4 = reactive.value(False)

    def new_question_1():
        responder = random.choice([1, 2])
        opp = random.choice(P2_STRATS_EX1 if responder == 1 else P1_STRATS_EX1)
        q1.set({"responder": responder, "opp": opp})

    new_question_1()

    @reactive.effect
    @reactive.event(input.new_game_1)
    def _new_game_1():
        game1.set(generate_random_game_ex1())
        new_question_1()
        ui.update_radio_buttons("answer_1", selected=None)
        show_fb1.set(False)

    @reactive.effect
    @reactive.event(input.check_1)
    def _check_1():
        show_fb1.set(True)

    @reactive.effect
    @reactive.event(input.help_1)
    def _help_1():
        show_help1.set(not show_help1.get())

    @output
    @render.ui
    def game_table_1():
        lang = current_lang()
        return payoff_table(P1_STRATS_EX1, P2_STRATS_EX1, payoff_strings_from_tuple_payoffs(game1.get()), lang=lang)

    @output
    @render.ui
    def notation_1():
        lang = current_lang()
        return notation_ul(P1_STRATS_EX1, P2_STRATS_EX1, game1.get(), lang=lang)

    @output
    @render.ui
    def question_text_1():
        lang = current_lang()
        q = q1.get()
        responder = q["responder"]
        opp = q["opp"]

        if responder == 1:
            ui.update_radio_buttons("answer_1", choices=all_subset_labels(P1_STRATS_EX1, lang=lang), selected=None)
            return ui.tags.p(
                [tr(lang, "Wenn Spieler 2 ", "If Player 2 plays "), ui.tags.strong(opp),
                 tr(lang, " spielt, welche Strategie(n) ist/sind die beste Antwort(en) für Spieler 1?",
                    ", which strategy(ies) are the best response(s) for Player 1?")],
                class_="mt-2 mb-4",
            )
        else:
            ui.update_radio_buttons("answer_1", choices=all_subset_labels(P2_STRATS_EX1, lang=lang), selected=None)
            return ui.tags.p(
                [tr(lang, "Wenn Spieler 1 ", "If Player 1 plays "), ui.tags.strong(opp),
                 tr(lang, " spielt, welche Strategie(n) ist/sind die beste Antwort(en) für Spieler 2?",
                    ", which strategy(ies) are the best response(s) for Player 2?")],
                class_="mt-2 mb-4",
            )

    @output
    @render.ui
    def help_text_1():
        lang = current_lang()
        if not show_help1.get():
            return ui.tags.div()
        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong(tr(lang, "Ziel: ", "Goal: ")),
                        tr(lang,
                           "Finde alle besten Antworten für den angegebenen Spieler, gegeben die Strategie des anderen Spielers. ",
                           "Find all the best responses for the specified player, given the other player's strategy."),
                        class_="text-muted mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Beste Antwort: ", "Best response: ")),
                            tr(lang,
                               "Eine Strategie ist eine beste Antwort, wenn sie den höchsten eigenen Nutzen liefert, gegeben die Strategie des anderen Spielers.",
                               "A strategy is a best response if it delivers the highest payoff for oneself, given the other player's strategy.")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Vorgehen Spieler 1: ", "Player 1 procedure: ")),
                            tr(lang,
                               "Fixiere die Spalte (Strategie von Spieler 2) und vergleiche die u₁‑Werte "
                               "in dieser Spalte. Markiere alle Zeilen mit dem Maximum.",
                               "Fix the column (Player 2's strategy) and compare the u₁ values in that column. "
                               "Mark all rows with the maximum.")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Vorgehen Spieler 2: ", "Player 2 procedure: ")),
                            tr(lang,
                               "Fixiere die Zeile (Strategie von Spieler 1) und vergleiche die u₂‑Werte "
                               "in dieser Zeile. Markiere alle Spalten mit dem Maximum.",
                               "Fix the row (Player 1's strategy) and compare the u₂ values in that row. "
                               "Mark all columns with the maximum.")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Mehrfach möglich: ", "Multiple possible: ")),
                            tr(lang,
                               "Falls es mehrere Maxima gibt, sind alle entsprechenden Strategien beste Antworten.",
                               "If there are multiple maxima, all corresponding strategies are best responses.")
                        ),
                        class_="text-muted mb-0",
                    ),
                    class_="mt-2",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3 notation-card",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def feedback_1():
        lang = current_lang()
        if not show_fb1.get():
            return ui.tags.div()

        if input.answer_1() is None or input.answer_1() in ("— bitte warten —", "— please wait —", ""):
            return ui.tags.div(tr(lang, "Bitte wähle zuerst eine Antwort aus.", "Please choose an answer first."),
                               class_="alert alert-warning mt-3")

        payoffs = game1.get()
        q = q1.get()
        responder = q["responder"]
        opp = q["opp"]

        correct_set = best_response_set(payoffs, responder, opp)
        correct_label = subset_label(P1_STRATS_EX1 if responder == 1 else P2_STRATS_EX1, correct_set, lang=lang)

        if input.answer_1() == correct_label:
            return ui.tags.div(
                tr(lang,
                   f"✅ Richtig! {correct_label} ist/sind die beste(n) Antwort(en).",
                   f"✅ Correct! {correct_label} is/are the best response(s)."),
                class_="alert alert-success mt-3"
            )
        else:
            return ui.tags.div(
                tr(lang, f"❌ Falsch. Richtig ist: {correct_label}.", f"❌ Incorrect. Correct is: {correct_label}."),
                class_="alert alert-danger mt-3"
            )

    # =======================
    # Exercise 2 state
    # =======================
    game2 = reactive.value(generate_random_game_ex2())
    show_fb2 = reactive.value(False)

    @reactive.effect
    @reactive.event(input.new_game_2)
    def _new_game_2():
        game2.set(generate_random_game_ex2())
        ui.update_radio_buttons("answer_2", selected=None)
        show_fb2.set(False)

    @reactive.effect
    @reactive.event(input.check_2)
    def _check_2():
        show_fb2.set(True)

    @reactive.effect
    @reactive.event(input.help_2)
    def _help_2():
        show_help2.set(not show_help2.get())

    @output
    @render.ui
    def game_table_2():
        lang = current_lang()
        # Update choices when game is shown/updated
        ui.update_radio_buttons("answer_2", choices=dominance_choices(P1_STRATS_EX2, P2_STRATS_EX2, lang=lang), selected=None)
        return payoff_table(P1_STRATS_EX2, P2_STRATS_EX2, payoff_strings_from_tuple_payoffs(game2.get()), lang=lang)

    @output
    @render.ui
    def notation_2():
        lang = current_lang()
        return notation_ul(P1_STRATS_EX2, P2_STRATS_EX2, game2.get(), lang=lang)

    @output
    @render.ui
    def help_text_2():
        lang = current_lang()
        if not show_help2.get():
            return ui.tags.div()
        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong(tr(lang, "Ziel: ", "Goal: ")),
                        tr(lang,
                           "Prüfe, ob es eine strikt dominante Strategie für Spieler 1 oder Spieler 2 gibt.",
                           "Check whether there is a strictly dominant strategy for Player 1 or Player 2."),
                        class_="text-muted mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Strikt dominant: ", "Strictly dominant: ")),
                            tr(lang,
                               "Eine Strategie sᵢ ist strikt dominant, wenn sie gegen jede gegnerische Strategie "
                               "immer einen strikt höheren Nutzen liefert als jede andere eigene Strategie.",
                               "A strategy sᵢ is strictly dominant if against every opponent strategy it always yields a strictly higher payoff than any other own strategy.")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Vorgehen Spieler 1: ", "Player 1 procedure: ")),
                            tr(lang,
                               "Vergleiche zeilenweise die u₁-Werte (A/B/C/D) für jede Spalte (X/Y/Z). "
                               "Eine Strategie (Zeile) ist strikt dominant, wenn sie in jeder Spalte strikt am höchsten ist.",
                               "Compare the u₁ values (A/B/C/D) for each column (X/Y/Z) row by row. A strategy (row) is strictly dominant if it is strictly highest in every column.")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Vorgehen Spieler 2: ", "Player 2 procedure: ")),
                            tr(lang,
                               "Vergleiche spaltenweise die u₂-Werte (X/Y/Z) für jede Zeile (weise (A/B/C/D). "
                               "Eine Strategie (Spalte) ist strikt dominant, wenn sie in jeder Zeile strikt am höchsten.",
                               "Compare the u₂ values (X/Y/Z) for each row (A/B/C/D) column by column. A strategy (column) is strictly dominant if it is strictly highest in each row.")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Antwortauswahl: ", "Answer choice: ")),
                            tr(lang,
                               "Falls ein oder beide Spieler eine strikt dominante Strategie haben, wähle die passende Aussage. Gibt es keine, wähle „Nein, keiner“.",
                               "If one or both players have a strictly dominant strategy, select the appropriate statement. If neither has a strictly dominant strategy, select “No, neither”.")
                        ),
                        class_="text-muted mb-0",
                    ),
                    class_="mt-2",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3 notation-card",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def feedback_2():
        lang = current_lang()
        if not show_fb2.get():
            return ui.tags.div()

        if input.answer_2() is None or input.answer_2() in ("— bitte warten —", "— please wait —", ""):
            return ui.tags.div(tr(lang, "Bitte wähle zuerst eine Antwort aus.", "Please choose an answer first."),
                               class_="alert alert-warning mt-3")

        payoffs = game2.get()
        correct_label, r_dom, c_dom = correct_dominance_label(payoffs, lang=lang)
        expl = dominance_explanation(r_dom, c_dom, lang=lang)

        if input.answer_2() == correct_label:
            return ui.tags.div(
                ui.tags.div(tr(lang, f"✅ Richtig! {correct_label}.", f"✅ Correct! {correct_label}."), class_="fw-semibold"),
                ui.tags.div(expl, class_="mt-2"),
                class_="alert alert-success mt-3",
            )
        else:
            return ui.tags.div(
                ui.tags.div(tr(lang, f"❌ Falsch. Richtig ist: {correct_label}.", f"❌ Incorrect. Correct is: {correct_label}."), class_="fw-semibold"),
                ui.tags.div(expl, class_="mt-2"),
                class_="alert alert-danger mt-3",
            )


    # -------- Navigation Weiter-Buttons --------
    @reactive.effect
    @reactive.event(input.go_to_ex2)
    def _go_to_ex2():
        ui.update_navset("main_tabs", selected="ex2")

    @reactive.effect
    @reactive.event(input.go_back_intro)
    def _go_back_intro():
        ui.update_navset("main_tabs", selected="intro")

    @reactive.effect
    @reactive.event(input.go_back_ex1)
    def _go_back_ex1():
        ui.update_navset("main_tabs", selected="ex1")

    @reactive.effect
    @reactive.event(input.go_back_ex2)
    def _go_back_ex2():
        ui.update_navset("main_tabs", selected="ex2")

    @reactive.effect
    @reactive.event(input.go_back_ex3)
    def _go_back_ex3():
        ui.update_navset("main_tabs", selected="ex3")

    @reactive.effect
    @reactive.event(input.go_to_ex3)
    def _go_to_ex3():
        ui.update_navset("main_tabs", selected="ex3")

    @reactive.effect
    @reactive.event(input.go_to_ex4)
    def _go_to_ex4():
        ui.update_navset("main_tabs", selected="ex4")

    # =======================
    # Exercise 3 state
    # =======================
    game3 = reactive.value(generate_random_game_ex3())
    show_fb3 = reactive.value(False)

    @reactive.effect
    @reactive.event(input.new_game_3)
    def _new_game_3():
        game3.set(generate_random_game_ex3())
        ui.update_radio_buttons("answer_3", selected=None)
        show_fb3.set(False)

    @reactive.effect
    @reactive.event(input.check_3)
    def _check_3():
        show_fb3.set(True)

    @reactive.effect
    @reactive.event(input.help_3)
    def _help_3():
        show_help3.set(not show_help3.get())

    @output
    @render.ui
    def game_table_3():
        lang = current_lang()
        # Aktualisiere die Auswahlmöglichkeiten für die Antwort, wenn ein neues Spiel geladen wird
        ui.update_radio_buttons("answer_3",
            choices=dominance_choices(P1_STRATS_EX2, P2_STRATS_EX2, lang=lang),
            selected=None
        )
        return payoff_table(P1_STRATS_EX2, P2_STRATS_EX2,
                             payoff_strings_from_tuple_payoffs(game3.get()), lang=lang)

    @output
    @render.ui
    def notation_3():
        lang = current_lang()
        return notation_ul(P1_STRATS_EX2, P2_STRATS_EX2, game3.get(), lang=lang)

    @output
    @render.ui
    def help_text_3():
        lang = current_lang()
        if not show_help3.get():
            return ui.tags.div()

        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong(tr(lang, "Ziel: ", "Goal: ")),
                        tr(lang,
                           "Prüfe, ob ein Spieler eine dominante Strategie hat (strikt oder schwach).",
                           "Check whether a player has a dominant strategy (strict or weak)."),
                        class_="text-muted mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Strikt dominant: ", "Strictly dominant: ")),
                            tr(lang,
                               "Eine Strategie sᵢ ist strikt dominant, wenn sie gegen jede gegnerische Strategie "
                               "immer einen strikt höheren Nutzen liefert als jede andere eigene Strategie.",
                               "A strategy sᵢ is strictly dominant if against every opponent strategy it always yields a strictly higher payoff than any other own strategy.")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Schwach dominant: ", "Weakly dominant: ")),
                            tr(lang,
                               "Eine Strategie sᵢ ist schwach dominant, wenn sie gegen jede gegnerische Strategie "
                               "mindestens so gut ist wie jede andere eigene Strategie, und gegen mindestens eine gegnerische Strategie "
                               "echt besser als jede Alternative.",
                               "A strategy sᵢ is weakly dominant if against every opponent strategy it is at least as good as any other own strategy, and strictly better against at least one opponent strategy.")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Vorgehen: ", "Procedure: ")),
                            tr(lang,
                               "Vergleiche für Spieler 1 zeilenweise die u₁-Werte (A/B/C/D) für jede Spalte (X/Y/Z). "
                               "Für Spieler 2 vergleichst du spaltenweise die u₂-Werte für jede Zeile.",
                               "For player 1, compare the u₁ values (A/B/C/D) for each column (X/Y/Z) row by row. For player 2, compare the u₂ values for each row column by column.")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Wichtig: ", "Important: ")),
                            tr(lang,
                               "Pro Spieler kann es höchstens eine dominante Strategie geben.",
                               "Each player can have at most one dominant strategy.")
                        ),
                        class_="text-muted mb-0",
                    ),
                    class_="mt-2",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3 notation-card",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def feedback_3():
        lang = current_lang()
        if not show_fb3.get():
            return ui.tags.div()  # noch kein Feedback anzeigen

        if input.answer_3() is None or input.answer_3() in ("— bitte warten —", "— please wait —", ""):
            # Keine Antwort ausgewählt
            return ui.tags.div(tr(lang, "Bitte wähle zuerst eine Antwort aus.", "Please choose an answer first."),
                               class_="alert alert-warning mt-3")

        payoffs = game3.get()
        correct_label, r_dom, r_type, c_dom, c_type = correct_dominance_label_weak(payoffs, lang=lang)
        explanation = dominance_explanation_weak(r_dom, r_type, c_dom, c_type, lang=lang)

        if input.answer_3() == correct_label:
            # Richtige Antwort gewählt
            return ui.tags.div(
                ui.tags.div(tr(lang, f"✅ Richtig! {correct_label}.", f"✅ Correct! {correct_label}."), class_="fw-semibold"),
                ui.tags.div(explanation, class_="mt-2"),
                class_="alert alert-success mt-3"
            )
        else:
            # Falsche Antwort -> richtige Lösung und Erklärung anzeigen
            return ui.tags.div(
                ui.tags.div(tr(lang, f"❌ Falsch. Richtig ist: {correct_label}.", f"❌ Incorrect. Correct is: {correct_label}."), class_="fw-semibold"),
                ui.tags.div(explanation, class_="mt-2"),
                class_="alert alert-danger mt-3"
            )

    # =======================
    # Exercise 4 state
    # =======================
    game4 = reactive.value(generate_random_game_ex4())
    show_fb4 = reactive.value(False)

    @reactive.effect
    @reactive.event(input.new_game_4)
    def _new_game_4():
        game4.set(generate_random_game_ex4())
        ui.update_checkbox_group("answer_4", selected=None)
        show_fb4.set(False)

    @reactive.effect
    @reactive.event(input.check_4)
    def _check_4():
        show_fb4.set(True)

    @reactive.effect
    @reactive.event(input.help_4)
    def _help_4():
        show_help4.set(not show_help4.get())

    @output
    @render.ui
    def game_table_4():
        lang = current_lang()
        # (Optionale Wahl: Auswahl zurücksetzen/aktualisieren - hier statisch, daher nicht zwingend)
        ui.update_checkbox_group("answer_4",
            choices=[f"({r},{c})" for r in P1_STRATS_EX2 for c in P2_STRATS_EX2],
            selected=None
        )
        return payoff_table(P1_STRATS_EX2, P2_STRATS_EX2,
                             payoff_strings_from_tuple_payoffs(game4.get()), lang=lang)

    @output
    @render.ui
    def notation_4():
        lang = current_lang()
        return notation_ul(P1_STRATS_EX2, P2_STRATS_EX2, game4.get(), lang=lang)

    @output
    @render.ui
    def help_text_4():
        lang = current_lang()
        if not show_help4.get():
            return ui.tags.div()

        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong(tr(lang, "Definition: ", "Definition: ")),
                        tr(lang,
                           "Eine Strategiekombination (r, c) ist ein Nash-Gleichgewicht in reinen Strategien, "
                            "wenn keiner der Spieler sich durch einseitiges Abweichen strikt verbessern kann.",
                           "A strategy combination (r, c) is a Nash equilibrium in pure strategies if none of the players can strictly improve their payoff by deviating unilaterally."),
                        class_="text-muted mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Beste Antwort Spieler 1: ", "Best response Player 1: ")),
                            tr(lang,
                               "Für eine feste Spalte c (Strategie von Spieler 2) ist eine Zeile r eine beste Antwort, "
                               "wenn u₁(r,c) maximal über alle Zeilen ist.",
                               "For a fixed column c (Player 2's strategy), a row r is a best response if u₁(r,c) is maximal across all rows.")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Beste Antwort Spieler 2: ", "Best response Player 2: ")),
                            tr(lang,
                               "Für eine feste Zeile r (Strategie von Spieler 1) ist eine Spalte c eine beste Antwort, "
                               "wenn u₂(r,c) maximal über alle Spalten ist.",
                               "For a fixed row r (Player 1's strategy), a column c is a best response if u₂(r,c) is maximal across all columns.")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Nash-Kriterium: ", "Nash criterion: ")),
                            tr(lang,
                               "(r,c) ist Nash-GG ⇔ r ist beste Antwort auf c UND c ist beste Antwort auf r.",
                               "(r,c) is Nash-EQ ⇔ r is a best response to c AND c is a best response to r.")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Praktischer Tipp: ", "Practical tip: ")),
                            tr(lang,
                               "Markiere zuerst alle besten Antworten von Spieler 1 pro Spalte, dann alle besten Antworten von Spieler 2 pro Zeile. "
                               "Schnittpunkte sind Nash-Gleichgewichte.",
                               "First mark all of Player 1's best responses per column, then all of Player 2's best responses per row. "
                               "Intersections are Nash equilibria.")
                        ),
                        class_="text-muted mb-0",
                    ),
                    class_="mt-2",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3 notation-card",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def feedback_4():
        lang = current_lang()
        if not show_fb4.get():
            return ui.tags.div()

        # Auswahl der Checkboxen (Liste der angekreuzten Kombinationen)
        chosen = set(input.answer_4() or [])
        payoffs = game4.get()
        actual_ne = find_nash_equilibria(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)
        actual_set = {f"({r},{c})" for (r, c) in actual_ne}

        # Bestimme Text für die korrekte Lösung:
        if len(actual_set) == 0:
            correct_text = tr(lang, "Es gibt kein Nash-Gleichgewicht in reinen Strategien",
                              "There is no Nash equilibrium in pure strategies")
        elif len(actual_set) == 1:
            combo = list(actual_set)[0]
            correct_text = tr(lang,
                              f"{combo} ist ein Nash-Gleichgewicht in reinen Strategien",
                              f"{combo} is a Nash equilibrium in pure strategies")
        else:
            # mehrere Gleichgewichte
            combos = sorted(list(actual_set))
            # Verbinde die Kombinationsliste mit Kommas und "und"
            if len(combos) == 2:
                correct_text = tr(lang,
                                  f"{combos[0]} und {combos[1]} sind Nash-Gleichgewichte in reinen Strategien",
                                  f"{combos[0]} and {combos[1]} are Nash equilibria in pure strategies")
            else:
                correct_text = tr(
                    lang,
                    (", ".join(combos[:-1]) + " und " + combos[-1] +
                     " sind Nash-Gleichgewichte in reinen Strategien"),
                    (", ".join(combos[:-1]) + " and " + combos[-1] +
                     " are Nash equilibria in pure strategies")
                )

        # Feedback je nach Richtigkeit der Auswahl:
        if chosen == actual_set:
            # Alle richtigen und keine falschen ausgewählt
            expl = ""
            if len(actual_set) >= 1:
                expl = tr(lang,
                          "Bei jeder anderen Strategiekombination kann sich mindestens einer der Spieler durch einseitiges Abweichen strikt verbessern.",
                          "For any other strategy combination, at least one player can strictly improve by unilateral deviation.")
            else:
                expl = tr(lang,
                          "Bei jeder Strategiekombination kann sich mindestens ein Spieler strikt verbessern.",
                          "For any strategy combination, at least one player can strictly improve.")
            return ui.tags.div(
                ui.tags.div(tr(lang, f"✅ Richtig! {correct_text}.", f"✅ Correct! {correct_text}."), class_="fw-semibold"),
                ui.tags.div(expl, class_="mt-2"),
                class_="alert alert-success mt-3"
            )
        else:
            # Falsche oder unvollständige Auswahl
            expl = ""
            if len(actual_set) >= 1:
                expl = tr(lang,
                          "Bei jeder anderen Strategiekombination kann sich mindestens einer der Spieler durch einseitiges Abweichen strikt verbessern.",
                          "For any other strategy combination, at least one player can strictly improve by unilateral deviation.")
            else:
                expl = tr(lang,
                          "Bei jeder Strategiekombination kann sich mindestens ein Spieler strikt verbessern.",
                          "For any strategy combination, at least one player can strictly improve.")
            # Hinweis: "Richtig ist/sind" je nach Anzahl:
            richtig_prefix = tr(lang, "Richtig sind: " if len(actual_set) > 1 else "Richtig ist: ",
                                "Correct are: " if len(actual_set) > 1 else "Correct is: ")
            return ui.tags.div(
                ui.tags.div(tr(lang, f"❌ Falsch. {richtig_prefix}{correct_text}.",
                               f"❌ Incorrect. {richtig_prefix}{correct_text}."), class_="fw-semibold"),
                ui.tags.div(expl, class_="mt-2"),
                class_="alert alert-danger mt-3"
            )
    # =======================
    # Exercise 5 state
    # =======================
    game5 = reactive.Value(generate_random_game_ex4())
    show_fb5 = reactive.Value(False)
    show_help5 = reactive.Value(False)

    @reactive.effect
    @reactive.event(input.new_game_5)
    def _new_game_5():
        game5.set(generate_random_game_ex4())
        for r in P1_STRATS_EX2:
            for c in P2_STRATS_EX2:
                ui.update_radio_buttons(f"ex5_{r}_{c}", selected="no")
        show_fb5.set(False)

    @reactive.effect
    @reactive.event(input.check_5)
    def _check_5():
        show_fb5.set(True)

    @reactive.effect
    @reactive.event(input.help_5)
    def _help_5():
        show_help5.set(not show_help5.get())

    @output
    @render.ui
    def game_table_5():
        lang = current_lang()
        return payoff_table(P1_STRATS_EX2, P2_STRATS_EX2, payoff_strings_from_tuple_payoffs(game5.get()), lang=lang)

    @output
    @render.ui
    def notation_5():
        lang = current_lang()
        return notation_ul(P1_STRATS_EX2, P2_STRATS_EX2, game5.get(), lang=lang)

    @output
    @render.ui
    def help_text_5():
        lang = current_lang()
        if not show_help5.get():
            return ui.tags.div()

        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong(tr(lang, "Ziel: ", "Goal: ")),
                        tr(lang,
                           "Für jede Strategiekombination (r,c) entscheide: nein / ja, nicht strikt / ja, strikt.",
                           "For each strategy combination (r,c), decide: no / yes, not strict / yes, strict."),
                        class_="text-muted mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Nash-GG (nicht strikt): ", "Nash-EQ (not strict): ")),
                            tr(lang,
                               "(r,c) ist Nash-GG, wenn kein Spieler durch einseitiges Abweichen einen strikt höheren Nutzen bekommt. "
                               "Es dürfen auch andere Strategien gleich gut sein (Indifferenz).",
                               "(r,c) is Nash-EQ if no player can get a strictly higher payoff by unilateral deviation. "
                               "Other strategies may be equally good (indifference).")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Striktes Nash-GG: ", "Strict Nash-EQ: ")),
                            tr(lang,
                               "(r,c) ist striktes Nash-GG, wenn beide Spieler dort eine strikt beste Antwort spielen, die beste Anwort also eindeutig ist (ohne Indifferenz).",
                               "(r,c) is a strict Nash-EQ if both players play a strictly best response there, i.e. the best response is unambiguous (without indifference).")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "So prüfst du Spieler 1: ", "Check Player 1: ")),
                            tr(lang,
                               "Fixiere c. Vergleiche u₁(·,c). "
                               "Nash braucht: u₁(r,c) ist maximal. Strikt Nash braucht: u₁(r,c) ist strikt größer als alle anderen.",
                               "Fix c. Compare u₁(·,c). Nash requires: u₁(r,c) is maximal. Strict Nash requires: u₁(r,c) is strictly greater than all others.")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "So prüfst du Spieler 2: ", "Check Player 2: ")),
                            tr(lang,
                               "Fixiere r. Vergleiche u₂(r,·). "
                               "Nash braucht: u₂(r,c) ist maximal. Strikt Nash braucht: u₂(r,c) ist strikt größer als alle anderen.",
                               "Fix r. Compare u₂(r,·). Nash requires: u₂(r,c) is maximal. Strict Nash requires: u₂(r,c) is strictly greater than all others.")
                        ),
                        class_="text-muted mb-0",
                    ),
                    class_="mt-2",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3 notation-card",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def ex5_matrix():
        lang = current_lang()
        return ex5_matrix_ui(P1_STRATS_EX2, P2_STRATS_EX2, lang=lang)

    @output
    @render.ui
    def feedback_5():
        lang = current_lang()
        if not show_fb5.get():
            return ui.tags.div()
        payoffs = game5.get()
        actual_ne = find_nash_equilibria(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)
        strict_set = set()
        for (r, c) in actual_ne:
            if all(payoffs[(r, c)][0] > payoffs[(r2, c)][0] for r2 in P1_STRATS_EX2 if r2 != r) and \
               all(payoffs[(r, c)][1] > payoffs[(r, c2)][1] for c2 in P2_STRATS_EX2 if c2 != c):
                strict_set.add((r, c))

        expected = {}
        for r in P1_STRATS_EX2:
            for c in P2_STRATS_EX2:
                if (r, c) in strict_set:
                    expected[(r, c)] = "yes_strict"
                elif (r, c) in actual_ne:
                    expected[(r, c)] = "yes_not_strict"
                else:
                    expected[(r, c)] = "no"

        missing = 0
        wrong = 0
        for r in P1_STRATS_EX2:
            for c in P2_STRATS_EX2:
                val = getattr(input, f"ex5_{r}_{c}")()
                if val is None or val == "":
                    missing += 1
                elif val != expected[(r, c)]:
                    wrong += 1

        if missing > 0:
            return ui.tags.div(
                tr(lang,
                   f"Bitte beantworte alle Felder. Fehlend: {missing}.",
                   f"Please answer all fields. Missing: {missing}."),
                class_="alert alert-warning mt-3",
            )
        if wrong == 0:
            return ui.tags.div(
                tr(lang, "✅ Richtig! Alle Felder sind korrekt.", "✅ Correct! All fields are correct."),
                class_="alert alert-success mt-3",
            )
        def best_responses_p1(col):
            vals = {r: payoffs[(r, col)][0] for r in P1_STRATS_EX2}
            m = max(vals.values())
            return [r for r, v in vals.items() if v == m], m

        def best_responses_p2(row):
            vals = {c: payoffs[(row, c)][1] for c in P2_STRATS_EX2}
            m = max(vals.values())
            return [c for c, v in vals.items() if v == m], m

        def fmt_list(items):
            return ", ".join(items)

        details = []
        for r in P1_STRATS_EX2:
            for c in P2_STRATS_EX2:
                val = getattr(input, f"ex5_{r}_{c}")()
                if val is None or val == "" or val == expected[(r, c)]:
                    continue
                br1, max_u1 = best_responses_p1(c)
                br2, max_u2 = best_responses_p2(r)
                u1, u2 = payoffs[(r, c)]
                cell = f"({r},{c})"

                if expected[(r, c)] == "no":
                    reasons = []
                    if r not in br1:
                        reasons.append(
                            tr(
                                lang,
                                f"Spieler 1 kann in Spalte {c} zu {fmt_list(br1)} abweichen (u1={u1} < {max_u1}).",
                                f"Player 1 can deviate in column {c} to {fmt_list(br1)} (u1={u1} < {max_u1}).",
                            )
                        )
                    if c not in br2:
                        reasons.append(
                            tr(
                                lang,
                                f"Spieler 2 kann in Zeile {r} zu {fmt_list(br2)} abweichen (u2={u2} < {max_u2}).",
                                f"Player 2 can deviate in row {r} to {fmt_list(br2)} (u2={u2} < {max_u2}).",
                            )
                        )
                    if not reasons:
                        reasons.append(tr(lang, "Kein Nash-Gleichgewicht.", "Not a Nash equilibrium."))
                    details.append(
                        ui.tags.li(
                            ui.tags.strong(cell + ": "),
                            " ".join(reasons),
                        )
                    )
                    continue

                if expected[(r, c)] == "yes_not_strict":
                    if val == "no":
                        reasons = [
                            tr(
                                lang,
                                f"Beide spielen eine beste Antwort (S1 in Spalte {c}: {fmt_list(br1)}, S2 in Zeile {r}: {fmt_list(br2)}).",
                                f"Both play a best response (P1 in column {c}: {fmt_list(br1)}, P2 in row {r}: {fmt_list(br2)}).",
                            )
                        ]
                    else:
                        tie_reasons = []
                        if len(br1) > 1:
                            tie_reasons.append(
                                tr(
                                    lang,
                                    f"S1 hat Gleichstand in Spalte {c} ({fmt_list(br1)}).",
                                    f"P1 has a tie in column {c} ({fmt_list(br1)}).",
                                )
                            )
                        if len(br2) > 1:
                            tie_reasons.append(
                                tr(
                                    lang,
                                    f"S2 hat Gleichstand in Zeile {r} ({fmt_list(br2)}).",
                                    f"P2 has a tie in row {r} ({fmt_list(br2)}).",
                                )
                            )
                        reasons = tie_reasons or [tr(lang, "Nicht strikt Nash.", "Not strict Nash.")]
                    details.append(
                        ui.tags.li(
                            ui.tags.strong(cell + ": "),
                            " ".join(reasons),
                        )
                    )
                    continue

                if expected[(r, c)] == "yes_strict":
                    reasons = [
                        tr(
                            lang,
                            f"Strikt: S1 eindeutig beste Antwort in Spalte {c} ({r}), S2 eindeutig beste Antwort in Zeile {r} ({c}).",
                            f"Strict: P1 uniquely best responds in column {c} ({r}), P2 uniquely best responds in row {r} ({c}).",
                        )
                    ]
                    details.append(
                        ui.tags.li(
                            ui.tags.strong(cell + ": "),
                            " ".join(reasons),
                        )
                    )

        return ui.tags.div(
            ui.tags.div(
                tr(
                    lang,
                    f"❌ Falsch. Falsche Antworten: {wrong}.",
                    f"❌ Incorrect. Wrong answers: {wrong}.",
                ),
                class_="fw-semibold",
            ),
            ui.tags.ul(*details, class_="mt-2 mb-0"),
            class_="alert alert-danger mt-3",
        )

    # =======================
    # Exercise 6 state
    # =======================
    game6 = reactive.Value(generate_random_game_ex6())
    show_fb6 = reactive.Value(False)
    show_help6 = reactive.Value(False)

    @reactive.effect
    @reactive.event(input.new_game_6)
    def _new_game_6():
        game6.set(generate_random_game_ex6())
        ui.update_radio_buttons("answer_6", selected=None)
        show_fb6.set(False)

    @reactive.effect
    @reactive.event(input.check_6)
    def _check_6():
        show_fb6.set(True)

    @reactive.effect
    @reactive.event(input.help_6)
    def _help_6():
        show_help6.set(not show_help6.get())

    @output
    @render.ui
    def game_table_6():
        lang = current_lang()
        return payoff_table(P1_STRATS_EX6, P2_STRATS_EX6, payoff_strings_from_tuple_payoffs(game6.get()), lang=lang)

    @output
    @render.ui
    def notation_6():
        lang = current_lang()
        return notation_ul(P1_STRATS_EX6, P2_STRATS_EX6, game6.get(), lang=lang)

    @output
    @render.ui
    def help_text_6():
        lang = current_lang()
        if not show_help6.get():
            return ui.tags.div()

        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong(tr(lang, "Idee: ", "Idea: ")),
                        tr(lang,
                           "In einem gemischten Nash-Gleichgewicht wählt Spieler 1 A mit Wahrscheinlichkeit p, "
                           "sodass Spieler 2 zwischen X und Y indifferent ist.",
                           "In a mixed Nash equilibrium, Player 1 plays A with probability p so that Player 2 is indifferent between X and Y."),
                        class_="text-muted mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Indifferenzbedingung (für Spieler 2): ", "Indifference condition (for Player 2): ")),
                            tr(lang,
                               "Erwarteter Nutzen aus X = Erwarteter Nutzen aus Y.",
                               "Expected payoff from X = expected payoff from Y.")
                        ),
                        ui.tags.li(
                            ui.tags.code("p·u₂(A,X) + (1−p)·u₂(B,X) = p·u₂(A,Y) + (1−p)·u₂(B,Y)")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Löse nach p: ", "Solve for p: ")),
                            tr(lang,
                               "Bringe alle p-Terme auf eine Seite und forme zu p = Zähler / Nenner um.",
                               "Move all p terms to one side and rearrange to p = numerator / denominator.")
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Warum das funktioniert: ", "Why this works: ")),
                            tr(lang,
                               "Nur wenn Spieler 2 indifferent ist, ist es für ihn optimal zu mischen. Ob er indifferent ist, hängt von der Mischung von Spieler 1 ab. Wenn Spieler 1 p so wählt,  dass Spieler 2 indifferent ist, hat Spieler 2 keinen (strikten) Anreiz, auf eine reine Strategie zu wechseln.",
                               "Only if Player 2 is indifferent is it optimal for him to mix. Whether he is indifferent depends on Player 1's mix. If Player 1 chooses p such that Player 2 is indifferent, Player 2 has no (strict) incentive to switch to a pure strategy.")
                        ),
                        class_="text-muted mb-0",
                    ),
                    class_="mt-2",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3 notation-card",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def feedback_6():
        lang = current_lang()
        if not show_fb6.get():
            return ui.tags.div()
        if input.answer_6() is None or input.answer_6() == "":
            return ui.tags.div(
                tr(lang, "Bitte wähle zuerst eine Antwort aus.", "Please choose an answer first."),
                class_="alert alert-warning mt-3"
            )
        payoffs = game6.get()
        a = payoffs[("A", "X")][1] - payoffs[("A", "Y")][1]
        b = payoffs[("B", "Y")][1] - payoffs[("B", "X")][1]
        if a + b == 0:
            return ui.tags.div(tr(lang, "Keine eindeutige Lösung für p.", "No unique solution for p."),
                               class_="alert alert-warning mt-3")
        
        from math import gcd
        num = b
        den = a + b
        # 1) Kürzen immer mit positiven Werten
        g = gcd(abs(num), abs(den))
        num //= g
        den //= g
        # 2) Vorzeichen normalisieren: Nenner immer positiv
        if den < 0:
            num *= -1
            den *= -1
        correct_frac = f"{num}/{den}"
        expl = tr(lang, "Damit ist Spieler 2 indifferent zwischen X und Y.",
                  "This makes Player 2 indifferent between X and Y.")
        if input.answer_6() == correct_frac:
            return ui.tags.div(
                tr(lang,
                   f"✅ Richtig! p = {correct_frac}. Damit ist Spieler 2 indifferent zwischen X und Y.",
                   f"✅ Correct! p = {correct_frac}. This makes Player 2 indifferent between X and Y."),
                class_="alert alert-success mt-3"
            )
        else:
            return ui.tags.div(
                tr(lang, f"❌ Falsch. Richtig ist: p = {correct_frac}.", f"❌ Incorrect. Correct is: p = {correct_frac}."),
                class_="alert alert-danger mt-3"
            )

    # =======================
    # Part 3 Exercise 1 state
    # =======================
    game_t3_ex1 = reactive.value(generate_random_game_t3_ex1())
    show_fb_t3_ex1 = reactive.value(False)
    show_help_t3_ex1 = reactive.value(False)

    @reactive.effect
    @reactive.event(input.new_game_t3_ex1)
    def _new_game_t3_ex1():
        game_t3_ex1.set(generate_random_game_t3_ex1())
        ui.update_radio_buttons("answer_t3_ex1", selected=None)
        show_fb_t3_ex1.set(False)
        show_help_t3_ex1.set(False)

    @reactive.effect
    @reactive.event(input.check_t3_ex1)
    def _check_t3_ex1():
        show_fb_t3_ex1.set(True)

    @reactive.effect
    @reactive.event(input.help_t3_ex1)
    def _help_t3_ex1():
        show_help_t3_ex1.set(not show_help_t3_ex1.get())

    @output
    @render.ui
    def game_table_t3_ex1():
        lang = current_lang()
        state = game_t3_ex1.get()
        return payoff_table(
            P1_STRATS_T3_EX1,
            P2_STRATS_T3_EX1,
            payoff_strings_from_tuple_payoffs(state["payoffs"]),
            lang=lang,
            row_player_label=tr(lang, "Firma 1", "Firm 1"),
            col_player_label=tr(lang, "Firma 2", "Firm 2"),
        )

    @output
    @render.ui
    def notation_t3_ex1():
        lang = current_lang()
        state = game_t3_ex1.get()
        a = state["a"]
        return ui.tags.ul(
            ui.tags.li(ui.tags.code("S₁ = {XY, XZ, YZ}")),
            ui.tags.li(ui.tags.code("S₂ = {X, Y, Z}")),
            ui.tags.li(ui.tags.code(f"a = {a}")),
            ui.tags.li(
                ui.tags.div(
                    tr(lang, "Vollständig gemischtes GG gesucht:", "Target fully mixed equilibrium:"),
                    class_="fw-semibold",
                ),
                ui.tags.code("((pXY, pXZ, pYZ), (qX, qY, qZ))"),
                ),
            class_="mb-0",
        )

    @output
    @render.ui
    def question_t3_ex1():
        lang = current_lang()
        a = game_t3_ex1.get()["a"]
        return ui.tags.p(
            tr(
                lang,
                f"Parameterwert: a = {a}. Welche der folgenden Strategiekombinationen ist das vollständig gemischte Nash-Gleichgewicht?",
                f"Parameter value: a = {a}. Which of the following strategy profiles is the fully mixed Nash equilibrium?",
            ),
            class_="mt-2 mb-4",
        )

    @output
    @render.ui
    def help_text_t3_ex1():
        lang = current_lang()
        if not show_help_t3_ex1.get():
            return ui.tags.div()

        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong(tr(lang, "Hinweis: ", "Hint: ")),
                        tr(
                            lang,
                            "Das vollständig gemischte Gleichgewicht hängt nur vom Parameter a ab.",
                            "The fully mixed equilibrium depends only on the parameter a.",
                        ),
                        class_="text-muted mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li(
                            tr(
                                lang,
                                "Bestimme zuerst a aus der Aufgabe bzw. der Tabelle.",
                                "First identify a from the task text or payoff table.",
                            )
                        ),
                        ui.tags.li(
                            tr(
                                lang,
                                "Für ein vollständig gemischtes Gleichgewicht muss Firma 1 zwischen XY, XZ und YZ indifferent sein. "
                                "Mit den gegebenen Payoffs (9 ohne Überschneidung, 6 mit Überschneidung) gilt das nur, wenn Firma 2 "
                                "alle drei Märkte gleich wahrscheinlich wählt.",
                                "In a fully mixed equilibrium, Firm 1 must be indifferent between XY, XZ, and YZ. "
                                "With the given payoffs (9 without overlap, 6 with overlap), this is only possible if Firm 2 "
                                "chooses all three markets with equal probability.",
                            )
                        ),
                        ui.tags.li(
                            tr(
                                lang,
                                "Daher musst du nur die Antwortoptionen prüfen, in denen Firma 2 mit (1/3, 1/3, 1/3) mischt.",
                                "Therefore, you only need to check options where Firm 2 mixes with (1/3, 1/3, 1/3).",
                            )
                        ),
                        ui.tags.li(
                            tr(
                                lang,
                                "Für a = 1, 3 oder 4 ergibt sich jeweils genau eine passende Mischung von Firma 1.",
                                "For a = 1, 3, or 4, there is exactly one matching mix for Firm 1.",
                            )
                        ),
                        class_="text-muted mb-0",
                    ),
                    class_="mt-2",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3 notation-card",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def feedback_t3_ex1():
        lang = current_lang()
        if not show_fb_t3_ex1.get():
            return ui.tags.div()
        if input.answer_t3_ex1() is None or input.answer_t3_ex1() == "":
            return ui.tags.div(
                tr(lang, "Bitte wähle zuerst eine Antwort aus.", "Please choose an answer first."),
                class_="alert alert-warning mt-3",
            )

        a = game_t3_ex1.get()["a"]
        correct_by_a = {1: "opt2", 3: "opt5", 4: "opt7"}
        correct_key = correct_by_a[a]
        correct_text = T3_EX1_OPTION_TEXT[correct_key]

        if input.answer_t3_ex1() == correct_key:
            return ui.tags.div(
                tr(
                    lang,
                    f"✅ Richtig! Für a = {a} gilt als vollständig gemischtes Nash-Gleichgewicht: {correct_text}.",
                    f"✅ Correct! For a = {a}, the fully mixed Nash equilibrium is: {correct_text}.",
                ),
                class_="alert alert-success mt-3",
            )

        return ui.tags.div(
            tr(
                lang,
                f"❌ Falsch. Für a = {a} ist korrekt: {correct_text}.",
                f"❌ Incorrect. For a = {a}, the correct answer is: {correct_text}.",
            ),
            class_="alert alert-danger mt-3",
        )

    # =======================
    # Part 2 Exercise 1 state
    # =======================
    game_t2_1 = reactive.value(generate_random_game_t2_ex1())
    show_fb_t2_1 = reactive.value(False)
    show_help_t2_1 = reactive.value(False)

    @reactive.effect
    @reactive.event(input.new_game_t2_1)
    def _new_game_t2_1():
        game_t2_1.set(generate_random_game_t2_ex1())
        ui.update_checkbox_group("answer_t2_1", selected=[])
        show_fb_t2_1.set(False)

    @reactive.effect
    @reactive.event(input.check_t2_1)
    def _check_t2_1():
        show_fb_t2_1.set(True)

    @reactive.effect
    @reactive.event(input.help_t2_1)
    def _help_t2_1():
        show_help_t2_1.set(not show_help_t2_1.get())

    @output
    @render.ui
    def game_table_t2_1():
        lang = current_lang()
        ui.update_checkbox_group(
            "answer_t2_1",
            choices=t2_ex1_choices(lang=lang),
            selected=[],
        )
        return payoff_table(
            P1_STRATS_T2_EX1,
            P2_STRATS_T2_EX1,
            payoff_strings_from_tuple_payoffs(game_t2_1.get()),
            lang=lang,
        )

    @output
    @render.ui
    def notation_t2_1():
        lang = current_lang()
        return notation_ul(P1_STRATS_T2_EX1, P2_STRATS_T2_EX1, game_t2_1.get(), lang=lang)

    @output
    @render.ui
    def help_text_t2_1():
        lang = current_lang()
        if not show_help_t2_1.get():
            return ui.tags.div()
        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong(tr(lang, "Ziel: ", "Goal: ")),
                        tr(
                            lang,
                            "Finde alle reinen Nash-Gleichgewichte, in denen beide gewählten Strategien nicht schwach dominiert sind.",
                            "Find all pure Nash equilibria where both played strategies are not weakly dominated.",
                        ),
                        class_="text-muted mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Schritt 1 (Nash): ", "Step 1 (Nash): ")),
                            tr(
                                lang,
                                "Bestimme alle reinen Nash-Gleichgewichte als wechselseitige beste Antworten.",
                                "Find all pure Nash equilibria as mutual best responses.",
                            ),
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Schritt 2 (Dominanz): ", "Step 2 (Dominance): ")),
                            tr(
                                lang,
                                "Markiere schwach dominierte Strategien (strikte Dominanz ist darin enthalten).",
                                "Mark weakly dominated strategies (strict dominance is included).",
                            ),
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Schritt 3 (THP): ", "Step 3 (THP): ")),
                            tr(
                                lang,
                                "Behalte nur Nash-Gleichgewichte, bei denen weder die Zeile noch die Spalte schwach dominiert ist.",
                                "Keep only Nash equilibria where neither the row nor the column is weakly dominated.",
                            ),
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Hinweis: ", "Hint: ")),
                            tr(
                                lang,
                                "Mehrere Antworten können korrekt sein; falls keine übrig bleibt, wähle „Keines“.",
                                "Multiple answers can be correct; if none remain, choose “None”.",
                            ),
                        ),
                        class_="text-muted mb-0",
                    ),
                    class_="mt-2",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3 notation-card",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def feedback_t2_1():
        lang = current_lang()
        if not show_fb_t2_1.get():
            return ui.tags.div()

        chosen = set(input.answer_t2_1() or [])
        if not chosen:
            return ui.tags.div(
                tr(lang, "Bitte wähle mindestens eine Antwort aus.", "Please choose at least one answer."),
                class_="alert alert-warning mt-3",
            )

        payoffs = game_t2_1.get()
        correct_set = t2_ex1_correct_choice_set(payoffs, lang=lang)
        none_label = tr(lang, "Keines", "None")

        ne = find_nash_equilibria(payoffs, P1_STRATS_T2_EX1, P2_STRATS_T2_EX1)
        thp = trembling_hand_perfect_pure_equilibria(payoffs, P1_STRATS_T2_EX1, P2_STRATS_T2_EX1)
        dom_rows = sorted(weakly_dominated_rows(payoffs, P1_STRATS_T2_EX1, P2_STRATS_T2_EX1))
        dom_cols = sorted(weakly_dominated_cols(payoffs, P1_STRATS_T2_EX1, P2_STRATS_T2_EX1))

        def fmt_combos(combo_list):
            labels = [f"({r},{c})" for (r, c) in combo_list]
            if not labels:
                return none_label
            return ", ".join(labels)

        correct_text = none_label if correct_set == {none_label} else ", ".join(sorted(correct_set))
        details = tr(
            lang,
            f"Nash-GG: {fmt_combos(ne)}. Schwach dominierte Zeilen: {', '.join(dom_rows) if dom_rows else 'keine'}. "
            f"Schwach dominierte Spalten: {', '.join(dom_cols) if dom_cols else 'keine'}. "
            f"THP (rein): {fmt_combos(thp)}.",
            f"Nash equilibria: {fmt_combos(ne)}. Weakly dominated rows: {', '.join(dom_rows) if dom_rows else 'none'}. "
            f"Weakly dominated columns: {', '.join(dom_cols) if dom_cols else 'none'}. "
            f"THP (pure): {fmt_combos(thp)}.",
        )

        if chosen == correct_set:
            return ui.tags.div(
                ui.tags.div(tr(lang, "✅ Richtig!", "✅ Correct!"), class_="fw-semibold"),
                ui.tags.div(details, class_="mt-2"),
                class_="alert alert-success mt-3",
            )
        return ui.tags.div(
            ui.tags.div(
                tr(
                    lang,
                    f"❌ Falsch. Richtig ist: {correct_text}.",
                    f"❌ Incorrect. Correct is: {correct_text}.",
                ),
                class_="fw-semibold",
            ),
            ui.tags.div(details, class_="mt-2"),
            class_="alert alert-danger mt-3",
        )

    # =======================
    # Part 2 Exercise 2 state
    # =======================
    game_t2_2 = reactive.value(generate_random_game_t2_ex2())
    show_fb_t2_2 = reactive.value(False)
    show_help_t2_2 = reactive.value(False)

    @reactive.effect
    @reactive.event(input.new_game_t2_2)
    def _new_game_t2_2():
        game_t2_2.set(generate_random_game_t2_ex2())
        ui.update_checkbox_group("answer_t2_2", selected=[])
        show_fb_t2_2.set(False)

    @reactive.effect
    @reactive.event(input.check_t2_2)
    def _check_t2_2():
        show_fb_t2_2.set(True)

    @reactive.effect
    @reactive.event(input.help_t2_2)
    def _help_t2_2():
        show_help_t2_2.set(not show_help_t2_2.get())

    @output
    @render.ui
    def game_table_t2_2():
        lang = current_lang()
        ui.update_checkbox_group(
            "answer_t2_2",
            choices=t2_ex2_choices(lang=lang),
            selected=[],
        )
        return payoff_table(
            P1_STRATS_T2_EX2,
            P2_STRATS_T2_EX2,
            payoff_strings_from_tuple_payoffs(game_t2_2.get()),
            lang=lang,
        )

    @output
    @render.ui
    def notation_t2_2():
        lang = current_lang()
        return notation_ul(P1_STRATS_T2_EX2, P2_STRATS_T2_EX2, game_t2_2.get(), lang=lang)

    @output
    @render.ui
    def help_text_t2_2():
        lang = current_lang()
        if not show_help_t2_2.get():
            return ui.tags.div()
        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong(tr(lang, "Symmetrie: ", "Symmetry: ")),
                        tr(
                            lang,
                            "Das Spiel ist symmetrisch: u₂(r,c) = u₁(c,r).",
                            "The game is symmetric: u₂(r,c) = u₁(c,r).",
                        ),
                        class_="text-muted mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Kandidaten: ", "Candidates: ")),
                            tr(
                                lang,
                                "Als ESS kommen nur symmetrische Profile (s,s) in Frage.",
                                "Only symmetric profiles (s,s) can be ESS candidates.",
                            ),
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Bedingung (1): ", "Condition (1): ")),
                            tr(
                                lang,
                                "u(s,s) ≥ u(s',s) für alle s' ≠ s (s ist beste Antwort auf sich selbst).",
                                "u(s,s) ≥ u(s',s) for all s' ≠ s (s is a best response to itself).",
                            ),
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Bedingung (2): ", "Condition (2): ")),
                            tr(
                                lang,
                                "Für alle s' mit u(s,s)=u(s',s) gilt: u(s',s') < u(s,s').",
                                "For all s' with u(s,s)=u(s',s): u(s',s') < u(s,s').",
                            ),
                        ),
                        ui.tags.li(
                            ui.tags.strong(tr(lang, "Praktisch: ", "Practical: ")),
                            tr(
                                lang,
                                "Bestimme zuerst die symmetrischen Nash-GG (s,s), prüfe dann (1) und ggf. (2).",
                                "First find symmetric Nash equilibria (s,s), then check (1) and, if needed, (2).",
                            ),
                        ),
                        class_="text-muted mb-0",
                    ),
                    class_="mt-2",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3 notation-card",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def feedback_t2_2():
        lang = current_lang()
        if not show_fb_t2_2.get():
            return ui.tags.div()

        chosen = set(input.answer_t2_2() or [])
        if not chosen:
            return ui.tags.div(
                tr(lang, "Bitte wähle mindestens eine Antwort aus.", "Please choose at least one answer."),
                class_="alert alert-warning mt-3",
            )

        payoffs = game_t2_2.get()
        correct_set = t2_ex2_correct_choice_set(payoffs, lang=lang)
        none_label = tr(lang, "Keines", "None")

        sym_ne = symmetric_nash_strategies_t2_ex2(payoffs)
        ess = ess_strategies_t2_ex2(payoffs)

        sym_ne_text = ", ".join([f"({s},{s})" for s in sym_ne]) if sym_ne else none_label
        ess_text = ", ".join([f"({s},{s})" for s in ess]) if ess else none_label
        correct_text = none_label if correct_set == {none_label} else ", ".join(sorted(correct_set))

        details = tr(
            lang,
            f"Symmetrische Nash-GG: {sym_ne_text}. ESS: {ess_text}.",
            f"Symmetric Nash equilibria: {sym_ne_text}. ESS: {ess_text}.",
        )

        if chosen == correct_set:
            return ui.tags.div(
                ui.tags.div(tr(lang, "✅ Richtig!", "✅ Correct!"), class_="fw-semibold"),
                ui.tags.div(details, class_="mt-2"),
                class_="alert alert-success mt-3",
            )
        return ui.tags.div(
            ui.tags.div(
                tr(
                    lang,
                    f"❌ Falsch. Richtig ist: {correct_text}.",
                    f"❌ Incorrect. Correct is: {correct_text}.",
                ),
                class_="fw-semibold",
            ),
            ui.tags.div(details, class_="mt-2"),
            class_="alert alert-danger mt-3",
        )

    # =======================
    # Bayes Exercise 1 state
    # =======================
    game_bayes_ex1 = reactive.value(generate_random_game_bayes_ex1())
    show_fb_bayes_ex1 = reactive.value(False)
    show_help_bayes_ex1 = reactive.value(False)

    @reactive.effect
    @reactive.event(input.new_game_bayes_ex1)
    def _new_game_bayes_ex1():
        game_bayes_ex1.set(generate_random_game_bayes_ex1())
        ui.update_checkbox_group("answer_bayes_ex1", selected=[])
        show_fb_bayes_ex1.set(False)

    @reactive.effect
    @reactive.event(input.help_bayes_ex1)
    def _help_bayes_ex1():
        show_help_bayes_ex1.set(not show_help_bayes_ex1.get())

    @reactive.effect
    @reactive.event(input.check_bayes_ex1)
    def _check_bayes_ex1():
        show_fb_bayes_ex1.set(True)

    @output
    @render.ui
    def bayes_ex1_game_tables():
        lang = current_lang()
        params = game_bayes_ex1.get()
        payoffs_t1, payoffs_t2 = bayes_ex1_payoffs_by_type(params)
        ui.update_checkbox_group("answer_bayes_ex1", choices=bayes_ex1_profiles(), selected=[])
        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h6(
                        "Spieler 1 vom Typ 1",
                        class_="mb-2",
                        **{"data-i18n-de": "Spieler 1 vom Typ 1", "data-i18n-en": "Player 1 of type 1"},
                    ),
                    payoff_table(
                        P1_STRATS_BAYES_EX1,
                        P2_STRATS_BAYES_EX1,
                        payoff_strings_from_tuple_payoffs(payoffs_t1),
                        lang=lang,
                        row_player_label=tr(lang, "Spieler 1 (Typ 1: 25%)", "Player 1 (Type 1: 25%)"),
                        col_player_label=tr(lang, "Spieler 2", "Player 2"),
                    ),
                    class_="col-12 col-xl-6",
                ),
                ui.tags.div(
                    ui.tags.h6(
                        "Spieler 1 vom Typ 2",
                        class_="mb-2",
                        **{"data-i18n-de": "Spieler 1 vom Typ 2", "data-i18n-en": "Player 1 of type 2"},
                    ),
                    payoff_table(
                        P1_STRATS_BAYES_EX1,
                        P2_STRATS_BAYES_EX1,
                        payoff_strings_from_tuple_payoffs(payoffs_t2),
                        lang=lang,
                        row_player_label=tr(lang, "Spieler 1 (Typ 2: 75%)", "Player 1 (Type 2: 75%)"),
                        col_player_label=tr(lang, "Spieler 2", "Player 2"),
                    ),
                    class_="col-12 col-xl-6",
                ),
                class_="row g-3 align-items-start",
            ),
        )

    @output
    @render.ui
    def help_text_bayes_ex1():
        lang = current_lang()
        if not show_help_bayes_ex1.get():
            return ui.tags.div()
        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong(tr(lang, "Vorgehen: ", "Approach: ")),
                        tr(
                            lang,
                            "Prüfe für jedes Profil ((s1(Typ1), s1(Typ2)), s2), ob alle drei Anreizbedingungen erfüllt sind.",
                            "For each profile ((s1(Type1), s1(Type2)), s2), check whether all three incentive conditions hold.",
                        ),
                        class_="text-muted mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li(
                            tr(
                                lang,
                                "Spieler 1, Typ 1: Bei gegebenem s2 muss die gewählte Aktion (A oder B) mindestens so gut sein wie die Alternative.",
                                "Player 1, Type 1: Given s2, the chosen action (A or B) must be at least as good as the alternative.",
                            )
                        ),
                        ui.tags.li(
                            tr(
                                lang,
                                "Spieler 1, Typ 2: Analog dieselbe Bedingung in der Typ-2-Matrix prüfen.",
                                "Player 1, Type 2: Analogously, check the same condition in the type-2 matrix.",
                            )
                        ),
                        ui.tags.li(
                            ui.tags.div(
                                tr(
                                    lang,
                                    "Spieler 2: Vergleiche erwartete Auszahlungen von X und Y mit p(Typ1)=1/4 und p(Typ2)=3/4.",
                                    "Player 2: Compare expected payoffs of X and Y using p(Type1)=1/4 and p(Type2)=3/4.",
                                )
                            ),
                            ui.tags.div(
                                tr(
                                    lang,
                                    "Definition: EU2(X)=1/4·u2(s1(Typ1),X|Typ1)+3/4·u2(s1(Typ2),X|Typ2), "
                                    "EU2(Y)=1/4·u2(s1(Typ1),Y|Typ1)+3/4·u2(s1(Typ2),Y|Typ2).",
                                    "Definition: EU2(X)=1/4·u2(s1(Type1),X|Type1)+3/4·u2(s1(Type2),X|Type2), "
                                    "EU2(Y)=1/4·u2(s1(Type1),Y|Type1)+3/4·u2(s1(Type2),Y|Type2).",
                                ),
                                class_="mt-1",
                            ),
                        ),
                        ui.tags.li(
                            tr(
                                lang,
                                "Ein Profil ist Bayes-Gleichgewicht genau dann, wenn alle drei Bedingungen gleichzeitig gelten.",
                                "A profile is a Bayesian equilibrium iff all three conditions hold simultaneously.",
                            )
                        ),
                        class_="text-muted mb-0",
                    ),
                    class_="mt-2",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3 notation-card",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def feedback_bayes_ex1():
        lang = current_lang()
        if not show_fb_bayes_ex1.get():
            return ui.tags.div()

        params = game_bayes_ex1.get()
        chosen = set(input.answer_bayes_ex1() or [])
        correct = bayes_ex1_correct_choice_set(params)
        correct_text = ", ".join(sorted(correct)) if correct else tr(lang, "keines der Profile", "none of the profiles")

        def _mark(ok):
            return "✓" if ok else "✗"

        def _weighted(k1, k2):
            return 0.25 * params[k1] + 0.75 * params[k2]

        def _reasoning_block(profiles):
            rules = {
                "((A,A),X)": (("a", ">=", "e"), ("i", ">=", "m"), ("b", "j", ">=", "d", "l")),
                "((A,B),X)": (("a", ">=", "e"), ("m", ">=", "i"), ("b", "n", ">=", "d", "p")),
                "((B,A),X)": (("e", ">=", "a"), ("i", ">=", "m"), ("f", "j", ">=", "h", "l")),
                "((B,B),X)": (("e", ">=", "a"), ("m", ">=", "i"), ("f", "n", ">=", "h", "p")),
                "((A,A),Y)": (("c", ">=", "g"), ("k", ">=", "o"), ("b", "j", "<=", "d", "l")),
                "((A,B),Y)": (("c", ">=", "g"), ("o", ">=", "k"), ("b", "n", "<=", "d", "p")),
                "((B,A),Y)": (("g", ">=", "c"), ("k", ">=", "o"), ("f", "j", "<=", "h", "l")),
                "((B,B),Y)": (("g", ">=", "c"), ("o", ">=", "k"), ("f", "n", "<=", "h", "p")),
            }
            profile_actions = {
                "((A,A),X)": ("A", "A", "X"),
                "((A,B),X)": ("A", "B", "X"),
                "((B,A),X)": ("B", "A", "X"),
                "((B,B),X)": ("B", "B", "X"),
                "((A,A),Y)": ("A", "A", "Y"),
                "((A,B),Y)": ("A", "B", "Y"),
                "((B,A),Y)": ("B", "A", "Y"),
                "((B,B),Y)": ("B", "B", "Y"),
            }
            items = []
            for profile in sorted(profiles):
                if profile not in rules:
                    continue
                a_t1, a_t2, a2 = profile_actions[profile]
                alt_t1 = "B" if a_t1 == "A" else "A"
                alt_t2 = "B" if a_t2 == "A" else "A"
                c1, c2, c3 = rules[profile]
                l1, op1, r1 = c1
                l2, op2, r2 = c2
                x1, x2, op3, y1, y2 = c3

                cond1 = params[l1] >= params[r1]
                cond2 = params[l2] >= params[r2]
                lhs = _weighted(x1, x2)
                rhs = _weighted(y1, y2)
                cond3 = lhs >= rhs if op3 == ">=" else lhs <= rhs

                items.append(
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.strong(
                                tr(
                                    lang,
                                    f"{profile} ist richtig weil:",
                                    f"{profile} is correct because:",
                                )
                            )
                        ),
                        ui.tags.ol(
                            ui.tags.li(
                                tr(
                                    lang,
                                    f"Spieler 1, Typ 1 (Spalte {a2}): u1({a_t1},{a2}) {op1} u1({alt_t1},{a2}) "
                                    f"({params[l1]} {op1} {params[r1]}) {_mark(cond1)}",
                                    f"Player 1, Type 1 (column {a2}): u1({a_t1},{a2}) {op1} u1({alt_t1},{a2}) "
                                    f"({params[l1]} {op1} {params[r1]}) {_mark(cond1)}",
                                ),
                            ),
                            ui.tags.li(
                                tr(
                                    lang,
                                    f"Spieler 1, Typ 2 (Spalte {a2}): u1({a_t2},{a2}) {op2} u1({alt_t2},{a2}) "
                                    f"({params[l2]} {op2} {params[r2]}) {_mark(cond2)}",
                                    f"Player 1, Type 2 (column {a2}): u1({a_t2},{a2}) {op2} u1({alt_t2},{a2}) "
                                    f"({params[l2]} {op2} {params[r2]}) {_mark(cond2)}",
                                ),
                            ),
                            ui.tags.li(
                                tr(
                                    lang,
                                    f"Spieler 2: EU2(X)=1/4·u2({a_t1},X|Typ1)+3/4·u2({a_t2},X|Typ2), "
                                    f"EU2(Y)=1/4·u2({a_t1},Y|Typ1)+3/4·u2({a_t2},Y|Typ2), "
                                    f"also EU2(X) {op3} EU2(Y) ({lhs:.2f} {op3} {rhs:.2f}) {_mark(cond3)}",
                                    f"Player 2: EU2(X)=1/4·u2({a_t1},X|Type1)+3/4·u2({a_t2},X|Type2), "
                                    f"EU2(Y)=1/4·u2({a_t1},Y|Type1)+3/4·u2({a_t2},Y|Type2), "
                                    f"thus EU2(X) {op3} EU2(Y) ({lhs:.2f} {op3} {rhs:.2f}) {_mark(cond3)}",
                                ),
                            ),
                            class_="mb-1",
                        ),
                        class_="mt-2",
                    )
                )

            return ui.tags.div(
                ui.tags.div(*items, class_="mt-2") if items else ui.tags.div(
                    tr(
                        lang,
                        "Es gibt in dieser Ziehung kein Bayes-Gleichgewicht aus den vorgegebenen Profilen.",
                        "In this draw, none of the listed profiles is a Bayesian equilibrium.",
                    ),
                    class_="mt-2 mb-0",
                ),
            )

        if chosen == correct:
            return ui.tags.div(
                ui.tags.div(tr(lang, "✅ Richtig!", "✅ Correct!"), class_="fw-semibold"),
                _reasoning_block(correct),
                class_="alert alert-success mt-3",
            )

        if not chosen and correct:
            return ui.tags.div(
                ui.tags.div(
                    tr(
                        lang,
                        f"❌ Falsch. Richtig ist: {correct_text}.",
                        f"❌ Incorrect. Correct is: {correct_text}.",
                    ),
                    class_="fw-semibold",
                ),
                _reasoning_block(correct),
                class_="alert alert-danger mt-3",
            )

        return ui.tags.div(
            ui.tags.div(
                tr(
                    lang,
                    f"❌ Falsch. Richtig ist: {correct_text}.",
                    f"❌ Incorrect. Correct is: {correct_text}.",
                ),
                class_="fw-semibold",
            ),
            _reasoning_block(correct),
            class_="alert alert-danger mt-3",
        )

    # =======================
    # Bayes Exercise 2a state
    # =======================
    bayes_ex2_params = reactive.value(generate_bayes_ex2_params())
    bayes_ex2a_option_order = reactive.value(generate_bayes_ex2a_option_order())
    bayes_ex2b_alt = reactive.value(random.choice(["ab_xy", "ba_xx", "bb_yx"]))
    show_fb_bayes_ex2a = reactive.value(False)
    show_help_bayes_ex2a = reactive.value(False)
    show_fb_bayes_ex2b = reactive.value(False)
    show_help_bayes_ex2b = reactive.value(False)

    def _reset_bayes_ex2_game():
        bayes_ex2_params.set(generate_bayes_ex2_params())
        bayes_ex2a_option_order.set(generate_bayes_ex2a_option_order())
        bayes_ex2b_alt.set(random.choice(["ab_xy", "ba_xx", "bb_yx"]))
        show_fb_bayes_ex2a.set(False)
        show_fb_bayes_ex2b.set(False)
        ui.update_radio_buttons("answer_bayes_ex2a", selected=None)
        ui.update_checkbox_group("answer_bayes_ex2b", selected=[])

    @reactive.effect
    @reactive.event(input.check_bayes_ex2a)
    def _check_bayes_ex2a():
        show_fb_bayes_ex2a.set(True)
        show_fb_bayes_ex2b.set(False)

    @reactive.effect
    @reactive.event(input.new_game_bayes_ex2a)
    def _new_game_bayes_ex2a():
        _reset_bayes_ex2_game()

    @reactive.effect
    @reactive.event(input.new_game_bayes_ex2a_from_ex2b)
    def _new_game_bayes_ex2a_from_ex2b():
        _reset_bayes_ex2_game()
        ui.update_navset("main_tabs", selected="bayes_ex2a")

    @reactive.effect
    @reactive.event(input.check_bayes_ex2b)
    def _check_bayes_ex2b():
        show_fb_bayes_ex2b.set(True)

    @reactive.effect
    @reactive.event(input.help_bayes_ex2a)
    def _help_bayes_ex2a():
        show_help_bayes_ex2a.set(not show_help_bayes_ex2a.get())

    @reactive.effect
    @reactive.event(input.help_bayes_ex2b)
    def _help_bayes_ex2b():
        show_help_bayes_ex2b.set(not show_help_bayes_ex2b.get())

    def _prior_table_ui():
        p = bayes_ex2_params.get()
        den = p["den"]
        return ui.tags.table(
            ui.tags.thead(
                ui.tags.tr(
                    ui.tags.th("", style="border-right: 1px solid #222;"),
                    ui.tags.th("Spieler 2: Typ c", **{"data-i18n-de": "Spieler 2: Typ c", "data-i18n-en": "Player 2: Type c"}),
                    ui.tags.th("Spieler 2: Typ d", **{"data-i18n-de": "Spieler 2: Typ d", "data-i18n-en": "Player 2: Type d"}),
                )
            ),
            ui.tags.tbody(
                ui.tags.tr(
                    ui.tags.th("Spieler 1: Typ a", style="border-right: 1px solid #222;", **{"data-i18n-de": "Spieler 1: Typ a", "data-i18n-en": "Player 1: Type a"}),
                    ui.tags.td(f"{p['w']}/{den}"),
                    ui.tags.td(f"{p['x']}/{den}"),
                ),
                ui.tags.tr(
                    ui.tags.th("Spieler 1: Typ b", style="border-right: 1px solid #222;", **{"data-i18n-de": "Spieler 1: Typ b", "data-i18n-en": "Player 1: Type b"}),
                    ui.tags.td(f"{p['y']}/{den}"),
                    ui.tags.td(f"{p['z']}/{den}"),
                ),
            ),
            class_="table table-bordered text-center align-middle w-auto mb-3",
        )

    @output
    @render.ui
    def bayes_ex2a_prior_table():
        return _prior_table_ui()

    @output
    @render.ui
    def bayes_ex2b_prior_table():
        return _prior_table_ui()

    def _bayes_ex2_type_game_tables(lang):
        return ui.tags.div(
            ui.tags.div(
                ui.tags.h6(
                    "Spieler 1 vom Typ a, Spieler 2 vom Typ c",
                    class_="mb-2",
                    **{
                        "data-i18n-de": "Spieler 1 vom Typ a, Spieler 2 vom Typ c",
                        "data-i18n-en": "Player 1 of type a, player 2 of type c",
                    },
                ),
                payoff_table(
                    P1_STRATS_BAYES_EX2A,
                    P2_STRATS_BAYES_EX2A,
                    payoff_strings_from_tuple_payoffs(BAYES_EX2A_PAYOFFS_A_C),
                    lang=lang,
                    row_player_label=tr(lang, "Spieler 1 (Typ a)", "Player 1 (Type a)"),
                    col_player_label=tr(lang, "Spieler 2 (Typ c)", "Player 2 (Type c)"),
                ),
                class_="col-12 col-xl-6",
            ),
            ui.tags.div(
                ui.tags.h6(
                    "Spieler 1 vom Typ a, Spieler 2 vom Typ d",
                    class_="mb-2",
                    **{
                        "data-i18n-de": "Spieler 1 vom Typ a, Spieler 2 vom Typ d",
                        "data-i18n-en": "Player 1 of type a, player 2 of type d",
                    },
                ),
                payoff_table(
                    P1_STRATS_BAYES_EX2A,
                    P2_STRATS_BAYES_EX2A,
                    payoff_strings_from_tuple_payoffs(BAYES_EX2A_PAYOFFS_A_D),
                    lang=lang,
                    row_player_label=tr(lang, "Spieler 1 (Typ a)", "Player 1 (Type a)"),
                    col_player_label=tr(lang, "Spieler 2 (Typ d)", "Player 2 (Type d)"),
                ),
                class_="col-12 col-xl-6",
            ),
            ui.tags.div(
                ui.tags.h6(
                    "Spieler 1 vom Typ b, Spieler 2 vom Typ c",
                    class_="mb-2",
                    **{
                        "data-i18n-de": "Spieler 1 vom Typ b, Spieler 2 vom Typ c",
                        "data-i18n-en": "Player 1 of type b, player 2 of type c",
                    },
                ),
                payoff_table(
                    P1_STRATS_BAYES_EX2A,
                    P2_STRATS_BAYES_EX2A,
                    payoff_strings_from_tuple_payoffs(BAYES_EX2A_PAYOFFS_B_C),
                    lang=lang,
                    row_player_label=tr(lang, "Spieler 1 (Typ b)", "Player 1 (Type b)"),
                    col_player_label=tr(lang, "Spieler 2 (Typ c)", "Player 2 (Type c)"),
                ),
                class_="col-12 col-xl-6",
            ),
            ui.tags.div(
                ui.tags.h6(
                    "Spieler 1 vom Typ b, Spieler 2 vom Typ d",
                    class_="mb-2",
                    **{
                        "data-i18n-de": "Spieler 1 vom Typ b, Spieler 2 vom Typ d",
                        "data-i18n-en": "Player 1 of type b, player 2 of type d",
                    },
                ),
                payoff_table(
                    P1_STRATS_BAYES_EX2A,
                    P2_STRATS_BAYES_EX2A,
                    payoff_strings_from_tuple_payoffs(BAYES_EX2A_PAYOFFS_B_D),
                    lang=lang,
                    row_player_label=tr(lang, "Spieler 1 (Typ b)", "Player 1 (Type b)"),
                    col_player_label=tr(lang, "Spieler 2 (Typ d)", "Player 2 (Type d)"),
                ),
                class_="col-12 col-xl-6",
            ),
            class_="row g-3 align-items-start",
        )

    def _bayes_ex2_help_card(lang):
        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong(tr(lang, "Ziel: ", "Goal: ")),
                        tr(
                            lang,
                            "Bestimme die a-posteriori Wahrscheinlichkeiten von Spieler-2-Typen bedingt auf den Typ von Spieler 1.",
                            "Determine the posterior probabilities of player-2 types conditional on player-1 type.",
                        ),
                        class_="mb-2",
                    ),
                    ui.tags.ol(
                        ui.tags.li(
                            tr(
                                lang,
                                "Für Typ a von Spieler 1 normalisierst du die Zeile (w, x): Prob(c|a)=w/(w+x), Prob(d|a)=x/(w+x).",
                                "For player-1 type a, normalize row (w, x): Prob(c|a)=w/(w+x), Prob(d|a)=x/(w+x).",
                            )
                        ),
                        ui.tags.li(
                            tr(
                                lang,
                                "Für Typ b von Spieler 1 normalisierst du die Zeile (y, z): Prob(c|b)=y/(y+z), Prob(d|b)=z/(y+z).",
                                "For player-1 type b, normalize row (y, z): Prob(c|b)=y/(y+z), Prob(d|b)=z/(y+z).",
                            )
                        ),
                        ui.tags.li(
                            tr(
                                lang,
                                "Prüfe bei jeder Antwort, dass sich die beiden bedingten Wahrscheinlichkeiten je Zeile zu 1 addieren.",
                                "Check each option so the two conditional probabilities per row sum to 1.",
                            )
                        ),
                        ui.tags.li(
                            ui.tags.div(
                                tr(
                                    lang,
                                    "Rechnung (allgemein):",
                                    "Computation (general):",
                                ),
                                class_="mb-1",
                            ),
                            ui.tags.div(
                                ui.tags.code("Prob(c|a)=Prob(a,c)/(Prob(a,c)+Prob(a,d))"),
                                class_="mb-1",
                            ),
                            ui.tags.div(
                                ui.tags.code("Prob(d|a)=Prob(a,d)/(Prob(a,c)+Prob(a,d))"),
                                class_="mb-1",
                            ),
                            ui.tags.div(
                                ui.tags.code("Prob(c|b)=Prob(b,c)/(Prob(b,c)+Prob(b,d))"),
                                class_="mb-1",
                            ),
                            ui.tags.div(
                                ui.tags.code("Prob(d|b)=Prob(b,d)/(Prob(b,c)+Prob(b,d))"),
                                class_="mb-0",
                            ),
                        ),
                        class_="mb-0",
                    ),
                    class_="card-body py-2 exercise-notation-body",
                ),
                class_="card mt-3 notation-card",
                style="background-color:#f7f7f7;",
            )
        )

    def _bayes_ex2b_help_card(lang):
        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong(tr(lang, "Ziel: ", "Goal: ")),
                        tr(
                            lang,
                            "Prüfe für die angezeigten Strategieprofile, ob sie Bayes-Gleichgewichte sind.",
                            "Check whether the shown strategy profiles are Bayesian equilibria.",
                        ),
                        class_="mb-2",
                    ),
                    ui.tags.ol(
                        ui.tags.li(
                            tr(
                                lang,
                                "Lies zuerst aus der Prior-Tabelle die vier Basiswahrscheinlichkeiten ab: Prob(a,c), Prob(a,d), Prob(b,c), Prob(b,d).",
                                "First read the four base probabilities from the prior table: Prob(a,c), Prob(a,d), Prob(b,c), Prob(b,d).",
                            )
                        ),
                        ui.tags.li(
                            tr(
                                lang,
                                "Setze diese Werte in die jeweiligen Prüf-Ungleichungen für die angezeigten Strategieprofile ein.",
                                "Plug these values into the corresponding check-inequalities for the shown strategy profiles.",
                            )
                        ),
                        ui.tags.li(
                            tr(
                                lang,
                                "Prüfe jede Bedingung einzeln und markiere sie als erfüllt/nicht erfüllt.",
                                "Check each condition separately and mark it as satisfied/not satisfied.",
                            )
                        ),
                        ui.tags.li(
                            ui.tags.div(
                                tr(
                                    lang,
                                    "Allgemeine Prüf-Ungleichungen:",
                                    "General check-inequalities:",
                                ),
                                class_="mb-1",
                            ),
                            ui.tags.div(ui.tags.code("5·Prob(d|b) ≥ 4·Prob(d|a), 2·Prob(c|b) ≥ 3·Prob(d|b)"), class_="mb-1"),
                            ui.tags.div(ui.tags.code("3·Prob(d|a) ≥ 2·Prob(c|a), 4·Prob(c|b) ≥ Prob(d|b), 2·Prob(c|b) ≥ Prob(c|a), 3·Prob(d|a) ≥ 5·Prob(d|b)"), class_="mb-0"),
                        ),
                        ui.tags.li(
                            tr(
                                lang,
                                "Ein Strategieprofil ist nur dann korrekt auswählbar, wenn alle zugehörigen Bedingungen erfüllt sind.",
                                "A strategy profile is selectable as correct only if all its required conditions are satisfied.",
                            )
                        ),
                        ui.tags.li(
                            tr(
                                lang,
                                "Da mehrere Profile gleichzeitig gelten können, wähle am Ende alle Profile aus, deren Bedingungen erfüllt sind.",
                                "Since multiple profiles can hold simultaneously, select all profiles whose conditions are satisfied.",
                            )
                        ),
                        class_="mb-0",
                    ),
                    class_="card-body py-2 exercise-notation-body",
                ),
                class_="card mt-3 notation-card",
                style="background-color:#f7f7f7;",
            )
        )

    @output
    @render.ui
    def bayes_ex2a_game_tables():
        lang = current_lang()
        choices, _ = bayes_ex2a_choices_and_correct(bayes_ex2_params.get(), bayes_ex2a_option_order.get())
        ui.update_radio_buttons("answer_bayes_ex2a", choices=choices, selected=None)
        return _bayes_ex2_type_game_tables(lang)

    @output
    @render.ui
    def bayes_ex2b_game_tables():
        lang = current_lang()
        alt_key = bayes_ex2b_alt.get()
        labels = {
            "first": "((A,B),(Y,Y))",
            "ab_xy": "((A,B),(X,Y))",
            "ba_xx": "((B,A),(X,X))",
            "bb_yx": "((B,B),(Y,X))",
        }
        ui.update_checkbox_group(
            "answer_bayes_ex2b",
            choices=[labels["first"], labels[alt_key], tr(lang, "Keines", "None")],
            selected=[],
        )
        return _bayes_ex2_type_game_tables(lang)

    @output
    @render.ui
    def help_text_bayes_ex2a():
        lang = current_lang()
        if not show_help_bayes_ex2a.get():
            return ui.tags.div()
        return _bayes_ex2_help_card(lang)

    @output
    @render.ui
    def help_text_bayes_ex2b():
        lang = current_lang()
        if not show_help_bayes_ex2b.get():
            return ui.tags.div()
        return _bayes_ex2b_help_card(lang)

    @output
    @render.ui
    def feedback_bayes_ex2a():
        lang = current_lang()
        vals = bayes_ex2a_values(bayes_ex2_params.get())

        if not show_fb_bayes_ex2a.get():
            return ui.tags.div()

        selected = input.answer_bayes_ex2a()
        if selected is None or selected == "":
            return ui.tags.div(
                tr(lang, "Bitte wähle zuerst eine Antwort aus.", "Please choose an answer first."),
                class_="alert alert-warning mt-3",
            )

        _, correct_key = bayes_ex2a_choices_and_correct(bayes_ex2_params.get(), bayes_ex2a_option_order.get())
        if selected == correct_key:
            return ui.tags.div(
                ui.tags.div(tr(lang, "✅ Richtig!", "✅ Correct!"), class_="fw-semibold"),
                ui.tags.div(
                    f"Prob(c|a)={frac_str(vals['c_a'])}, Prob(d|a)={frac_str(vals['d_a'])}, "
                    f"Prob(c|b)={frac_str(vals['c_b'])}, Prob(d|b)={frac_str(vals['d_b'])}",
                    class_="mt-2",
                ),
                class_="alert alert-success mt-3",
            )

        return ui.tags.div(
            ui.tags.div(
                tr(
                    lang,
                    "❌ Falsch. Richtig ist:",
                    "❌ Incorrect. Correct is:",
                ),
                class_="fw-semibold",
            ),
            ui.tags.div(
                f"Prob(c|a)={frac_str(vals['c_a'])}, Prob(d|a)={frac_str(vals['d_a'])}, "
                f"Prob(c|b)={frac_str(vals['c_b'])}, Prob(d|b)={frac_str(vals['d_b'])}",
                class_="mt-2",
            ),
            class_="alert alert-danger mt-3",
        )

    @output
    @render.ui
    def intermediate_bayes_ex2a():
        lang = current_lang()
        if not show_fb_bayes_ex2a.get():
            return ui.tags.div()
        vals = bayes_ex2a_values(bayes_ex2_params.get())
        return ui.tags.div(
            ui.tags.div(
                ui.tags.strong(tr(lang, "Zwischenergebnis:", "Intermediate result:")),
                ui.tags.div(
                    f"Prob(c|a)={frac_str(vals['c_a'])}, Prob(d|a)={frac_str(vals['d_a'])}, "
                    f"Prob(c|b)={frac_str(vals['c_b'])}, Prob(d|b)={frac_str(vals['d_b'])}",
                    class_="mt-2",
                ),
                ui.tags.div(
                    f"Prob(a|c)={frac_str(vals['a_c'])}, Prob(b|c)={frac_str(vals['b_c'])}, "
                    f"Prob(a|d)={frac_str(vals['a_d'])}, Prob(b|d)={frac_str(vals['b_d'])}",
                    class_="mt-1",
                ),
                class_="card-body",
            ),
            class_="card border mt-2",
            style="background-color:#ffffff;",
        )

    @output
    @render.ui
    def intermediate_bayes_ex2a_for_ex2b():
        lang = current_lang()
        if not show_fb_bayes_ex2a.get():
            return ui.tags.div(
                tr(lang, "Bitte zuerst Teil a abschicken, dann erscheint hier das Zwischenergebnis.", "Please submit part a first; the intermediate result will appear here."),
                class_="alert alert-warning mt-2",
            )
        vals = bayes_ex2a_values(bayes_ex2_params.get())
        return ui.tags.div(
            ui.tags.div(
                ui.tags.strong(tr(lang, "Zwischenergebnis aus Teil a:", "Intermediate result from part a:")),
                ui.tags.div(
                    f"Prob(c|a)={frac_str(vals['c_a'])}, Prob(d|a)={frac_str(vals['d_a'])}, "
                    f"Prob(c|b)={frac_str(vals['c_b'])}, Prob(d|b)={frac_str(vals['d_b'])}",
                    class_="mt-1",
                ),
                ui.tags.div(
                    f"Prob(a|c)={frac_str(vals['a_c'])}, Prob(b|c)={frac_str(vals['b_c'])}, "
                    f"Prob(a|d)={frac_str(vals['a_d'])}, Prob(b|d)={frac_str(vals['b_d'])}",
                    class_="mt-1",
                ),
                class_="card-body",
            ),
            class_="card border mt-2",
            style="background-color:#ffffff;",
        )

    @output
    @render.ui
    def feedback_bayes_ex2b():
        lang = current_lang()
        p = bayes_ex2_params.get()
        w, x, y, z = bayes_ex2_probs(p)
        alt_key = bayes_ex2b_alt.get()
        labels = {
            "first": "((A,B),(Y,Y))",
            "ab_xy": "((A,B),(X,Y))",
            "ba_xx": "((B,A),(X,X))",
            "bb_yx": "((B,B),(Y,X))",
        }

        if not show_fb_bayes_ex2b.get():
            return ui.tags.div()

        first_ok = (5 * z >= 4 * x) and (2 * y >= 3 * z)
        if alt_key == "ab_xy":
            second_ok = False
        elif alt_key == "ba_xx":
            second_ok = True
        else:
            second_ok = (3 * x >= 2 * w) and (4 * y >= z) and (2 * y >= w) and (3 * x >= 5 * z)

        correct = set()
        if first_ok:
            correct.add(labels["first"])
        if second_ok:
            correct.add(labels[alt_key])
        if not correct:
            correct = {tr(lang, "Keines", "None")}

        def _reason_line(profile):
            if profile == labels["first"]:
                c1 = 5 * z >= 4 * x
                c2 = 2 * y >= 3 * z
                return tr(
                    lang,
                    f"{profile}: {'Ja' if (c1 and c2) else 'Nein'}; "
                    f"5·Prob(b,d) ≥ 4·Prob(a,d) ({frac_str(5*z)} ≥ {frac_str(4*x)}) {'✓' if c1 else '✗'} und "
                    f"2·Prob(b,c) ≥ 3·Prob(b,d) ({frac_str(2*y)} ≥ {frac_str(3*z)}) {'✓' if c2 else '✗'}",
                    f"{profile}: {'Yes' if (c1 and c2) else 'No'}; "
                    f"5·Prob(b,d) ≥ 4·Prob(a,d) ({frac_str(5*z)} ≥ {frac_str(4*x)}) {'✓' if c1 else '✗'} and "
                    f"2·Prob(b,c) ≥ 3·Prob(b,d) ({frac_str(2*y)} ≥ {frac_str(3*z)}) {'✓' if c2 else '✗'}",
                )
            if profile == labels["ab_xy"]:
                return tr(
                    lang,
                    f"{profile}: Nein (für alle prior Wahrscheinlichkeiten).",
                    f"{profile}: No (for all prior probabilities).",
                )
            if profile == labels["ba_xx"]:
                return tr(
                    lang,
                    f"{profile}: Ja (für alle prior Wahrscheinlichkeiten).",
                    f"{profile}: Yes (for all prior probabilities).",
                )
            c1 = 3 * x >= 2 * w
            c2 = 4 * y >= z
            c3 = 2 * y >= w
            c4 = 3 * x >= 5 * z
            ok = c1 and c2 and c3 and c4
            return tr(
                lang,
                f"{profile}: {'Ja' if ok else 'Nein'}; "
                f"3·Prob(a,d) ≥ 2·Prob(a,c) ({frac_str(3*x)} ≥ {frac_str(2*w)}) {'✓' if c1 else '✗'}, "
                f"4·Prob(b,c) ≥ Prob(b,d) ({frac_str(4*y)} ≥ {frac_str(z)}) {'✓' if c2 else '✗'}, "
                f"2·Prob(b,c) ≥ Prob(a,c) ({frac_str(2*y)} ≥ {frac_str(w)}) {'✓' if c3 else '✗'}, "
                f"3·Prob(a,d) ≥ 5·Prob(b,d) ({frac_str(3*x)} ≥ {frac_str(5*z)}) {'✓' if c4 else '✗'}",
                f"{profile}: {'Yes' if ok else 'No'}; "
                f"3·Prob(a,d) ≥ 2·Prob(a,c) ({frac_str(3*x)} ≥ {frac_str(2*w)}) {'✓' if c1 else '✗'}, "
                f"4·Prob(b,c) ≥ Prob(b,d) ({frac_str(4*y)} ≥ {frac_str(z)}) {'✓' if c2 else '✗'}, "
                f"2·Prob(b,c) ≥ Prob(a,c) ({frac_str(2*y)} ≥ {frac_str(w)}) {'✓' if c3 else '✗'}, "
                f"3·Prob(a,d) ≥ 5·Prob(b,d) ({frac_str(3*x)} ≥ {frac_str(5*z)}) {'✓' if c4 else '✗'}",
            )

        reasoning = ui.tags.div(
            ui.tags.div(tr(lang, "Begründung:", "Reasoning:"), class_="fw-semibold mt-2"),
            ui.tags.div(_reason_line(labels["first"]), class_="mt-1"),
            ui.tags.div(_reason_line(labels[alt_key]), class_="mt-1"),
            class_="mt-1",
        )

        chosen = set(input.answer_bayes_ex2b() or [])
        correct_text = ", ".join(sorted(correct))
        if chosen == correct:
            return ui.tags.div(
                ui.tags.div(tr(lang, "✅ Richtig!", "✅ Correct!"), class_="fw-semibold"),
                ui.tags.div(tr(lang, f"Richtig ist: {correct_text}", f"Correct is: {correct_text}"), class_="mt-1"),
                reasoning,
                class_="alert alert-success mt-3",
            )
        return ui.tags.div(
            ui.tags.div(tr(lang, "❌ Falsch.", "❌ Incorrect."), class_="fw-semibold"),
            ui.tags.div(tr(lang, f"Richtig ist: {correct_text}", f"Correct is: {correct_text}"), class_="mt-1"),
            reasoning,
            class_="alert alert-danger mt-3",
        )

app = App(app_ui, server)
