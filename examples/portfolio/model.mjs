let seed = 937;
const rand = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const matches = Array.from({ length: 480 }, (_, n) => {
  const economy = Math.round(rand() * 16000 - 8000),
    damage = Math.round(rand() * 10000 - 5000),
    objectives = Math.floor(rand() * 7) - 3;
  return {
    id: "fixture-" + n,
    minute: 15,
    economy,
    damage,
    objectives,
    won:
      rand() <
      1 / (1 + Math.exp(-economy / 6500 - damage / 7000 - objectives * 0.17)),
  };
});
export const defaults = { metric: "economy", threshold: 1000, matches };
export const controls = [
  {
    key: "metric",
    label: "15-minute team lead",
    type: "select",
    options: ["economy", "damage", "objectives"],
  },
  {
    key: "threshold",
    label: "Condition: lead at least",
    type: "number",
    min: -20000,
    max: 20000,
    step: 1,
  },
];
export function interval(wins, n) {
  if (!n) return null;
  const z = 1.959963984540054,
    p = wins / n,
    d = 1 + (z * z) / n,
    c = (p + (z * z) / (2 * n)) / d,
    h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}
export function group(matches) {
  const n = matches.length,
    wins = matches.filter((r) => r.won).length;
  return { n, wins, rate: n ? wins / n : null, interval: interval(wins, n) };
}
export function analyse(matches, metric, threshold) {
  if (
    !["economy", "damage", "objectives"].includes(metric) ||
    !Number.isFinite(threshold)
  )
    throw Error("Choose a known checkpoint metric and finite threshold.");
  const yes = matches.filter((r) => r[metric] >= threshold),
    no = matches.filter((r) => r[metric] < threshold);
  return { yes: group(yes), no: group(no), all: group(matches) };
}
export function run(i) {
  const r = analyse(i.matches, i.metric, i.threshold),
    pct = (x) => (x === null ? "no sample" : (x * 100).toFixed(1) + "%");
  return {
    summary: `P(win | ${i.metric} lead ≥ ${i.threshold})`,
    metrics: {
      "condition win rate": pct(r.yes.rate),
      "comparison win rate": pct(r.no.rate),
      "matching matches": r.yes.n,
      "fixed checkpoint": "15 minutes",
    },
    columns: ["group", "matches", "wins", "win rate", "95% Wilson interval"],
    rows: [
      ["condition", r.yes],
      ["comparison", r.no],
      ["all matches", r.all],
    ].map(([name, g]) => [
      name,
      g.n,
      g.wins,
      pct(g.rate),
      g.interval ? g.interval.map(pct).join(" to ") : "no sample",
    ]),
    steps: [
      "Collect one team record per match",
      "Compare the same game-clock checkpoint",
      "Split by the selected condition",
      "Report both denominators and uncertainty",
    ],
    artifact: r,
  };
}
