import random
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

# =========================================================
# Helpers
# =========================================================
def payoff_strings_from_tuple_payoffs(payoffs):
    """(row,col)->(u1,u2)  => (row,col)-> 'u1, u2' """
    return {(r, c): f"{payoffs[(r, c)][0]}, {payoffs[(r, c)][1]}" for (r, c) in payoffs}

def payoff_table(rows, cols, payoff_strings):
    """
    payoff_strings: dict[(row,col)] -> "u1, u2"  (with or without parentheses)
    """
    n_rows = len(rows)
    n_cols = len(cols)

    def fmt(v: str) -> str:
        return v if "(" in v else f"({v})"

    return ui.tags.table(
        ui.tags.thead(
            ui.tags.tr(
                ui.tags.th("", colspan=2),
                ui.tags.th("Spieler 2", colspan=n_cols, style="font-weight:600;"),
            ),
            ui.tags.tr(
                ui.tags.th(""),
                ui.tags.th("", style="border-right: 1px solid #222;"),
                *[ui.tags.th(c) for c in cols],
            ),
        ),
        ui.tags.tbody(
            ui.tags.tr(
                ui.tags.th(
                    "Spieler 1",
                    rowspan=n_rows,
                    style="font-weight:600; vertical-align:middle;",
                ),
                ui.tags.th(
                    rows[0],
                    style="font-weight:600; border-right: 1px solid #222;",
                ),
                *[ui.tags.td(fmt(payoff_strings[(rows[0], c)])) for c in cols],
            ),
            *[
                ui.tags.tr(
                    ui.tags.th(
                        r,
                        style="font-weight:600; border-right: 1px solid #222;",
                    ),
                    *[ui.tags.td(fmt(payoff_strings[(r, c)])) for c in cols],
                )
                for r in rows[1:]
            ],
        ),
        class_="table table-bordered text-center align-middle w-auto",
        style="margin-left: 0; margin-right: 0;",
    )

def notation_ul(rows, cols, payoffs):
    row = "A" if "A" in rows else rows[0]
    col = "X" if "X" in cols else cols[0]
    u1, u2 = payoffs[(row, col)]
    return ui.tags.ul(
        ui.tags.li(ui.tags.code("N = {1, 2}")),
        ui.tags.li("Spieler 1: ", ui.tags.code(f"S₁ = {{{', '.join(rows)}}}")),
        ui.tags.li("Spieler 2: ", ui.tags.code(f"S₂ = {{{', '.join(cols)}}}")),
        ui.tags.li(
            "Beispiel: ",
            ui.tags.code(f"s = ({row}, {col})"),
            " und ",
            ui.tags.code(f"u = ({u1}, {u2})"),
        ),
        class_="mb-0",
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

def subset_label(strats, chosen_set):
    s = [x for x in strats if x in chosen_set]
    if len(s) == 0:
        return "Keine Strategie"
    if len(s) == 1:
        return f"Nur {s[0]}"
    if len(s) == 2:
        return f"{s[0]} und {s[1]}"
    return f"{s[0]}, {s[1]} und {s[2]}"

def all_subset_labels(strats):
    a, b, c = strats
    return [
        f"Nur {a}", f"Nur {b}", f"Nur {c}",
        f"{a} und {b}", f"{a} und {c}", f"{b} und {c}",
        f"{a}, {b} und {c}",
        "Keine Strategie",
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

def dominance_choices(rows, cols):
    # exactly your style of choices
    choices = []
    for r in rows:
        choices.append(f"Ja, {r}")
    for c in cols:
        choices.append(f"Ja, {c}")
    for r in rows:
        for c in cols:
            choices.append(f"Ja, {r} und {c}")
    choices.append("Nein, keiner")
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

def correct_dominance_label(payoffs):
    r = strictly_dominant_row(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)
    c = strictly_dominant_col(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)

    if r and c:
        return f"Ja, {r} und {c}", r, c
    if r:
        return f"Ja, {r}", r, None
    if c:
        return f"Ja, {c}", None, c
    return "Nein, keiner", None, None

def dominance_explanation(r_dom, c_dom):
    if r_dom and c_dom:
        return (f"Spieler 1 hat mit {r_dom} eine strikt dominante Strategie (u₁ ist in jeder Spalte strikt höher als bei den anderen Zeilen) "
                f"und Spieler 2 hat mit {c_dom} eine strikt dominante Strategie (u₂ ist in jeder Zeile strikt höher als in den anderen Spalten).")
    if c_dom:
        return (f"{c_dom} ist strikt dominant für Spieler 2: Egal, ob Spieler 1 A, B, C oder D spielt, "
                f"ist u₂ bei {c_dom} strikt größer als bei den anderen Strategien.")
    if r_dom:
        return (f"{r_dom} ist strikt dominant für Spieler 1: Egal, ob Spieler 2 X, Y oder Z spielt, "
                f"ist u₁ bei {r_dom} strikt größer als bei den anderen Strategien.")
    return "Keine Strategie ist für einen Spieler in allen Fällen strikt besser als jede Alternative."

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
def correct_dominance_label_weak(payoffs):
    r_dom_strict = strictly_dominant_row(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)
    c_dom_strict = strictly_dominant_col(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)
    r_dom_weak = None if r_dom_strict else weakly_dominant_row(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)
    c_dom_weak = None if c_dom_strict else weakly_dominant_col(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)
    r_dom = r_dom_strict or r_dom_weak
    c_dom = c_dom_strict or c_dom_weak
    r_type = "strikt" if r_dom_strict else ("schwach" if r_dom_weak else None)
    c_type = "strikt" if c_dom_strict else ("schwach" if c_dom_weak else None)
    # Antwort-Label formen
    if r_dom and c_dom:
        label = f"Ja, {r_dom} und {c_dom}"
    elif r_dom:
        label = f"Ja, {r_dom}"
    elif c_dom:
        label = f"Ja, {c_dom}"
    else:
        label = "Nein, keiner"
    return label, r_dom, r_type, c_dom, c_type

# Funktion zur Erläuterung für Übung 3 (dominante Strategien)
def dominance_explanation_weak(r_dom, r_type, c_dom, c_type):
    if r_dom and c_dom:
        expl_r = ("immer mindestens so hoch wie bei den anderen Strategien und mindestens gegen eine Strategie von Spieler 2 echt höher"
                  if r_type == "schwach" else 
                  "in jeder Spalte strikt höher als bei den anderen Strategien")
        expl_c = ("immer mindestens so hoch wie bei den anderen Strategien und mindestens gegen eine Strategie von Spieler 1 echt höher"
                  if c_type == "schwach" else 
                  "in jeder Zeile strikt höher als bei den anderen Strategien")
        return (f"Spieler 1 hat mit {r_dom} eine {r_type} dominante Strategie "
                f"(egal, ob Spieler 2 X, Y oder Z spielt, ist u₁ bei {r_dom} {expl_r}) "
                f"und Spieler 2 hat mit {c_dom} eine {c_type} dominante Strategie "
                f"(egal, ob Spieler 1 A, B, C oder D spielt, ist u₂ bei {c_dom} {expl_c}).")
    if r_dom:
        if r_type == "schwach":
            return (f"{r_dom} ist schwach dominant für Spieler 1: Egal, ob Spieler 2 X, Y oder Z spielt, "
                    f"ist u₁ bei {r_dom} immer mindestens so hoch wie bei den anderen Strategien "
                    f"und mindestens in einem Fall strikt höher.")
        else:
            return (f"{r_dom} ist strikt dominant für Spieler 1: Egal, ob Spieler 2 X, Y oder Z spielt, "
                    f"ist u₁ bei {r_dom} strikt größer als bei den anderen Strategien.")
    if c_dom:
        if c_type == "schwach":
            return (f"{c_dom} ist schwach dominant für Spieler 2: Egal, ob Spieler 1 A, B, C oder D spielt, "
                    f"ist u₂ bei {c_dom} immer mindestens so hoch wie bei den anderen Strategien "
                    f"und mindestens in einem Fall strikt höher.")
        else:
            return (f"{c_dom} ist strikt dominant für Spieler 2: Egal, ob Spieler 1 A, B, C oder D spielt, "
                    f"ist u₂ bei {c_dom} strikt größer als bei den anderen Strategien.")
    return ("Keine Strategie ist für einen Spieler in allen Fällen mindestens so gut wie jede alternative Strategie "
            "(kein Spieler hat eine dominante Strategie).")

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
        ui.tags.h4("Gefangenendilemma", class_="mb-2"),
        ui.tags.div(
        ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h5("Beispielspiel", class_="card-title"),
                    payoff_table(
                        rows=["Kooperieren", "Defektieren"],
                        cols=["Kooperieren", "Defektieren"],
                        payoff_strings={
                            ("Kooperieren", "Kooperieren"): "3, 3",
                            ("Kooperieren", "Defektieren"): "0, 5",
                            ("Defektieren", "Kooperieren"): "5, 0",
                            ("Defektieren", "Defektieren"): "1, 1",
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
                    ui.tags.h5("Erklärung", class_="card-title"),
                    ui.tags.p(
                        "Jeder Spieler hat unabhängig vom Verhalten des anderen einen Anreiz zu defektieren.",
                        class_="mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li("Defektieren ist strikt dominant für beide Spieler."),
                        ui.tags.li("Einziges Nash-Gleichgewicht: (Defektieren, Defektieren)."),
                        ui.tags.li("Pareto-ineffizient."),
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
        ui.tags.h4("Feiglingsspiel (Chicken)", class_="mb-2"),
        ui.tags.div(
        ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h5("Beispielspiel", class_="card-title"),
                    payoff_table(
                        rows=["Ausweichen", "Geradeaus"],
                        cols=["Ausweichen", "Geradeaus"],
                        payoff_strings={
                            ("Ausweichen", "Ausweichen"): "2, 2",
                            ("Ausweichen", "Geradeaus"): "1, 3",
                            ("Geradeaus", "Ausweichen"): "3, 1",
                            ("Geradeaus", "Geradeaus"): "0, 0",
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
                    ui.tags.h5("Erklärung", class_="card-title"),
                    ui.tags.p(
                        "Beide wollen nicht ausweichen, aber ein Zusammenstoß ist katastrophal.",
                        class_="mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li("Zwei Nash-Gleichgewichte: (Geradeaus, Ausweichen) und (Ausweichen, Geradeaus)."),
                        ui.tags.li("Kein strikt dominantes Verhalten."),
                        ui.tags.li("Commitment/Drohungen sind oft entscheidend."),
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
        ui.tags.h4("Jagdspiel (Stag Hunt)", class_="mb-2"),
        ui.tags.div(
        ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h5("Beispielspiel", class_="card-title"),
                    payoff_table(
                        rows=["Hirsch", "Hase"],
                        cols=["Hirsch", "Hase"],
                        payoff_strings={
                            ("Hirsch", "Hirsch"): "4, 4",
                            ("Hirsch", "Hase"): "0, 3",
                            ("Hase", "Hirsch"): "3, 0",
                            ("Hase", "Hase"): "2, 2",
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
                    ui.tags.h5("Erklärung", class_="card-title"),
                    ui.tags.p(
                        "Koordinationsspiel: Die effiziente Option lohnt sich nur, wenn beide mitmachen.",
                        class_="mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li("Zwei Nash-Gleichgewichte: (Hirsch, Hirsch) und (Hase, Hase)."),
                        ui.tags.li("Effizient aber riskant: (Hirsch, Hirsch)."),
                        ui.tags.li("Typisch: Vertrauen/Koordination als Schlüsselproblem."),
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
        ui.tags.h4("Ultimatumspiel", class_="mb-2"),
        ui.tags.div(
        ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h5("Beispielspiel", class_="card-title"),
                    ui.tags.p(
                        "Vereinfacht: Spieler 1 bietet fair (50/50) oder unfair (90/10). "
                        "Spieler 2 kann annehmen oder ablehnen.",
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
                    ui.tags.h5("Erklärung", class_="card-title"),
                    ui.tags.p(
                        "In der Standardtheorie nimmt Spieler 2 jedes positive Angebot an (Rückwärtsinduktion).",
                        class_="mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li("Theorie: Spieler 1 bietet minimal, Spieler 2 akzeptiert."),
                        ui.tags.li("Empirie: Unfaire Angebote werden oft abgelehnt (Fairness)."),
                        ui.tags.li("Wichtiges Beispiel für Modell vs. Verhalten."),
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
        ui.tags.h4("Kampf der Geschlechter", class_="mb-2"),
        ui.tags.div(
        ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.h5("Beispielspiel", class_="card-title"),
                    payoff_table(
                        rows=["Oper", "Fußball"],
                        cols=["Oper", "Fußball"],
                        payoff_strings={
                            ("Oper", "Oper"): "3, 2",
                            ("Oper", "Fußball"): "0, 0",
                            ("Fußball", "Oper"): "0, 0",
                            ("Fußball", "Fußball"): "2, 3",
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
                    ui.tags.h5("Erklärung", class_="card-title"),
                    ui.tags.p(
                        "Beide wollen sich koordinieren, aber bevorzugen unterschiedliche Aktivitäten.",
                        class_="mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li("Zwei reine Nash-Gleichgewichte: (Oper, Oper) und (Fußball, Fußball)."),
                        ui.tags.li("Verteilungsproblem: Wer bekommt sein Wunsch-Ergebnis?"),
                        ui.tags.li("Zusätzlich existiert ein gemischtes Nash-Gleichgewicht."),
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

    # ---------- Styles ----------
    ui.tags.style("""
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
    }
    body {
        padding-top: var(--header-height);
    }
    .nav-tabs {
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
    .nav-tabs .nav-link {
        color: rgb(87, 87, 86);
        font-weight: 700;
        background-color: transparent;
        border: none;
        font-size: 1.05rem;
    }
    .nav-tabs .nav-link:hover {
        color: #000000;
    }
    .nav-tabs .nav-link.active,
    .nav-tabs .nav-link:focus {
        color: #000000;
        background-color: transparent;
        border: none;
        box-shadow: none;
    }
    .tabs-toggle {
        display: none;
    }
    @media (max-width: 768px) {
        .container-fluid,
        .container,
        .container-fluid.px-4,
        .container.px-4 {
            padding-left: 0.1rem !important;
            padding-right: 0.1rem !important;
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
        .tabs-toggle {
            display: inline-flex;
            position: fixed;
            top: 0.5rem;
            left: 0.5rem;
            z-index: 1001;
        }
        .nav-tabs {
            display: none;
            flex-direction: column;
            align-items: stretch;
            gap: 6px;
        }
        body.tabs-open .nav-tabs {
            display: flex;
        }
        body.tabs-open .nav-tabs .nav-link {
            text-align: left;
        }
    }
    body {
        font-family: source-code-pro, Helvetica, sans-serif, Arial;
        margin: 0;
        background-color: #ffffff;
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
    .three-col-radios .shiny-options-group {
        display: grid;
        grid-template-columns: repeat(3, minmax(140px, 1fr));
        column-gap: 10px;
        row-gap: 10px;
    }
    .three-col-radios .form-check {
        margin: 0;
    }
    @media (max-width: 768px) {
        .three-col-radios .shiny-options-group {
            grid-template-columns: 1fr 1fr;
        }
    }

    /* Spacing between boxes + equal-height cards */
    .card-row,
    .exercise-row {
        display: flex;
        flex-wrap: wrap;
        row-gap: 12px;
        align-items: stretch;
    }
    .card-row {
        column-gap: 20px;
        margin-left: 0;
        margin-right: 0;
        padding-left: 0;
        padding-right: 0;
    }
    .exercise-row {
        column-gap: 8px;
    }
    .card-row > * {
        flex: 1 1 0;
        min-width: 280px;
        display: flex;
        flex-direction: column;
        height: 100%;
        margin-left: 0;
        margin-right: 0;
    }
    .card-row > * > .card {
        flex: 1 1 auto;
        height: 100%;
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
        margin-top: 16px;
        margin-bottom: 8px;
    }
    .exercise-title {
        margin-top: 16px;
        margin-bottom: 0px;
    }
    .text-muted{
        margin-bottom: -8px;
    }            
    .card-body {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
    }
    .exercise-row .card-body {
        padding-left: 1.4rem;
        padding-right: 1.4rem;
    }
    .exercise-notation-body {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
    }
    .exercise-notation-body ul {
        padding-left: 0.5rem;
        margin-left: 0.5rem;
    }
    .intro-example-body {
        padding-left: 1.4rem;
        padding-right: 1.4rem;
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
}

/* mobil: untereinander */
@media (max-width: 992px){
  .special-row{ flex-direction:column; }
  .special-col.game, .special-col.text{ flex: 1 1 auto; }
}
    """),
    ui.tags.script(
        """
        document.addEventListener('click', function (e) {
          var link = e.target.closest('.nav-tabs .nav-link');
          if (link) {
            document.body.classList.remove('tabs-open');
          }
        });
        """
    ),

    # ---------- Top navigation ----------
    ui.tags.button(
        "Menü",
        class_="btn btn-outline-secondary tabs-toggle mb-2",
        type="button",
        onclick="document.body.classList.toggle('tabs-open');",
    ),
    ui.navset_tab(

        # =================================================
        # Erklärung
        # =================================================
        ui.nav_panel(
            "Erklärung",
            ui.tags.div(
                ui.h2("Einführung: Normalformspiele", class_="intro-title"),
                ui.tags.p(
                    "Ein Normalformspiel beschreibt eine Situation, in der alle Spieler gleichzeitig "
                    "eine Strategie wählen und daraus Auszahlungen entstehen.",
                    class_="text-muted",
                ),

                # ---- Row 1: Three cards ----
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.h5("1) Spielermenge", class_="card-title"),
                            ui.tags.p(
                                "Die Spielermenge ist N = {1, 2}. "
                                "In allen Beispielen gibt es genau zwei Spieler.",
                                class_="mb-0",
                            ),
                            class_="card-body",
                        ),
                        class_="card shadow-sm h-100",
                        style="background-color:#ffffff;",
                    ),
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.h5("2) Strategiemengen", class_="card-title"),
                            ui.tags.p(
                                "Jeder Spieler verfügt über eine endliche Menge an Strategien, "
                                "aus denen er eine auswählt.",
                                class_="mb-0",
                            ),
                            class_="card-body",
                        ),
                        class_="card shadow-sm h-100",
                        style="background-color:#ffffff;",
                    ),
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.h5("3) Nutzenfunktionen", class_="card-title"),
                            ui.tags.p(
                                "Jeder Strategiekombination wird ein Nutzen zugeordnet. "
                                "Bei zwei Spielern schreibt man (u₁, u₂).",
                                class_="mb-0",
                            ),
                            class_="card-body",
                        ),
                        class_="card shadow-sm h-100",
                        style="background-color:#ffffff;",
                    ),
                    class_="row row-cols-1 row-cols-lg-3 g-4 mt-2 align-items-stretch card-row mb-4",
                ),

                # ---- Row 2: Example + notation (same card) ----
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Beispiel-Spiel", class_="card-title"),
                                ui.tags.p(
                                    "Spieler 1 wählt A oder B, Spieler 2 wählt X, Y oder Z. "
                                    "In jeder Zelle steht (u₁, u₂).",
                                    class_="text-muted mb-3",
                                ),
                                payoff_table(INTRO_ROWS, INTRO_COLS, INTRO_PAYOFFS),
                                class_="col-12 col-lg-7",
                            ),
                            ui.tags.div(
                                ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h5("Notation", class_="mb-2"),
                                        ui.tags.ul(
                                            ui.tags.li(ui.tags.code("N = {1, 2}"), ": Zwei Spieler (Spieler 1 und Spieler 2)."),
                                            ui.tags.li(ui.tags.code("S₁ = {A, B}"), ": Strategiemenge von Spieler 1."),
                                            ui.tags.li(ui.tags.code("S₂ = {X, Y, Z}"), ": Strategiemenge von Spieler 2."),
                                            ui.tags.li(ui.tags.code("s = (s₁, s₂)"), ": z.B. ", ui.tags.code("(A, Y)"), "."),
                                            ui.tags.li(ui.tags.code("u = (u₁, u₂)"), ": z.B. ", ui.tags.code("(2, 8)"), ": Auszahlung (Spieler 1, Spieler 2)."),
                                            class_="mb-0",
                                        ),
                                        class_="card-body",
                                    ),
                                    class_="card h-100",
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

                ui.input_action_button(
                    "start_exercise",
                    "Zu Übung 1",
                    class_="btn btn-primary mt-4",
                ),

                class_="container-fluid px-4",
            ),
            value="intro",
        ),

        # =================================================
        # Übung 1
        # =================================================
        ui.nav_panel(
            "Übung 1",
            ui.tags.div(
                ui.h2("Übung 1: Beste Antworten", class_="exercise-title"),

                ui.tags.div(
                    # ---- LEFT: Game ----
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Spiel", class_="card-title"),
                                ui.output_ui("game_table_1"),

                                ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h6("Notation"),
                                        ui.output_ui("notation_1"),
                                        class_="card-body py-2 exercise-notation-body",
                                    ),
                                    class_="card mt-3",
                                    style="background-color:#f7f7f7;",
                                ),

                                ui.tags.div(
                                    ui.input_action_button(
                                        "new_game_1",
                                        "Neues Spiel",
                                        class_="btn btn-outline-primary",
                                    ),
                                    ui.input_action_button(
                                        "help_1",
                                        "Hilfe",
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
                                ui.tags.h5("Frage", class_="card-title"),
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
                            ),

                                ui.input_action_button(
                                    "check_1",
                                    "Antwort prüfen",
                                    class_="btn btn-success mt-3",
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
                    "Zurück",
                    class_="btn btn-outline-secondary me-2 mt-4",
                ),
                ui.input_action_button(
                    "go_to_ex2",
                    "Weiter zu Übung 2",
                    class_="btn btn-primary mt-4",
                ),

                class_="container-fluid px-4 mt-3",
            ),
            value="ex1",
        ),

        # =================================================
        # Übung 2
        # =================================================
        ui.nav_panel(
            "Übung 2",
            ui.tags.div(
                ui.h2("Übung 2: Strikt dominante Strategien", class_="exercise-title"),

                ui.tags.div(
                    # ---- LEFT ----
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Spiel", class_="card-title"),
                                ui.output_ui("game_table_2"),

                                ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h6("Notation"),
                                        ui.output_ui("notation_2"),
                                        class_="card-body py-2 exercise-notation-body",
                                    ),
                                    class_="card mt-3",
                                    style="background-color:#f7f7f7;",
                                ),

                                ui.tags.div(
                                    ui.input_action_button(
                                        "new_game_2",
                                        "Neues Spiel",
                                        class_="btn btn-outline-primary",
                                    ),
                                    ui.input_action_button(
                                        "help_2",
                                        "Hilfe",
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
                                ui.tags.h5("Frage", class_="card-title"),
                                ui.tags.p(
                                    "Hat einer der Spieler (oder haben beide) eine strikt dominante Strategie?",
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
                                    "Antwort prüfen",
                                    class_="btn btn-success mt-3",
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
                "Zurück",
                class_="btn btn-outline-secondary me-2"
            ),
            ui.input_action_button(
                "go_to_ex3",
                "Weiter zu Übung 3",
                class_="btn btn-primary"
            ),
            class_="mt-4 text-start mb-3"
        ),
        class_="container-fluid px-4",
    ),
    value="ex2",
),
# Neuen Tab für Übung 3 einfügen
ui.nav_panel(
    "Übung 3",
    ui.tags.div(
        ui.h2("Übung 3: Dominante Strategien (schwach oder strikt)", class_="exercise-title"),
        ui.tags.div(
            # LEFT CARD: Spieltabelle und "Neues Spiel"-Button
            ui.tags.div(
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.h5("Spiel"),
                        ui.output_ui("game_table_3"),
                        ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h6("Notation"),
                                        ui.output_ui("notation_3"),
                                        class_="card-body py-2 exercise-notation-body",
                                    ),
                                    class_="card mt-3",
                                    style="background-color:#f7f7f7;",
                                ),
                        ui.tags.div(
                            ui.input_action_button(
                                "new_game_3",
                                "Neues Spiel",
                                class_="btn btn-outline-primary"
                            ),
                            ui.input_action_button(
                                "help_3",
                                "Hilfe",
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
                        ui.tags.h5("Frage"),
                        ui.tags.p(  # Feste Frage für Übung 3
                            "Hat einer der Spieler (oder haben beide) eine (strikt oder schwach) dominante Strategie?",
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
                            "Antwort prüfen",
                            class_="btn btn-success mt-3"
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
                "Zurück",
                class_="btn btn-outline-secondary me-2"
            ),
            ui.input_action_button(
                "go_to_ex4",
                "Weiter zu Übung 4",
                class_="btn btn-primary"
            ),
            class_="mt-4 text-start mb-3"
        ),
        class_="container-fluid px-4"
    ),
    value="ex3",
),
# Neuen Tab für Übung 4 einfügen
ui.nav_panel(
    "Übung 4",
    ui.tags.div(
        ui.h2("Übung 4: Nash-Gleichgewichte in reinen Strategien", class_="exercise-title"),
        ui.tags.div(
            # LEFT CARD: Spieltabelle + "Neues Spiel"
            ui.tags.div(
                ui.tags.div(
                    ui.tags.div(
                        ui.tags.h5("Spiel"),
                        ui.output_ui("game_table_4"),
                        ui.tags.div(
                                    ui.tags.div(
                        ui.tags.h6("Notation"),
                          ui.output_ui("notation_4"),
                                  class_="card-body py-2 exercise-notation-body",
                                ),
                                class_="card mt-3",
                                style="background-color:#f7f7f7;",
                                ),
                        ui.tags.div(
                            ui.input_action_button(
                                "new_game_4",
                                "Neues Spiel",
                                class_="btn btn-outline-primary"
                            ),
                            ui.input_action_button(
                                "help_4",
                                "Hilfe",
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
                        ui.tags.h5("Frage"),
                        ui.tags.p(
                            "Finden Sie alle Strategiepaare, die ein Nash-Gleichgewicht in reinen Strategien bilden.",
                            class_="mt-2 mb-4"
                        ),
                        ui.tags.div(
                            ui.input_checkbox_group(
                                "answer_4",
                                None,
                                choices=[f"({r},{c})" for r in P1_STRATS_EX2 for c in P2_STRATS_EX2]
                            ),
                            class_="two-col-radios"
                        ),
                        ui.input_action_button(
                            "check_4",
                            "Antwort prüfen",
                            class_="btn btn-success mt-3"
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
                "Zurück",
                class_="btn btn-outline-secondary me-2"
            ),
            ui.input_action_button(
                "go_to_ex5",
                "Weiter zu Übung 5",
                class_="btn btn-primary"
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
            "Übung 5",
            ui.tags.div(
                ui.h2("Übung 5: Nash-Gleichgewichte in reinen Strategien (strikt)", class_="exercise-title"),
                ui.tags.div(
                    # LEFT: Game table + Notation + Buttons
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Spiel", class_="card-title"),
                                ui.output_ui("game_table_5"),
                                ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h6("Notation"),
                                        ui.output_ui("notation_5"),
                                        class_="card-body py-2 exercise-notation-body",
                                    ),
                                    class_="card mt-3",
                                    style="background-color:#f7f7f7;",
                                ),
                                ui.tags.div(
                                    ui.input_action_button("new_game_5", "Neues Spiel", class_="btn btn-outline-primary"),
                                    ui.input_action_button("help_5", "Hilfe", class_="btn btn-outline-primary"),
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
                                ui.tags.h5("Frage", class_="card-title"),
                                ui.tags.p(
                                    "Finden Sie alle strikten Nash-Gleichgewichte in reinen Strategien.",
                                    class_="mt-2 mb-4",
                                ),
                                ui.tags.div(
                                    ui.input_checkbox_group(
                                        "answer_5",
                                        None,
                                        choices=[f"({r},{c})" for r in P1_STRATS_EX2 for c in P2_STRATS_EX2],
                                    ),
                                    class_="two-col-radios",
                                ),
                                ui.input_action_button("check_5", "Antwort prüfen", class_="btn btn-success mt-3"),
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
                    ui.input_action_button("go_back_ex4", "Zurück", class_="btn btn-outline-secondary me-2"),
                    ui.input_action_button("go_to_ex6", "Weiter zu Übung 6", class_="btn btn-primary"),
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
            "Übung 6",
            ui.tags.div(
                ui.h2("Übung 6: Nash-Gleichgewicht in gemischten Strategien", class_="exercise-title"),
                ui.tags.div(
                    # LEFT: Game table + Notation + Buttons
                    ui.tags.div(
                        ui.tags.div(
                            ui.tags.div(
                                ui.tags.h5("Spiel", class_="card-title"),
                                ui.output_ui("game_table_6"),
                                ui.tags.div(
                                    ui.tags.div(
                                        ui.tags.h6("Notation"),
                                        ui.output_ui("notation_6"),
                                        class_="card-body py-2 exercise-notation-body",
                                    ),
                                    class_="card mt-3",
                                    style="background-color:#f7f7f7;",
                                ),
                                ui.tags.div(
                                    ui.input_action_button("new_game_6", "Neues Spiel", class_="btn btn-outline-primary"),
                                    ui.input_action_button("help_6", "Hilfe", class_="btn btn-outline-primary"),
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
                                ui.tags.h5("Frage", class_="card-title"),
                                ui.tags.p(
                                    "Finden Sie ein Nash-Gleichgewicht in gemischten Strategien, in dem Spieler 1 mit Wahrscheinlichkeit p Strategie A wählt. Wie groß ist p?",
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
                                ui.input_action_button("check_6", "Antwort prüfen", class_="btn btn-success mt-3"),
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
                    ui.input_action_button("go_back_ex5", "Zurück", class_="btn btn-outline-secondary"),
                    ui.input_action_button("go_to_special_games", "Zu besonderen Spielen", class_="btn btn-primary"),
                    class_="mt-4 text-start mb-3",
                ),
                class_="container-fluid px-4",
            ),
            value="ex6",
        ),
        
        # =========================
        # BESONDERE SPIELE (READ ONLY)
        # =========================
        ui.nav_panel(
            "Besondere Spiele",
            ui.tags.div(
                ui.h2("Besondere Spiele der Spieltheorie", class_="exercise-title"),
                ui.tags.p(
                    "Links jeweils ein Beispielspiel (Auszahlungen (u₁, u₂)), "
                    "rechts die zentrale Idee und typische Ergebnisse.",
                    class_="text-muted mb-4",
                ),
                *SPECIAL_GAMES_ROWS,
                class_="container-fluid px-4",
            ),
            value="special_games",
        ),

        id="tabs",
    ),
)


# =========================================================
# SERVER
# =========================================================
def server(input, output, session):
    # -------- Intro and navigation events --------
    @reactive.effect
    @reactive.event(input.start_exercise)
    def _go_to_exercise():
        ui.update_navset("tabs", selected="ex1")
    @reactive.effect
    @reactive.event(input.go_to_ex2)
    def _go_to_ex2():
        ui.update_navset("tabs", selected="ex2")
    @reactive.effect
    @reactive.event(input.go_to_ex3)
    def _go_to_ex3():
        ui.update_navset("tabs", selected="ex3")
    @reactive.effect
    @reactive.event(input.go_to_ex4)
    def _go_to_ex4():
        ui.update_navset("tabs", selected="ex4")
    @reactive.effect
    @reactive.event(input.go_to_ex5)
    def _go_to_ex5():
        ui.update_navset("tabs", selected="ex5")
    @reactive.effect
    @reactive.event(input.go_to_ex6)
    def _go_to_ex6():
        ui.update_navset("tabs", selected="ex6")
    @reactive.effect
    @reactive.event(input.go_to_special_games)
    def _go_to_special_games():
        ui.update_navset("tabs", selected="special_games")
    @reactive.effect
    @reactive.event(input.go_back_ex1)
    def _go_back_ex1():
        ui.update_navset("tabs", selected="ex1")
    @reactive.effect
    @reactive.event(input.go_back_ex2)
    def _go_back_ex2():
        ui.update_navset("tabs", selected="ex2")
    @reactive.effect
    @reactive.event(input.go_back_ex3)
    def _go_back_ex3():
        ui.update_navset("tabs", selected="ex3")
    @reactive.effect
    @reactive.event(input.go_back_ex4)
    def _go_back_ex4():
        ui.update_navset("tabs", selected="ex4")
    @reactive.effect
    @reactive.event(input.go_back_ex5)
    def _go_back_ex5():
        ui.update_navset("tabs", selected="ex5")

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
        return payoff_table(P1_STRATS_EX1, P2_STRATS_EX1, payoff_strings_from_tuple_payoffs(game1.get()))

    @output
    @render.ui
    def notation_1():
        return notation_ul(P1_STRATS_EX1, P2_STRATS_EX1, game1.get())

    @output
    @render.ui
    def question_text_1():
        q = q1.get()
        responder = q["responder"]
        opp = q["opp"]

        if responder == 1:
            ui.update_radio_buttons("answer_1", choices=all_subset_labels(P1_STRATS_EX1), selected=None)
            return ui.tags.p(
                ["Wenn Spieler 2 ", ui.tags.strong(opp),
                 " spielt, welche Strategie(n) ist/sind die beste Antwort(en) für Spieler 1?"],
                class_="mt-2 mb-4",
            )
        else:
            ui.update_radio_buttons("answer_1", choices=all_subset_labels(P2_STRATS_EX1), selected=None)
            return ui.tags.p(
                ["Wenn Spieler 1 ", ui.tags.strong(opp),
                 " spielt, welche Strategie(n) ist/sind die beste Antwort(en) für Spieler 2?"],
                class_="mt-2 mb-4",
            )

    @output
    @render.ui
    def help_text_1():
        if not show_help1.get():
            return ui.tags.div()
        return ui.tags.div(
            ui.tags.div(
                ui.tags.p(
                    "Beste Antwort: Wähle die Strategie, die dir bei gegebener Gegenspieler-Strategie den höchsten eigenen Nutzen bringt.",
                    class_="text-muted help-text mt-2 mb-0",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def feedback_1():
        if not show_fb1.get():
            return ui.tags.div()

        if input.answer_1() is None or input.answer_1() in ("— bitte warten —", ""):
            return ui.tags.div("Bitte wähle zuerst eine Antwort aus.", class_="alert alert-warning mt-3")

        payoffs = game1.get()
        q = q1.get()
        responder = q["responder"]
        opp = q["opp"]

        correct_set = best_response_set(payoffs, responder, opp)
        correct_label = subset_label(P1_STRATS_EX1 if responder == 1 else P2_STRATS_EX1, correct_set)

        if input.answer_1() == correct_label:
            return ui.tags.div(f"✅ Richtig! {correct_label} ist/sind die beste(n) Antwort(en).", class_="alert alert-success mt-3")
        else:
            return ui.tags.div(f"❌ Falsch. Richtig ist: {correct_label}.", class_="alert alert-danger mt-3")

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
        # Update choices when game is shown/updated
        ui.update_radio_buttons("answer_2", choices=dominance_choices(P1_STRATS_EX2, P2_STRATS_EX2), selected=None)
        return payoff_table(P1_STRATS_EX2, P2_STRATS_EX2, payoff_strings_from_tuple_payoffs(game2.get()))

    @output
    @render.ui
    def notation_2():
        return notation_ul(P1_STRATS_EX2, P2_STRATS_EX2, game2.get())

    @output
    @render.ui
    def help_text_2():
        if not show_help2.get():
            return ui.tags.div()
        return ui.tags.div(
            ui.tags.div(
                ui.tags.p(
                    "Strikt dominant: Eine Strategie ist in jeder Situation strikt besser als alle anderen Strategien.",
                    class_="text-muted help-text mt-2 mb-0",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def feedback_2():
        if not show_fb2.get():
            return ui.tags.div()

        if input.answer_2() is None or input.answer_2() in ("— bitte warten —", ""):
            return ui.tags.div("Bitte wähle zuerst eine Antwort aus.", class_="alert alert-warning mt-3")

        payoffs = game2.get()
        correct_label, r_dom, c_dom = correct_dominance_label(payoffs)
        expl = dominance_explanation(r_dom, c_dom)

        if input.answer_2() == correct_label:
            return ui.tags.div(
                ui.tags.div(f"✅ Richtig! {correct_label}.", class_="fw-semibold"),
                ui.tags.div(expl, class_="mt-2"),
                class_="alert alert-success mt-3",
            )
        else:
            return ui.tags.div(
                ui.tags.div(f"❌ Falsch. Richtig ist: {correct_label}.", class_="fw-semibold"),
                ui.tags.div(expl, class_="mt-2"),
                class_="alert alert-danger mt-3",
            )


    # -------- Navigation Weiter-Buttons --------
    @reactive.effect
    @reactive.event(input.go_to_ex2)
    def _go_to_ex2():
        ui.update_navset("tabs", selected="ex2")

    @reactive.effect
    @reactive.event(input.go_back_intro)
    def _go_back_intro():
        ui.update_navset("tabs", selected="intro")

    @reactive.effect
    @reactive.event(input.go_back_ex1)
    def _go_back_ex1():
        ui.update_navset("tabs", selected="ex1")

    @reactive.effect
    @reactive.event(input.go_back_ex2)
    def _go_back_ex2():
        ui.update_navset("tabs", selected="ex2")

    @reactive.effect
    @reactive.event(input.go_back_ex3)
    def _go_back_ex3():
        ui.update_navset("tabs", selected="ex3")

    @reactive.effect
    @reactive.event(input.go_to_ex3)
    def _go_to_ex3():
        ui.update_navset("tabs", selected="ex3")

    @reactive.effect
    @reactive.event(input.go_to_ex4)
    def _go_to_ex4():
        ui.update_navset("tabs", selected="ex4")

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
        # Aktualisiere die Auswahlmöglichkeiten für die Antwort, wenn ein neues Spiel geladen wird
        ui.update_radio_buttons("answer_3",
            choices=dominance_choices(P1_STRATS_EX2, P2_STRATS_EX2),
            selected=None
        )
        return payoff_table(P1_STRATS_EX2, P2_STRATS_EX2,
                             payoff_strings_from_tuple_payoffs(game3.get()))

    @output
    @render.ui
    def notation_3():
        return notation_ul(P1_STRATS_EX2, P2_STRATS_EX2, game3.get())

    @output
    @render.ui
    def help_text_3():
        if not show_help3.get():
            return ui.tags.div()

        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong("Ziel: "),
                        "Prüfe, ob ein Spieler eine dominante Strategie hat (strikt oder schwach).",
                        class_="text-muted mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li(
                            ui.tags.strong("Strikt dominant: "),
                            "Eine Strategie sᵢ ist strikt dominant, wenn sie gegen jede gegnerische Strategie "
                            "immer einen strikt höheren Nutzen liefert als jede andere eigene Strategie."
                        ),
                        ui.tags.li(
                            ui.tags.strong("Schwach dominant: "),
                            "Eine Strategie sᵢ ist schwach dominant, wenn sie gegen jede gegnerische Strategie "
                            "mindestens so gut ist wie jede andere eigene Strategie, und gegen mindestens eine gegnerische Strategie "
                            "echt besser als jede Alternative."
                        ),
                        ui.tags.li(
                            ui.tags.strong("Vorgehen: "),
                            "Vergleiche für Spieler 1 zeilenweise die u₁-Werte (A/B/C/D) spaltenweise (X/Y/Z). "
                            "Für Spieler 2 vergleichst du spaltenweise die u₂-Werte zeilenweise."
                        ),
                        ui.tags.li(
                            ui.tags.strong("Wichtig: "),
                            "Pro Spieler kann es höchstens eine dominante Strategie geben."
                        ),
                        class_="text-muted mb-0",
                    ),
                    class_="mt-2",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def feedback_3():
        if not show_fb3.get():
            return ui.tags.div()  # noch kein Feedback anzeigen

        if input.answer_3() is None or input.answer_3() in ("— bitte warten —", ""):
            # Keine Antwort ausgewählt
            return ui.tags.div("Bitte wähle zuerst eine Antwort aus.",
                               class_="alert alert-warning mt-3")

        payoffs = game3.get()
        correct_label, r_dom, r_type, c_dom, c_type = correct_dominance_label_weak(payoffs)
        explanation = dominance_explanation_weak(r_dom, r_type, c_dom, c_type)

        if input.answer_3() == correct_label:
            # Richtige Antwort gewählt
            return ui.tags.div(
                ui.tags.div(f"✅ Richtig! {correct_label}.", class_="fw-semibold"),
                ui.tags.div(explanation, class_="mt-2"),
                class_="alert alert-success mt-3"
            )
        else:
            # Falsche Antwort -> richtige Lösung und Erklärung anzeigen
            return ui.tags.div(
                ui.tags.div(f"❌ Falsch. Richtig ist: {correct_label}.", class_="fw-semibold"),
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
        # (Optionale Wahl: Auswahl zurücksetzen/aktualisieren - hier statisch, daher nicht zwingend)
        ui.update_checkbox_group("answer_4",
            choices=[f"({r},{c})" for r in P1_STRATS_EX2 for c in P2_STRATS_EX2],
            selected=None
        )
        return payoff_table(P1_STRATS_EX2, P2_STRATS_EX2,
                             payoff_strings_from_tuple_payoffs(game4.get()))

    @output
    @render.ui
    def notation_4():
        return notation_ul(P1_STRATS_EX2, P2_STRATS_EX2, game4.get())

    @output
    @render.ui
    def help_text_4():
        if not show_help4.get():
            return ui.tags.div()

        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong("Definition: "),
                        "Ein Strategieprofil (r, c) ist ein Nash-Gleichgewicht in reinen Strategien, "
                        "wenn keiner der Spieler sich durch einseitiges Abweichen strikt verbessern kann.",
                        class_="text-muted mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li(
                            ui.tags.strong("Beste Antwort Spieler 1: "),
                            "Für eine feste Spalte c (Strategie von Spieler 2) ist eine Zeile r eine beste Antwort, "
                            "wenn u₁(r,c) maximal über alle Zeilen ist."
                        ),
                        ui.tags.li(
                            ui.tags.strong("Beste Antwort Spieler 2: "),
                            "Für eine feste Zeile r (Strategie von Spieler 1) ist eine Spalte c eine beste Antwort, "
                            "wenn u₂(r,c) maximal über alle Spalten ist."
                        ),
                        ui.tags.li(
                            ui.tags.strong("Nash-Kriterium: "),
                            "(r,c) ist Nash ⇔ r ist beste Antwort auf c UND c ist beste Antwort auf r."
                        ),
                        ui.tags.li(
                            ui.tags.strong("Praktischer Tipp: "),
                            "Markiere zuerst alle besten Antworten von Spieler 1 pro Spalte, dann alle besten Antworten von Spieler 2 pro Zeile. "
                            "Schnittpunkte sind Nash-Gleichgewichte."
                        ),
                        class_="text-muted mb-0",
                    ),
                    class_="mt-2",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def feedback_4():
        if not show_fb4.get():
            return ui.tags.div()

        # Auswahl der Checkboxen (Liste der angekreuzten Kombinationen)
        chosen = set(input.answer_4() or [])
        payoffs = game4.get()
        actual_ne = find_nash_equilibria(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)
        actual_set = {f"({r},{c})" for (r, c) in actual_ne}

        # Bestimme Text für die korrekte Lösung:
        if len(actual_set) == 0:
            correct_text = "Es gibt kein Nash-Gleichgewicht in reinen Strategien"
        elif len(actual_set) == 1:
            combo = list(actual_set)[0]
            correct_text = f"{combo} ist ein Nash-Gleichgewicht in reinen Strategien"
        else:
            # mehrere Gleichgewichte
            combos = sorted(list(actual_set))
            # Verbinde die Kombinationsliste mit Kommas und "und"
            if len(combos) == 2:
                correct_text = f"{combos[0]} und {combos[1]} sind Nash-Gleichgewichte in reinen Strategien"
            else:
                correct_text = (", ".join(combos[:-1]) + " und " + combos[-1] +
                                " sind Nash-Gleichgewichte in reinen Strategien")

        # Feedback je nach Richtigkeit der Auswahl:
        if chosen == actual_set:
            # Alle richtigen und keine falschen ausgewählt
            expl = ""
            if len(actual_set) >= 1:
                expl = "Bei jeder anderen Strategiekombination kann sich mindestens einer der Spieler durch einseitiges Abweichen strikt verbessern."
            else:
                expl = "Bei jeder Strategiekombination kann sich mindestens ein Spieler strikt verbessern."
            return ui.tags.div(
                ui.tags.div(f"✅ Richtig! {correct_text}.", class_="fw-semibold"),
                ui.tags.div(expl, class_="mt-2"),
                class_="alert alert-success mt-3"
            )
        else:
            # Falsche oder unvollständige Auswahl
            expl = ""
            if len(actual_set) >= 1:
                expl = "Bei jeder anderen Strategiekombination kann sich mindestens einer der Spieler durch einseitiges Abweichen strikt verbessern."
            else:
                expl = "Bei jeder Strategiekombination kann sich mindestens ein Spieler strikt verbessern."
            # Hinweis: "Richtig ist/sind" je nach Anzahl:
            richtig_prefix = "Richtig sind: " if len(actual_set) > 1 else "Richtig ist: "
            return ui.tags.div(
                ui.tags.div(f"❌ Falsch. {richtig_prefix}{correct_text}.", class_="fw-semibold"),
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
        ui.update_checkbox_group("answer_5", selected=None)
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
        return payoff_table(P1_STRATS_EX2, P2_STRATS_EX2, payoff_strings_from_tuple_payoffs(game5.get()))

    @output
    @render.ui
    def notation_5():
        return notation_ul(P1_STRATS_EX2, P2_STRATS_EX2, game5.get())

    @output
    @render.ui
    def help_text_5():
        if not show_help5.get():
            return ui.tags.div()

        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong("Ziel: "),
                        "Für jedes Profil (r,c) entscheide: kein Nash / Nash aber nicht strikt / strikt Nash.",
                        class_="text-muted mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li(
                            ui.tags.strong("Nash (nicht strikt): "),
                            "(r,c) ist Nash, wenn kein Spieler durch einseitiges Abweichen einen strikt höheren Nutzen bekommt. "
                            "Es dürfen auch andere Strategien gleich gut sein (Indifferenz)."
                        ),
                        ui.tags.li(
                            ui.tags.strong("Strikt Nash: "),
                            "(r,c) ist strikt Nash, wenn beide Spieler dort eine strikt beste Antwort spielen, also eindeutig (ohne Gleichstand)."
                        ),
                        ui.tags.li(
                            ui.tags.strong("So prüfst du Spieler 1: "),
                            "Fixiere c. Vergleiche u₁(·,c). "
                            "Nash braucht: u₁(r,c) ist maximal. Strikt Nash braucht: u₁(r,c) ist strikt größer als alle anderen."
                        ),
                        ui.tags.li(
                            ui.tags.strong("So prüfst du Spieler 2: "),
                            "Fixiere r. Vergleiche u₂(r,·). "
                            "Nash braucht: u₂(r,c) ist maximal. Strikt Nash braucht: u₂(r,c) ist strikt größer als alle anderen."
                        ),
                        class_="text-muted mb-0",
                    ),
                    class_="mt-2",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def feedback_5():
        if not show_fb5.get():
            return ui.tags.div()
        chosen = set(input.answer_5() or [])
        payoffs = game5.get()
        actual_ne = find_nash_equilibria(payoffs, P1_STRATS_EX2, P2_STRATS_EX2)
        strict_set = set()
        for (r, c) in actual_ne:
            if all(payoffs[(r, c)][0] > payoffs[(r2, c)][0] for r2 in P1_STRATS_EX2 if r2 != r) and \
               all(payoffs[(r, c)][1] > payoffs[(r, c2)][1] for c2 in P2_STRATS_EX2 if c2 != c):
                strict_set.add(f"({r},{c})")
        chosen_set = set(chosen)
        # Compose feedback text
        if chosen_set == strict_set:
            # Correct selection
            if len(strict_set) == 0:
                correct_text = "Kein striktes Nash-Gleichgewicht vorhanden"
            elif len(strict_set) == 1:
                combo = list(strict_set)[0]
                correct_text = f"{combo} ist ein striktes Nash-Gleichgewicht"
            else:
                combos = sorted(strict_set)
                if len(combos) == 2:
                    correct_text = f"{combos[0]} und {combos[1]} sind strikte Nash-Gleichgewichte"
                else:
                    correct_text = (", ".join(combos[:-1]) + " und " + combos[-1] + " sind strikte Nash-Gleichgewichte")
            expl = ""
            if len(strict_set) == 0:
                expl = "In jedem Nash-Gleichgewicht dieses Spiels hat mindestens ein Spieler eine alternative Strategie, die ihm die gleiche Auszahlung bietet."
            else:
                expl = "Bei allen anderen Strategiekombinationen kann sich mindestens ein Spieler durch einseitiges Abweichen strikt verbessern."
            return ui.tags.div(
                ui.tags.div(f"✅ Richtig! {correct_text}.", class_="fw-semibold"),
                ui.tags.div(expl, class_="mt-2"),
                class_="alert alert-success mt-3",
            )
        else:
            # Incorrect or incomplete selection
            if len(strict_set) == 0:
                correct_text = "kein striktes Nash-Gleichgewicht vorhanden"
            elif len(strict_set) == 1:
                correct_text = list(strict_set)[0]
            else:
                combos = sorted(strict_set)
                if len(combos) == 2:
                    correct_text = f"{combos[0]} und {combos[1]}"
                else:
                    correct_text = (", ".join(combos[:-1]) + " und " + combos[-1])
            expl = ""
            if len(strict_set) == 0:
                expl = "In jedem Nash-Gleichgewicht dieses Spiels hat mindestens ein Spieler eine alternative Strategie, die ihm keine geringere Auszahlung bringt."
            else:
                expl = "Bei allen anderen Strategiekombinationen kann sich mindestens ein Spieler durch einseitiges Abweichen strikt verbessern."
            prefix = "Richtig ist: " if len(strict_set) <= 1 else "Richtig sind: "
            return ui.tags.div(
                ui.tags.div(f"❌ Falsch. {prefix}{correct_text}.", class_="fw-semibold"),
                ui.tags.div(expl, class_="mt-2"),
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
        return payoff_table(P1_STRATS_EX6, P2_STRATS_EX6, payoff_strings_from_tuple_payoffs(game6.get()))

    @output
    @render.ui
    def notation_6():
        return notation_ul(P1_STRATS_EX6, P2_STRATS_EX6, game6.get())

    @output
    @render.ui
    def help_text_6():
        if not show_help6.get():
            return ui.tags.div()

        return ui.tags.div(
            ui.tags.div(
                ui.tags.div(
                    ui.tags.p(
                        ui.tags.strong("Idee: "),
                        "In einem gemischten Nash-Gleichgewicht wählt Spieler 1 A mit Wahrscheinlichkeit p, "
                        "sodass Spieler 2 zwischen X und Y indifferent ist.",
                        class_="text-muted mb-2",
                    ),
                    ui.tags.ul(
                        ui.tags.li(
                            ui.tags.strong("Indifferenzbedingung (für Spieler 2): "),
                            "Erwarteter Nutzen aus X = Erwarteter Nutzen aus Y."
                        ),
                        ui.tags.li(
                            ui.tags.code("p·u₂(A,X) + (1−p)·u₂(B,X) = p·u₂(A,Y) + (1−p)·u₂(B,Y)")
                        ),
                        ui.tags.li(
                            ui.tags.strong("Löse nach p: "),
                            "Bringe alle p-Terme auf eine Seite und forme zu p = Zähler / Nenner um."
                        ),
                        ui.tags.li(
                            ui.tags.strong("Warum das funktioniert: "),
                            "Wenn Spieler 2 indifferent ist, ist es für ihn optimal zu mischen, damit kann Spieler 1 p so wählen, "
                            "dass Spieler 2 keinen Anreiz hat, seine reine Strategie zu ändern."
                        ),
                        class_="text-muted mb-0",
                    ),
                    class_="mt-2",
                ),
                class_="card-body py-2 exercise-notation-body",
            ),
            class_="card mt-3",
            style="background-color:#f7f7f7;",
        )

    @output
    @render.ui
    def feedback_6():
        if not show_fb6.get():
            return ui.tags.div()
        if input.answer_6() is None or input.answer_6() == "":
            return ui.tags.div(
                "Bitte wähle zuerst eine Antwort aus.", class_="alert alert-warning mt-3"
            )
        payoffs = game6.get()
        a = payoffs[("A", "X")][1] - payoffs[("A", "Y")][1]
        b = payoffs[("B", "Y")][1] - payoffs[("B", "X")][1]
        if a + b == 0:
            return ui.tags.div("Keine eindeutige Lösung für p.", class_="alert alert-warning mt-3")
        
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
        expl = "Damit ist Spieler 2 indifferent zwischen X und Y."
        if input.answer_6() == correct_frac:
            return ui.tags.div(
                f"✅ Richtig! p = {correct_frac}. Damit ist Spieler 2 indifferent zwischen X und Y.",
                class_="alert alert-success mt-3"
            )
        else:
            return ui.tags.div(
                f"❌ Falsch. Richtig ist: p = {correct_frac}.",
                class_="alert alert-danger mt-3"
            )

app = App(app_ui, server)
