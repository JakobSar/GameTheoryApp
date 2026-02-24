import { useEffect, useMemo, useState } from "react";

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

const ELIMINATOR_PRESETS = [
  {
    rows: ["A", "B", "C"],
    cols: ["X", "Y", "Z"],
    payoffs: {
      "A|X": [6, 2],
      "A|Y": [6, 3],
      "A|Z": [6, 1],
      "B|X": [4, 2],
      "B|Y": [4, 3],
      "B|Z": [4, 1],
      "C|X": [5, 0],
      "C|Y": [5, 1],
      "C|Z": [5, 2]
    }
  },
  {
    rows: ["A", "B", "C"],
    cols: ["X", "Y", "Z"],
    payoffs: {
      "A|X": [7, 1],
      "A|Y": [7, 4],
      "A|Z": [7, 2],
      "B|X": [5, 1],
      "B|Y": [5, 4],
      "B|Z": [5, 2],
      "C|X": [6, 0],
      "C|Y": [6, 3],
      "C|Z": [6, 5]
    }
  }
];

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

const TREE_EX1_CHOICES = [
  { id: "ax" },
  { id: "ay" },
  { id: "rx" },
  { id: "ry" }
];

const NAV = [
  {
    title: { de: "Konzept lernen", en: "Learn a concept" },
    items: [
      { key: "learn-simultaneous", label: { de: "Simultane Entscheidungen", en: "Simultaneous decisions" } },
      { key: "learn-sequential", label: { de: "Sequenzielle Entscheidungen", en: "Sequential decisions" } },
      { key: "learn-private", label: { de: "Private Informationen", en: "Private information" } }
    ]
  },
  {
    title: { de: "Spiel lösen", en: "Solve a game" },
    items: [
      { key: "solve-normal", label: { de: "Normalformspiele", en: "Normal-form games" } },
      { key: "solve-tree", label: { de: "Spielbäume", en: "Game trees" } },
      { key: "solve-bayesian", label: { de: "Bayes-Spiele", en: "Bayesian games" } }
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
    const correctChoiceId =
      p1Action === "L" ? (p2Action === "X" ? "ax" : "ay") : p2Action === "X" ? "rx" : "ry";
    const swapPlayers = Math.random() < 0.5;

    return {
      payoffLX,
      payoffLY,
      payoffR,
      p2Action,
      p1Action,
      correctChoiceId,
      swapPlayers
    };
  }
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

function NormalGameTable({ game, rowLabel = "Spieler 1", colLabel = "Spieler 2" }) {
  if (!game) {
    return <p className="hint">Kein Spiel geladen.</p>;
  }
  const shortRowLabels = game.rows.every((r) => r.length <= 3);
  const longSideLabel = rowLabel.length > 12;
  const tableClass = [
    "matrix-table",
    game.rows.length === 2 ? "matrix-table-two-rows" : "",
    shortRowLabels ? "compact-row-labels" : "",
    longSideLabel ? "long-side-label" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="matrix-wrap">
      <table className={tableClass}>
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
  );
}

function StaticPayoffTable({ data, rowLabel = "Player 1", colLabel = "Player 2" }) {
  const shortRowLabels = data.rows.every((r) => r.length <= 3);
  const longSideLabel = rowLabel.length > 12;
  const tableClass = [
    "matrix-table",
    data.rows.length === 2 ? "matrix-table-two-rows" : "",
    shortRowLabels ? "compact-row-labels" : "",
    longSideLabel ? "long-side-label" : ""
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="matrix-wrap">
      <table className={tableClass}>
        <thead>
          <tr>
            <th colSpan={2} />
            <th colSpan={data.cols.length}>{colLabel}</th>
          </tr>
          <tr>
            <th />
            <th />
            {data.cols.map((c) => (
              <th key={c}>{c}</th>
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
              <th>{r}</th>
              {data.cols.map((c) => {
                const key = `${r}|${c}`;
                const value = data.payoffs[key];
                return <td key={key}>{value ? `(${value[0]}, ${value[1]})` : "-"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [uiLang, setUiLang] = useState(() => {
    if (typeof window === "undefined") {
      return "de";
    }
    const storedLang = window.localStorage.getItem("gt-lang");
    return storedLang === "en" ? "en" : "de";
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const storedTheme = window.localStorage.getItem("gt-theme");
    if (storedTheme === "dark") {
      return true;
    }
    if (storedTheme === "light") {
      return false;
    }
    return Boolean(window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  });
  const [activePage, setActivePage] = useState("home");
  const [isNavOpen, setIsNavOpen] = useState(true);
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
  const [treeEx1Game, setTreeEx1Game] = useState(() => buildTreeEx1Game());
  const [treeEx1Selected, setTreeEx1Selected] = useState("");
  const [treeEx1Feedback, setTreeEx1Feedback] = useState("");
  const [treeEx1FeedbackType, setTreeEx1FeedbackType] = useState("neutral");
  const [showImpressumEmail, setShowImpressumEmail] = useState(false);
  const [showImpressumAddress, setShowImpressumAddress] = useState(false);
  const [showImpressumProject, setShowImpressumProject] = useState(false);
  const [eliminatorGame, setEliminatorGame] = useState(() => ELIMINATOR_PRESETS[0]);
  const [eliminatorActiveRows, setEliminatorActiveRows] = useState(() => ELIMINATOR_PRESETS[0].rows);
  const [eliminatorActiveCols, setEliminatorActiveCols] = useState(() => ELIMINATOR_PRESETS[0].cols);
  const [eliminatorCheckIndex, setEliminatorCheckIndex] = useState(0);
  const [eliminatorDecisionCount, setEliminatorDecisionCount] = useState(1);
  const [eliminatorFeedback, setEliminatorFeedback] = useState("");
  const [eliminatorFeedbackType, setEliminatorFeedbackType] = useState("neutral");
  const [eliminatorShowWhy, setEliminatorShowWhy] = useState(false);
  const [eliminatorShowNash, setEliminatorShowNash] = useState(false);
  const [backwardStep, setBackwardStep] = useState(0);

  const endpoint = useMemo(() => {
    if (!apiBase.trim()) {
      return "/api/v1/game-tree/solve";
    }
    return `${apiBase.replace(/\/+$/, "")}/api/v1/game-tree/solve`;
  }, [apiBase]);

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
  const eliminatorMatrix = useMemo(
    () => buildReducedMatrix(eliminatorGame, eliminatorActiveRows, eliminatorActiveCols),
    [eliminatorGame, eliminatorActiveRows, eliminatorActiveCols]
  );
  const eliminatorNash = useMemo(
    () => computePureNash(eliminatorGame, eliminatorActiveRows, eliminatorActiveCols),
    [eliminatorGame, eliminatorActiveRows, eliminatorActiveCols]
  );

  const t = (deText, enText) => (uiLang === "de" ? deText : enText);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", isDarkMode);
    window.localStorage.setItem("gt-theme", isDarkMode ? "dark" : "light");
    return () => {
      document.body.classList.remove("dark-mode");
    };
  }, [isDarkMode]);

  useEffect(() => {
    setLegacyLang(uiLang);
    document.documentElement.lang = uiLang;
    window.localStorage.setItem("gt-lang", uiLang);
  }, [uiLang]);

  function apiUrl(path) {
    if (!apiBase.trim()) {
      return path;
    }
    return `${apiBase.replace(/\/+$/, "")}${path}`;
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
    const nextIndex = randomInt(0, ELIMINATOR_PRESETS.length - 1);
    const nextGame = ELIMINATOR_PRESETS[nextIndex];
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
      const response = await fetch(endpoint, {
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
      setError(err.message || "request failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadEx1() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/v1/exercises/ex1/new?lang=${legacyLang}`));
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
      setError(err.message || "exercise request failed");
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
      const response = await fetch(apiUrl("/api/v1/exercises/ex1/check"), {
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
    } catch (err) {
      setError(err.message || "exercise check failed");
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx2() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/v1/exercises/ex2/new?lang=${legacyLang}`));
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
      setError(err.message || "exercise request failed");
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
      const response = await fetch(apiUrl("/api/v1/exercises/ex2/check"), {
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
    } catch (err) {
      setError(err.message || "exercise check failed");
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx3() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/v1/exercises/ex3/new?lang=${legacyLang}`));
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
      setError(err.message || "exercise request failed");
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
      const response = await fetch(apiUrl("/api/v1/exercises/ex3/check"), {
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
    } catch (err) {
      setError(err.message || "exercise check failed");
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx4() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await fetch(apiUrl("/api/v1/exercises/ex4/new"));
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
      setError(err.message || "exercise request failed");
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
      const response = await fetch(apiUrl("/api/v1/exercises/ex4/check"), {
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
    } catch (err) {
      setError(err.message || "exercise check failed");
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx5() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/v1/exercises/ex5/new?lang=${legacyLang}`));
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
      setError(err.message || "exercise request failed");
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
      const response = await fetch(apiUrl("/api/v1/exercises/ex5/check"), {
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
    } catch (err) {
      setError(err.message || "exercise check failed");
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx6() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await fetch(apiUrl("/api/v1/exercises/ex6/new"));
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
      setError(err.message || "exercise request failed");
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
      const response = await fetch(apiUrl("/api/v1/exercises/ex6/check"), {
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
    } catch (err) {
      setError(err.message || "exercise check failed");
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx7() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/v1/exercises/ex7/new?lang=${legacyLang}`));
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
      setError(err.message || "exercise request failed");
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
      const response = await fetch(apiUrl("/api/v1/exercises/ex7/check"), {
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
    } catch (err) {
      setError(err.message || "exercise check failed");
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx8() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/v1/exercises/ex8/new?lang=${legacyLang}`));
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
      setError(err.message || "exercise request failed");
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
      const response = await fetch(apiUrl("/api/v1/exercises/ex8/check"), {
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
    } catch (err) {
      setError(err.message || "exercise check failed");
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadEx9() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await fetch(apiUrl("/api/v1/exercises/ex9/new"));
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
      setError(err.message || "exercise request failed");
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
      const response = await fetch(apiUrl("/api/v1/exercises/ex9/check"), {
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
    } catch (err) {
      setError(err.message || "exercise check failed");
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadBayesEx1() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await fetch(apiUrl("/api/v1/exercises/bayes/ex1/new"));
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
      setError(err.message || "exercise request failed");
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
      const response = await fetch(apiUrl("/api/v1/exercises/bayes/ex1/check"), {
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
    } catch (err) {
      setError(err.message || "exercise check failed");
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadBayesEx2a() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await fetch(apiUrl("/api/v1/exercises/bayes/ex2a/new"));
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
      setError(err.message || "exercise request failed");
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
      const response = await fetch(apiUrl("/api/v1/exercises/bayes/ex2a/check"), {
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
    } catch (err) {
      setError(err.message || "exercise check failed");
    } finally {
      setLegacyLoading(false);
    }
  }

  async function loadBayesEx2b() {
    setError("");
    setLegacyLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/v1/exercises/bayes/ex2b/new?lang=${legacyLang}`));
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
      setError(err.message || "exercise request failed");
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
      const response = await fetch(apiUrl("/api/v1/exercises/bayes/ex2b/check"), {
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
    } catch (err) {
      setError(err.message || "exercise check failed");
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

  function resetTreeEx1() {
    setTreeEx1Game(buildTreeEx1Game());
    setTreeEx1Selected("");
    setTreeEx1Feedback("");
    setTreeEx1FeedbackType("neutral");
  }

  function checkTreeEx1() {
    const firstPlayer = treeEx1Game.swapPlayers ? t("Spieler 2", "Player 2") : t("Spieler 1", "Player 1");
    const secondPlayer = treeEx1Game.swapPlayers ? t("Spieler 1", "Player 1") : t("Spieler 2", "Player 2");
    if (!treeEx1Selected) return;
    if (treeEx1Selected === treeEx1Game.correctChoiceId) {
      setTreeEx1FeedbackType("success");
      setTreeEx1Feedback(
        `${t("Richtig.", "Correct.")} ${secondPlayer} ${t("wählt nach L die Aktion", "chooses action")} ${treeEx1Game.p2Action} (${treeEx1Game.payoffLX.u2} vs. ${treeEx1Game.payoffLY.u2}). ` +
          `${t("Danach vergleicht", "Then")} ${firstPlayer} L -> ${
            treeEx1Game.p2Action === "X" ? treeEx1Game.payoffLX.u1 : treeEx1Game.payoffLY.u1
          } ${t("mit", "with")} R -> ${treeEx1Game.payoffR.u1} ${t("und wählt", "and chooses")} ${treeEx1Game.p1Action}.`
      );
      return;
    }
    setTreeEx1FeedbackType("error");
    setTreeEx1Feedback(
      `${t("Nicht korrekt.", "Not correct.")} ${t("Nutze Rückwärtsinduktion:", "Use backward induction:")} ${secondPlayer} ${t("bevorzugt nach L die Aktion", "prefers action")} ${treeEx1Game.p2Action}. ` +
        `${t("Dann wählt", "Then")} ${firstPlayer} ${treeEx1Game.p1Action}.`
    );
  }

  function renderTreeExercises() {
    const firstPlayer = treeEx1Game.swapPlayers ? t("Spieler 2", "Player 2") : t("Spieler 1", "Player 1");
    const secondPlayer = treeEx1Game.swapPlayers ? t("Spieler 1", "Player 1") : t("Spieler 2", "Player 2");
    const firstNodeLabel = treeEx1Game.swapPlayers ? "P2" : "P1";
    const secondNodeLabel = treeEx1Game.swapPlayers ? "P1" : "P2";
    const choiceLabel = (id) => {
      if (id === "ax") return t("Strategieprofil:", "Strategy profile:") + ` ${firstPlayer} ${t("spielt", "plays")} L; ${secondPlayer} ${t("spielt", "plays")} X ${t("nach L", "after L")}.`;
      if (id === "ay") return t("Strategieprofil:", "Strategy profile:") + ` ${firstPlayer} ${t("spielt", "plays")} L; ${secondPlayer} ${t("spielt", "plays")} Y ${t("nach L", "after L")}.`;
      if (id === "rx") return t("Strategieprofil:", "Strategy profile:") + ` ${firstPlayer} ${t("spielt", "plays")} R; ${secondPlayer} ${t("spielt", "plays")} X ${t("nach L", "after L")}.`;
      return t("Strategieprofil:", "Strategy profile:") + ` ${firstPlayer} ${t("spielt", "plays")} R; ${secondPlayer} ${t("spielt", "plays")} Y ${t("nach L", "after L")}.`;
    };

    if (treePage === "toc") {
      return (
        <section className="panel">
          <h2>{t("Übersicht Spielbäume", "Game trees overview")}</h2>
          <h3>{t("Teil 1: Grundlagen", "Part 1: Fundamentals")}</h3>
          <div className="exercise-link-grid">
            <button
              type="button"
              className="exercise-link"
              onClick={() => {
                resetTreeEx1();
                setTreePage("ex1");
              }}
            >
              {t("Übung 1 – Einfaches sequenzielles Spiel", "Exercise 1 - Simple sequential game")}
            </button>
          </div>
        </section>
      );
    }

    return (
      <section className="panel">
        <h2>{t("Übung 1 – Einfaches sequenzielles Spiel", "Exercise 1 - Simple sequential game")}</h2>
        <div className="exercise-layout tree-ex-layout">
          <article className="panel nested-panel">
            <h3>{t("Spiel", "Game")}</h3>
            <p className="hint">
              {firstPlayer} {t("entscheidet zuerst zwischen", "moves first between")} <code>L</code> {t("und", "and")} <code>R</code>. {t("Nach", "After")} <code>L</code> {secondPlayer} {t("entscheidet zwischen", "chooses between")} <code>X</code> {t("und", "and")} <code>Y</code>.
            </p>
            <div className="tree-example-wrap tree-example-wrap-compact">
              <svg viewBox="0 0 560 250" className="tree-example-svg tree-example-svg-compact" role="img" aria-label="Einfacher Spielbaum">
                <defs>
                  <marker id="tree-arrow-ex1" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <path d="M0,0 L8,3 L0,6 Z" className="tree-arrow" />
                  </marker>
                </defs>

                <line x1="65.2" y1="124.4" x2="192.8" y2="87.6" className="tree-edge" markerEnd="url(#tree-arrow-ex1)" />
                <line x1="64.4" y1="137.9" x2="209.0" y2="200.2" className="tree-edge" markerEnd="url(#tree-arrow-ex1)" />
                <line x1="231.9" y1="79.9" x2="408.1" y2="61.3" className="tree-edge" markerEnd="url(#tree-arrow-ex1)" />
                <line x1="231.1" y1="87.8" x2="408.5" y2="141.5" className="tree-edge" markerEnd="url(#tree-arrow-ex1)" />

                <text x="129.0" y="106.0" className="tree-action" textAnchor="middle" dominantBaseline="middle">L</text>
                <text x="136.7" y="169.0" className="tree-action" textAnchor="middle" dominantBaseline="middle">R</text>
                <text x="320.0" y="70.6" className="tree-action" textAnchor="middle" dominantBaseline="middle">X</text>
                <text x="319.8" y="114.7" className="tree-action" textAnchor="middle" dominantBaseline="middle">Y</text>

                <circle cx="46" cy="130" r="20" className="tree-node decision" />
                <circle cx="212" cy="82" r="20" className="tree-node decision" />
                <circle cx="220" cy="205" r="12" className="tree-node terminal" />
                <circle cx="420" cy="60" r="12" className="tree-node terminal" />
                <circle cx="420" cy="145" r="12" className="tree-node terminal" />

                <text x="46" y="130" className="tree-label" textAnchor="middle" dominantBaseline="middle">{firstNodeLabel}</text>
                <text x="212" y="82" className="tree-label" textAnchor="middle" dominantBaseline="middle">{secondNodeLabel}</text>

                <rect x="238" y="190" width="96" height="30" rx="8" className="tree-payoff-bg" />
                <rect x="438" y="45" width="96" height="30" rx="8" className="tree-payoff-bg" />
                <rect x="438" y="130" width="96" height="30" rx="8" className="tree-payoff-bg" />

                <text x="286" y="205" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                  ({treeEx1Game.payoffR.u1}, {treeEx1Game.payoffR.u2})
                </text>
                <text x="486" y="60" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                  ({treeEx1Game.payoffLX.u1}, {treeEx1Game.payoffLX.u2})
                </text>
                <text x="486" y="145" className="tree-payoff" textAnchor="middle" dominantBaseline="middle">
                  ({treeEx1Game.payoffLY.u1}, {treeEx1Game.payoffLY.u2})
                </text>
              </svg>
            </div>
            <div className="actions">
              <button type="button" onClick={resetTreeEx1}>{t("Neues Spiel", "New game")}</button>
            </div>
          </article>

          <article className="panel nested-panel">
            <h3>{t("Frage", "Question")}</h3>
            <p className="hint">{t("Welches Strategieprofil ist teilspielperfekt?", "Which strategy profile is subgame-perfect?")}</p>
            <div className="choice-list">
              {TREE_EX1_CHOICES.map((choice) => (
                <label key={choice.id} className="choice-item">
                  <input
                    type="radio"
                    name="tree-ex1-choice"
                    value={choice.id}
                    checked={treeEx1Selected === choice.id}
                    onChange={(e) => setTreeEx1Selected(e.target.value)}
                  />
                  <span>{choiceLabel(choice.id)}</span>
                </label>
              ))}
            </div>
            <button type="button" onClick={checkTreeEx1} disabled={!treeEx1Selected}>{t("Antwort prüfen", "Check answer")}</button>
            {treeEx1Feedback && (
              <div className={`feedback-box feedback-card ${treeEx1FeedbackType}`}>
                <strong>{treeEx1FeedbackType === "success" ? t("Richtig", "Correct") : t("Nicht korrekt", "Not correct")}</strong>
                <p>{treeEx1Feedback}</p>
              </div>
            )}
          </article>
        </div>
        <div className="actions">
          <button type="button" onClick={() => setTreePage("toc")}>{t("Zurück zur Inhaltsseite", "Back to overview")}</button>
        </div>
      </section>
    );
  }

  function renderNormalExercises() {
    const exLinksTeil1 = [
      { key: "ex1", label: t("Übung 1 – Beste Antworten", "Exercise 1 - Best responses") },
      { key: "ex2", label: t("Übung 2 – Strikt dominante Strategien", "Exercise 2 - Strictly dominant strategies") },
      { key: "ex3", label: t("Übung 3 – Dominante Strategien (schwach oder strikt)", "Exercise 3 - Dominant strategies (weak or strict)") },
      { key: "ex4", label: t("Übung 4 – Nash-Gleichgewichte in reinen Strategien", "Exercise 4 - Nash equilibria in pure strategies") },
      { key: "ex5", label: t("Übung 5 – Nash-Gleichgewichte in reinen Strategien (strikt)", "Exercise 5 - Nash equilibria in pure strategies (strict)") },
      { key: "ex6", label: t("Übung 6 – Nash-Gleichgewicht in gemischten Strategien", "Exercise 6 - Nash equilibrium in mixed strategies") }
    ];
    const exLinksTeil2 = [
      { key: "ex7", label: t("Übung 1 – Trembling-Hand-Perfektion", "Exercise 1 - Trembling-hand perfection") },
      { key: "ex8", label: t("Übung 2 – Evolutionär stabile Strategien", "Exercise 2 - Evolutionarily stable strategies") }
    ];
    const exLinksTeil3 = [
      { key: "ex9", label: t("Übung 1 – Gemischtes Nash-Gleichgewicht im Marktauswahlspiel", "Exercise 1 - Mixed Nash equilibrium in the market selection game") }
    ];

    if (normalPage === "toc") {
      return (
        <section className="panel">
          <h2>{t("Trainiere Normalformspiele", "Train normal-form games")}</h2>
          <h3>{t("Teil 1: Grundlagen statischer Normalformspiele", "Part 1: Foundations of static simultaneous games")}</h3>
          <div className="exercise-link-grid">
            {exLinksTeil1.map((link) => (
              <button
                key={link.key}
                type="button"
                className="exercise-link"
                onClick={() => setNormalPage(link.key)}
              >
                {link.label}
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
                {link.label}
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
                {link.label}
              </button>
            ))}
          </div>
        </section>
      );
    }

    if (normalPage === "ex1") {
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
            <button type="button" onClick={() => setNormalPage("toc")}>{t("Zurück", "Back")}</button>
            <button type="button" onClick={() => setNormalPage("ex2")}>{t("Weiter zu Übung 2", "Next to Exercise 2")}</button>
          </div>
        </section>
      );
    }

    if (normalPage === "ex2") {
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
            <button type="button" onClick={() => setNormalPage("ex1")}>{t("Zurück", "Back")}</button>
            <button type="button" onClick={() => setNormalPage("ex3")}>{t("Weiter zu Übung 3", "Next to Exercise 3")}</button>
          </div>
        </section>
      );
    }

    if (normalPage === "ex3") {
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
            <button type="button" onClick={() => setNormalPage("ex2")}>{t("Zurück", "Back")}</button>
            <button type="button" onClick={() => setNormalPage("ex4")}>{t("Weiter zu Übung 4", "Next to Exercise 4")}</button>
          </div>
        </section>
      );
    }

    if (normalPage === "ex4") {
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
              <p className="hint">{t("Finden Sie alle Strategiekombinationen, die ein Nash-Gleichgewicht in reinen Strategien bilden.", "Find all strategy combinations that form a Nash equilibrium in pure strategies.")}</p>
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
            <button type="button" onClick={() => setNormalPage("ex3")}>{t("Zurück", "Back")}</button>
            <button type="button" onClick={() => setNormalPage("ex5")}>{t("Weiter zu Übung 5", "Next to Exercise 5")}</button>
          </div>
        </section>
      );
    }

    if (normalPage === "ex5") {
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
              <p className="hint">{t("Wählen Sie für jede Strategiekombination, ob es sich dabei um ein striktes oder nicht striktes Nash GG handelt.", "For each strategy combination, choose whether it is a strict or non-strict Nash equilibrium.")}</p>
              {ex5Data && (
                <>
                  <div className="matrix-wrap">
                    <table className="matrix-table ex5-table">
                      <thead>
                        <tr>
                          <th />
                          {ex5Data.game.cols.map((c) => (
                            <th key={c}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ex5Data.game.rows.map((r) => (
                          <tr key={r}>
                            <th>{r}</th>
                            {ex5Data.game.cols.map((c) => {
                              const key = `${r}|${c}`;
                              return (
                                <td key={key}>
                                  <select
                                    value={ex5Answers[key] || "no"}
                                    onChange={(e) => setEx5Answers((prev) => ({ ...prev, [key]: e.target.value }))}
                                  >
                                    {ex5Data.cell_choices.map((ch) => (
                                      <option key={ch.id} value={ch.id}>{ch.label}</option>
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
            <button type="button" onClick={() => setNormalPage("ex4")}>{t("Zurück", "Back")}</button>
            <button type="button" onClick={() => setNormalPage("ex6")}>{t("Weiter zu Übung 6", "Next to Exercise 6")}</button>
          </div>
        </section>
      );
    }

    if (normalPage === "ex6") {
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
                {t("Finden Sie ein Nash-Gleichgewicht in gemischten Strategien, in dem Spieler 1 mit Wahrscheinlichkeit p Strategie A wählt. Wie groß ist p?", "Find a Nash equilibrium in mixed strategies where Player 1 plays strategy A with probability p. What is p?")}
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
            <button type="button" onClick={() => setNormalPage("ex5")}>{t("Zurück", "Back")}</button>
            <button type="button" onClick={() => setNormalPage("ex7")}>{t("Weiter zu Teil 2", "Next to Part 2")}</button>
          </div>
        </section>
      );
    }

    if (normalPage === "ex7") {
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
              <p className="hint">{t("Bestimmen Sie die Trembling-hand-perfekten Gleichgewichte in reinen Strategien.", "Determine the trembling-hand perfect equilibria in pure strategies.")}</p>
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
            <button type="button" onClick={() => setNormalPage("ex6")}>{t("Zurück", "Back")}</button>
            <button type="button" onClick={() => setNormalPage("ex8")}>{t("Weiter zu Übung 2", "Next to Exercise 2")}</button>
          </div>
        </section>
      );
    }

    if (normalPage === "ex8") {
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
              <p className="hint">{t("Bestimmen Sie die Gleichgewichte in evolutionär stabilen Strategien (ESS), in reinen Strategien.", "Determine equilibria in evolutionarily stable strategies (ESS), in pure strategies.")}</p>
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
            <button type="button" onClick={() => setNormalPage("ex7")}>{t("Zurück", "Back")}</button>
            <button type="button" onClick={() => setNormalPage("ex9")}>{t("Weiter zu Teil 3", "Next to Part 3")}</button>
          </div>
        </section>
      );
    }

    if (normalPage === "ex9") {
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
            <button type="button" onClick={() => setNormalPage("ex8")}>{t("Zurück", "Back")}</button>
            <button type="button" onClick={() => setNormalPage("toc")}>{t("Zurück zur Inhaltsseite", "Back to table of contents")}</button>
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
        <h2>{t("Strategy Eliminator", "Strategy Eliminator")}</h2>
        <p className="hint">
          {t(
            "Trainiere schrittweise Eliminierung strikt dominierter Strategien. Erst wenn keine Eliminierung mehr möglich ist, wird Nash berechnet.",
            "Train step-by-step elimination of strictly dominated strategies. Nash is computed only after no further elimination is possible."
          )}
        </p>
        <div className="actions">
          <button type="button" onClick={resetEliminator}>
            {t("Neues Beispiel laden", "Load new example")}
          </button>
        </div>
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
        <StaticPayoffTable
          data={eliminatorMatrix}
          rowLabel={t("Spieler 1", "Player 1")}
          colLabel={t("Spieler 2", "Player 2")}
        />

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
      </section>
    );
  }

  function renderBackwardInductionCard() {
    const stepOneDone = backwardStep >= 1;
    const stepTwoDone = backwardStep >= 2;

    return (
      <section className="panel">
        <h2>{t("Backward Induction Solver", "Backward Induction Solver")}</h2>
        <p className="hint">
          {t(
            "Ziel: Verstehen, warum nur glaubwürdige Drohungen das Gleichgewicht bestimmen.",
            "Goal: understand why only credible threats determine equilibrium."
          )}
        </p>

        <div className="tree-example-wrap tree-example-wrap-compact">
          <svg viewBox="0 0 560 250" className="tree-example-svg tree-example-svg-compact" role="img" aria-label={t("Backward-Induction-Spielbaum", "Backward induction game tree")}>
            <defs>
              <marker id="bi-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <path d="M0,0 L8,3 L0,6 Z" className="tree-arrow" />
              </marker>
            </defs>

            <line x1="66.2" y1="122.5" x2="202.2" y2="65.5" className={`tree-edge ${stepTwoDone ? "bi-active" : ""}`} markerEnd="url(#bi-arrow)" />
            <line x1="66.8" y1="137.2" x2="193.6" y2="184.8" className="tree-edge" markerEnd="url(#bi-arrow)" />
            <line x1="231.5" y1="184.0" x2="409.2" y2="164.8" className={`tree-edge ${stepOneDone ? "bi-active bi-fight" : ""}`} markerEnd="url(#bi-arrow)" />
            <line x1="231.5" y1="186.4" x2="409.2" y2="214.8" className={`tree-edge ${stepOneDone ? "bi-muted" : ""}`} markerEnd="url(#bi-arrow)" />

            <text x="132" y="84" className="tree-action" textAnchor="middle" dominantBaseline="middle">Out</text>
            <text x="132" y="160" className="tree-action" textAnchor="middle" dominantBaseline="middle">In</text>
            <text x="320" y="168" className="tree-action" textAnchor="middle" dominantBaseline="middle">Fight</text>
            <text x="320" y="210" className="tree-action" textAnchor="middle" dominantBaseline="middle">Accommodate</text>

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
          <button type="button" onClick={prevBackwardStep} disabled={backwardStep <= 0}>{t("Schritt zurück", "Previous step")}</button>
          <button type="button" onClick={nextBackwardStep} disabled={backwardStep >= 2}>{t("Nächster Schritt", "Next step")}</button>
        </div>

        {backwardStep === 0 && (
          <p className="hint">
            {t("Schritt 1 startet am letzten Entscheidungsknoten von Spieler 2.", "Step 1 starts at the last decision node of Player 2.")}
          </p>
        )}
        {backwardStep === 1 && (
          <div className="feedback-box feedback-card info">
            <strong>{t("Schritt 1", "Step 1")}</strong>
            <p>{t("Spieler 2 wählt Fight, da 3 > 1.", "Player 2 chooses Fight because 3 > 1.")}</p>
          </div>
        )}
        {backwardStep === 2 && (
          <div className="feedback-box feedback-card success">
            <strong>{t("Schritt 2", "Step 2")}</strong>
            <p>
              {t(
                "Spieler 1 antizipiert Fight nach In und wählt daher Out. SPE-Pfad: Out. Nicht-glaubwürdige Drohung erkannt: (In, Accommodate).",
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
          <h2>{t("Einführung Normalformspiele", "Introduction Simultaneous games")}</h2>
          <p className="hint">
            {t(
              "Ein Normalformspiel beschreibt eine Situation, in der alle Spieler gleichzeitig eine Strategie wählen und daraus für jeden Spieler ein Nutzen  entsteht.",
              "A simultaneous game describes a situation in which all players choose a strategy at the same time and each player has a payoff from the outcome of the game."
            )}
          </p>

          <div className="intro-grid intro-grid-one-line intro-grid-3">
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
          </div>

          <div className="intro-grid intro-grid-one-line intro-grid-2">
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
                <li><code>u = (u₁, u₂)</code>: {t("Auszahlung (Spieler 1, Spieler 2).", "Payoff (Player 1, Player 2).")}</li>
              </ul>
            </section>
          </div>
        </section>

        {renderStrategyEliminatorCard()}
        <div className="actions">
          <button
            type="button"
            onClick={() => {
              setActivePage("solve-normal");
              setNormalPage("toc");
            }}
          >
            {t("Zu Normalformspielen", "Go to normal-form games")}
          </button>
        </div>
      </>
    );
  }

  function renderBayesianIntro() {
    return (
      <section className="panel">
        <h2>{t("Einführung in Bayes-Spiele", "Introduction to Bayesian games")}</h2>
        <p className="hint">
          {t(
            "Ein Bayes-Spiel beschreibt eine strategische Situation, in der Spieler gleichzeitig entscheiden, aber nicht vollständig über die Eigenschaften der anderen Spieler informiert sind. Jeder Spieler kennt vor seiner Entscheidung seinen eigenen Typ, während die Typen der anderen Spieler nur über eine gemeinsame Wahrscheinlichkeitsverteilung (common prior) beschrieben sind.",
            "A Bayesian game describes a strategic situation in which players decide simultaneously but are not fully informed about the characteristics of other players. Each player knows their own type before choosing, while other players' types are described by a common probability distribution (common prior)."
          )}
        </p>

        <div className="intro-grid intro-grid-one-line intro-grid-4">
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
        </div>

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

        <div className="actions">
          <button
            type="button"
            onClick={() => {
              setActivePage("solve-bayesian");
              setBayesPage("toc");
            }}
          >
            {t("Zu Bayes-Spielen", "Go to Bayesian games")}
          </button>
        </div>
      </section>
    );
  }

  function renderExtensiveIntro() {
    return (
      <>
      <section className="panel">
        <h2>{t("Einführung in Extensivspiele", "Introduction to extensive games")}</h2>
        <p className="hint">
          {t(
            "Extensive Games (Spielbäume) modellieren strategische Situationen mit zeitlicher Struktur: Entscheidungen werden nacheinander getroffen, nicht gleichzeitig.",
            "Extensive games (game trees) model strategic situations with temporal structure: decisions are made sequentially, not simultaneously."
          )}
        </p>

        <div className="intro-grid intro-grid-one-line intro-grid-4">
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
        </div>

        <div className="intro-grid intro-grid-one-line intro-grid-2">
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
              <li><code>N</code>: {t("Menge der Spieler.", "set of players.")}</li>
              <li><code>H</code>: {t("Menge der Knoten (Entscheidungsknoten und Endknoten).", "set of nodes (decision and terminal nodes).")}</li>
              <li><code>A(h)</code>: {t("verfügbare Aktionen am Knoten", "available actions at node")} <code>h</code>.</li>
              <li><code>P(h)</code>: {t("Spieler, der am Knoten", "player moving at node")} <code>h</code> {t("entscheidet.", ".")}</li>
              <li><code>u = (u₁, u₂, ...)</code>: {t("Auszahlungen in Endknoten.", "payoffs at terminal nodes.")}</li>
            </ul>
          </section>
        </div>
      </section>

      {renderBackwardInductionCard()}
      <div className="actions">
        <button
          type="button"
          onClick={() => {
            setActivePage("solve-tree");
            setTreePage("toc");
          }}
        >
          {t("Zu Spielbäumen", "Go to game trees")}
        </button>
      </div>
      </>
    );
  }

  function renderSpecialGames() {
    return (
      <section className="panel">
        <h2>Fünf besondere Spiele der Spieltheorie</h2>
        <p className="hint">Ein Beispielspiel (Strategien, Nutzen (u₁, u₂)), die zentrale Idee und typische Ergebnisse.</p>
        {SPECIAL_GAMES.map((g) => (
          <section className="panel nested-panel" key={g.title}>
            <h3>{g.title}</h3>
            <div className="special-row">
              <article className="panel nested-panel">
                <h4>Beispielspiel</h4>
                <p className="hint">{g.intro}</p>
                <StaticPayoffTable data={g.table} rowLabel="Spieler 1" colLabel="Spieler 2" />
              </article>
              <article className="panel nested-panel">
                <h4>Erklärung</h4>
                <ul className="intro-list">
                  {g.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </article>
            </div>
          </section>
        ))}
      </section>
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
    if (bayesPage === "toc") {
      return (
        <section className="panel">
          <h2>{t("Übersicht Bayes-Spiele", "Overview of Bayesian games")}</h2>
          <h3>{t("Teil 1: Grundlagen statischer Bayes-Spiele", "Part 1: Foundations of static Bayesian games")}</h3>
          <div className="exercise-link-grid">
            <button type="button" className="exercise-link" onClick={() => setBayesPage("ex1")}>
              {t("Übung 1 – Bayes-Spiel mit einseitiger privater Information", "Exercise 1 - Bayesian game with one-sided private information")}
            </button>
            <button type="button" className="exercise-link" onClick={() => setBayesPage("ex2a")}>
              {t("Übung 2a – A-posteriori Wahrscheinlichkeiten in Bayes-Spielen", "Exercise 2a - Posterior probabilities in Bayesian games")}
            </button>
            <button type="button" className="exercise-link" onClick={() => setBayesPage("ex2b")}>
              {t("Übung 2b – Bayes-Nash-Gleichgewichte bei zweiseitiger privater Information", "Exercise 2b - Bayesian Nash equilibria with two-sided private information")}
            </button>
          </div>
        </section>
      );
    }

    if (bayesPage === "ex1") {
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
            <button type="button" onClick={() => setBayesPage("toc")}>{t("Zurück zur Inhaltsseite", "Back to table of contents")}</button>
            <button type="button" onClick={() => setBayesPage("ex2a")}>{t("Weiter zu Übung 2a", "Next to Exercise 2a")}</button>
          </div>
        </section>
      );
    }

    if (bayesPage === "ex2a") {
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
            <button type="button" onClick={() => setBayesPage("ex1")}>{t("Zurück zu Übung 1", "Back to Exercise 1")}</button>
            <button type="button" onClick={() => setBayesPage("ex2b")}>{t("Weiter zu Übung 2b", "Next to Exercise 2b")}</button>
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
          <button type="button" onClick={() => setBayesPage("ex2a")}>{t("Zurück zu Übung 2a", "Back to Exercise 2a")}</button>
          <button type="button" onClick={() => setBayesPage("toc")}>{t("Zurück zur Inhaltsseite", "Back to table of contents")}</button>
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
                {t("Private Informationen", "Private information")}
              </button>
            </div>
          </article>

          <article className="panel home-card">
            <h3>{t("Spiel lösen", "Solve a game")}</h3>
            <p>{t("Aufgaben mit Feedback lösen und Schritt für Schritt sicherer werden.", "Solve exercises with feedback and improve step by step.")}</p>
            <div className="home-links">
              <button
                type="button"
                className="home-link"
                onClick={() => {
                  setActivePage("solve-normal");
                  setNormalPage("toc");
                }}
              >
                {t("Normalformspiele", "Normal-form games")}
              </button>
              <button type="button" className="home-link" onClick={() => setActivePage("solve-tree")}>
                {t("Spielbäume", "Game trees")}
              </button>
              <button
                type="button"
                className="home-link"
                onClick={() => {
                  setActivePage("solve-bayesian");
                  setBayesPage("toc");
                }}
              >
                {t("Bayes-Spiele", "Bayesian games")}
              </button>
            </div>
          </article>

          <article className="panel home-card home-card-wide">
            <h3>{t("Extra", "Extra")}</h3>
            <p>
              {t("Fünf klassische Spiele mit Intuition, Matrix und typischen Gleichgewichts-Ergebnissen.", "Five classic games with intuition, matrix representation, and typical equilibrium outcomes.")}
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
      return renderNormalExercises();
    }

    if (activePage === "learn-sequential") {
      return renderExtensiveIntro();
    }

    if (activePage === "solve-tree") {
      return renderTreeExercises();
    }

    if (activePage === "learn-private") {
      return renderBayesianIntro();
    }

    if (activePage === "solve-bayesian") {
      return renderBayesianExercises();
    }

    if (activePage === "impressum") {
      return (
        <section className="panel impressum-wrap">
          <div className="impressum-head">
            <h2>{t("Impressum", "Imprint")}</h2>
            <p className="impressum-subtitle">{t("Transparenz zu Verantwortlichen, Institution und Projekt.", "Transparency on responsible persons, institution, and project.")}</p>
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
              <h3>{t("Projekt", "Project")}</h3>
              <p className="impressum-main">GameTheoryApp</p>
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

          <p className="impressum-tagline">{t("Aus Mannheim für die Welt 🌍", "From Mannheim to the world 🌍")}</p>
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
            onClick={() => setIsDarkMode((prev) => !prev)}
          >
            {isDarkMode ? t("Hellmodus", "Light mode") : t("Darkmode", "Dark mode")}
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

        <section className="content-area">
          {renderContent()}

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
