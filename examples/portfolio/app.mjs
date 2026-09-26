import { metrics, analyse } from "./model.mjs";
const $ = (s) => document.querySelector(s),
    fmt = (n) =>
        new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(n),
    pct = (n) => (n === null ? "no sample" : (n * 100).toFixed(1) + "%");
let data, result;
$("#metric").innerHTML = Object.entries(metrics)
    .map(([k, m]) => `<option value="${k}">${m.label}</option>`)
    .join("");
function render() {
    const key = $("#metric").value,
        m = metrics[key],
        threshold = +$("#threshold").value,
        [lo, hi] = $("#duration").value.split(",").map(Number);
    result = analyse(data.matches, key, threshold, lo, hi);
    $("#lead-label").textContent = fmt(threshold) + " " + m.unit;
    $("#context").textContent = m.checkpoint
        ? "This condition is measured before the match ends. It still describes association, not what would happen if a team were given extra souls."
        : "This is an end-of-match statistic. Winning can itself increase this number, so do not read it as an in-game prediction.";
    $("#answer").textContent = result.n
        ? `+${fmt(threshold)} ${m.unit} · ${fmt(result.n)} matching games`
        : "No matches meet this condition. Lower the lead or include more match durations.";
    $("#win-rate").textContent = pct(result.p);
    $("#sample").textContent = fmt(result.n);
    $("#interval").textContent = result.ci
        ? result.ci.map((p) => Math.round(p * 100)).join("-") + "%"
        : "no sample";
    const w = 740,
        h = 205,
        left = 35,
        bottom = 170,
        width = (w - left) / 12;
    $("#chart-title").textContent = m.label + " / win rate by lead size";
    $("#chart").innerHTML =
        `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Win rate by lead size with confidence intervals">${[0, 0.5, 1].map((p) => `<line x1="35" x2="740" y1="${bottom - p * 145}" y2="${bottom - p * 145}" stroke="#3b4440"/><text x="0" y="${bottom - p * 145 + 4}" fill="#9caea2" font-size="10">${p * 100}%</text>`).join("")}${result.bins.map((b, i) => (b.n ? `<g><title>${fmt(b.lo)}-${fmt(b.hi)}: ${pct(b.p)}, n=${b.n}</title><rect x="${left + i * width + 5}" y="${bottom - b.p * 145}" width="${width - 10}" height="${b.p * 145}" fill="${b.lo >= threshold ? "#95b9a4" : "#4a6254"}"/><line x1="${left + (i + 0.5) * width}" x2="${left + (i + 0.5) * width}" y1="${bottom - b.ci[0] * 145}" y2="${bottom - b.ci[1] * 145}" stroke="#e6e0d4" stroke-width="2"/><text x="${left + (i + 0.5) * width}" y="190" text-anchor="middle" font-size="9" fill="#aab9af">${b.lo >= 1000 ? (b.lo / 1000).toFixed(1) + "k" : fmt(b.lo)}</text></g>` : "")).join("")}</svg>`;
    const shown = result.selected.slice(0, 400);
    $("#dots").innerHTML = shown
        .map(
            (r, i) =>
                `<button class="${r.leaderWon ? "win" : "loss"}" data-index="${i}" aria-label="Match ${r.id}, lead ${fmt(r.lead)}, ${r.leaderWon ? "won" : "lost"}"></button>`,
        )
        .join("");
    $("#dot-note").textContent = `${shown.length} shown · green held, red lost`;
    $("#dots").onclick = (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const r = shown[+b.dataset.index];
        $("#match-detail").textContent =
            `match ${r.id} / ${r.date} / ${(r.duration / 60).toFixed(1)} minutes / ${m.label} lead ${fmt(r.lead)} / leading team ${r.leaderWon ? "won" : "lost"}`;
    };
    window.__deadlock = { ready: true, result, records: data.matches.length };
}
$("#metric").onchange = () => {
    const m = metrics[$("#metric").value];
    $("#threshold").max = m.limit;
    $("#threshold").step = m.step;
    $("#threshold").value = 0;
    render();
};
$("#threshold").oninput = render;
$("#duration").onchange = render;
$("#download").onclick = () => {
    const keys = ["id", "date", "duration", "lead", "leaderWon"],
        text = [
            keys.join(","),
            ...result.selected.map((r) => keys.map((k) => r[k]).join(",")),
        ].join("\n"),
        url = URL.createObjectURL(new Blob([text], { type: "text/csv" })),
        a = document.createElement("a");
    a.href = url;
    a.download = "deadlock-cohort.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
try {
    const r = await fetch("data/matches.json");
    if (!r.ok) throw Error(r.status);
    data = await r.json();
    $("#scope").textContent = `${fmt(data.matches.length)} matches`;
    render();
} catch (e) {
    $("#scope").textContent =
        "The match archive could not load. Reload to retry; no generated matches have been substituted.";
    throw e;
}
