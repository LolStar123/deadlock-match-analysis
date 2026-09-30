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
        ? `+${fmt(threshold)} ${m.unit} · ${fmt(result.n)} matches · ${fmt(result.wins)} wins / ${fmt(result.n - result.wins)} losses`
        : "No matches meet this condition. Lower the lead or include more match durations.";
    $("#win-rate").textContent = pct(result.p);
    $("#sample").textContent = fmt(result.n);
    $("#interval").textContent = result.ci
        ? result.ci.map((p) => Math.round(p * 100)).join("-") + "%"
        : "no sample";
    const mobile = matchMedia("(max-width: 650px)").matches,
        chart = $("#chart"),
        w = Math.max(mobile ? 320 : 640, Math.floor(chart.clientWidth || 740)),
        h = mobile ? 220 : 205,
        left = mobile ? 34 : 35,
        right = mobile ? 8 : 0,
        bottom = mobile ? 184 : 170,
        plotHeight = mobile ? 150 : 145,
        width = (w - left - right) / 12,
        axisFont = mobile ? 11 : 10,
        labelFont = mobile ? 10 : 9,
        showLabel = (i) => !mobile || i % 2 === 0;
    $("#chart-title").textContent = m.label + " / conditional win rate";
    $("#chart").innerHTML =
        `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Conditional win rate by lead size with Wilson confidence intervals">${[0, 0.5, 1].map((p) => `<line x1="${left}" x2="${w - right}" y1="${bottom - p * plotHeight}" y2="${bottom - p * plotHeight}" stroke="#3b4440"/><text x="2" y="${bottom - p * plotHeight + 4}" fill="#9caea2" font-size="${axisFont}">${p * 100}%</text>`).join("")}${result.bins.map((b, i) => { if (!b.n) return ""; const x = left + i * width + 4, barWidth = Math.max(2, width - 8), cx = left + (i + 0.5) * width, label = showLabel(i) ? `<text x="${cx}" y="${mobile ? 208 : 190}" text-anchor="middle" font-size="${labelFont}" fill="#aab9af">${b.lo >= 1000 ? (b.lo / 1000).toFixed(1) + "k" : fmt(b.lo)}</text>` : ""; return `<g><title>${fmt(b.lo)}-${fmt(b.hi)}: ${pct(b.p)}, n=${b.n}</title><rect rx="2" x="${x}" y="${bottom - b.p * plotHeight}" width="${barWidth}" height="${b.p * plotHeight}" fill="${b.lo >= threshold ? "#95b9a4" : "#4a6254"}"/><line x1="${cx}" x2="${cx}" y1="${bottom - b.ci[0] * plotHeight}" y2="${bottom - b.ci[1] * plotHeight}" stroke="#e6e0d4" stroke-width="2"/>${label}</g>`; }).join("")}</svg>`;
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
let resizeTimer;
addEventListener("resize", () => {
    if (!data) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 100);
}, { passive: true });
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
