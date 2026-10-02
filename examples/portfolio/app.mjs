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
        ? "Measured during play. Association does not establish causation."
        : "An end-of-match statistic. Winning can increase it; this is not a prediction.";
    $("#answer").textContent = result.n
        ? (m.checkpoint ? "Checkpoint comparison" : "End-of-match association")
        : "No matches meet this condition. Lower the lead or include more match durations.";
    $("#win-rate").textContent = pct(result.p);
    $("#win-rate").classList.toggle("empty", result.p === null);
    $("#sample").textContent = fmt(result.n);
    $("#interval").textContent = result.ci
        ? result.ci.map((p) => (p * 100).toFixed(1)).join(" to ") + "%"
        : "no sample";
    const short = (n) => n >= 1000 ? (n / 1000).toFixed(1) + "k" : fmt(n);
    $("#chart-title").textContent = "Win rate by lead size";
    const axis = '<div class="chart-axis"><span>Lead</span><div><span>0%</span><span>50%</span><span>100%</span></div><span>Win rate / n</span></div>';
    const drawBin = (b) => {
            const colour = b.lo >= threshold ? "#9fcabc" : "#8597a8";
            const marks = b.n ? `<line x1="${b.ci[0]*100}%" x2="${b.ci[1]*100}%" y1="13" y2="13" stroke="${colour}" stroke-width="2"/><circle cx="${b.p*100}%" cy="13" r="3" fill="${colour}"/>` : "";
            return `<div class="bin ${b.lo >= threshold ? "selected" : ""}"><span>${short(b.lo)} to ${short(b.hi)}</span><svg role="img" aria-label="${b.n ? pct(b.p) + ', 95% interval ' + b.ci.map(pct).join(' to ') + ', ' + b.n + ' matches' : 'No matches in this lead range'}"><line x1="0" x2="100%" y1="13" y2="13" stroke="#39434e" stroke-width="1"/><line x1="50%" x2="50%" y1="3" y2="23" stroke="#53606d" stroke-dasharray="2 3"/>${marks}</svg><span class="bin-value">${pct(b.p)}<small>n = ${fmt(b.n)}</small></span></div>`;
        };
    const ordinary = result.bins.filter((b) => b.n >= 10), sparse = result.bins.filter((b) => b.n < 10);
    $("#chart").innerHTML = axis + ordinary.map(drawBin).join("") +
        (sparse.length ? `<details class="sparse-bins"><summary>Show ${sparse.length} small cohorts (fewer than 10 matches)</summary><p class="chart-note">Small samples have wider uncertainty. Every original range is shown below.</p>${axis}${sparse.map(drawBin).join("")}</details>` : "");
    const shown = result.selected.slice(0, 400);
    $("#dots").innerHTML = shown
        .map(
            (r, i) =>
                `<button class="${r.leaderWon ? "win" : "loss"}" data-index="${i}" aria-label="Match ${r.id}, lead ${fmt(r.lead)}, ${r.leaderWon ? "won" : "lost"}"></button>`,
        )
        .join("");
    $("#dot-note").textContent = `${shown.length} of ${fmt(result.n)} shown · green won, red lost. Export includes all matching games.`;
    const inDuration = data.matches.filter((r) => r.duration / 60 >= lo && r.duration / 60 < hi).length;
    $("#coverage").textContent = `${fmt(inDuration - result.eligible)} games excluded in this duration range: tied or missing observations.`;
    $("#match-detail").textContent = "Choose a match to inspect its lead and outcome.";
    $("#download").disabled = !result.n;
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
    $("#scope").textContent = `${fmt(data.matches.length)} complete matches / 26 May to 5 June 2026`;
    document.querySelectorAll("select, input, #download").forEach((el) => el.disabled = false);
    render();
} catch (e) {
    $("#scope").textContent =
        "The match archive could not load. Reload to retry; no generated matches have been substituted.";
    $("#answer").textContent = "Reload this page to retry the archive.";
}
