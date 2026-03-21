import { useEffect, useMemo, useRef, useState } from "react";

const NODE_W = 170;
const NODE_H = 88;

const initialGame = {
  root: "n0",
  players: ["P1", "P2"],
  nodes: [
    {
      id: "n0",
      node_type: "decision",
      player: "P1",
      actions: [
        { id: "a", label: "Left", child: "n1" },
        { id: "b", label: "Right", child: "n2" }
      ]
    },
    { id: "n1", node_type: "terminal", payoff: { by_player: { P1: 2, P2: 1 } } },
    { id: "n2", node_type: "terminal", payoff: { by_player: { P1: 3, P2: 0 } } }
  ]
};

const INTRO_NORMAL = {
  rows: ["A", "B"],
  cols: ["X", "Y", "Z"],
  payoffs: {
    "A|X": [4, 4],
    "A|Y": [2, 8],
    "A|Z": [7, 7],
    "B|X": [5, 4],
    "B|Y": [5, 9],
    "B|Z": [1, 3]
  }
};

function buildEliminatorPreset(targetRow, targetCol, variant) {
  const rows = ["A", "B", "C"];
  const cols = ["X", "Y", "Z"];
  const otherRows = rows.filter((r) => r !== targetRow);
  const otherCols = cols.filter((c) => c !== targetCol);

  const rowOrder = variant % 2 === 0 ? [targetRow, otherRows[0], otherRows[1]] : [targetRow, otherRows[1], otherRows[0]];
  const colOrder = variant % 3 === 0 ? [targetCol, otherCols[1], otherCols[0]] : [targetCol, otherCols[0], otherCols[1]];

  const rowRank = {
    [rowOrder[0]]: 3,
    [rowOrder[1]]: 2,
    [rowOrder[2]]: 1
  };
  const colRank = {
    [colOrder[0]]: 3,
    [colOrder[1]]: 2,
    [colOrder[2]]: 1
  };

  const payoffs = {};
  rows.forEach((row, rowIndex) => {
    cols.forEach((col, colIndex) => {
      const u1 = rowRank[row] * 4 + colIndex + (variant % 2);
      const u2 = colRank[col] * 4 + rowIndex + ((variant + 1) % 2);
      payoffs[`${row}|${col}`] = [u1, u2];
    });
  });

  return {
    rows,
    cols,
    payoffs,
    neKey: `${targetRow}|${targetCol}`
  };
}

function buildEliminatorPresets() {
  const targets = [
    ["A", "X"],
    ["B", "Y"],
    ["C", "Z"],
    ["A", "Y"],
    ["B", "Z"],
    ["C", "X"],
    ["A", "Z"],
    ["B", "X"],
    ["C", "Y"],
    ["A", "X"],
    ["B", "Y"],
    ["C", "Z"],
    ["A", "Y"],
    ["B", "Z"],
    ["C", "X"],
    ["A", "Z"],
    ["B", "X"],
    ["C", "Y"],
    ["A", "X"],
    ["B", "Y"]
  ];
  return targets.map(([row, col], index) => buildEliminatorPreset(row, col, index));
}

const ELIMINATOR_PRESETS = buildEliminatorPresets();
const BEST_RESPONSE_ROWS = ["A", "B", "C"];
const BEST_RESPONSE_COLS = ["X", "Y", "Z"];
const EXERCISE_PROGRESS_KEY = "gt-exercise-progress-v1";
const EXERCISE_RECENT_ATTEMPTS_LIMIT = 12;
const THEME_MODE_KEY = "gt-theme-mode-v1";
const THEME_MODES = ["light", "dark", "jlu"];

const INTRO_BAYES_T1 = {
  rows: ["A", "B"],
  cols: ["X", "Y"],
  payoffs: {
    "A|X": [4, 3],
    "A|Y": [2, 5],
    "B|X": [5, 2],
    "B|Y": [1, 4]
  }
};

const INTRO_BAYES_T2 = {
  rows: ["A", "B"],
  cols: ["X", "Y"],
  payoffs: {
    "A|X": [6, 2],
    "A|Y": [1, 3],
    "B|X": [3, 4],
    "B|Y": [2, 1]
  }
};

const BAYES_EX2A_AC = {
  rows: ["A", "B"],
  cols: ["X", "Y"],
  payoffs: {
    "A|X": [5, 3],
    "A|Y": [4, 7],
    "B|X": [6, 4],
    "B|Y": [2, 3]
  }
};

const BAYES_EX2A_AD = {
  rows: ["A", "B"],
  cols: ["X", "Y"],
  payoffs: {
    "A|X": [5, 7],
    "A|Y": [2, 3],
    "B|X": [8, 5],
    "B|Y": [2, 2]
  }
};

const BAYES_EX2A_BC = {
  rows: ["A", "B"],
  cols: ["X", "Y"],
  payoffs: {
    "A|X": [5, 7],
    "A|Y": [4, 6],
    "B|X": [5, 3],
    "B|Y": [8, 5]
  }
};

const BAYES_EX2A_BD = {
  rows: ["A", "B"],
  cols: ["X", "Y"],
  payoffs: {
    "A|X": [7, 2],
    "A|Y": [8, 1],
    "B|X": [6, 3],
    "B|Y": [2, 8]
  }
};

const SPECIAL_GAMES = [
  {
    title: "Gefangenendilemma",
    intro: "Jeder Spieler hat unabhängig vom Verhalten des anderen einen Anreiz zu defektieren.",
    table: {
      rows: ["Kooperieren", "Defektieren"],
      cols: ["Kooperieren", "Defektieren"],
      payoffs: {
        "Kooperieren|Kooperieren": [3, 3],
        "Kooperieren|Defektieren": [0, 5],
        "Defektieren|Kooperieren": [5, 0],
        "Defektieren|Defektieren": [1, 1]
      }
    },
    bullets: [
      "Defektieren ist strikt dominant für beide Spieler.",
      "Einziges Nash-Gleichgewicht: (Defektieren, Defektieren).",
      "Pareto-ineffiziente Nutzenkombination im Nash-Gleichgewicht: (1, 1) wird von (3, 3) Pareto-dominiert."
    ]
  },
  {
    title: "Feiglingsspiel (Chicken)",
    intro: "Beide wollen nicht ausweichen, aber ein Zusammenstoß ist katastrophal.",
    table: {
      rows: ["Ausweichen", "Geradeaus"],
      cols: ["Ausweichen", "Geradeaus"],
      payoffs: {
        "Ausweichen|Ausweichen": [2, 2],
        "Ausweichen|Geradeaus": [1, 3],
        "Geradeaus|Ausweichen": [3, 1],
        "Geradeaus|Geradeaus": [0, 0]
      }
    },
    bullets: [
      "Zwei Nash-Gleichgewichte: (Geradeaus, Ausweichen) und (Ausweichen, Geradeaus).",
      "Kein Spieler hat eine strikt dominante Strategie.",
      "Es entsteht ein (Anti-)Koordinationsproblem. (Falls Kommunikation außerhalb des Spiels möglich wäre, können Commitment / glaubwürdige Drohungen relevant sein.)"
    ]
  },
  {
    title: "Jagdspiel (Stag Hunt)",
    intro: "Koordinationsspiel, bei dem die Pareto-effiziente Nutzenkombination nur erreicht wird, wenn beide mitmachen und Fehlkoordination hierauf schmerzlicher ist.",
    table: {
      rows: ["Hirsch", "Hase"],
      cols: ["Hirsch", "Hase"],
      payoffs: {
        "Hirsch|Hirsch": [4, 4],
        "Hirsch|Hase": [0, 3],
        "Hase|Hirsch": [3, 0],
        "Hase|Hase": [2, 2]
      }
    },
    bullets: [
      "Zwei Nash-Gleichgewichte: (Hirsch, Hirsch) und (Hase, Hase).",
      "Pareto-effizient aber riskant: (Hirsch, Hirsch).",
      "Typisch: Vertrauen/Koordination als Schlüsselproblem."
    ]
  },
  {
    title: "Kampf der Geschlechter",
    intro: "Beide wollen sich koordinieren, aber bevorzugen unterschiedliche Aktivitäten.",
    table: {
      rows: ["Oper", "Fußball"],
      cols: ["Oper", "Fußball"],
      payoffs: {
        "Oper|Oper": [3, 2],
        "Oper|Fußball": [0, 0],
        "Fußball|Oper": [0, 0],
        "Fußball|Fußball": [2, 3]
      }
    },
    bullets: [
      "Zwei reine Nash-Gleichgewichte in reinen Strategen: (Oper, Oper) und (Fußball, Fußball).",
      "Koordinationsproblem: Wer bekommt sein Wunschergebnis?",
      "Zusätzlich existiert ein Nash-Gleichgewicht in gemischten Strategien: ((3/5,2/5), (3/5,2/5))."
    ]
  },
  {
    title: "Ultimatumspiel (Variante mit simultaner Entscheidung)",
    intro: "Vereinfacht: Spieler 1 bietet fair (50/50) oder unfair (90/10). Spieler 2 kann annehmen oder ablehnen.",
    table: {
      rows: ["Fair", "Unfair"],
      cols: ["Annehmen", "Ablehnen"],
      payoffs: {
        "Fair|Annehmen": [5, 5],
        "Fair|Ablehnen": [0, 0],
        "Unfair|Annehmen": [9, 1],
        "Unfair|Ablehnen": [0, 0]
      }
    },
    bullets: [
      "Nash-Gleichgewicht: (Unfair, Annehmen)",
      "Empirie mit monetärer Auszahlung der „Nutzenwerte“ (Achtung: dann evtl. von den Auszahlungen abweichende Bewertung der Strategiekombinationen durch die Spieler): Unfaire Angebote werden oft abgelehnt (Fairness).",
      "Wichtiges Beispiel für Modell vs. Verhalten bzw. für Nutzen ungleich monetäre Auszahlung."
    ]
  }
];

const SPECIAL_GAME_TRANSLATIONS = {
  Gefangenendilemma: {
    title: "Prisoner's dilemma",
    intro: "Each player has an incentive to defect regardless of the other player's action.",
    bullets: [
      "Defecting is strictly dominant for both players.",
      "Unique Nash equilibrium: (Defect, Defect).",
      "Pareto-inefficient equilibrium payoff: (1, 1) is Pareto-dominated by (3, 3)."
    ]
  },
  "Feiglingsspiel (Chicken)": {
    title: "Chicken game",
    intro: "Both players prefer not to yield, but a crash is catastrophic.",
    bullets: [
      "Two Nash equilibria: (Straight, Swerve) and (Swerve, Straight).",
      "No player has a strictly dominant strategy.",
      "This is an anti-coordination problem; commitment and credible threats can matter."
    ]
  },
  "Jagdspiel (Stag Hunt)": {
    title: "Stag hunt",
    intro: "A coordination game where the Pareto-efficient outcome requires mutual cooperation.",
    bullets: [
      "Two Nash equilibria: (Stag, Stag) and (Hare, Hare).",
      "Pareto-efficient but risky: (Stag, Stag).",
      "Typical challenge: trust and coordination."
    ]
  },
  "Kampf der Geschlechter": {
    title: "Battle of the sexes",
    intro: "Both players want to coordinate, but they prefer different coordinated outcomes.",
    bullets: [
      "Two pure Nash equilibria: (Opera, Opera) and (Football, Football).",
      "Coordination conflict: who gets the preferred outcome?",
      "There is also a mixed-strategy Nash equilibrium."
    ]
  },
  "Ultimatumspiel (Variante mit simultaner Entscheidung)": {
    title: "Ultimatum game (simultaneous variant)",
    intro: "Simplified version: Player 1 offers fair (50/50) or unfair (90/10), Player 2 accepts or rejects.",
    bullets: [
      "Nash equilibrium: (Unfair, Accept).",
      "Empirically, unfair offers are often rejected due to fairness concerns.",
      "Important example of model prediction vs observed behavior."
    ]
  }
};

const SPECIAL_GAME_STRATEGY_LABELS_EN = {
  Kooperieren: "Cooperate",
  Defektieren: "Defect",
  Ausweichen: "Swerve",
  Geradeaus: "Straight",
  Hirsch: "Stag",
  Hase: "Hare",
  Oper: "Opera",
  Fußball: "Football",
  Fair: "Fair",
  Unfair: "Unfair",
  Annehmen: "Accept",
  Ablehnen: "Reject"
};

const SPECIAL_QUIZ_TYPES = ["pd", "chicken", "stag", "bos", "ultimatum"];
const SPECIAL_CARD_SWIPE_THRESHOLD = 56;
const EXERCISE_SIDE_TRIGGER_INSIDE_PX = 56;
const EXERCISE_SIDE_TRIGGER_OUTSIDE_PX = 104;
const EXERCISE_PAGE_TRANSITION_MS = 300;
const NORMAL_PAGE_ORDER = ["toc", "ex1", "ex2", "ex3", "ex4", "ex5", "ex6", "ex7", "ex8", "ex9"];
const BAYES_PAGE_ORDER = ["toc", "ex1", "ex2a", "ex2b"];
const TREE_PAGE_TRANSITION_MS = 300;
const TREE_PAGE_ORDER = ["toc", "ex1", "ex2", "ex6", "ex3", "ex4", "ex5", "ex8"];
const PRISONERS_DILEMMA_TITLE = "Gefangenendilemma";
const CHICKEN_GAME_TITLE = "Feiglingsspiel (Chicken)";
const STAG_HUNT_TITLE = "Jagdspiel (Stag Hunt)";
const BATTLE_OF_SEXES_TITLE = "Kampf der Geschlechter";
const ULTIMATUM_TITLE = "Ultimatumspiel (Variante mit simultaner Entscheidung)";

function buildPrisonersDilemmaCellClasses({ focusPlayer, showNash, showInefficiency }) {
  const classes = {};
  const addClass = (key, className) => {
    classes[key] = classes[key] ? `${classes[key]} ${className}` : className;
  };

  if (focusPlayer === "p1") {
    addClass("Kooperieren|Kooperieren", "pd-cell-compare");
    addClass("Defektieren|Kooperieren", "pd-cell-best");
    addClass("Kooperieren|Defektieren", "pd-cell-compare");
    addClass("Defektieren|Defektieren", "pd-cell-best");
  } else if (focusPlayer === "p2") {
    addClass("Kooperieren|Kooperieren", "pd-cell-compare");
    addClass("Kooperieren|Defektieren", "pd-cell-best");
    addClass("Defektieren|Kooperieren", "pd-cell-compare");
    addClass("Defektieren|Defektieren", "pd-cell-best");
  }

  if (showNash) {
    addClass("Defektieren|Defektieren", "pd-cell-nash");
  }

  if (showInefficiency) {
    addClass("Kooperieren|Kooperieren", "pd-cell-efficient");
  }

  return classes;
}

function buildChickenCellClasses({ focusPlayer, showNash, showCoordinationRisk }) {
  const classes = {};
  const addClass = (key, className) => {
    classes[key] = classes[key] ? `${classes[key]} ${className}` : className;
  };

  if (focusPlayer === "p1") {
    addClass("Ausweichen|Ausweichen", "pd-cell-compare");
    addClass("Geradeaus|Ausweichen", "pd-cell-best");
    addClass("Geradeaus|Geradeaus", "pd-cell-compare");
    addClass("Ausweichen|Geradeaus", "pd-cell-best");
  } else if (focusPlayer === "p2") {
    addClass("Ausweichen|Ausweichen", "pd-cell-compare");
    addClass("Ausweichen|Geradeaus", "pd-cell-best");
    addClass("Geradeaus|Geradeaus", "pd-cell-compare");
    addClass("Geradeaus|Ausweichen", "pd-cell-best");
  }

  if (showNash) {
    addClass("Geradeaus|Ausweichen", "pd-cell-nash");
    addClass("Ausweichen|Geradeaus", "pd-cell-nash");
  }

  if (showCoordinationRisk) {
    addClass("Geradeaus|Geradeaus", "pd-cell-risk");
  }

  return classes;
}

function buildStagCellClasses({ focusPlayer, showNash, showCoordinationRisk }) {
  const classes = {};
  const addClass = (key, className) => {
    classes[key] = classes[key] ? `${classes[key]} ${className}` : className;
  };

  if (focusPlayer === "p1") {
    addClass("Hirsch|Hirsch", "pd-cell-best");
    addClass("Hase|Hirsch", "pd-cell-compare");
    addClass("Hirsch|Hase", "pd-cell-compare");
    addClass("Hase|Hase", "pd-cell-best");
  } else if (focusPlayer === "p2") {
    addClass("Hirsch|Hirsch", "pd-cell-best");
    addClass("Hirsch|Hase", "pd-cell-compare");
    addClass("Hase|Hirsch", "pd-cell-compare");
    addClass("Hase|Hase", "pd-cell-best");
  }

  if (showNash) {
    addClass("Hirsch|Hirsch", "pd-cell-nash");
    addClass("Hase|Hase", "pd-cell-nash");
  }

  if (showCoordinationRisk) {
    addClass("Hirsch|Hase", "pd-cell-risk");
    addClass("Hase|Hirsch", "pd-cell-risk");
  }

  return classes;
}

function buildBosCellClasses({ focusPlayer, showNash, showCoordinationRisk }) {
  const classes = {};
  const addClass = (key, className) => {
    classes[key] = classes[key] ? `${classes[key]} ${className}` : className;
  };

  if (focusPlayer === "p1") {
    addClass("Oper|Oper", "pd-cell-best");
    addClass("Fußball|Oper", "pd-cell-compare");
    addClass("Oper|Fußball", "pd-cell-compare");
    addClass("Fußball|Fußball", "pd-cell-best");
  } else if (focusPlayer === "p2") {
    addClass("Oper|Oper", "pd-cell-best");
    addClass("Oper|Fußball", "pd-cell-compare");
    addClass("Fußball|Oper", "pd-cell-compare");
    addClass("Fußball|Fußball", "pd-cell-best");
  }

  if (showNash) {
    addClass("Oper|Oper", "pd-cell-nash");
    addClass("Fußball|Fußball", "pd-cell-nash");
  }

  if (showCoordinationRisk) {
    addClass("Oper|Fußball", "pd-cell-risk");
    addClass("Fußball|Oper", "pd-cell-risk");
  }

  return classes;
}

function buildUltimatumCellClasses({ focusPlayer, showNash, showFairnessGap }) {
  const classes = {};
  const addClass = (key, className) => {
    classes[key] = classes[key] ? `${classes[key]} ${className}` : className;
  };

  if (focusPlayer === "p1") {
    addClass("Fair|Annehmen", "pd-cell-compare");
    addClass("Unfair|Annehmen", "pd-cell-best");
    addClass("Fair|Ablehnen", "pd-cell-best");
    addClass("Unfair|Ablehnen", "pd-cell-best");
  } else if (focusPlayer === "p2") {
    addClass("Fair|Annehmen", "pd-cell-best");
    addClass("Fair|Ablehnen", "pd-cell-compare");
    addClass("Unfair|Annehmen", "pd-cell-best");
    addClass("Unfair|Ablehnen", "pd-cell-compare");
  }

  if (showNash) {
    addClass("Unfair|Annehmen", "pd-cell-nash");
  }

  if (showFairnessGap) {
    addClass("Fair|Annehmen", "pd-cell-efficient");
    addClass("Unfair|Annehmen", "pd-cell-risk");
  }

  return classes;
}

const NAV = [
  {
    title: { de: "Konzept lernen", en: "Learn a concept" },
    items: [
      { key: "learn-simultaneous", label: { de: "Simultane Entscheidungen", en: "Simultaneous decisions" } },
      { key: "learn-sequential", label: { de: "Sequenzielle Entscheidungen", en: "Sequential decisions" } },
      { key: "learn-private", label: { de: "Private Informationen bei simultanen Entscheidungen", en: "Private information in simultaneous decisions" } }
    ]
  },
  {
    title: { de: "Spiel lösen", en: "Solve a game" },
    items: [
      { key: "solve-normal", label: { de: "Simultane Spiele (Normalform)", en: "Simultaneous games (normal form)" } },
      { key: "solve-tree", label: { de: "Sequenzielle Spiele (Extensivform)", en: "Sequential games (extensive form)" } },
      { key: "solve-bayesian", label: { de: "Spiele mit privaten Informationen (Bayes)", en: "Games with private information (Bayesian)" } }
    ]
  },
  {
    title: { de: "Extra", en: "Extra" },
    items: [{ key: "extra-special", label: { de: "Besondere Spiele", en: "Special games" } }]
  }
];

function toNumberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildRandomBestResponseGame() {
  const payoffs = {};
  BEST_RESPONSE_ROWS.forEach((row) => {
    BEST_RESPONSE_COLS.forEach((col) => {
      payoffs[`${row}|${col}`] = [randomInt(0, 9), randomInt(0, 9)];
    });
  });
  return { rows: BEST_RESPONSE_ROWS, cols: BEST_RESPONSE_COLS, payoffs };
}

function normalizeApiBase(base) {
  const raw = typeof base === "string" ? base.trim() : "";
  if (!raw) {
    return { value: "", valid: true };
  }

  const looksLikeLocalhost = /^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(raw);
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw);
  const candidate = hasScheme ? raw : `${looksLikeLocalhost ? "http" : "https"}://${raw}`;

  try {
    const parsed = new URL(candidate);
    const normalizedPath = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");
    return {
      value: `${parsed.protocol}//${parsed.host}${normalizedPath}`,
      valid: true
    };
  } catch {
    return { value: "", valid: false };
  }
}

function buildSpecialGameQuiz(previousTypeKey = "") {
  const pool = SPECIAL_QUIZ_TYPES.filter((key) => key !== previousTypeKey);
  const typeKey = pool[randomInt(0, pool.length - 1)];

  if (typeKey === "pd") {
    const r = randomInt(4, 8);
    const t = r + randomInt(1, 4);
    const p = Math.max(1, r - randomInt(2, 4));
    const s = Math.max(0, p - randomInt(1, 3));
    return {
      typeKey,
      table: {
        rows: ["A", "B"],
        cols: ["X", "Y"],
        payoffs: {
          "A|X": [r, r],
          "A|Y": [s, t],
          "B|X": [t, s],
          "B|Y": [p, p]
        }
      }
    };
  }

  if (typeKey === "chicken") {
    const r = randomInt(4, 8);
    const t = r + randomInt(1, 3);
    const s = Math.max(1, r - randomInt(1, 2));
    const w = Math.max(0, s - randomInt(2, 4));
    return {
      typeKey,
      table: {
        rows: ["A", "B"],
        cols: ["X", "Y"],
        payoffs: {
          "A|X": [r, r],
          "A|Y": [s, t],
          "B|X": [t, s],
          "B|Y": [w, w]
        }
      }
    };
  }

  if (typeKey === "stag") {
    const a = randomInt(7, 11);
    const d = randomInt(3, 6);
    const c = Math.max(2, d - randomInt(1, 2));
    const b = Math.max(0, c - randomInt(2, 3));
    return {
      typeKey,
      table: {
        rows: ["A", "B"],
        cols: ["X", "Y"],
        payoffs: {
          "A|X": [a, a],
          "A|Y": [b, c],
          "B|X": [c, b],
          "B|Y": [d, d]
        }
      }
    };
  }

  if (typeKey === "bos") {
    const high = randomInt(5, 9);
    const low = randomInt(3, high - 1);
    const off = randomInt(0, 1);
    return {
      typeKey,
      table: {
        rows: ["A", "B"],
        cols: ["X", "Y"],
        payoffs: {
          "A|X": [high, low],
          "A|Y": [off, off],
          "B|X": [off, off],
          "B|Y": [low, high]
        }
      }
    };
  }

  const fair = randomInt(5, 8);
  const unfairP1 = fair + randomInt(2, 4);
  const unfairP2 = randomInt(1, Math.max(1, fair - 2));
  return {
    typeKey: "ultimatum",
    table: {
      rows: ["A", "B"],
      cols: ["X", "Y"],
      payoffs: {
        "A|X": [fair, fair],
        "A|Y": [0, 0],
        "B|X": [unfairP1, unfairP2],
        "B|Y": [0, 0]
      }
    }
  };
}

function buildTreeEx1Game() {
  while (true) {
    const payoffLX = { u1: randomInt(0, 9), u2: randomInt(0, 9) };
    const payoffLY = { u1: randomInt(0, 9), u2: randomInt(0, 9) };
    const payoffR = { u1: randomInt(0, 9), u2: randomInt(0, 9) };

    if (payoffLX.u2 === payoffLY.u2) continue;
    const p2Action = payoffLX.u2 > payoffLY.u2 ? "X" : "Y";
    const payoffAfterL = p2Action === "X" ? payoffLX : payoffLY;
    if (payoffAfterL.u1 === payoffR.u1) continue;

    const p1Action = payoffAfterL.u1 > payoffR.u1 ? "L" : "R";

    return {
      payoffLX,
      payoffLY,
      payoffR,
      p2Action,
      p1Action
    };
  }
}

function normalizeTreeEx1ApiGame(game) {
  if (!game || !game.payoffLX || !game.payoffLY || !game.payoffR) {
    return buildTreeEx1Game();
  }
  return {
    payoffLX: {
      u1: Number(game.payoffLX.u1) || 0,
      u2: Number(game.payoffLX.u2) || 0
    },
    payoffLY: {
      u1: Number(game.payoffLY.u1) || 0,
      u2: Number(game.payoffLY.u2) || 0
    },
    payoffR: {
      u1: Number(game.payoffR.u1) || 0,
      u2: Number(game.payoffR.u2) || 0
    },
    p2Action: "",
    p1Action: ""
  };
}

function buildTreeEx3Game() {
  while (true) {
    const payoffNo = { e: randomInt(0, 4), a: randomInt(1, 6) };
    const payoffFight = { e: randomInt(-3, 1), a: randomInt(-3, 1) };
    const payoffAccommodate = { e: randomInt(2, 8), a: randomInt(1, 7) };

    // Keep the strategic structure fixed:
    // A prefers Nachgeben after Ja; E prefers Ja if A gives in; E prefers Nein if A fights.
    if (payoffAccommodate.a <= payoffFight.a) continue;
    if (payoffAccommodate.e <= payoffNo.e) continue;
    if (payoffNo.e <= payoffFight.e) continue;

    return {
      payoffNo,
      payoffFight,
      payoffAccommodate
    };
  }
}

function buildTreeEx6Game() {
  while (true) {
    const UL = [randomInt(0, 9), randomInt(0, 9)];
    const UR = [randomInt(0, 9), randomInt(0, 9)];
    const DL = [randomInt(0, 9), randomInt(0, 9)];
    const DR = [randomInt(0, 9), randomInt(0, 9)];
    const all = [UL, UR, DL, DR].map((cell) => `${cell[0]}|${cell[1]}`);
    if (new Set(all).size < 4) continue;
    return { UL, UR, DL, DR };
  }
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function buildTreeEx6MatrixOptions(game) {
  const baseRows = ["U", "D"];
  const baseCols = ["L", "R"];
  const matrixA = {
    rows: baseRows,
    cols: baseCols,
    payoffs: {
      "U|L": game.UL,
      "U|R": game.UR,
      "D|L": game.DL,
      "D|R": game.DR
    }
  };
  const matrixB = {
    rows: baseRows,
    cols: baseCols,
    payoffs: {
      "U|L": game.UL,
      "U|R": game.DL,
      "D|L": game.UR,
      "D|R": game.DR
    }
  };
  const matrixC = {
    rows: baseRows,
    cols: baseCols,
    payoffs: {
      "U|L": game.UR,
      "U|R": game.UL,
      "D|L": game.DR,
      "D|R": game.DL
    }
  };
  const matrixD = {
    rows: baseRows,
    cols: baseCols,
    payoffs: {
      "U|L": game.DL,
      "U|R": game.DR,
      "D|L": game.UL,
      "D|R": game.UR
    }
  };
  return shuffleArray([
    { id: "m1", matrix: matrixA },
    { id: "m2", matrix: matrixB },
    { id: "m3", matrix: matrixC },
    { id: "m4", matrix: matrixD }
  ]);
}

function buildTreeEx6PureNeIds(game) {
  const rows = ["U", "D"];
  const cols = ["L", "R"];
  const payoff = {
    "U|L": game.UL,
    "U|R": game.UR,
    "D|L": game.DL,
    "D|R": game.DR
  };

  const bestRowsByCol = {};
  cols.forEach((col) => {
    const p1Vals = rows.map((row) => payoff[`${row}|${col}`][0]);
    const maxVal = Math.max(...p1Vals);
    bestRowsByCol[col] = rows.filter((row) => payoff[`${row}|${col}`][0] === maxVal);
  });

  const bestColsByRow = {};
  rows.forEach((row) => {
    const p2Vals = cols.map((col) => payoff[`${row}|${col}`][1]);
    const maxVal = Math.max(...p2Vals);
    bestColsByRow[row] = cols.filter((col) => payoff[`${row}|${col}`][1] === maxVal);
  });

  const pureNe = [];
  rows.forEach((row) => {
    cols.forEach((col) => {
      if (bestRowsByCol[col].includes(row) && bestColsByRow[row].includes(col)) {
        pureNe.push(`${row}|${col}`);
      }
    });
  });
  return pureNe;
}

const TREE_EX2_ROOT_ACTIONS = ["L", "M", "R"];
const TREE_EX2_P2_ACTIONS = ["U", "D"];
const TREE_EX2_P1_ACTIONS = ["x", "y"];
const TREE_EX2_P1_NODES = TREE_EX2_ROOT_ACTIONS.flatMap((rootAction) =>
  TREE_EX2_P2_ACTIONS.map((p2Action) => `${rootAction}|${p2Action}`)
);
const TREE_EX3_SPE_OPTIONS = [
  { id: "spe-jn", p1: "yes", p2: "accommodate" },
  { id: "spe-nk", p1: "no", p2: "fight" },
  { id: "spe-nn", p1: "no", p2: "accommodate" }
];
const TREE_EX3_NASH_OPTIONS = [
  { id: "nash-jn", p1: "yes", p2: "accommodate" },
  { id: "nash-nk", p1: "no", p2: "fight" },
  { id: "nash-jk", p1: "yes", p2: "fight" }
];
const TREE_EX3_THREAT_OPTIONS = [
  { id: "threat-jn", p1: "yes", p2: "accommodate" },
  { id: "threat-nk", p1: "no", p2: "fight" }
];
const TREE_EX3_SPE_CORRECT = ["spe-jn"];
const TREE_EX3_NASH_CORRECT = ["nash-jn", "nash-nk"];
const TREE_EX3_THREAT_CORRECT = "threat-nk";
const TREE_EX5_2_OFFERS = [
  { id: "o1", label: "90/10", p1: 9, p2: 1 },
  { id: "o2", label: "70/30", p1: 7, p2: 3 },
  { id: "o3", label: "50/50", p1: 5, p2: 5 }
];
const TREE_EX5_2_SPE_OPTIONS = [
  { id: "spe-ult-1", p1: "90/10", p2: ["A", "A", "A"] },
  { id: "spe-ult-2", p1: "70/30", p2: ["A", "A", "A"] },
  { id: "spe-ult-3", p1: "90/10", p2: ["R", "A", "A"] }
];
const TREE_EX5_2_SPE_CORRECT = "spe-ult-1";
const TREE_EX5_3_OFFERS = [
  { id: "r1", label: "R1: 70/30", p1: 7, p2: 3 },
  { id: "r2", label: "R2: 60/20", p1: 6, p2: 2 },
  { id: "r3", label: "R3: 50/10", p1: 5, p2: 1 }
];
const TREE_EX5_3_SPE_OPTIONS = [
  { id: "spe3-aaa", p2: ["A", "A", "A"] },
  { id: "spe3-raa", p2: ["R", "A", "A"] },
  { id: "spe3-rra", p2: ["R", "R", "A"] }
];
const TREE_EX5_3_SPE_CORRECT = "spe3-aaa";
const TREE_EX8_Q1_ACTIONS = ["q1=4", "q1=2"];
const TREE_EX8_Q2_ACTIONS = ["q2=1", "q2=3"];
const TREE_EX8_FALLBACK_GAME = {
  offers: [
    {
      id: "q1-high",
      p1Action: "q1=4",
      outcomes: {
        "q2=1": [7, 3],
        "q2=3": [5, 2]
      }
    },
    {
      id: "q1-low",
      p1Action: "q1=2",
      outcomes: {
        "q2=1": [6, 2],
        "q2=3": [8, 4]
      }
    }
  ]
};

function normalizeTreeEx8Game(game) {
  if (!game || !Array.isArray(game.offers) || game.offers.length !== 2) {
    return TREE_EX8_FALLBACK_GAME;
  }
  const valid = game.offers.every((offer) =>
    offer
    && (offer.id === "q1-high" || offer.id === "q1-low")
    && typeof offer.p1Action === "string"
    && offer.outcomes
    && Array.isArray(offer.outcomes["q2=1"])
    && Array.isArray(offer.outcomes["q2=3"])
    && offer.outcomes["q2=1"].length === 2
    && offer.outcomes["q2=3"].length === 2
  );
  return valid ? game : TREE_EX8_FALLBACK_GAME;
}

function buildTreeEx8Game() {
  while (true) {
    const high = {
      id: "q1-high",
      p1Action: "q1=4",
      outcomes: {
        "q2=1": [randomInt(2, 11), randomInt(1, 9)],
        "q2=3": [randomInt(2, 11), randomInt(1, 9)]
      }
    };
    const low = {
      id: "q1-low",
      p1Action: "q1=2",
      outcomes: {
        "q2=1": [randomInt(2, 11), randomInt(1, 9)],
        "q2=3": [randomInt(2, 11), randomInt(1, 9)]
      }
    };

    const bestHigh = high.outcomes["q2=1"][1] > high.outcomes["q2=3"][1] ? "q2=1" : "q2=3";
    const bestLow = low.outcomes["q2=1"][1] > low.outcomes["q2=3"][1] ? "q2=1" : "q2=3";
    if (high.outcomes["q2=1"][1] === high.outcomes["q2=3"][1]) continue;
    if (low.outcomes["q2=1"][1] === low.outcomes["q2=3"][1]) continue;

    const p1High = high.outcomes[bestHigh][0];
    const p1Low = low.outcomes[bestLow][0];
    if (p1High === p1Low) continue;

    return { offers: [high, low] };
  }
}

function buildTreeEx8Solution(game) {
  const offers = normalizeTreeEx8Game(game).offers;
  if (offers.length !== 2) {
    return {
      p2BestByOffer: { "q1-high": "q2=1", "q1-low": "q2=3" },
      p1Best: "q1=2"
    };
  }

  const p2BestByOffer = {};
  offers.forEach((offer) => {
    p2BestByOffer[offer.id] = offer.outcomes["q2=1"][1] > offer.outcomes["q2=3"][1] ? "q2=1" : "q2=3";
  });

  const highOffer = offers.find((offer) => offer.id === "q1-high");
  const lowOffer = offers.find((offer) => offer.id === "q1-low");
  const p1High = highOffer.outcomes[p2BestByOffer["q1-high"]][0];
  const p1Low = lowOffer.outcomes[p2BestByOffer["q1-low"]][0];
  const p1Best = p1High > p1Low ? "q1=4" : "q1=2";

  return { p2BestByOffer, p1Best };
}

function buildTreeEx8SpeOptions(solution) {
  const p1Correct = solution.p1Best;
  const p1Wrong = p1Correct === "q1=4" ? "q1=2" : "q1=4";
  const highBest = solution.p2BestByOffer["q1-high"];
  const lowBest = solution.p2BestByOffer["q1-low"];
  const highWrong = highBest === "q2=1" ? "q2=3" : "q2=1";
  const lowWrong = lowBest === "q2=1" ? "q2=3" : "q2=1";

  return [
    {
      id: "spe-s8-1",
      text: `(${p1Correct}, (${highBest}, ${lowBest}))`
    },
    {
      id: "spe-s8-2",
      text: `(${p1Wrong}, (${highBest}, ${lowBest}))`
    },
    {
      id: "spe-s8-3",
      text: `(${p1Correct}, (${highWrong}, ${lowWrong}))`
    }
  ];
}
const TREE_EX6_INFO_OPTIONS = [
  { id: "info-1", textDe: "P2 beobachtet den Zug von P1 vollständig, daher ist es ein perfektes Informationsspiel.", textEn: "P2 fully observes P1's move, so this is a perfect-information game." },
  { id: "info-2", textDe: "Die beiden P2-Knoten liegen in einer Informationsmenge. P2 weiß beim Ziehen nicht, ob P1 U oder D gespielt hat.", textEn: "The two P2 nodes are in one information set. When moving, P2 does not know whether P1 played U or D." },
  { id: "info-3", textDe: "P2 hat zwei getrennte Entscheidungen und kann je nach beobachtetem Pfad unterschiedlich reagieren.", textEn: "P2 has two separate decisions and can react differently by observed path." }
];
const TREE_EX6_INFO_CORRECT = "info-2";
const TREE_EX6_MATRIX_CORRECT = "m1";
const TREE_EX1_P1_ACTIONS = ["L", "R"];
const TREE_EX1_P2_ACTIONS = ["X", "Y"];
const TREE_EX4_P1_ACTIONS = ["L", "R"];
const TREE_EX4_P2_ACTIONS = ["a", "b"];
const TREE_EX4_P3_ACTIONS = ["l", "r"];
const TREE_EX4_INITIAL_GAME = {
  L_l: [3, 0, 1],
  L_r: [2, 5, 6],
  R_a_l: [6, 1, 0],
  R_a_r: [3, 1, 1],
  R_b_l: [0, 0, 1],
  R_b_r: [2, 7, 0]
};

function buildTreeEx4Profiles() {
  const profiles = [];
  TREE_EX4_P1_ACTIONS.forEach((p1) => {
    TREE_EX4_P2_ACTIONS.forEach((p2) => {
      TREE_EX4_P3_ACTIONS.forEach((sL) => {
        TREE_EX4_P3_ACTIONS.forEach((sA) => {
          TREE_EX4_P3_ACTIONS.forEach((sB) => {
            const id = `p1-${p1}|p2-${p2}|p3-${sL}${sA}${sB}`;
            profiles.push({
              id,
              p1,
              p2,
              p3: [sL, sA, sB],
              text: `(${p1},${p2},(${sL},${sA},${sB}))`
            });
          });
        });
      });
    });
  });
  return profiles;
}

function buildRandomTreeEx4Game() {
  return {
    L_l: [randomInt(-1, 8), randomInt(-1, 8), randomInt(-1, 8)],
    L_r: [randomInt(-1, 8), randomInt(-1, 8), randomInt(-1, 8)],
    R_a_l: [randomInt(-1, 8), randomInt(-1, 8), randomInt(-1, 8)],
    R_a_r: [randomInt(-1, 8), randomInt(-1, 8), randomInt(-1, 8)],
    R_b_l: [randomInt(-1, 8), randomInt(-1, 8), randomInt(-1, 8)],
    R_b_r: [randomInt(-1, 8), randomInt(-1, 8), randomInt(-1, 8)]
  };
}

function treeEx4TerminalPayoff(game, p1Action, p2Action, p3Strategy) {
  if (p1Action === "L") {
    return p3Strategy[0] === "l" ? game.L_l : game.L_r;
  }
  if (p2Action === "a") {
    return p3Strategy[1] === "l" ? game.R_a_l : game.R_a_r;
  }
  return p3Strategy[2] === "l" ? game.R_b_l : game.R_b_r;
}

function createEmptyTreeEx4Entry() {
  return { p1: "", p2: "", sL: "", sA: "", sB: "" };
}

function createEmptyTreeEx1Entry() {
  return { p1: "", p2: "" };
}

function createEmptyTreeEx2Entry() {
  return {
    rootAction: "",
    p2L: "",
    p2M: "",
    p2R: "",
    p1LU: "",
    p1LD: "",
    p1MU: "",
    p1MD: "",
    p1RU: "",
    p1RD: ""
  };
}

function treeEx1EntryToId(entry) {
  if (!entry.p1 || !entry.p2) return "";
  return `${entry.p1}-${entry.p2}`;
}

function treeEx2EntryToSignature(entry) {
  if (
    !entry.rootAction
    || !entry.p2L || !entry.p2M || !entry.p2R
    || !entry.p1LU || !entry.p1LD || !entry.p1MU || !entry.p1MD || !entry.p1RU || !entry.p1RD
  ) {
    return "";
  }
  return `${entry.rootAction}|${entry.p2L}${entry.p2M}${entry.p2R}|${entry.p1LU}${entry.p1LD}${entry.p1MU}${entry.p1MD}${entry.p1RU}${entry.p1RD}`;
}

function treeEx4EntryToId(entry) {
  if (!entry.p1 || !entry.p2 || !entry.sL || !entry.sA || !entry.sB) return "";
  return `p1-${entry.p1}|p2-${entry.p2}|p3-${entry.sL}${entry.sA}${entry.sB}`;
}

function formatTreeEx4ProfileId(profileId) {
  const match = /^p1-([LR])\|p2-([ab])\|p3-([lr]{3})$/.exec(profileId || "");
  if (!match) {
    return profileId || "";
  }
  const [, p1, p2, p3] = match;
  return `(${p1}, ${p2}, (${p3[0]}, ${p3[1]}, ${p3[2]}))`;
}

function evaluateTreeEx4Game(game, profiles) {
  const nashIds = [];
  const speIds = [];

  profiles.forEach((profile) => {
    const currentPayoff = treeEx4TerminalPayoff(game, profile.p1, profile.p2, profile.p3);

    const p1PayoffL = treeEx4TerminalPayoff(game, "L", profile.p2, profile.p3)[0];
    const p1PayoffR = treeEx4TerminalPayoff(game, "R", profile.p2, profile.p3)[0];
    const p1Best = Math.max(p1PayoffL, p1PayoffR);
    const p1Br = currentPayoff[0] === p1Best;

    const p2PayoffA = treeEx4TerminalPayoff(game, profile.p1, "a", profile.p3)[1];
    const p2PayoffB = treeEx4TerminalPayoff(game, profile.p1, "b", profile.p3)[1];
    const p2Best = Math.max(p2PayoffA, p2PayoffB);
    const p2Br = currentPayoff[1] === p2Best;

    let p3Best = -Infinity;
    TREE_EX4_P3_ACTIONS.forEach((sL) => {
      TREE_EX4_P3_ACTIONS.forEach((sA) => {
        TREE_EX4_P3_ACTIONS.forEach((sB) => {
          const payoff3 = treeEx4TerminalPayoff(game, profile.p1, profile.p2, [sL, sA, sB])[2];
          if (payoff3 > p3Best) p3Best = payoff3;
        });
      });
    });
    const p3Br = currentPayoff[2] === p3Best;

    if (p1Br && p2Br && p3Br) {
      nashIds.push(profile.id);
    }

    const payoff3L = profile.p3[0] === "l" ? game.L_l[2] : game.L_r[2];
    const payoff3LOther = profile.p3[0] === "l" ? game.L_r[2] : game.L_l[2];
    const payoff3A = profile.p3[1] === "l" ? game.R_a_l[2] : game.R_a_r[2];
    const payoff3AOther = profile.p3[1] === "l" ? game.R_a_r[2] : game.R_a_l[2];
    const payoff3B = profile.p3[2] === "l" ? game.R_b_l[2] : game.R_b_r[2];
    const payoff3BOther = profile.p3[2] === "l" ? game.R_b_r[2] : game.R_b_l[2];
    const p3Sequential = payoff3L >= payoff3LOther && payoff3A >= payoff3AOther && payoff3B >= payoff3BOther;

    const p2SubgameA = profile.p3[1] === "l" ? game.R_a_l[1] : game.R_a_r[1];
    const p2SubgameB = profile.p3[2] === "l" ? game.R_b_l[1] : game.R_b_r[1];
    const p2Sequential = (profile.p2 === "a" && p2SubgameA >= p2SubgameB) || (profile.p2 === "b" && p2SubgameB >= p2SubgameA);

    const p1RootL = profile.p3[0] === "l" ? game.L_l[0] : game.L_r[0];
    const p1RootR = profile.p2 === "a"
      ? (profile.p3[1] === "l" ? game.R_a_l[0] : game.R_a_r[0])
      : (profile.p3[2] === "l" ? game.R_b_l[0] : game.R_b_r[0]);
    const p1Sequential = (profile.p1 === "L" && p1RootL >= p1RootR) || (profile.p1 === "R" && p1RootR >= p1RootL);

    if (p3Sequential && p2Sequential && p1Sequential) {
      speIds.push(profile.id);
    }
  });

  return { nashIds, speIds };
}

function buildEmptyTreeEx2Progress() {
  const phase1Answers = {};
  TREE_EX2_P1_NODES.forEach((nodeKey) => {
    phase1Answers[nodeKey] = "";
  });
  const phase2Answers = {};
  TREE_EX2_ROOT_ACTIONS.forEach((rootAction) => {
    phase2Answers[rootAction] = "";
  });
  return {
    step: 1,
    phase1Answers,
    phase1Feedback: "",
    phase1FeedbackType: "neutral",
    phase2Answers,
    phase2Feedback: "",
    phase2FeedbackType: "neutral",
    phase3Choices: [],
    phase3Feedback: "",
    phase3FeedbackType: "neutral",
    speEntries: [createEmptyTreeEx2Entry()],
    speFeedback: "",
    speFeedbackType: "neutral",
    solved: false
  };
}

function buildTreeEx2ProgressSet() {
  return Array.from({ length: 2 }, () => buildEmptyTreeEx2Progress());
}

function treeEx2ProfileSignature(profile) {
  const p2Part = TREE_EX2_ROOT_ACTIONS.map((rootAction) => profile.p2Choices[rootAction]).join("");
  const p1Part = TREE_EX2_P1_NODES.map((nodeKey) => profile.p1Choices[nodeKey]).join("");
  return `${profile.rootAction}|${p2Part}|${p1Part}`;
}

function computeTreeEx2RootBestForP2Choices(game, p2Choices) {
  let maxU1 = -Infinity;
  TREE_EX2_ROOT_ACTIONS.forEach((rootAction) => {
    const p2Action = p2Choices[rootAction];
    const payoff = game.continuationPayoffs[`${rootAction}|${p2Action}`];
    if (payoff && payoff[0] > maxU1) {
      maxU1 = payoff[0];
    }
  });
  return TREE_EX2_ROOT_ACTIONS.filter((rootAction) => {
    const p2Action = p2Choices[rootAction];
    const payoff = game.continuationPayoffs[`${rootAction}|${p2Action}`];
    return payoff && payoff[0] === maxU1;
  });
}

function computeTreeEx2RootBestWithIndifference(game, p2Choices) {
  let combinations = [{}];
  TREE_EX2_ROOT_ACTIONS.forEach((rootAction) => {
    const selected = p2Choices[rootAction];
    const options = selected === "indifferent" ? ["U", "D"] : [selected];
    combinations = combinations.flatMap((combo) =>
      options.map((p2Action) => ({
        ...combo,
        [rootAction]: p2Action
      }))
    );
  });

  const bestRootSet = new Set();
  combinations.forEach((combo) => {
    const bestRoots = computeTreeEx2RootBestForP2Choices(game, combo);
    bestRoots.forEach((rootAction) => bestRootSet.add(rootAction));
  });
  return TREE_EX2_ROOT_ACTIONS.filter((rootAction) => bestRootSet.has(rootAction));
}

function loadExerciseProgress() {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(EXERCISE_PROGRESS_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function buildTreeEx2Game() {
  const payoffs = {};

  TREE_EX2_P1_NODES.forEach((nodeKey) => {
    let payoffX = [randomInt(0, 12), randomInt(0, 12)];
    let payoffY = [randomInt(0, 12), randomInt(0, 12)];
    while (payoffX[0] === payoffY[0]) {
      payoffX = [randomInt(0, 12), randomInt(0, 12)];
      payoffY = [randomInt(0, 12), randomInt(0, 12)];
    }
    payoffs[`${nodeKey}|x`] = payoffX;
    payoffs[`${nodeKey}|y`] = payoffY;
  });

  const p1BestByNode = {};
  TREE_EX2_P1_NODES.forEach((nodeKey) => {
    const payoffX = payoffs[`${nodeKey}|x`];
    const payoffY = payoffs[`${nodeKey}|y`];
    p1BestByNode[nodeKey] = payoffX[0] > payoffY[0] ? "x" : "y";
  });

  const continuationPayoffs = {};
  TREE_EX2_ROOT_ACTIONS.forEach((rootAction) => {
    TREE_EX2_P2_ACTIONS.forEach((p2Action) => {
      const nodeKey = `${rootAction}|${p2Action}`;
      const p1Action = p1BestByNode[nodeKey];
      continuationPayoffs[`${rootAction}|${p2Action}`] = payoffs[`${nodeKey}|${p1Action}`];
    });
  });

  const p2BestByRoot = {};
  TREE_EX2_ROOT_ACTIONS.forEach((rootAction) => {
    const payoffU = continuationPayoffs[`${rootAction}|U`];
    const payoffD = continuationPayoffs[`${rootAction}|D`];
    if (payoffU[1] > payoffD[1]) {
      p2BestByRoot[rootAction] = ["U"];
    } else if (payoffD[1] > payoffU[1]) {
      p2BestByRoot[rootAction] = ["D"];
    } else {
      p2BestByRoot[rootAction] = ["U", "D"];
    }
  });

  let p2Combinations = [{}];
  TREE_EX2_ROOT_ACTIONS.forEach((rootAction) => {
    p2Combinations = p2Combinations.flatMap((combo) =>
      p2BestByRoot[rootAction].map((p2Action) => ({
        ...combo,
        [rootAction]: p2Action
      }))
    );
  });

  const profileMap = new Map();
  p2Combinations.forEach((p2Choices) => {
    const bestRootActions = computeTreeEx2RootBestForP2Choices({ continuationPayoffs }, p2Choices);
    bestRootActions.forEach((rootAction) => {
      const signature = `${rootAction}|${TREE_EX2_ROOT_ACTIONS.map((r) => p2Choices[r]).join("")}`;
      if (!profileMap.has(signature)) {
        profileMap.set(signature, {
          rootAction,
          p2Choices: { ...p2Choices },
          p1Choices: { ...p1BestByNode }
        });
      }
    });
  });

  const speProfiles = [...profileMap.values()];
  const speSignatures = new Set(speProfiles.map(treeEx2ProfileSignature));

  const allProfiles = [];
  p2Combinations.forEach((p2Choices) => {
    TREE_EX2_ROOT_ACTIONS.forEach((rootAction) => {
      allProfiles.push({
        rootAction,
        p2Choices: { ...p2Choices },
        p1Choices: { ...p1BestByNode }
      });
    });
  });
  const wrongProfiles = allProfiles.filter((profile) => !speSignatures.has(treeEx2ProfileSignature(profile)));
  const selectedWrong = wrongProfiles.slice(0, Math.max(2, 6 - speProfiles.length));
  const speOptions = [...speProfiles, ...selectedWrong].map((profile, index) => ({
    id: `opt-${index + 1}-${treeEx2ProfileSignature(profile)}`,
    profile,
    isCorrect: speSignatures.has(treeEx2ProfileSignature(profile))
  }));

  return {
    payoffs,
    p1BestByNode,
    p2BestByRoot,
    continuationPayoffs,
    speProfiles,
    speOptions
  };
}

function buildTreeEx2Set() {
  let baseGame = buildTreeEx2Game();
  let attempts = 0;
  while (baseGame.speProfiles.length <= 1 && attempts < 60) {
    baseGame = buildTreeEx2Game();
    attempts += 1;
  }
  const sameGameCopy = JSON.parse(JSON.stringify(baseGame));
  return [baseGame, sameGameCopy];
}

function normalizeTreeEx2ApiGame(game) {
  if (!game || !game.payoffs || !game.p1BestByNode || !game.p2BestByRoot || !game.continuationPayoffs || !game.speProfiles) {
    return buildTreeEx2Game();
  }
  return game;
}

function payoffFromMap(game, row, col) {
  return game.payoffs[`${row}|${col}`];
}

function findStrictDominatedRow(game, activeRows, activeCols) {
  for (const dominated of activeRows) {
    for (const dominant of activeRows) {
      if (dominated === dominant) continue;
      let strictAll = true;
      for (const c of activeCols) {
        const [uDominated] = payoffFromMap(game, dominated, c);
        const [uDominant] = payoffFromMap(game, dominant, c);
        if (!(uDominated < uDominant)) {
          strictAll = false;
          break;
        }
      }
      if (strictAll) {
        return { player: 1, dominated, dominant };
      }
    }
  }
  return null;
}

function findStrictDominatedCol(game, activeRows, activeCols) {
  for (const dominated of activeCols) {
    for (const dominant of activeCols) {
      if (dominated === dominant) continue;
      let strictAll = true;
      for (const r of activeRows) {
        const [, uDominated] = payoffFromMap(game, r, dominated);
        const [, uDominant] = payoffFromMap(game, r, dominant);
        if (!(uDominated < uDominant)) {
          strictAll = false;
          break;
        }
      }
      if (strictAll) {
        return { player: 2, dominated, dominant };
      }
    }
  }
  return null;
}

function computePureNash(game, activeRows, activeCols) {
  const bestRowsByCol = new Map();
  activeCols.forEach((c) => {
    let maxU1 = -Infinity;
    activeRows.forEach((r) => {
      const [u1] = payoffFromMap(game, r, c);
      maxU1 = Math.max(maxU1, u1);
    });
    const bestRows = activeRows.filter((r) => payoffFromMap(game, r, c)[0] === maxU1);
    bestRowsByCol.set(c, new Set(bestRows));
  });

  const bestColsByRow = new Map();
  activeRows.forEach((r) => {
    let maxU2 = -Infinity;
    activeCols.forEach((c) => {
      const [, u2] = payoffFromMap(game, r, c);
      maxU2 = Math.max(maxU2, u2);
    });
    const bestCols = activeCols.filter((c) => payoffFromMap(game, r, c)[1] === maxU2);
    bestColsByRow.set(r, new Set(bestCols));
  });

  const nash = [];
  activeRows.forEach((r) => {
    activeCols.forEach((c) => {
      if (bestRowsByCol.get(c)?.has(r) && bestColsByRow.get(r)?.has(c)) {
        nash.push(`(${r}, ${c})`);
      }
    });
  });
  return nash;
}

function computeBestResponseCellSets(game) {
  const p1 = [];
  const p2 = [];

  game.cols.forEach((col) => {
    let maxU1 = -Infinity;
    game.rows.forEach((row) => {
      const [u1] = payoffFromMap(game, row, col);
      maxU1 = Math.max(maxU1, u1);
    });
    game.rows.forEach((row) => {
      if (payoffFromMap(game, row, col)[0] === maxU1) {
        p1.push(`${row}|${col}`);
      }
    });
  });

  game.rows.forEach((row) => {
    let maxU2 = -Infinity;
    game.cols.forEach((col) => {
      const [, u2] = payoffFromMap(game, row, col);
      maxU2 = Math.max(maxU2, u2);
    });
    game.cols.forEach((col) => {
      if (payoffFromMap(game, row, col)[1] === maxU2) {
        p2.push(`${row}|${col}`);
      }
    });
  });

  const p2Set = new Set(p2);
  const nash = p1.filter((key) => p2Set.has(key));
  return {
    p1: [...p1].sort(),
    p2: [...p2].sort(),
    nash: [...nash].sort()
  };
}

function formatCellKey(key) {
  const [row, col] = key.split("|");
  return `(${row}, ${col})`;
}

function buildReducedMatrix(game, activeRows, activeCols) {
  const payoffs = {};
  activeRows.forEach((r) => {
    activeCols.forEach((c) => {
      const key = `${r}|${c}`;
      payoffs[key] = game.payoffs[key];
    });
  });
  return { rows: activeRows, cols: activeCols, payoffs };
}

function buildDominanceChecksForActive(game, activeRows, activeCols) {
  const orderedRows = game.rows.filter((row) => activeRows.includes(row));
  const orderedCols = game.cols.filter((col) => activeCols.includes(col));
  const checks = [];
  orderedRows.forEach((dominated) => {
    orderedRows.forEach((dominant) => {
      if (dominant === dominated) return;
      checks.push({ player: 1, dominant, dominated });
    });
  });
  orderedCols.forEach((dominated) => {
    orderedCols.forEach((dominant) => {
      if (dominant === dominated) return;
      checks.push({ player: 2, dominant, dominated });
    });
  });
  return checks;
}

function isStrictDominatedInCurrentMatrix(game, check, activeRows, activeCols) {
  if (check.player === 1) {
    if (!activeRows.includes(check.dominant) || !activeRows.includes(check.dominated)) {
      return null;
    }
    return activeCols.every((col) => {
      const [uDominant] = payoffFromMap(game, check.dominant, col);
      const [uDominated] = payoffFromMap(game, check.dominated, col);
      return uDominant > uDominated;
    });
  }

  if (!activeCols.includes(check.dominant) || !activeCols.includes(check.dominated)) {
    return null;
  }
  return activeRows.every((row) => {
    const [, uDominant] = payoffFromMap(game, row, check.dominant);
    const [, uDominated] = payoffFromMap(game, row, check.dominated);
    return uDominant > uDominated;
  });
}

function findNextDominanceCheck(game, checks, startIndex, activeRows, activeCols) {
  for (let i = startIndex; i < checks.length; i += 1) {
    const current = checks[i];
    const result = isStrictDominatedInCurrentMatrix(game, current, activeRows, activeCols);
    if (result !== null) {
      return { index: i, check: current, result };
    }
  }
  return null;
}

function buildLayout(game) {
  const nodeMap = new Map(game.nodes.map((n) => [n.id, n]));
  const depth = new Map();
  depth.set(game.root, 0);
  const queue = [game.root];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const current = nodeMap.get(currentId);
    if (!current || current.node_type !== "decision") {
      continue;
    }
    current.actions.forEach((action) => {
      if (!depth.has(action.child)) {
        depth.set(action.child, depth.get(currentId) + 1);
        queue.push(action.child);
      }
    });
  }

  const bucket = new Map();
  let maxDepth = 0;
  game.nodes.forEach((node) => {
    const d = depth.has(node.id) ? depth.get(node.id) : 99;
    maxDepth = Math.max(maxDepth, d === 99 ? 0 : d);
    if (!bucket.has(d)) {
      bucket.set(d, []);
    }
    bucket.get(d).push(node.id);
  });

  const positions = {};
  const depthKeys = [...bucket.keys()].sort((a, b) => a - b);
  depthKeys.forEach((d) => {
    const ids = bucket.get(d);
    ids.sort();
    const column = d === 99 ? maxDepth + 1 : d;
    ids.forEach((id, index) => {
      positions[id] = {
        x: 60 + column * 230,
        y: 70 + index * 130
      };
    });
  });

  const connectedCount = bucket.get(99)?.length ?? 0;
  const maxPerColumn = Math.max(
    ...[...bucket.values()].map((ids) => ids.length),
    connectedCount,
    1
  );
  const height = 100 + maxPerColumn * 130;
  const width = 300 + (maxDepth + 2) * 230;

  return { positions, width, height };
}

function computeHighlightEdges(game, strategyByNode) {
  const nodeMap = new Map(game.nodes.map((n) => [n.id, n]));
  const chosen = new Set();
  const chosenNodes = new Set([game.root]);
  let cursor = game.root;
  let steps = 0;

  while (steps < game.nodes.length + 2) {
    const node = nodeMap.get(cursor);
    if (!node || node.node_type !== "decision") {
      break;
    }
    const actionId = strategyByNode?.[node.id];
    if (!actionId) {
      break;
    }
    const action = node.actions.find((a) => a.id === actionId);
    if (!action) {
      break;
    }
    chosen.add(`${node.id}:${action.id}`);
    chosenNodes.add(action.child);
    cursor = action.child;
    steps += 1;
  }
  return { chosen, chosenNodes };
}

function payoffAt(game, row, col) {
  return game.payoffs.find((cell) => cell.row === row && cell.col === col);
}

function useMatrixAutoScale(autoScale, dependencies = []) {
  const wrapRef = useRef(null);
  const tableRef = useRef(null);
  const [tableScale, setTableScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState(null);
  const isFirefox = typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent);
  const shouldAutoScale = autoScale && !isFirefox;

  useEffect(() => {
    if (!shouldAutoScale) {
      setTableScale(1);
      setScaledHeight(null);
      return undefined;
    }

    const wrapEl = wrapRef.current;
    const tableEl = tableRef.current;
    if (!wrapEl || !tableEl) {
      return undefined;
    }

    let frameId = 0;
    const updateScale = () => {
      const availableWidth = Math.max(0, wrapEl.clientWidth - 1);
      const naturalWidth = tableEl.scrollWidth;
      const naturalHeight = tableEl.scrollHeight;
      if (!availableWidth || !naturalWidth) {
        setTableScale(1);
        setScaledHeight(null);
        return;
      }

      const rawScale = naturalWidth > availableWidth ? availableWidth / naturalWidth : 1;
      const nextScale = Math.min(1, Math.max(0.4, rawScale));
      const nextHeight = nextScale < 0.999 ? Math.ceil(naturalHeight * nextScale) + 10 : null;

      setTableScale((prev) => (Math.abs(prev - nextScale) < 0.002 ? prev : nextScale));
      setScaledHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    const requestUpdate = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      frameId = requestAnimationFrame(updateScale);
    };

    requestUpdate();

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(requestUpdate);
      resizeObserver.observe(wrapEl);
    }
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      window.removeEventListener("resize", requestUpdate);
      resizeObserver?.disconnect();
    };
  }, [shouldAutoScale, ...dependencies]);

  const useScale = shouldAutoScale && tableScale < 0.999;
  return { wrapRef, tableRef, tableScale, scaledHeight, useScale, shouldAutoScale };
}

function NormalGameTable({ game, rowLabel = "Spieler 1", colLabel = "Spieler 2", autoScale = true }) {
  const { wrapRef, tableRef, tableScale, scaledHeight, useScale, shouldAutoScale } = useMatrixAutoScale(autoScale, [game, rowLabel, colLabel]);

  if (!game) {
    return <p className="hint">Kein Spiel geladen.</p>;
  }
  const shortRowLabels = game.rows.every((r) => r.length <= 3);
  const longSideLabel = rowLabel.length > 12;
  const tableClass = [
    "matrix-table",
    shouldAutoScale ? "matrix-table-autoscale" : "",
    game.rows.length === 2 ? "matrix-table-two-rows" : "",
    shortRowLabels ? "compact-row-labels" : "",
    longSideLabel ? "long-side-label" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={wrapRef}
      className={`matrix-wrap${shouldAutoScale ? " matrix-wrap-autoscale" : ""}`}
      style={useScale && scaledHeight ? { height: `${scaledHeight}px` } : undefined}
    >
      <div
        className={useScale ? "matrix-scale-shell" : undefined}
        style={useScale ? { transform: `scale(${tableScale})`, transformOrigin: "top left" } : undefined}
      >
        <table ref={tableRef} className={tableClass}>
          <thead>
            <tr>
              <th colSpan={2} />
              <th colSpan={game.cols.length}>{colLabel}</th>
            </tr>
            <tr>
              <th />
              <th />
              {game.cols.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {game.rows.map((r, idx) => (
              <tr key={r}>
                {idx === 0 && (
                  <th rowSpan={game.rows.length} className="player-side-header">
                    <span className="player-side-label">{rowLabel}</span>
                  </th>
                )}
                <th>{r}</th>
                {game.cols.map((c) => {
                  const cell = payoffAt(game, r, c);
                  return <td key={`${r}-${c}`}>{cell ? `(${cell.u1}, ${cell.u2})` : "-"}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StaticPayoffTable({
  data,
  rowLabel = "Player 1",
  colLabel = "Player 2",
  autoScale = true,
  getCellClassName = null,
  onCellClick = null,
  rowDisplayMap = null,
  colDisplayMap = null
}) {
  const { wrapRef, tableRef, tableScale, scaledHeight, useScale, shouldAutoScale } = useMatrixAutoScale(autoScale, [data, rowLabel, colLabel]);
  const rowLabelFor = (row) => rowDisplayMap?.[row] || row;
  const colLabelFor = (col) => colDisplayMap?.[col] || col;
  const shortRowLabels = data.rows.every((r) => rowLabelFor(r).length <= 3);
  const longSideLabel = rowLabel.length > 12;
  const tableClass = [
    "matrix-table",
    shouldAutoScale ? "matrix-table-autoscale" : "",
    data.rows.length === 2 ? "matrix-table-two-rows" : "",
    shortRowLabels ? "compact-row-labels" : "",
    longSideLabel ? "long-side-label" : ""
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      ref={wrapRef}
      className={`matrix-wrap${shouldAutoScale ? " matrix-wrap-autoscale" : ""}`}
      style={useScale && scaledHeight ? { height: `${scaledHeight}px` } : undefined}
    >
      <div
        className={useScale ? "matrix-scale-shell" : undefined}
        style={useScale ? { transform: `scale(${tableScale})`, transformOrigin: "top left" } : undefined}
      >
        <table ref={tableRef} className={tableClass}>
          <thead>
            <tr>
              <th colSpan={2} />
              <th colSpan={data.cols.length}>{colLabel}</th>
            </tr>
            <tr>
              <th />
              <th />
              {data.cols.map((c) => (
                <th key={c}>{colLabelFor(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, idx) => (
              <tr key={r}>
                {idx === 0 && (
                  <th rowSpan={data.rows.length} className="player-side-header">
                    <span className="player-side-label">{rowLabel}</span>
                  </th>
                )}
                <th>{rowLabelFor(r)}</th>
                {data.cols.map((c) => {
                  const key = `${r}|${c}`;
                  const value = data.payoffs[key];
                  const cellClassName = typeof getCellClassName === "function" ? getCellClassName(r, c, value) : "";
                  const clickable = typeof onCellClick === "function";
                  return (
                    <td
                      key={key}
                      className={[cellClassName, clickable ? "matrix-cell-clickable" : ""].filter(Boolean).join(" ") || undefined}
                      onClick={clickable ? () => onCellClick(r, c, value) : undefined}
                    >
                      {value ? `(${value[0]}, ${value[1]})` : "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Ex5AnswerTable({ game, answers, onAnswerChange, choices, autoScale = true }) {
  const { wrapRef, tableRef, tableScale, scaledHeight, useScale, shouldAutoScale } = useMatrixAutoScale(autoScale, [game, answers, choices]);

  if (!game) {
    return null;
  }

  return (
    <div
      ref={wrapRef}
      className={`matrix-wrap${shouldAutoScale ? " matrix-wrap-autoscale" : ""}`}
      style={useScale && scaledHeight ? { height: `${scaledHeight}px` } : undefined}
    >
      <div
        className={useScale ? "matrix-scale-shell" : undefined}
        style={useScale ? { transform: `scale(${tableScale})`, transformOrigin: "top left" } : undefined}
      >
        <table ref={tableRef} className={`matrix-table ${shouldAutoScale ? "matrix-table-autoscale " : ""}ex5-table`}>
          <thead>
            <tr>
              <th />
              {game.cols.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {game.rows.map((r) => (
              <tr key={r}>
                <th>{r}</th>
                {game.cols.map((c) => {
                  const key = `${r}|${c}`;
                  return (
                    <td key={key}>
                      <select value={answers[key] || "no"} onChange={(e) => onAnswerChange(key, e.target.value)}>
                        {choices.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            {ch.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LevelSwitch({ value, onChange, leftLabel, rightLabel, ariaLabel }) {
  return (
    <div className="level-switch" role="tablist" aria-label={ariaLabel}>
      <span className={`level-switch-thumb ${value === 1 ? "is-right" : ""}`} aria-hidden="true" />
      <button
        type="button"
        role="tab"
        aria-selected={value === 0}
        className={`level-switch-option ${value === 0 ? "active" : ""}`}
        onClick={() => onChange(0)}
      >
        {leftLabel}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 1}
        className={`level-switch-option ${value === 1 ? "active" : ""}`}
        onClick={() => onChange(1)}
      >
        {rightLabel}
      </button>
    </div>
  );
}

function HorizontalArrowScroller({ className = "", children, leftAriaLabel, rightAriaLabel }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;

    let frameId = 0;
    const updateScrollState = () => {
      const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft < maxScrollLeft - 4);
    };

    const scheduleUpdate = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updateScrollState);
    };

    scheduleUpdate();
    el.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      resizeObserver.observe(el);
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      el.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver?.disconnect();
    };
  }, []);

  function scrollByDirection(direction) {
    const el = trackRef.current;
    if (!el) return;
    const scrollDelta = Math.max(240, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({ left: direction * scrollDelta, behavior: "smooth" });
  }

  return (
    <div className="h-scroll-shell">
      <div ref={trackRef} className={className}>
        {children}
      </div>
      {canScrollLeft && (
        <button
          type="button"
          className="h-scroll-arrow left"
          aria-label={leftAriaLabel}
          onClick={() => scrollByDirection(-1)}
        >
          &#8249;
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          className="h-scroll-arrow right"
          aria-label={rightAriaLabel}
          onClick={() => scrollByDirection(1)}
        >
          &#8250;
        </button>
      )}
    </div>
  );
}

function App() {
  const [uiLang, setUiLang] = useState(() => {
    if (typeof window === "undefined") {
      return "de";
    }
    const storedLang = window.localStorage.getItem("gt-lang");
    if (storedLang === "de" || storedLang === "en") {
      return storedLang;
    }
    const systemLang = (window.navigator?.language || "").toLowerCase();
    return systemLang.startsWith("de") ? "de" : "en";
  });
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    const storedThemeMode = window.localStorage.getItem(THEME_MODE_KEY);
    if (THEME_MODES.includes(storedThemeMode)) {
      return storedThemeMode;
    }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [activePage, setActivePage] = useState("home");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [apiBase, setApiBase] = useState(() => {
    const envBase = import.meta.env.VITE_API_BASE;
    if (typeof envBase === "string" && envBase.trim()) {
      return envBase;
    }
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const isLocalHost = host === "localhost" || host === "127.0.0.1";
      if (!isLocalHost) {
        return "https://game-theory-api.onrender.com";
      }
    }
    return "";
  });
  const [game, setGame] = useState(initialGame);
  const [selectedNodeId, setSelectedNodeId] = useState(initialGame.root);
  const [connectSourceId, setConnectSourceId] = useState("");
  const [result, setResult] = useState("");
  const [solveData, setSolveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newActionLabel, setNewActionLabel] = useState("Action");
  const [idCounter, setIdCounter] = useState(3);

  const [legacyLang, setLegacyLang] = useState(uiLang);
  const [ex1Data, setEx1Data] = useState(null);
  const [ex1Selected, setEx1Selected] = useState("");
  const [ex1Feedback, setEx1Feedback] = useState("");
  const [ex1FeedbackType, setEx1FeedbackType] = useState("neutral");
  const [ex2Data, setEx2Data] = useState(null);
  const [ex2Selected, setEx2Selected] = useState("");
  const [ex2Feedback, setEx2Feedback] = useState("");
  const [ex2FeedbackType, setEx2FeedbackType] = useState("neutral");
  const [ex3Data, setEx3Data] = useState(null);
  const [ex3Selected, setEx3Selected] = useState("");
  const [ex3Feedback, setEx3Feedback] = useState("");
  const [ex3FeedbackType, setEx3FeedbackType] = useState("neutral");
  const [ex4Data, setEx4Data] = useState(null);
  const [ex4Selected, setEx4Selected] = useState([]);
  const [ex4Feedback, setEx4Feedback] = useState("");
  const [ex4FeedbackType, setEx4FeedbackType] = useState("neutral");
  const [ex5Data, setEx5Data] = useState(null);
  const [ex5Answers, setEx5Answers] = useState({});
  const [ex5Feedback, setEx5Feedback] = useState("");
  const [ex5FeedbackType, setEx5FeedbackType] = useState("neutral");
  const [ex6Data, setEx6Data] = useState(null);
  const [ex6Selected, setEx6Selected] = useState("");
  const [ex6Feedback, setEx6Feedback] = useState("");
  const [ex6FeedbackType, setEx6FeedbackType] = useState("neutral");
  const [ex7Data, setEx7Data] = useState(null);
  const [ex7Selected, setEx7Selected] = useState([]);
  const [ex7Feedback, setEx7Feedback] = useState("");
  const [ex7FeedbackType, setEx7FeedbackType] = useState("neutral");
  const [ex8Data, setEx8Data] = useState(null);
  const [ex8Selected, setEx8Selected] = useState([]);
  const [ex8Feedback, setEx8Feedback] = useState("");
  const [ex8FeedbackType, setEx8FeedbackType] = useState("neutral");
  const [ex9Data, setEx9Data] = useState(null);
  const [ex9Selected, setEx9Selected] = useState("");
  const [ex9Feedback, setEx9Feedback] = useState("");
  const [ex9FeedbackType, setEx9FeedbackType] = useState("neutral");
  const [legacyLoading, setLegacyLoading] = useState(false);
  const [normalPage, setNormalPage] = useState("toc");
  const [normalRenderPage, setNormalRenderPage] = useState("toc");
  const [normalPageAnimPhase, setNormalPageAnimPhase] = useState("idle");
  const [normalPageAnimDirection, setNormalPageAnimDirection] = useState("next");
  const [showHelpEx1, setShowHelpEx1] = useState(false);
  const [showHelpEx2, setShowHelpEx2] = useState(false);
  const [showHelpEx3, setShowHelpEx3] = useState(false);
  const [showHelpEx4, setShowHelpEx4] = useState(false);
  const [showHelpEx5, setShowHelpEx5] = useState(false);
  const [showHelpEx6, setShowHelpEx6] = useState(false);
  const [showHelpEx7, setShowHelpEx7] = useState(false);
  const [showHelpEx8, setShowHelpEx8] = useState(false);
  const [showHelpEx9, setShowHelpEx9] = useState(false);
  const [bayesPage, setBayesPage] = useState("toc");
  const [bayesRenderPage, setBayesRenderPage] = useState("toc");
  const [bayesPageAnimPhase, setBayesPageAnimPhase] = useState("idle");
  const [bayesPageAnimDirection, setBayesPageAnimDirection] = useState("next");
  const [bayesEx1Data, setBayesEx1Data] = useState(null);
  const [bayesEx1Selected, setBayesEx1Selected] = useState([]);
  const [bayesEx1Feedback, setBayesEx1Feedback] = useState("");
  const [bayesEx1FeedbackType, setBayesEx1FeedbackType] = useState("neutral");
  const [showHelpBayesEx1, setShowHelpBayesEx1] = useState(false);
  const [bayesEx2aData, setBayesEx2aData] = useState(null);
  const [bayesEx2aSelected, setBayesEx2aSelected] = useState("");
  const [bayesEx2aFeedback, setBayesEx2aFeedback] = useState("");
  const [bayesEx2aFeedbackType, setBayesEx2aFeedbackType] = useState("neutral");
  const [bayesEx2aIntermediate, setBayesEx2aIntermediate] = useState("");
  const [bayesEx2aSubmitted, setBayesEx2aSubmitted] = useState(false);
  const [showHelpBayesEx2a, setShowHelpBayesEx2a] = useState(false);
  const [bayesEx2bData, setBayesEx2bData] = useState(null);
  const [bayesEx2bSelected, setBayesEx2bSelected] = useState([]);
  const [bayesEx2bFeedback, setBayesEx2bFeedback] = useState("");
  const [bayesEx2bFeedbackType, setBayesEx2bFeedbackType] = useState("neutral");
  const [showHelpBayesEx2b, setShowHelpBayesEx2b] = useState(false);
  const [treePage, setTreePage] = useState("toc");
  const [treeRenderPage, setTreeRenderPage] = useState("toc");
  const [treePageAnimPhase, setTreePageAnimPhase] = useState("idle");
  const [treePageAnimDirection, setTreePageAnimDirection] = useState("next");
  const [treeEx1Game, setTreeEx1Game] = useState(() => buildTreeEx1Game());
  const [treeEx1Step, setTreeEx1Step] = useState(1);
  const [treeEx1Phase1Choice, setTreeEx1Phase1Choice] = useState("");
  const [treeEx1Phase1Feedback, setTreeEx1Phase1Feedback] = useState("");
  const [treeEx1Phase1FeedbackType, setTreeEx1Phase1FeedbackType] = useState("neutral");
  const [treeEx1Phase2Choice, setTreeEx1Phase2Choice] = useState("");
  const [treeEx1Phase2Feedback, setTreeEx1Phase2Feedback] = useState("");
  const [treeEx1Phase2FeedbackType, setTreeEx1Phase2FeedbackType] = useState("neutral");
  const [treeEx1InstanceId, setTreeEx1InstanceId] = useState("");
  const [treeEx1ExpectedPhase1Action, setTreeEx1ExpectedPhase1Action] = useState("");
  const [treeEx1ExpectedRootAction, setTreeEx1ExpectedRootAction] = useState("");
  const [treeEx1ActiveLevel, setTreeEx1ActiveLevel] = useState(0);
  const [treeEx1HardEntries, setTreeEx1HardEntries] = useState(() => [createEmptyTreeEx1Entry()]);
  const [treeEx1HardFeedback, setTreeEx1HardFeedback] = useState("");
  const [treeEx1HardFeedbackType, setTreeEx1HardFeedbackType] = useState("neutral");
  const [treeEx2Games, setTreeEx2Games] = useState(() => buildTreeEx2Set());
  const [treeEx2Progress, setTreeEx2Progress] = useState(() => buildTreeEx2ProgressSet());
  const [treeEx2ActiveIndex, setTreeEx2ActiveIndex] = useState(0);
  const [treeEx2InstanceId, setTreeEx2InstanceId] = useState("");
  const [treeEx3Game, setTreeEx3Game] = useState(() => buildTreeEx3Game());
  const [treeEx4Game, setTreeEx4Game] = useState(() => ({ ...TREE_EX4_INITIAL_GAME }));
  const [treeEx3SpeChoices, setTreeEx3SpeChoices] = useState([]);
  const [treeEx3NashChoices, setTreeEx3NashChoices] = useState([]);
  const [treeEx3ThreatChoice, setTreeEx3ThreatChoice] = useState("");
  const [treeEx3SpeFeedback, setTreeEx3SpeFeedback] = useState("");
  const [treeEx3SpeFeedbackType, setTreeEx3SpeFeedbackType] = useState("neutral");
  const [treeEx3NashFeedback, setTreeEx3NashFeedback] = useState("");
  const [treeEx3NashFeedbackType, setTreeEx3NashFeedbackType] = useState("neutral");
  const [treeEx3ThreatFeedback, setTreeEx3ThreatFeedback] = useState("");
  const [treeEx3ThreatFeedbackType, setTreeEx3ThreatFeedbackType] = useState("neutral");
  const [treeEx3SpeSolved, setTreeEx3SpeSolved] = useState(false);
  const [treeEx3NashSolved, setTreeEx3NashSolved] = useState(false);
  const [treeEx3ThreatSolved, setTreeEx3ThreatSolved] = useState(false);
  const [treeEx3Completed, setTreeEx3Completed] = useState(false);
  const [treeEx3OverallFeedback, setTreeEx3OverallFeedback] = useState("");
  const [treeEx3OverallFeedbackType, setTreeEx3OverallFeedbackType] = useState("neutral");
  const [treeEx4SpeEntries, setTreeEx4SpeEntries] = useState(() => [createEmptyTreeEx4Entry()]);
  const [treeEx4NashEntries, setTreeEx4NashEntries] = useState(() => [createEmptyTreeEx4Entry()]);
  const [treeEx4SpeFeedback, setTreeEx4SpeFeedback] = useState("");
  const [treeEx4SpeFeedbackType, setTreeEx4SpeFeedbackType] = useState("neutral");
  const [treeEx4NashFeedback, setTreeEx4NashFeedback] = useState("");
  const [treeEx4NashFeedbackType, setTreeEx4NashFeedbackType] = useState("neutral");
  const [treeEx4SpeSolved, setTreeEx4SpeSolved] = useState(false);
  const [treeEx4NashSolved, setTreeEx4NashSolved] = useState(false);
  const [treeEx4Completed, setTreeEx4Completed] = useState(false);
  const [treeEx4OverallFeedback, setTreeEx4OverallFeedback] = useState("");
  const [treeEx4OverallFeedbackType, setTreeEx4OverallFeedbackType] = useState("neutral");
  const [showHelpTreeEx4, setShowHelpTreeEx4] = useState(false);
  const [treeEx5ActiveLevel, setTreeEx5ActiveLevel] = useState(0);
  const [treeEx5P2Answers, setTreeEx5P2Answers] = useState(() => ({}));
  const [treeEx5Phase1Feedback, setTreeEx5Phase1Feedback] = useState("");
  const [treeEx5Phase1FeedbackType, setTreeEx5Phase1FeedbackType] = useState("neutral");
  const [treeEx5SpeChoice, setTreeEx5SpeChoice] = useState("");
  const [treeEx5SpeFeedback, setTreeEx5SpeFeedback] = useState("");
  const [treeEx5SpeFeedbackType, setTreeEx5SpeFeedbackType] = useState("neutral");
  const [treeEx5Phase1Solved, setTreeEx5Phase1Solved] = useState(false);
  const [treeEx5SpeSolved, setTreeEx5SpeSolved] = useState(false);
  const [treeEx5Completed, setTreeEx5Completed] = useState(false);
  const [treeEx5OverallFeedback, setTreeEx5OverallFeedback] = useState("");
  const [treeEx5OverallFeedbackType, setTreeEx5OverallFeedbackType] = useState("neutral");
  const [treeEx8Game, setTreeEx8Game] = useState(() => normalizeTreeEx8Game(buildTreeEx8Game()));
  const [treeEx8P2Answers, setTreeEx8P2Answers] = useState(() => ({ "q1-high": "", "q1-low": "" }));
  const [treeEx8P1Choice, setTreeEx8P1Choice] = useState("");
  const [treeEx8SpeChoice, setTreeEx8SpeChoice] = useState("");
  const [treeEx8P2Feedback, setTreeEx8P2Feedback] = useState("");
  const [treeEx8P2FeedbackType, setTreeEx8P2FeedbackType] = useState("neutral");
  const [treeEx8P1Feedback, setTreeEx8P1Feedback] = useState("");
  const [treeEx8P1FeedbackType, setTreeEx8P1FeedbackType] = useState("neutral");
  const [treeEx8SpeFeedback, setTreeEx8SpeFeedback] = useState("");
  const [treeEx8SpeFeedbackType, setTreeEx8SpeFeedbackType] = useState("neutral");
  const [treeEx8P2Solved, setTreeEx8P2Solved] = useState(false);
  const [treeEx8P1Solved, setTreeEx8P1Solved] = useState(false);
  const [treeEx8SpeSolved, setTreeEx8SpeSolved] = useState(false);
  const [treeEx8Completed, setTreeEx8Completed] = useState(false);
  const [treeEx8OverallFeedback, setTreeEx8OverallFeedback] = useState("");
  const [treeEx8OverallFeedbackType, setTreeEx8OverallFeedbackType] = useState("neutral");
  const [showHelpTreeEx8, setShowHelpTreeEx8] = useState(false);
  const [treeEx6Game, setTreeEx6Game] = useState(() => buildTreeEx6Game());
  const [treeEx6InfoChoice, setTreeEx6InfoChoice] = useState("");
  const [treeEx6MatrixChoice, setTreeEx6MatrixChoice] = useState("");
  const [treeEx6InfoFeedback, setTreeEx6InfoFeedback] = useState("");
  const [treeEx6InfoFeedbackType, setTreeEx6InfoFeedbackType] = useState("neutral");
  const [treeEx6MatrixFeedback, setTreeEx6MatrixFeedback] = useState("");
  const [treeEx6MatrixFeedbackType, setTreeEx6MatrixFeedbackType] = useState("neutral");
  const [treeEx6InfoSolved, setTreeEx6InfoSolved] = useState(false);
  const [treeEx6MatrixSolved, setTreeEx6MatrixSolved] = useState(false);
  const [treeEx6NeChoices, setTreeEx6NeChoices] = useState([]);
  const [treeEx6SpeChoices, setTreeEx6SpeChoices] = useState([]);
  const [treeEx6EqFeedback, setTreeEx6EqFeedback] = useState("");
  const [treeEx6EqFeedbackType, setTreeEx6EqFeedbackType] = useState("neutral");
  const [treeEx6EqSolved, setTreeEx6EqSolved] = useState(false);
  const [showImpressumEmail, setShowImpressumEmail] = useState(false);
  const [showImpressumAddress, setShowImpressumAddress] = useState(false);
  const [showImpressumProject, setShowImpressumProject] = useState(false);
  const [specialQuizData, setSpecialQuizData] = useState(() => buildSpecialGameQuiz());
  const [specialQuizSelected, setSpecialQuizSelected] = useState("");
  const [specialQuizFeedback, setSpecialQuizFeedback] = useState("");
  const [specialQuizFeedbackType, setSpecialQuizFeedbackType] = useState("neutral");
  const [specialCardIndex, setSpecialCardIndex] = useState(0);
  const [showPrisonersAnalysis, setShowPrisonersAnalysis] = useState(false);
  const [prisonersFocusPlayer, setPrisonersFocusPlayer] = useState("");
  const [showPrisonersNash, setShowPrisonersNash] = useState(false);
  const [showPrisonersInefficiency, setShowPrisonersInefficiency] = useState(false);
  const [showChickenAnalysis, setShowChickenAnalysis] = useState(false);
  const [chickenFocusPlayer, setChickenFocusPlayer] = useState("");
  const [showChickenNash, setShowChickenNash] = useState(false);
  const [showChickenCoordinationRisk, setShowChickenCoordinationRisk] = useState(false);
  const [showStagAnalysis, setShowStagAnalysis] = useState(false);
  const [stagFocusPlayer, setStagFocusPlayer] = useState("");
  const [showStagNash, setShowStagNash] = useState(false);
  const [showStagCoordinationRisk, setShowStagCoordinationRisk] = useState(false);
  const [showBosAnalysis, setShowBosAnalysis] = useState(false);
  const [bosFocusPlayer, setBosFocusPlayer] = useState("");
  const [showBosNash, setShowBosNash] = useState(false);
  const [showBosCoordinationRisk, setShowBosCoordinationRisk] = useState(false);
  const [showUltimatumAnalysis, setShowUltimatumAnalysis] = useState(false);
  const [ultimatumFocusPlayer, setUltimatumFocusPlayer] = useState("");
  const [showUltimatumNash, setShowUltimatumNash] = useState(false);
  const [showUltimatumFairnessGap, setShowUltimatumFairnessGap] = useState(false);
  const specialSwipeStartRef = useRef(null);
  const normalPageTargetRef = useRef("toc");
  const normalPageExitTimerRef = useRef(null);
  const normalPageEnterTimerRef = useRef(null);
  const bayesPageTargetRef = useRef("toc");
  const bayesPageExitTimerRef = useRef(null);
  const bayesPageEnterTimerRef = useRef(null);
  const contentAreaRef = useRef(null);
  const treePageTargetRef = useRef("toc");
  const treePageExitTimerRef = useRef(null);
  const treePageEnterTimerRef = useRef(null);
  const treeEx8SafeGame = useMemo(() => normalizeTreeEx8Game(treeEx8Game), [treeEx8Game]);
  const treeEx8Solution = useMemo(() => buildTreeEx8Solution(treeEx8SafeGame), [treeEx8SafeGame]);
  const treeEx8SpeOptions = useMemo(
    () => buildTreeEx8SpeOptions(treeEx8Solution),
    [treeEx8Solution]
  );
  const treeEx6InfoOptions = useMemo(() => shuffleArray(TREE_EX6_INFO_OPTIONS), [treeEx6Game]);
  const treeEx6MatrixOptions = useMemo(() => buildTreeEx6MatrixOptions(treeEx6Game), [treeEx6Game]);
  const treeEx6PureNeIds = useMemo(() => buildTreeEx6PureNeIds(treeEx6Game), [treeEx6Game]);
  const [eliminatorGame, setEliminatorGame] = useState(() => ELIMINATOR_PRESETS[0]);
  const [eliminatorActiveRows, setEliminatorActiveRows] = useState(() => ELIMINATOR_PRESETS[0].rows);
  const [eliminatorActiveCols, setEliminatorActiveCols] = useState(() => ELIMINATOR_PRESETS[0].cols);
  const [eliminatorCheckIndex, setEliminatorCheckIndex] = useState(0);
  const [eliminatorDecisionCount, setEliminatorDecisionCount] = useState(1);
  const [eliminatorFeedback, setEliminatorFeedback] = useState("");
  const [eliminatorFeedbackType, setEliminatorFeedbackType] = useState("neutral");
  const [eliminatorShowWhy, setEliminatorShowWhy] = useState(false);
  const [eliminatorShowNash, setEliminatorShowNash] = useState(false);
  const [exerciseSideHover, setExerciseSideHover] = useState(null);
  const [contentAreaBounds, setContentAreaBounds] = useState({ left: 0, right: 0, viewportWidth: 0 });
  const [brExplorerGame, setBrExplorerGame] = useState(() => buildRandomBestResponseGame());
  const [brExplorerStep, setBrExplorerStep] = useState(1);
  const [brExplorerP1Selected, setBrExplorerP1Selected] = useState([]);
  const [brExplorerP2Selected, setBrExplorerP2Selected] = useState([]);
  const [brExplorerFeedback, setBrExplorerFeedback] = useState("");
  const [brExplorerFeedbackType, setBrExplorerFeedbackType] = useState("neutral");
  const [backwardStep, setBackwardStep] = useState(0);
  const [profileNotationStep, setProfileNotationStep] = useState(1);
  const [profileNotationP1, setProfileNotationP1] = useState("");
  const [profileNotationP2, setProfileNotationP2] = useState({ g1: "", g2: "" });
  const [profileNotationP3, setProfileNotationP3] = useState({ h1: "", h2: "" });
  const [profileNotationQuizAnswer, setProfileNotationQuizAnswer] = useState("");
  const [profileNotationQuizFeedback, setProfileNotationQuizFeedback] = useState("");
  const [profileNotationQuizType, setProfileNotationQuizType] = useState("neutral");
  const [infoSetQuizAnswer, setInfoSetQuizAnswer] = useState("");
  const [infoSetQuizFeedback, setInfoSetQuizFeedback] = useState("");
  const [infoSetQuizType, setInfoSetQuizType] = useState("neutral");
  const [exerciseProgress, setExerciseProgress] = useState(() => loadExerciseProgress());
  const previousActivePageRef = useRef(activePage);
  const isApplyingHistoryRef = useRef(false);
  const hasHistoryInitRef = useRef(false);
  const lastHistoryStateRef = useRef(null);
  const treeEx2SpeListRef = useRef(null);
  const normalizedApiBase = useMemo(() => normalizeApiBase(apiBase), [apiBase]);
  const treeEx2HardRowCount = treeEx2Progress[1]?.speEntries?.length ?? 0;

  const endpoint = useMemo(() => {
    try {
      return safeApiUrl("/api/v1/game-tree/solve");
    } catch {
      return "/api/v1/game-tree/solve";
    }
  }, [apiBase, normalizedApiBase, uiLang]);

  const selectedNode = useMemo(
    () => game.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [game.nodes, selectedNodeId]
  );

  const payloadText = useMemo(() => JSON.stringify({ game }, null, 2), [game]);
  const layout = useMemo(() => buildLayout(game), [game]);
  const highlights = useMemo(
    () => computeHighlightEdges(game, solveData?.strategy_by_node),
    [game, solveData]
  );
  const eliminatorChecks = useMemo(
    () => buildDominanceChecksForActive(eliminatorGame, eliminatorActiveRows, eliminatorActiveCols),
    [eliminatorGame, eliminatorActiveRows, eliminatorActiveCols]
  );
  const eliminatorQuestion = useMemo(
    () =>
      findNextDominanceCheck(
        eliminatorGame,
        eliminatorChecks,
        eliminatorCheckIndex,
        eliminatorActiveRows,
        eliminatorActiveCols
      ),
    [eliminatorGame, eliminatorChecks, eliminatorCheckIndex, eliminatorActiveRows, eliminatorActiveCols]
  );

  useEffect(() => {
    const enteringSolveNormal = activePage === "solve-normal" && previousActivePageRef.current !== "solve-normal";
    if (enteringSolveNormal) {
      if (normalPageExitTimerRef.current) {
        clearTimeout(normalPageExitTimerRef.current);
        normalPageExitTimerRef.current = null;
      }
      if (normalPageEnterTimerRef.current) {
        clearTimeout(normalPageEnterTimerRef.current);
        normalPageEnterTimerRef.current = null;
      }
      normalPageTargetRef.current = normalPage;
      setNormalRenderPage(normalPage);
      setNormalPageAnimPhase("idle");
      return;
    }

    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setNormalRenderPage(normalPage);
      setNormalPageAnimPhase("idle");
      normalPageTargetRef.current = normalPage;
      return;
    }

    const fromPage = normalPageAnimPhase === "idle" ? normalRenderPage : normalPageTargetRef.current;
    normalPageTargetRef.current = normalPage;
    if (fromPage === normalPage && normalPageAnimPhase === "idle") {
      return;
    }

    const clearTimers = () => {
      if (normalPageExitTimerRef.current) {
        clearTimeout(normalPageExitTimerRef.current);
        normalPageExitTimerRef.current = null;
      }
      if (normalPageEnterTimerRef.current) {
        clearTimeout(normalPageEnterTimerRef.current);
        normalPageEnterTimerRef.current = null;
      }
    };
    clearTimers();

    const fromOrder = NORMAL_PAGE_ORDER.indexOf(fromPage);
    const toOrder = NORMAL_PAGE_ORDER.indexOf(normalPage);
    setNormalPageAnimDirection(toOrder >= fromOrder ? "next" : "prev");
    setNormalPageAnimPhase("exit");

    normalPageExitTimerRef.current = setTimeout(() => {
      setNormalRenderPage(normalPageTargetRef.current);
      setNormalPageAnimPhase("enter");
      normalPageEnterTimerRef.current = setTimeout(() => {
        setNormalPageAnimPhase("idle");
        normalPageEnterTimerRef.current = null;
      }, EXERCISE_PAGE_TRANSITION_MS);
      normalPageExitTimerRef.current = null;
    }, EXERCISE_PAGE_TRANSITION_MS);
  }, [normalPage, activePage]);

  useEffect(() => {
    const enteringSolveBayes = activePage === "solve-bayesian" && previousActivePageRef.current !== "solve-bayesian";
    if (enteringSolveBayes) {
      if (bayesPageExitTimerRef.current) {
        clearTimeout(bayesPageExitTimerRef.current);
        bayesPageExitTimerRef.current = null;
      }
      if (bayesPageEnterTimerRef.current) {
        clearTimeout(bayesPageEnterTimerRef.current);
        bayesPageEnterTimerRef.current = null;
      }
      bayesPageTargetRef.current = bayesPage;
      setBayesRenderPage(bayesPage);
      setBayesPageAnimPhase("idle");
      return;
    }

    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setBayesRenderPage(bayesPage);
      setBayesPageAnimPhase("idle");
      bayesPageTargetRef.current = bayesPage;
      return;
    }

    const fromPage = bayesPageAnimPhase === "idle" ? bayesRenderPage : bayesPageTargetRef.current;
    bayesPageTargetRef.current = bayesPage;
    if (fromPage === bayesPage && bayesPageAnimPhase === "idle") {
      return;
    }

    const clearTimers = () => {
      if (bayesPageExitTimerRef.current) {
        clearTimeout(bayesPageExitTimerRef.current);
        bayesPageExitTimerRef.current = null;
      }
      if (bayesPageEnterTimerRef.current) {
        clearTimeout(bayesPageEnterTimerRef.current);
        bayesPageEnterTimerRef.current = null;
      }
    };
    clearTimers();

    const fromOrder = BAYES_PAGE_ORDER.indexOf(fromPage);
    const toOrder = BAYES_PAGE_ORDER.indexOf(bayesPage);
    setBayesPageAnimDirection(toOrder >= fromOrder ? "next" : "prev");
    setBayesPageAnimPhase("exit");

    bayesPageExitTimerRef.current = setTimeout(() => {
      setBayesRenderPage(bayesPageTargetRef.current);
      setBayesPageAnimPhase("enter");
      bayesPageEnterTimerRef.current = setTimeout(() => {
        setBayesPageAnimPhase("idle");
        bayesPageEnterTimerRef.current = null;
      }, EXERCISE_PAGE_TRANSITION_MS);
      bayesPageExitTimerRef.current = null;
    }, EXERCISE_PAGE_TRANSITION_MS);
  }, [bayesPage, activePage]);

  useEffect(() => {
    const enteringSolveTree = activePage === "solve-tree" && previousActivePageRef.current !== "solve-tree";
    if (enteringSolveTree) {
      if (treePageExitTimerRef.current) {
        clearTimeout(treePageExitTimerRef.current);
        treePageExitTimerRef.current = null;
      }
      if (treePageEnterTimerRef.current) {
        clearTimeout(treePageEnterTimerRef.current);
        treePageEnterTimerRef.current = null;
      }
      treePageTargetRef.current = treePage;
      setTreeRenderPage(treePage);
      setTreePageAnimPhase("idle");
      return;
    }

    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setTreeRenderPage(treePage);
      setTreePageAnimPhase("idle");
      treePageTargetRef.current = treePage;
      return;
    }

    const fromPage = treePageAnimPhase === "idle" ? treeRenderPage : treePageTargetRef.current;
    treePageTargetRef.current = treePage;
    if (fromPage === treePage && treePageAnimPhase === "idle") {
      return;
    }

    const clearTimers = () => {
      if (treePageExitTimerRef.current) {
        clearTimeout(treePageExitTimerRef.current);
        treePageExitTimerRef.current = null;
      }
      if (treePageEnterTimerRef.current) {
        clearTimeout(treePageEnterTimerRef.current);
        treePageEnterTimerRef.current = null;
      }
    };
    clearTimers();

    const fromOrder = TREE_PAGE_ORDER.indexOf(fromPage);
    const toOrder = TREE_PAGE_ORDER.indexOf(treePage);
    setTreePageAnimDirection(toOrder >= fromOrder ? "next" : "prev");
    setTreePageAnimPhase("exit");

    treePageExitTimerRef.current = setTimeout(() => {
      setTreeRenderPage(treePageTargetRef.current);
      setTreePageAnimPhase("enter");
      treePageEnterTimerRef.current = setTimeout(() => {
        setTreePageAnimPhase("idle");
        treePageEnterTimerRef.current = null;
      }, TREE_PAGE_TRANSITION_MS);
      treePageExitTimerRef.current = null;
    }, TREE_PAGE_TRANSITION_MS);
  }, [treePage, activePage]);

  useEffect(() => {
    previousActivePageRef.current = activePage;
  }, [activePage]);

  useEffect(
    () => () => {
      if (normalPageExitTimerRef.current) {
        clearTimeout(normalPageExitTimerRef.current);
      }
      if (normalPageEnterTimerRef.current) {
        clearTimeout(normalPageEnterTimerRef.current);
      }
      if (bayesPageExitTimerRef.current) {
        clearTimeout(bayesPageExitTimerRef.current);
      }
      if (bayesPageEnterTimerRef.current) {
        clearTimeout(bayesPageEnterTimerRef.current);
      }
      if (treePageExitTimerRef.current) {
        clearTimeout(treePageExitTimerRef.current);
      }
      if (treePageEnterTimerRef.current) {
        clearTimeout(treePageEnterTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    setExerciseSideHover(null);
  }, [activePage, normalPage, bayesPage, treePage]);

  useEffect(() => {
    if (treePage !== "ex2" || treeEx2ActiveIndex !== 1) {
      return undefined;
    }
    const listEl = treeEx2SpeListRef.current;
    if (!listEl) {
      return undefined;
    }

    const fitRows = () => {
      const available = Math.max(220, listEl.clientWidth - 8);
      const rows = listEl.querySelectorAll(".tree-ex2-spe-row");
      rows.forEach((row) => {
        row.style.setProperty("--spe-row-scale", "1");
        const naturalWidth = Math.max(1, row.scrollWidth);
        const scale = Math.max(0.6, Math.min(1, available / naturalWidth));
        row.style.setProperty("--spe-row-scale", scale.toFixed(3));
      });
    };

    fitRows();
    const rafId = window.requestAnimationFrame(fitRows);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fitRows) : null;
    if (observer) {
      observer.observe(listEl);
    } else {
      window.addEventListener("resize", fitRows);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      if (observer) {
        observer.disconnect();
      } else {
        window.removeEventListener("resize", fitRows);
      }
    };
  }, [treePage, treeEx2ActiveIndex, treeEx2HardRowCount]);
  const eliminatorMatrix = useMemo(
    () => buildReducedMatrix(eliminatorGame, eliminatorActiveRows, eliminatorActiveCols),
    [eliminatorGame, eliminatorActiveRows, eliminatorActiveCols]
  );
  const eliminatorNash = useMemo(
    () => computePureNash(eliminatorGame, eliminatorActiveRows, eliminatorActiveCols),
    [eliminatorGame, eliminatorActiveRows, eliminatorActiveCols]
  );
  const brExplorerCorrect = useMemo(
    () => computeBestResponseCellSets(brExplorerGame),
    [brExplorerGame]
  );
  const treeEx4Profiles = useMemo(() => buildTreeEx4Profiles(), []);
  const treeEx4Evaluation = useMemo(
    () => evaluateTreeEx4Game(treeEx4Game, treeEx4Profiles),
    [treeEx4Game, treeEx4Profiles]
  );
  const exerciseSideNav = useMemo(() => {
    if (activePage === "solve-normal") {
      const idx = NORMAL_PAGE_ORDER.indexOf(normalPage);
      if (idx <= 0) return null;
      return {
        prev: idx > 0 ? NORMAL_PAGE_ORDER[idx - 1] : null,
        next: idx < NORMAL_PAGE_ORDER.length - 1 ? NORMAL_PAGE_ORDER[idx + 1] : null,
        go: (target) => setNormalPage(target)
      };
    }
    if (activePage === "solve-bayesian") {
      const idx = BAYES_PAGE_ORDER.indexOf(bayesPage);
      if (idx <= 0) return null;
      return {
        prev: idx > 0 ? BAYES_PAGE_ORDER[idx - 1] : null,
        next: idx < BAYES_PAGE_ORDER.length - 1 ? BAYES_PAGE_ORDER[idx + 1] : null,
        go: (target) => setBayesPage(target)
      };
    }
    if (activePage === "solve-tree") {
      const idx = TREE_PAGE_ORDER.indexOf(treePage);
      if (idx <= 0) return null;
      return {
        prev: idx > 0 ? TREE_PAGE_ORDER[idx - 1] : null,
        next: idx < TREE_PAGE_ORDER.length - 1 ? TREE_PAGE_ORDER[idx + 1] : null,
        go: (target) => setTreePage(target)
      };
    }
    return null;
  }, [activePage, bayesPage, normalPage, treePage]);
  const showLeftExerciseNav = !!exerciseSideNav?.prev && exerciseSideHover === "left";
  const showRightExerciseNav = !!exerciseSideNav?.next && exerciseSideHover === "right";
  const leftNavX = Math.max(8, Math.round(contentAreaBounds.left - 52));
  const rightNavX = contentAreaBounds.viewportWidth > 0
    ? Math.min(contentAreaBounds.viewportWidth - 50, Math.round(contentAreaBounds.right + 10))
    : 8;

  const t = (deText, enText) => (uiLang === "de" ? deText : enText);

  useEffect(() => {
    if (!exerciseSideNav) {
      setExerciseSideHover(null);
      return undefined;
    }

    const handlePointerMove = (event) => {
      const host = contentAreaRef.current;
      if (!host) {
        setExerciseSideHover(null);
        return;
      }
      const rect = host.getBoundingClientRect();
      const x = event.clientX;
      const y = event.clientY;
      setContentAreaBounds((prev) => {
        const next = { left: rect.left, right: rect.right, viewportWidth: window.innerWidth };
        if (
          Math.abs(prev.left - next.left) < 0.5
          && Math.abs(prev.right - next.right) < 0.5
          && prev.viewportWidth === next.viewportWidth
        ) {
          return prev;
        }
        return next;
      });

      if (y < rect.top || y > rect.bottom) {
        setExerciseSideHover(null);
        return;
      }

      const nearLeft = x >= rect.left - EXERCISE_SIDE_TRIGGER_OUTSIDE_PX && x <= rect.left + EXERCISE_SIDE_TRIGGER_INSIDE_PX;
      const nearRight = x <= rect.right + EXERCISE_SIDE_TRIGGER_OUTSIDE_PX && x >= rect.right - EXERCISE_SIDE_TRIGGER_INSIDE_PX;

      if (nearLeft && !nearRight) {
        setExerciseSideHover("left");
        return;
      }
      if (nearRight && !nearLeft) {
        setExerciseSideHover("right");
        return;
      }
      setExerciseSideHover(null);
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("mousemove", handlePointerMove);
  }, [exerciseSideNav]);

  useEffect(() => {
    const updateBounds = () => {
      const host = contentAreaRef.current;
      if (!host || typeof window === "undefined") return;
      const rect = host.getBoundingClientRect();
      setContentAreaBounds({
        left: rect.left,
        right: rect.right,
        viewportWidth: window.innerWidth
      });
    };

    updateBounds();
    let rafId = null;
    let startedAt = null;
    const sampleDuringLayoutShift = (ts) => {
      if (startedAt == null) startedAt = ts;
      updateBounds();
      if (ts - startedAt < 550) {
        rafId = window.requestAnimationFrame(sampleDuringLayoutShift);
      }
    };
    rafId = window.requestAnimationFrame(sampleDuringLayoutShift);

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateBounds) : null;
    if (observer && contentAreaRef.current) {
      observer.observe(contentAreaRef.current);
    }
    window.addEventListener("resize", updateBounds);
    window.addEventListener("scroll", updateBounds, { passive: true });
    return () => {
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
      }
      if (observer) {
        observer.disconnect();
      }
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("scroll", updateBounds);
    };
  }, [activePage, isNavOpen]);

  function formatClientError(err, fallback) {
    const raw = typeof err?.message === "string" ? err.message.trim() : "";
    if (/did not match the expected pattern/i.test(raw) || /fetch url failed/i.test(raw)) {
      const locationProto = typeof window !== "undefined" ? window.location.protocol : "n/a";
      const locationOrigin = typeof window !== "undefined" ? window.location.origin : "n/a";
      const apiBaseRaw = typeof apiBase === "string" ? apiBase : "";
      const normalized = normalizedApiBase?.value || "";
      return t(
        `URL/Pattern-Fehler.\nProtokoll: ${locationProto}\nOrigin: ${locationOrigin}\nAPI Base (raw): ${apiBaseRaw || "(leer)"}\nAPI Base (normalized): ${normalized || "(leer)"}\nOriginalfehler: ${raw}`,
        `URL/pattern error.\nProtocol: ${locationProto}\nOrigin: ${locationOrigin}\nAPI base (raw): ${apiBaseRaw || "(empty)"}\nAPI base (normalized): ${normalized || "(empty)"}\nOriginal error: ${raw}`
      );
    }
    return raw || fallback;
  }

  async function appFetch(input, init) {
    try {
      return await fetch(input, init);
    } catch (err) {
      const target = typeof input === "string" ? input : (input?.url || String(input));
      const message = typeof err?.message === "string" ? err.message : String(err);
      throw new Error(`Fetch URL failed: ${target}\n${message}`);
    }
  }

  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      if (!state || state.__gtPageNav !== true) return;
      isApplyingHistoryRef.current = true;
      setActivePage(typeof state.activePage === "string" ? state.activePage : "home");
      setNormalPage(typeof state.normalPage === "string" ? state.normalPage : "toc");
      setBayesPage(typeof state.bayesPage === "string" ? state.bayesPage : "toc");
      setTreePage(typeof state.treePage === "string" ? state.treePage : "toc");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const navState = {
      __gtPageNav: true,
      activePage,
      normalPage,
      bayesPage,
      treePage
    };

    const lastState = lastHistoryStateRef.current;
    const isUnchanged =
      lastState &&
      lastState.activePage === navState.activePage &&
      lastState.normalPage === navState.normalPage &&
      lastState.bayesPage === navState.bayesPage &&
      lastState.treePage === navState.treePage;

    if (isUnchanged) return;

    try {
      if (!hasHistoryInitRef.current) {
        window.history.replaceState(navState, "");
        hasHistoryInitRef.current = true;
      } else if (isApplyingHistoryRef.current) {
        isApplyingHistoryRef.current = false;
      } else {
        window.history.pushState(navState, "");
      }
    } catch {
      // Ignore browser-specific History API pattern errors.
    }

    lastHistoryStateRef.current = navState;
  }, [activePage, normalPage, bayesPage, treePage]);

  const isDarkMode = themeMode === "dark";
  const isJluMode = themeMode === "jlu";

  useEffect(() => {
    document.body.classList.toggle("dark-mode", isDarkMode);
    document.documentElement.classList.toggle("dark-mode", isDarkMode);
    document.body.classList.toggle("jlu-mode", isJluMode);
    document.documentElement.classList.toggle("jlu-mode", isJluMode);
    try {
      window.localStorage.setItem(THEME_MODE_KEY, themeMode);
    } catch {
      // Ignore storage failures in private mode / restricted environments.
    }
    return () => {
      document.body.classList.remove("dark-mode");
      document.documentElement.classList.remove("dark-mode");
      document.body.classList.remove("jlu-mode");
      document.documentElement.classList.remove("jlu-mode");
    };
  }, [isDarkMode, isJluMode, themeMode]);

  useEffect(() => {
    setLegacyLang(uiLang);
    document.documentElement.lang = uiLang;
    window.localStorage.setItem("gt-lang", uiLang);
  }, [uiLang]);

  useEffect(() => {
    if (treeEx3Completed) return;
    if (!(treeEx3SpeSolved && treeEx3NashSolved && treeEx3ThreatSolved)) return;
    setTreeEx3Completed(true);
    setTreeEx3OverallFeedbackType("success");
    setTreeEx3OverallFeedback(
      t(
        "Sehr gut. Alle drei Teilfragen sind korrekt gelöst.",
        "Great. All three sub-questions are solved correctly."
      )
    );
    recordExerciseAttempt("tree_ex3", {
      correct: true,
      solved: true,
      lastState: "all-correct"
    });
  }, [treeEx3SpeSolved, treeEx3NashSolved, treeEx3ThreatSolved, treeEx3Completed, uiLang]);

  useEffect(() => {
    if (treeEx4Completed) return;
    if (!(treeEx4SpeSolved && treeEx4NashSolved)) return;
    setTreeEx4Completed(true);
    setTreeEx4OverallFeedbackType("success");
    setTreeEx4OverallFeedback(
      t(
        "Sehr gut. Beide Teilfragen sind korrekt gelöst.",
        "Great. Both sub-questions are solved correctly."
      )
    );
    recordExerciseAttempt("tree_ex4", {
      correct: true,
      solved: true,
      lastState: "all-correct"
    });
  }, [treeEx4SpeSolved, treeEx4NashSolved, treeEx4Completed, uiLang]);

  useEffect(() => {
    if (treeEx5Completed) return;
    if (!(treeEx5Phase1Solved && treeEx5SpeSolved)) return;
    const progressKey = treeEx5ActiveLevel === 1 ? "tree_ex5_3" : "tree_ex5_2";
    setTreeEx5Completed(true);
    setTreeEx5OverallFeedbackType("success");
    setTreeEx5OverallFeedback(
      t(
        "Sehr gut. Rückwärtsinduktion und SPE sind korrekt.",
        "Great. Backward induction and SPE are correct."
      )
    );
    recordExerciseAttempt(progressKey, {
      correct: true,
      solved: true,
      lastState: "all-correct"
    });
  }, [treeEx5Phase1Solved, treeEx5SpeSolved, treeEx5Completed, treeEx5ActiveLevel, uiLang]);

  useEffect(() => {
    if (treeEx8Completed) return;
    if (!(treeEx8P2Solved && treeEx8P1Solved && treeEx8SpeSolved)) return;
    setTreeEx8Completed(true);
    setTreeEx8OverallFeedbackType("success");
    setTreeEx8OverallFeedback(
      t(
        "Sehr gut. Du hast Rückwärtsinduktion und SPE im Stackelberg-Spiel korrekt gelöst.",
        "Great. You solved backward induction and SPE correctly in the Stackelberg game."
      )
    );
    recordExerciseAttempt("tree_ex8", {
      correct: true,
      solved: true,
      lastState: "all-correct"
    });
  }, [treeEx8P2Solved, treeEx8P1Solved, treeEx8SpeSolved, treeEx8Completed, uiLang]);

  useEffect(() => {
    resetTreeEx5();
  }, [treeEx5ActiveLevel]);

  useEffect(() => {
    try {
      window.localStorage.setItem(EXERCISE_PROGRESS_KEY, JSON.stringify(exerciseProgress));
    } catch {
      // Ignore storage failures in private mode / restricted environments.
    }
  }, [exerciseProgress]);

  useEffect(() => {
    const currentCard = SPECIAL_GAMES[specialCardIndex];
    if (!currentCard || currentCard.title !== PRISONERS_DILEMMA_TITLE) {
      setShowPrisonersAnalysis(false);
      setPrisonersFocusPlayer("");
      setShowPrisonersNash(false);
      setShowPrisonersInefficiency(false);
    }
    if (!currentCard || currentCard.title !== CHICKEN_GAME_TITLE) {
      setShowChickenAnalysis(false);
      setChickenFocusPlayer("");
      setShowChickenNash(false);
      setShowChickenCoordinationRisk(false);
    }
    if (!currentCard || currentCard.title !== STAG_HUNT_TITLE) {
      setShowStagAnalysis(false);
      setStagFocusPlayer("");
      setShowStagNash(false);
      setShowStagCoordinationRisk(false);
    }
    if (!currentCard || currentCard.title !== BATTLE_OF_SEXES_TITLE) {
      setShowBosAnalysis(false);
      setBosFocusPlayer("");
      setShowBosNash(false);
      setShowBosCoordinationRisk(false);
    }
    if (!currentCard || currentCard.title !== ULTIMATUM_TITLE) {
      setShowUltimatumAnalysis(false);
      setUltimatumFocusPlayer("");
      setShowUltimatumNash(false);
      setShowUltimatumFairnessGap(false);
    }
  }, [specialCardIndex]);

  function recordExerciseAttempt(exerciseKey, { correct, lastState, solved }) {
    setExerciseProgress((prev) => {
      const timestamp = Date.now();
      const current = prev[exerciseKey] || { attempts: 0, correct: 0, solved: false, lastState: "", updatedAt: 0, recentAttempts: [] };
      const nextAttempts = current.attempts + 1;
      const nextCorrect = current.correct + (correct ? 1 : 0);
      const nextSolved = current.solved || (typeof solved === "boolean" ? solved : !!correct);
      const recentAttempts = Array.isArray(current.recentAttempts) ? current.recentAttempts : [];
      const nextRecentAttempts = [...recentAttempts, { correct: !!correct, updatedAt: timestamp }]
        .slice(-EXERCISE_RECENT_ATTEMPTS_LIMIT);
      return {
        ...prev,
        [exerciseKey]: {
          attempts: nextAttempts,
          correct: nextCorrect,
          solved: nextSolved,
          lastState: lastState || "",
          updatedAt: timestamp,
          recentAttempts: nextRecentAttempts
        }
      };
    });
  }

  function buildProgressMeta(progressKeys) {
    const keys = Array.isArray(progressKeys) ? progressKeys : [progressKeys];
    const entries = keys.map((key) => exerciseProgress[key]).filter(Boolean);
    if (!entries.length) {
      return t("Offen", "Open");
    }

    const attempts = entries.reduce((sum, entry) => sum + (entry.attempts || 0), 0);
    if (attempts === 0) {
      return t("Offen", "Open");
    }
    const correct = entries.reduce((sum, entry) => sum + (entry.correct || 0), 0);
    const errorRate = Math.round(((attempts - correct) / attempts) * 100);
    const mergedRecent = entries
      .flatMap((entry) => {
        if (Array.isArray(entry.recentAttempts) && entry.recentAttempts.length) {
          return entry.recentAttempts.map((item) => ({
            correct: !!item?.correct,
            updatedAt: Number(item?.updatedAt) || 0
          }));
        }
        return [];
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3)
      .reverse();
    let symbolText = mergedRecent.map((item) => (item.correct ? "✓" : "✗")).join(" ");
    if (!symbolText) {
      const syntheticLength = Math.min(attempts, 3);
      const syntheticCorrect = Math.min(correct, syntheticLength);
      const syntheticIncorrect = Math.max(0, syntheticLength - syntheticCorrect);
      symbolText = `${"✓ ".repeat(syntheticCorrect)}${"✗ ".repeat(syntheticIncorrect)}`.trim() || "–";
    }
    return t(
      `${symbolText} · Fehlerquote: ${errorRate}%`,
      `${symbolText} · Error rate: ${errorRate}%`
    );
  }

  function solvedCountLabel(progressKeys) {
    const keys = Array.isArray(progressKeys) ? progressKeys : [progressKeys];
    const solved = keys.reduce((sum, key) => sum + (exerciseProgress[key]?.solved ? 1 : 0), 0);
    return t(`(${solved}/${keys.length} gelöst)`, `(${solved}/${keys.length} solved)`);
  }

  function apiUrl(path) {
    if (!normalizedApiBase.valid) {
      throw new Error(
        t(
          "Ungültige API Base URL. Bitte verwende z. B. http://localhost:8000 oder eine vollständige https-URL.",
          "Invalid API base URL. Use e.g. http://localhost:8000 or a full https URL."
        )
      );
    }
    if (normalizedApiBase.value) {
      return `${normalizedApiBase.value}${path}`;
    }

    if (typeof window !== "undefined" && /^https?:$/i.test(window.location.protocol)) {
      return `${window.location.origin}${path}`;
    }

    // Fallback for non-http contexts (e.g. file://), where relative /api URLs can fail pattern parsing.
    return `https://game-theory-api.onrender.com${path}`;
  }

  function safeApiUrl(path) {
    try {
      return apiUrl(path);
    } catch (err) {
      const message = typeof err?.message === "string" ? err.message : String(err);
      throw new Error(`API URL build failed: ${path}\n${message}`);
    }
  }

  function updateNode(nodeId, updater) {
    setGame((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) => (node.id === nodeId ? updater(node) : node))
    }));
  }

  function addNode(type) {
    const nextId = `n${idCounter}`;
    setIdCounter((v) => v + 1);

    const node =
      type === "decision"
        ? { id: nextId, node_type: "decision", player: game.players[0], actions: [] }
        : {
            id: nextId,
            node_type: "terminal",
            payoff: { by_player: { P1: 0, P2: 0 } }
          };

    setGame((prev) => ({ ...prev, nodes: [...prev.nodes, node] }));
    setSelectedNodeId(nextId);
  }

  function deleteSelectedNode() {
    if (!selectedNode || selectedNode.id === game.root) {
      return;
    }
    setGame((prev) => ({
      ...prev,
      nodes: prev.nodes
        .filter((node) => node.id !== selectedNode.id)
        .map((node) => {
          if (node.node_type !== "decision") {
            return node;
          }
          return {
            ...node,
            actions: node.actions.filter((a) => a.child !== selectedNode.id)
          };
        })
    }));
    setSelectedNodeId(game.root);
    if (connectSourceId === selectedNode.id) {
      setConnectSourceId("");
    }
  }

  function resetEliminator() {
    const currentNeKey = eliminatorGame?.neKey || "";
    const candidates = ELIMINATOR_PRESETS.filter((preset) => preset.neKey !== currentNeKey);
    const pool = candidates.length ? candidates : ELIMINATOR_PRESETS;
    const nextIndex = randomInt(0, pool.length - 1);
    const nextGame = pool[nextIndex];
    setEliminatorGame(nextGame);
    setEliminatorActiveRows(nextGame.rows);
    setEliminatorActiveCols(nextGame.cols);
    setEliminatorCheckIndex(0);
    setEliminatorDecisionCount(1);
    setEliminatorFeedback("");
    setEliminatorFeedbackType("neutral");
    setEliminatorShowWhy(false);
    setEliminatorShowNash(false);
  }

  function resetBestResponseExplorer() {
    setBrExplorerGame(buildRandomBestResponseGame());
    setBrExplorerStep(1);
    setBrExplorerP1Selected([]);
    setBrExplorerP2Selected([]);
    setBrExplorerFeedback("");
    setBrExplorerFeedbackType("neutral");
  }

  function toggleBrExplorerSelection(key) {
    if (brExplorerStep === 1) {
      setBrExplorerP1Selected((prev) => (prev.includes(key) ? prev.filter((entry) => entry !== key) : [...prev, key]));
    } else {
      setBrExplorerP2Selected((prev) => (prev.includes(key) ? prev.filter((entry) => entry !== key) : [...prev, key]));
    }
    setBrExplorerFeedback("");
    setBrExplorerFeedbackType("neutral");
  }

  function checkBestResponseExplorer() {
    const nashText = brExplorerCorrect.nash.length
      ? brExplorerCorrect.nash.map(formatCellKey).join(", ")
      : t("kein reines Nash-Gleichgewicht", "no pure Nash equilibrium");

    if (brExplorerStep === 1) {
      const p1Correct = sameChoiceSet(brExplorerP1Selected, brExplorerCorrect.p1);
      if (p1Correct) {
        setBrExplorerStep(2);
        setBrExplorerFeedbackType("success");
        setBrExplorerFeedback(
          t(
            "Richtig. Jetzt Schritt 2: Markiere die besten Antworten von Spieler 2 (u₂-Maxima je Zeile).",
            "Correct. Now step 2: mark Player-2 best responses (u2 maxima by row)."
          )
        );
        return;
      }
      setBrExplorerFeedbackType("error");
      setBrExplorerFeedback(
        t(
          "Nicht korrekt. Prüfe für jede Spalte, in welcher Zelle u₁ maximal ist.",
          "Not correct. Check for each column in which cell u1 is maximal."
        )
      );
      return;
    }

    const p2Correct = sameChoiceSet(brExplorerP2Selected, brExplorerCorrect.p2);
    if (p2Correct) {
      setBrExplorerFeedbackType("success");
      setBrExplorerFeedback(
        t(
          `Richtig. Reine Nash-Gleichgewichte: ${nashText}.`,
          `Correct. Pure Nash equilibria: ${nashText}.`
        )
      );
      return;
    }

    setBrExplorerFeedbackType("error");
    setBrExplorerFeedback(
      t(
        "Nicht korrekt. Prüfe für jede Zeile, in welcher Zelle u₂ maximal ist. Der Schnitt mit Schritt 1 ergibt die reinen Nash-Gleichgewichte.",
        "Not correct. Check for each row in which cell u2 is maximal. The intersection with step 1 gives the pure Nash equilibria."
      )
    );
  }

  function getSpecialQuizTypeLabel(typeKey) {
    switch (typeKey) {
      case "pd":
        return t("Gefangenendilemma", "Prisoner's dilemma");
      case "chicken":
        return t("Feiglingsspiel (Chicken)", "Chicken game");
      case "stag":
        return t("Jagdspiel (Stag Hunt)", "Stag hunt");
      case "bos":
        return t("Kampf der Geschlechter", "Battle of the sexes");
      default:
        return t("Ultimatumspiel", "Ultimatum game");
    }
  }

  function resetSpecialQuiz() {
    setSpecialQuizData((prev) => buildSpecialGameQuiz(prev?.typeKey || ""));
    setSpecialQuizSelected("");
    setSpecialQuizFeedback("");
    setSpecialQuizFeedbackType("neutral");
  }

  function checkSpecialQuiz() {
    if (!specialQuizSelected) {
      setSpecialQuizFeedbackType("warning");
      setSpecialQuizFeedback(t("Bitte wähle zuerst einen Spieltyp aus.", "Please select a game type first."));
      return;
    }
    const isCorrect = specialQuizSelected === specialQuizData.typeKey;
    if (!isCorrect) {
      setSpecialQuizFeedbackType("error");
      setSpecialQuizFeedback(
        t(
          `Nicht korrekt. Das gezeigte Spiel ist ein ${getSpecialQuizTypeLabel(specialQuizData.typeKey)}.`,
          `Not correct. The shown game is a ${getSpecialQuizTypeLabel(specialQuizData.typeKey)}.`
        )
      );
      recordExerciseAttempt("special_quiz", {
        correct: false,
        lastState: specialQuizSelected,
        solved: false
      });
      return;
    }
    setSpecialQuizFeedbackType("success");
    setSpecialQuizFeedback(
      t(
        `Richtig. Das ist ein ${getSpecialQuizTypeLabel(specialQuizData.typeKey)}.`,
        `Correct. This is a ${getSpecialQuizTypeLabel(specialQuizData.typeKey)}.`
      )
    );
    recordExerciseAttempt("special_quiz", {
      correct: true,
      lastState: specialQuizSelected,
      solved: true
    });
  }

  function goToSpecialCard(index) {
    const cardCount = SPECIAL_GAMES.length;
    if (!cardCount) return;
    setSpecialCardIndex((index + cardCount) % cardCount);
  }

  function shiftSpecialCard(step) {
    setSpecialCardIndex((prev) => {
      const cardCount = SPECIAL_GAMES.length;
      if (!cardCount) return 0;
      return (prev + step + cardCount) % cardCount;
    });
  }

  function onSpecialCardTouchStart(event) {
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    specialSwipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function onSpecialCardTouchEnd(event) {
    const start = specialSwipeStartRef.current;
    specialSwipeStartRef.current = null;
    if (!start) return;
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SPECIAL_CARD_SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) {
      return;
    }
    shiftSpecialCard(dx < 0 ? 1 : -1);
  }

  function togglePrisonersAnalysisMode(mode) {
    const sameP1 = mode === "p1" && prisonersFocusPlayer === "p1";
    const sameP2 = mode === "p2" && prisonersFocusPlayer === "p2";
    const sameNash = mode === "nash" && showPrisonersNash;
    const sameIneff = mode === "ineff" && showPrisonersInefficiency;

    if (mode === "p1") {
      setPrisonersFocusPlayer(sameP1 ? "" : "p1");
      setShowPrisonersNash(false);
      setShowPrisonersInefficiency(false);
      return;
    }
    if (mode === "p2") {
      setPrisonersFocusPlayer(sameP2 ? "" : "p2");
      setShowPrisonersNash(false);
      setShowPrisonersInefficiency(false);
      return;
    }
    if (mode === "nash") {
      setPrisonersFocusPlayer("");
      setShowPrisonersNash(!sameNash);
      setShowPrisonersInefficiency(false);
      return;
    }
    if (mode === "ineff") {
      setPrisonersFocusPlayer("");
      setShowPrisonersNash(false);
      setShowPrisonersInefficiency(!sameIneff);
    }
  }

  function toggleChickenAnalysisMode(mode) {
    const sameP1 = mode === "p1" && chickenFocusPlayer === "p1";
    const sameP2 = mode === "p2" && chickenFocusPlayer === "p2";
    const sameNash = mode === "nash" && showChickenNash;
    const sameRisk = mode === "risk" && showChickenCoordinationRisk;

    if (mode === "p1") {
      setChickenFocusPlayer(sameP1 ? "" : "p1");
      setShowChickenNash(false);
      setShowChickenCoordinationRisk(false);
      return;
    }
    if (mode === "p2") {
      setChickenFocusPlayer(sameP2 ? "" : "p2");
      setShowChickenNash(false);
      setShowChickenCoordinationRisk(false);
      return;
    }
    if (mode === "nash") {
      setChickenFocusPlayer("");
      setShowChickenNash(!sameNash);
      setShowChickenCoordinationRisk(false);
      return;
    }
    if (mode === "risk") {
      setChickenFocusPlayer("");
      setShowChickenNash(false);
      setShowChickenCoordinationRisk(!sameRisk);
    }
  }

  function toggleStagAnalysisMode(mode) {
    const sameP1 = mode === "p1" && stagFocusPlayer === "p1";
    const sameP2 = mode === "p2" && stagFocusPlayer === "p2";
    const sameNash = mode === "nash" && showStagNash;
    const sameRisk = mode === "risk" && showStagCoordinationRisk;

    if (mode === "p1") {
      setStagFocusPlayer(sameP1 ? "" : "p1");
      setShowStagNash(false);
      setShowStagCoordinationRisk(false);
      return;
    }
    if (mode === "p2") {
      setStagFocusPlayer(sameP2 ? "" : "p2");
      setShowStagNash(false);
      setShowStagCoordinationRisk(false);
      return;
    }
    if (mode === "nash") {
      setStagFocusPlayer("");
      setShowStagNash(!sameNash);
      setShowStagCoordinationRisk(false);
      return;
    }
    if (mode === "risk") {
      setStagFocusPlayer("");
      setShowStagNash(false);
      setShowStagCoordinationRisk(!sameRisk);
    }
  }

  function toggleBosAnalysisMode(mode) {
    const sameP1 = mode === "p1" && bosFocusPlayer === "p1";
    const sameP2 = mode === "p2" && bosFocusPlayer === "p2";
    const sameNash = mode === "nash" && showBosNash;
    const sameRisk = mode === "risk" && showBosCoordinationRisk;

    if (mode === "p1") {
      setBosFocusPlayer(sameP1 ? "" : "p1");
      setShowBosNash(false);
      setShowBosCoordinationRisk(false);
      return;
    }
    if (mode === "p2") {
      setBosFocusPlayer(sameP2 ? "" : "p2");
      setShowBosNash(false);
      setShowBosCoordinationRisk(false);
      return;
    }
    if (mode === "nash") {
      setBosFocusPlayer("");
      setShowBosNash(!sameNash);
      setShowBosCoordinationRisk(false);
      return;
    }
    if (mode === "risk") {
      setBosFocusPlayer("");
      setShowBosNash(false);
      setShowBosCoordinationRisk(!sameRisk);
    }
  }

  function toggleUltimatumAnalysisMode(mode) {
    const sameP1 = mode === "p1" && ultimatumFocusPlayer === "p1";
    const sameP2 = mode === "p2" && ultimatumFocusPlayer === "p2";
    const sameNash = mode === "nash" && showUltimatumNash;
    const sameFair = mode === "fair" && showUltimatumFairnessGap;

    if (mode === "p1") {
      setUltimatumFocusPlayer(sameP1 ? "" : "p1");
      setShowUltimatumNash(false);
      setShowUltimatumFairnessGap(false);
      return;
    }
    if (mode === "p2") {
      setUltimatumFocusPlayer(sameP2 ? "" : "p2");
      setShowUltimatumNash(false);
      setShowUltimatumFairnessGap(false);
      return;
    }
    if (mode === "nash") {
      setUltimatumFocusPlayer("");
      setShowUltimatumNash(!sameNash);
      setShowUltimatumFairnessGap(false);
      return;
    }
    if (mode === "fair") {
      setUltimatumFocusPlayer("");
      setShowUltimatumNash(false);
      setShowUltimatumFairnessGap(!sameFair);
    }
  }

  function answerEliminator(answerYes) {
    if (!eliminatorQuestion) {
      return;
    }
    const { check, result } = eliminatorQuestion;
    const isCorrect = answerYes === result;
    if (!isCorrect) {
      setEliminatorFeedbackType("error");
      setEliminatorFeedback(
        t(
          "Nicht korrekt. Prüfe die Auszahlungen erneut und entscheide dann Ja oder Nein.",
          "Not correct. Check the payoffs again and decide yes or no."
        )
      );
      return;
    }

    if (answerYes) {
      if (check.player === 1) {
        setEliminatorActiveRows((prev) => prev.filter((r) => r !== check.dominated));
      } else {
        setEliminatorActiveCols((prev) => prev.filter((c) => c !== check.dominated));
      }
      setEliminatorFeedbackType("success");
      setEliminatorFeedback(
        t(
          `Richtig: ${check.dominated} wird gestrichen.`,
          `Correct: ${check.dominated} is eliminated.`
        )
      );
      setEliminatorCheckIndex(0);
    } else {
      setEliminatorFeedbackType("success");
      setEliminatorFeedback(
        t(
          `Richtig: ${check.dominated} wird in diesem Schritt nicht gestrichen.`,
          `Correct: ${check.dominated} is not eliminated at this step.`
        )
      );
      setEliminatorCheckIndex((prev) => prev + 1);
    }
    setEliminatorDecisionCount((prev) => prev + 1);
    setEliminatorShowWhy(false);
    setEliminatorShowNash(false);
  }

  function nextBackwardStep() {
    setBackwardStep((prev) => Math.min(2, prev + 1));
  }

  function prevBackwardStep() {
    setBackwardStep((prev) => Math.max(0, prev - 1));
  }

  function setProfileNodeAction(node, action) {
    setProfileNotationP3((prev) => ({ ...prev, [node]: action }));
  }

  function setProfileP2Action(node, action) {
    setProfileNotationP2((prev) => ({ ...prev, [node]: action }));
  }

  function checkProfileNotationQuiz() {
    if (!profileNotationQuizAnswer) {
      setProfileNotationQuizType("warning");
      setProfileNotationQuizFeedback(
        t(
          "Bitte wähle zuerst eine Option.",
          "Please select an option first."
        )
      );
      return;
    }
    if (profileNotationQuizAnswer === "ab") {
      setProfileNotationQuizType("success");
      setProfileNotationQuizFeedback(
        t(
          "Richtig. (a, b) ist eine vollständige reine Strategie von Spieler 2, weil beide eigenen Knoten (nach L und nach R) belegt sind.",
          "Correct. (a, b) is a complete pure strategy of Player 2 because both own nodes (after L and after R) are specified."
        )
      );
      return;
    }
    setProfileNotationQuizType("error");
    setProfileNotationQuizFeedback(
      t(
        "Nicht korrekt. Für Spieler 2 braucht eine Strategie hier genau zwei Einträge: nach L und nach R.",
        "Not correct. For Player 2, a strategy here needs exactly two entries: after L and after R."
      )
    );
  }

  function checkInfoSetQuiz() {
    if (!infoSetQuizAnswer) {
      setInfoSetQuizType("warning");
      setInfoSetQuizFeedback(
        t(
          "Bitte wähle zuerst eine Option.",
          "Please select an option first."
        )
      );
      return;
    }
    if (infoSetQuizAnswer === "same-info-set") {
      setInfoSetQuizType("success");
      setInfoSetQuizFeedback(
        t(
          "Richtig. Die Knoten liegen in derselben Informationsmenge: Spieler 2 weiß an diesem Punkt nicht, ob vorher L oder R gespielt wurde.",
          "Correct. The two nodes are in the same information set: at this point, Player 2 does not know whether L or R was played before."
        )
      );
      return;
    }
    setInfoSetQuizType("error");
    setInfoSetQuizFeedback(
      t(
        "Nicht korrekt. Die gestrichelte Verbindung bedeutet nicht perfekte Beobachtung, sondern unvollständige Information über den zuvor erreichten Knoten.",
        "Not correct. The dashed link does not mean perfect observation; it means incomplete information about which previous node was reached."
      )
    );
  }

  function startConnectFromSelected() {
    if (!selectedNode || selectedNode.node_type !== "decision") {
      return;
    }
    setConnectSourceId(selectedNode.id);
  }

  function connectToNode(targetId) {
    if (!connectSourceId || connectSourceId === targetId) {
      return;
    }
    const source = game.nodes.find((n) => n.id === connectSourceId);
    if (!source || source.node_type !== "decision") {
      setConnectSourceId("");
      return;
    }
    const nextActionId = `a${source.actions.length + 1}`;
    updateNode(connectSourceId, (node) => ({
      ...node,
      actions: [
        ...node.actions,
        {
          id: nextActionId,
          label: `${newActionLabel} ${source.actions.length + 1}`,
          child: targetId
        }
      ]
    }));
    setConnectSourceId("");
  }

  function removeAction(actionId) {
    if (!selectedNode || selectedNode.node_type !== "decision") {
      return;
    }
    updateNode(selectedNode.id, (node) => ({
      ...node,
      actions: node.actions.filter((a) => a.id !== actionId)
    }));
  }

  async function solveGameTree() {
    setError("");
    setResult("");
    setLoading(true);
    try {
      if (apiBase.trim() && !normalizedApiBase.valid) {
        throw new Error(
          t(
            "Ungültige API Base URL. Bitte verwende z. B. http://localhost:8000 oder eine vollständige https-URL.",
            "Invalid API base URL. Use e.g. http://localhost:8000 or a full https URL."
          )
        );
      }
      const response = await appFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setSolveData(body);
      setResult(JSON.stringify(body, null, 2));
    } catch (err) {
      setSolveData(null);
      setError(formatClientError(err, "request failed"));
    } finally {
      setLoading(false);
    }
  }

  async function loadEx1() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl(`/api/v1/exercises/ex1/new?lang=${legacyLang}`));
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx1Data(body);
      setEx1Selected("");
      setEx1Feedback("");
      setEx1FeedbackType("neutral");
      setShowHelpEx1(false);
    } catch (err) {
      setError(formatClientError(err, "exercise request failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function checkEx1() {
    if (!ex1Data || !ex1Selected) {
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/ex1/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: ex1Data.game,
          question: ex1Data.question,
          selected_choice_id: ex1Selected,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx1Feedback(`${body.feedback}`);
      setEx1FeedbackType(body.correct ? "success" : "error");
      recordExerciseAttempt("normal_ex1", { correct: body.correct, lastState: ex1Selected });
    } catch (err) {
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx2() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl(`/api/v1/exercises/ex2/new?lang=${legacyLang}`));
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx2Data(body);
      setEx2Selected("");
      setEx2Feedback("");
      setEx2FeedbackType("neutral");
      setShowHelpEx2(false);
    } catch (err) {
      setError(formatClientError(err, "exercise request failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function checkEx2() {
    if (!ex2Data || !ex2Selected) {
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/ex2/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: ex2Data.game,
          selected_choice_id: ex2Selected,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx2Feedback(`${body.feedback}\n${body.explanation}`);
      setEx2FeedbackType(body.correct ? "success" : "error");
      recordExerciseAttempt("normal_ex2", { correct: body.correct, lastState: ex2Selected });
    } catch (err) {
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx3() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl(`/api/v1/exercises/ex3/new?lang=${legacyLang}`));
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx3Data(body);
      setEx3Selected("");
      setEx3Feedback("");
      setEx3FeedbackType("neutral");
      setShowHelpEx3(false);
    } catch (err) {
      setError(formatClientError(err, "exercise request failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function checkEx3() {
    if (!ex3Data || !ex3Selected) {
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/ex3/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: ex3Data.game,
          selected_choice_id: ex3Selected,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx3Feedback(`${body.feedback}\n${body.explanation}`);
      setEx3FeedbackType(body.correct ? "success" : "error");
      recordExerciseAttempt("normal_ex3", { correct: body.correct, lastState: ex3Selected });
    } catch (err) {
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx4() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/ex4/new"));
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx4Data(body);
      setEx4Selected([]);
      setEx4Feedback("");
      setEx4FeedbackType("neutral");
      setShowHelpEx4(false);
    } catch (err) {
      setError(formatClientError(err, "exercise request failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function checkEx4() {
    if (!ex4Data) {
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/ex4/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: ex4Data.game,
          selected_choice_ids: ex4Selected,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx4Feedback(`${body.feedback}\n${body.explanation}`);
      setEx4FeedbackType(body.correct ? "success" : "error");
      recordExerciseAttempt("normal_ex4", { correct: body.correct, lastState: ex4Selected.join(", ") || "-" });
    } catch (err) {
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx5() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl(`/api/v1/exercises/ex5/new?lang=${legacyLang}`));
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx5Data(body);
      setEx5Answers({});
      setEx5Feedback("");
      setEx5FeedbackType("neutral");
      setShowHelpEx5(false);
    } catch (err) {
      setError(formatClientError(err, "exercise request failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function checkEx5() {
    if (!ex5Data) {
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const answers = [];
      ex5Data.game.rows.forEach((r) => {
        ex5Data.game.cols.forEach((c) => {
          const key = `${r}|${c}`;
          if (ex5Answers[key]) {
            answers.push({ row: r, col: c, value: ex5Answers[key] });
          }
        });
      });
      const response = await appFetch(safeApiUrl("/api/v1/exercises/ex5/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: ex5Data.game,
          answers,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx5Feedback(body.feedback);
      setEx5FeedbackType(body.correct ? "success" : (body.missing > 0 ? "warning" : "error"));
      recordExerciseAttempt("normal_ex5", {
        correct: !!body.correct,
        lastState: `cells=${answers.length}`,
        solved: !!body.correct
      });
    } catch (err) {
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx6() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/ex6/new"));
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx6Data(body);
      setEx6Selected("");
      setEx6Feedback("");
      setEx6FeedbackType("neutral");
      setShowHelpEx6(false);
    } catch (err) {
      setError(formatClientError(err, "exercise request failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function checkEx6() {
    if (!ex6Data || !ex6Selected) {
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/ex6/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: ex6Data.game,
          selected_choice_id: ex6Selected,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx6Feedback(body.feedback);
      setEx6FeedbackType(body.correct ? "success" : "error");
      recordExerciseAttempt("normal_ex6", { correct: body.correct, lastState: ex6Selected });
    } catch (err) {
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx7() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl(`/api/v1/exercises/ex7/new?lang=${legacyLang}`));
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx7Data(body);
      setEx7Selected([]);
      setEx7Feedback("");
      setEx7FeedbackType("neutral");
      setShowHelpEx7(false);
    } catch (err) {
      setError(formatClientError(err, "exercise request failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function checkEx7() {
    if (!ex7Data) {
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/ex7/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: ex7Data.game,
          selected_choice_ids: ex7Selected,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx7Feedback(`${body.feedback}\n${body.details}`);
      setEx7FeedbackType(body.correct ? "success" : "error");
      recordExerciseAttempt("normal_ex7", { correct: body.correct, lastState: ex7Selected.join(", ") || "-" });
    } catch (err) {
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx8() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl(`/api/v1/exercises/ex8/new?lang=${legacyLang}`));
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx8Data(body);
      setEx8Selected([]);
      setEx8Feedback("");
      setEx8FeedbackType("neutral");
      setShowHelpEx8(false);
    } catch (err) {
      setError(formatClientError(err, "exercise request failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function checkEx8() {
    if (!ex8Data) {
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/ex8/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: ex8Data.game,
          selected_choice_ids: ex8Selected,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx8Feedback(`${body.feedback}\n${body.details}`);
      setEx8FeedbackType(body.correct ? "success" : "error");
      recordExerciseAttempt("normal_ex8", { correct: body.correct, lastState: ex8Selected.join(", ") || "-" });
    } catch (err) {
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx9() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/ex9/new"));
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx9Data(body);
      setEx9Selected("");
      setEx9Feedback("");
      setEx9FeedbackType("neutral");
      setShowHelpEx9(false);
    } catch (err) {
      setError(formatClientError(err, "exercise request failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function checkEx9() {
    if (!ex9Data || !ex9Selected) {
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/ex9/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: ex9Data.game,
          a: ex9Data.a,
          selected_choice_id: ex9Selected,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setEx9Feedback(body.feedback);
      setEx9FeedbackType(body.correct ? "success" : "error");
      recordExerciseAttempt("normal_ex9", { correct: body.correct, lastState: ex9Selected });
    } catch (err) {
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadBayesEx1() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/bayes/ex1/new"));
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setBayesEx1Data(body);
      setBayesEx1Selected([]);
      setBayesEx1Feedback("");
      setBayesEx1FeedbackType("neutral");
      setShowHelpBayesEx1(false);
    } catch (err) {
      setError(formatClientError(err, "exercise request failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function checkBayesEx1() {
    if (!bayesEx1Data) {
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/bayes/ex1/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          params: bayesEx1Data.params,
          selected_choice_ids: bayesEx1Selected,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      const correctText = body.correct_choice_ids?.length ? body.correct_choice_ids.join(", ") : "keines";
      setBayesEx1Feedback(`${body.feedback}\n${legacyLang === "de" ? "Richtig ist" : "Correct is"}: ${correctText}`);
      setBayesEx1FeedbackType(body.correct ? "success" : "error");
      recordExerciseAttempt("bayes_ex1", { correct: body.correct, lastState: bayesEx1Selected.join(", ") || "-" });
    } catch (err) {
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadBayesEx2a() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/bayes/ex2a/new"));
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setBayesEx2aData(body);
      setBayesEx2aSelected("");
      setBayesEx2aFeedback("");
      setBayesEx2aFeedbackType("neutral");
      setBayesEx2aIntermediate("");
      setBayesEx2aSubmitted(false);
      setShowHelpBayesEx2a(false);
      setBayesEx2bData(null);
      setBayesEx2bSelected([]);
      setBayesEx2bFeedback("");
      setBayesEx2bFeedbackType("neutral");
    } catch (err) {
      setError(formatClientError(err, "exercise request failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function checkBayesEx2a() {
    if (!bayesEx2aData || !bayesEx2aSelected) {
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/bayes/ex2a/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          params: bayesEx2aData.params,
          selected_choice_id: bayesEx2aSelected,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setBayesEx2aFeedback(`${body.feedback}\n${body.intermediate}`);
      setBayesEx2aFeedbackType(body.correct ? "success" : "error");
      setBayesEx2aIntermediate(body.intermediate || "");
      setBayesEx2aSubmitted(true);
      recordExerciseAttempt("bayes_ex2a", { correct: body.correct, lastState: bayesEx2aSelected });
    } catch (err) {
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadBayesEx2b() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl(`/api/v1/exercises/bayes/ex2b/new?lang=${legacyLang}`));
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      const merged = bayesEx2aData ? { ...body, params: bayesEx2aData.params } : body;
      setBayesEx2bData(merged);
      setBayesEx2bSelected([]);
      setBayesEx2bFeedback("");
      setBayesEx2bFeedbackType("neutral");
      setShowHelpBayesEx2b(false);
    } catch (err) {
      setError(formatClientError(err, "exercise request failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function checkBayesEx2b() {
    if (!bayesEx2bData) {
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/bayes/ex2b/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          params: bayesEx2bData.params,
          alt_key: bayesEx2bData.alt_key,
          selected_choice_ids: bayesEx2bSelected,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setBayesEx2bFeedback(`${body.feedback}\n${body.details}`);
      setBayesEx2bFeedbackType(body.correct ? "success" : "error");
      recordExerciseAttempt("bayes_ex2b", { correct: body.correct, lastState: bayesEx2bSelected.join(", ") || "-" });
    } catch (err) {
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  useEffect(() => {
    if (activePage === "solve-normal") {
      if (normalPage === "ex1" && !ex1Data && !legacyLoading) loadEx1();
      if (normalPage === "ex2" && !ex2Data && !legacyLoading) loadEx2();
      if (normalPage === "ex3" && !ex3Data && !legacyLoading) loadEx3();
      if (normalPage === "ex4" && !ex4Data && !legacyLoading) loadEx4();
      if (normalPage === "ex5" && !ex5Data && !legacyLoading) loadEx5();
      if (normalPage === "ex6" && !ex6Data && !legacyLoading) loadEx6();
      if (normalPage === "ex7" && !ex7Data && !legacyLoading) loadEx7();
      if (normalPage === "ex8" && !ex8Data && !legacyLoading) loadEx8();
      if (normalPage === "ex9" && !ex9Data && !legacyLoading) loadEx9();
    }

    if (activePage === "solve-bayesian") {
      if (bayesPage === "ex1" && !bayesEx1Data && !legacyLoading) loadBayesEx1();
      if (bayesPage === "ex2a" && !bayesEx2aData && !legacyLoading) loadBayesEx2a();
      if (bayesPage === "ex2b" && !bayesEx2bData && !legacyLoading) loadBayesEx2b();
    }
  }, [
    activePage,
    normalPage,
    bayesPage,
    ex1Data,
    ex2Data,
    ex3Data,
    ex4Data,
    ex5Data,
    ex6Data,
    ex7Data,
    ex8Data,
    ex9Data,
    bayesEx1Data,
    bayesEx2aData,
    bayesEx2bData,
    legacyLoading
  ]);

  function renderTreeBuilder(title, desc) {
    return (
      <>
        <section className="panel">
          <h2>{title}</h2>
          <p>{desc}</p>
          <div className="top-controls">
            <div>
              <label htmlFor="api-base">API Base URL (optional)</label>
              <input
                id="api-base"
                placeholder="leer lassen für Proxy auf localhost:8000"
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
              />
              <p className="endpoint">Endpoint: {endpoint}</p>
            </div>
            <div className="actions">
              <button type="button" onClick={solveGameTree} disabled={loading}>
                {loading ? "Löse..." : "Tree lösen"}
              </button>
            </div>
          </div>
        </section>

        <section className="builder-grid">
          <article className="panel">
            <h2>Canvas</h2>
            <div className="actions">
              <button type="button" onClick={() => addNode("decision")}>+ Decision Node</button>
              <button type="button" onClick={() => addNode("terminal")}>+ Terminal Node</button>
              <button
                type="button"
                onClick={startConnectFromSelected}
                disabled={!selectedNode || selectedNode.node_type !== "decision"}
              >
                Connect from selected
              </button>
              <button type="button" onClick={deleteSelectedNode} disabled={!selectedNode || selectedNode.id === game.root}>
                Delete selected
              </button>
            </div>
            <label htmlFor="action-prefix">Action label prefix</label>
            <input id="action-prefix" value={newActionLabel} onChange={(e) => setNewActionLabel(e.target.value)} />
            {connectSourceId && (
              <p className="hint">
                Connect mode aktiv von <code>{connectSourceId}</code>: klicke ein Ziel im Canvas.
              </p>
            )}
            <div className="canvas-wrap">
              <svg width={layout.width} height={layout.height} className="edge-layer">
                {game.nodes.map((node) => {
                  if (node.node_type !== "decision") return null;
                  return node.actions.map((action) => {
                    const from = layout.positions[node.id];
                    const to = layout.positions[action.child];
                    if (!from || !to) return null;
                    const isChosen = highlights.chosen.has(`${node.id}:${action.id}`);
                    return (
                      <g key={`${node.id}-${action.id}`}>
                        <line
                          x1={from.x + NODE_W / 2}
                          y1={from.y + NODE_H}
                          x2={to.x + NODE_W / 2}
                          y2={to.y}
                          className={isChosen ? "edge chosen-edge" : "edge"}
                        />
                        <text
                          x={(from.x + to.x + NODE_W) / 2}
                          y={(from.y + to.y + NODE_H) / 2}
                          className="edge-label"
                        >
                          {action.label}
                        </text>
                      </g>
                    );
                  });
                })}
              </svg>
              <div className="node-layer">
                {game.nodes.map((node) => {
                  const pos = layout.positions[node.id];
                  if (!pos) return null;
                  const selected = node.id === selectedNodeId;
                  const onPath = highlights.chosenNodes.has(node.id);
                  const classes = [
                    "node-card",
                    node.node_type === "decision" ? "decision" : "terminal",
                    selected ? "selected" : "",
                    onPath ? "solved" : ""
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      key={node.id}
                      className={classes}
                      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                      onClick={() => {
                        if (connectSourceId && connectSourceId !== node.id) {
                          connectToNode(node.id);
                          return;
                        }
                        setSelectedNodeId(node.id);
                      }}
                      type="button"
                    >
                      <strong>{node.id}</strong>
                      <span>{node.node_type}</span>
                      {node.node_type === "decision" ? (
                        <small>{node.player}</small>
                      ) : (
                        <small>({node.payoff.by_player.P1}, {node.payoff.by_player.P2})</small>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </article>

          <article className="panel">
            <h2>Inspector</h2>
            {!selectedNode && <p>Kein Knoten gewählt.</p>}
            {selectedNode && (
              <>
                <label>Node ID</label>
                <input value={selectedNode.id} readOnly />

                <label htmlFor="root-select">Root Node</label>
                <select id="root-select" value={game.root} onChange={(e) => setGame((prev) => ({ ...prev, root: e.target.value }))}>
                  {game.nodes.map((n) => (
                    <option key={n.id} value={n.id}>{n.id}</option>
                  ))}
                </select>

                {selectedNode.node_type === "decision" && (
                  <>
                    <label htmlFor="player-input">Player</label>
                    <input
                      id="player-input"
                      value={selectedNode.player}
                      onChange={(e) => updateNode(selectedNode.id, (node) => ({ ...node, player: e.target.value || "P1" }))}
                    />

                    <h3>Actions</h3>
                    {selectedNode.actions.length === 0 && <p className="hint">Noch keine Aktionen.</p>}
                    {selectedNode.actions.map((action) => (
                      <div key={action.id} className="action-row">
                        <input
                          value={action.id}
                          onChange={(e) =>
                            updateNode(selectedNode.id, (node) => ({
                              ...node,
                              actions: node.actions.map((a) => (a.id === action.id ? { ...a, id: e.target.value || "a" } : a))
                            }))
                          }
                        />
                        <input
                          value={action.label}
                          onChange={(e) =>
                            updateNode(selectedNode.id, (node) => ({
                              ...node,
                              actions: node.actions.map((a) =>
                                a.id === action.id ? { ...a, label: e.target.value || "Action" } : a
                              )
                            }))
                          }
                        />
                        <select
                          value={action.child}
                          onChange={(e) =>
                            updateNode(selectedNode.id, (node) => ({
                              ...node,
                              actions: node.actions.map((a) => (a.id === action.id ? { ...a, child: e.target.value } : a))
                            }))
                          }
                        >
                          {game.nodes
                            .filter((n) => n.id !== selectedNode.id)
                            .map((n) => (
                              <option key={n.id} value={n.id}>{n.id}</option>
                            ))}
                        </select>
                        <button type="button" onClick={() => removeAction(action.id)}>remove</button>
                      </div>
                    ))}
                  </>
                )}

                {selectedNode.node_type === "terminal" && (
                  <>
                    <h3>Payoff</h3>
                    <div className="action-row">
                      <label>P1</label>
                      <input
                        type="number"
                        value={selectedNode.payoff.by_player.P1}
                        onChange={(e) =>
                          updateNode(selectedNode.id, (node) => ({
                            ...node,
                            payoff: {
                              by_player: {
                                ...node.payoff.by_player,
                                P1: toNumberOrZero(e.target.value)
                              }
                            }
                          }))
                        }
                      />
                      <label>P2</label>
                      <input
                        type="number"
                        value={selectedNode.payoff.by_player.P2}
                        onChange={(e) =>
                          updateNode(selectedNode.id, (node) => ({
                            ...node,
                            payoff: {
                              by_player: {
                                ...node.payoff.by_player,
                                P2: toNumberOrZero(e.target.value)
                              }
                            }
                          }))
                        }
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </article>
        </section>

        <section className="grid">
          <article className="panel">
            <h2>Request JSON</h2>
            <textarea value={payloadText} readOnly spellCheck={false} />
          </article>
          <article className="panel">
            <h2>Solver Response</h2>
            <pre>{result || "Noch keine Antwort."}</pre>
          </article>
        </section>
      </>
    );
  }

  async function loadTreeEx1Easy() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl(`/api/v1/exercises/tree/ex1/easy/new?lang=${legacyLang}`), {
        method: "POST"
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setTreeEx1Game(normalizeTreeEx1ApiGame(body.game));
      setTreeEx1InstanceId(body.instance_id || "");
      setTreeEx1ExpectedPhase1Action("");
      setTreeEx1ExpectedRootAction("");
    } catch (err) {
      setTreeEx1Game(buildTreeEx1Game());
      setTreeEx1InstanceId("");
      setTreeEx1ExpectedPhase1Action("");
      setTreeEx1ExpectedRootAction("");
      setError(formatClientError(err, "exercise request failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  function resetTreeEx1() {
    void loadTreeEx1Easy();
    setTreeEx1Step(1);
    setTreeEx1Phase1Choice("");
    setTreeEx1Phase1Feedback("");
    setTreeEx1Phase1FeedbackType("neutral");
    setTreeEx1Phase2Choice("");
    setTreeEx1Phase2Feedback("");
    setTreeEx1Phase2FeedbackType("neutral");
    setTreeEx1HardEntries([createEmptyTreeEx1Entry()]);
    setTreeEx1HardFeedback("");
    setTreeEx1HardFeedbackType("neutral");
  }

  function resetTreeEx3(newGame = false) {
    if (newGame) {
      setTreeEx3Game(buildTreeEx3Game());
    }
    setTreeEx3SpeChoices([]);
    setTreeEx3NashChoices([]);
    setTreeEx3ThreatChoice("");
    setTreeEx3SpeFeedback("");
    setTreeEx3SpeFeedbackType("neutral");
    setTreeEx3NashFeedback("");
    setTreeEx3NashFeedbackType("neutral");
    setTreeEx3ThreatFeedback("");
    setTreeEx3ThreatFeedbackType("neutral");
    setTreeEx3SpeSolved(false);
    setTreeEx3NashSolved(false);
    setTreeEx3ThreatSolved(false);
    setTreeEx3Completed(false);
    setTreeEx3OverallFeedback("");
    setTreeEx3OverallFeedbackType("neutral");
  }

  function sameChoiceSet(selected, correct) {
    if (selected.length !== correct.length) return false;
    const selectedSet = new Set(selected);
    return correct.every((entry) => selectedSet.has(entry));
  }

  function toggleTreeEx3SpeChoice(choiceId) {
    setTreeEx3SpeChoices((prev) =>
      prev.includes(choiceId) ? prev.filter((entry) => entry !== choiceId) : [...prev, choiceId]
    );
    setTreeEx3SpeFeedback("");
    setTreeEx3SpeFeedbackType("neutral");
  }

  function toggleTreeEx3NashChoice(choiceId) {
    setTreeEx3NashChoices((prev) =>
      prev.includes(choiceId) ? prev.filter((entry) => entry !== choiceId) : [...prev, choiceId]
    );
    setTreeEx3NashFeedback("");
    setTreeEx3NashFeedbackType("neutral");
  }

  function checkTreeEx3Spe() {
    if (!treeEx3SpeChoices.length) {
      setTreeEx3SpeFeedbackType("warning");
      setTreeEx3SpeFeedback(t("Bitte mindestens ein Profil auswählen.", "Please select at least one profile."));
      recordExerciseAttempt("tree_ex3", { correct: false, solved: false, lastState: "spe-empty" });
      return;
    }
    const isCorrect = sameChoiceSet(treeEx3SpeChoices, TREE_EX3_SPE_CORRECT);
    if (!isCorrect) {
      setTreeEx3SpeFeedbackType("error");
      setTreeEx3SpeFeedback(
        t(
          "Nicht korrekt. Das teilspielperfekte Gleichgewicht ist genau (Ja, Nachgeben).",
          "Not correct. The subgame-perfect equilibrium is exactly (Yes, Accommodate)."
        )
      );
      recordExerciseAttempt("tree_ex3", {
        correct: false,
        solved: false,
        lastState: `spe:${treeEx3SpeChoices.join(",") || "-"}`
      });
      return;
    }
    setTreeEx3SpeSolved(true);
    setTreeEx3SpeFeedbackType("success");
    setTreeEx3SpeFeedback(
      t(
        "Richtig: Teilspielperfektes GG ist (Ja, Nachgeben).",
        "Correct: The subgame-perfect equilibrium is (Yes, Accommodate)."
      )
    );
    recordExerciseAttempt("tree_ex3", {
      correct: true,
      solved: false,
      lastState: `spe:${treeEx3SpeChoices.join(",") || "-"}`
    });
  }

  function checkTreeEx3Nash() {
    if (!treeEx3NashChoices.length) {
      setTreeEx3NashFeedbackType("warning");
      setTreeEx3NashFeedback(t("Bitte mindestens ein Profil auswählen.", "Please select at least one profile."));
      recordExerciseAttempt("tree_ex3", { correct: false, solved: false, lastState: "nash-empty" });
      return;
    }
    const isCorrect = sameChoiceSet(treeEx3NashChoices, TREE_EX3_NASH_CORRECT);
    if (!isCorrect) {
      setTreeEx3NashFeedbackType("error");
      setTreeEx3NashFeedback(
        t(
          "Nicht korrekt. Die Nash-Gleichgewichte sind (Ja, Nachgeben) und (Nein, Kampf).",
          "Not correct. The Nash equilibria are (Yes, Accommodate) and (No, Fight)."
        )
      );
      recordExerciseAttempt("tree_ex3", {
        correct: false,
        solved: false,
        lastState: `nash:${treeEx3NashChoices.join(",") || "-"}`
      });
      return;
    }
    setTreeEx3NashSolved(true);
    setTreeEx3NashFeedbackType("success");
    setTreeEx3NashFeedback(
      t(
        "Richtig: Nash-GG sind (Ja, Nachgeben) und (Nein, Kampf).",
        "Correct: Nash equilibria are (Yes, Accommodate) and (No, Fight)."
      )
    );
    recordExerciseAttempt("tree_ex3", {
      correct: true,
      solved: false,
      lastState: `nash:${treeEx3NashChoices.join(",") || "-"}`
    });
  }

  function checkTreeEx3Threat() {
    if (!treeEx3ThreatChoice) {
      setTreeEx3ThreatFeedbackType("warning");
      setTreeEx3ThreatFeedback(t("Bitte ein Nash-Gleichgewicht auswählen.", "Please select one Nash equilibrium."));
      recordExerciseAttempt("tree_ex3", { correct: false, solved: false, lastState: "threat-empty" });
      return;
    }
    const isCorrect = treeEx3ThreatChoice === TREE_EX3_THREAT_CORRECT;
    if (!isCorrect) {
      setTreeEx3ThreatFeedbackType("error");
      setTreeEx3ThreatFeedback(
        t(
          "Nicht korrekt. Das Gleichgewicht mit unglaubwürdiger Drohung ist (Nein, Kampf).",
          "Not correct. The equilibrium with a non-credible threat is (No, Fight)."
        )
      );
      recordExerciseAttempt("tree_ex3", {
        correct: false,
        solved: false,
        lastState: `threat:${treeEx3ThreatChoice}`
      });
      return;
    }
    setTreeEx3ThreatSolved(true);
    setTreeEx3ThreatFeedbackType("success");
    setTreeEx3ThreatFeedback(
      t(
        "(Nein, Kampf). Die Drohung von A, nach 'Ja' zu kämpfen, ist unglaubwürdig, weil A dann lieber nachgeben würde.",
        "(No, Fight). A's threat to fight after 'Yes' is non-credible, because A would then prefer to accommodate."
      )
    );
    recordExerciseAttempt("tree_ex3", {
      correct: true,
      solved: false,
      lastState: `threat:${treeEx3ThreatChoice}`
    });
  }

  function resetTreeEx4(newGame = false) {
    if (newGame) {
      setTreeEx4Game(buildRandomTreeEx4Game());
    } else {
      setTreeEx4Game({ ...TREE_EX4_INITIAL_GAME });
    }
    setTreeEx4SpeEntries([createEmptyTreeEx4Entry()]);
    setTreeEx4NashEntries([createEmptyTreeEx4Entry()]);
    setTreeEx4SpeFeedback("");
    setTreeEx4SpeFeedbackType("neutral");
    setTreeEx4NashFeedback("");
    setTreeEx4NashFeedbackType("neutral");
    setTreeEx4SpeSolved(false);
    setTreeEx4NashSolved(false);
    setTreeEx4Completed(false);
    setTreeEx4OverallFeedback("");
    setTreeEx4OverallFeedbackType("neutral");
    setShowHelpTreeEx4(false);
  }

  function getTreeEx5Config() {
    if (treeEx5ActiveLevel === 1) {
      return {
        progressKey: "tree_ex5_3",
        offers: TREE_EX5_3_OFFERS,
        speOptions: TREE_EX5_3_SPE_OPTIONS,
        speCorrect: TREE_EX5_3_SPE_CORRECT,
        phase1Success: t(
          "Richtig. In allen drei Runden ist Annehmen optimal, weil die sichere Auszahlung höher ist als das Fortsetzen der Verhandlung.",
          "Correct. Accept is optimal in all three rounds because the sure payoff is higher than continuing the negotiation."
        ),
        speSuccess: t(
          "Richtig. Im 3-stufigen Spiel ist das SPE durch (A, A, A) bei den Antwortknoten gegeben.",
          "Correct. In the 3-stage game, the SPE is given by (A, A, A) at the response nodes."
        ),
        speError: t(
          "Nicht korrekt. Das SPE im 3-stufigen Spiel ist (A, A, A).",
          "Not correct. The SPE in the 3-stage game is (A, A, A)."
        )
      };
    }
    return {
      progressKey: "tree_ex5_2",
      offers: TREE_EX5_2_OFFERS,
      speOptions: TREE_EX5_2_SPE_OPTIONS,
      speCorrect: TREE_EX5_2_SPE_CORRECT,
      phase1Success: t(
        "Richtig. Spieler 2 nimmt alle drei Angebote an. Antizipierend wählt Spieler 1 dann das Angebot 90/10.",
        "Correct. Player 2 accepts all three offers. Anticipating this, Player 1 chooses 90/10."
      ),
      speSuccess: t(
        "Richtig. SPE: Spieler 2 nimmt jedes Angebot an und Spieler 1 wählt daher 90/10.",
        "Correct. SPE: Player 2 accepts every offer, so Player 1 chooses 90/10."
      ),
      speError: t(
        "Nicht korrekt. Das SPE ist (90/10, (A, A, A)).",
        "Not correct. The SPE is (90/10, (A, A, A))."
      )
    };
  }

  function resetTreeEx5() {
    const cfg = getTreeEx5Config();
    const emptyAnswers = {};
    cfg.offers.forEach((offer) => {
      emptyAnswers[offer.id] = "";
    });
    setTreeEx5P2Answers(emptyAnswers);
    setTreeEx5Phase1Feedback("");
    setTreeEx5Phase1FeedbackType("neutral");
    setTreeEx5SpeChoice("");
    setTreeEx5SpeFeedback("");
    setTreeEx5SpeFeedbackType("neutral");
    setTreeEx5Phase1Solved(false);
    setTreeEx5SpeSolved(false);
    setTreeEx5Completed(false);
    setTreeEx5OverallFeedback("");
    setTreeEx5OverallFeedbackType("neutral");
  }

  function setTreeEx5Answer(offerId, action) {
    setTreeEx5P2Answers((prev) => ({ ...prev, [offerId]: action }));
    setTreeEx5Phase1Feedback("");
    setTreeEx5Phase1FeedbackType("neutral");
  }

  function resetTreeEx8(newGame = false) {
    if (newGame) {
      setTreeEx8Game(normalizeTreeEx8Game(buildTreeEx8Game()));
    }
    setTreeEx8P2Answers({ "q1-high": "", "q1-low": "" });
    setTreeEx8P1Choice("");
    setTreeEx8SpeChoice("");
    setTreeEx8P2Feedback("");
    setTreeEx8P2FeedbackType("neutral");
    setTreeEx8P1Feedback("");
    setTreeEx8P1FeedbackType("neutral");
    setTreeEx8SpeFeedback("");
    setTreeEx8SpeFeedbackType("neutral");
    setTreeEx8P2Solved(false);
    setTreeEx8P1Solved(false);
    setTreeEx8SpeSolved(false);
    setTreeEx8Completed(false);
    setTreeEx8OverallFeedback("");
    setTreeEx8OverallFeedbackType("neutral");
    setShowHelpTreeEx8(false);
  }

  function setTreeEx8P2Answer(nodeId, action) {
    setTreeEx8P2Answers((prev) => ({ ...prev, [nodeId]: action }));
    setTreeEx8P2Feedback("");
    setTreeEx8P2FeedbackType("neutral");
    setTreeEx8P2Solved(false);
  }

  function checkTreeEx8P2() {
    const missing = treeEx8SafeGame.offers.some((offer) => !treeEx8P2Answers[offer.id]);
    if (missing) {
      setTreeEx8P2FeedbackType("warning");
      setTreeEx8P2Feedback(
        t(
          "Bitte wähle in beiden Teilspielen die Antwort von Spieler 2.",
          "Please select Player 2's response in both subgames."
        )
      );
      recordExerciseAttempt("tree_ex8", { correct: false, solved: false, lastState: "p2-missing" });
      return;
    }
    const wrong = treeEx8SafeGame.offers.some((offer) => treeEx8P2Answers[offer.id] !== treeEx8Solution.p2BestByOffer[offer.id]);
    if (wrong) {
      setTreeEx8P2FeedbackType("error");
      setTreeEx8P2Feedback(
        t(
          "Nicht korrekt. Spieler 2 wählt in jedem Teilspiel die höhere eigene Auszahlung.",
          "Not correct. In each subgame, Player 2 chooses the higher own payoff."
        )
      );
      setTreeEx8P2Solved(false);
      recordExerciseAttempt("tree_ex8", {
        correct: false,
        solved: false,
        lastState: `p2:${treeEx8P2Answers["q1-high"] || "-"},${treeEx8P2Answers["q1-low"] || "-"}`
      });
      return;
    }
    setTreeEx8P2FeedbackType("success");
    setTreeEx8P2Feedback(
      t(
        `Richtig. Beste Antworten: nach q1=4 -> ${treeEx8Solution.p2BestByOffer["q1-high"]}, nach q1=2 -> ${treeEx8Solution.p2BestByOffer["q1-low"]}.`,
        `Correct. Best responses: after q1=4 -> ${treeEx8Solution.p2BestByOffer["q1-high"]}, after q1=2 -> ${treeEx8Solution.p2BestByOffer["q1-low"]}.`
      )
    );
    setTreeEx8P2Solved(true);
    recordExerciseAttempt("tree_ex8", {
      correct: true,
      solved: treeEx8P1Solved && treeEx8SpeSolved,
      lastState: `p2:${treeEx8P2Answers["q1-high"]},${treeEx8P2Answers["q1-low"]}`
    });
  }

  function checkTreeEx8P1() {
    if (!treeEx8P1Choice) {
      setTreeEx8P1FeedbackType("warning");
      setTreeEx8P1Feedback(
        t("Bitte wähle zuerst die Aktion von Spieler 1.", "Please choose Player 1's action first.")
      );
      recordExerciseAttempt("tree_ex8", { correct: false, solved: false, lastState: "p1-missing" });
      return;
    }
    if (treeEx8P1Choice !== treeEx8Solution.p1Best) {
      setTreeEx8P1FeedbackType("error");
      setTreeEx8P1Feedback(
        t(
          "Nicht korrekt. Vergleiche die antizipierten Auszahlungen von Spieler 1 nach den optimalen Antworten von Spieler 2.",
          "Not correct. Compare Player 1's anticipated payoffs after Player 2's optimal responses."
        )
      );
      setTreeEx8P1Solved(false);
      recordExerciseAttempt("tree_ex8", {
        correct: false,
        solved: false,
        lastState: `p1:${treeEx8P1Choice}`
      });
      return;
    }
    setTreeEx8P1FeedbackType("success");
    setTreeEx8P1Feedback(
      t(`Richtig. Spieler 1 wählt ${treeEx8Solution.p1Best}.`, `Correct. Player 1 chooses ${treeEx8Solution.p1Best}.`)
    );
    setTreeEx8P1Solved(true);
    recordExerciseAttempt("tree_ex8", {
      correct: true,
      solved: treeEx8P2Solved && treeEx8SpeSolved,
      lastState: `p1:${treeEx8P1Choice}`
    });
  }

  function checkTreeEx8Spe() {
    if (!treeEx8SpeChoice) {
      setTreeEx8SpeFeedbackType("warning");
      setTreeEx8SpeFeedback(
        t("Bitte wähle zuerst ein SPE-Profil.", "Please select an SPE profile first.")
      );
      recordExerciseAttempt("tree_ex8", { correct: false, solved: false, lastState: "spe-missing" });
      return;
    }
    if (treeEx8SpeChoice !== "spe-s8-1") {
      setTreeEx8SpeFeedbackType("error");
      setTreeEx8SpeFeedback(
        t(
          "Nicht korrekt. Im SPE muss Spieler 2 an beiden Knoten optimal reagieren und Spieler 1 diese Antworten antizipieren.",
          "Not correct. In SPE, Player 2 must respond optimally at both nodes and Player 1 anticipates those responses."
        )
      );
      setTreeEx8SpeSolved(false);
      recordExerciseAttempt("tree_ex8", {
        correct: false,
        solved: false,
        lastState: `spe:${treeEx8SpeChoice}`
      });
      return;
    }
    setTreeEx8SpeFeedbackType("success");
    setTreeEx8SpeFeedback(
      t(
        `Richtig. Das SPE-Profil ist ${treeEx8SpeOptions[0].text}.`,
        `Correct. The SPE profile is ${treeEx8SpeOptions[0].text}.`
      )
    );
    setTreeEx8SpeSolved(true);
    recordExerciseAttempt("tree_ex8", {
      correct: true,
      solved: treeEx8P2Solved && treeEx8P1Solved,
      lastState: `spe:${treeEx8SpeChoice}`
    });
  }

  function resetTreeEx6(newGame = false) {
    if (newGame) {
      setTreeEx6Game(buildTreeEx6Game());
    }
    setTreeEx6InfoChoice("");
    setTreeEx6MatrixChoice("");
    setTreeEx6InfoFeedback("");
    setTreeEx6InfoFeedbackType("neutral");
    setTreeEx6MatrixFeedback("");
    setTreeEx6MatrixFeedbackType("neutral");
    setTreeEx6InfoSolved(false);
    setTreeEx6MatrixSolved(false);
    setTreeEx6NeChoices([]);
    setTreeEx6SpeChoices([]);
    setTreeEx6EqFeedback("");
    setTreeEx6EqFeedbackType("neutral");
    setTreeEx6EqSolved(false);
  }

  function checkTreeEx6Info() {
    if (!treeEx6InfoChoice) {
      setTreeEx6InfoFeedbackType("warning");
      setTreeEx6InfoFeedback(
        t("Bitte wähle zuerst eine Aussage aus.", "Please select a statement first.")
      );
      setTreeEx6InfoSolved(false);
      recordExerciseAttempt("tree_ex6", { correct: false, solved: false, lastState: "info-missing" });
      return;
    }
    const correct = treeEx6InfoChoice === TREE_EX6_INFO_CORRECT;
    if (!correct) {
      setTreeEx6InfoFeedbackType("error");
      setTreeEx6InfoFeedback(
        t("Nicht korrekt. Entscheidend ist die gemeinsame Informationsmenge von P2.", "Not correct. The key point is P2's shared information set.")
      );
      setTreeEx6InfoSolved(false);
      recordExerciseAttempt("tree_ex6", {
        correct: false,
        solved: false,
        lastState: `info:${treeEx6InfoChoice}`
      });
      return;
    }
    const solvedNow = treeEx6MatrixSolved && treeEx6EqSolved;
    setTreeEx6InfoFeedbackType("success");
    setTreeEx6InfoFeedback(
      t(
        "Richtig. Die beiden P2-Knoten liegen in einer Informationsmenge.",
        "Correct. The two P2 nodes lie in one information set."
      )
    );
    setTreeEx6InfoSolved(true);
    recordExerciseAttempt("tree_ex6", {
      correct: true,
      solved: solvedNow,
      lastState: `info:${treeEx6InfoChoice}`
    });
  }

  function checkTreeEx6Matrix() {
    if (!treeEx6MatrixChoice) {
      setTreeEx6MatrixFeedbackType("warning");
      setTreeEx6MatrixFeedback(
        t("Bitte wähle zuerst eine Matrix aus.", "Please select a matrix first.")
      );
      setTreeEx6MatrixSolved(false);
      recordExerciseAttempt("tree_ex6", { correct: false, solved: false, lastState: "matrix-missing" });
      return;
    }
    const correct = treeEx6MatrixChoice === TREE_EX6_MATRIX_CORRECT;
    if (!correct) {
      setTreeEx6MatrixFeedbackType("error");
      setTreeEx6MatrixFeedback(
        t(
          "Nicht korrekt. Übertrage die Auszahlungen exakt entlang der Pfade (U/D und L/R).",
          "Not correct. Transfer payoffs exactly along the paths (U/D and L/R)."
        )
      );
      setTreeEx6MatrixSolved(false);
      recordExerciseAttempt("tree_ex6", {
        correct: false,
        solved: false,
        lastState: `matrix:${treeEx6MatrixChoice}`
      });
      return;
    }
    const solvedNow = treeEx6InfoSolved && treeEx6EqSolved;
    setTreeEx6MatrixFeedbackType("success");
    setTreeEx6MatrixFeedback(
      t(
        "Richtig. Diese Matrix entspricht genau der strategischen Form des Baums.",
        "Correct. This matrix exactly matches the strategic form of the tree."
      )
    );
    setTreeEx6MatrixSolved(true);
    recordExerciseAttempt("tree_ex6", {
      correct: true,
      solved: solvedNow,
      lastState: `matrix:${treeEx6MatrixChoice}`
    });
  }

  function toggleTreeEx6NeChoice(choiceId) {
    setTreeEx6NeChoices((prev) =>
      prev.includes(choiceId) ? prev.filter((entry) => entry !== choiceId) : [...prev, choiceId]
    );
    setTreeEx6EqFeedback("");
    setTreeEx6EqFeedbackType("neutral");
    setTreeEx6EqSolved(false);
  }

  function toggleTreeEx6SpeChoice(choiceId) {
    setTreeEx6SpeChoices((prev) =>
      prev.includes(choiceId) ? prev.filter((entry) => entry !== choiceId) : [...prev, choiceId]
    );
    setTreeEx6EqFeedback("");
    setTreeEx6EqFeedbackType("neutral");
    setTreeEx6EqSolved(false);
  }

  function checkTreeEx6Equilibria() {
    if (!treeEx6NeChoices.length || !treeEx6SpeChoices.length) {
      setTreeEx6EqFeedbackType("warning");
      setTreeEx6EqFeedback(
        t(
          "Bitte markiere zuerst die Profile für NE und SPE.",
          "Please first mark the profiles for NE and SPE."
        )
      );
      setTreeEx6EqSolved(false);
      recordExerciseAttempt("tree_ex6", { correct: false, solved: false, lastState: "eq-missing" });
      return;
    }

    const correctNe = [...treeEx6PureNeIds].sort();
    const selectedNe = [...treeEx6NeChoices].sort();
    const selectedSpe = [...treeEx6SpeChoices].sort();
    const neOk = sameChoiceSet(selectedNe, correctNe);
    const speOk = sameChoiceSet(selectedSpe, correctNe);

    if (!(neOk && speOk)) {
      setTreeEx6EqFeedbackType("error");
      setTreeEx6EqFeedback(
        t(
          "Nicht korrekt. In diesem Spiel ohne echtes Teilspiel sind die reinen SPE genau die reinen Nash-Gleichgewichte.",
          "Not correct. In this game without proper subgames, pure SPE are exactly pure Nash equilibria."
        )
      );
      setTreeEx6EqSolved(false);
      recordExerciseAttempt("tree_ex6", {
        correct: false,
        solved: false,
        lastState: `eq:${selectedNe.join(",")}|${selectedSpe.join(",")}`
      });
      return;
    }

    const solvedNow = treeEx6InfoSolved && treeEx6MatrixSolved;
    setTreeEx6EqFeedbackType("success");
    setTreeEx6EqFeedback(
      t(
        "Richtig. Hier stimmen die reinen Nash- und SPE-Profile überein.",
        "Correct. Here, pure Nash and SPE profiles coincide."
      )
    );
    setTreeEx6EqSolved(true);
    recordExerciseAttempt("tree_ex6", {
      correct: true,
      solved: solvedNow,
      lastState: `eq:${selectedNe.join(",")}|${selectedSpe.join(",")}`
    });
  }

  function checkTreeEx5Phase1() {
    const cfg = getTreeEx5Config();
    const missing = cfg.offers.filter((offer) => !treeEx5P2Answers[offer.id]);
    if (missing.length) {
      setTreeEx5Phase1FeedbackType("warning");
      setTreeEx5Phase1Feedback(
        t(
          "Bitte entscheide für jedes Angebot, ob Spieler 2 annimmt oder ablehnt.",
          "Please decide for each offer whether Player 2 accepts or rejects."
        )
      );
      recordExerciseAttempt(cfg.progressKey, { correct: false, solved: false, lastState: "phase1-missing" });
      return;
    }
    const wrongOffers = cfg.offers.filter((offer) => treeEx5P2Answers[offer.id] !== "A");
    if (wrongOffers.length) {
      setTreeEx5Phase1FeedbackType("error");
      setTreeEx5Phase1Feedback(
        t(
          "Nicht korrekt. In jedem Teilspiel ist Annehmen optimal, weil Spieler 2 bei Annahme mehr als 0 erhält.",
          "Not correct. In each subgame, Accept is optimal because Player 2 gets more than 0 when accepting."
        )
      );
      setTreeEx5Phase1Solved(false);
      recordExerciseAttempt(cfg.progressKey, {
        correct: false,
        solved: false,
        lastState: `phase1:${cfg.offers.map((offer) => treeEx5P2Answers[offer.id] || "-").join("")}`
      });
      return;
    }
    setTreeEx5Phase1FeedbackType("success");
    setTreeEx5Phase1Feedback(cfg.phase1Success);
    setTreeEx5Phase1Solved(true);
    recordExerciseAttempt(cfg.progressKey, {
      correct: true,
      solved: false,
      lastState: `phase1:${cfg.offers.map((offer) => treeEx5P2Answers[offer.id] || "-").join("")}`
    });
  }

  function checkTreeEx5Spe() {
    const cfg = getTreeEx5Config();
    if (!treeEx5SpeChoice) {
      setTreeEx5SpeFeedbackType("warning");
      setTreeEx5SpeFeedback(
        t(
          "Bitte wähle zuerst ein Profil aus.",
          "Please select a profile first."
        )
      );
      recordExerciseAttempt(cfg.progressKey, { correct: false, solved: false, lastState: "spe-empty" });
      return;
    }
    if (treeEx5SpeChoice !== cfg.speCorrect) {
      setTreeEx5SpeFeedbackType("error");
      setTreeEx5SpeFeedback(cfg.speError);
      setTreeEx5SpeSolved(false);
      recordExerciseAttempt(cfg.progressKey, {
        correct: false,
        solved: false,
        lastState: `spe:${treeEx5SpeChoice}`
      });
      return;
    }
    setTreeEx5SpeFeedbackType("success");
    setTreeEx5SpeFeedback(cfg.speSuccess);
    setTreeEx5SpeSolved(true);
    recordExerciseAttempt(cfg.progressKey, {
      correct: true,
      solved: false,
      lastState: `spe:${treeEx5SpeChoice}`
    });
  }

  function addTreeEx4SpeEntry() {
    setTreeEx4SpeEntries((prev) => [...prev, createEmptyTreeEx4Entry()]);
    setTreeEx4SpeFeedback("");
    setTreeEx4SpeFeedbackType("neutral");
  }

  function removeTreeEx4SpeEntry(index) {
    setTreeEx4SpeEntries((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
    setTreeEx4SpeFeedback("");
    setTreeEx4SpeFeedbackType("neutral");
  }

  function updateTreeEx4SpeEntry(index, key, value) {
    setTreeEx4SpeEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)));
    setTreeEx4SpeFeedback("");
    setTreeEx4SpeFeedbackType("neutral");
  }

  function addTreeEx4NashEntry() {
    setTreeEx4NashEntries((prev) => [...prev, createEmptyTreeEx4Entry()]);
    setTreeEx4NashFeedback("");
    setTreeEx4NashFeedbackType("neutral");
  }

  function removeTreeEx4NashEntry(index) {
    setTreeEx4NashEntries((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
    setTreeEx4NashFeedback("");
    setTreeEx4NashFeedbackType("neutral");
  }

  function updateTreeEx4NashEntry(index, key, value) {
    setTreeEx4NashEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)));
    setTreeEx4NashFeedback("");
    setTreeEx4NashFeedbackType("neutral");
  }

  function checkTreeEx4Spe() {
    const selectedIds = treeEx4SpeEntries.map(treeEx4EntryToId).filter(Boolean);
    if (!selectedIds.length || selectedIds.length !== treeEx4SpeEntries.length) {
      setTreeEx4SpeFeedbackType("warning");
      setTreeEx4SpeFeedback(t("Bitte alle Strategielücken ausfüllen.", "Please fill all strategy blanks."));
      recordExerciseAttempt("tree_ex4", { correct: false, solved: false, lastState: "spe-empty" });
      return;
    }
    if (new Set(selectedIds).size !== selectedIds.length) {
      setTreeEx4SpeFeedbackType("warning");
      setTreeEx4SpeFeedback(t("Bitte keine doppelten Profile eintragen.", "Please avoid duplicate profiles."));
      recordExerciseAttempt("tree_ex4", { correct: false, solved: false, lastState: "spe-duplicate" });
      return;
    }
    const isCorrect = sameChoiceSet(selectedIds, treeEx4Evaluation.speIds);
    if (!isCorrect) {
      setTreeEx4SpeFeedbackType("error");
      setTreeEx4SpeFeedback(
        t(
          "Nicht korrekt. Prüfe die optimale Aktion in jedem Teilspiel und am Startknoten erneut.",
          "Not correct. Recheck optimal actions in each subgame and at the root."
        )
      );
      recordExerciseAttempt("tree_ex4", {
        correct: false,
        solved: false,
        lastState: `spe:${selectedIds.join(",") || "-"}`
      });
      return;
    }
    setTreeEx4SpeSolved(true);
    setTreeEx4SpeFeedbackType("success");
    const speList = treeEx4Evaluation.speIds.map(formatTreeEx4ProfileId).join("; ");
    setTreeEx4SpeFeedback(
      t(
        `Anzahl SPE: ${treeEx4Evaluation.speIds.length}\nSPE-Profil(e): ${speList}`,
        `Number of SPE: ${treeEx4Evaluation.speIds.length}\nSPE profile(s): ${speList}`
      )
    );
    recordExerciseAttempt("tree_ex4", {
      correct: true,
      solved: false,
      lastState: `spe:${selectedIds.join(",") || "-"}`
    });
  }

  function checkTreeEx4Nash() {
    const selectedIds = treeEx4NashEntries.map(treeEx4EntryToId).filter(Boolean);
    if (!selectedIds.length || selectedIds.length !== treeEx4NashEntries.length) {
      setTreeEx4NashFeedbackType("warning");
      setTreeEx4NashFeedback(t("Bitte alle Strategielücken ausfüllen.", "Please fill all strategy blanks."));
      recordExerciseAttempt("tree_ex4", { correct: false, solved: false, lastState: "nash-empty" });
      return;
    }
    if (new Set(selectedIds).size !== selectedIds.length) {
      setTreeEx4NashFeedbackType("warning");
      setTreeEx4NashFeedback(t("Bitte keine doppelten Profile eintragen.", "Please avoid duplicate profiles."));
      recordExerciseAttempt("tree_ex4", { correct: false, solved: false, lastState: "nash-duplicate" });
      return;
    }
    const isCorrect = sameChoiceSet(selectedIds, treeEx4Evaluation.nashIds);
    if (!isCorrect) {
      setTreeEx4NashFeedbackType("error");
      setTreeEx4NashFeedback(
        t(
          "Nicht korrekt. Prüfe die besten Antworten in den vollständigen Strategien erneut.",
          "Not correct. Recheck best responses in full strategies."
        )
      );
      recordExerciseAttempt("tree_ex4", {
        correct: false,
        solved: false,
        lastState: `nash:${selectedIds.join(",") || "-"}`
      });
      return;
    }
    setTreeEx4NashSolved(true);
    setTreeEx4NashFeedbackType("success");
    const nashList = treeEx4Evaluation.nashIds.map(formatTreeEx4ProfileId).join("; ");
    setTreeEx4NashFeedback(
      t(
        `Anzahl Nash-GG: ${treeEx4Evaluation.nashIds.length}\nNash-Profil(e): ${nashList}`,
        `Number of Nash equilibria: ${treeEx4Evaluation.nashIds.length}\nNash profile(s): ${nashList}`
      )
    );
    recordExerciseAttempt("tree_ex4", {
      correct: true,
      solved: false,
      lastState: `nash:${selectedIds.join(",") || "-"}`
    });
  }

  function addTreeEx1HardEntry() {
    setTreeEx1HardEntries((prev) => [...prev, createEmptyTreeEx1Entry()]);
    setTreeEx1HardFeedback("");
    setTreeEx1HardFeedbackType("neutral");
  }

  function removeTreeEx1HardEntry(index) {
    setTreeEx1HardEntries((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
    setTreeEx1HardFeedback("");
    setTreeEx1HardFeedbackType("neutral");
  }

  function updateTreeEx1HardEntry(index, key, value) {
    setTreeEx1HardEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)));
    setTreeEx1HardFeedback("");
    setTreeEx1HardFeedbackType("neutral");
  }

  function evaluateTreeEx1HardLocal(selected) {
    const p2BestActions = [];
    if (treeEx1Game.payoffLX.u2 >= treeEx1Game.payoffLY.u2) p2BestActions.push("X");
    if (treeEx1Game.payoffLY.u2 >= treeEx1Game.payoffLX.u2) p2BestActions.push("Y");

    const correctIds = [];
    p2BestActions.forEach((p2Action) => {
      const p1AfterL = p2Action === "X" ? treeEx1Game.payoffLX.u1 : treeEx1Game.payoffLY.u1;
      const p1AfterR = treeEx1Game.payoffR.u1;
      if (p1AfterL >= p1AfterR) correctIds.push(`L-${p2Action}`);
      if (p1AfterR >= p1AfterL) correctIds.push(`R-${p2Action}`);
    });
    const correct = [...new Set(correctIds)].sort();
    const selectedSorted = [...selected].sort();
    return selectedSorted.length === correct.length && selectedSorted.every((entry, index) => entry === correct[index]);
  }

  async function checkTreeEx1Hard() {
    const selected = treeEx1HardEntries.map(treeEx1EntryToId).filter(Boolean);
    if (!selected.length || selected.length !== treeEx1HardEntries.length) {
      setTreeEx1HardFeedbackType("warning");
      setTreeEx1HardFeedback(
        t(
          "Bitte alle Strategielücken ausfüllen.",
          "Please fill all strategy blanks."
        )
      );
      return;
    }
    if (new Set(selected).size !== selected.length) {
      setTreeEx1HardFeedbackType("warning");
      setTreeEx1HardFeedback(
        t(
          "Bitte keine doppelten Profile eintragen.",
          "Please avoid duplicate profiles."
        )
      );
      return;
    }
    if (!treeEx1InstanceId) {
      const sameSet = evaluateTreeEx1HardLocal(selected);
      if (!sameSet) {
        setTreeEx1HardFeedbackType("error");
        setTreeEx1HardFeedback(
          t(
            "Nicht korrekt. Wähle exakt alle SPE-Profile aus.",
            "Not correct. Select exactly all SPE profiles."
          )
        );
        recordExerciseAttempt("tree_ex1_hard", {
          correct: false,
          lastState: selected.join(",") || "-",
          solved: false
        });
        return;
      }
      setTreeEx1HardFeedbackType("success");
      setTreeEx1HardFeedback(
        t(
          "Richtig. Die SPE-Profile wurden korrekt identifiziert.",
          "Correct. The SPE profiles were identified correctly."
        )
      );
      recordExerciseAttempt("tree_ex1_hard", {
        correct: true,
        lastState: selected.join(",") || "-",
        solved: true
      });
      return;
    }

    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/tree/ex1/hard/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instance_id: treeEx1InstanceId,
          selected_profile_ids: selected,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      const isCorrect = !!body.correct;
      setTreeEx1HardFeedbackType(isCorrect ? "success" : "error");
      setTreeEx1HardFeedback(body.feedback || "");
      recordExerciseAttempt("tree_ex1_hard", {
        correct: isCorrect,
        lastState: selected.join(",") || "-",
        solved: isCorrect
      });
    } catch (err) {
      const sameSet = evaluateTreeEx1HardLocal(selected);
      setTreeEx1HardFeedbackType(sameSet ? "success" : "error");
      setTreeEx1HardFeedback(
        sameSet
          ? t(
              "Richtig. Die SPE-Profile wurden korrekt identifiziert.",
              "Correct. The SPE profiles were identified correctly."
            )
          : t(
              "Nicht korrekt. Wähle exakt alle SPE-Profile aus.",
              "Not correct. Select exactly all SPE profiles."
            )
      );
      recordExerciseAttempt("tree_ex1_hard", {
        correct: sameSet,
        lastState: selected.join(",") || "-",
        solved: sameSet
      });
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  function evaluateTreeEx1Phase1Local(action) {
    const bestAction = treeEx1Game.payoffLX.u2 > treeEx1Game.payoffLY.u2 ? "X" : "Y";
    const bestPayoff = bestAction === "X" ? treeEx1Game.payoffLX.u2 : treeEx1Game.payoffLY.u2;
    const otherPayoff = bestAction === "X" ? treeEx1Game.payoffLY.u2 : treeEx1Game.payoffLX.u2;
    setTreeEx1ExpectedPhase1Action(bestAction);
    if (action === bestAction) {
      setTreeEx1Phase1FeedbackType("success");
      setTreeEx1Phase1Feedback(
        t(
          `Richtig: Spieler 2 wählt ${bestAction}, weil ${bestPayoff} > ${otherPayoff}.`,
          `Correct: Player 2 chooses ${bestAction}, because ${bestPayoff} > ${otherPayoff}.`
        )
      );
    } else {
      setTreeEx1Phase1FeedbackType("error");
      setTreeEx1Phase1Feedback(
        t(
          `${action} ist nicht optimal. Spieler 2 wählt ${bestAction}, weil ${bestPayoff} > ${otherPayoff}.`,
          `${action} is not optimal. Player 2 chooses ${bestAction}, because ${bestPayoff} > ${otherPayoff}.`
        )
      );
    }
    setTreeEx1Step(2);
  }

  function evaluateTreeEx1Phase2Local(action) {
    const bestPhase1Action = treeEx1ExpectedPhase1Action || (treeEx1Game.payoffLX.u2 > treeEx1Game.payoffLY.u2 ? "X" : "Y");
    const payoffAfterLForP1 = bestPhase1Action === "X" ? treeEx1Game.payoffLX.u1 : treeEx1Game.payoffLY.u1;
    const payoffAfterRForP1 = treeEx1Game.payoffR.u1;
    const bestAction = payoffAfterLForP1 > payoffAfterRForP1 ? "L" : "R";
    setTreeEx1ExpectedRootAction(bestAction);
    if (action === bestAction) {
      setTreeEx1Phase2FeedbackType("success");
      setTreeEx1Phase2Feedback(
        t(
          `Richtig: Spieler 1 vergleicht L -> ${payoffAfterLForP1} mit R -> ${payoffAfterRForP1} und wählt ${bestAction}.`,
          `Correct: Player 1 compares L -> ${payoffAfterLForP1} with R -> ${payoffAfterRForP1} and chooses ${bestAction}.`
        )
      );
    } else {
      setTreeEx1Phase2FeedbackType("error");
      setTreeEx1Phase2Feedback(
        t(
          `${action} ist nicht optimal. Spieler 1 vergleicht L -> ${payoffAfterLForP1} mit R -> ${payoffAfterRForP1} und wählt ${bestAction}.`,
          `${action} is not optimal. Player 1 compares L -> ${payoffAfterLForP1} with R -> ${payoffAfterRForP1} and chooses ${bestAction}.`
        )
      );
    }
    const easySolved = treeEx1Phase1Choice === bestPhase1Action && action === bestAction;
    recordExerciseAttempt("tree_ex1_easy", {
      correct: easySolved,
      solved: easySolved,
      lastState: `${treeEx1Phase1Choice || "-"} / ${action}`
    });
    setTreeEx1Step(3);
  }

  async function answerTreeEx1Phase1(action) {
    if (treeEx1Step !== 1) {
      return;
    }
    setTreeEx1Phase1Choice(action);
    if (!treeEx1InstanceId) {
      evaluateTreeEx1Phase1Local(action);
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/tree/ex1/easy/check-step"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instance_id: treeEx1InstanceId,
          step: "phase1",
          answer: { action },
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      setTreeEx1ExpectedPhase1Action(body.expected?.action || "");
      setTreeEx1Phase1FeedbackType(body.correct ? "success" : "error");
      setTreeEx1Phase1Feedback(body.feedback || "");
      setTreeEx1Step(2);
    } catch (err) {
      evaluateTreeEx1Phase1Local(action);
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function answerTreeEx1Phase2(action) {
    if (treeEx1Step !== 2) {
      return;
    }
    setTreeEx1Phase2Choice(action);
    if (!treeEx1InstanceId) {
      evaluateTreeEx1Phase2Local(action);
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const stepResponse = await appFetch(safeApiUrl("/api/v1/exercises/tree/ex1/easy/check-step"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instance_id: treeEx1InstanceId,
          step: "phase2",
          answer: { root: action },
          lang: legacyLang
        })
      });
      const stepBody = await stepResponse.json();
      if (!stepResponse.ok) {
        throw new Error(stepBody.detail ? JSON.stringify(stepBody.detail) : `request failed: ${stepResponse.status}`);
      }
      const expectedRoot = stepBody.expected?.root || "";
      setTreeEx1ExpectedRootAction(expectedRoot);
      setTreeEx1Phase2FeedbackType(stepBody.correct ? "success" : "error");
      setTreeEx1Phase2Feedback(stepBody.feedback || "");

      const finalResponse = await appFetch(safeApiUrl("/api/v1/exercises/tree/ex1/easy/check-final"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instance_id: treeEx1InstanceId,
          answers: {
            phase1_action: treeEx1Phase1Choice,
            phase2_root: action
          },
          lang: legacyLang
        })
      });
      const finalBody = await finalResponse.json();
      if (!finalResponse.ok) {
        throw new Error(finalBody.detail ? JSON.stringify(finalBody.detail) : `request failed: ${finalResponse.status}`);
      }
      if (finalBody.expected?.phase1_action) {
        setTreeEx1ExpectedPhase1Action(finalBody.expected.phase1_action);
      }
      if (finalBody.expected?.phase2_root) {
        setTreeEx1ExpectedRootAction(finalBody.expected.phase2_root);
      }
      recordExerciseAttempt("tree_ex1_easy", {
        correct: !!finalBody.correct,
        solved: !!finalBody.correct,
        lastState: `${treeEx1Phase1Choice || "-"} / ${action}`
      });
      setTreeEx1Step(3);
    } catch (err) {
      evaluateTreeEx1Phase2Local(action);
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  function updateTreeEx2ProgressAt(index, updater) {
    setTreeEx2Progress((prev) => prev.map((entry, i) => (i === index ? updater(entry) : entry)));
  }

  async function loadTreeEx2Easy() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/tree/ex2/easy/new"), {
        method: "POST"
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      const normalized = normalizeTreeEx2ApiGame(body.game);
      const sameGameCopy = JSON.parse(JSON.stringify(normalized));
      setTreeEx2Games([normalized, sameGameCopy]);
      setTreeEx2Progress(buildTreeEx2ProgressSet());
      setTreeEx2InstanceId(body.instance_id || "");
    } catch (err) {
      setTreeEx2Games(buildTreeEx2Set());
      setTreeEx2Progress(buildTreeEx2ProgressSet());
      setTreeEx2InstanceId("");
      setError(formatClientError(err, "exercise request failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  function resetTreeEx2() {
    const currentIndex = treeEx2ActiveIndex;
    void loadTreeEx2Easy();
    setTreeEx2ActiveIndex(currentIndex);
  }

  function setTreeEx2Phase1Answer(nodeKey, action) {
    updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
      ...prev,
      phase1Answers: {
        ...prev.phase1Answers,
        [nodeKey]: action
      },
      phase1Feedback: "",
      phase1FeedbackType: "neutral"
    }));
  }

  function checkTreeEx2Phase1Local() {
    const game = treeEx2Games[treeEx2ActiveIndex];
    const state = treeEx2Progress[treeEx2ActiveIndex];
    if (!game || !state || state.step !== 1) {
      return;
    }
    const missing = TREE_EX2_P1_NODES.filter((nodeKey) => !state.phase1Answers[nodeKey]);
    if (missing.length) {
      updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
        ...prev,
        phase1FeedbackType: "warning",
        phase1Feedback: t(
          "Bitte beantworte in Phase 1 alle sechs Teilspiele.",
          "Please answer all six subgames in phase 1."
        )
      }));
      return;
    }
    const wrong = TREE_EX2_P1_NODES.filter((nodeKey) => state.phase1Answers[nodeKey] !== game.p1BestByNode[nodeKey]);
    if (wrong.length) {
      updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
        ...prev,
        phase1FeedbackType: "error",
        phase1Feedback: t(
          `Noch nicht korrekt. ${wrong.length} von 6 Entscheidungen sind falsch.`,
          `Not correct yet. ${wrong.length} out of 6 decisions are incorrect.`
        )
      }));
      return;
    }
    updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
      ...prev,
      step: 2,
      phase1FeedbackType: "success",
      phase1Feedback: t(
        "Richtig. Alle letzten Teilspiele sind korrekt gelöst.",
        "Correct. All terminal subgames are solved correctly."
      )
    }));
  }

  function setTreeEx2Phase2Answer(rootAction, action) {
    updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
      ...prev,
      phase2Answers: {
        ...prev.phase2Answers,
        [rootAction]: action
      },
      phase2Feedback: "",
      phase2FeedbackType: "neutral"
    }));
  }

  function checkTreeEx2Phase2Local() {
    const game = treeEx2Games[treeEx2ActiveIndex];
    const state = treeEx2Progress[treeEx2ActiveIndex];
    if (!game || !state || state.step !== 2) {
      return;
    }
    const missing = TREE_EX2_ROOT_ACTIONS.filter((rootAction) => !state.phase2Answers[rootAction]);
    if (missing.length) {
      updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
        ...prev,
        phase2FeedbackType: "warning",
        phase2Feedback: t(
          "Bitte beantworte in Phase 2 alle drei Entscheidungen von Spieler 2.",
          "Please answer all three Player-2 decisions in phase 2."
        )
      }));
      return;
    }
    const wrong = TREE_EX2_ROOT_ACTIONS.filter((rootAction) => {
      const selected = state.phase2Answers[rootAction];
      const best = game.p2BestByRoot[rootAction];
      if (selected === "indifferent") {
        return !(best.includes("U") && best.includes("D"));
      }
      return !best.includes(selected);
    });
    if (wrong.length) {
      updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
        ...prev,
        phase2FeedbackType: "error",
        phase2Feedback: t(
          `Noch nicht korrekt. ${wrong.length} von 3 Entscheidungen sind falsch.`,
          `Not correct yet. ${wrong.length} out of 3 decisions are incorrect.`
        )
      }));
      return;
    }
    updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
      ...prev,
      step: 3,
      phase2FeedbackType: "success",
      phase2Feedback: t(
        "Richtig. Die Entscheidungen von Spieler 2 sind konsistent mit Rückwärtsinduktion.",
        "Correct. Player 2's decisions are consistent with backward induction."
      )
    }));
  }

  function toggleTreeEx2Phase3Choice(action) {
    updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
      ...prev,
      phase3Choices: prev.phase3Choices.includes(action)
        ? prev.phase3Choices.filter((entry) => entry !== action)
        : [...prev.phase3Choices, action],
      phase3Feedback: "",
      phase3FeedbackType: "neutral"
    }));
  }

  function addTreeEx2SpeEntry() {
    updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
      ...prev,
      speEntries: [...prev.speEntries, createEmptyTreeEx2Entry()],
      speFeedback: "",
      speFeedbackType: "neutral"
    }));
  }

  function removeTreeEx2SpeEntry(index) {
    updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
      ...prev,
      speEntries: prev.speEntries.length === 1 ? prev.speEntries : prev.speEntries.filter((_, i) => i !== index),
      speFeedback: "",
      speFeedbackType: "neutral"
    }));
  }

  function updateTreeEx2SpeEntry(index, key, value) {
    updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
      ...prev,
      speEntries: prev.speEntries.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)),
      speFeedback: "",
      speFeedbackType: "neutral"
    }));
  }

  function evaluateTreeEx2SpeOnlyLocal(selectedIds, game) {
    const correctIds = game.speProfiles.map(treeEx2ProfileSignature).sort();
    const selectedSorted = [...selectedIds].sort();
    return selectedSorted.length === correctIds.length && selectedSorted.every((entry, index) => entry === correctIds[index]);
  }

  async function checkTreeEx2SpeOnly() {
    const game = treeEx2Games[treeEx2ActiveIndex];
    const state = treeEx2Progress[treeEx2ActiveIndex];
    if (!game || !state) {
      return;
    }
    const selectedIds = state.speEntries.map(treeEx2EntryToSignature).filter(Boolean);
    if (!selectedIds.length || selectedIds.length !== state.speEntries.length) {
      updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
        ...prev,
        speFeedbackType: "warning",
        speFeedback: t(
          "Bitte alle Strategielücken ausfüllen.",
          "Please fill all strategy blanks."
        )
      }));
      return;
    }
    if (new Set(selectedIds).size !== selectedIds.length) {
      updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
        ...prev,
        speFeedbackType: "warning",
        speFeedback: t(
          "Bitte keine doppelten Profile eintragen.",
          "Please avoid duplicate profiles."
        )
      }));
      recordExerciseAttempt("tree_ex2_hard", {
        correct: false,
        solved: false,
        lastState: "duplicate"
      });
      return;
    }
    if (treeEx2ActiveIndex !== 1 || !treeEx2InstanceId) {
      const sameSet = evaluateTreeEx2SpeOnlyLocal(selectedIds, game);
      if (!sameSet) {
        updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
          ...prev,
          speFeedbackType: "error",
          speFeedback: t(
            "Nicht korrekt. Wähle exakt alle SPE-Profile aus.",
            "Not correct. Select exactly all SPE profiles."
          )
        }));
        recordExerciseAttempt("tree_ex2_hard", {
          correct: false,
          solved: false,
          lastState: selectedIds.join(",") || "-"
        });
        return;
      }
      updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
        ...prev,
        solved: true,
        speFeedbackType: "success",
        speFeedback: t(
          "Richtig. Die SPE-Profile wurden korrekt identifiziert.",
          "Correct. The SPE profiles were identified correctly."
        )
      }));
      recordExerciseAttempt("tree_ex2_hard", {
        correct: true,
        solved: true,
        lastState: selectedIds.join(",") || "-"
      });
      return;
    }

    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/tree/ex2/hard/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instance_id: treeEx2InstanceId,
          selected_profile_ids: selectedIds,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      const isCorrect = !!body.correct;
      updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
        ...prev,
        solved: isCorrect,
        speFeedbackType: isCorrect ? "success" : "error",
        speFeedback: body.feedback || ""
      }));
      recordExerciseAttempt("tree_ex2_hard", {
        correct: isCorrect,
        solved: isCorrect,
        lastState: selectedIds.join(",") || "-"
      });
    } catch (err) {
      const sameSet = evaluateTreeEx2SpeOnlyLocal(selectedIds, game);
      updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
        ...prev,
        solved: sameSet,
        speFeedbackType: sameSet ? "success" : "error",
        speFeedback: sameSet
          ? t(
              "Richtig. Die SPE-Profile wurden korrekt identifiziert.",
              "Correct. The SPE profiles were identified correctly."
            )
          : t(
              "Nicht korrekt. Wähle exakt alle SPE-Profile aus.",
              "Not correct. Select exactly all SPE profiles."
            )
      }));
      recordExerciseAttempt("tree_ex2_hard", {
        correct: sameSet,
        solved: sameSet,
        lastState: selectedIds.join(",") || "-"
      });
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  function checkTreeEx2Phase3Local() {
    const game = treeEx2Games[treeEx2ActiveIndex];
    const state = treeEx2Progress[treeEx2ActiveIndex];
    if (!game || !state || state.step !== 3) {
      return;
    }
    if (!state.phase3Choices.length) {
      updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
        ...prev,
        phase3FeedbackType: "warning",
        phase3Feedback: t(
          "Bitte wähle in Phase 3 mindestens eine Aktion am Startknoten.",
          "Please select at least one action at the root in phase 3."
        )
      }));
      return;
    }
    const rootBest = computeTreeEx2RootBestWithIndifference(game, state.phase2Answers);
    const selected = [...state.phase3Choices].sort();
    const correct = [...rootBest].sort();
    const sameSet = selected.length === correct.length && selected.every((entry, index) => entry === correct[index]);
    if (!sameSet) {
      updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
        ...prev,
        phase3FeedbackType: "error",
        phase3Feedback: t(
          `Nicht korrekt. Wähle exakt alle optimalen Aktionen: ${rootBest.join(", ")}.`,
          `Not correct. Select exactly all optimal actions: ${rootBest.join(", ")}.`
        )
      }));
      recordExerciseAttempt("tree_ex2_easy", {
        correct: false,
        solved: false,
        lastState: state.phase3Choices.join(", ") || "-"
      });
      return;
    }
    updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
      ...prev,
      step: 4,
      solved: true,
      phase3FeedbackType: "success",
      phase3Feedback: t(
        "Richtig. Dieses Spiel ist gelöst.",
        "Correct. This game is solved."
      )
    }));
    recordExerciseAttempt("tree_ex2_easy", {
      correct: true,
      solved: true,
      lastState: state.phase3Choices.join(", ") || "-"
    });
  }

  async function checkTreeEx2Phase1() {
    const state = treeEx2Progress[treeEx2ActiveIndex];
    if (treeEx2ActiveIndex !== 0 || !treeEx2InstanceId || !state || state.step !== 1) {
      checkTreeEx2Phase1Local();
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/tree/ex2/easy/check-step"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instance_id: treeEx2InstanceId,
          step: "phase1",
          answers: state.phase1Answers,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
        ...prev,
        step: body.correct ? body.next_step : prev.step,
        phase1FeedbackType: body.feedback_type || (body.correct ? "success" : "error"),
        phase1Feedback: body.feedback || ""
      }));
    } catch (err) {
      checkTreeEx2Phase1Local();
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function checkTreeEx2Phase2() {
    const state = treeEx2Progress[treeEx2ActiveIndex];
    if (treeEx2ActiveIndex !== 0 || !treeEx2InstanceId || !state || state.step !== 2) {
      checkTreeEx2Phase2Local();
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/tree/ex2/easy/check-step"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instance_id: treeEx2InstanceId,
          step: "phase2",
          answers: state.phase2Answers,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
        ...prev,
        step: body.correct ? body.next_step : prev.step,
        phase2FeedbackType: body.feedback_type || (body.correct ? "success" : "error"),
        phase2Feedback: body.feedback || ""
      }));
    } catch (err) {
      checkTreeEx2Phase2Local();
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  async function checkTreeEx2Phase3() {
    const state = treeEx2Progress[treeEx2ActiveIndex];
    if (treeEx2ActiveIndex !== 0 || !treeEx2InstanceId || !state || state.step !== 3) {
      checkTreeEx2Phase3Local();
      return;
    }
    setError("");
    setLegacyLoading(true);
    try {
      const response = await appFetch(safeApiUrl("/api/v1/exercises/tree/ex2/easy/check-step"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instance_id: treeEx2InstanceId,
          step: "phase3",
          phase2_answers: state.phase2Answers,
          selected_choices: state.phase3Choices,
          lang: legacyLang
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail ? JSON.stringify(body.detail) : `request failed: ${response.status}`);
      }
      updateTreeEx2ProgressAt(treeEx2ActiveIndex, (prev) => ({
        ...prev,
        step: body.correct ? body.next_step : prev.step,
        solved: !!body.correct,
        phase3FeedbackType: body.feedback_type || (body.correct ? "success" : "error"),
        phase3Feedback: body.feedback || ""
      }));
      recordExerciseAttempt("tree_ex2_easy", {
        correct: !!body.correct,
        solved: !!body.correct,
        lastState: state.phase3Choices.join(", ") || "-"
      });
    } catch (err) {
      checkTreeEx2Phase3Local();
      setError(formatClientError(err, "exercise check failed"));
    } finally {
      setLegacyLoading(false);
    }
  }

  function renderTreeExercises() {
    const activeTreePage = treeRenderPage;
    const firstPlayer = t("Spieler 1", "Player 1");
    const secondPlayer = t("Spieler 2", "Player 2");
    const firstNodeLabel = "P1";
    const secondNodeLabel = "P2";
    const solvedP2Action = treeEx1ExpectedPhase1Action || treeEx1Game.p2Action || "";
    const solvedP1Action = treeEx1ExpectedRootAction || treeEx1Game.p1Action || "";
    const payoffAfterL = solvedP2Action === "Y" ? treeEx1Game.payoffLY : treeEx1Game.payoffLX;
    const payoffAfterLForP1 = solvedP2Action === "Y" ? treeEx1Game.payoffLY.u1 : treeEx1Game.payoffLX.u1;
    const phase1Done = treeEx1Step >= 2;
    const phase2Done = treeEx1Step >= 3;
    const lEdgeClass = `tree-edge ${phase2Done ? (solvedP1Action === "L" ? "bi-active" : "bi-muted") : ""}`.trim();
    const rEdgeClass = `tree-edge ${phase2Done ? (solvedP1Action === "R" ? "bi-active" : "bi-muted") : ""}`.trim();
    const xEdgeClass = `tree-edge ${phase1Done ? (solvedP2Action === "X" ? "bi-active" : "bi-muted") : ""}`.trim();
    const yEdgeClass = `tree-edge ${phase1Done ? (solvedP2Action === "Y" ? "bi-active" : "bi-muted") : ""}`.trim();
    const rootNodeClass = ["tree-node", "decision", treeEx1Step === 2 ? "bi-current" : ""].filter(Boolean).join(" ");
    const secondNodeClass = [
      "tree-node",
      "decision",
      treeEx1Step === 1 ? "bi-current" : "",
      phase1Done ? "bi-selected-terminal" : ""
    ]
      .filter(Boolean)
      .join(" ");
    const terminalRClass = [
      "tree-node",
      "terminal",
      phase2Done ? (solvedP1Action === "R" ? "bi-selected-terminal" : "bi-muted-node") : ""
    ]
      .filter(Boolean)
      .join(" ");
    const terminalLXClass = [
      "tree-node",
      "terminal",
      phase1Done
        ? solvedP2Action === "X" && (!phase2Done || solvedP1Action === "L")
          ? "bi-selected-terminal"
          : "bi-muted-node"
        : ""
    ]
      .filter(Boolean)
      .join(" ");
    const terminalLYClass = [
      "tree-node",
      "terminal",
      phase1Done
        ? solvedP2Action === "Y" && (!phase2Done || solvedP1Action === "L")
          ? "bi-selected-terminal"
          : "bi-muted-node"
        : ""
    ]
      .filter(Boolean)
      .join(" ");

    if (activeTreePage === "toc") {
      return (
        <section className="panel">
          <h2>{t("Trainiere Sequenzielle Spiele (Extensivform)", "Train sequential games (extensive form)")}</h2>
          <h3>{t("Teil 1: Sprache der Extensivform", "Part 1: Language of extensive form")}</h3>
          <p className="hint">
            {t(
              "Du lernst, Spielbäume, Informationsmengen und reine Strategien in Extensivspielen sauber zu lesen und zu notieren.",
              "You learn to read and write game trees, information sets, and pure strategies in extensive-form games."
            )}
          </p>
          <div className="exercise-link-grid">
            <button
              type="button"
              className="exercise-link"
              onClick={() => {
                resetTreeEx1();
                setTreePage("ex1");
              }}
            >
              <span className="exercise-link-title">
                {t("Übung 1 – Einfaches sequenzielles Spiel", "Exercise 1 - Simple sequential game")}
              </span>
              <span className="exercise-link-meta">
                {buildProgressMeta(["tree_ex1_easy", "tree_ex1_hard"])}
              </span>
            </button>
            <button
              type="button"
              className="exercise-link"
              onClick={() => {
                resetTreeEx2();
                setTreePage("ex2");
              }}
            >
              <span className="exercise-link-title">
                {t("Übung 2 – Dreistufiges sequenzielles Spiel", "Exercise 2 - Three-stage sequential game")}
              </span>
              <span className="exercise-link-meta">
                {buildProgressMeta(["tree_ex2_easy", "tree_ex2_hard"])}
              </span>
            </button>
            <button
              type="button"
              className="exercise-link"
              onClick={() => {
                resetTreeEx6();
                setTreePage("ex6");
              }}
            >
              <span className="exercise-link-title">
                {t("Übung 3 – Informationsmengen & simultane Züge", "Exercise 3 - Information sets and simultaneous moves")}
              </span>
              <span className="exercise-link-meta">
                {buildProgressMeta("tree_ex6")}
              </span>
            </button>
          </div>
          <h3>{t("Teil 2: Lösungsmethoden", "Part 2: Solution methods")}</h3>
          <p className="hint">
            {t(
              "Du trainierst Rückwärtsinduktion, SPE und den Vergleich zu Nash-Gleichgewichten in sequenziellen Spielen.",
              "You practice backward induction, SPE, and the comparison with Nash equilibria in sequential games."
            )}
          </p>
          <div className="exercise-link-grid">
            <button
              type="button"
              className="exercise-link"
              onClick={() => {
                resetTreeEx3();
                setTreePage("ex3");
              }}
            >
              <span className="exercise-link-title">
                {t("Übung 1 – Eintrittsspiel mit unglaubwürdiger Drohung", "Exercise 1 - Entry game with non-credible threat")}
              </span>
              <span className="exercise-link-meta">
                {buildProgressMeta("tree_ex3")}
              </span>
            </button>
            <button
              type="button"
              className="exercise-link"
              onClick={() => {
                resetTreeEx4();
                setTreePage("ex4");
              }}
            >
              <span className="exercise-link-title">
                {t("Übung 2 – Teilspielperfektes GG und Nash-GG mit 3 Spielern", "Exercise 2 - Subgame-perfect and Nash equilibria with 3 players")}
              </span>
              <span className="exercise-link-meta">
                {buildProgressMeta("tree_ex4")}
              </span>
            </button>
          </div>
          <h3>{t("Teil 3: Anwendungen (light)", "Part 3: Applications (light)")}</h3>
          <p className="hint">
            {t(
              "Du wendest die Methoden auf klassische ökonomische Anwendungen an: Ultimatum, Stackelberg und finite Verhandlung.",
              "You apply the methods to classic economic applications: ultimatum, Stackelberg, and finite bargaining."
            )}
          </p>
          <div className="exercise-link-grid">
            <button
              type="button"
              className="exercise-link"
              onClick={() => {
                setTreeEx5ActiveLevel(0);
                resetTreeEx5();
                setTreePage("ex5");
              }}
            >
              <span className="exercise-link-title">
                {t(
                  "Übung 1 – Ultimatumspiel mit vollständig rationalen Spielern und ohne Zusatzfaktoren",
                  "Exercise 1 - Ultimatum game with fully rational players and no additional factors"
                )}
              </span>
              <span className="exercise-link-meta">
                {buildProgressMeta(["tree_ex5_2", "tree_ex5_3"])}
              </span>
            </button>
            <button
              type="button"
              className="exercise-link"
              onClick={() => {
                resetTreeEx8(true);
                setTreePage("ex8");
              }}
            >
              <span className="exercise-link-title">
                {t("Übung 2 – Stackelberg light", "Exercise 2 - Stackelberg light")}
              </span>
              <span className="exercise-link-meta">{buildProgressMeta("tree_ex8")}</span>
            </button>
            <button type="button" className="exercise-link" disabled>
              <span className="exercise-link-title">
                {t("Übung 3 – Finite Bargaining (2 Perioden) light (bald)", "Exercise 3 - Finite bargaining (2 periods) light (soon)")}
              </span>
              <span className="exercise-link-meta">{t("Bald", "Soon")}</span>
            </button>
          </div>
        </section>
      );
    }

    if (activeTreePage === "ex2") {
      const activeGame = treeEx2Games[treeEx2ActiveIndex];
      const activeState = treeEx2Progress[treeEx2ActiveIndex];
      const isSimulator = treeEx2ActiveIndex === 0;
      const rootPos = { x: 46, y: 300 };
      const p2Pos = {
        L: { x: 210, y: 92 },
        M: { x: 210, y: 304 },
        R: { x: 210, y: 516 }
      };
      const p1Pos = {
        "L|U": { x: 390, y: 44 },
        "L|D": { x: 390, y: 140 },
        "M|U": { x: 390, y: 256 },
        "M|D": { x: 390, y: 352 },
        "R|U": { x: 390, y: 468 },
        "R|D": { x: 390, y: 564 }
      };
      const terminalPos = {
        "L|U|x": { x: 585, y: 24 },
        "L|U|y": { x: 585, y: 64 },
        "L|D|x": { x: 585, y: 120 },
        "L|D|y": { x: 585, y: 160 },
        "M|U|x": { x: 585, y: 236 },
        "M|U|y": { x: 585, y: 276 },
        "M|D|x": { x: 585, y: 332 },
        "M|D|y": { x: 585, y: 372 },
        "R|U|x": { x: 585, y: 448 },
        "R|U|y": { x: 585, y: 488 },
        "R|D|x": { x: 585, y: 544 },
        "R|D|y": { x: 585, y: 584 }
      };

      const profileText = (profile) => {
        const p2Part = TREE_EX2_ROOT_ACTIONS.map((rootAction) => profile.p2Choices[rootAction]).join(", ");
        const p1Part = TREE_EX2_P1_NODES.map((nodeKey) => profile.p1Choices[nodeKey]).join(", ");
        return `(${profile.rootAction}, (${p2Part}), (${p1Part}))`;
      };

      return (
        <section className="panel">
          <h2>{t("Übung 2 – Dreistufiges sequenzielles Spiel", "Exercise 2 - Three-stage sequential game")}</h2>
          <LevelSwitch
            value={treeEx2ActiveIndex}
            onChange={setTreeEx2ActiveIndex}
            leftLabel={`${t("Denkprozess-Simulator (Easy)", "Reasoning process simulator (Easy)")}${treeEx2Progress[0].solved ? " ✓" : ""}`}
            rightLabel={`${t("SPE-Check (Hard)", "SPE check (hard)")}${treeEx2Progress[1].solved ? " ✓" : ""}`}
            ariaLabel={t("Levelauswahl Übung 2", "Exercise 2 level switch")}
          />
          <p className="hint">
            {isSimulator
              ? t(
                  "Easy: Folge dem Denkprozess Schritt für Schritt per Rückwärtsinduktion.",
                  "Easy: Follow the reasoning process step by step via backward induction."
                )
              : t(
                  "Hard: Bestimme direkt alle teilspielperfekten Gleichgewichte (SPE).",
                  "Hard: Identify all subgame-perfect equilibria (SPE) directly."
                )}
          </p>

          <div className="exercise-layout tree-ex-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              <div className="tree-example-wrap tree-example-wrap-ex2">
                <svg viewBox="6 -14 724 644" className="tree-example-svg tree-example-svg-large tree-example-svg-ex2" role="img" aria-label={t("Komplexer Spielbaum", "Complex game tree")}>
                  <defs>
                    <marker id="tree-arrow-ex2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                      <path d="M0,0 L8,3 L0,6 Z" className="tree-arrow" />
                    </marker>
                  </defs>

                  {TREE_EX2_ROOT_ACTIONS.map((rootAction) => {
                    const from = rootPos;
                    const to = p2Pos[rootAction];
                    const hasSelection = activeState.phase3Choices.length > 0;
                    const edgeClass =
                      activeState.step >= 3 && hasSelection
                        ? `tree-edge ${activeState.phase3Choices.includes(rootAction) ? "bi-active" : "bi-muted"}`
                        : "tree-edge";
                    return (
                      <g key={`root-edge-${rootAction}`}>
                        <line x1={from.x + 20} y1={from.y} x2={to.x - 19} y2={to.y} className={edgeClass} markerEnd="url(#tree-arrow-ex2)" />
                        <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2} className="tree-action" textAnchor="middle" dominantBaseline="middle">{rootAction}</text>
                      </g>
                    );
                  })}

                  {TREE_EX2_ROOT_ACTIONS.flatMap((rootAction) =>
                    TREE_EX2_P2_ACTIONS.map((p2Action) => {
                      const from = p2Pos[rootAction];
                      const nodeKey = `${rootAction}|${p2Action}`;
                      const to = p1Pos[nodeKey];
                      const selected = activeState.phase2Answers[rootAction];
                      const edgeClass =
                        activeState.step >= 3
                          ? `tree-edge ${(selected === p2Action || selected === "indifferent") ? "bi-active" : "bi-muted"}`
                          : "tree-edge";
                      return (
                        <g key={`p2-edge-${nodeKey}`}>
                          <line x1={from.x + 19} y1={from.y} x2={to.x - 17} y2={to.y} className={edgeClass} markerEnd="url(#tree-arrow-ex2)" />
                          <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2} className="tree-action" textAnchor="middle" dominantBaseline="middle">{p2Action}</text>
                        </g>
                      );
                    })
                  )}

                  {TREE_EX2_P1_NODES.flatMap((nodeKey) =>
                    TREE_EX2_P1_ACTIONS.map((p1Action) => {
                      const from = p1Pos[nodeKey];
                      const to = terminalPos[`${nodeKey}|${p1Action}`];
                      const edgeClass =
                        activeState.step >= 2
                          ? `tree-edge ${activeGame.p1BestByNode[nodeKey] === p1Action ? "bi-active" : "bi-muted"}`
                          : "tree-edge";
                      return (
                        <g key={`p1-edge-${nodeKey}-${p1Action}`}>
                          <line x1={from.x + 17} y1={from.y} x2={to.x - 9} y2={to.y} className={edgeClass} markerEnd="url(#tree-arrow-ex2)" />
                          <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2} className="tree-action" textAnchor="middle" dominantBaseline="middle">{p1Action}</text>
                        </g>
                      );
                    })
                  )}

                  <circle cx={rootPos.x} cy={rootPos.y} r="20" className={`tree-node decision ${activeState.step === 3 ? "bi-current" : ""}`} />
                  <text x={rootPos.x} y={rootPos.y} className="tree-label" textAnchor="middle" dominantBaseline="middle">P1</text>

                  {TREE_EX2_ROOT_ACTIONS.map((rootAction) => (
                    <g key={`p2-node-${rootAction}`}>
                      <circle
                        cx={p2Pos[rootAction].x}
                        cy={p2Pos[rootAction].y}
                        r="19"
                        className={`tree-node decision ${activeState.step === 2 ? "bi-current" : ""}`}
                      />
                      <text x={p2Pos[rootAction].x} y={p2Pos[rootAction].y} className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>
                    </g>
                  ))}

                  {TREE_EX2_P1_NODES.map((nodeKey) => (
                    <g key={`p1-node-${nodeKey}`}>
                      <circle
                        cx={p1Pos[nodeKey].x}
                        cy={p1Pos[nodeKey].y}
                        r="17"
                        className={`tree-node decision ${isSimulator && activeState.step === 1 ? "bi-current" : ""}`}
                      />
                      <text x={p1Pos[nodeKey].x} y={p1Pos[nodeKey].y} className="tree-label" textAnchor="middle" dominantBaseline="middle">P1</text>
                    </g>
                  ))}

                  {TREE_EX2_P1_NODES.flatMap((nodeKey) =>
                    TREE_EX2_P1_ACTIONS.map((p1Action) => {
                      const payoff = activeGame.payoffs[`${nodeKey}|${p1Action}`];
                      const pos = terminalPos[`${nodeKey}|${p1Action}`];
                      return (
                        <g key={`terminal-${nodeKey}-${p1Action}`}>
                          <circle cx={pos.x} cy={pos.y} r="9" className="tree-node terminal" />
                          <rect x={pos.x + 14} y={pos.y - 12} width="102" height="24" rx="6" className="tree-payoff-bg" />
                          <text x={pos.x + 65} y={pos.y} className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                            ({payoff[0]}, {payoff[1]})
                          </text>
                        </g>
                      );
                    })
                  )}
                </svg>
              </div>
              <div className="actions">
                <button type="button" onClick={resetTreeEx2}>{t("Neues Spiel", "New game")}</button>
              </div>
            </article>

            <article className="panel nested-panel">
              <h3>{isSimulator ? t("Denkprozess-Simulator", "Reasoning process simulator") : t("SPE-Abfrage", "SPE check")}</h3>

              {!isSimulator && (
                <>
                  <p className="hint">
                    {t(
                      "Trage exakt alle Strategieprofile ein, die ein teilspielperfektes Gleichgewicht sind.",
                      "Enter exactly all strategy profiles that are subgame-perfect equilibria."
                    )}
                  </p>
                  <div ref={treeEx2SpeListRef} className="choice-list tree-ex2-spe-list">
                    {activeState.speEntries.map((entry, index) => (
                      <div key={`tree-ex2-spe-entry-${index}`} className="strategy-entry-row strategy-entry-row-wide tree-ex2-spe-row">
                        <span>(</span>
                        <select value={entry.rootAction} onChange={(e) => updateTreeEx2SpeEntry(index, "rootAction", e.target.value)}>
                          <option value=""></option>
                          {TREE_EX2_ROOT_ACTIONS.map((a) => <option key={`tree-ex2-root-${a}`} value={a}>{a}</option>)}
                        </select>
                        <span>,(</span>
                        <select value={entry.p2L} onChange={(e) => updateTreeEx2SpeEntry(index, "p2L", e.target.value)}>
                          <option value=""></option>
                          {TREE_EX2_P2_ACTIONS.map((a) => <option key={`tree-ex2-p2-l-${a}`} value={a}>{a}</option>)}
                        </select>
                        <span>,</span>
                        <select value={entry.p2M} onChange={(e) => updateTreeEx2SpeEntry(index, "p2M", e.target.value)}>
                          <option value=""></option>
                          {TREE_EX2_P2_ACTIONS.map((a) => <option key={`tree-ex2-p2-m-${a}`} value={a}>{a}</option>)}
                        </select>
                        <span>,</span>
                        <select value={entry.p2R} onChange={(e) => updateTreeEx2SpeEntry(index, "p2R", e.target.value)}>
                          <option value=""></option>
                          {TREE_EX2_P2_ACTIONS.map((a) => <option key={`tree-ex2-p2-r-${a}`} value={a}>{a}</option>)}
                        </select>
                        <span>), (</span>
                        <select value={entry.p1LU} onChange={(e) => updateTreeEx2SpeEntry(index, "p1LU", e.target.value)}>
                          <option value=""></option>
                          {TREE_EX2_P1_ACTIONS.map((a) => <option key={`tree-ex2-p1-lu-${a}`} value={a}>{a}</option>)}
                        </select>
                        <span>,</span>
                        <select value={entry.p1LD} onChange={(e) => updateTreeEx2SpeEntry(index, "p1LD", e.target.value)}>
                          <option value=""></option>
                          {TREE_EX2_P1_ACTIONS.map((a) => <option key={`tree-ex2-p1-ld-${a}`} value={a}>{a}</option>)}
                        </select>
                        <span>,</span>
                        <select value={entry.p1MU} onChange={(e) => updateTreeEx2SpeEntry(index, "p1MU", e.target.value)}>
                          <option value=""></option>
                          {TREE_EX2_P1_ACTIONS.map((a) => <option key={`tree-ex2-p1-mu-${a}`} value={a}>{a}</option>)}
                        </select>
                        <span>,</span>
                        <select value={entry.p1MD} onChange={(e) => updateTreeEx2SpeEntry(index, "p1MD", e.target.value)}>
                          <option value=""></option>
                          {TREE_EX2_P1_ACTIONS.map((a) => <option key={`tree-ex2-p1-md-${a}`} value={a}>{a}</option>)}
                        </select>
                        <span>,</span>
                        <select value={entry.p1RU} onChange={(e) => updateTreeEx2SpeEntry(index, "p1RU", e.target.value)}>
                          <option value=""></option>
                          {TREE_EX2_P1_ACTIONS.map((a) => <option key={`tree-ex2-p1-ru-${a}`} value={a}>{a}</option>)}
                        </select>
                        <span>,</span>
                        <select value={entry.p1RD} onChange={(e) => updateTreeEx2SpeEntry(index, "p1RD", e.target.value)}>
                          <option value=""></option>
                          {TREE_EX2_P1_ACTIONS.map((a) => <option key={`tree-ex2-p1-rd-${a}`} value={a}>{a}</option>)}
                        </select>
                        <span>))</span>
                        {activeState.speEntries.length > 1 && (
                          <button type="button" className="strategy-row-remove" onClick={() => removeTreeEx2SpeEntry(index)}>−</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="actions">
                    <button type="button" onClick={addTreeEx2SpeEntry}>
                      {t("Zeile hinzufügen", "Add row")}
                    </button>
                    <button type="button" onClick={checkTreeEx2SpeOnly}>
                      {t("SPE prüfen", "Check SPE")}
                    </button>
                  </div>
                  {activeState.speFeedback && (
                    <div className={`feedback-box feedback-card ${activeState.speFeedbackType}`}>
                      <strong>{activeState.speFeedbackType === "success" ? t("Richtig", "Correct") : t("Hinweis", "Hint")}</strong>
                      <p>{activeState.speFeedback}</p>
                    </div>
                  )}
                  {activeState.solved && (
                    <div className="notation-box">
                      <h4>{t("Teilspielperfekte Gleichgewichte", "Subgame-perfect equilibria")}</h4>
                      <ul className="intro-list">
                        {activeGame.speProfiles.map((profile, index) => (
                          <li key={`spe-profile-hard-${index}`}>
                            <code>{profileText(profile)}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {isSimulator && (
                <>

              <h4>{t("Phase 1 - Letzte Teilspiele (6x)", "Phase 1 - Terminal subgames (6x)")}</h4>
              {TREE_EX2_P1_NODES.map((nodeKey) => {
                const payoffX = activeGame.payoffs[`${nodeKey}|x`];
                const payoffY = activeGame.payoffs[`${nodeKey}|y`];
                const [rootAction, p2Action] = nodeKey.split("|");
                return (
                  <div key={`phase1-select-${nodeKey}`} className="action-row tree-ex2-action-row">
                    <label>{`${rootAction} → ${p2Action}`}</label>
                    <select
                      className="tree-ex2-select"
                      value={activeState.phase1Answers[nodeKey]}
                      disabled={activeState.step !== 1}
                      onChange={(e) => setTreeEx2Phase1Answer(nodeKey, e.target.value)}
                    >
                      <option value="">{t("Bitte wählen", "Choose")}</option>
                      <option value="x">x ({payoffX[0]}, {payoffX[1]})</option>
                      <option value="y">y ({payoffY[0]}, {payoffY[1]})</option>
                    </select>
                  </div>
                );
              })}
              <div className="actions">
                <button type="button" onClick={checkTreeEx2Phase1} disabled={activeState.step !== 1}>
                  {t("Phase 1 prüfen", "Check phase 1")}
                </button>
              </div>
              {activeState.phase1Feedback && (
                <div className={`feedback-box feedback-card ${activeState.phase1FeedbackType}`}>
                  <strong>{activeState.phase1FeedbackType === "success" ? t("Richtig", "Correct") : t("Hinweis", "Hint")}</strong>
                  <p>{activeState.phase1Feedback}</p>
                </div>
              )}

              {activeState.step >= 2 && (
                <div className="tree-phase2-block">
                  <h4>{t("Phase 2 - Mittlere Teilspiele (3x)", "Phase 2 - Middle subgames (3x)")}</h4>
                  {TREE_EX2_ROOT_ACTIONS.map((rootAction) => {
                    const payoffU = activeGame.continuationPayoffs[`${rootAction}|U`];
                    const payoffD = activeGame.continuationPayoffs[`${rootAction}|D`];
                    return (
                      <div key={`phase2-select-${rootAction}`} className="action-row tree-ex2-action-row">
                        <label>{t("Nach", "After")} {rootAction}</label>
                        <select
                          className="tree-ex2-select"
                          value={activeState.phase2Answers[rootAction]}
                          disabled={activeState.step !== 2}
                          onChange={(e) => setTreeEx2Phase2Answer(rootAction, e.target.value)}
                        >
                          <option value="">{t("Bitte wählen", "Choose")}</option>
                          <option value="U">U ({payoffU[0]}, {payoffU[1]})</option>
                          <option value="D">D ({payoffD[0]}, {payoffD[1]})</option>
                          <option value="indifferent">
                            {t("Indifferent (U oder D)", "Indifferent (U or D)")}
                          </option>
                        </select>
                      </div>
                    );
                  })}
                  <div className="actions">
                    <button type="button" onClick={checkTreeEx2Phase2} disabled={activeState.step !== 2}>
                      {t("Phase 2 prüfen", "Check phase 2")}
                    </button>
                  </div>
                  {activeState.phase2Feedback && (
                    <div className={`feedback-box feedback-card ${activeState.phase2FeedbackType}`}>
                      <strong>{activeState.phase2FeedbackType === "success" ? t("Richtig", "Correct") : t("Hinweis", "Hint")}</strong>
                      <p>{activeState.phase2Feedback}</p>
                    </div>
                  )}
                </div>
              )}

              {activeState.step >= 3 && (
                <div className="tree-phase3-block">
                  <h4>{t("Phase 3 - Startknoten", "Phase 3 - Root")}</h4>
                  <p className="hint tree-phase3-prompt">
                    {t(
                      "Welche Aktionen sind am Startknoten optimal? (Mehrfachauswahl möglich)",
                      "Which actions are optimal at the root? (Multiple selection allowed)"
                    )}
                  </p>
                  <div className="actions">
                    {TREE_EX2_ROOT_ACTIONS.map((rootAction) => (
                      <button
                        key={`phase3-choice-${rootAction}`}
                        type="button"
                        className={activeState.phase3Choices.includes(rootAction) ? "phase3-toggle active" : "phase3-toggle"}
                        onClick={() => toggleTreeEx2Phase3Choice(rootAction)}
                        disabled={activeState.step !== 3}
                      >
                        {rootAction}
                      </button>
                    ))}
                  </div>
                  {activeState.phase3Choices.length > 0 && (
                    <p className="hint">
                      {t("Gewählte Aktionen:", "Chosen actions:")} <code>{activeState.phase3Choices.join(", ")}</code>
                    </p>
                  )}
                  <div className="actions">
                    <button type="button" onClick={checkTreeEx2Phase3} disabled={activeState.step !== 3}>
                      {t("Phase 3 prüfen", "Check phase 3")}
                    </button>
                  </div>
                  {activeState.phase3Feedback && (
                    <div className={`feedback-box feedback-card ${activeState.phase3FeedbackType}`}>
                      <strong>{activeState.phase3FeedbackType === "success" ? t("Richtig", "Correct") : t("Hinweis", "Hint")}</strong>
                      <p>{activeState.phase3Feedback}</p>
                    </div>
                  )}
                </div>
              )}

              {activeState.solved && (
                <div className="notation-box">
                  <h4>{t("Teilspielperfekte Gleichgewichte", "Subgame-perfect equilibria")}</h4>
                  <p className="hint">
                    {activeGame.speProfiles.length > 1
                      ? t("In diesem Spiel gibt es mehrere SPE.", "This game has multiple SPE.")
                      : t("In diesem Spiel gibt es ein eindeutiges SPE.", "This game has a unique SPE.")}
                  </p>
                  <ul className="intro-list">
                    {activeGame.speProfiles.map((profile, index) => (
                      <li key={`spe-profile-${index}`}>
                        <code>{profileText(profile)}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
                </>
              )}
            </article>
          </div>

          <div className="actions">
            {treeEx2ActiveIndex === 0 ? (
              <>
                <button type="button" className="nav-pill-btn" onClick={() => setTreePage("ex1")}>
                  {t("Zurück", "Back")}
                </button>
                <button
                  type="button"
                  className="nav-pill-btn"
                  onClick={() => {
                    resetTreeEx6();
                    setTreePage("ex6");
                  }}
                >
                  {t("Weiter zu Teil 1 · Übung 3", "Next to Part 1 · Exercise 3")}
                </button>
              </>
            ) : (
              <>
                <button type="button" className="nav-pill-btn" onClick={() => setTreePage("ex1")}>{t("Zurück", "Back")}</button>
                <button
                  type="button"
                  className="nav-pill-btn"
                  onClick={() => {
                    resetTreeEx6();
                    setTreePage("ex6");
                  }}
                >
                  {t("Weiter zu Teil 1 · Übung 3", "Next to Part 1 · Exercise 3")}
                </button>
              </>
            )}
          </div>
        </section>
      );
    }

    if (activeTreePage === "ex6") {
      const ex6ProfileOptions = [
        { id: "U|L", label: "(U, L)" },
        { id: "U|R", label: "(U, R)" },
        { id: "D|L", label: "(D, L)" },
        { id: "D|R", label: "(D, R)" }
      ];
      return (
        <section className="panel">
          <h2>{t("Übung 3 – Informationsmengen & simultane Züge", "Exercise 3 - Information sets and simultaneous moves")}</h2>
          <p className="hint">
            {t(
              "Übersetze das Extensivspiel mit Informationsmenge in die strategische (Normal-)Form.",
              "Translate the extensive-form game with an information set into strategic (normal) form."
            )}
          </p>
          <div className="exercise-layout tree-ex-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              <div className="tree-example-wrap tree-example-wrap-ex4">
                <svg viewBox="24 90 520 360" className="tree-example-svg tree-example-svg-large tree-example-svg-ex4" role="img" aria-label={t("Spiel mit Informationsmenge", "Game with information set")}>
                  <defs>
                    <marker id="tree-arrow-ex6" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                      <path d="M0,0 L8,3 L0,6 Z" className="tree-arrow" />
                    </marker>
                  </defs>
                  <line x1="72" y1="262" x2="212" y2="162" className="tree-edge" markerEnd="url(#tree-arrow-ex6)" />
                  <line x1="72" y1="262" x2="212" y2="362" className="tree-edge" markerEnd="url(#tree-arrow-ex6)" />
                  <text x="138" y="206" className="tree-action" textAnchor="middle" dominantBaseline="middle">U</text>
                  <text x="138" y="322" className="tree-action" textAnchor="middle" dominantBaseline="middle">D</text>

                  <line x1="236" y1="162" x2="386" y2="132" className="tree-edge" markerEnd="url(#tree-arrow-ex6)" />
                  <line x1="236" y1="162" x2="386" y2="192" className="tree-edge" markerEnd="url(#tree-arrow-ex6)" />
                  <line x1="236" y1="362" x2="386" y2="332" className="tree-edge" markerEnd="url(#tree-arrow-ex6)" />
                  <line x1="236" y1="362" x2="386" y2="392" className="tree-edge" markerEnd="url(#tree-arrow-ex6)" />
                  <text x="310" y="136" className="tree-action" textAnchor="middle" dominantBaseline="middle">L</text>
                  <text x="310" y="188" className="tree-action" textAnchor="middle" dominantBaseline="middle">R</text>
                  <text x="310" y="336" className="tree-action" textAnchor="middle" dominantBaseline="middle">L</text>
                  <text x="310" y="388" className="tree-action" textAnchor="middle" dominantBaseline="middle">R</text>

                  <circle cx="56" cy="262" r="20" className="tree-node decision" />
                  <text x="56" y="262" className="tree-label" textAnchor="middle" dominantBaseline="middle">P1</text>
                  <circle cx="220" cy="162" r="18" className="tree-node decision" />
                  <circle cx="220" cy="362" r="18" className="tree-node decision" />
                  <text x="220" y="162" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>
                  <text x="220" y="362" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>
                  <path d="M220 180 C262 224, 262 300, 220 344" className="tree-info-set" />

                  <circle cx="396" cy="132" r="8" className="tree-node terminal" />
                  <circle cx="396" cy="192" r="8" className="tree-node terminal" />
                  <circle cx="396" cy="332" r="8" className="tree-node terminal" />
                  <circle cx="396" cy="392" r="8" className="tree-node terminal" />
                  <rect x="414" y="120" width="90" height="24" rx="6" className="tree-payoff-bg" />
                  <rect x="414" y="180" width="90" height="24" rx="6" className="tree-payoff-bg" />
                  <rect x="414" y="320" width="90" height="24" rx="6" className="tree-payoff-bg" />
                  <rect x="414" y="380" width="90" height="24" rx="6" className="tree-payoff-bg" />
                  <text x="459" y="132" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">{`(${treeEx6Game.UL[0]}, ${treeEx6Game.UL[1]})`}</text>
                  <text x="459" y="192" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">{`(${treeEx6Game.UR[0]}, ${treeEx6Game.UR[1]})`}</text>
                  <text x="459" y="332" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">{`(${treeEx6Game.DL[0]}, ${treeEx6Game.DL[1]})`}</text>
                  <text x="459" y="392" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">{`(${treeEx6Game.DR[0]}, ${treeEx6Game.DR[1]})`}</text>
                </svg>
              </div>
              <div className="actions">
                <button type="button" onClick={() => resetTreeEx6(true)}>{t("Neues Spiel", "New game")}</button>
              </div>
            </article>

            <article className="panel nested-panel">
              <h3>{t("Fragen", "Questions")}</h3>
              <div className="tree-ex3-question-block">
                <h4>{t("1) Warum repräsentiert der Baum simultanes Verhalten?", "1) Why does this tree represent simultaneous behavior?")}</h4>
                <div className="choice-list">
                  {treeEx6InfoOptions.map((option) => (
                    <label key={option.id} className="choice-item">
                      <input
                        type="radio"
                        name="tree-ex6-info"
                        checked={treeEx6InfoChoice === option.id}
                        onChange={(e) => {
                          setTreeEx6InfoChoice(e.target.value);
                          setTreeEx6InfoFeedback("");
                          setTreeEx6InfoFeedbackType("neutral");
                          setTreeEx6InfoSolved(false);
                        }}
                        value={option.id}
                      />
                      <span>{t(option.textDe, option.textEn)}</span>
                    </label>
                  ))}
                </div>
                <div className="actions">
                  <button type="button" onClick={checkTreeEx6Info}>{t("Antwort prüfen", "Check answer")}</button>
                </div>
                {treeEx6InfoFeedback && (
                  <div className={`feedback-box feedback-card ${treeEx6InfoFeedbackType}`}>
                    <strong>{treeEx6InfoFeedbackType === "success" ? t("Richtig", "Correct") : treeEx6InfoFeedbackType === "warning" ? t("Hinweis", "Hint") : t("Nicht korrekt", "Incorrect")}</strong>
                    <p>{treeEx6InfoFeedback}</p>
                  </div>
                )}
              </div>

              <div className="tree-ex3-question-block">
                <h4>{t("2) Welche strategische Form passt zum Baum?", "2) Which strategic form matches the tree?")}</h4>
                <div className="choice-list ex6-matrix-choice-list">
                  {treeEx6MatrixOptions.map((option) => (
                    <label key={option.id} className="choice-item ex6-matrix-option">
                      <input
                        type="radio"
                        name="tree-ex6-matrix"
                        checked={treeEx6MatrixChoice === option.id}
                        onChange={(e) => {
                          setTreeEx6MatrixChoice(e.target.value);
                          setTreeEx6MatrixFeedback("");
                          setTreeEx6MatrixFeedbackType("neutral");
                          setTreeEx6MatrixSolved(false);
                        }}
                        value={option.id}
                      />
                      <div className="ex6-matrix-option-content">
                        <StaticPayoffTable
                          data={option.matrix}
                          rowLabel="P1"
                          colLabel="P2"
                          autoScale={false}
                        />
                      </div>
                    </label>
                  ))}
                </div>
                <div className="actions">
                  <button type="button" onClick={checkTreeEx6Matrix}>{t("Antwort prüfen", "Check answer")}</button>
                </div>
                {treeEx6MatrixFeedback && (
                  <div className={`feedback-box feedback-card ${treeEx6MatrixFeedbackType}`}>
                    <strong>{treeEx6MatrixFeedbackType === "success" ? t("Richtig", "Correct") : treeEx6MatrixFeedbackType === "warning" ? t("Hinweis", "Hint") : t("Nicht korrekt", "Incorrect")}</strong>
                    <p>{treeEx6MatrixFeedback}</p>
                  </div>
                )}
              </div>

              <div className="tree-ex3-question-block">
                <h4>{t("3) Welche reinen Profile sind Nash-GG und welche sind SPE?", "3) Which pure profiles are Nash equilibria and which are SPE?")}</h4>
                <p className="hint">
                  {t(
                    "Markiere alle zutreffenden Profile in beiden Listen.",
                    "Mark all matching profiles in both lists."
                  )}
                </p>
                <div className="profile-order-columns">
                  <div>
                    <strong>{t("Reine Nash-GG", "Pure Nash equilibria")}</strong>
                    <div className="choice-list">
                      {ex6ProfileOptions.map((option) => (
                        <label key={`tree-ex6-ne-${option.id}`} className="choice-item checkbox-item">
                          <input
                            type="checkbox"
                            checked={treeEx6NeChoices.includes(option.id)}
                            onChange={() => toggleTreeEx6NeChoice(option.id)}
                          />
                          <span><code>{option.label}</code></span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <strong>{t("Reine SPE", "Pure SPE")}</strong>
                    <div className="choice-list">
                      {ex6ProfileOptions.map((option) => (
                        <label key={`tree-ex6-spe-${option.id}`} className="choice-item checkbox-item">
                          <input
                            type="checkbox"
                            checked={treeEx6SpeChoices.includes(option.id)}
                            onChange={() => toggleTreeEx6SpeChoice(option.id)}
                          />
                          <span><code>{option.label}</code></span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="actions">
                  <button type="button" onClick={checkTreeEx6Equilibria}>{t("Antwort prüfen", "Check answer")}</button>
                </div>
                {treeEx6EqFeedback && (
                  <div className={`feedback-box feedback-card ${treeEx6EqFeedbackType}`}>
                    <strong>{treeEx6EqFeedbackType === "success" ? t("Richtig", "Correct") : treeEx6EqFeedbackType === "warning" ? t("Hinweis", "Hint") : t("Nicht korrekt", "Incorrect")}</strong>
                    <p>{treeEx6EqFeedback}</p>
                  </div>
                )}
              </div>
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setTreePage("ex2")}>{t("Zurück", "Back")}</button>
            <button
              type="button"
              className="nav-pill-btn"
              onClick={() => {
                resetTreeEx3();
                setTreePage("ex3");
              }}
            >
              {t("Weiter zu Teil 2 · Übung 1", "Next to Part 2 · Exercise 1")}
            </button>
          </div>
        </section>
      );
    }

    if (activeTreePage === "ex3") {
      const treeEx3AllAnswered = Boolean(treeEx3SpeFeedback && treeEx3NashFeedback && treeEx3ThreatFeedback);
      const ex3P1Label = (action) => (action === "yes" ? t("Ja", "Yes") : t("Nein", "No"));
      const ex3P2Label = (action) => (action === "fight" ? t("Kampf", "Fight") : t("Nachgeben", "Accommodate"));
      return (
        <section className="panel">
          <h2>{t("Übung 1 – Eintrittsspiel mit unglaubwürdiger Drohung", "Exercise 1 - Entry game with non-credible threat")}</h2>
          <p className="hint">
            {t(
              "Gib die teilspielperfekten und Nash-Gleichgewichte an und identifiziere das Gleichgewicht mit unglaubwürdiger Drohung.",
              "Provide the subgame-perfect and Nash equilibria and identify the equilibrium with a non-credible threat."
            )}
          </p>
          <div className="exercise-layout tree-ex-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              <div className="tree-example-wrap tree-example-wrap-compact">
                <svg viewBox="0 0 450 245" className="tree-example-svg tree-example-svg-compact" role="img" aria-label={t("Eintrittsspiel", "Entry game")}>
                  <defs>
                    <marker id="tree-arrow-ex3" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                      <path d="M0,0 L8,3 L0,6 Z" className="tree-arrow" />
                    </marker>
                  </defs>

                  <line x1="66" y1="102" x2="176" y2="46" className="tree-edge" markerEnd="url(#tree-arrow-ex3)" />
                  <line x1="66" y1="114" x2="164" y2="164" className="tree-edge" markerEnd="url(#tree-arrow-ex3)" />
                  <line x1="196" y1="164" x2="326" y2="140" className="tree-edge" markerEnd="url(#tree-arrow-ex3)" />
                  <line x1="196" y1="166" x2="326" y2="212" className="tree-edge" markerEnd="url(#tree-arrow-ex3)" />

                  <text x="116" y="66" className="tree-action" textAnchor="middle" dominantBaseline="middle">{t("Nein", "No")}</text>
                  <text x="116" y="144" className="tree-action" textAnchor="middle" dominantBaseline="middle">{t("Ja", "Yes")}</text>
                  <text x="260" y="146" className="tree-action" textAnchor="middle" dominantBaseline="middle">{t("Kampf", "Fight")}</text>
                  <text x="260" y="189" className="tree-action" textAnchor="middle" dominantBaseline="middle">{t("Nachgeben", "Accommodate")}</text>

                  <circle cx="48" cy="108" r="20" className="tree-node decision" />
                  <circle cx="180" cy="165" r="20" className="tree-node decision" />
                  <circle cx="188" cy="42" r="12" className="tree-node terminal" />
                  <circle cx="336" cy="138" r="12" className="tree-node terminal" />
                  <circle cx="336" cy="214" r="12" className="tree-node terminal" />

                  <text x="48" y="108" className="tree-label" textAnchor="middle" dominantBaseline="middle">E</text>
                  <text x="180" y="165" className="tree-label" textAnchor="middle" dominantBaseline="middle">A</text>

                  <rect x="204" y="27" width="88" height="30" rx="8" className="tree-payoff-bg" />
                  <rect x="352" y="123" width="88" height="30" rx="8" className="tree-payoff-bg" />
                  <rect x="352" y="199" width="88" height="30" rx="8" className="tree-payoff-bg" />

                  <text x="248" y="42" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                    ({treeEx3Game.payoffNo.e}, {treeEx3Game.payoffNo.a})
                  </text>
                  <text x="396" y="138" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                    ({treeEx3Game.payoffFight.e}, {treeEx3Game.payoffFight.a})
                  </text>
                  <text x="396" y="214" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                    ({treeEx3Game.payoffAccommodate.e}, {treeEx3Game.payoffAccommodate.a})
                  </text>
                </svg>
              </div>
              <div className="actions">
                <button type="button" onClick={() => resetTreeEx3(true)}>{t("Neues Spiel", "New game")}</button>
              </div>
            </article>

            <article className="panel nested-panel">
              <h3>{t("Fragen", "Questions")}</h3>

              <div className="tree-ex3-question-block">
                <h4>{t("1) Gib alle teilspielperfekten GG an.", "1) Provide all subgame-perfect equilibria.")}</h4>
                <div className="choice-list">
                  {TREE_EX3_SPE_OPTIONS.map((option) => (
                    <label key={option.id} className="choice-item checkbox-item">
                      <input
                        type="checkbox"
                        checked={treeEx3SpeChoices.includes(option.id)}
                        onChange={() => toggleTreeEx3SpeChoice(option.id)}
                      />
                      <span><code>({ex3P1Label(option.p1)}, {ex3P2Label(option.p2)})</code></span>
                    </label>
                  ))}
                </div>
                <div className="actions">
                  <button type="button" onClick={checkTreeEx3Spe}>{t("SPE prüfen", "Check SPE")}</button>
                </div>
                {treeEx3SpeFeedback && (
                  <div className={`feedback-box feedback-card ${treeEx3SpeFeedbackType}`}>
                    <strong>{treeEx3SpeFeedbackType === "success" ? t("Richtig", "Correct") : t("Hinweis", "Hint")}</strong>
                    <p>{treeEx3SpeFeedback}</p>
                  </div>
                )}
              </div>

              <div className="tree-ex3-question-block">
                <h4>{t("2) Gib alle Nash-GG an.", "2) Provide all Nash equilibria.")}</h4>
                <div className="choice-list">
                  {TREE_EX3_NASH_OPTIONS.map((option) => (
                    <label key={option.id} className="choice-item checkbox-item">
                      <input
                        type="checkbox"
                        checked={treeEx3NashChoices.includes(option.id)}
                        onChange={() => toggleTreeEx3NashChoice(option.id)}
                      />
                      <span><code>({ex3P1Label(option.p1)}, {ex3P2Label(option.p2)})</code></span>
                    </label>
                  ))}
                </div>
                <div className="actions">
                  <button type="button" onClick={checkTreeEx3Nash}>{t("Nash prüfen", "Check Nash")}</button>
                </div>
                {treeEx3NashFeedback && (
                  <div className={`feedback-box feedback-card ${treeEx3NashFeedbackType}`}>
                    <strong>{treeEx3NashFeedbackType === "success" ? t("Richtig", "Correct") : t("Hinweis", "Hint")}</strong>
                    <p>{treeEx3NashFeedback}</p>
                  </div>
                )}
              </div>

              <div className="tree-ex3-question-block">
                <h4>
                  {t(
                    "3) Welches Nash-GG basiert auf einer unglaubwürdigen Drohung?",
                    "3) Which Nash equilibrium is based on a non-credible threat?"
                  )}
                </h4>
                <div className="choice-list">
                  {TREE_EX3_THREAT_OPTIONS.map((option) => (
                    <label key={option.id} className="choice-item">
                      <input
                        type="radio"
                        name="tree-ex3-threat"
                        checked={treeEx3ThreatChoice === option.id}
                        onChange={(e) => {
                          setTreeEx3ThreatChoice(e.target.value);
                          setTreeEx3ThreatFeedback("");
                          setTreeEx3ThreatFeedbackType("neutral");
                        }}
                        value={option.id}
                      />
                      <span><code>({ex3P1Label(option.p1)}, {ex3P2Label(option.p2)})</code></span>
                    </label>
                  ))}
                </div>
                <div className="actions">
                  <button type="button" onClick={checkTreeEx3Threat}>{t("Drohung prüfen", "Check threat")}</button>
                </div>
                {treeEx3ThreatFeedback && (
                  <div className={`feedback-box feedback-card ${treeEx3ThreatFeedbackType}`}>
                    <strong>{treeEx3ThreatFeedbackType === "success" ? t("Richtig", "Correct") : t("Hinweis", "Hint")}</strong>
                    <p>{treeEx3ThreatFeedback}</p>
                  </div>
                )}
              </div>

              {treeEx3AllAnswered && (
                <div className="notation-box">
                  <h4>{t("Zusätzliche Erklärung", "Additional explanation")}</h4>
                  <p className="hint">
                    {t(
                      "(Nein, Kampf) basiert auf einer unglaubwürdigen Drohung: A droht nach 'Ja' mit Kampf, würde bei Beobachtung von 'Ja' aber lieber nachgeben. Für E ist 'Nein' nur dann beste Antwort, wenn A tatsächlich 'Kampf' spielt.",
                      "(No, Fight) is based on a non-credible threat: A threatens to fight after 'Yes', but would prefer to accommodate once 'Yes' is observed. For E, 'No' is a best response only if A actually plays 'Fight'."
                    )}
                  </p>
                </div>
              )}

              {treeEx3OverallFeedback && (
                <div className={`feedback-box feedback-card ${treeEx3OverallFeedbackType}`}>
                  <strong>{treeEx3OverallFeedbackType === "success" ? t("Abgeschlossen", "Completed") : t("Hinweis", "Hint")}</strong>
                  <p>{treeEx3OverallFeedback}</p>
                </div>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setTreePage("ex6")}>{t("Zurück", "Back")}</button>
            <button
              type="button"
              className="nav-pill-btn"
              onClick={() => {
                resetTreeEx4();
                setTreePage("ex4");
              }}
            >
              {t("Weiter zu Übung 2", "Next to Exercise 2")}
            </button>
          </div>
        </section>
      );
    }

    if (activeTreePage === "ex4") {
      return (
        <section className="panel">
          <h2>{t("Übung 2 – Teilspielperfektes GG und Nash-GG mit 3 Spielern", "Exercise 2 - Subgame-perfect and Nash equilibria with 3 players")}</h2>
          <p className="hint">
            {t(
              "Gib alle teilspielperfekten Gleichgewichte und alle Nash-Gleichgewichte an.",
              "Provide all subgame-perfect equilibria and all Nash equilibria."
            )}
          </p>
          <div className="exercise-layout tree-ex-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              <div className="tree-example-wrap tree-example-wrap-ex4">
                <svg viewBox="24 76 510 450" className="tree-example-svg tree-example-svg-large tree-example-svg-ex4" role="img" aria-label={t("Dreistufiges Spiel", "Three-stage game")}>
                  <defs>
                    <marker id="tree-arrow-ex4" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                      <path d="M0,0 L8,3 L0,6 Z" className="tree-arrow" />
                    </marker>
                  </defs>

                  <line x1="52.2" y1="266.8" x2="148.5" y2="162.5" className="tree-edge" markerEnd="url(#tree-arrow-ex4)" />
                  <line x1="52.7" y1="292.7" x2="148.0" y2="388.0" className="tree-edge" markerEnd="url(#tree-arrow-ex4)" />
                  <text x="100.3" y="214.6" className="tree-action" textAnchor="middle" dominantBaseline="middle">L</text>
                  <text x="100.4" y="340.4" className="tree-action" textAnchor="middle" dominantBaseline="middle">R</text>

                  <line x1="176.8" y1="147.4" x2="402.1" y2="113.2" className="tree-edge" markerEnd="url(#tree-arrow-ex4)" />
                  <line x1="176.7" y1="153.2" x2="402.1" y2="196.5" className="tree-edge" markerEnd="url(#tree-arrow-ex4)" />
                  <text x="289.5" y="130.3" className="tree-action" textAnchor="middle" dominantBaseline="middle">l</text>
                  <text x="289.4" y="174.9" className="tree-action" textAnchor="middle" dominantBaseline="middle">r</text>

                  <line x1="174.8" y1="391.6" x2="286.1" y2="327.9" className="tree-edge" markerEnd="url(#tree-arrow-ex4)" />
                  <line x1="175.6" y1="406.7" x2="285.3" y2="453.7" className="tree-edge" markerEnd="url(#tree-arrow-ex4)" />
                  <text x="230.4" y="359.8" className="tree-action" textAnchor="middle" dominantBaseline="middle">a</text>
                  <text x="230.5" y="430.2" className="tree-action" textAnchor="middle" dominantBaseline="middle">b</text>

                  <line x1="315.1" y1="314.8" x2="402.4" y2="284.6" className="tree-edge" markerEnd="url(#tree-arrow-ex4)" />
                  <line x1="315.0" y1="325.5" x2="402.5" y2="357.3" className="tree-edge" markerEnd="url(#tree-arrow-ex4)" />
                  <text x="358.8" y="299.7" className="tree-action" textAnchor="middle" dominantBaseline="middle">l</text>
                  <text x="358.8" y="341.4" className="tree-action" textAnchor="middle" dominantBaseline="middle">r</text>

                  <line x1="315.1" y1="454.8" x2="402.4" y2="424.6" className="tree-edge" markerEnd="url(#tree-arrow-ex4)" />
                  <line x1="315.0" y1="465.5" x2="402.5" y2="495.3" className="tree-edge" markerEnd="url(#tree-arrow-ex4)" />
                  <text x="358.8" y="439.7" className="tree-action" textAnchor="middle" dominantBaseline="middle">l</text>
                  <text x="358.8" y="480.4" className="tree-action" textAnchor="middle" dominantBaseline="middle">r</text>

                  <circle cx="40" cy="280" r="18" className="tree-node decision" />
                  <circle cx="160" cy="150" r="17" className="tree-node decision" />
                  <circle cx="160" cy="400" r="17" className="tree-node decision" />
                  <circle cx="300" cy="320" r="16" className="tree-node decision" />
                  <circle cx="300" cy="460" r="16" className="tree-node decision" />
                  <text x="40" y="280" className="tree-label" textAnchor="middle" dominantBaseline="middle">P1</text>
                  <text x="160" y="150" className="tree-label" textAnchor="middle" dominantBaseline="middle">P3</text>
                  <text x="160" y="400" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>
                  <text x="300" y="320" className="tree-label" textAnchor="middle" dominantBaseline="middle">P3</text>
                  <text x="300" y="460" className="tree-label" textAnchor="middle" dominantBaseline="middle">P3</text>

                  <circle cx="410" cy="112" r="8" className="tree-node terminal" />
                  <circle cx="410" cy="198" r="8" className="tree-node terminal" />
                  <circle cx="410" cy="282" r="8" className="tree-node terminal" />
                  <circle cx="410" cy="360" r="8" className="tree-node terminal" />
                  <circle cx="410" cy="422" r="8" className="tree-node terminal" />
                  <circle cx="410" cy="498" r="8" className="tree-node terminal" />

                  <rect x="424" y="99" width="96" height="26" rx="6" className="tree-payoff-bg" />
                  <rect x="424" y="185" width="96" height="26" rx="6" className="tree-payoff-bg" />
                  <rect x="424" y="269" width="96" height="26" rx="6" className="tree-payoff-bg" />
                  <rect x="424" y="347" width="96" height="26" rx="6" className="tree-payoff-bg" />
                  <rect x="424" y="409" width="96" height="26" rx="6" className="tree-payoff-bg" />
                  <rect x="424" y="485" width="96" height="26" rx="6" className="tree-payoff-bg" />

                  <text x="472" y="112" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                    ({treeEx4Game.L_l[0]}, {treeEx4Game.L_l[1]}, {treeEx4Game.L_l[2]})
                  </text>
                  <text x="472" y="198" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                    ({treeEx4Game.L_r[0]}, {treeEx4Game.L_r[1]}, {treeEx4Game.L_r[2]})
                  </text>
                  <text x="472" y="282" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                    ({treeEx4Game.R_a_l[0]}, {treeEx4Game.R_a_l[1]}, {treeEx4Game.R_a_l[2]})
                  </text>
                  <text x="472" y="360" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                    ({treeEx4Game.R_a_r[0]}, {treeEx4Game.R_a_r[1]}, {treeEx4Game.R_a_r[2]})
                  </text>
                  <text x="472" y="422" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                    ({treeEx4Game.R_b_l[0]}, {treeEx4Game.R_b_l[1]}, {treeEx4Game.R_b_l[2]})
                  </text>
                  <text x="472" y="498" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                    ({treeEx4Game.R_b_r[0]}, {treeEx4Game.R_b_r[1]}, {treeEx4Game.R_b_r[2]})
                  </text>
                </svg>
              </div>
              <div className="actions">
                <button type="button" onClick={() => resetTreeEx4(false)}>{t("Startspiel laden", "Load baseline game")}</button>
                <button type="button" onClick={() => resetTreeEx4(true)}>{t("Neues Spiel", "New game")}</button>
                <button type="button" onClick={() => setShowHelpTreeEx4((v) => !v)}>{t("Hilfe", "Help")}</button>
              </div>
              {showHelpTreeEx4 && (
                <section className="panel nested-panel">
                  <h4>{t("Hilfe", "Help")}</h4>
                  <ul className="intro-list">
                    <li>
                      {t(
                        "Nash-GG: Kein Spieler kann sich durch einseitiges Abweichen verbessern (gegeben die Strategien der anderen).",
                        "Nash equilibrium: no player can improve by deviating unilaterally (given others' strategies)."
                      )}
                    </li>
                    <li>
                      {t(
                        "Teilspielperfektes GG (SPE): Nash-GG mit zusätzlicher Bedingung, dass die Strategien in jedem Teilspiel optimal sind.",
                        "Subgame-perfect equilibrium (SPE): a Nash equilibrium with the additional requirement that strategies are optimal in every subgame."
                      )}
                    </li>
                    <li>
                      {t(
                        "Daher gilt: Jedes SPE ist ein Nash-GG, aber nicht jedes Nash-GG ist teilspielperfekt (unglaubwürdige Drohungen fallen raus).",
                        "Therefore: every SPE is a Nash equilibrium, but not every Nash equilibrium is subgame-perfect (non-credible threats are ruled out)."
                      )}
                    </li>
                  </ul>
                </section>
              )}
            </article>

            <article className="panel nested-panel">
              <h3>{t("Fragen", "Questions")}</h3>
              <div className="tree-ex3-question-block">
                <h4>{t("1) Gib alle teilspielperfekten GG an.", "1) Provide all subgame-perfect equilibria.")}</h4>
                <div className="choice-list">
                  {treeEx4SpeEntries.map((entry, index) => (
                    <div key={`spe-entry-${index}`} className="strategy-entry-row tree-ex4-entry-row">
                      <code>(</code>
                      <select value={entry.p1} onChange={(e) => updateTreeEx4SpeEntry(index, "p1", e.target.value)}>
                        <option value="">{t("-", "-")}</option>
                        {TREE_EX4_P1_ACTIONS.map((a) => <option key={`spe-p1-${a}`} value={a}>{a}</option>)}
                      </select>
                      <code>,</code>
                      <select value={entry.p2} onChange={(e) => updateTreeEx4SpeEntry(index, "p2", e.target.value)}>
                        <option value="">{t("-", "-")}</option>
                        {TREE_EX4_P2_ACTIONS.map((a) => <option key={`spe-p2-${a}`} value={a}>{a}</option>)}
                      </select>
                      <code>,(</code>
                      <select value={entry.sL} onChange={(e) => updateTreeEx4SpeEntry(index, "sL", e.target.value)}>
                        <option value="">{t("-", "-")}</option>
                        {TREE_EX4_P3_ACTIONS.map((a) => <option key={`spe-sl-${a}`} value={a}>{a}</option>)}
                      </select>
                      <code>,</code>
                      <select value={entry.sA} onChange={(e) => updateTreeEx4SpeEntry(index, "sA", e.target.value)}>
                        <option value="">{t("-", "-")}</option>
                        {TREE_EX4_P3_ACTIONS.map((a) => <option key={`spe-sa-${a}`} value={a}>{a}</option>)}
                      </select>
                      <code>,</code>
                      <select value={entry.sB} onChange={(e) => updateTreeEx4SpeEntry(index, "sB", e.target.value)}>
                        <option value="">{t("-", "-")}</option>
                        {TREE_EX4_P3_ACTIONS.map((a) => <option key={`spe-sb-${a}`} value={a}>{a}</option>)}
                      </select>
                      <code>))</code>
                      {treeEx4SpeEntries.length > 1 && (
                        <button type="button" className="strategy-row-remove" onClick={() => removeTreeEx4SpeEntry(index)}>−</button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="actions">
                  <button type="button" onClick={addTreeEx4SpeEntry}>{t("Zeile hinzufügen", "Add row")}</button>
                  <button type="button" onClick={checkTreeEx4Spe}>{t("SPE prüfen", "Check SPE")}</button>
                </div>
                {treeEx4SpeFeedback && (
                  <div className={`feedback-box feedback-card ${treeEx4SpeFeedbackType}`}>
                    <strong>{treeEx4SpeFeedbackType === "success" ? t("Richtig", "Correct") : t("Hinweis", "Hint")}</strong>
                    <p>{treeEx4SpeFeedback}</p>
                  </div>
                )}
              </div>

              <div className="tree-ex3-question-block">
                <h4>{t("2) Gib alle Nash-GG an.", "2) Provide all Nash equilibria.")}</h4>
                <div className="choice-list">
                  {treeEx4NashEntries.map((entry, index) => (
                    <div key={`nash-entry-${index}`} className="strategy-entry-row tree-ex4-entry-row">
                      <code>(</code>
                      <select value={entry.p1} onChange={(e) => updateTreeEx4NashEntry(index, "p1", e.target.value)}>
                        <option value="">{t("-", "-")}</option>
                        {TREE_EX4_P1_ACTIONS.map((a) => <option key={`nash-p1-${a}`} value={a}>{a}</option>)}
                      </select>
                      <code>,</code>
                      <select value={entry.p2} onChange={(e) => updateTreeEx4NashEntry(index, "p2", e.target.value)}>
                        <option value="">{t("-", "-")}</option>
                        {TREE_EX4_P2_ACTIONS.map((a) => <option key={`nash-p2-${a}`} value={a}>{a}</option>)}
                      </select>
                      <code>,(</code>
                      <select value={entry.sL} onChange={(e) => updateTreeEx4NashEntry(index, "sL", e.target.value)}>
                        <option value="">{t("-", "-")}</option>
                        {TREE_EX4_P3_ACTIONS.map((a) => <option key={`nash-sl-${a}`} value={a}>{a}</option>)}
                      </select>
                      <code>,</code>
                      <select value={entry.sA} onChange={(e) => updateTreeEx4NashEntry(index, "sA", e.target.value)}>
                        <option value="">{t("-", "-")}</option>
                        {TREE_EX4_P3_ACTIONS.map((a) => <option key={`nash-sa-${a}`} value={a}>{a}</option>)}
                      </select>
                      <code>,</code>
                      <select value={entry.sB} onChange={(e) => updateTreeEx4NashEntry(index, "sB", e.target.value)}>
                        <option value="">{t("-", "-")}</option>
                        {TREE_EX4_P3_ACTIONS.map((a) => <option key={`nash-sb-${a}`} value={a}>{a}</option>)}
                      </select>
                      <code>))</code>
                      {treeEx4NashEntries.length > 1 && (
                        <button type="button" className="strategy-row-remove" onClick={() => removeTreeEx4NashEntry(index)}>−</button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="actions">
                  <button type="button" onClick={addTreeEx4NashEntry}>{t("Zeile hinzufügen", "Add row")}</button>
                  <button type="button" onClick={checkTreeEx4Nash}>{t("Nash prüfen", "Check Nash")}</button>
                </div>
                {treeEx4NashFeedback && (
                  <div className={`feedback-box feedback-card ${treeEx4NashFeedbackType}`}>
                    <strong>{treeEx4NashFeedbackType === "success" ? t("Richtig", "Correct") : t("Hinweis", "Hint")}</strong>
                    <p>{treeEx4NashFeedback}</p>
                  </div>
                )}
              </div>

              {treeEx4OverallFeedback && (
                <div className={`feedback-box feedback-card ${treeEx4OverallFeedbackType}`}>
                  <strong>{treeEx4OverallFeedbackType === "success" ? t("Abgeschlossen", "Completed") : t("Hinweis", "Hint")}</strong>
                  <p>{treeEx4OverallFeedback}</p>
                </div>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setTreePage("ex3")}>{t("Zurück", "Back")}</button>
            <button
              type="button"
              className="nav-pill-btn"
              onClick={() => {
                setTreeEx5ActiveLevel(0);
                resetTreeEx5();
                setTreePage("ex5");
              }}
            >
              {t("Weiter zu Teil 3 · Übung 1", "Next to Part 3 · Exercise 1")}
            </button>
          </div>
        </section>
      );
    }

    if (activeTreePage === "ex5") {
      const isThreeStage = treeEx5ActiveLevel === 1;
      const ex5Offers = isThreeStage ? TREE_EX5_3_OFFERS : TREE_EX5_2_OFFERS;
      const ex5SpeOptions = isThreeStage ? TREE_EX5_3_SPE_OPTIONS : TREE_EX5_2_SPE_OPTIONS;
      const solved2 = !!exerciseProgress.tree_ex5_2?.solved;
      const solved3 = !!exerciseProgress.tree_ex5_3?.solved;
      return (
        <section className="panel">
          <h2>
            {t(
              "Übung 1 – Ultimatumspiel mit vollständig rationalen Spielern und ohne Zusatzfaktoren",
              "Exercise 1 - Ultimatum game with fully rational players and no additional factors"
            )}
          </h2>
          <LevelSwitch
            value={treeEx5ActiveLevel}
            onChange={setTreeEx5ActiveLevel}
            leftLabel={`${t("2-stufig", "2-stage")}${solved2 ? " ✓" : ""}`}
            rightLabel={`${t("3-stufig", "3-stage")}${solved3 ? " ✓" : ""}`}
            ariaLabel={t("Levelauswahl Ultimatum", "Ultimatum level switch")}
          />
          <p className="hint">
            {isThreeStage
              ? t(
                  "3-stufig: Nach einer Ablehnung geht die Verhandlung in die nächste Runde mit einem neuen Angebot.",
                  "3-stage: After a rejection, the negotiation continues to the next round with a new offer."
                )
              : t(
                  "2-stufig: Spieler 1 wählt ein Angebot. Danach entscheidet Spieler 2 im jeweiligen Teilspiel über Annehmen (A) oder Ablehnen (R).",
                  "2-stage: Player 1 chooses an offer. Then Player 2 decides in the corresponding subgame whether to Accept (A) or Reject (R)."
                )}
          </p>
          <div className="exercise-layout tree-ex-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              <div className={`tree-example-wrap tree-example-wrap-ex4 tree-example-wrap-ex5 ${isThreeStage ? "tree-example-wrap-ex5-3" : "tree-example-wrap-ex5-2"}`}>
                {!isThreeStage ? (
                  <svg viewBox="20 40 560 430" className="tree-example-svg tree-example-svg-large tree-example-svg-ex5 tree-example-svg-ex5-2" role="img" aria-label={t("Ultimatum-Spielbaum", "Ultimatum game tree")}>
                    <defs>
                      <marker id="tree-arrow-ex5" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                        <path d="M0,0 L8,3 L0,6 Z" className="tree-arrow" />
                      </marker>
                    </defs>
                    <line x1="92" y1="260" x2="248" y2="100" className="tree-edge" markerEnd="url(#tree-arrow-ex5)" />
                    <line x1="92" y1="260" x2="248" y2="260" className="tree-edge" markerEnd="url(#tree-arrow-ex5)" />
                    <line x1="92" y1="260" x2="248" y2="420" className="tree-edge" markerEnd="url(#tree-arrow-ex5)" />
                    <text x="170" y="170" className="tree-action" textAnchor="middle" dominantBaseline="middle">90/10</text>
                    <text x="170" y="246" className="tree-action" textAnchor="middle" dominantBaseline="middle">70/30</text>
                    <text x="170" y="352" className="tree-action" textAnchor="middle" dominantBaseline="middle">50/50</text>
                    <line x1="276" y1="96" x2="446" y2="70" className="tree-edge" markerEnd="url(#tree-arrow-ex5)" />
                    <line x1="276" y1="104" x2="446" y2="132" className="tree-edge" markerEnd="url(#tree-arrow-ex5)" />
                    <line x1="276" y1="256" x2="446" y2="230" className="tree-edge" markerEnd="url(#tree-arrow-ex5)" />
                    <line x1="276" y1="264" x2="446" y2="292" className="tree-edge" markerEnd="url(#tree-arrow-ex5)" />
                    <line x1="276" y1="416" x2="446" y2="390" className="tree-edge" markerEnd="url(#tree-arrow-ex5)" />
                    <line x1="276" y1="424" x2="446" y2="452" className="tree-edge" markerEnd="url(#tree-arrow-ex5)" />
                    <text x="361" y="82" className="tree-action" textAnchor="middle" dominantBaseline="middle">A</text>
                    <text x="361" y="124" className="tree-action" textAnchor="middle" dominantBaseline="middle">R</text>
                    <text x="361" y="242" className="tree-action" textAnchor="middle" dominantBaseline="middle">A</text>
                    <text x="361" y="284" className="tree-action" textAnchor="middle" dominantBaseline="middle">R</text>
                    <text x="361" y="402" className="tree-action" textAnchor="middle" dominantBaseline="middle">A</text>
                    <text x="361" y="444" className="tree-action" textAnchor="middle" dominantBaseline="middle">R</text>
                    <circle cx="70" cy="260" r="20" className="tree-node decision" />
                    <text x="70" y="260" className="tree-label" textAnchor="middle" dominantBaseline="middle">P1</text>
                    <circle cx="258" cy="100" r="18" className="tree-node decision" />
                    <circle cx="258" cy="260" r="18" className="tree-node decision" />
                    <circle cx="258" cy="420" r="18" className="tree-node decision" />
                    <text x="258" y="100" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>
                    <text x="258" y="260" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>
                    <text x="258" y="420" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>
                    <circle cx="456" cy="70" r="8" className="tree-node terminal" />
                    <circle cx="456" cy="132" r="8" className="tree-node terminal" />
                    <circle cx="456" cy="230" r="8" className="tree-node terminal" />
                    <circle cx="456" cy="292" r="8" className="tree-node terminal" />
                    <circle cx="456" cy="390" r="8" className="tree-node terminal" />
                    <circle cx="456" cy="452" r="8" className="tree-node terminal" />
                    <rect x="474" y="57" width="90" height="24" rx="6" className="tree-payoff-bg" />
                    <rect x="474" y="119" width="90" height="24" rx="6" className="tree-payoff-bg" />
                    <rect x="474" y="217" width="90" height="24" rx="6" className="tree-payoff-bg" />
                    <rect x="474" y="279" width="90" height="24" rx="6" className="tree-payoff-bg" />
                    <rect x="474" y="377" width="90" height="24" rx="6" className="tree-payoff-bg" />
                    <rect x="474" y="439" width="90" height="24" rx="6" className="tree-payoff-bg" />
                    <text x="519" y="69" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(9, 1)</text>
                    <text x="519" y="131" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(0, 0)</text>
                    <text x="519" y="229" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(7, 3)</text>
                    <text x="519" y="291" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(0, 0)</text>
                    <text x="519" y="389" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(5, 5)</text>
                    <text x="519" y="451" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(0, 0)</text>
                  </svg>
                ) : (
                  <svg viewBox="40 30 1120 520" className="tree-example-svg tree-example-svg-large tree-example-svg-ex5 tree-example-svg-ex5-3" role="img" aria-label={t("Dreistufiges Ultimatum-Spiel", "Three-stage ultimatum game")}>
                    <defs>
                      <marker id="tree-arrow-ex5-3" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                        <path d="M0,0 L8,3 L0,6 Z" className="tree-arrow" />
                      </marker>
                    </defs>
                    <circle cx="96" cy="120" r="18" className="tree-node decision" />
                    <text x="96" y="120" className="tree-label" textAnchor="middle" dominantBaseline="middle">P1</text>
                    <line x1="114" y1="120" x2="244" y2="120" className="tree-edge" markerEnd="url(#tree-arrow-ex5-3)" />
                    <text x="178" y="104" className="tree-action" textAnchor="middle" dominantBaseline="middle">70/30</text>

                    <circle cx="262" cy="120" r="18" className="tree-node decision" />
                    <text x="262" y="120" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>
                    <line x1="280" y1="118" x2="420" y2="92" className="tree-edge" markerEnd="url(#tree-arrow-ex5-3)" />
                    <line x1="276" y1="132" x2="416" y2="184" className="tree-edge" markerEnd="url(#tree-arrow-ex5-3)" />
                    <text x="350" y="96" className="tree-action" textAnchor="middle" dominantBaseline="middle">A</text>
                    <text x="346" y="163" className="tree-action" textAnchor="middle" dominantBaseline="middle">R</text>
                    <circle cx="438" cy="90" r="8" className="tree-node terminal" />
                    <rect x="456" y="78" width="90" height="24" rx="6" className="tree-payoff-bg" />
                    <text x="501" y="90" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(7, 3)</text>

                    <circle cx="436" cy="192" r="18" className="tree-node decision" />
                    <text x="436" y="192" className="tree-label" textAnchor="middle" dominantBaseline="middle">P1</text>
                    <line x1="454" y1="192" x2="584" y2="192" className="tree-edge" markerEnd="url(#tree-arrow-ex5-3)" />
                    <text x="520" y="176" className="tree-action" textAnchor="middle" dominantBaseline="middle">60/20</text>

                    <circle cx="602" cy="192" r="18" className="tree-node decision" />
                    <text x="602" y="192" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>
                    <line x1="620" y1="190" x2="760" y2="164" className="tree-edge" markerEnd="url(#tree-arrow-ex5-3)" />
                    <line x1="616" y1="204" x2="756" y2="256" className="tree-edge" markerEnd="url(#tree-arrow-ex5-3)" />
                    <text x="690" y="168" className="tree-action" textAnchor="middle" dominantBaseline="middle">A</text>
                    <text x="686" y="235" className="tree-action" textAnchor="middle" dominantBaseline="middle">R</text>
                    <circle cx="778" cy="162" r="8" className="tree-node terminal" />
                    <rect x="796" y="150" width="90" height="24" rx="6" className="tree-payoff-bg" />
                    <text x="841" y="162" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(6, 2)</text>

                    <circle cx="776" cy="264" r="18" className="tree-node decision" />
                    <text x="776" y="264" className="tree-label" textAnchor="middle" dominantBaseline="middle">P1</text>
                    <line x1="794" y1="264" x2="924" y2="264" className="tree-edge" markerEnd="url(#tree-arrow-ex5-3)" />
                    <text x="860" y="248" className="tree-action" textAnchor="middle" dominantBaseline="middle">50/10</text>

                    <circle cx="942" cy="264" r="18" className="tree-node decision" />
                    <text x="942" y="264" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>
                    <line x1="960" y1="262" x2="1010" y2="236" className="tree-edge" markerEnd="url(#tree-arrow-ex5-3)" />
                    <line x1="958" y1="274" x2="1010" y2="300" className="tree-edge" markerEnd="url(#tree-arrow-ex5-3)" />
                    <text x="985" y="240" className="tree-action" textAnchor="middle" dominantBaseline="middle">A</text>
                    <text x="985" y="293" className="tree-action" textAnchor="middle" dominantBaseline="middle">R</text>
                    <circle cx="1026" cy="234" r="8" className="tree-node terminal" />
                    <circle cx="1026" cy="302" r="8" className="tree-node terminal" />
                    <rect x="1044" y="222" width="90" height="24" rx="6" className="tree-payoff-bg" />
                    <rect x="1044" y="290" width="90" height="24" rx="6" className="tree-payoff-bg" />
                    <text x="1089" y="234" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(5, 1)</text>
                    <text x="1089" y="302" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(0, 0)</text>
                  </svg>
                )}
              </div>
              <div className="actions">
                <button type="button" onClick={resetTreeEx5}>{t("Zurücksetzen", "Reset")}</button>
              </div>
            </article>

            <article className="panel nested-panel">
              <h3>{t("Fragen", "Questions")}</h3>
              <div className="tree-ex3-question-block">
                <h4>{t("1) Rückwärtsinduktion: Was ist die optimale Antwort im jeweiligen Teilspiel?", "1) Backward induction: What is the optimal response in each subgame?")}</h4>
                <p className="hint">
                  {isThreeStage
                    ? t("Lege für jede Runde fest, ob der antwortende Spieler annimmt (A) oder ablehnt (R).", "For each round, decide whether the responding player accepts (A) or rejects (R).")
                    : t("Lege für jedes Angebot fest, ob Spieler 2 annimmt (A) oder ablehnt (R).", "For each offer, decide whether Player 2 accepts (A) or rejects (R).")}
                </p>
                <div className="ex8-q1-list">
                  {ex5Offers.map((offer) => (
                    <div key={`tree-ex5-p2-${offer.id}`} className="ex8-q1-row">
                      <div className="ex8-response-title-inline">
                        <span>{t("Nach", "After")}</span>
                        <code>{offer.label}</code>
                      </div>
                      <div className="ex8-q1-options">
                        <label className="choice-item ex8-small-choice">
                          <input
                            type="radio"
                            name={`tree-ex5-p2-${offer.id}`}
                            checked={treeEx5P2Answers[offer.id] === "A"}
                            onChange={() => setTreeEx5Answer(offer.id, "A")}
                            value="A"
                          />
                          <span><code>A</code></span>
                        </label>
                        <label className="choice-item ex8-small-choice">
                          <input
                            type="radio"
                            name={`tree-ex5-p2-${offer.id}`}
                            checked={treeEx5P2Answers[offer.id] === "R"}
                            onChange={() => setTreeEx5Answer(offer.id, "R")}
                            value="R"
                          />
                          <span><code>R</code></span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="actions">
                  <button type="button" onClick={checkTreeEx5Phase1}>{t("Schritt prüfen", "Check step")}</button>
                </div>
                {treeEx5Phase1Feedback && (
                  <div className={`feedback-box feedback-card ${treeEx5Phase1FeedbackType}`}>
                    <strong>{treeEx5Phase1FeedbackType === "success" ? t("Richtig", "Correct") : treeEx5Phase1FeedbackType === "warning" ? t("Hinweis", "Hint") : t("Nicht korrekt", "Incorrect")}</strong>
                    <p>{treeEx5Phase1Feedback}</p>
                  </div>
                )}
              </div>

              <div className="tree-ex3-question-block">
                <h4>{t("2) SPE-Check: Welches Profil ist teilspielperfekt?", "2) SPE check: Which profile is subgame-perfect?")}</h4>
                <div className="choice-list">
                  {ex5SpeOptions.map((option) => (
                    <label key={option.id} className="choice-item">
                      <input
                        type="radio"
                        name="tree-ex5-spe"
                        checked={treeEx5SpeChoice === option.id}
                        onChange={(e) => {
                          setTreeEx5SpeChoice(e.target.value);
                          setTreeEx5SpeFeedback("");
                          setTreeEx5SpeFeedbackType("neutral");
                        }}
                        value={option.id}
                      />
                      <span>
                        <code>
                          {!isThreeStage
                            ? `(${option.p1}, (${option.p2.join(", ")}))`
                            : `(${option.p2.join(", ")})`}
                        </code>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="actions">
                  <button type="button" onClick={checkTreeEx5Spe}>{t("SPE prüfen", "Check SPE")}</button>
                </div>
                {treeEx5SpeFeedback && (
                  <div className={`feedback-box feedback-card ${treeEx5SpeFeedbackType}`}>
                    <strong>{treeEx5SpeFeedbackType === "success" ? t("Richtig", "Correct") : treeEx5SpeFeedbackType === "warning" ? t("Hinweis", "Hint") : t("Nicht korrekt", "Incorrect")}</strong>
                    <p>{treeEx5SpeFeedback}</p>
                  </div>
                )}
              </div>

              {treeEx5OverallFeedback && (
                <div className={`feedback-box feedback-card ${treeEx5OverallFeedbackType}`}>
                  <strong>{treeEx5OverallFeedbackType === "success" ? t("Abgeschlossen", "Completed") : t("Hinweis", "Hint")}</strong>
                  <p>{treeEx5OverallFeedback}</p>
                </div>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setTreePage("ex4")}>{t("Zurück", "Back")}</button>
            <button
              type="button"
              className="nav-pill-btn"
              onClick={() => {
                resetTreeEx8(true);
                setTreePage("ex8");
              }}
            >
              {t("Weiter zu Übung 2", "Next to Exercise 2")}
            </button>
          </div>
        </section>
      );
    }

    if (activeTreePage === "ex8") {
      const stepOneSolved = treeEx8P2Solved;
      const highBest = treeEx8Solution.p2BestByOffer["q1-high"];
      const lowBest = treeEx8Solution.p2BestByOffer["q1-low"];
      const highQ21Active = stepOneSolved && highBest === "q2=1";
      const highQ23Active = stepOneSolved && highBest === "q2=3";
      const lowQ21Active = stepOneSolved && lowBest === "q2=1";
      const lowQ23Active = stepOneSolved && lowBest === "q2=3";
      const edgeStateClass = (isActive) => (stepOneSolved ? (isActive ? "bi-active" : "bi-muted") : "");
      const terminalStateClass = (isActive) => (stepOneSolved ? (isActive ? "bi-selected-terminal" : "bi-muted-node") : "");
      const textStateClass = (isActive) => (stepOneSolved ? (isActive ? "bi-active" : "bi-muted") : "");
      return (
        <section className="panel">
          <h2>{t("Übung 2 – Stackelberg light", "Exercise 2 - Stackelberg light")}</h2>
          <p className="hint">
            {t(
              "Spieler 1 (Leader) wählt zuerst die Menge q1, dann reagiert Spieler 2 (Follower) mit q2.",
              "Player 1 (leader) chooses quantity q1 first, then Player 2 (follower) responds with q2."
            )}
          </p>
          <div className="exercise-layout tree-ex-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              <div className="tree-example-wrap tree-example-wrap-ex4">
                <svg viewBox="24 108 530 360" className="tree-example-svg tree-example-svg-large tree-example-svg-ex4" role="img" aria-label={t("Stackelberg-Spielbaum", "Stackelberg game tree")}>
                  <defs>
                    <marker id="tree-arrow-ex8" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                      <path d="M0,0 L8,3 L0,6 Z" className="tree-arrow" />
                    </marker>
                  </defs>
                  <line x1="70" y1="276" x2="214" y2="178" className="tree-edge" markerEnd="url(#tree-arrow-ex8)" />
                  <line x1="70" y1="276" x2="214" y2="370" className="tree-edge" markerEnd="url(#tree-arrow-ex8)" />
                  <text x="146" y="216" className="tree-action" textAnchor="middle" dominantBaseline="middle">q1=4</text>
                  <text x="146" y="338" className="tree-action" textAnchor="middle" dominantBaseline="middle">q1=2</text>

                  <line x1="244" y1="174" x2="404" y2="142" className={`tree-edge ${edgeStateClass(highQ21Active)}`} markerEnd="url(#tree-arrow-ex8)" />
                  <line x1="244" y1="174" x2="404" y2="206" className={`tree-edge ${edgeStateClass(highQ23Active)}`} markerEnd="url(#tree-arrow-ex8)" />
                  <text x="324" y="144" className={`tree-action ${textStateClass(highQ21Active)}`} textAnchor="middle" dominantBaseline="middle">q2=1</text>
                  <text x="324" y="202" className={`tree-action ${textStateClass(highQ23Active)}`} textAnchor="middle" dominantBaseline="middle">q2=3</text>

                  <line x1="244" y1="374" x2="404" y2="342" className={`tree-edge ${edgeStateClass(lowQ21Active)}`} markerEnd="url(#tree-arrow-ex8)" />
                  <line x1="244" y1="374" x2="404" y2="406" className={`tree-edge ${edgeStateClass(lowQ23Active)}`} markerEnd="url(#tree-arrow-ex8)" />
                  <text x="324" y="344" className={`tree-action ${textStateClass(lowQ21Active)}`} textAnchor="middle" dominantBaseline="middle">q2=1</text>
                  <text x="324" y="402" className={`tree-action ${textStateClass(lowQ23Active)}`} textAnchor="middle" dominantBaseline="middle">q2=3</text>

                  <circle cx="54" cy="276" r="20" className="tree-node decision" />
                  <text x="54" y="276" className="tree-label" textAnchor="middle" dominantBaseline="middle">P1</text>
                  <circle cx="228" cy="174" r="18" className="tree-node decision" />
                  <circle cx="228" cy="374" r="18" className="tree-node decision" />
                  <text x="228" y="174" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>
                  <text x="228" y="374" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>

                  <circle cx="414" cy="142" r="8" className={`tree-node terminal ${terminalStateClass(highQ21Active)}`} />
                  <circle cx="414" cy="206" r="8" className={`tree-node terminal ${terminalStateClass(highQ23Active)}`} />
                  <circle cx="414" cy="342" r="8" className={`tree-node terminal ${terminalStateClass(lowQ21Active)}`} />
                  <circle cx="414" cy="406" r="8" className={`tree-node terminal ${terminalStateClass(lowQ23Active)}`} />
                  <rect x="430" y="130" width="90" height="24" rx="6" className={`tree-payoff-bg ${textStateClass(highQ21Active)}`} />
                  <rect x="430" y="194" width="90" height="24" rx="6" className={`tree-payoff-bg ${textStateClass(highQ23Active)}`} />
                  <rect x="430" y="330" width="90" height="24" rx="6" className={`tree-payoff-bg ${textStateClass(lowQ21Active)}`} />
                  <rect x="430" y="394" width="90" height="24" rx="6" className={`tree-payoff-bg ${textStateClass(lowQ23Active)}`} />
                  <text x="475" y="142" className={`tree-payoff ${textStateClass(highQ21Active)}`} textAnchor="middle" dominantBaseline="middle">{`(${treeEx8SafeGame.offers[0].outcomes["q2=1"][0]}, ${treeEx8SafeGame.offers[0].outcomes["q2=1"][1]})`}</text>
                  <text x="475" y="206" className={`tree-payoff ${textStateClass(highQ23Active)}`} textAnchor="middle" dominantBaseline="middle">{`(${treeEx8SafeGame.offers[0].outcomes["q2=3"][0]}, ${treeEx8SafeGame.offers[0].outcomes["q2=3"][1]})`}</text>
                  <text x="475" y="342" className={`tree-payoff ${textStateClass(lowQ21Active)}`} textAnchor="middle" dominantBaseline="middle">{`(${treeEx8SafeGame.offers[1].outcomes["q2=1"][0]}, ${treeEx8SafeGame.offers[1].outcomes["q2=1"][1]})`}</text>
                  <text x="475" y="406" className={`tree-payoff ${textStateClass(lowQ23Active)}`} textAnchor="middle" dominantBaseline="middle">{`(${treeEx8SafeGame.offers[1].outcomes["q2=3"][0]}, ${treeEx8SafeGame.offers[1].outcomes["q2=3"][1]})`}</text>
                </svg>
              </div>
              <div className="actions">
                <button type="button" onClick={() => resetTreeEx8(true)}>{t("Neues Spiel", "New game")}</button>
                <button type="button" onClick={() => setShowHelpTreeEx8((v) => !v)}>{t("Hilfe", "Help")}</button>
              </div>
              {showHelpTreeEx8 && (
                <section className="panel nested-panel">
                  <h4>{t("Hilfe", "Help")}</h4>
                  <ul className="intro-list">
                    <li>
                      {t(
                        "Wichtig: q1 und q2 sind Mengenentscheidungen (Output), nicht Auszahlungen. Die Auszahlungen stehen nur in den Endknoten als (u1, u2).",
                        "Important: q1 and q2 are quantity choices (output), not payoffs. Payoffs only appear at terminal nodes as (u1, u2)."
                      )}
                    </li>
                    <li>
                      {t(
                        "Mehr produzieren ist nicht automatisch besser. Je nach Reaktion des Gegners kann eine kleinere Menge für den Leader profitabler sein.",
                        "Producing more is not automatically better. Depending on the opponent's response, a smaller quantity can be more profitable for the leader."
                      )}
                    </li>
                    <li>
                      {t(
                        "Schritt 1: Löse zuerst die beiden P2-Teilspiele. P2 nimmt jeweils die Aktion mit höherem eigenem Payoff.",
                        "Step 1: Solve the two P2 subgames first. In each subgame, P2 chooses the action with higher own payoff."
                      )}
                    </li>
                    <li>
                      {t(
                        "Schritt 2: Setze diese Antworten in den Startknoten ein und vergleiche die resultierenden P1-Auszahlungen.",
                        "Step 2: Plug those responses into the root node and compare resulting P1 payoffs."
                      )}
                    </li>
                    <li>
                      {t(
                        "Schritt 3: Ein SPE enthält die optimale Startaktion von P1 und optimale Reaktionen von P2 in allen Teilspielen.",
                        "Step 3: An SPE includes P1's optimal initial action and P2's optimal responses in all subgames."
                      )}
                    </li>
                  </ul>
                </section>
              )}
            </article>

            <article className="panel nested-panel">
              <h3>{t("Fragen", "Questions")}</h3>
              <div className="tree-ex3-question-block">
                <h4>{t("1) Rückwärtsinduktion: Wie reagiert Spieler 2?", "1) Backward induction: How does Player 2 respond?")}</h4>
                <div className="ex8-q1-list">
                  {treeEx8SafeGame.offers.map((offer) => (
                    <div key={offer.id} className="ex8-q1-row">
                      <div className="ex8-response-title-inline">
                        <span>{t("Nach", "After")}</span>
                        <code>{offer.p1Action}</code>
                      </div>
                      <div className="ex8-q1-options">
                        <label className="choice-item ex8-small-choice">
                          <input
                            type="radio"
                            name={`tree-ex8-p2-${offer.id}`}
                            checked={treeEx8P2Answers[offer.id] === "q2=1"}
                            onChange={() => setTreeEx8P2Answer(offer.id, "q2=1")}
                            value="q2=1"
                          />
                          <span><code>q2=1</code></span>
                        </label>
                        <label className="choice-item ex8-small-choice">
                          <input
                            type="radio"
                            name={`tree-ex8-p2-${offer.id}`}
                            checked={treeEx8P2Answers[offer.id] === "q2=3"}
                            onChange={() => setTreeEx8P2Answer(offer.id, "q2=3")}
                            value="q2=3"
                          />
                          <span><code>q2=3</code></span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="actions">
                  <button type="button" onClick={checkTreeEx8P2}>{t("Schritt prüfen", "Check step")}</button>
                </div>
                {treeEx8P2Feedback && (
                  <div className={`feedback-box feedback-card ${treeEx8P2FeedbackType}`}>
                    <strong>{treeEx8P2FeedbackType === "success" ? t("Richtig", "Correct") : treeEx8P2FeedbackType === "warning" ? t("Hinweis", "Hint") : t("Nicht korrekt", "Incorrect")}</strong>
                    <p>{treeEx8P2Feedback}</p>
                  </div>
                )}
              </div>

              <div className="tree-ex3-question-block">
                <h4>{t("2) Antizipation: Was wählt Spieler 1?", "2) Anticipation: What does Player 1 choose?")}</h4>
                <div className="choice-list ex8-q2-inline">
                  {TREE_EX8_Q1_ACTIONS.map((choice) => (
                    <label key={`tree-ex8-p1-${choice}`} className="choice-item">
                      <input
                        type="radio"
                        name="tree-ex8-p1"
                        checked={treeEx8P1Choice === choice}
                        onChange={(e) => {
                          setTreeEx8P1Choice(e.target.value);
                          setTreeEx8P1Feedback("");
                          setTreeEx8P1FeedbackType("neutral");
                          setTreeEx8P1Solved(false);
                        }}
                        value={choice}
                      />
                      <span><code>{choice}</code></span>
                    </label>
                  ))}
                </div>
                <div className="actions">
                  <button type="button" onClick={checkTreeEx8P1}>{t("Schritt prüfen", "Check step")}</button>
                </div>
                {treeEx8P1Feedback && (
                  <div className={`feedback-box feedback-card ${treeEx8P1FeedbackType}`}>
                    <strong>{treeEx8P1FeedbackType === "success" ? t("Richtig", "Correct") : treeEx8P1FeedbackType === "warning" ? t("Hinweis", "Hint") : t("Nicht korrekt", "Incorrect")}</strong>
                    <p>{treeEx8P1Feedback}</p>
                  </div>
                )}
              </div>

              <div className="tree-ex3-question-block">
                <h4>{t("3) SPE-Check", "3) SPE check")}</h4>
                <div className="choice-list">
                  {treeEx8SpeOptions.map((option) => (
                    <label key={option.id} className="choice-item">
                      <input
                        type="radio"
                        name="tree-ex8-spe"
                        checked={treeEx8SpeChoice === option.id}
                        onChange={(e) => {
                          setTreeEx8SpeChoice(e.target.value);
                          setTreeEx8SpeFeedback("");
                          setTreeEx8SpeFeedbackType("neutral");
                          setTreeEx8SpeSolved(false);
                        }}
                        value={option.id}
                      />
                      <span><code>{option.text}</code></span>
                    </label>
                  ))}
                </div>
                <div className="actions">
                  <button type="button" onClick={checkTreeEx8Spe}>{t("SPE prüfen", "Check SPE")}</button>
                </div>
                {treeEx8SpeFeedback && (
                  <div className={`feedback-box feedback-card ${treeEx8SpeFeedbackType}`}>
                    <strong>{treeEx8SpeFeedbackType === "success" ? t("Richtig", "Correct") : treeEx8SpeFeedbackType === "warning" ? t("Hinweis", "Hint") : t("Nicht korrekt", "Incorrect")}</strong>
                    <p>{treeEx8SpeFeedback}</p>
                  </div>
                )}
              </div>

              {treeEx8OverallFeedback && (
                <div className={`feedback-box feedback-card ${treeEx8OverallFeedbackType}`}>
                  <strong>{treeEx8OverallFeedbackType === "success" ? t("Abgeschlossen", "Completed") : t("Hinweis", "Hint")}</strong>
                  <p>{treeEx8OverallFeedback}</p>
                </div>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setTreePage("ex5")}>{t("Zurück", "Back")}</button>
            <button type="button" className="nav-pill-btn" onClick={() => setTreePage("toc")}>{t("Zur Übersicht", "Back to overview")}</button>
          </div>
        </section>
      );
    }

    return (
      <section className="panel">
        <h2>{t("Übung 1 – Einfaches sequenzielles Spiel", "Exercise 1 - Simple sequential game")}</h2>
        <LevelSwitch
          value={treeEx1ActiveLevel}
          onChange={setTreeEx1ActiveLevel}
          leftLabel={t("Denkprozess-Simulator (Easy)", "Reasoning process simulator (Easy)")}
          rightLabel={t("SPE-Check (Hard)", "SPE check (hard)")}
          ariaLabel={t("Levelauswahl Übung 1", "Exercise 1 level switch")}
        />
        <p className="hint">
          {treeEx1ActiveLevel === 0
            ? t(
                "Easy: Folge dem Denkprozess Schritt für Schritt per Rückwärtsinduktion.",
                "Easy: Follow the reasoning process step by step via backward induction."
              )
            : t(
                "Hard: Bestimme direkt alle teilspielperfekten Gleichgewichte (SPE).",
                "Hard: Identify all subgame-perfect equilibria (SPE) directly."
              )}
        </p>
        <div className="exercise-layout tree-ex-layout">
          <article className="panel nested-panel">
            <h3>{t("Spiel", "Game")}</h3>
            <p className="hint">
              {firstPlayer} {t("entscheidet zuerst zwischen", "moves first between")} <code>L</code> {t("und", "and")} <code>R</code>. {t("Nach", "After")} <code>L</code> {secondPlayer} {t("entscheidet zwischen", "chooses between")} <code>X</code> {t("und", "and")} <code>Y</code>.
            </p>
            <div className="tree-example-wrap tree-example-wrap-compact">
              <svg viewBox="0 0 450 245" className="tree-example-svg tree-example-svg-compact" role="img" aria-label="Einfacher Spielbaum">
                <defs>
                  <marker id="tree-arrow-ex1" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <path d="M0,0 L8,3 L0,6 Z" className="tree-arrow" />
                  </marker>
                </defs>

                <line x1="66" y1="114" x2="161" y2="86" className={lEdgeClass} markerEnd="url(#tree-arrow-ex1)" />
                <line x1="66" y1="130" x2="178" y2="192" className={rEdgeClass} markerEnd="url(#tree-arrow-ex1)" />
                <line x1="200" y1="77" x2="314" y2="62" className={xEdgeClass} markerEnd="url(#tree-arrow-ex1)" />
                <line x1="198" y1="88" x2="315" y2="140" className={yEdgeClass} markerEnd="url(#tree-arrow-ex1)" />

                <text x="114" y="100" className="tree-action" textAnchor="middle" dominantBaseline="middle">L</text>
                <text x="122" y="161" className="tree-action" textAnchor="middle" dominantBaseline="middle">R</text>
                <text x="257" y="70" className="tree-action" textAnchor="middle" dominantBaseline="middle">X</text>
                <text x="257" y="114" className="tree-action" textAnchor="middle" dominantBaseline="middle">Y</text>

                <circle cx="48" cy="120" r="20" className={rootNodeClass} />
                <circle cx="180" cy="80" r="20" className={secondNodeClass} />
                <circle cx="188" cy="198" r="12" className={terminalRClass} />
                <circle cx="326" cy="60" r="12" className={terminalLXClass} />
                <circle cx="326" cy="145" r="12" className={terminalLYClass} />

                <text x="48" y="120" className="tree-label" textAnchor="middle" dominantBaseline="middle">{firstNodeLabel}</text>
                <text x="180" y="80" className="tree-label" textAnchor="middle" dominantBaseline="middle">{secondNodeLabel}</text>

                <rect x="204" y="183" width="96" height="30" rx="8" className="tree-payoff-bg" />
                <rect x="340" y="45" width="96" height="30" rx="8" className="tree-payoff-bg" />
                <rect x="340" y="130" width="96" height="30" rx="8" className="tree-payoff-bg" />

                <text x="252" y="198" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                  ({treeEx1Game.payoffR.u1}, {treeEx1Game.payoffR.u2})
                </text>
                <text x="388" y="60" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                  ({treeEx1Game.payoffLX.u1}, {treeEx1Game.payoffLX.u2})
                </text>
                <text x="388" y="145" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                  ({treeEx1Game.payoffLY.u1}, {treeEx1Game.payoffLY.u2})
                </text>
              </svg>
            </div>
            <div className="actions">
              <button type="button" onClick={resetTreeEx1}>{t("Neues Spiel", "New game")}</button>
            </div>
          </article>

          <article className="panel nested-panel">
            <h3 className={treeEx1ActiveLevel === 0 ? "tree-easy-heading" : undefined}>
              {treeEx1ActiveLevel === 0 ? t("Denkprozess-Simulator (Easy)", "Reasoning process simulator (Easy)") : t("SPE-Check (Hard)", "SPE check (hard)")}
            </h3>
            {treeEx1ActiveLevel === 0 ? (
              <>
                <p className="hint tree-easy-intro">
                  {t(
                    "Löse das Spiel über Rückwärtsinduktion in zwei Schritten.",
                    "Solve the game by backward induction in two steps."
                  )}
                </p>

                <h4 className="tree-phase-title">{t("Phase 1 - Letztes Teilspiel", "Phase 1 - Last subgame")}</h4>
                <p className="hint tree-phase-prompt">
                  {secondPlayer} {t("ist am Zug nach L. Was macht er?", "moves after L. What does this player do?")}
                </p>
                {treeEx1Step === 1 && (
                  <div className="actions">
                    <button type="button" onClick={() => answerTreeEx1Phase1("X")}>
                      X ({treeEx1Game.payoffLX.u1}, {treeEx1Game.payoffLX.u2})
                    </button>
                    <button type="button" onClick={() => answerTreeEx1Phase1("Y")}>
                      Y ({treeEx1Game.payoffLY.u1}, {treeEx1Game.payoffLY.u2})
                    </button>
                  </div>
                )}
                {treeEx1Phase1Feedback && (
                  <div className={`feedback-box feedback-card ${treeEx1Phase1FeedbackType}`}>
                    <strong>{treeEx1Phase1FeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Not correct")}</strong>
                    <p>{treeEx1Phase1Feedback}</p>
                  </div>
                )}
                {treeEx1Step >= 2 && (
                  <div className="tree-phase2-block">
                    <h4 className="tree-phase2-title">{t("Phase 2 - Antizipation", "Phase 2 - Anticipation")}</h4>
                    <p className="hint tree-phase2-prompt">
                      {firstPlayer}{" "}
                      {t(
                        `weiß, dass nach L ${solvedP2Action || "?"} gespielt wird. Was wählt er?`,
                        `knows that after L, ${solvedP2Action || "?"} is played. What does this player choose?`
                      )}
                    </p>
                    {treeEx1Step === 2 && (
                      <div className="actions">
                        <button type="button" onClick={() => answerTreeEx1Phase2("L")}>
                          L ({payoffAfterL.u1}, {payoffAfterL.u2})
                        </button>
                        <button type="button" onClick={() => answerTreeEx1Phase2("R")}>
                          R ({treeEx1Game.payoffR.u1}, {treeEx1Game.payoffR.u2})
                        </button>
                      </div>
                    )}
                    {treeEx1Phase2Feedback && (
                      <div className={`feedback-box feedback-card ${treeEx1Phase2FeedbackType}`}>
                        <strong>{treeEx1Phase2FeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Not correct")}</strong>
                        <p>{treeEx1Phase2Feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {treeEx1Step >= 3 && (
                  <div className="notation-box tree-result-box">
                    <h4>{t("Ergebnis", "Result")}</h4>
                    <p className="hint">{t("Das ist das teilspielperfekte Gleichgewicht:", "This is the subgame-perfect equilibrium:")}</p>
                    <p>
                      <code>({solvedP1Action || "?"}, {solvedP2Action || "?"})</code>
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="hint">
                  {t(
                    "Trage exakt alle Strategieprofile ein, die ein teilspielperfektes Gleichgewicht sind.",
                    "Enter exactly all strategy profiles that are subgame-perfect equilibria."
                  )}
                </p>
                <div className="choice-list">
                  {treeEx1HardEntries.map((entry, index) => (
                    <div key={`tree-ex1-hard-entry-${index}`} className="strategy-entry-row">
                      <span>(</span>
                      <select value={entry.p1} onChange={(e) => updateTreeEx1HardEntry(index, "p1", e.target.value)}>
                        <option value=""></option>
                        {TREE_EX1_P1_ACTIONS.map((a) => <option key={`tree-ex1-p1-${a}`} value={a}>{a}</option>)}
                      </select>
                      <span>,</span>
                      <select value={entry.p2} onChange={(e) => updateTreeEx1HardEntry(index, "p2", e.target.value)}>
                        <option value=""></option>
                        {TREE_EX1_P2_ACTIONS.map((a) => <option key={`tree-ex1-p2-${a}`} value={a}>{a}</option>)}
                      </select>
                      <span>)</span>
                      {treeEx1HardEntries.length > 1 && (
                        <button
                          type="button"
                          className="strategy-row-remove"
                          onClick={() => removeTreeEx1HardEntry(index)}
                        >
                          −
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="actions">
                  <button type="button" onClick={addTreeEx1HardEntry}>
                    {t("Zeile hinzufügen", "Add row")}
                  </button>
                  <button type="button" onClick={checkTreeEx1Hard}>
                    {t("SPE prüfen", "Check SPE")}
                  </button>
                </div>
                {treeEx1HardFeedback && (
                  <div className={`feedback-box feedback-card ${treeEx1HardFeedbackType}`}>
                    <strong>{treeEx1HardFeedbackType === "success" ? t("Richtig", "Correct") : t("Hinweis", "Hint")}</strong>
                    <p>{treeEx1HardFeedback}</p>
                  </div>
                )}
              </>
            )}
          </article>
        </div>
        <div className="actions">
          {treeEx1ActiveLevel === 0 ? (
            <>
              <button type="button" className="nav-pill-btn" onClick={() => setTreePage("toc")}>{t("Zurück", "Back")}</button>
              <button
                type="button"
                className="nav-pill-btn"
                onClick={() => {
                  resetTreeEx2();
                  setTreePage("ex2");
                }}
              >
                {t("Weiter zu Übung 2", "Next to exercise 2")}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="nav-pill-btn" onClick={() => setTreePage("toc")}>{t("Zurück", "Back")}</button>
              <button
                type="button"
                className="nav-pill-btn"
                onClick={() => {
                  resetTreeEx2();
                  setTreePage("ex2");
                }}
              >
                {t("Weiter zu Übung 2", "Next to exercise 2")}
              </button>
            </>
          )}
        </div>
      </section>
    );
  }

  function renderNormalExercises() {
    const activeNormalPage = normalRenderPage;
    const exLinksTeil1 = [
      { key: "ex1", progressKey: "normal_ex1", label: t("Übung 1 – Beste Antworten", "Exercise 1 - Best responses") },
      { key: "ex2", progressKey: "normal_ex2", label: t("Übung 2 – Strikt dominante Strategien", "Exercise 2 - Strictly dominant strategies") },
      { key: "ex3", progressKey: "normal_ex3", label: t("Übung 3 – Dominante Strategien (schwach oder strikt)", "Exercise 3 - Dominant strategies (weak or strict)") },
      { key: "ex4", progressKey: "normal_ex4", label: t("Übung 4 – Nash-Gleichgewichte in reinen Strategien", "Exercise 4 - Nash equilibria in pure strategies") },
      { key: "ex5", progressKey: "normal_ex5", label: t("Übung 5 – Nash-Gleichgewichte in reinen Strategien (strikt)", "Exercise 5 - Nash equilibria in pure strategies (strict)") },
      { key: "ex6", progressKey: "normal_ex6", label: t("Übung 6 – Nash-Gleichgewicht in gemischten Strategien", "Exercise 6 - Nash equilibrium in mixed strategies") }
    ];
    const exLinksTeil2 = [
      { key: "ex7", progressKey: "normal_ex7", label: t("Übung 1 – Trembling-Hand-Perfektion", "Exercise 1 - Trembling-hand perfection") },
      { key: "ex8", progressKey: "normal_ex8", label: t("Übung 2 – Evolutionär stabile Strategien", "Exercise 2 - Evolutionarily stable strategies") }
    ];
    const exLinksTeil3 = [
      { key: "ex9", progressKey: "normal_ex9", label: t("Übung 1 – Gemischtes Nash-Gleichgewicht im Marktauswahlspiel", "Exercise 1 - Mixed Nash equilibrium in the market selection game") }
    ];

    if (activeNormalPage === "toc") {
      return (
        <section className="panel">
          <h2>{t("Trainiere Simultane Spiele (Normalform)", "Train simultaneous games (normal form)")}</h2>
          <h3>{t("Teil 1: Grundlagen statischer Normalformspiele", "Part 1: Foundations of static simultaneous games")}</h3>
          <div className="exercise-link-grid">
            {exLinksTeil1.map((link) => (
              <button
                key={link.key}
                type="button"
                className="exercise-link"
                onClick={() => setNormalPage(link.key)}
              >
                <span className="exercise-link-title">{link.label}</span>
                <span className="exercise-link-meta">{buildProgressMeta(link.progressKey)}</span>
              </button>
            ))}
          </div>
          <h3>{t("Teil 2: Gleichgewichte und Gleichgewichtsverfeinerungen in statischen Normalformspielen", "Part 2: Equilibria and equilibrium refinements in static simultaneous games")}</h3>
          <div className="exercise-link-grid">
            {exLinksTeil2.map((link) => (
              <button
                key={link.key}
                type="button"
                className="exercise-link"
                onClick={() => setNormalPage(link.key)}
              >
                <span className="exercise-link-title">{link.label}</span>
                <span className="exercise-link-meta">{buildProgressMeta(link.progressKey)}</span>
              </button>
            ))}
          </div>
          <h3>{t("Teil 3: Simultanes Marktauswahlspiel", "Part 3: Simultaneous market selection game")}</h3>
          <div className="exercise-link-grid">
            {exLinksTeil3.map((link) => (
              <button
                key={link.key}
                type="button"
                className="exercise-link"
                onClick={() => setNormalPage(link.key)}
              >
                <span className="exercise-link-title">{link.label}</span>
                <span className="exercise-link-meta">{buildProgressMeta(link.progressKey)}</span>
              </button>
            ))}
          </div>
        </section>
      );
    }

    if (activeNormalPage === "ex1") {
      return (
        <section className="panel">
          <h2>{t("Übung 1: Beste Antworten", "Exercise 1: Best responses")}</h2>
          <div className="exercise-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              {ex1Data && (
                <>
                  <NormalGameTable game={ex1Data.game} />
                  <div className="notation-box">
                    <h4>{t("Notation", "Notation")}</h4>
                    <ul className="intro-list">
                      <li><code>N = {"{1, 2}"}</code></li>
                      <li><code>S₁</code>: {t("Strategiemenge von Spieler 1", "Strategy set of Player 1")}</li>
                      <li><code>S₂</code>: {t("Strategiemenge von Spieler 2", "Strategy set of Player 2")}</li>
                      <li><code>u = (u₁, u₂)</code></li>
                    </ul>
                  </div>
                  <div className="actions">
                    <button type="button" onClick={loadEx1} disabled={legacyLoading}>{t("Neues Spiel", "New game")}</button>
                    <button type="button" onClick={() => setShowHelpEx1((v) => !v)}>{t("Hilfe", "Help")}</button>
                  </div>
                  {showHelpEx1 && (
                    <section className="panel nested-panel">
                      <h4>{t("Hilfe", "Help")}</h4>
                      <ul className="intro-list">
                        <li>Beste Antwort: Eine Strategie ist eine beste Antwort, wenn sie den höchsten eigenen Nutzen liefert, gegeben die Strategie des anderen Spielers.</li>
                        <li>Vorgehen Spieler 1: Fixiere die Spalte und vergleiche die u₁-Werte in dieser Spalte. Markiere alle Zeilen mit dem Maximum.</li>
                        <li>Vorgehen Spieler 2: Fixiere die Zeile und vergleiche die u₂-Werte in dieser Zeile. Markiere alle Spalten mit dem Maximum.</li>
                        <li>Falls es mehrere Maxima gibt, sind alle entsprechenden Strategien beste Antworten.</li>
                      </ul>
                    </section>
                  )}
                </>
              )}
            </article>
            <article className="panel nested-panel">
              <h3>{t("Frage", "Question")}</h3>
              {ex1Data && (
                <p className="hint">
                  {ex1Data.question.responder === 1
                    ? `Wenn Spieler 2 ${ex1Data.question.opp} spielt, welche Strategie(n) ist/sind die beste Antwort(en) für Spieler 1?`
                    : `Wenn Spieler 1 ${ex1Data.question.opp} spielt, welche Strategie(n) ist/sind die beste Antwort(en) für Spieler 2?`}
                </p>
              )}
              {ex1Data && (
                <>
                  <div className="choice-list two-col-choices">
                    {ex1Data.choices.map((choice) => (
                      <label key={choice.id} className="choice-item">
                        <input
                          type="radio"
                          name="ex1-choice"
                          value={choice.id}
                          checked={ex1Selected === choice.id}
                          onChange={(e) => setEx1Selected(e.target.value)}
                        />
                        <span>{choice.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="hint answer-suffix">{t("… ist / sind eine beste Antwort.", "… is/are a best response.")}</p>
                  <button type="button" onClick={checkEx1} disabled={!ex1Selected || legacyLoading}>
                    {t("Antwort prüfen", "Check answer")}
                  </button>
                  {ex1Feedback && (
                    <div className={`feedback-box feedback-card ${ex1FeedbackType}`}>
                      <strong>{ex1FeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Incorrect")}</strong>
                      <p>{ex1Feedback}</p>
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("toc")}>{t("Zurück", "Back")}</button>
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex2")}>{t("Weiter zu Übung 2", "Next to Exercise 2")}</button>
          </div>
        </section>
      );
    }

    if (activeNormalPage === "ex2") {
      return (
        <section className="panel">
          <h2>{t("Übung 2: Strikt dominante Strategien", "Exercise 2: Strictly dominant strategies")}</h2>
          <div className="exercise-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              {ex2Data && (
                <>
                  <NormalGameTable game={ex2Data.game} />
                  <div className="notation-box">
                    <h4>{t("Notation", "Notation")}</h4>
                    <ul className="intro-list">
                      <li><code>N = {"{1, 2}"}</code></li>
                      <li><code>S₁ = {"{A, B, C, D}"}</code></li>
                      <li><code>S₂ = {"{X, Y, Z}"}</code></li>
                      <li><code>u = (u₁, u₂)</code></li>
                    </ul>
                  </div>
                  <div className="actions">
                    <button type="button" onClick={loadEx2} disabled={legacyLoading}>{t("Neues Spiel", "New game")}</button>
                    <button type="button" onClick={() => setShowHelpEx2((v) => !v)}>{t("Hilfe", "Help")}</button>
                  </div>
                  {showHelpEx2 && (
                    <section className="panel nested-panel">
                      <h4>{t("Hilfe", "Help")}</h4>
                      <ul className="intro-list">
                        <li>Strikt dominant: Eine Strategie ist strikt dominant, wenn sie gegen jede gegnerische Strategie immer einen strikt höheren Nutzen liefert als jede andere eigene Strategie.</li>
                        <li>Vorgehen Spieler 1: Vergleiche die u₁-Werte zeilenweise je Spalte. Eine Zeile ist strikt dominant, wenn sie in jeder Spalte strikt am höchsten ist.</li>
                        <li>Vorgehen Spieler 2: Vergleiche die u₂-Werte spaltenweise je Zeile. Eine Spalte ist strikt dominant, wenn sie in jeder Zeile strikt am höchsten ist.</li>
                        <li>Falls keine strikt dominante Strategie existiert, ist die Antwort „Nein, keiner“.</li>
                      </ul>
                    </section>
                  )}
                </>
              )}
            </article>
            <article className="panel nested-panel">
              <h3>{t("Frage", "Question")}</h3>
              <p className="hint">{t("Hat einer der Spieler (oder haben beide) eine strikt dominante Strategie?", "Does either player (or both) have a strictly dominant strategy?")}</p>
              {ex2Data && (
                <>
                  <div className="choice-list two-col-choices">
                    {ex2Data.choices.map((choice) => (
                      <label key={choice.id} className="choice-item">
                        <input
                          type="radio"
                          name="ex2-choice"
                          value={choice.id}
                          checked={ex2Selected === choice.id}
                          onChange={(e) => setEx2Selected(e.target.value)}
                        />
                        <span>{choice.label}</span>
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={checkEx2} disabled={!ex2Selected || legacyLoading}>{t("Antwort prüfen", "Check answer")}</button>
                  {ex2Feedback && (
                    <div className={`feedback-box feedback-card ${ex2FeedbackType}`}>
                      <strong>{ex2FeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Incorrect")}</strong>
                      <p>{ex2Feedback}</p>
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex1")}>{t("Zurück", "Back")}</button>
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex3")}>{t("Weiter zu Übung 3", "Next to Exercise 3")}</button>
          </div>
        </section>
      );
    }

    if (activeNormalPage === "ex3") {
      return (
        <section className="panel">
          <h2>{t("Übung 3: Dominante Strategien (schwach oder strikt)", "Exercise 3: Dominant strategies (weak or strict)")}</h2>
          <div className="exercise-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              {ex3Data && (
                <>
                  <NormalGameTable game={ex3Data.game} />
                  <div className="notation-box">
                    <h4>Notation</h4>
                    <ul className="intro-list">
                      <li><code>N = {"{1, 2}"}</code></li>
                      <li><code>S₁ = {"{A, B, C, D}"}</code></li>
                      <li><code>S₂ = {"{X, Y, Z}"}</code></li>
                      <li><code>u = (u₁, u₂)</code></li>
                    </ul>
                  </div>
                  <div className="actions">
                    <button type="button" onClick={loadEx3} disabled={legacyLoading}>Neues Spiel</button>
                    <button type="button" onClick={() => setShowHelpEx3((v) => !v)}>Hilfe</button>
                  </div>
                  {showHelpEx3 && (
                    <section className="panel nested-panel">
                      <h4>Hilfe</h4>
                      <ul className="intro-list">
                        <li>Strikt dominant: Eine Strategie ist gegen jede gegnerische Strategie immer strikt besser als jede Alternative.</li>
                        <li>Schwach dominant: Eine Strategie ist gegen jede gegnerische Strategie mindestens so gut wie jede Alternative und in mindestens einem Fall strikt besser.</li>
                        <li>Vorgehen: Für Spieler 1 vergleiche u₁ zeilenweise je Spalte; für Spieler 2 vergleiche u₂ spaltenweise je Zeile.</li>
                        <li>Pro Spieler kann es höchstens eine dominante Strategie geben.</li>
                      </ul>
                    </section>
                  )}
                </>
              )}
            </article>
            <article className="panel nested-panel">
              <h3>{t("Frage", "Question")}</h3>
              <p className="hint">{t("Hat einer der Spieler (oder haben beide) eine (strikt oder schwach) dominante Strategie?", "Does either player (or both) have a (strict or weak) dominant strategy?")}</p>
              {ex3Data && (
                <>
                  <div className="choice-list two-col-choices">
                    {ex3Data.choices.map((choice) => (
                      <label key={choice.id} className="choice-item">
                        <input
                          type="radio"
                          name="ex3-choice"
                          value={choice.id}
                          checked={ex3Selected === choice.id}
                          onChange={(e) => setEx3Selected(e.target.value)}
                        />
                        <span>{choice.label}</span>
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={checkEx3} disabled={!ex3Selected || legacyLoading}>{t("Antwort prüfen", "Check answer")}</button>
                  {ex3Feedback && (
                    <div className={`feedback-box feedback-card ${ex3FeedbackType}`}>
                      <strong>{ex3FeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Incorrect")}</strong>
                      <p>{ex3Feedback}</p>
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex2")}>{t("Zurück", "Back")}</button>
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex4")}>{t("Weiter zu Übung 4", "Next to Exercise 4")}</button>
          </div>
        </section>
      );
    }

    if (activeNormalPage === "ex4") {
      return (
        <section className="panel">
          <h2>{t("Übung 4: Nash-Gleichgewichte in reinen Strategien", "Exercise 4: Nash equilibria in pure strategies")}</h2>
          <div className="exercise-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              {ex4Data && (
                <>
                  <NormalGameTable game={ex4Data.game} />
                  <div className="notation-box">
                    <h4>Notation</h4>
                    <ul className="intro-list">
                      <li><code>N = {"{1, 2}"}</code></li>
                      <li><code>S₁ = {"{A, B, C, D}"}</code></li>
                      <li><code>S₂ = {"{X, Y, Z}"}</code></li>
                      <li><code>u = (u₁, u₂)</code></li>
                    </ul>
                  </div>
                  <div className="actions">
                    <button type="button" onClick={loadEx4} disabled={legacyLoading}>Neues Spiel</button>
                    <button type="button" onClick={() => setShowHelpEx4((v) => !v)}>Hilfe</button>
                  </div>
                  {showHelpEx4 && (
                    <section className="panel nested-panel">
                      <h4>Hilfe</h4>
                      <ul className="intro-list">
                        <li>Ein Nash-Gleichgewicht in reinen Strategien ist eine Strategiekombination, bei der sich kein Spieler durch einseitiges Abweichen strikt verbessern kann.</li>
                        <li>Prüfe beste Antworten von Spieler 1 je Spalte und von Spieler 2 je Zeile.</li>
                        <li>Eine Kombination (r,c) ist Nash-GG genau dann, wenn beide gleichzeitig beste Antworten spielen.</li>
                      </ul>
                    </section>
                  )}
                </>
              )}
            </article>
            <article className="panel nested-panel">
              <h3>{t("Frage", "Question")}</h3>
              <p className="hint">{t("Finde alle Strategiekombinationen, die ein Nash-Gleichgewicht in reinen Strategien bilden.", "Find all strategy combinations that form a Nash equilibrium in pure strategies.")}</p>
              {ex4Data && (
                <>
                  <div className="choice-list combo-grid">
                    {ex4Data.choices.map((choice) => (
                      <label key={choice.id} className="choice-item checkbox-item">
                        <input
                          type="checkbox"
                          value={choice.id}
                          checked={ex4Selected.includes(choice.id)}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (e.target.checked) {
                              setEx4Selected((prev) => [...prev, value]);
                            } else {
                              setEx4Selected((prev) => prev.filter((x) => x !== value));
                            }
                          }}
                        />
                        <span>{choice.label}</span>
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={checkEx4} disabled={legacyLoading}>{t("Antwort prüfen", "Check answer")}</button>
                  {ex4Feedback && (
                    <div className={`feedback-box feedback-card ${ex4FeedbackType}`}>
                      <strong>{ex4FeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Incorrect")}</strong>
                      <p>{ex4Feedback}</p>
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex3")}>{t("Zurück", "Back")}</button>
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex5")}>{t("Weiter zu Übung 5", "Next to Exercise 5")}</button>
          </div>
        </section>
      );
    }

    if (activeNormalPage === "ex5") {
      return (
        <section className="panel">
          <h2>{t("Übung 5: Nash-Gleichgewichte in reinen Strategien (strikt)", "Exercise 5: Nash equilibria in pure strategies (strict)")}</h2>
          <div className="exercise-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              {ex5Data && (
                <>
                  <NormalGameTable game={ex5Data.game} />
                  <div className="notation-box">
                    <h4>Notation</h4>
                    <ul className="intro-list">
                      <li><code>N = {"{1, 2}"}</code></li>
                      <li><code>S₁ = {"{A, B, C, D}"}</code></li>
                      <li><code>S₂ = {"{X, Y, Z}"}</code></li>
                      <li><code>u = (u₁, u₂)</code></li>
                    </ul>
                  </div>
                  <div className="actions">
                    <button type="button" onClick={loadEx5} disabled={legacyLoading}>Neues Spiel</button>
                    <button type="button" onClick={() => setShowHelpEx5((v) => !v)}>Hilfe</button>
                  </div>
                  {showHelpEx5 && (
                    <section className="panel nested-panel">
                      <h4>Hilfe</h4>
                      <ul className="intro-list">
                        <li>Nash-GG (nicht strikt): Kein Spieler kann sich durch einseitiges Abweichen strikt verbessern.</li>
                        <li>Striktes Nash-GG: Beide Spieler spielen jeweils eine eindeutig beste Antwort.</li>
                        <li>Wähle pro Zelle: nein / ja, nicht strikt / ja, strikt.</li>
                      </ul>
                    </section>
                  )}
                </>
              )}
            </article>
            <article className="panel nested-panel">
              <h3>{t("Frage", "Question")}</h3>
              <p className="hint">{t("Wähle für jede Strategiekombination, ob es sich dabei um ein striktes oder nicht striktes Nash GG handelt.", "For each strategy combination, choose whether it is a strict or non-strict Nash equilibrium.")}</p>
              {ex5Data && (
                <>
                  <Ex5AnswerTable
                    game={ex5Data.game}
                    answers={ex5Answers}
                    choices={ex5Data.cell_choices}
                    onAnswerChange={(key, value) => setEx5Answers((prev) => ({ ...prev, [key]: value }))}
                  />
                  <button type="button" onClick={checkEx5} disabled={legacyLoading}>{t("Antwort prüfen", "Check answer")}</button>
                  {ex5Feedback && (
                    <div className={`feedback-box feedback-card ${ex5FeedbackType}`}>
                      <strong>
                        {ex5FeedbackType === "success" ? t("Richtig", "Correct") : ex5FeedbackType === "warning" ? t("Hinweis", "Hint") : t("Nicht korrekt", "Incorrect")}
                      </strong>
                      <p>{ex5Feedback}</p>
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex4")}>{t("Zurück", "Back")}</button>
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex6")}>{t("Weiter zu Übung 6", "Next to Exercise 6")}</button>
          </div>
        </section>
      );
    }

    if (activeNormalPage === "ex6") {
      return (
        <section className="panel">
          <h2>{t("Übung 6: Nash-Gleichgewicht in gemischten Strategien", "Exercise 6: Nash equilibrium in mixed strategies")}</h2>
          <div className="exercise-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              {ex6Data && (
                <>
                  <NormalGameTable game={ex6Data.game} />
                  <div className="notation-box">
                    <h4>Notation</h4>
                    <ul className="intro-list">
                      <li><code>N = {"{1, 2}"}</code></li>
                      <li><code>S₁ = {"{A, B}"}</code></li>
                      <li><code>S₂ = {"{X, Y}"}</code></li>
                      <li><code>u = (u₁, u₂)</code></li>
                    </ul>
                  </div>
                  <div className="actions">
                    <button type="button" onClick={loadEx6} disabled={legacyLoading}>Neues Spiel</button>
                    <button type="button" onClick={() => setShowHelpEx6((v) => !v)}>Hilfe</button>
                  </div>
                  {showHelpEx6 && (
                    <section className="panel nested-panel">
                      <h4>Hilfe</h4>
                      <ul className="intro-list">
                        <li>Im gemischten Nash-Gleichgewicht wählt Spieler 1 A mit Wahrscheinlichkeit p, sodass Spieler 2 zwischen X und Y indifferent ist.</li>
                        <li>Indifferenzbedingung: p·u₂(A,X) + (1−p)·u₂(B,X) = p·u₂(A,Y) + (1−p)·u₂(B,Y).</li>
                        <li>Löse nach p und wähle die passende Bruch-Antwort.</li>
                      </ul>
                    </section>
                  )}
                </>
              )}
            </article>
            <article className="panel nested-panel">
              <h3>{t("Frage", "Question")}</h3>
              <p className="hint">
                {t("Finde ein Nash-Gleichgewicht in gemischten Strategien, in dem Spieler 1 mit Wahrscheinlichkeit p Strategie A wählt. Wie groß ist p?", "Find a Nash equilibrium in mixed strategies where Player 1 plays strategy A with probability p. What is p?")}
              </p>
              {ex6Data && (
                <>
                  <div className="choice-list two-col-choices">
                    {ex6Data.choices.map((choice) => (
                      <label key={choice.id} className="choice-item">
                        <input
                          type="radio"
                          name="ex6-choice"
                          value={choice.id}
                          checked={ex6Selected === choice.id}
                          onChange={(e) => setEx6Selected(e.target.value)}
                        />
                        <span>{choice.label}</span>
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={checkEx6} disabled={!ex6Selected || legacyLoading}>{t("Antwort prüfen", "Check answer")}</button>
                  {ex6Feedback && (
                    <div className={`feedback-box feedback-card ${ex6FeedbackType}`}>
                      <strong>{ex6FeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Incorrect")}</strong>
                      <p>{ex6Feedback}</p>
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex5")}>{t("Zurück", "Back")}</button>
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex7")}>{t("Weiter zu Teil 2 · Übung 1", "Next to Part 2 · Exercise 1")}</button>
          </div>
        </section>
      );
    }

    if (activeNormalPage === "ex7") {
      return (
        <section className="panel">
          <h2>{t("Übung 1: Trembling-Hand-perfekte Gleichgewichte (reine Strategien)", "Exercise 1: Trembling-hand perfect equilibria (pure strategies)")}</h2>
          <div className="exercise-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              {ex7Data && (
                <>
                  <NormalGameTable game={ex7Data.game} />
                  <div className="notation-box">
                    <h4>Notation</h4>
                    <ul className="intro-list">
                      <li><code>N = {"{1, 2}"}</code></li>
                      <li><code>S₁ = {"{A, B, C}"}</code></li>
                      <li><code>S₂ = {"{X, Y, Z}"}</code></li>
                      <li><code>u = (u₁, u₂)</code></li>
                    </ul>
                  </div>
                  <div className="actions">
                    <button type="button" onClick={loadEx7} disabled={legacyLoading}>Neues Spiel</button>
                    <button type="button" onClick={() => setShowHelpEx7((v) => !v)}>Hilfe</button>
                  </div>
                  {showHelpEx7 && (
                    <section className="panel nested-panel">
                      <h4>Hilfe</h4>
                      <ul className="intro-list">
                        <li>Ziel: Finde alle reinen Nash-Gleichgewichte, in denen beide gewählten Strategien nicht schwach dominiert sind.</li>
                        <li>Schritt 1 (Nash): Bestimme alle reinen Nash-Gleichgewichte als wechselseitige beste Antworten.</li>
                        <li>Schritt 2 (Dominanz): Markiere schwach dominierte Strategien (strikte Dominanz ist darin enthalten).</li>
                        <li>Schritt 3 (THP): Behalte nur Nash-Gleichgewichte, bei denen weder die Zeile noch die Spalte schwach dominiert ist.</li>
                        <li>Hinweis: Mehrere Antworten können korrekt sein; falls keine übrig bleibt, wähle „Keines“.</li>
                      </ul>
                    </section>
                  )}
                </>
              )}
            </article>
            <article className="panel nested-panel">
              <h3>{t("Frage", "Question")}</h3>
              <p className="hint">{t("Bestimme die Trembling-hand-perfekten Gleichgewichte in reinen Strategien.", "Determine the trembling-hand perfect equilibria in pure strategies.")}</p>
              <p className="hint">{t("Nicht-exklusive Antworten (mehrere können richtig sein).", "Non-exclusive answers (multiple can be correct).")}</p>
              {ex7Data && (
                <>
                  <div className="choice-list combo-grid">
                    {ex7Data.choices.map((choice) => (
                      <label key={choice.id} className="choice-item checkbox-item">
                        <input
                          type="checkbox"
                          value={choice.id}
                          checked={ex7Selected.includes(choice.id)}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (e.target.checked) {
                              setEx7Selected((prev) => [...prev, value]);
                            } else {
                              setEx7Selected((prev) => prev.filter((x) => x !== value));
                            }
                          }}
                        />
                        <span>{choice.label}</span>
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={checkEx7} disabled={legacyLoading}>{t("Antwort prüfen", "Check answer")}</button>
                  {ex7Feedback && (
                    <div className={`feedback-box feedback-card ${ex7FeedbackType}`}>
                      <strong>{ex7FeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Incorrect")}</strong>
                      <p>{ex7Feedback}</p>
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex6")}>{t("Zurück", "Back")}</button>
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex8")}>{t("Weiter zu Übung 2", "Next to Exercise 2")}</button>
          </div>
        </section>
      );
    }

    if (activeNormalPage === "ex8") {
      return (
        <section className="panel">
          <h2>{t("Übung 2: Evolutionär stabile Strategien", "Exercise 2: Evolutionarily stable strategies")}</h2>
          <div className="exercise-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              {ex8Data && (
                <>
                  <NormalGameTable game={ex8Data.game} />
                  <div className="notation-box">
                    <h4>Notation</h4>
                    <ul className="intro-list">
                      <li><code>N = {"{1, 2}"}</code></li>
                      <li><code>S₁ = {"{A, B, C}"}</code></li>
                      <li><code>S₂ = {"{A, B, C}"}</code></li>
                      <li><code>u = (u₁, u₂)</code></li>
                    </ul>
                  </div>
                  <div className="actions">
                    <button type="button" onClick={loadEx8} disabled={legacyLoading}>Neues Spiel</button>
                    <button type="button" onClick={() => setShowHelpEx8((v) => !v)}>Hilfe</button>
                  </div>
                  {showHelpEx8 && (
                    <section className="panel nested-panel">
                      <h4>Hilfe</h4>
                      <ul className="intro-list">
                        <li>Symmetrie: Das Spiel ist symmetrisch: u₂(r,c) = u₁(c,r).</li>
                        <li>Kandidaten: Als ESS kommen nur symmetrische Profile (s,s) in Frage.</li>
                        <li>Bedingung (1): u(s,s) ≥ u(s',s) für alle s' ≠ s (s ist beste Antwort auf sich selbst).</li>
                        <li>Bedingung (2): Für alle s' mit u(s,s)=u(s',s) gilt: u(s',s') &lt; u(s,s').</li>
                        <li>Praktisch: Bestimme zuerst die symmetrischen Nash-GG (s,s), prüfe dann (1) und ggf. (2).</li>
                      </ul>
                    </section>
                  )}
                </>
              )}
            </article>
            <article className="panel nested-panel">
              <h3>{t("Frage", "Question")}</h3>
              <p className="hint">{t("Bestimme die Gleichgewichte in evolutionär stabilen Strategien (ESS), in reinen Strategien.", "Determine equilibria in evolutionarily stable strategies (ESS), in pure strategies.")}</p>
              <p className="hint">{t("Nicht-exklusive Antworten (mehrere können richtig sein).", "Non-exclusive answers (multiple can be correct).")}</p>
              {ex8Data && (
                <>
                  <div className="choice-list combo-grid">
                    {ex8Data.choices.map((choice) => (
                      <label key={choice.id} className="choice-item checkbox-item">
                        <input
                          type="checkbox"
                          value={choice.id}
                          checked={ex8Selected.includes(choice.id)}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (e.target.checked) {
                              setEx8Selected((prev) => [...prev, value]);
                            } else {
                              setEx8Selected((prev) => prev.filter((x) => x !== value));
                            }
                          }}
                        />
                        <span>{choice.label}</span>
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={checkEx8} disabled={legacyLoading}>{t("Antwort prüfen", "Check answer")}</button>
                  {ex8Feedback && (
                    <div className={`feedback-box feedback-card ${ex8FeedbackType}`}>
                      <strong>{ex8FeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Incorrect")}</strong>
                      <p>{ex8Feedback}</p>
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex7")}>{t("Zurück", "Back")}</button>
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex9")}>{t("Weiter zu Teil 3 · Übung 1", "Next to Part 3 · Exercise 1")}</button>
          </div>
        </section>
      );
    }

    if (activeNormalPage === "ex9") {
      return (
        <section className="panel">
          <h2>{t("Übung 1 – Gemischtes Nash-Gleichgewicht im Marktauswahlspiel", "Exercise 1 - Mixed Nash equilibrium in the market selection game")}</h2>
          <div className="exercise-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              <p className="hint">{t("Zwei Firmen entscheiden gleichzeitig, auf welchen lokal getrennten Märkten sie ihre Waren anbieten.", "Two firms simultaneously decide in which local markets they offer their products.")}</p>
              <p className="hint">{t("Es gibt drei Märkte: X, Y und Z. Firma 1 bietet Tablets und Tablet-Hüllen an, Firma 2 bietet Tablet-Hüllen und Smartphone-Hüllen.", "There are three markets: X, Y and Z. Firm 1 sells tablets and tablet covers, Firm 2 sells tablet covers and smartphone covers.")}</p>
              <p className="hint">{t("Strategien: Firma 1 wählt zwei Märkte (XY, XZ, YZ), Firma 2 wählt einen Markt (X, Y, Z). Firma 1 bevorzugt keine Überschneidung, Firma 2 bevorzugt Überschneidung um auch Tablet-Hüllen zu verkaufen.", "Strategies: Firm 1 chooses two markets (XY, XZ, YZ), Firm 2 chooses one market (X, Y, Z). Firm 1 prefers no overlap, Firm 2 prefers overlap to also sell tablet covers.")}</p>
              <p className="hint">{t("Nutzen bei Überschneidungen der Märkte", "Payoffs with market overlap")}</p>
              <ul className="intro-list">
                <li>{t("Firma 1 hat einen Nutzen von 6", "Firm 1 has payoff 6")}</li>
                <li>{t("Firma 2 hat einen Nutzen von 5", "Firm 2 has payoff 5")}</li>
              </ul>
              <p className="hint">{t("Nutzen bei getrennten Märkten", "Payoffs with separate markets")}</p>
              <ul className="intro-list">
                <li>{t("Firma 1 hat einen Nutzen von 9", "Firm 1 has payoff 9")}</li>
                <li>{t("Der Nutzen von Firma 2 hängt davon ab, in welchem Markt Firma 2 alleine aktiv ist. Ist Firma 2 alleine in Markt X oder Y, hat sie einen Nutzen von 2, ist Firma 2 alleine in Markt Z hat sie Nutzen a mit a ∈ {1,3,4}", "Firm 2's payoff depends on which market it serves alone. If alone in X or Y it gets 2; if alone in Z it gets a with a ∈ {1,3,4}.")}</li>
              </ul>
              {ex9Data && (
                <>
                  <NormalGameTable game={ex9Data.game} rowLabel={t("Firma 1", "Firm 1")} colLabel={t("Firma 2", "Firm 2")} />
                  <div className="notation-box">
                    <h4>{t("Notation", "Notation")}</h4>
                    <ul className="intro-list">
                      <li><code>S₁ = {"{XY, XZ, YZ}"}</code></li>
                      <li><code>S₂ = {"{X, Y, Z}"}</code></li>
                      <li><code>a = {ex9Data.a}</code></li>
                      <li>{t("Vollständig gemischtes GG gesucht:", "Find fully mixed equilibrium:")} <code>((pXY, pXZ, pYZ), (qX, qY, qZ))</code></li>
                    </ul>
                  </div>
                  <div className="actions">
                    <button type="button" onClick={loadEx9} disabled={legacyLoading}>{t("Neues Spiel", "New game")}</button>
                    <button type="button" onClick={() => setShowHelpEx9((v) => !v)}>{t("Hilfe", "Help")}</button>
                  </div>
                  {showHelpEx9 && (
                    <section className="panel nested-panel">
                      <h4>{t("Hilfe", "Help")}</h4>
                      <ul className="intro-list">
                        <li>Das vollständig gemischte Gleichgewicht hängt nur vom Parameter a ab.</li>
                        <li>Für ein vollständig gemischtes Gleichgewicht muss Firma 1 zwischen XY, XZ und YZ indifferent sein.</li>
                        <li>Mit den gegebenen Payoffs gilt das nur, wenn Firma 2 alle drei Märkte gleich wahrscheinlich wählt.</li>
                        <li>Prüfe daher die Optionen mit Firma 2 = (1/3, 1/3, 1/3).</li>
                      </ul>
                    </section>
                  )}
                </>
              )}
            </article>
            <article className="panel nested-panel">
              <h3>{t("Frage", "Question")}</h3>
              {ex9Data && (
                <p className="hint">{t("Parameterwert: a = ", "Parameter value: a = ")}{ex9Data.a}. {t("Welche der folgenden Strategiekombinationen ist das vollständig gemischte Nash-Gleichgewicht?", "Which of the following strategy combinations is the fully mixed Nash equilibrium?")}</p>
              )}
              {ex9Data && (
                <>
                  <div className="choice-list">
                    {ex9Data.choices.map((choice) => (
                      <label key={choice.id} className="choice-item">
                        <input
                          type="radio"
                          name="ex9-choice"
                          value={choice.id}
                          checked={ex9Selected === choice.id}
                          onChange={(e) => setEx9Selected(e.target.value)}
                        />
                        <span>{choice.label}</span>
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={checkEx9} disabled={!ex9Selected || legacyLoading}>{t("Antwort prüfen", "Check answer")}</button>
                  {ex9Feedback && (
                    <div className={`feedback-box feedback-card ${ex9FeedbackType}`}>
                      <strong>{ex9FeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Incorrect")}</strong>
                      <p>{ex9Feedback}</p>
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setNormalPage("ex8")}>{t("Zurück", "Back")}</button>
          </div>
        </section>
      );
    }

    return (
      <section className="panel" />
    );
  }

  function renderStrategyEliminatorCard() {
    const comparisonRows = eliminatorQuestion
      ? eliminatorQuestion.check.player === 1
        ? eliminatorActiveCols.map((col) => {
            const [dominantU] = payoffFromMap(eliminatorGame, eliminatorQuestion.check.dominant, col);
            const [dominatedU] = payoffFromMap(eliminatorGame, eliminatorQuestion.check.dominated, col);
            return { label: col, dominatedU, dominantU, isStrict: dominantU > dominatedU };
          })
        : eliminatorActiveRows.map((row) => {
            const [, dominantU] = payoffFromMap(eliminatorGame, row, eliminatorQuestion.check.dominant);
            const [, dominatedU] = payoffFromMap(eliminatorGame, row, eliminatorQuestion.check.dominated);
            return { label: row, dominatedU, dominantU, isStrict: dominantU > dominatedU };
          })
      : [];

    return (
      <section className="panel">
        <h2>{t("Eliminator dominierter Strategien", "Dominated Strategy Eliminator")}</h2>
        <p className="hint">
          {t(
            "Dieses Tool trainiert die schrittweise Eliminierung strikt dominierter Strategien.",
            "This tool trains step-by-step elimination of strictly dominated strategies."
          )}
        </p>
        <div className="exercise-layout">
          <article className="panel nested-panel">
            <h3>{t("Payoff-Matrix", "Payoff matrix")}</h3>
            <StaticPayoffTable
              data={eliminatorMatrix}
              rowLabel={t("Spieler 1", "Player 1")}
              colLabel={t("Spieler 2", "Player 2")}
            />
            <div className="actions">
              <button type="button" onClick={resetEliminator}>
                {t("Neues Beispiel laden", "Load new example")}
              </button>
            </div>
            {!eliminatorQuestion && (
              <p className="hint">
                {t("Kandidatenstrategien", "Candidate strategies")}:{" "}
                <code>{`S₁ = {${eliminatorActiveRows.join(", ")}}`}</code>,{" "}
                <code>{`S₂ = {${eliminatorActiveCols.join(", ")}}`}</code>
              </p>
            )}
            {!eliminatorQuestion && eliminatorShowNash && (
              <div className={`feedback-box feedback-card ${eliminatorNash.length ? "success" : "warning"}`}>
                <strong>{t("Reine Nash-Gleichgewichte", "Pure Nash equilibria")}</strong>
                <p>
                  {eliminatorNash.length
                    ? eliminatorNash.join(", ")
                    : t("Kein reines Nash-Gleichgewicht in der reduzierten Matrix.", "No pure Nash equilibrium in the reduced matrix.")}
                </p>
              </div>
            )}
          </article>

          <article className="panel nested-panel">
            <h3>{t("Step by Step Solver", "Step by Step Solver")}</h3>
            <p className="hint">
              <strong>{t("Schritt", "Step")} {eliminatorDecisionCount}:</strong>{" "}
              {eliminatorQuestion
                ? eliminatorQuestion.check.player === 1
                  ? t(
                      `Spieler 1: Ist ${eliminatorQuestion.check.dominated} strikt dominiert von ${eliminatorQuestion.check.dominant}?`,
                      `Player 1: Is ${eliminatorQuestion.check.dominated} strictly dominated by ${eliminatorQuestion.check.dominant}?`
                    )
                  : t(
                      `Spieler 2: Ist ${eliminatorQuestion.check.dominated} strikt dominiert von ${eliminatorQuestion.check.dominant}?`,
                      `Player 2: Is ${eliminatorQuestion.check.dominated} strictly dominated by ${eliminatorQuestion.check.dominant}?`
                    )
                : t(
                    "Keine weiteren Dominanzen möglich.",
                    "No further dominance elimination is possible."
                  )}
            </p>

            {eliminatorQuestion ? (
              <>
                <div className="actions">
                  <button type="button" onClick={() => answerEliminator(true)}>
                    {t("Ja", "Yes")}
                  </button>
                  <button type="button" onClick={() => answerEliminator(false)}>
                    {t("Nein", "No")}
                  </button>
                  <button type="button" onClick={() => setEliminatorShowWhy((v) => !v)}>
                    {eliminatorShowWhy ? t("Warum ausblenden", "Hide why") : t("Warum anzeigen", "Show why")}
                  </button>
                </div>
                {eliminatorShowWhy && (
                  <div className="feedback-box feedback-card info">
                    <strong>{t("Dominanzvergleich", "Dominance comparison")}</strong>
                    <div className="eliminator-compare-list">
                        {comparisonRows.map((entry) => (
                          <div key={entry.label} className={`eliminator-compare-item ${entry.isStrict ? "strict" : "weak"}`}>
                            <span>
                            {eliminatorQuestion.check.player === 1
                              ? `${t("Spalte", "Column")} ${entry.label}`
                              : `${t("Zeile", "Row")} ${entry.label}`}
                            </span>
                            <span>{entry.dominantU} &gt; {entry.dominatedU}</span>
                        </div>
                      ))}
                    </div>
                    <p>
                      {t(
                        "Grün bedeutet: dominante Strategie hat strikt höheren Nutzen. Nur wenn alle Vergleiche grün sind, ist die Antwort Ja.",
                        "Green means the dominant strategy yields a strictly higher payoff. Only if all comparisons are green is the correct answer yes."
                      )}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="actions">
                <button type="button" onClick={() => setEliminatorShowNash(true)}>
                  {t("Jetzt Nash berechnen", "Compute Nash now")}
                </button>
              </div>
            )}

            {eliminatorFeedback && (
              <div className={`feedback-box feedback-card ${eliminatorFeedbackType}`}>
                <strong>{eliminatorFeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Incorrect")}</strong>
                <p>{eliminatorFeedback}</p>
              </div>
            )}
          </article>
        </div>
      </section>
    );
  }

  function renderBestResponseExplorerCard() {
    const shownP1 = new Set(brExplorerP1Selected);
    const shownP2 = new Set(brExplorerP2Selected);
    const nashText = brExplorerCorrect.nash.length
      ? brExplorerCorrect.nash.map(formatCellKey).join(", ")
      : t("Kein reines Nash-Gleichgewicht.", "No pure Nash equilibrium.");

    return (
      <section className="panel">
        <h2>{t("Best-Response-NE-Finder", "Best-response NE finder")}</h2>
        <p className="hint">
          {t(
            "Dieses Tool trainiert, reine Nash-Gleichgewichte direkt über beste Antworten zu finden, auch ohne dominante Strategien.",
            "This tool trains finding pure Nash equilibria directly via best responses, even without dominant strategies."
          )}
        </p>
        <div className="exercise-layout">
          <article className="panel nested-panel">
            <h3>{t("Payoff-Matrix", "Payoff matrix")}</h3>
            <StaticPayoffTable
              data={brExplorerGame}
              rowLabel={t("Spieler 1", "Player 1")}
              colLabel={t("Spieler 2", "Player 2")}
              onCellClick={(row, col) => toggleBrExplorerSelection(`${row}|${col}`)}
              getCellClassName={(row, col) => {
                const key = `${row}|${col}`;
                const isP1 = shownP1.has(key);
                const isP2 = shownP2.has(key);
                if (isP1 && isP2) return "pd-cell-nash";
                if (isP1) return "pd-cell-best";
                if (isP2) return "pd-cell-compare";
                return "";
              }}
            />
            <div className="actions">
              <button type="button" onClick={resetBestResponseExplorer}>
                {t("Neues Beispiel laden", "Load new example")}
              </button>
            </div>
          </article>

          <article className="panel nested-panel">
            <h3>{t("Step by Step Solver", "Step by Step Solver")}</h3>
            <p className="hint">
              {brExplorerStep === 1
                ? (
                  <>
                    <strong>{t("Schritt 1:", "Step 1:")}</strong>{" "}
                    {t(
                      "Klicke in der Matrix alle Zellen an, in denen Spieler 1 (u₁) je Spalte maximal ist. Prüfe danach deine Auswahl.",
                      "Click all matrix cells where Player 1 (u1) is maximal by column. Then check your selection."
                    )}
                  </>
                )
                : (
                  <>
                    <strong>{t("Schritt 2:", "Step 2:")}</strong>{" "}
                    {t(
                      "Klicke in der Matrix alle Zellen an, in denen Spieler 2 (u₂) je Zeile maximal ist. Prüfe danach deine Auswahl.",
                      "Click all matrix cells where Player 2 (u2) is maximal by row. Then check your selection."
                    )}
                  </>
                )}
            </p>
            <div className="actions">
              <button type="button" onClick={checkBestResponseExplorer}>
                {brExplorerStep === 1 ? t("Schritt 1 prüfen", "Check step 1") : t("Schritt 2 prüfen", "Check step 2")}
              </button>
            </div>
            {brExplorerFeedback && (
              <div className={`feedback-box feedback-card ${brExplorerFeedbackType}`}>
                <strong>{brExplorerFeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Incorrect")}</strong>
                <p>{brExplorerFeedback}</p>
              </div>
            )}
          </article>
        </div>
      </section>
    );
  }

  function renderBackwardInductionCard() {
    const stepOneDone = backwardStep >= 1;
    const stepTwoDone = backwardStep >= 2;

    return (
      <section className="panel">
        <h2>{t("Rückwärtsinduktions-Solver", "Backward Induction Solver")}</h2>
        <p className="hint">
          {t(
            "Ziel: Verstehen, warum nur glaubwürdige Drohungen das Gleichgewicht bestimmen.",
            "Goal: understand why only credible threats determine equilibrium."
          )}
        </p>

        <div className="tree-example-wrap tree-example-wrap-compact">
          <svg viewBox="0 0 560 250" className="tree-example-svg tree-example-svg-compact" role="img" aria-label={t("Rückwärtsinduktions-Spielbaum", "Backward induction game tree")}>
            <defs>
              <marker id="bi-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <path d="M0,0 L8,3 L0,6 Z" className="tree-arrow" />
              </marker>
            </defs>

            <line x1="66.2" y1="122.5" x2="209.0" y2="62.6" className={`tree-edge ${stepTwoDone ? "bi-active" : ""}`} markerEnd="url(#bi-arrow)" />
            <line x1="66.8" y1="137.2" x2="193.6" y2="184.8" className="tree-edge" markerEnd="url(#bi-arrow)" />
            <line x1="231.5" y1="184.0" x2="409.2" y2="164.8" className={`tree-edge ${stepOneDone ? "bi-active bi-fight" : ""}`} markerEnd="url(#bi-arrow)" />
            <line x1="231.5" y1="186.4" x2="409.2" y2="214.8" className={`tree-edge ${stepOneDone ? "bi-muted" : ""}`} markerEnd="url(#bi-arrow)" />

            <text x="132" y="84" className="tree-action" textAnchor="middle" dominantBaseline="middle">{t("Draußen bleiben", "Out")}</text>
            <text x="132" y="160" className="tree-action" textAnchor="middle" dominantBaseline="middle">{t("Eintreten", "In")}</text>
            <text x="320" y="168" className="tree-action" textAnchor="middle" dominantBaseline="middle">{t("Kämpfen", "Fight")}</text>
            <text x="320" y="210" className="tree-action" textAnchor="middle" dominantBaseline="middle">{t("Nachgeben", "Accommodate")}</text>

            <circle cx="48" cy="130" r="20" className={`tree-node decision ${stepTwoDone ? "bi-current" : ""}`} />
            <circle cx="212" cy="185" r="20" className={`tree-node decision ${stepOneDone ? "bi-current" : ""}`} />
            <circle cx="220" cy="58" r="12" className={`tree-node terminal ${stepTwoDone ? "bi-selected-terminal" : ""}`} />
            <circle cx="420" cy="164" r="12" className={`tree-node terminal ${stepOneDone ? "bi-selected-terminal" : ""}`} />
            <circle cx="420" cy="216" r="12" className={`tree-node terminal ${stepOneDone ? "bi-muted-node" : ""}`} />

            <text x="48" y="130" className="tree-label" textAnchor="middle" dominantBaseline="middle">P1</text>
            <text x="212" y="185" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>

            <rect x="236" y="43" width="88" height="30" rx="8" className="tree-payoff-bg" />
            <rect x="438" y="149" width="88" height="30" rx="8" className="tree-payoff-bg" />
            <rect x="438" y="201" width="88" height="30" rx="8" className="tree-payoff-bg" />

            <text x="280" y="58" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(2, 2)</text>
            <text x="482" y="164" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(0, 3)</text>
            <text x="482" y="216" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(1, 1)</text>
          </svg>
        </div>

        <div className="actions">
          <button type="button" className="nav-pill-btn" onClick={prevBackwardStep} disabled={backwardStep <= 0}>{t("Schritt zurück", "Previous step")}</button>
          <button type="button" className="nav-pill-btn" onClick={nextBackwardStep} disabled={backwardStep >= 2}>{t("Nächster Schritt", "Next step")}</button>
        </div>

        {backwardStep === 0 && (
          <p className="hint">
            {t("Schritt 1 startet am letzten Entscheidungsknoten von Spieler 2.", "Step 1 starts at the last decision node of Player 2.")}
          </p>
        )}
        {backwardStep === 1 && (
          <div className="feedback-box feedback-card info">
            <strong>{t("Schritt 1", "Step 1")}</strong>
            <p>{t("Spieler 2 wählt Kämpfen, da 3 > 1.", "Player 2 chooses Fight because 3 > 1.")}</p>
          </div>
        )}
        {backwardStep === 2 && (
          <div className="feedback-box feedback-card success">
            <strong>{t("Schritt 2", "Step 2")}</strong>
            <p>
              {t(
                "Spieler 1 antizipiert Kämpfen nach Eintreten und wählt daher Draußen bleiben. SPE-Pfad: Draußen bleiben. Nicht-glaubwürdige Drohung erkannt: (Eintreten, Nachgeben).",
                "Player 1 anticipates Fight after In and therefore chooses Out. SPE path: Out. Non-credible threat identified: (In, Accommodate)."
              )}
            </p>
          </div>
        )}
      </section>
    );
  }

  function renderSimultaneousIntro() {
    return (
      <>
        <section className="panel">
          <h2>
            {uiLang === "de" ? (
              <>
                Einführung in Spiele mit <u>simultanen Entscheidungen</u> (Normalformspiele)
              </>
            ) : (
              <>
                Introduction to games with <u>simultaneous decisions</u> (normal-form games)
              </>
            )}
          </h2>
          <p className="hint">
            {t(
              "Ein Normalformspiel beschreibt eine Situation, in der alle Spieler gleichzeitig eine Strategie wählen und daraus für jeden Spieler ein Nutzen  entsteht.",
              "A simultaneous game describes a situation in which all players choose a strategy at the same time and each player has a payoff from the outcome of the game."
            )}
          </p>

          <HorizontalArrowScroller
            className="intro-grid intro-grid-one-line intro-grid-3"
            leftAriaLabel={t("Nach links scrollen", "Scroll left")}
            rightAriaLabel={t("Nach rechts scrollen", "Scroll right")}
          >
            <article className="panel nested-panel">
              <h3 className="def-title"><span className="def-badge">1</span><span>{t("Spielermenge", "Player set")}</span></h3>
              <p>{t("Die Spielermenge ist N. In allen Beispielen gibt es genau zwei Spieler N = {1, 2}.", "The player set is N. In all examples there are exactly two players N = {1, 2}.")}</p>
            </article>
            <article className="panel nested-panel">
              <h3 className="def-title"><span className="def-badge">2</span><span>{t("Strategiemengen", "Strategy sets")}</span></h3>
              <p>
                {t(
                  "Jeder Spieler verfügt über eine endliche Menge an reinen Strategien, aus denen er eine auswählt oder über die er randomisiert (gemischte Strategie).",
                  "Each player has a finite set of pure strategies from which they select one or over which they randomize (mixed strategy)."
                )}
              </p>
            </article>
            <article className="panel nested-panel">
              <h3 className="def-title"><span className="def-badge">3</span><span>{t("Nutzenfunktionen", "Payoff functions")}</span></h3>
              <p>{t("Jeder Strategiekombination wird ein Nutzen zugeordnet. Bei zwei Spielern schreibt man (u₁, u₂).", "Each strategy combination is assigned a payoff for each player. With two players we write (u₁, u₂).")}</p>
            </article>
          </HorizontalArrowScroller>

          <HorizontalArrowScroller
            className="intro-grid intro-grid-one-line intro-grid-2"
            leftAriaLabel={t("Nach links scrollen", "Scroll left")}
            rightAriaLabel={t("Nach rechts scrollen", "Scroll right")}
          >
            <section className="panel nested-panel">
              <h3>{t("Beispiel-Spiel in Normalform", "Example game in Normal-form")}</h3>
              <p className="hint">{t("Spieler 1 wählt A oder B, Spieler 2 wählt X, Y oder Z. In jeder Zelle steht (u₁, u₂).", "Player 1 chooses A or B, Player 2 chooses X, Y or Z. Each cell shows (u₁, u₂).")}</p>
              <StaticPayoffTable data={INTRO_NORMAL} rowLabel={t("Spieler 1", "Player 1")} colLabel={t("Spieler 2", "Player 2")} />
            </section>

            <section className="panel nested-panel">
              <h3>{t("Notation von Normalformspielen", "Notation of Normal-form games")}</h3>
              <ul className="intro-list">
                <li><code>N = {"{1, 2}"}</code>: {t("Zwei Spieler (Spieler 1 und Spieler 2).", "Two players (Player 1 and Player 2).")}</li>
                <li><code>S₁ = {"{A, B}"}</code>: {t("Strategiemenge von Spieler 1.", "Strategy set of Player 1.")}</li>
                <li><code>S₂ = {"{X, Y, Z}"}</code>: {t("Strategiemenge von Spieler 2.", "Strategy set of Player 2.")}</li>
                <li><code>s = (s₁, s₂)</code>: {t("Strategiekombination z.B.", "Strategy combination e.g.")} <code>(A, Y)</code>.</li>
                <li><code>u = (u₁, u₂)</code>: {t("Nutzen (Spieler 1, Spieler 2).", "Payoff (Player 1, Player 2).")}</li>
              </ul>
            </section>
          </HorizontalArrowScroller>
        </section>

        {renderStrategyEliminatorCard()}
        {renderBestResponseExplorerCard()}
        <div className="actions">
          <button
            type="button"
            className="nav-pill-btn"
            onClick={() => {
              setActivePage("solve-normal");
              setNormalPage("toc");
            }}
          >
            {t("Trainiere Simultane Spiele (Normalform)", "Train simultaneous games (normal form)")}
          </button>
        </div>
      </>
    );
  }

  function renderBayesianIntro() {
    return (
      <>
      <section className="panel">
        <h2>
          {uiLang === "de" ? (
            <>
              Einführung in Spiele mit <u>privaten Informationen</u> bei simultanen Entscheidungen
            </>
          ) : (
            <>
              Introduction to games with <u>private information</u> in simultaneous decisions
            </>
          )}
        </h2>
        <p className="hint">
          {t(
            "Ein Bayes-Spiel beschreibt eine strategische Situation, in der Spieler gleichzeitig entscheiden, aber nicht vollständig über die Eigenschaften der anderen Spieler informiert sind. Jeder Spieler kennt vor seiner Entscheidung seinen eigenen Typ, während die Typen der anderen Spieler nur über eine gemeinsame Wahrscheinlichkeitsverteilung (common prior) beschrieben sind.",
            "A Bayesian game describes a strategic situation in which players decide simultaneously but are not fully informed about the characteristics of other players. Each player knows their own type before choosing, while other players' types are described by a common probability distribution (common prior)."
          )}
        </p>

        <HorizontalArrowScroller
          className="intro-grid intro-grid-one-line intro-grid-4"
          leftAriaLabel={t("Nach links scrollen", "Scroll left")}
          rightAriaLabel={t("Nach rechts scrollen", "Scroll right")}
        >
          <article className="panel nested-panel">
            <h3 className="def-title"><span className="def-badge">1</span><span>{t("Spielermenge", "Player set")}</span></h3>
            <p>{t("Die Spielermenge ist N. In allen Beispielen gibt es genau zwei Spieler: N = {1, 2}.", "The player set is N. In all examples there are exactly two players: N = {1, 2}.")}</p>
          </article>
          <article className="panel nested-panel">
            <h3 className="def-title"><span className="def-badge">2</span><span>{t("Typenmengen & Prior", "Type sets & prior")}</span></h3>
            <p>
              {t(
                "Jeder Spieler i hat eine endliche Typenmenge Tᵢ. Der eigene Typ ist bekannt, die Typen der anderen nur probabilistisch. Eine gemeinsame a-priori Verteilung (common prior) beschreibt, wie wahrscheinlich jede Typkombination ist.",
                "Each player i has a finite type set Tᵢ. One’s own type is known, others’ types are only probabilistic. A common prior distribution specifies how likely each type profile is."
              )}
            </p>
          </article>
          <article className="panel nested-panel">
            <h3 className="def-title"><span className="def-badge">3</span><span>{t("Strategiemengen", "Strategy sets")}</span></h3>
            <p>
              {t(
                "Eine Strategie ist ein vollständiger Handlungsplan: Für jeden möglichen eigenen Typ legt sie fest, welche Aktion gewählt wird. Formal ist eine reine Strategie eine Abbildung sᵢ: Tᵢ → Aᵢ. Spieler können auch typ-abhängig randomisieren (gemischte Strategie).",
                "A strategy is a complete contingency plan: for each possible own type it specifies which action to take. Formally, a pure strategy is a mapping sᵢ: Tᵢ → Aᵢ. Players may also randomise conditional on their type (mixed strategy)."
              )}
            </p>
          </article>
          <article className="panel nested-panel">
            <h3 className="def-title"><span className="def-badge">4</span><span>{t("Nutzenfunktionen", "Payoff functions")}</span></h3>
            <p>
              {t(
                "Der Nutzen hängt von Aktionen und Typen ab: uᵢ(a₁, a₂, t₁, t₂). Da Typen unsicher sind, bewerten Spieler Strategien über den erwarteten Nutzen, berechnet mit dem common prior.",
                "Payoffs depend on actions and types: uᵢ(a₁, a₂, t₁, t₂). Because types are uncertain, players evaluate strategies using expected utility computed under the common prior."
              )}
            </p>
          </article>
        </HorizontalArrowScroller>

        <section className="panel nested-panel">
          <h3>{t("Beispiel-Spiel in Normalform", "Example game in normal-form")}</h3>
          <p className="hint">
            {t(
              "Spieler 1 hat die Typen t₁ ∈ {1, 2} und Spieler 2 kennt nur Prob(t₁=1)=1/4, Prob(t₁=2)=3/4. Für jeden Typ gibt es eine eigene Auszahlungsmatrix. Eine Strategie von Spieler 1 legt daher fest, was er als Typ 1 und was er als Typ 2 spielt (z.B. s₁=(A,B)).",
              "Player 1 has types t₁ ∈ {1, 2} and Player 2 only knows Prob(t₁=1)=1/4, Prob(t₁=2)=3/4. There is a separate payoff matrix for each type. Therefore, a strategy of Player 1 specifies what to play as type 1 and as type 2 (e.g. s₁=(A,B))."
            )}
          </p>
          <div className="grid">
            <article>
              <h4>{t("Beispielmatrix: Typ 1", "Example matrix: Type 1")}</h4>
              <StaticPayoffTable data={INTRO_BAYES_T1} rowLabel={t("Spieler 1 (Typ 1)", "Player 1 (Type 1)")} colLabel={t("Spieler 2", "Player 2")} />
            </article>
            <article>
              <h4>{t("Beispielmatrix: Typ 2", "Example matrix: Type 2")}</h4>
              <StaticPayoffTable data={INTRO_BAYES_T2} rowLabel={t("Spieler 1 (Typ 2)", "Player 1 (Type 2)")} colLabel={t("Spieler 2", "Player 2")} />
            </article>
          </div>
        </section>

        <section className="panel nested-panel">
          <h3>{t("Notation", "Notation")}</h3>
          <ul className="intro-list">
            <li><code>N = {"{1, 2}"}</code>: {t("Zwei Spieler.", "Two players.")}</li>
            <li><code>Tᵢ</code>: {t("Typenmenge von Spieler i.", "Type set of player i.")}</li>
            <li><code>p(t₁, t₂)</code>: {t("common prior über Typkombinationen.", "common prior over type profiles.")}</li>
            <li><code>sᵢ : Tᵢ → Aᵢ</code>: {t("reine Strategie (Typ ↦ Aktion).", "pure strategy (type ↦ action).")}</li>
            <li><code>s = (s₁, s₂)</code>: {t("Strategieprofil.", "strategy profile.")}</li>
            <li><code>uᵢ(a₁, a₂, t₁, t₂)</code>: {t("Nutzen von Spieler i.", "payoff of player i.")}</li>
            <li><code>EUᵢ(s)</code>: {t("erwarteter Nutzen unter dem common prior.", "expected utility under the common prior.")}</li>
          </ul>
        </section>

      </section>
      <div className="actions">
        <button
          type="button"
          className="nav-pill-btn"
          onClick={() => {
            setActivePage("solve-bayesian");
            setBayesPage("toc");
          }}
        >
          {t("Trainiere Spiele mit privaten Informationen (Bayes)", "Train games with private information (Bayesian)")}
        </button>
      </div>
      </>
    );
  }

  function renderExtensiveIntro() {
    return (
      <>
      <section className="panel">
        <h2>
          {uiLang === "de" ? (
            <>
              Einführung in Spiele mit <u>sequenziellen Entscheidungen</u> (Extensivformspiele)
            </>
          ) : (
            <>
              Introduction to games with <u>sequential decisions</u> (extensive-form games)
            </>
          )}
        </h2>
        <p className="hint">
          {t(
            "Extensive Games (Spielbäume) modellieren strategische Situationen mit zeitlicher Struktur: Entscheidungen werden nacheinander getroffen, nicht gleichzeitig.",
            "Extensive games (game trees) model strategic situations with temporal structure: decisions are made sequentially, not simultaneously."
          )}
        </p>

        <HorizontalArrowScroller
          className="intro-grid intro-grid-one-line intro-grid-4"
          leftAriaLabel={t("Nach links scrollen", "Scroll left")}
          rightAriaLabel={t("Nach rechts scrollen", "Scroll right")}
        >
          <article className="panel nested-panel">
            <h3 className="def-title"><span className="def-badge">1</span><span>{t("Spielbaum", "Game tree")}</span></h3>
            <p>
              {t(
                "Ein Spiel wird als Baum dargestellt. Knoten sind Entscheidungspunkte, Kanten sind Aktionen. Blätter enthalten die Auszahlungen.",
                "A game is represented as a tree. Nodes are decision points, edges are actions, and leaves contain payoffs."
              )}
            </p>
          </article>
          <article className="panel nested-panel">
            <h3 className="def-title"><span className="def-badge">2</span><span>{t("Reihenfolge", "Order of moves")}</span></h3>
            <p>
              {t(
                "Die Reihenfolge der Züge ist explizit sichtbar. Damit kann man Situationen mit Vor- und Nachteilen der Zugreihenfolge analysieren.",
                "The order of moves is explicit. This allows analysis of first- and second-mover advantages."
              )}
            </p>
          </article>
          <article className="panel nested-panel">
            <h3 className="def-title"><span className="def-badge">3</span><span>{t("Strategien", "Strategies")}</span></h3>
            <p>
              {t(
                "Eine Strategie ist ein vollständiger Plan: Für jeden eigenen Entscheidungsknoten ist festgelegt, welche Aktion gewählt wird.",
                "A strategy is a complete plan: it specifies the chosen action at each of a player's decision nodes."
              )}
            </p>
          </article>
          <article className="panel nested-panel">
            <h3 className="def-title"><span className="def-badge">4</span><span>{t("Lösungsidee", "Solution idea")}</span></h3>
            <p>
              {t(
                "Bei perfekter Information nutzt man häufig Backward Induction: von den Endknoten rückwärts zum Startknoten.",
                "With perfect information, backward induction is often used: solve from terminal nodes back to the root."
              )}
            </p>
          </article>
        </HorizontalArrowScroller>

        <HorizontalArrowScroller
          className="intro-grid intro-grid-one-line intro-grid-2"
          leftAriaLabel={t("Nach links scrollen", "Scroll left")}
          rightAriaLabel={t("Nach rechts scrollen", "Scroll right")}
        >
          <section className="panel nested-panel">
            <h3>{t("Beispielspiel als Baum", "Example game as a tree")}</h3>
            <p className="hint">
              {t("Spieler 1 entscheidet zuerst zwischen", "Player 1 moves first between")} <code>L</code> {t("und", "and")} <code>R</code>. {t("Nach", "After")} <code>L</code> {t("entscheidet Spieler 2 zwischen", "Player 2 chooses between")} <code>X</code> {t("und", "and")} <code>Y</code>. {t("Die Endknoten zeigen die Auszahlungen.", "Terminal nodes show payoffs.")}
            </p>
            <div className="tree-example-wrap tree-example-wrap-compact">
              <svg viewBox="0 0 560 250" className="tree-example-svg tree-example-svg-compact" role="img" aria-label={t("Beispiel Spielbaum", "Example game tree")}>
                <defs>
                  <marker id="tree-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                    <path d="M0,0 L10,4 L0,8 Z" className="tree-arrow" />
                  </marker>
                </defs>

                <line x1="65.2" y1="124.4" x2="192.8" y2="87.6" className="tree-edge" markerEnd="url(#tree-arrow)" />
                <line x1="64.4" y1="137.9" x2="209.0" y2="200.2" className="tree-edge" markerEnd="url(#tree-arrow)" />
                <line x1="231.9" y1="79.9" x2="408.1" y2="61.3" className="tree-edge" markerEnd="url(#tree-arrow)" />
                <line x1="231.1" y1="87.8" x2="408.5" y2="141.5" className="tree-edge" markerEnd="url(#tree-arrow)" />

                <text x="129.0" y="106.0" className="tree-action" textAnchor="middle" dominantBaseline="middle">L</text>
                <text x="136.7" y="169.0" className="tree-action" textAnchor="middle" dominantBaseline="middle">R</text>
                <text x="320.0" y="70.6" className="tree-action" textAnchor="middle" dominantBaseline="middle">X</text>
                <text x="319.8" y="114.7" className="tree-action" textAnchor="middle" dominantBaseline="middle">Y</text>

                <circle cx="46" cy="130" r="20" className="tree-node decision" />
                <circle cx="212" cy="82" r="20" className="tree-node decision" />
                <circle cx="220" cy="205" r="12" className="tree-node terminal" />
                <circle cx="420" cy="60" r="12" className="tree-node terminal" />
                <circle cx="420" cy="145" r="12" className="tree-node terminal" />

                <text x="46" y="130" className="tree-label" textAnchor="middle" dominantBaseline="middle">P1</text>
                <text x="212" y="82" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>

                <rect x="238" y="190" width="96" height="30" rx="8" className="tree-payoff-bg" />
                <rect x="438" y="45" width="96" height="30" rx="8" className="tree-payoff-bg" />
                <rect x="438" y="130" width="96" height="30" rx="8" className="tree-payoff-bg" />

                <text x="286" y="205" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(3, 1)</text>
                <text x="486" y="60" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(2, 4)</text>
                <text x="486" y="145" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">(0, 0)</text>
              </svg>
            </div>
          </section>

          <section className="panel nested-panel">
            <h3>{t("Notation", "Notation")}</h3>
            <ul className="intro-list">
              <li><code>N = {"{1, 2}"}</code>: {t("Zwei Spieler (P1 und P2).", "Two players (P1 and P2).")}</li>
              <li><code>A₁ = {"{L, R}"}</code>: {t("Aktionen von P1 am Startknoten.", "actions of P1 at the root node.")}</li>
              <li><code>A₂(L) = {"{X, Y}"}</code>: {t("Aktionen von P2 nach L.", "actions of P2 after L.")}</li>
              <li><code>S₁ = {"{L, R}"}</code>: {t("Strategiemenge von P1.", "strategy set of P1.")}</li>
              <li><code>S₂ = {"{X, Y}"}</code>: {t("Strategiemenge von P2.", "strategy set of P2.")}</li>
              <li><code>s = (s₁, s₂)</code>: {t("Strategieprofil, z.B.", "strategy profile, e.g.")} <code>(L, X)</code>.</li>
              <li><code>u(L,X)=(2,4)</code>, <code>u(L,Y)=(0,0)</code>, <code>u(R)=(3,1)</code>.</li>
            </ul>
          </section>
        </HorizontalArrowScroller>
      </section>

      {renderBackwardInductionCard()}
      <section className="panel">
        <h2>{t("Notation von reinen Strategieprofilen in Extensivspielen", "Notation of pure strategy profiles in extensive games")}</h2>
        <div className="profile-step-tabs">
          {[1, 2, 3].map((step) => (
            <button
              key={`profile-step-${step}`}
              type="button"
              className={profileNotationStep === step ? "profile-step-tab active" : "profile-step-tab"}
              onClick={() => setProfileNotationStep(step)}
            >
              {step}.{" "}
              {step === 1
                ? t("Was ist eine Strategie?", "What is a strategy?")
                : step === 2
                  ? t("Strategie eines Spielers", "Single-player strategy")
                  : t("Strategieprofil", "Strategy profile")}
            </button>
          ))}
        </div>
        <div className="profile-notation-grid">
          <section className="panel nested-panel">
            <h3>{t("Beispielbaum", "Example tree")}</h3>
            <p className="hint">
              {t(
                "Spieler 2 hat zwei Entscheidungsknoten (g1 nach L, g2 nach R). Spieler 3 hat zwei Entscheidungsknoten (h1 nach (L,a), h2 nach (L,b)).",
                "Player 2 has two decision nodes (g1 after L, g2 after R). Player 3 has two decision nodes (h1 after (L,a), h2 after (L,b))."
              )}
            </p>
            <div className="tree-example-wrap tree-example-wrap-compact profile-notation-tree-wrap">
              <svg viewBox="0 0 560 290" className="tree-example-svg profile-notation-tree" role="img" aria-label={t("Beispielbaum zur Notation von Strategieprofilen", "Example tree for strategy profile notation")}>
                <defs>
                  <marker id="profile-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <path d="M0,0 L8,3 L0,6 Z" className="tree-arrow" />
                  </marker>
                </defs>

                <line
                  x1="74"
                  y1="145"
                  x2="192"
                  y2="95"
                  className={`tree-edge ${profileNotationStep >= 3 ? (profileNotationP1 ? (profileNotationP1 === "L" ? "bi-active" : "bi-muted") : "") : ""}`}
                  markerEnd="url(#profile-arrow)"
                />
                <line
                  x1="74"
                  y1="145"
                  x2="192"
                  y2="210"
                  className={`tree-edge ${profileNotationStep >= 3 ? (profileNotationP1 ? (profileNotationP1 === "R" ? "bi-active" : "bi-muted") : "") : ""}`}
                  markerEnd="url(#profile-arrow)"
                />
                <line
                  x1="210"
                  y1="95"
                  x2="332"
                  y2="52"
                  className={`tree-edge ${profileNotationStep >= 2 ? (profileNotationP2.g1 ? (profileNotationP2.g1 === "a" ? "bi-active" : "bi-muted") : "") : ""}`}
                  markerEnd="url(#profile-arrow)"
                />
                <line
                  x1="210"
                  y1="95"
                  x2="332"
                  y2="130"
                  className={`tree-edge ${profileNotationStep >= 2 ? (profileNotationP2.g1 ? (profileNotationP2.g1 === "b" ? "bi-active" : "bi-muted") : "") : ""}`}
                  markerEnd="url(#profile-arrow)"
                />

                <line
                  x1="350"
                  y1="52"
                  x2="504"
                  y2="30"
                  className={`tree-edge ${profileNotationStep >= 2 ? (profileNotationP3.h1 ? (profileNotationP3.h1 === "l" ? "bi-active" : "bi-muted") : "") : ""}`}
                  markerEnd="url(#profile-arrow)"
                />
                <line
                  x1="350"
                  y1="52"
                  x2="504"
                  y2="72"
                  className={`tree-edge ${profileNotationStep >= 2 ? (profileNotationP3.h1 ? (profileNotationP3.h1 === "r" ? "bi-active" : "bi-muted") : "") : ""}`}
                  markerEnd="url(#profile-arrow)"
                />
                <line
                  x1="350"
                  y1="130"
                  x2="504"
                  y2="112"
                  className={`tree-edge ${profileNotationStep >= 2 ? (profileNotationP3.h2 ? (profileNotationP3.h2 === "l" ? "bi-active" : "bi-muted") : "") : ""}`}
                  markerEnd="url(#profile-arrow)"
                />
                <line
                  x1="350"
                  y1="130"
                  x2="504"
                  y2="150"
                  className={`tree-edge ${profileNotationStep >= 2 ? (profileNotationP3.h2 ? (profileNotationP3.h2 === "r" ? "bi-active" : "bi-muted") : "") : ""}`}
                  markerEnd="url(#profile-arrow)"
                />
                <line
                  x1="210"
                  y1="210"
                  x2="504"
                  y2="205"
                  className={`tree-edge ${profileNotationStep >= 2 ? (profileNotationP2.g2 ? (profileNotationP2.g2 === "a" ? "bi-active" : "bi-muted") : "") : ""}`}
                  markerEnd="url(#profile-arrow)"
                />
                <line
                  x1="210"
                  y1="210"
                  x2="504"
                  y2="250"
                  className={`tree-edge ${profileNotationStep >= 2 ? (profileNotationP2.g2 ? (profileNotationP2.g2 === "b" ? "bi-active" : "bi-muted") : "") : ""}`}
                  markerEnd="url(#profile-arrow)"
                />

                <text x="133" y="120" className="tree-action" textAnchor="middle" dominantBaseline="middle">L</text>
                <text x="133" y="178" className="tree-action" textAnchor="middle" dominantBaseline="middle">R</text>
                <text x="270" y="68" className="tree-action" textAnchor="middle" dominantBaseline="middle">a</text>
                <text x="270" y="121" className="tree-action" textAnchor="middle" dominantBaseline="middle">b</text>

                <text x="425" y="35" className="tree-action" textAnchor="middle" dominantBaseline="middle">l</text>
                <text x="425" y="68" className="tree-action" textAnchor="middle" dominantBaseline="middle">r</text>
                <text x="425" y="115" className="tree-action" textAnchor="middle" dominantBaseline="middle">l</text>
                <text x="425" y="148" className="tree-action" textAnchor="middle" dominantBaseline="middle">r</text>
                <text x="425" y="208" className="tree-action" textAnchor="middle" dominantBaseline="middle">a</text>
                <text x="425" y="246" className="tree-action" textAnchor="middle" dominantBaseline="middle">b</text>

                <circle cx="54" cy="145" r="18" className="tree-node decision" />
                <circle cx="210" cy="95" r="18" className={`tree-node decision ${profileNotationStep >= 1 ? "profile-node-highlight-secondary" : ""}`} />
                <circle cx="350" cy="52" r="18" className={`tree-node decision ${profileNotationStep >= 1 ? "profile-node-highlight" : ""}`} />
                <circle cx="350" cy="130" r="18" className={`tree-node decision ${profileNotationStep >= 1 ? "profile-node-highlight" : ""}`} />
                <circle cx="210" cy="210" r="18" className={`tree-node decision ${profileNotationStep >= 1 ? "profile-node-highlight-secondary" : ""}`} />

                <text x="54" y="145" className="tree-label" textAnchor="middle" dominantBaseline="middle">P1</text>
                <text x="210" y="95" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>
                <text x="350" y="52" className="tree-label" textAnchor="middle" dominantBaseline="middle">P3</text>
                <text x="350" y="130" className="tree-label" textAnchor="middle" dominantBaseline="middle">P3</text>
                <text x="210" y="210" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>

                <text x="245" y="63" className="profile-node-tag profile-node-tag-p2" textAnchor="middle">g1</text>
                <text x="245" y="178" className="profile-node-tag profile-node-tag-p2" textAnchor="middle">g2</text>
                <text x="380" y="22" className="profile-node-tag" textAnchor="middle">h1</text>
                <text x="380" y="100" className="profile-node-tag" textAnchor="middle">h2</text>

                <circle cx="512" cy="30" r="8" className="tree-node terminal" />
                <circle cx="512" cy="72" r="8" className="tree-node terminal" />
                <circle cx="512" cy="112" r="8" className="tree-node terminal" />
                <circle cx="512" cy="150" r="8" className="tree-node terminal" />
                <circle cx="512" cy="205" r="8" className="tree-node terminal" />
                <circle cx="512" cy="250" r="8" className="tree-node terminal" />
              </svg>
            </div>
            <div className="profile-order-columns">
              <ul className="profile-order-list">
                <li><strong>{t("P2-Reihenfolge", "P2 order")}</strong></li>
                <li><span>1</span><code>g1</code> {t("nach", "after")} <code>(L)</code></li>
                <li><span>2</span><code>g2</code> {t("nach", "after")} <code>(R)</code></li>
              </ul>
              <ul className="profile-order-list">
                <li><strong>{t("P3-Reihenfolge", "P3 order")}</strong></li>
                <li><span>1</span><code>h1</code> {t("nach", "after")} <code>(L,a)</code></li>
                <li><span>2</span><code>h2</code> {t("nach", "after")} <code>(L,b)</code></li>
              </ul>
            </div>
          </section>

          <section className="panel nested-panel">
            {profileNotationStep === 1 && (
              <>
                <h3>{t("Was ist eine Strategie?", "What is a strategy?")}</h3>
                <p>
                  {t(
                    "Eine Strategie sagt einem Spieler, was er in jeder möglichen Situation tun würde, auch wenn diese Situation im konkreten Spielverlauf gar nicht eintritt.",
                    "A strategy tells a player what to do in every possible situation, even if that situation does not occur in the realized play."
                  )}
                </p>
                <p className="hint">
                  {t(
                    "Im Beispiel hat Spieler 2 zwei Knoten (g1, g2) und Spieler 3 zwei Knoten (h1, h2). Eine gültige Strategie muss jeweils alle eigenen Knoten abdecken.",
                    "In this example, Player 2 has two nodes (g1, g2) and Player 3 has two nodes (h1, h2). A valid strategy must cover all own nodes."
                  )}
                </p>
                <div className="feedback-box feedback-card info">
                  <strong>{t("Wichtig", "Important")}</strong>
                  <p>
                    {t(
                      "Auch wenn z.B. R gespielt wird, muss Spieler 3 weiterhin festlegen, was er nach (L,a) und (L,b) tun würde. Genau deshalb ist eine Strategie ein vollständiger Plan.",
                      "Even if, for example, R is played, Player 3 must still specify what they would do after (L,a) and (L,b). That is exactly why a strategy is a complete plan."
                    )}
                  </p>
                </div>
              </>
            )}

            {profileNotationStep === 2 && (
              <>
                <h3 className="profile-step2-title">{t("Strategie eines einzelnen Spielers", "Single-player strategy")}</h3>
                <div className="profile-step2-layout">
                  <p className="hint profile-step2-intro">
                    {t(
                      "Baue die Strategien von Spieler 2 und Spieler 3 jeweils separat auf.",
                      "Build Player-2 and Player-3 strategies separately."
                    )}
                  </p>

                  <div className="profile-step2-player-block">
                    <h4 className="profile-step2-player-title">{t("Spieler 2", "Player 2")}</h4>
                    <div className="profile-choice-grid profile-choice-grid-2">
                      <label>
                        <span><code>g1</code> {t("nach L", "after L")}</span>
                        <select value={profileNotationP2.g1} onChange={(e) => setProfileP2Action("g1", e.target.value)}>
                          <option value=""></option>
                          <option value="a">a</option>
                          <option value="b">b</option>
                        </select>
                      </label>
                      <label>
                        <span><code>g2</code> {t("nach R", "after R")}</span>
                        <select value={profileNotationP2.g2} onChange={(e) => setProfileP2Action("g2", e.target.value)}>
                          <option value=""></option>
                          <option value="a">a</option>
                          <option value="b">b</option>
                        </select>
                      </label>
                    </div>
                    <p className="profile-live-formula">
                      {t("Strategie von Spieler 2:", "Player-2 strategy:")}{" "}
                      <code>({profileNotationP2.g1 || "-"}, {profileNotationP2.g2 || "-"})</code>
                    </p>
                  </div>

                  <div className="profile-step2-player-block">
                    <h4 className="profile-step2-player-title">{t("Spieler 3", "Player 3")}</h4>
                    <div className="profile-choice-grid profile-choice-grid-2">
                      <label>
                        <span><code>h1</code></span>
                        <select value={profileNotationP3.h1} onChange={(e) => setProfileNodeAction("h1", e.target.value)}>
                          <option value=""></option>
                          <option value="l">l</option>
                          <option value="r">r</option>
                        </select>
                      </label>
                      <label>
                        <span><code>h2</code></span>
                        <select value={profileNotationP3.h2} onChange={(e) => setProfileNodeAction("h2", e.target.value)}>
                          <option value=""></option>
                          <option value="l">l</option>
                          <option value="r">r</option>
                        </select>
                      </label>
                    </div>
                    <p className="profile-live-formula">
                      {t("Strategie von Spieler 3:", "Player-3 strategy:")}{" "}
                      <code>({profileNotationP3.h1 || "-"}, {profileNotationP3.h2 || "-"})</code>
                    </p>
                  </div>

                  <p className="hint profile-step2-outro">
                    {t(
                      "Die Reihenfolge folgt jeweils der Knotenreihenfolge: P2 (g1, g2) und P3 (h1, h2).",
                      "The order always follows node order: P2 (g1, g2) and P3 (h1, h2)."
                    )}
                  </p>
                </div>
              </>
            )}

            {profileNotationStep === 3 && (
              <>
                <h3>{t("Strategieprofil aller Spieler", "Strategy profile of all players")}</h3>
                <p className="hint profile-step3-intro">
                  {t(
                    "Jetzt werden die Strategien aller Spieler kombiniert.",
                    "Now combine the strategies of all players."
                  )}
                </p>
                <div className="profile-choice-grid profile-choice-grid-players">
                  <label>
                    <span>{t("Spieler 1", "Player 1")}</span>
                    <select value={profileNotationP1} onChange={(e) => setProfileNotationP1(e.target.value)}>
                      <option value=""></option>
                      <option value="L">L</option>
                      <option value="R">R</option>
                    </select>
                  </label>
                  <label>
                    <span>{t("Spieler 2", "Player 2")}</span>
                    <code>({profileNotationP2.g1 || "-"}, {profileNotationP2.g2 || "-"})</code>
                  </label>
                  <label>
                    <span>{t("Spieler 3", "Player 3")}</span>
                    <code>({profileNotationP3.h1 || "-"}, {profileNotationP3.h2 || "-"})</code>
                  </label>
                </div>
                <p className="profile-live-formula profile-live-formula-highlight">
                  {t("Strategieprofil:", "Strategy profile:")}
                  <br />
                  <code>({profileNotationP1 || "-"}, ({profileNotationP2.g1 || "-"}, {profileNotationP2.g2 || "-"}), ({profileNotationP3.h1 || "-"}, {profileNotationP3.h2 || "-"}))</code>
                </p>
                <section className="panel nested-panel profile-quiz">
                  <h4>{t("Kurzer Check", "Quick check")}</h4>
                  <p className="hint">{t("Welche der folgenden Strategien könnte Spieler 2 haben?", "Which of the following strategies could Player 2 have?")}</p>
                  <div className="choice-list">
                    <label className="choice-item">
                      <input type="radio" name="profile-quiz" value="ab" checked={profileNotationQuizAnswer === "ab"} onChange={(e) => setProfileNotationQuizAnswer(e.target.value)} />
                      <span><code>(a, b)</code></span>
                    </label>
                    <label className="choice-item">
                      <input type="radio" name="profile-quiz" value="a" checked={profileNotationQuizAnswer === "a"} onChange={(e) => setProfileNotationQuizAnswer(e.target.value)} />
                      <span><code>(a)</code></span>
                    </label>
                    <label className="choice-item">
                      <input type="radio" name="profile-quiz" value="lr" checked={profileNotationQuizAnswer === "lr"} onChange={(e) => setProfileNotationQuizAnswer(e.target.value)} />
                      <span><code>(l, r)</code></span>
                    </label>
                  </div>
                  <div className="actions">
                    <button type="button" onClick={checkProfileNotationQuiz}>{t("Antwort prüfen", "Check answer")}</button>
                  </div>
                  {profileNotationQuizFeedback && (
                    <div className={`feedback-box feedback-card ${profileNotationQuizType}`}>
                      <strong>{profileNotationQuizType === "success" ? t("Richtig", "Correct") : t("Hinweis", "Hint")}</strong>
                      <p>{profileNotationQuizFeedback}</p>
                    </div>
                  )}
                </section>
              </>
            )}
          </section>
        </div>
      </section>
      <section className="panel">
        <h2>{t("Informationsmengen & simultane Züge", "Information Sets & Simultaneous Moves")}</h2>
        <p className="hint">
          {t(
            "Wenn ein Spieler beim Zug nicht unterscheiden kann, welcher Knoten erreicht wurde, liegen diese Knoten in derselben Informationsmenge.",
            "If a player cannot distinguish which node was reached when moving, those nodes belong to the same information set."
          )}
        </p>
        <p className="hint">
          {t(
            "Simultane Züge in Extensivform werden oft so modelliert: Ein Spieler zieht zuerst, der andere beobachtet den Zug aber nicht.",
            "Simultaneous moves in extensive form are often modeled this way: one player moves first, but the other does not observe that move."
          )}
        </p>
        <div className="profile-notation-grid">
          <article className="panel nested-panel">
            <h4>{t("Baum", "Tree")}</h4>
            <div className="tree-example-wrap tree-example-wrap-compact">
              <svg viewBox="0 0 560 280" className="tree-example-svg tree-example-svg-compact" role="img" aria-label={t("Spielbaum mit Informationsmenge", "Game tree with an information set")}>
                <defs>
                  <marker id="infoset-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <path d="M0,0 L8,3 L0,6 Z" className="tree-arrow" />
                  </marker>
                </defs>

                <line x1="68" y1="140" x2="220" y2="80" className="tree-edge" markerEnd="url(#infoset-arrow)" />
                <line x1="68" y1="140" x2="220" y2="200" className="tree-edge" markerEnd="url(#infoset-arrow)" />
                <line x1="248" y1="80" x2="420" y2="48" className="tree-edge" markerEnd="url(#infoset-arrow)" />
                <line x1="248" y1="80" x2="420" y2="112" className="tree-edge" markerEnd="url(#infoset-arrow)" />
                <line x1="248" y1="200" x2="420" y2="168" className="tree-edge" markerEnd="url(#infoset-arrow)" />
                <line x1="248" y1="200" x2="420" y2="232" className="tree-edge" markerEnd="url(#infoset-arrow)" />

                <path d="M220 80 Q 190 140 220 200" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />

                <text x="145" y="100" className="tree-action" textAnchor="middle" dominantBaseline="middle">L</text>
                <text x="145" y="182" className="tree-action" textAnchor="middle" dominantBaseline="middle">R</text>
                <text x="333" y="60" className="tree-action" textAnchor="middle" dominantBaseline="middle">U</text>
                <text x="333" y="102" className="tree-action" textAnchor="middle" dominantBaseline="middle">D</text>
                <text x="333" y="178" className="tree-action" textAnchor="middle" dominantBaseline="middle">U</text>
                <text x="333" y="220" className="tree-action" textAnchor="middle" dominantBaseline="middle">D</text>

                <circle cx="50" cy="140" r="18" className="tree-node decision" />
                <circle cx="230" cy="80" r="18" className="tree-node decision" />
                <circle cx="230" cy="200" r="18" className="tree-node decision" />
                <circle cx="430" cy="48" r="8" className="tree-node terminal" />
                <circle cx="430" cy="112" r="8" className="tree-node terminal" />
                <circle cx="430" cy="168" r="8" className="tree-node terminal" />
                <circle cx="430" cy="232" r="8" className="tree-node terminal" />

                <text x="50" y="140" className="tree-label" textAnchor="middle" dominantBaseline="middle">P1</text>
                <text x="230" y="80" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>
                <text x="230" y="200" className="tree-label" textAnchor="middle" dominantBaseline="middle">P2</text>
                <text x="175" y="142" className="tree-action" textAnchor="middle" dominantBaseline="middle">
                  {t("Informationsmenge", "Information set")}
                </text>
              </svg>
            </div>
          </article>

          <section className="panel nested-panel profile-quiz">
            <h4>{t("Mini-Quiz", "Mini quiz")}</h4>
            <p className="hint">
              {t(
                "Was bedeutet die gestrichelte Verbindung zwischen den beiden P2-Knoten?",
                "What does the dashed link between the two P2 nodes mean?"
              )}
            </p>
            <div className="choice-list">
              <label className="choice-item">
                <input
                  type="radio"
                  name="info-set-quiz"
                  value="perfect-observation"
                  checked={infoSetQuizAnswer === "perfect-observation"}
                  onChange={(e) => {
                    setInfoSetQuizAnswer(e.target.value);
                    setInfoSetQuizFeedback("");
                    setInfoSetQuizType("neutral");
                  }}
                />
                <span>
                  {t(
                    "Spieler 2 beobachtet perfekt, ob L oder R gespielt wurde.",
                    "Player 2 perfectly observes whether L or R was played."
                  )}
                </span>
              </label>
              <label className="choice-item">
                <input
                  type="radio"
                  name="info-set-quiz"
                  value="same-info-set"
                  checked={infoSetQuizAnswer === "same-info-set"}
                  onChange={(e) => {
                    setInfoSetQuizAnswer(e.target.value);
                    setInfoSetQuizFeedback("");
                    setInfoSetQuizType("neutral");
                  }}
                />
                <span>
                  {t(
                    "Die beiden Knoten gehören zur selben Informationsmenge; Spieler 2 kennt den zuvor erreichten Knoten nicht.",
                    "The two nodes are in the same information set; Player 2 does not know which previous node was reached."
                  )}
                </span>
              </label>
              <label className="choice-item">
                <input
                  type="radio"
                  name="info-set-quiz"
                  value="forced-randomization"
                  checked={infoSetQuizAnswer === "forced-randomization"}
                  onChange={(e) => {
                    setInfoSetQuizAnswer(e.target.value);
                    setInfoSetQuizFeedback("");
                    setInfoSetQuizType("neutral");
                  }}
                />
                <span>
                  {t(
                    "Spieler 2 muss zwischen U und D zwingend zufällig mischen.",
                    "Player 2 is forced to randomize between U and D."
                  )}
                </span>
              </label>
            </div>
            <div className="actions">
              <button type="button" onClick={checkInfoSetQuiz}>{t("Antwort prüfen", "Check answer")}</button>
            </div>
            {infoSetQuizFeedback && (
              <div className={`feedback-box feedback-card ${infoSetQuizType}`}>
                <strong>
                  {infoSetQuizType === "success" ? t("Richtig", "Correct") : infoSetQuizType === "warning" ? t("Hinweis", "Hint") : t("Nicht korrekt", "Incorrect")}
                </strong>
                <p>{infoSetQuizFeedback}</p>
              </div>
            )}
          </section>
        </div>
      </section>
      <div className="actions">
        <button
          type="button"
          className="nav-pill-btn"
          onClick={() => {
            setActivePage("solve-tree");
            setTreePage("toc");
          }}
        >
          {t("Trainiere Sequenzielle Spiele (Extensivform)", "Train sequential games (extensive form)")}
        </button>
      </div>
      </>
    );
  }

  function renderSpecialGames() {
    const specialQuizOptions = [
      { key: "pd", label: t("Gefangenendilemma", "Prisoner's dilemma") },
      { key: "chicken", label: t("Feiglingsspiel (Chicken)", "Chicken game") },
      { key: "stag", label: t("Jagdspiel (Stag Hunt)", "Stag hunt") },
      { key: "bos", label: t("Kampf der Geschlechter", "Battle of the sexes") },
      { key: "ultimatum", label: t("Ultimatumspiel", "Ultimatum game") }
    ];
    const currentSpecialGame = SPECIAL_GAMES[specialCardIndex];
    const currentSpecialTranslation = SPECIAL_GAME_TRANSLATIONS[currentSpecialGame?.title] || null;
    const specialStrategyLabels = uiLang === "en" ? SPECIAL_GAME_STRATEGY_LABELS_EN : null;
    const isPrisonersDilemmaCard = currentSpecialGame?.title === PRISONERS_DILEMMA_TITLE;
    const isChickenCard = currentSpecialGame?.title === CHICKEN_GAME_TITLE;
    const isStagCard = currentSpecialGame?.title === STAG_HUNT_TITLE;
    const isBosCard = currentSpecialGame?.title === BATTLE_OF_SEXES_TITLE;
    const isUltimatumCard = currentSpecialGame?.title === ULTIMATUM_TITLE;
    const prisonerCellClasses = buildPrisonersDilemmaCellClasses({
      focusPlayer: prisonersFocusPlayer,
      showNash: showPrisonersNash,
      showInefficiency: showPrisonersInefficiency
    });
    const chickenCellClasses = buildChickenCellClasses({
      focusPlayer: chickenFocusPlayer,
      showNash: showChickenNash,
      showCoordinationRisk: showChickenCoordinationRisk
    });
    const stagCellClasses = buildStagCellClasses({
      focusPlayer: stagFocusPlayer,
      showNash: showStagNash,
      showCoordinationRisk: showStagCoordinationRisk
    });
    const bosCellClasses = buildBosCellClasses({
      focusPlayer: bosFocusPlayer,
      showNash: showBosNash,
      showCoordinationRisk: showBosCoordinationRisk
    });
    const ultimatumCellClasses = buildUltimatumCellClasses({
      focusPlayer: ultimatumFocusPlayer,
      showNash: showUltimatumNash,
      showFairnessGap: showUltimatumFairnessGap
    });

    return (
      <>
        <section className="panel">
          <h2>{t("Fünf besondere Spiele der Spieltheorie", "Five special games in game theory")}</h2>
          <p className="hint">
            {t(
              "Ein Beispielspiel (Strategien, Nutzen (u₁, u₂)), die zentrale Idee und typische Ergebnisse. Unten findest du dazu eine Übung.",
              "A sample game (strategies, payoffs (u₁, u₂)), the core idea, and typical outcomes. At the bottom you will find an exercise."
            )}
          </p>
        </section>
        <section className="panel special-card">
          <div
            className="special-card-swipe-zone"
            onTouchStart={onSpecialCardTouchStart}
            onTouchEnd={onSpecialCardTouchEnd}
          >
            {isPrisonersDilemmaCard ? (
              <>
                <h3 className="special-card-title">{t("Gefangenendilemma", "Prisoner's dilemma")}</h3>
                <p className="hint pd-overview-lead">
                  {t(
                    "Zwei Spieler entscheiden unabhängig, ob sie kooperieren oder defektieren. Individuell ist Defektion rational, gemeinsam wäre Kooperation besser.",
                    "Two players decide independently whether to cooperate or defect. Individually, defection is rational, but jointly cooperation would be better."
                  )}
                </p>
                <div className="special-row pd-layout">
                  <article className="special-block pd-facts-box">
                    <h4 className="pd-card-title">{t("Schnelle Übersicht", "Quick overview")}</h4>
                    <div className="pd-card-body">
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Spieltyp", "Game type")}:</span>
                        <strong className="pd-fact-value">{t("Dominanzspiel", "Dominance game")}</strong>
                      </div>
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Dominante Strategie", "Dominant strategy")}:</span>
                        <strong className="pd-fact-value">{t("Defektieren", "Defect")}</strong>
                      </div>
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Nash-Gleichgewicht", "Nash equilibrium")}:</span>
                        <strong className="pd-fact-value">(Defektieren, Defektieren)</strong>
                      </div>
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Problem", "Problem")}:</span>
                        <strong className="pd-fact-value">
                          {t("individuell rational, kollektiv ineffizient", "individually rational, collectively inefficient")}
                        </strong>
                      </div>
                    </div>
                  </article>
                  <article className="special-block">
                    <h4 className="pd-card-title">{t("Nutzenmatrix", "Payoff matrix")}</h4>
                    <div className="pd-card-body">
                      <StaticPayoffTable
                        data={currentSpecialGame.table}
                        rowLabel={t("Spieler 1", "Player 1")}
                        colLabel={t("Spieler 2", "Player 2")}
                        autoScale
                        rowDisplayMap={specialStrategyLabels}
                        colDisplayMap={specialStrategyLabels}
                        getCellClassName={(row, col) => prisonerCellClasses[`${row}|${col}`] || ""}
                      />
                    </div>
                  </article>
                  <article className="special-block">
                    <h4 className="pd-card-title">{t("Erklärung", "Explanation")}</h4>
                    <div className="pd-card-body">
                      <div className="pd-explainer-section">
                        <h5>{t("Situation", "Situation")}</h5>
                        <p>{t("Jeder Spieler kann kooperieren oder defektieren.", "Each player can cooperate or defect.")}</p>
                      </div>
                      <div className="pd-explainer-section">
                        <h5>{t("Strategische Struktur", "Strategic structure")}</h5>
                        <p>{t("Defektion ist für beide Spieler eine strikt dominante Strategie.", "Defection is a strictly dominant strategy for both players.")}</p>
                      </div>
                      <div className="pd-explainer-section">
                        <h5>{t("Ergebnis", "Outcome")}</h5>
                        <p>
                          {t(
                            "Das Nash-Gleichgewicht ist (Defektieren, Defektieren), obwohl (Kooperieren, Kooperieren) für beide besser wäre.",
                            "The Nash equilibrium is (Defect, Defect), although (Cooperate, Cooperate) would be better for both."
                          )}
                        </p>
                      </div>
                    </div>
                  </article>
                </div>

                <div className="actions pd-analysis-toggle">
                  <button type="button" onClick={() => setShowPrisonersAnalysis((prev) => !prev)}>
                    {showPrisonersAnalysis ? t("Analyse ausblenden", "Hide analysis") : t("Analyse anzeigen", "Show analysis")}
                  </button>
                </div>

                {showPrisonersAnalysis && (
                  <article className="special-block pd-analysis-block">
                    <h4>{t("Interaktive Vertiefung", "Interactive deep dive")}</h4>
                    <p className="hint">
                      {t(
                        "Prüfe für jede mögliche Entscheidung des anderen Spielers, welche eigene Strategie den höheren Nutzen bringt.",
                        "For every possible choice of the other player, check which own strategy gives the higher payoff."
                      )}
                    </p>
                    <div className="pd-action-grid pd-action-grid-4">
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${prisonersFocusPlayer === "p1" ? "active" : ""}`}
                        onClick={() => togglePrisonersAnalysisMode("p1")}
                      >
                        {t("Beste Antworten von Spieler 1", "Best responses of player 1")}
                      </button>
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${prisonersFocusPlayer === "p2" ? "active" : ""}`}
                        onClick={() => togglePrisonersAnalysisMode("p2")}
                      >
                        {t("Beste Antworten von Spieler 2", "Best responses of player 2")}
                      </button>
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${showPrisonersNash ? "active" : ""}`}
                        onClick={() => togglePrisonersAnalysisMode("nash")}
                      >
                        {t("Nash-Gleichgewicht zeigen", "Show Nash equilibrium")}
                      </button>
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${showPrisonersInefficiency ? "active" : ""}`}
                        onClick={() => togglePrisonersAnalysisMode("ineff")}
                      >
                        {t("Warum ist das ineffizient?", "Why is this inefficient?")}
                      </button>
                    </div>

                    {prisonersFocusPlayer === "p1" && (
                      <div className="pd-analysis-note">
                        <p>{t("Wenn Spieler 2 kooperiert: Spieler 1 vergleicht 3 mit 5. Defektieren ist besser.", "If player 2 cooperates: player 1 compares 3 with 5. Defecting is better.")}</p>
                        <p>{t("Wenn Spieler 2 defektiert: Spieler 1 vergleicht 0 mit 1. Defektieren ist besser.", "If player 2 defects: player 1 compares 0 with 1. Defecting is better.")}</p>
                      </div>
                    )}
                    {prisonersFocusPlayer === "p2" && (
                      <div className="pd-analysis-note">
                        <p>{t("Wenn Spieler 1 kooperiert: Spieler 2 vergleicht 3 mit 5. Defektieren ist besser.", "If player 1 cooperates: player 2 compares 3 with 5. Defecting is better.")}</p>
                        <p>{t("Wenn Spieler 1 defektiert: Spieler 2 vergleicht 0 mit 1. Defektieren ist besser.", "If player 1 defects: player 2 compares 0 with 1. Defecting is better.")}</p>
                      </div>
                    )}

                    {showPrisonersNash && (
                      <p className="pd-analysis-note">
                        {t(
                          "Hier spielt jeder Spieler eine beste Antwort auf die Strategie des anderen. Deshalb ist dies ein Nash-Gleichgewicht.",
                          "Here each player plays a best response to the other's strategy. Therefore, this is a Nash equilibrium."
                        )}
                      </p>
                    )}
                    {showPrisonersInefficiency && (
                      <p className="pd-analysis-note">
                        {t(
                          "Obwohl (Defektieren, Defektieren) ein Nash-Gleichgewicht ist, wäre (Kooperieren, Kooperieren) für beide Spieler besser. Das Gefangenendilemma zeigt also den Konflikt zwischen individueller Rationalität und kollektivem Wohl.",
                          "Although (Defect, Defect) is a Nash equilibrium, (Cooperate, Cooperate) would be better for both players. The prisoner's dilemma shows the conflict between individual rationality and collective welfare."
                        )}
                      </p>
                    )}
                  </article>
                )}
              </>
            ) : isChickenCard ? (
              <>
                <h3 className="special-card-title">{t("Feiglingsspiel (Chicken)", "Chicken game")}</h3>
                <p className="hint pd-overview-lead">
                  {t(
                    "Zwei Spieler entscheiden gleichzeitig zwischen Ausweichen und Geradeaus. Jeder will nicht nachgeben, aber der Zusammenstoß ist für beide am schlechtesten.",
                    "Two players simultaneously choose between swerving and going straight. Each prefers not to yield, but a crash is worst for both."
                  )}
                </p>
                <div className="special-row pd-layout">
                  <article className="special-block pd-facts-box">
                    <h4 className="pd-card-title">{t("Schnelle Übersicht", "Quick overview")}</h4>
                    <div className="pd-card-body">
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Spieltyp", "Game type")}:</span>
                        <strong className="pd-fact-value">{t("Anti-Koordinationsspiel", "Anti-coordination game")}</strong>
                      </div>
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Dominante Strategie", "Dominant strategy")}:</span>
                        <strong className="pd-fact-value">{t("Keine strikt dominante Strategie", "No strictly dominant strategy")}</strong>
                      </div>
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Nash-Gleichgewicht", "Nash equilibrium")}:</span>
                        <strong className="pd-fact-value">
                          {t("(Geradeaus, Ausweichen) und (Ausweichen, Geradeaus)", "(Straight, Swerve) and (Swerve, Straight)")}
                        </strong>
                      </div>
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Problem", "Problem")}:</span>
                        <strong className="pd-fact-value">{t("Fehlkoordination kann zum Zusammenstoß führen", "Miscoordination can lead to a crash")}</strong>
                      </div>
                    </div>
                  </article>
                  <article className="special-block">
                    <h4 className="pd-card-title">{t("Nutzenmatrix", "Payoff matrix")}</h4>
                    <div className="pd-card-body">
                      <StaticPayoffTable
                        data={currentSpecialGame.table}
                        rowLabel={t("Spieler 1", "Player 1")}
                        colLabel={t("Spieler 2", "Player 2")}
                        autoScale
                        rowDisplayMap={specialStrategyLabels}
                        colDisplayMap={specialStrategyLabels}
                        getCellClassName={(row, col) => chickenCellClasses[`${row}|${col}`] || ""}
                      />
                    </div>
                  </article>
                  <article className="special-block">
                    <h4 className="pd-card-title">{t("Erklärung", "Explanation")}</h4>
                    <div className="pd-card-body">
                      <div className="pd-explainer-section">
                        <h5>{t("Situation", "Situation")}</h5>
                        <p>{t("Jeder Spieler kann ausweichen oder geradeaus fahren.", "Each player can swerve or go straight.")}</p>
                      </div>
                      <div className="pd-explainer-section">
                        <h5>{t("Strategische Struktur", "Strategic structure")}</h5>
                        <p>{t("Die beste Antwort hängt von der Entscheidung des anderen ab. Es gibt keine strikt dominante Strategie.", "The best response depends on the other's choice. There is no strictly dominant strategy.")}</p>
                      </div>
                      <div className="pd-explainer-section">
                        <h5>{t("Ergebnis", "Outcome")}</h5>
                        <p>
                          {t(
                            "Es gibt zwei Nash-Gleichgewichte: Einer fährt geradeaus, der andere weicht aus. Das gegenseitige Geradeausfahren ist für beide am schlechtesten.",
                            "There are two Nash equilibria: one goes straight, the other swerves. Mutual straight driving is worst for both."
                          )}
                        </p>
                      </div>
                    </div>
                  </article>
                </div>

                <div className="actions pd-analysis-toggle">
                  <button type="button" onClick={() => setShowChickenAnalysis((prev) => !prev)}>
                    {showChickenAnalysis ? t("Analyse ausblenden", "Hide analysis") : t("Analyse anzeigen", "Show analysis")}
                  </button>
                </div>

                {showChickenAnalysis && (
                  <article className="special-block pd-analysis-block">
                    <h4>{t("Interaktive Vertiefung", "Interactive deep dive")}</h4>
                    <p className="hint">
                      {t(
                        "Prüfe für jede mögliche Entscheidung des anderen Spielers, welche eigene Strategie die beste Antwort ist.",
                        "For each possible choice of the other player, check which own strategy is the best response."
                      )}
                    </p>
                    <div className="pd-action-grid pd-action-grid-4">
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${chickenFocusPlayer === "p1" ? "active" : ""}`}
                        onClick={() => toggleChickenAnalysisMode("p1")}
                      >
                        {t("Beste Antworten von Spieler 1", "Best responses of player 1")}
                      </button>
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${chickenFocusPlayer === "p2" ? "active" : ""}`}
                        onClick={() => toggleChickenAnalysisMode("p2")}
                      >
                        {t("Beste Antworten von Spieler 2", "Best responses of player 2")}
                      </button>
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${showChickenNash ? "active" : ""}`}
                        onClick={() => toggleChickenAnalysisMode("nash")}
                      >
                        {t("Nash-Gleichgewichte zeigen", "Show Nash equilibria")}
                      </button>
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${showChickenCoordinationRisk ? "active" : ""}`}
                        onClick={() => toggleChickenAnalysisMode("risk")}
                      >
                        {t("Warum ist das riskant?", "Why is this risky?")}
                      </button>
                    </div>

                    {chickenFocusPlayer === "p1" && (
                      <div className="pd-analysis-note">
                        <p>{t("Wenn Spieler 2 ausweicht: Spieler 1 vergleicht 2 mit 3. Geradeaus ist besser.", "If player 2 swerves: player 1 compares 2 with 3. Going straight is better.")}</p>
                        <p>{t("Wenn Spieler 2 geradeaus fährt: Spieler 1 vergleicht 1 mit 0. Ausweichen ist besser.", "If player 2 goes straight: player 1 compares 1 with 0. Swerving is better.")}</p>
                      </div>
                    )}
                    {chickenFocusPlayer === "p2" && (
                      <div className="pd-analysis-note">
                        <p>{t("Wenn Spieler 1 ausweicht: Spieler 2 vergleicht 2 mit 3. Geradeaus ist besser.", "If player 1 swerves: player 2 compares 2 with 3. Going straight is better.")}</p>
                        <p>{t("Wenn Spieler 1 geradeaus fährt: Spieler 2 vergleicht 1 mit 0. Ausweichen ist besser.", "If player 1 goes straight: player 2 compares 1 with 0. Swerving is better.")}</p>
                      </div>
                    )}

                    {showChickenNash && (
                      <p className="pd-analysis-note">
                        {t(
                          "In den beiden markierten Feldern spielt jeder eine beste Antwort auf den anderen: (Geradeaus, Ausweichen) und (Ausweichen, Geradeaus).",
                          "In the two highlighted cells, each plays a best response to the other: (Straight, Swerve) and (Swerve, Straight)."
                        )}
                      </p>
                    )}
                    {showChickenCoordinationRisk && (
                      <p className="pd-analysis-note">
                        {t(
                          "Wenn beide gleichzeitig geradeaus fahren, entsteht der Zusammenstoß mit den schlechtesten Auszahlungen (0,0). Genau dieses Risiko macht das Spiel problematisch.",
                          "If both go straight, a crash occurs with the worst payoffs (0,0). This risk is what makes the game problematic."
                        )}
                      </p>
                    )}
                  </article>
                )}
              </>
            ) : isStagCard ? (
              <>
                <h3 className="special-card-title">{t("Jagdspiel (Stag Hunt)", "Stag hunt")}</h3>
                <p className="hint pd-overview-lead">
                  {t(
                    "Zwei Spieler profitieren gemeinsam von der koordinierten Hirschjagd. Ohne Vertrauen kann jeder aus Sicherheitsgründen auf Hase ausweichen.",
                    "Two players benefit most from coordinating on stag. Without trust, each may switch to hare for safety."
                  )}
                </p>
                <div className="special-row pd-layout">
                  <article className="special-block pd-facts-box">
                    <h4 className="pd-card-title">{t("Schnelle Übersicht", "Quick overview")}</h4>
                    <div className="pd-card-body">
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Spieltyp", "Game type")}:</span>
                        <strong className="pd-fact-value">{t("Koordinationsspiel", "Coordination game")}</strong>
                      </div>
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Dominante Strategie", "Dominant strategy")}:</span>
                        <strong className="pd-fact-value">{t("Keine strikt dominante Strategie", "No strictly dominant strategy")}</strong>
                      </div>
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Nash-Gleichgewicht", "Nash equilibrium")}:</span>
                        <strong className="pd-fact-value">{t("(Hirsch, Hirsch) und (Hase, Hase)", "(Stag, Stag) and (Hare, Hare)")}</strong>
                      </div>
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Problem", "Problem")}:</span>
                        <strong className="pd-fact-value">{t("Das effiziente Ergebnis ist riskant bei fehlendem Vertrauen", "The efficient outcome is risky without trust")}</strong>
                      </div>
                    </div>
                  </article>
                  <article className="special-block">
                    <h4 className="pd-card-title">{t("Nutzenmatrix", "Payoff matrix")}</h4>
                    <div className="pd-card-body">
                      <StaticPayoffTable
                        data={currentSpecialGame.table}
                        rowLabel={t("Spieler 1", "Player 1")}
                        colLabel={t("Spieler 2", "Player 2")}
                        autoScale
                        rowDisplayMap={specialStrategyLabels}
                        colDisplayMap={specialStrategyLabels}
                        getCellClassName={(row, col) => stagCellClasses[`${row}|${col}`] || ""}
                      />
                    </div>
                  </article>
                  <article className="special-block">
                    <h4 className="pd-card-title">{t("Erklärung", "Explanation")}</h4>
                    <div className="pd-card-body">
                      <div className="pd-explainer-section">
                        <h5>{t("Situation", "Situation")}</h5>
                        <p>{t("Jeder Spieler kann Hirsch oder Hase wählen.", "Each player can choose stag or hare.")}</p>
                      </div>
                      <div className="pd-explainer-section">
                        <h5>{t("Strategische Struktur", "Strategic structure")}</h5>
                        <p>{t("Die beste Antwort hängt von der Entscheidung des anderen ab. Es gibt keine strikt dominante Strategie.", "The best response depends on the other's decision. There is no strictly dominant strategy.")}</p>
                      </div>
                      <div className="pd-explainer-section">
                        <h5>{t("Ergebnis", "Outcome")}</h5>
                        <p>
                          {t(
                            "Es gibt zwei Nash-Gleichgewichte: (Hirsch, Hirsch) und (Hase, Hase). (Hirsch, Hirsch) ist effizienter, aber riskanter.",
                            "There are two Nash equilibria: (Stag, Stag) and (Hare, Hare). (Stag, Stag) is more efficient but riskier."
                          )}
                        </p>
                      </div>
                    </div>
                  </article>
                </div>

                <div className="actions pd-analysis-toggle">
                  <button type="button" onClick={() => setShowStagAnalysis((prev) => !prev)}>
                    {showStagAnalysis ? t("Analyse ausblenden", "Hide analysis") : t("Analyse anzeigen", "Show analysis")}
                  </button>
                </div>

                {showStagAnalysis && (
                  <article className="special-block pd-analysis-block">
                    <h4>{t("Interaktive Vertiefung", "Interactive deep dive")}</h4>
                    <p className="hint">
                      {t(
                        "Prüfe für jede mögliche Entscheidung des anderen Spielers, welche eigene Strategie die beste Antwort ist.",
                        "For each possible choice of the other player, check which own strategy is the best response."
                      )}
                    </p>
                    <div className="pd-action-grid pd-action-grid-4">
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${stagFocusPlayer === "p1" ? "active" : ""}`}
                        onClick={() => toggleStagAnalysisMode("p1")}
                      >
                        {t("Beste Antworten von Spieler 1", "Best responses of player 1")}
                      </button>
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${stagFocusPlayer === "p2" ? "active" : ""}`}
                        onClick={() => toggleStagAnalysisMode("p2")}
                      >
                        {t("Beste Antworten von Spieler 2", "Best responses of player 2")}
                      </button>
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${showStagNash ? "active" : ""}`}
                        onClick={() => toggleStagAnalysisMode("nash")}
                      >
                        {t("Nash-Gleichgewichte zeigen", "Show Nash equilibria")}
                      </button>
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${showStagCoordinationRisk ? "active" : ""}`}
                        onClick={() => toggleStagAnalysisMode("risk")}
                      >
                        {t("Warum ist das riskant?", "Why is this risky?")}
                      </button>
                    </div>

                    {stagFocusPlayer === "p1" && (
                      <div className="pd-analysis-note">
                        <p>{t("Wenn Spieler 2 Hirsch wählt: Spieler 1 vergleicht 4 mit 3. Hirsch ist besser.", "If player 2 chooses stag: player 1 compares 4 with 3. Stag is better.")}</p>
                        <p>{t("Wenn Spieler 2 Hase wählt: Spieler 1 vergleicht 0 mit 2. Hase ist besser.", "If player 2 chooses hare: player 1 compares 0 with 2. Hare is better.")}</p>
                      </div>
                    )}
                    {stagFocusPlayer === "p2" && (
                      <div className="pd-analysis-note">
                        <p>{t("Wenn Spieler 1 Hirsch wählt: Spieler 2 vergleicht 4 mit 3. Hirsch ist besser.", "If player 1 chooses stag: player 2 compares 4 with 3. Stag is better.")}</p>
                        <p>{t("Wenn Spieler 1 Hase wählt: Spieler 2 vergleicht 0 mit 2. Hase ist besser.", "If player 1 chooses hare: player 2 compares 0 with 2. Hare is better.")}</p>
                      </div>
                    )}

                    {showStagNash && (
                      <p className="pd-analysis-note">
                        {t(
                          "Die markierten Felder (Hirsch, Hirsch) und (Hase, Hase) sind Nash-Gleichgewichte, weil dort beide jeweils eine beste Antwort spielen.",
                          "The highlighted cells (Stag, Stag) and (Hare, Hare) are Nash equilibria because both players are playing best responses."
                        )}
                      </p>
                    )}
                    {showStagCoordinationRisk && (
                      <p className="pd-analysis-note">
                        {t(
                          "Bei Fehlkoordination (Hirsch, Hase) oder (Hase, Hirsch) erhält der Hirschjäger 0. Dieses Risiko kann Spieler zur sicheren, aber weniger effizienten Lösung (Hase, Hase) treiben.",
                          "Under miscoordination (Stag, Hare) or (Hare, Stag), the stag hunter gets 0. This risk can push players to the safer but less efficient outcome (Hare, Hare)."
                        )}
                      </p>
                    )}
                  </article>
                )}
              </>
            ) : isBosCard ? (
              <>
                <h3 className="special-card-title">{t("Kampf der Geschlechter", "Battle of the sexes")}</h3>
                <p className="hint pd-overview-lead">
                  {t(
                    "Beide Spieler wollen zusammen etwas unternehmen, bevorzugen aber unterschiedliche gemeinsame Ergebnisse.",
                    "Both players want to do something together, but they prefer different coordinated outcomes."
                  )}
                </p>
                <div className="special-row pd-layout">
                  <article className="special-block pd-facts-box">
                    <h4 className="pd-card-title">{t("Schnelle Übersicht", "Quick overview")}</h4>
                    <div className="pd-card-body">
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Spieltyp", "Game type")}:</span>
                        <strong className="pd-fact-value">{t("Koordinationsspiel mit Präferenzkonflikt", "Coordination game with preference conflict")}</strong>
                      </div>
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Dominante Strategie", "Dominant strategy")}:</span>
                        <strong className="pd-fact-value">{t("Keine strikt dominante Strategie", "No strictly dominant strategy")}</strong>
                      </div>
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Nash-Gleichgewicht", "Nash equilibrium")}:</span>
                        <strong className="pd-fact-value">{t("(Oper, Oper) und (Fußball, Fußball)", "(Opera, Opera) and (Football, Football)")}</strong>
                      </div>
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Problem", "Problem")}:</span>
                        <strong className="pd-fact-value">{t("Koordination gelingt, aber Verteilung ist umstritten", "Coordination works, but distribution is contested")}</strong>
                      </div>
                    </div>
                  </article>
                  <article className="special-block">
                    <h4 className="pd-card-title">{t("Nutzenmatrix", "Payoff matrix")}</h4>
                    <div className="pd-card-body">
                      <StaticPayoffTable
                        data={currentSpecialGame.table}
                        rowLabel={t("Spieler 1", "Player 1")}
                        colLabel={t("Spieler 2", "Player 2")}
                        autoScale
                        rowDisplayMap={specialStrategyLabels}
                        colDisplayMap={specialStrategyLabels}
                        getCellClassName={(row, col) => bosCellClasses[`${row}|${col}`] || ""}
                      />
                    </div>
                  </article>
                  <article className="special-block">
                    <h4 className="pd-card-title">{t("Erklärung", "Explanation")}</h4>
                    <div className="pd-card-body">
                      <div className="pd-explainer-section">
                        <h5>{t("Situation", "Situation")}</h5>
                        <p>{t("Beide Spieler wollen gemeinsam ausgehen, aber Spieler 1 bevorzugt Oper und Spieler 2 Fußball.", "Both players want to go out together, but player 1 prefers opera and player 2 prefers football.")}</p>
                      </div>
                      <div className="pd-explainer-section">
                        <h5>{t("Strategische Struktur", "Strategic structure")}</h5>
                        <p>{t("Die beste Antwort hängt davon ab, was der andere tut. Es gibt keine strikt dominante Strategie.", "The best response depends on what the other does. There is no strictly dominant strategy.")}</p>
                      </div>
                      <div className="pd-explainer-section">
                        <h5>{t("Ergebnis", "Outcome")}</h5>
                        <p>
                          {t(
                            "Die beiden koordinierten Felder sind Nash-Gleichgewichte. Das Kernproblem ist, welches Gleichgewicht ausgewählt wird.",
                            "The two coordinated cells are Nash equilibria. The core problem is equilibrium selection."
                          )}
                        </p>
                      </div>
                    </div>
                  </article>
                </div>

                <div className="actions pd-analysis-toggle">
                  <button type="button" onClick={() => setShowBosAnalysis((prev) => !prev)}>
                    {showBosAnalysis ? t("Analyse ausblenden", "Hide analysis") : t("Analyse anzeigen", "Show analysis")}
                  </button>
                </div>

                {showBosAnalysis && (
                  <article className="special-block pd-analysis-block">
                    <h4>{t("Interaktive Vertiefung", "Interactive deep dive")}</h4>
                    <p className="hint">
                      {t(
                        "Prüfe für jede mögliche Entscheidung des anderen Spielers, welche eigene Strategie die beste Antwort ist.",
                        "For each possible choice of the other player, check which own strategy is the best response."
                      )}
                    </p>
                    <div className="pd-action-grid pd-action-grid-4">
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${bosFocusPlayer === "p1" ? "active" : ""}`}
                        onClick={() => toggleBosAnalysisMode("p1")}
                      >
                        {t("Beste Antworten von Spieler 1", "Best responses of player 1")}
                      </button>
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${bosFocusPlayer === "p2" ? "active" : ""}`}
                        onClick={() => toggleBosAnalysisMode("p2")}
                      >
                        {t("Beste Antworten von Spieler 2", "Best responses of player 2")}
                      </button>
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${showBosNash ? "active" : ""}`}
                        onClick={() => toggleBosAnalysisMode("nash")}
                      >
                        {t("Nash-Gleichgewichte zeigen", "Show Nash equilibria")}
                      </button>
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${showBosCoordinationRisk ? "active" : ""}`}
                        onClick={() => toggleBosAnalysisMode("risk")}
                      >
                        {t("Wo scheitert Koordination?", "Where does coordination fail?")}
                      </button>
                    </div>

                    {bosFocusPlayer === "p1" && (
                      <div className="pd-analysis-note">
                        <p>{t("Wenn Spieler 2 Oper wählt: Spieler 1 vergleicht 3 mit 0. Oper ist besser.", "If player 2 chooses opera: player 1 compares 3 with 0. Opera is better.")}</p>
                        <p>{t("Wenn Spieler 2 Fußball wählt: Spieler 1 vergleicht 0 mit 2. Fußball ist besser.", "If player 2 chooses football: player 1 compares 0 with 2. Football is better.")}</p>
                      </div>
                    )}
                    {bosFocusPlayer === "p2" && (
                      <div className="pd-analysis-note">
                        <p>{t("Wenn Spieler 1 Oper wählt: Spieler 2 vergleicht 2 mit 0. Oper ist besser.", "If player 1 chooses opera: player 2 compares 2 with 0. Opera is better.")}</p>
                        <p>{t("Wenn Spieler 1 Fußball wählt: Spieler 2 vergleicht 0 mit 3. Fußball ist besser.", "If player 1 chooses football: player 2 compares 0 with 3. Football is better.")}</p>
                      </div>
                    )}

                    {showBosNash && (
                      <p className="pd-analysis-note">
                        {t(
                          "Die markierten Felder (Oper, Oper) und (Fußball, Fußball) sind Nash-Gleichgewichte. Beide sind stabil, aber verteilen Vorteile unterschiedlich.",
                          "The highlighted cells (Opera, Opera) and (Football, Football) are Nash equilibria. Both are stable but distribute benefits differently."
                        )}
                      </p>
                    )}
                    {showBosCoordinationRisk && (
                      <p className="pd-analysis-note">
                        {t(
                          "In den off-diagonalen Feldern verpassen die Spieler die Koordination und erhalten (0,0). Das Spiel illustriert damit ein reines Koordinationsproblem mit Verteilungskonflikt.",
                          "In the off-diagonal cells, players fail to coordinate and get (0,0). This illustrates a coordination problem with distributional conflict."
                        )}
                      </p>
                    )}
                  </article>
                )}
              </>
            ) : isUltimatumCard ? (
              <>
                <h3 className="special-card-title">{t("Ultimatumspiel", "Ultimatum game")}</h3>
                <p className="hint pd-overview-lead">
                  {t(
                    "Spieler 1 wählt ein faires oder unfaires Angebot. Spieler 2 entscheidet über Annahme oder Ablehnung.",
                    "Player 1 chooses a fair or unfair offer. Player 2 decides whether to accept or reject."
                  )}
                </p>
                <div className="special-row pd-layout">
                  <article className="special-block pd-facts-box">
                    <h4 className="pd-card-title">{t("Schnelle Übersicht", "Quick overview")}</h4>
                    <div className="pd-card-body">
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Spieltyp", "Game type")}:</span>
                        <strong className="pd-fact-value">{t("Verhandlungs- / Verteilungsspiel", "Bargaining / distribution game")}</strong>
                      </div>
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Dominante Strategie", "Dominant strategy")}:</span>
                        <strong className="pd-fact-value">{t("Für Spieler 2: Annehmen", "For player 2: Accept")}</strong>
                      </div>
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Nash-Gleichgewicht", "Nash equilibrium")}:</span>
                        <strong className="pd-fact-value">{t("(Unfair, Annehmen)", "(Unfair, Accept)")}</strong>
                      </div>
                      <div className="pd-fact-row">
                        <span className="pd-fact-label">{t("Problem", "Problem")}:</span>
                        <strong className="pd-fact-value">{t("Effizienz und Fairness können auseinanderfallen", "Efficiency and fairness may diverge")}</strong>
                      </div>
                    </div>
                  </article>
                  <article className="special-block">
                    <h4 className="pd-card-title">{t("Nutzenmatrix", "Payoff matrix")}</h4>
                    <div className="pd-card-body">
                      <StaticPayoffTable
                        data={currentSpecialGame.table}
                        rowLabel={t("Spieler 1", "Player 1")}
                        colLabel={t("Spieler 2", "Player 2")}
                        autoScale
                        rowDisplayMap={specialStrategyLabels}
                        colDisplayMap={specialStrategyLabels}
                        getCellClassName={(row, col) => ultimatumCellClasses[`${row}|${col}`] || ""}
                      />
                    </div>
                  </article>
                  <article className="special-block">
                    <h4 className="pd-card-title">{t("Erklärung", "Explanation")}</h4>
                    <div className="pd-card-body">
                      <div className="pd-explainer-section">
                        <h5>{t("Situation", "Situation")}</h5>
                        <p>{t("Spieler 1 wählt ein faires oder unfaires Angebot, Spieler 2 nimmt an oder lehnt ab.", "Player 1 chooses a fair or unfair offer, player 2 accepts or rejects.")}</p>
                      </div>
                      <div className="pd-explainer-section">
                        <h5>{t("Strategische Struktur", "Strategic structure")}</h5>
                        <p>{t("Für Spieler 2 ist Annehmen in beiden Zeilen besser. Antizipiert Spieler 1 das, ist Unfair sein bestes Angebot.", "For player 2, accepting is better in both rows. Anticipating this, unfair is player 1's best offer.")}</p>
                      </div>
                      <div className="pd-explainer-section">
                        <h5>{t("Ergebnis", "Outcome")}</h5>
                        <p>
                          {t(
                            "Das modelltheoretische Nash-Gleichgewicht ist (Unfair, Annehmen). Empirisch werden unfaire Angebote jedoch oft abgelehnt.",
                            "The game-theoretic Nash equilibrium is (Unfair, Accept). Empirically, unfair offers are often rejected."
                          )}
                        </p>
                      </div>
                    </div>
                  </article>
                </div>

                <div className="actions pd-analysis-toggle">
                  <button type="button" onClick={() => setShowUltimatumAnalysis((prev) => !prev)}>
                    {showUltimatumAnalysis ? t("Analyse ausblenden", "Hide analysis") : t("Analyse anzeigen", "Show analysis")}
                  </button>
                </div>

                {showUltimatumAnalysis && (
                  <article className="special-block pd-analysis-block">
                    <h4>{t("Interaktive Vertiefung", "Interactive deep dive")}</h4>
                    <p className="hint">
                      {t(
                        "Prüfe für jede mögliche Entscheidung des anderen Spielers, welche eigene Strategie den höheren Nutzen bringt.",
                        "For each possible choice of the other player, check which own strategy yields a higher payoff."
                      )}
                    </p>
                    <div className="pd-action-grid pd-action-grid-4">
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${ultimatumFocusPlayer === "p1" ? "active" : ""}`}
                        onClick={() => toggleUltimatumAnalysisMode("p1")}
                      >
                        {t("Beste Antworten von Spieler 1", "Best responses of player 1")}
                      </button>
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${ultimatumFocusPlayer === "p2" ? "active" : ""}`}
                        onClick={() => toggleUltimatumAnalysisMode("p2")}
                      >
                        {t("Beste Antworten von Spieler 2", "Best responses of player 2")}
                      </button>
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${showUltimatumNash ? "active" : ""}`}
                        onClick={() => toggleUltimatumAnalysisMode("nash")}
                      >
                        {t("Nash-Gleichgewicht zeigen", "Show Nash equilibrium")}
                      </button>
                      <button
                        type="button"
                        className={`nav-pill-btn pd-toggle-btn ${showUltimatumFairnessGap ? "active" : ""}`}
                        onClick={() => toggleUltimatumAnalysisMode("fair")}
                      >
                        {t("Fairness vs. Vorhersage", "Fairness vs prediction")}
                      </button>
                    </div>

                    {ultimatumFocusPlayer === "p1" && (
                      <div className="pd-analysis-note">
                        <p>{t("Wenn Spieler 2 annimmt: Spieler 1 vergleicht 5 mit 9. Unfair ist besser.", "If player 2 accepts: player 1 compares 5 with 9. Unfair is better.")}</p>
                        <p>{t("Wenn Spieler 2 ablehnt: Spieler 1 vergleicht 0 mit 0. Beide Strategien sind gleich gut.", "If player 2 rejects: player 1 compares 0 with 0. Both strategies are equally good.")}</p>
                      </div>
                    )}
                    {ultimatumFocusPlayer === "p2" && (
                      <div className="pd-analysis-note">
                        <p>{t("Wenn Spieler 1 fair anbietet: Spieler 2 vergleicht 5 mit 0. Annehmen ist besser.", "If player 1 offers fair: player 2 compares 5 with 0. Accept is better.")}</p>
                        <p>{t("Wenn Spieler 1 unfair anbietet: Spieler 2 vergleicht 1 mit 0. Annehmen ist besser.", "If player 1 offers unfair: player 2 compares 1 with 0. Accept is better.")}</p>
                      </div>
                    )}

                    {showUltimatumNash && (
                      <p className="pd-analysis-note">
                        {t(
                          "Im markierten Feld (Unfair, Annehmen) spielen beide eine beste Antwort aufeinander. Daher ist es ein Nash-Gleichgewicht.",
                          "In the highlighted cell (Unfair, Accept), both players play best responses. Therefore it is a Nash equilibrium."
                        )}
                      </p>
                    )}
                    {showUltimatumFairnessGap && (
                      <p className="pd-analysis-note">
                        {t(
                          "Das Modell prognostiziert (Unfair, Annehmen). Gleichzeitig erscheint (Fair, Annehmen) vielen als gerechter. Das illustriert den Spannungsbogen zwischen reiner Nutzenmaximierung und Fairnessnormen.",
                          "The model predicts (Unfair, Accept). At the same time, many perceive (Fair, Accept) as fairer. This illustrates the tension between pure payoff maximization and fairness norms."
                        )}
                      </p>
                    )}
                  </article>
                )}
              </>
            ) : (
              <>
                <h3 className="special-card-title">{uiLang === "en" ? (currentSpecialTranslation?.title || currentSpecialGame.title) : currentSpecialGame.title}</h3>
                <div className="special-row">
                  <article className="special-block">
                    <h4>{t("Beispielspiel", "Sample game")}</h4>
                    <p className="hint">{uiLang === "en" ? (currentSpecialTranslation?.intro || currentSpecialGame.intro) : currentSpecialGame.intro}</p>
                    <StaticPayoffTable
                      data={currentSpecialGame.table}
                      rowLabel={t("Spieler 1", "Player 1")}
                      colLabel={t("Spieler 2", "Player 2")}
                      autoScale
                      rowDisplayMap={specialStrategyLabels}
                      colDisplayMap={specialStrategyLabels}
                    />
                  </article>
                  <article className="special-block">
                    <h4>{t("Erklärung", "Explanation")}</h4>
                    <ul className="intro-list">
                      {(uiLang === "en" ? (currentSpecialTranslation?.bullets || currentSpecialGame.bullets) : currentSpecialGame.bullets).map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                </div>
              </>
            )}
          </div>
          <div className="special-card-footer">
            <p className="special-card-counter">
              {t("Spiel", "Game")} {specialCardIndex + 1} / {SPECIAL_GAMES.length}
            </p>
            <div className="special-card-dots" role="tablist" aria-label={t("Spiele", "Games")}>
              {SPECIAL_GAMES.map((game, index) => (
                <button
                  key={game.title}
                  type="button"
                  role="tab"
                  aria-selected={index === specialCardIndex}
                  aria-label={`${t("Spiel", "Game")} ${index + 1}`}
                  className={`special-card-dot ${index === specialCardIndex ? "active" : ""}`}
                  onClick={() => goToSpecialCard(index)}
                />
              ))}
            </div>
            <div className="special-card-nav">
              <button
                type="button"
                className="special-card-nav-btn"
                aria-label={t("Zurück", "Previous")}
                onClick={() => shiftSpecialCard(-1)}
              >
                <span className="nav-label-full">{t("Zurück", "Previous")}</span>
                <span className="nav-label-short" aria-hidden="true">&lt;</span>
              </button>
              <button
                type="button"
                className="special-card-nav-btn"
                aria-label={t("Weiter", "Next")}
                onClick={() => shiftSpecialCard(1)}
              >
                <span className="nav-label-full">{t("Weiter", "Next")}</span>
                <span className="nav-label-short" aria-hidden="true">&gt;</span>
              </button>
            </div>
          </div>
        </section>

        <section className="panel special-card">
          <h3 className="special-card-title">{t("Übung: Spieltyp erkennen", "Exercise: identify the game type")}</h3>
          <div className="special-row">
            <article className="special-block">
              <h4>{t("Spiel", "Game")}</h4>
              <p className="hint">
                {t(
                  "Bestimme anhand der Matrix, welches der fünf besonderen Spiele gezeigt wird.",
                  "Identify which of the five special games is shown based on the matrix."
                )}
              </p>
              <StaticPayoffTable
                data={specialQuizData.table}
                rowLabel={t("Spieler 1", "Player 1")}
                colLabel={t("Spieler 2", "Player 2")}
                autoScale
                rowDisplayMap={specialStrategyLabels}
                colDisplayMap={specialStrategyLabels}
              />
            </article>
            <article className="special-block">
              <h4>{t("Frage", "Question")}</h4>
              <p className="hint">{t("Um welchen Spieltyp handelt es sich?", "Which game type is this?")}</p>
              <div className="choice-list">
                {specialQuizOptions.map((option) => (
                  <label key={option.key} className="choice-item">
                    <input
                      type="radio"
                      name="special-game-quiz"
                      value={option.key}
                      checked={specialQuizSelected === option.key}
                      onChange={(e) => {
                        setSpecialQuizSelected(e.target.value);
                        setSpecialQuizFeedback("");
                        setSpecialQuizFeedbackType("neutral");
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <div className="actions">
                <button type="button" onClick={checkSpecialQuiz}>
                  {t("Antwort prüfen", "Check answer")}
                </button>
              </div>
              {specialQuizFeedback && (
                <div className={`feedback-box feedback-card ${specialQuizFeedbackType}`}>
                  <strong>{specialQuizFeedbackType === "success" ? t("Richtig", "Correct") : t("Hinweis", "Hint")}</strong>
                  <p>{specialQuizFeedback}</p>
                </div>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" onClick={resetSpecialQuiz}>
              {t("Neues Spiel", "New game")}
            </button>
          </div>
        </section>
      </>
    );
  }

  function renderBayesPriorCard(params) {
    if (!params) return null;
    const { den, w, x, y, z } = params;
    return (
      <section className="bayes-prior-card">
        <h4>{t("Common prior über Typen", "Common prior over types")}</h4>
        <div className="bayes-prior-grid">
          <div className="prior-corner" />
          <div className="prior-col-head">{t("Spieler 2: Typ c", "Player 2: Type c")}</div>
          <div className="prior-col-head">{t("Spieler 2: Typ d", "Player 2: Type d")}</div>
          <div className="prior-row-head">{t("Spieler 1: Typ a", "Player 1: Type a")}</div>
          <div className="prior-cell">{w}/{den}</div>
          <div className="prior-cell">{x}/{den}</div>
          <div className="prior-row-head">{t("Spieler 1: Typ b", "Player 1: Type b")}</div>
          <div className="prior-cell">{y}/{den}</div>
          <div className="prior-cell">{z}/{den}</div>
        </div>
      </section>
    );
  }

  function renderBayesianExercises() {
    const activeBayesPage = bayesRenderPage;
    if (activeBayesPage === "toc") {
      return (
        <section className="panel">
          <h2>{t("Trainiere Spiele mit privaten Informationen (Bayes)", "Train games with private information (Bayesian)")}</h2>
          <h3>{t("Teil 1: Grundlagen statischer Bayes-Spiele", "Part 1: Foundations of static Bayesian games")}</h3>
          <div className="exercise-link-grid">
            <button type="button" className="exercise-link" onClick={() => setBayesPage("ex1")}>
              <span className="exercise-link-title">
                {t("Übung 1 – Bayes-Spiel mit einseitiger privater Information", "Exercise 1 - Bayesian game with one-sided private information")}
              </span>
              <span className="exercise-link-meta">{buildProgressMeta("bayes_ex1")}</span>
            </button>
            <button type="button" className="exercise-link" onClick={() => setBayesPage("ex2a")}>
              <span className="exercise-link-title">
                {t("Übung 2a – A-posteriori Wahrscheinlichkeiten in Bayes-Spielen", "Exercise 2a - Posterior probabilities in Bayesian games")}
              </span>
              <span className="exercise-link-meta">{buildProgressMeta("bayes_ex2a")}</span>
            </button>
            <button type="button" className="exercise-link" onClick={() => setBayesPage("ex2b")}>
              <span className="exercise-link-title">
                {t("Übung 2b – Bayes-Nash-Gleichgewichte bei zweiseitiger privater Information", "Exercise 2b - Bayesian Nash equilibria with two-sided private information")}
              </span>
              <span className="exercise-link-meta">{buildProgressMeta("bayes_ex2b")}</span>
            </button>
          </div>
        </section>
      );
    }

    if (activeBayesPage === "ex1") {
      return (
        <section className="panel">
          <h2>{t("Übung 1 – Bayes-Spiel mit einseitiger privater Information", "Exercise 1 - Bayesian game with one-sided private information")}</h2>
          <div className="exercise-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              <p className="hint">{t("Spieler 1 kennt vor der Entscheidung seinen Typ (1 oder 2), Spieler 2 kennt ihn nicht. Common Prior: P(Typ 1)=1/4, P(Typ 2)=3/4.", "Player 1 knows their type (1 or 2) before choosing, Player 2 does not know it. Common prior: P(Type 1)=1/4, P(Type 2)=3/4.")}</p>
              {bayesEx1Data && (
                <>
                  <h4 className="bayes-type-first">{t("Spieler 1 vom Typ 1", "Player 1 of type 1")}</h4>
                  <NormalGameTable game={bayesEx1Data.game_t1} rowLabel={t("Spieler 1 (Typ 1: 25%)", "Player 1 (Type 1: 25%)")} colLabel={t("Spieler 2", "Player 2")} />
                  <h4>{t("Spieler 1 vom Typ 2", "Player 1 of type 2")}</h4>
                  <NormalGameTable game={bayesEx1Data.game_t2} rowLabel={t("Spieler 1 (Typ 2: 75%)", "Player 1 (Type 2: 75%)")} colLabel={t("Spieler 2", "Player 2")} />
                  <div className="notation-box">
                    <h4>{t("Notation", "Notation")}</h4>
                    <ul className="intro-list">
                      <li><code>s₁ = (s₁(t₁=1), s₁(t₁=2)) ∈ {"{A,B}×{A,B}"}</code></li>
                      <li><code>s₂ ∈ {"{X,Y}"}</code></li>
                      <li><code>p(t₁=1)=1/4, p(t₁=2)=3/4</code></li>
                    </ul>
                  </div>
                  <div className="actions">
                    <button type="button" onClick={loadBayesEx1} disabled={legacyLoading}>{t("Neues Spiel", "New game")}</button>
                    <button type="button" onClick={() => setShowHelpBayesEx1((v) => !v)}>{t("Hilfe", "Help")}</button>
                  </div>
                  {showHelpBayesEx1 && (
                    <section className="panel nested-panel">
                      <h4>Hilfe</h4>
                      <ul className="intro-list">
                        <li>Prüfe für jedes Profil ((s1(Typ1), s1(Typ2)), s2), ob alle drei Anreizbedingungen erfüllt sind.</li>
                        <li>Spieler 1, Typ 1: Bei gegebenem s2 muss die gewählte Aktion (A oder B) mindestens so gut sein wie die Alternative.</li>
                        <li>Spieler 1, Typ 2: Analog dieselbe Bedingung in der Typ-2-Matrix prüfen.</li>
                        <li>Spieler 2: Vergleiche erwartete Auszahlungen von X und Y mit p(Typ1)=1/4 und p(Typ2)=3/4.</li>
                      </ul>
                    </section>
                  )}
                </>
              )}
            </article>
            <article className="panel nested-panel">
              <h3>{t("Frage", "Question")}</h3>
              <p className="hint">{t("Welche der folgenden Strategieprofile sind Bayes-Gleichgewichte?", "Which of the following strategy profiles are Bayesian equilibria?")}</p>
              <p className="hint">{t("Nicht-exklusive Antworten (mehrere können richtig sein).", "Non-exclusive answers (multiple can be correct).")}</p>
              {bayesEx1Data && (
                <>
                  <div className="choice-list two-col-choices">
                    {bayesEx1Data.choices.map((choice) => (
                      <label key={choice.id} className="choice-item checkbox-item">
                        <input
                          type="checkbox"
                          value={choice.id}
                          checked={bayesEx1Selected.includes(choice.id)}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (e.target.checked) setBayesEx1Selected((prev) => [...prev, value]);
                            else setBayesEx1Selected((prev) => prev.filter((x) => x !== value));
                          }}
                        />
                        <span>{choice.label}</span>
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={checkBayesEx1} disabled={legacyLoading}>{t("Antwort prüfen", "Check answer")}</button>
                  {bayesEx1Feedback && (
                    <div className={`feedback-box feedback-card ${bayesEx1FeedbackType}`}>
                      <strong>{bayesEx1FeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Incorrect")}</strong>
                      <p>{bayesEx1Feedback}</p>
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setBayesPage("toc")}>{t("Zurück", "Back")}</button>
            <button type="button" className="nav-pill-btn" onClick={() => setBayesPage("ex2a")}>{t("Weiter zu Übung 2a", "Next to Exercise 2a")}</button>
          </div>
        </section>
      );
    }

    if (activeBayesPage === "ex2a") {
      return (
        <section className="panel">
          <h2>{t("Übung 2a – A-posteriori Wahrscheinlichkeiten in Bayes-Spielen", "Exercise 2a - Posterior probabilities in Bayesian games")}</h2>
          <div className="exercise-layout">
            <article className="panel nested-panel">
              <h3>{t("Spiel", "Game")}</h3>
              <p className="hint">{t("Spieler 1 ist vom Typ a oder b, Spieler 2 vom Typ c oder d. Beide kennen nur ihren eigenen Typ.", "Player 1 is type a or b, Player 2 is type c or d. Both only know their own type.")}</p>
              {bayesEx2aData && (
                <>
                  {renderBayesPriorCard(bayesEx2aData.params)}
                  <h4>{t("Spieler 1 Typ a, Spieler 2 Typ c", "Player 1 of type a, player 2 of type c")}</h4>
                  <StaticPayoffTable data={BAYES_EX2A_AC} rowLabel={t("Spieler 1 (Typ a)", "Player 1 (Type a)")} colLabel={t("Spieler 2 (Typ c)", "Player 2 (Type c)")} />
                  <h4>{t("Spieler 1 Typ a, Spieler 2 Typ d", "Player 1 of type a, player 2 of type d")}</h4>
                  <StaticPayoffTable data={BAYES_EX2A_AD} rowLabel={t("Spieler 1 (Typ a)", "Player 1 (Type a)")} colLabel={t("Spieler 2 (Typ d)", "Player 2 (Type d)")} />
                  <h4>{t("Spieler 1 Typ b, Spieler 2 Typ c", "Player 1 of type b, player 2 of type c")}</h4>
                  <StaticPayoffTable data={BAYES_EX2A_BC} rowLabel={t("Spieler 1 (Typ b)", "Player 1 (Type b)")} colLabel={t("Spieler 2 (Typ c)", "Player 2 (Type c)")} />
                  <h4>{t("Spieler 1 Typ b, Spieler 2 Typ d", "Player 1 of type b, player 2 of type d")}</h4>
                  <StaticPayoffTable data={BAYES_EX2A_BD} rowLabel={t("Spieler 1 (Typ b)", "Player 1 (Type b)")} colLabel={t("Spieler 2 (Typ d)", "Player 2 (Type d)")} />
                  <div className="notation-box">
                    <h4>{t("Notation", "Notation")}</h4>
                    <ul className="intro-list">
                      <li><code>Prob(a,c)+Prob(a,d)+Prob(b,c)+Prob(b,d)=1</code></li>
                      <li><code>Prob(c|a)+Prob(d|a)=1</code></li>
                      <li><code>Prob(c|b)+Prob(d|b)=1</code></li>
                    </ul>
                  </div>
                  <div className="actions">
                    <button type="button" onClick={loadBayesEx2a} disabled={legacyLoading}>{t("Neues Spiel", "New game")}</button>
                    <button type="button" onClick={() => setShowHelpBayesEx2a((v) => !v)}>{t("Hilfe", "Help")}</button>
                  </div>
                  {showHelpBayesEx2a && (
                    <section className="panel nested-panel">
                      <h4>Hilfe</h4>
                      <ul className="intro-list">
                        <li>Für Typ a von Spieler 1 normalisierst du die Zeile (w, x): Prob(c|a)=w/(w+x), Prob(d|a)=x/(w+x).</li>
                        <li>Für Typ b von Spieler 1 normalisierst du die Zeile (y, z): Prob(c|b)=y/(y+z), Prob(d|b)=z/(y+z).</li>
                      </ul>
                    </section>
                  )}
                </>
              )}
            </article>
            <article className="panel nested-panel">
              <h3>{t("Frage a)", "Question a)")}</h3>
              <p className="hint">{t("Wie lauten Prob(c|a), Prob(d|a), Prob(c|b) und Prob(d|b)?", "What are Prob(c|a), Prob(d|a), Prob(c|b), and Prob(d|b)?")}</p>
              <p className="hint">{t("Wähle genau eine Antwort.", "Choose exactly one answer.")}</p>
              {bayesEx2aData && (
                <>
                  <div className="choice-list">
                    {bayesEx2aData.choices.map((choice) => (
                      <label key={choice.id} className="choice-item">
                        <input
                          type="radio"
                          name="bayes-ex2a-choice"
                          value={choice.id}
                          checked={bayesEx2aSelected === choice.id}
                          onChange={(e) => setBayesEx2aSelected(e.target.value)}
                        />
                        <span>{choice.label}</span>
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={checkBayesEx2a} disabled={!bayesEx2aSelected || legacyLoading}>{t("Antwort prüfen", "Check answer")}</button>
                  {bayesEx2aFeedback && (
                    <div className={`feedback-box feedback-card ${bayesEx2aFeedbackType}`}>
                      <strong>{bayesEx2aFeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Incorrect")}</strong>
                      <p>{bayesEx2aFeedback}</p>
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
          <div className="actions">
            <button type="button" className="nav-pill-btn" onClick={() => setBayesPage("ex1")}>{t("Zurück", "Back")}</button>
            <button type="button" className="nav-pill-btn" onClick={() => setBayesPage("ex2b")}>{t("Weiter zu Übung 2b", "Next to Exercise 2b")}</button>
          </div>
        </section>
      );
    }

    return (
      <section className="panel">
        <h2>{t("Übung 2b – Bayes-Nash-Gleichgewichte bei zweiseitiger privater Information", "Exercise 2b - Bayesian Nash equilibria with two-sided private information")}</h2>
        <div className="exercise-layout">
          <article className="panel nested-panel">
            <h3>{t("Spiel", "Game")}</h3>
            <p className="hint">{t("Spieler 1 ist vom Typ a oder b, Spieler 2 vom Typ c oder d. Beide kennen nur ihren eigenen Typ.", "Player 1 is type a or b, Player 2 is type c or d. Both only know their own type.")}</p>
            {bayesEx2bData && (
              <>
                {renderBayesPriorCard(bayesEx2bData.params)}
                <StaticPayoffTable data={BAYES_EX2A_AC} rowLabel={t("Spieler 1 (Typ a)", "Player 1 (Type a)")} colLabel={t("Spieler 2 (Typ c)", "Player 2 (Type c)")} />
                <StaticPayoffTable data={BAYES_EX2A_AD} rowLabel={t("Spieler 1 (Typ a)", "Player 1 (Type a)")} colLabel={t("Spieler 2 (Typ d)", "Player 2 (Type d)")} />
                <StaticPayoffTable data={BAYES_EX2A_BC} rowLabel={t("Spieler 1 (Typ b)", "Player 1 (Type b)")} colLabel={t("Spieler 2 (Typ c)", "Player 2 (Type c)")} />
                <StaticPayoffTable data={BAYES_EX2A_BD} rowLabel={t("Spieler 1 (Typ b)", "Player 1 (Type b)")} colLabel={t("Spieler 2 (Typ d)", "Player 2 (Type d)")} />
                <div className="actions">
                  <button
                    type="button"
                    onClick={() => {
                      loadBayesEx2a();
                      setBayesPage("ex2a");
                    }}
                    disabled={legacyLoading}
                  >
                    {t("Neues Spiel (a)", "New game (a)")}
                  </button>
                  <button type="button" onClick={() => setShowHelpBayesEx2b((v) => !v)}>{t("Hilfe", "Help")}</button>
                </div>
                {showHelpBayesEx2b && (
                  <section className="panel nested-panel">
                    <h4>{t("Hilfe", "Help")}</h4>
                    <ul className="intro-list">
                      <li>{t("Prüfe für die angezeigten Strategieprofile, ob sie Bayes-Gleichgewichte sind.", "Check whether the shown strategy profiles are Bayesian equilibria.")}</li>
                      <li>{t("Da mehrere Profile gleichzeitig gelten können, wähle am Ende alle Profile aus, deren Bedingungen erfüllt sind.", "Since multiple profiles can hold simultaneously, select all profiles whose conditions are satisfied.")}</li>
                    </ul>
                  </section>
                )}
              </>
            )}
          </article>
          <article className="panel nested-panel">
            <h3>{t("Frage b)", "Question b)")}</h3>
            <p className="hint">{t("Welche der folgenden Strategieprofile sind Bayes-Gleichgewichte?", "Which of the following strategy profiles are Bayesian equilibria?")}</p>
            <p className="hint">{t("Nicht-exklusive Antworten (mehrere können richtig sein).", "Non-exclusive answers (multiple can be correct).")}</p>
            {bayesEx2bData && (
              <>
                <div className="choice-list">
                  {bayesEx2bData.choices.map((choice) => (
                    <label key={choice.id} className="choice-item checkbox-item">
                      <input
                        type="checkbox"
                        value={choice.id}
                        checked={bayesEx2bSelected.includes(choice.id)}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (e.target.checked) setBayesEx2bSelected((prev) => [...prev, value]);
                          else setBayesEx2bSelected((prev) => prev.filter((x) => x !== value));
                        }}
                      />
                      <span>{choice.label}</span>
                    </label>
                  ))}
                </div>
                <button type="button" onClick={checkBayesEx2b} disabled={legacyLoading}>{t("Antwort prüfen", "Check answer")}</button>
                {bayesEx2bFeedback && (
                  <div className={`feedback-box feedback-card ${bayesEx2bFeedbackType}`}>
                    <strong>{bayesEx2bFeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Incorrect")}</strong>
                    <p>{bayesEx2bFeedback}</p>
                  </div>
                )}
                {bayesEx2aSubmitted ? (
                  <div className="feedback-box feedback-card">
                    <strong>{t("Zwischenergebnis aus Teil a:", "Intermediate result from part a:")}</strong>
                    <p>{bayesEx2aIntermediate}</p>
                  </div>
                ) : (
                  <div className="feedback-box feedback-card warning">
                    <strong>{t("Hinweis", "Hint")}</strong>
                    <p>{t("Bitte zuerst Teil a abschicken, dann erscheint hier das Zwischenergebnis.", "Please submit part a first, then the intermediate result appears here.")}</p>
                  </div>
                )}
              </>
            )}
          </article>
        </div>
        <div className="actions">
          <button type="button" className="nav-pill-btn" onClick={() => setBayesPage("ex2a")}>{t("Zurück", "Back")}</button>
        </div>
      </section>
    );
  }

  function renderHome() {
    return (
      <section className="home-wrap">
        <article className="panel home-hero">
          <p className="home-eyebrow">Game Theory Trainer</p>
          <h2>{t("Verstehen. Anwenden. Meistern.", "Understand. Apply. Master.")}</h2>
          <p className="home-lead">{t("Interaktive Spieltheorie in einem Workflow: erst Konzepte verstehen, dann Aufgaben lösen.", "Interactive game theory in one workflow: first understand concepts, then solve exercises.")}</p>
          <div className="home-cta-row">
            <button type="button" onClick={() => setActivePage("learn-simultaneous")}>
              {t("Mit Konzept starten", "Start with concepts")}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setActivePage("solve-normal");
                setNormalPage("toc");
              }}
            >
              {t("Direkt zu Übungen", "Go to exercises")}
            </button>
          </div>
        </article>

        <section className="home-grid">
          <article className="panel home-card">
            <h3>{t("Konzept lernen", "Learn a concept")}</h3>
            <p>{t("Fundamente aufbauen mit klaren Einführungen und Beispielspielen.", "Build fundamentals with clear introductions and example games.")}</p>
            <div className="home-links">
              <button type="button" className="home-link" onClick={() => setActivePage("learn-simultaneous")}>
                {t("Simultane Entscheidungen", "Simultaneous decisions")}
              </button>
              <button type="button" className="home-link" onClick={() => setActivePage("learn-sequential")}>
                {t("Sequenzielle Entscheidungen", "Sequential decisions")}
              </button>
              <button type="button" className="home-link" onClick={() => setActivePage("learn-private")}>
                {t("Private Informationen bei simultanen Entscheidungen", "Private information in simultaneous decisions")}
              </button>
            </div>
          </article>

          <article className="panel home-card">
            <h3>{t("Spiel lösen", "Solve a game")}</h3>
            <p>{t("Aufgaben mit Feedback lösen und Schritt für Schritt sicherer werden.", "Solve exercises with feedback and improve step by step.")}</p>
            <div className="home-links">
              <button
                type="button"
                className="home-link split-link"
                onClick={() => {
                  setActivePage("solve-normal");
                  setNormalPage("toc");
                }}
              >
                <span>{t("Simultane Spiele (Normalform)", "Simultaneous games (normal form)")}</span>
                <span className="home-link-count">{solvedCountLabel([
                    "normal_ex1",
                    "normal_ex2",
                    "normal_ex3",
                    "normal_ex4",
                    "normal_ex5",
                    "normal_ex6",
                    "normal_ex7",
                    "normal_ex8",
                    "normal_ex9"
                  ])}
                </span>
              </button>
              <button
                type="button"
                className="home-link split-link"
                onClick={() => {
                  setActivePage("solve-tree");
                  setTreePage("toc");
                }}
              >
                <span>{t("Sequenzielle Spiele (Extensivform)", "Sequential games (extensive form)")}</span>
                <span className="home-link-count">{solvedCountLabel(["tree_ex1_easy", "tree_ex1_hard", "tree_ex2_easy", "tree_ex2_hard", "tree_ex6", "tree_ex3", "tree_ex4", "tree_ex5_2", "tree_ex5_3", "tree_ex8"])}</span>
              </button>
              <button
                type="button"
                className="home-link split-link"
                onClick={() => {
                  setActivePage("solve-bayesian");
                  setBayesPage("toc");
                }}
              >
                <span>{t("Spiele mit privaten Informationen (Bayes)", "Games with private information (Bayesian)")}</span>
                <span className="home-link-count">{solvedCountLabel(["bayes_ex1", "bayes_ex2a", "bayes_ex2b"])}</span>
              </button>
            </div>
          </article>

          <article className="panel home-card home-card-wide">
            <h3>{t("Extra", "Extra")}</h3>
            <p>
              {t("Fünf klassische Normalformspiele mit Matrix, strategischer Logik und Gleichgewichtsprofilen.", "Five classic normal-form games with matrix representation, strategic logic, and equilibrium profiles.")}
            </p>
            <button type="button" className="home-link" onClick={() => setActivePage("extra-special")}>
              {t("Zu den besonderen Spielen", "Go to special games")}
            </button>
          </article>
        </section>
      </section>
    );
  }

  function renderContent() {
    if (activePage === "home") {
      return renderHome();
    }

    if (activePage === "learn-simultaneous") {
      return renderSimultaneousIntro();
    }

    if (activePage === "solve-normal") {
      return (
        <div
          className={`exercise-page-transition ${normalPageAnimDirection === "next" ? "dir-next" : "dir-prev"} ${normalPageAnimPhase === "exit" ? "is-exiting" : normalPageAnimPhase === "enter" ? "is-entering" : ""}`}
        >
          {renderNormalExercises()}
        </div>
      );
    }

    if (activePage === "learn-sequential") {
      return renderExtensiveIntro();
    }

    if (activePage === "solve-tree") {
      return (
        <div
          className={`exercise-page-transition ${treePageAnimDirection === "next" ? "dir-next" : "dir-prev"} ${treePageAnimPhase === "exit" ? "is-exiting" : treePageAnimPhase === "enter" ? "is-entering" : ""}`}
        >
          {renderTreeExercises()}
        </div>
      );
    }

    if (activePage === "learn-private") {
      return renderBayesianIntro();
    }

    if (activePage === "solve-bayesian") {
      return (
        <div
          className={`exercise-page-transition ${bayesPageAnimDirection === "next" ? "dir-next" : "dir-prev"} ${bayesPageAnimPhase === "exit" ? "is-exiting" : bayesPageAnimPhase === "enter" ? "is-entering" : ""}`}
        >
          {renderBayesianExercises()}
        </div>
      );
    }

    if (activePage === "impressum") {
      return (
        <section className="panel impressum-wrap">
          <div className="impressum-head">
            <h2>{t("Impressum", "Imprint")}</h2>
            <p className="impressum-subtitle">
              {t(
                "Kontakt, Verantwortung und ein kurzer Überblick zur GameTheoryApp.",
                "Contact, responsibility, and a short overview of GameTheoryApp."
              )}
            </p>
            <p className="impressum-project-blurb">
              {t(
                "Die GameTheoryApp ist ein interaktives Lernprojekt für Spieltheorie: Studierende trainieren Normalform-, Bayes- und extensive Spiele mit direktem Feedback zu Nash-Gleichgewichten, Dominanz und Rückwärtsinduktion.",
                "GameTheoryApp is an interactive game-theory learning project: students practice normal-form, Bayesian, and extensive games with instant feedback on Nash equilibria, dominance, and backward induction."
              )}
            </p>
          </div>

          <div className="impressum-grid">
            <article className="impressum-card">
              <h3>{t("Verantwortlich", "Responsible")}</h3>
              <p className="impressum-main">Marion Ott, Jakob Sarrazin</p>
              <button
                type="button"
                className="inline-link-btn impressum-toggle"
                onClick={() => setShowImpressumEmail((v) => !v)}
              >
                {showImpressumEmail ? t("E-Mail ausblenden", "Hide email") : t("E-Mail anzeigen", "Show email")}
              </button>
              {showImpressumEmail && (
                <p className="impressum-detail">
                  <a href="mailto:sarrazin.jakob@gmail.com">sarrazin.jakob@gmail.com</a>
                </p>
              )}
            </article>

            <article className="impressum-card">
              <h3>{t("Institution", "Institution")}</h3>
              <p className="impressum-main">ZEW Mannheim</p>
              <button
                type="button"
                className="inline-link-btn impressum-toggle"
                onClick={() => setShowImpressumAddress((v) => !v)}
              >
                {showImpressumAddress ? t("Adresse ausblenden", "Hide address") : t("Adresse anzeigen", "Show address")}
              </button>
              {showImpressumAddress && (
                <p className="impressum-detail">
                  L 7, 1, 68161 Mannheim
                  <br />
                  <a href="https://www.zew.de/forschung/marktdesign" target="_blank" rel="noopener noreferrer">
                    zew.de/forschung/marktdesign
                  </a>
                </p>
              )}
            </article>

            <article className="impressum-card">
              <h3>{t("GitHub Repository", "GitHub Repository")}</h3>
              <p className="impressum-main">GameTheoryApp</p>
              <p className="impressum-detail impressum-detail-static">
                {t(
                  "React-Frontend, FastAPI-Backend, API-Endpunkte, spieltheoretischer Solver und automatisierte Tests.",
                  "Technical content: React frontend, FastAPI backend, API endpoints, game-theory solver, and automated tests."
                )}
              </p>
              <button
                type="button"
                className="inline-link-btn impressum-toggle"
                onClick={() => setShowImpressumProject((v) => !v)}
              >
                {showImpressumProject ? t("Link ausblenden", "Hide link") : t("Github-Link anzeigen", "Show GitHub link")}
              </button>
              {showImpressumProject && (
                <p className="impressum-detail">
                  <a href="https://github.com/JakobSar/GameTheoryApp" target="_blank" rel="noopener noreferrer">
                    github.com/JakobSar/GameTheoryApp
                  </a>
                </p>
              )}
            </article>
          </div>

          <p className="impressum-tagline">{t("Aus Mannheim für die Welt", "From Mannheim to the world")}</p>
        </section>
      );
    }

    if (activePage === "extra-special") {
      return renderSpecialGames();
    }

    return null;
  }

  return (
    <main className="page">
      <section className="hero">
        <div className="hero-meta">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setIsNavOpen((prev) => !prev)}
          >
            {isNavOpen ? t("Menü ausblenden", "Hide menu") : t("Menü einblenden", "Show menu")}
          </button>
          <button
            type="button"
            className="theme-toggle"
            onClick={() =>
              setThemeMode((prev) => {
                const currentIndex = THEME_MODES.indexOf(prev);
                return THEME_MODES[(currentIndex + 1) % THEME_MODES.length];
              })
            }
          >
            {themeMode === "light"
              ? t("Hellmodus", "Light mode")
              : themeMode === "dark"
                ? t("Darkmode", "Dark mode")
                : t("JLU Modus", "JLU mode")}
          </button>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setUiLang((prev) => (prev === "de" ? "en" : "de"))}
          >
            {uiLang === "de" ? "DE / EN" : "EN / DE"}
          </button>
        </div>
        <button
          type="button"
          className="brand-link"
          onClick={() => setActivePage("home")}
        >
          Game Theory Trainer
        </button>
      </section>

      <div className={isNavOpen ? "app-shell" : "app-shell nav-collapsed"}>
        <aside className={isNavOpen ? "panel side-nav" : "panel side-nav nav-hidden"}>
          {NAV.map((group) => (
            <div key={group.title.de} className="nav-group">
              <h3>{group.title[uiLang]}</h3>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={activePage === item.key ? "nav-item active" : "nav-item"}
                  onClick={() => {
                    setActivePage(item.key);
                    if (item.key === "solve-normal") {
                      setNormalPage("toc");
                    }
                    if (item.key === "solve-bayesian") {
                      setBayesPage("toc");
                    }
                    if (item.key === "solve-tree") {
                      setTreePage("toc");
                    }
                  }}
                >
                  {item.label[uiLang]}
                </button>
              ))}
            </div>
          ))}

          <div className="nav-group">
            <h3>{t("System", "System")}</h3>
            <button type="button" className={activePage === "impressum" ? "nav-item active" : "nav-item"} onClick={() => setActivePage("impressum")}>
              {t("Impressum", "Imprint")}
            </button>
          </div>
        </aside>

        <section
          ref={contentAreaRef}
          className="content-area"
        >
          {renderContent()}

          {exerciseSideNav && exerciseSideNav.prev && (
            <button
              type="button"
              className={`exercise-side-nav-btn left ${showLeftExerciseNav ? "visible" : ""}`}
              aria-label={t("Vorherige Übung", "Previous exercise")}
              style={{ left: `${leftNavX}px` }}
              onClick={() => exerciseSideNav.go(exerciseSideNav.prev)}
            >
              &#8249;
            </button>
          )}

          {exerciseSideNav && exerciseSideNav.next && (
            <button
              type="button"
              className={`exercise-side-nav-btn right ${showRightExerciseNav ? "visible" : ""}`}
              aria-label={t("Nächste Übung", "Next exercise")}
              style={{ left: `${rightNavX}px` }}
              onClick={() => exerciseSideNav.go(exerciseSideNav.next)}
            >
              &#8250;
            </button>
          )}

          {error && (
            <section className="panel error">
              <h2>Fehler</h2>
              <pre>{error}</pre>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
