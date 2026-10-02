import test from "node:test";
import assert from "node:assert/strict";
import { analyse, interval } from "./model.mjs";
import { readFileSync } from "node:fs";
test("one observation per match; ties and missing values excluded", () => {
    const r = analyse(
        [
            { id: 1, win: 1, nw_600: 100, duration: 900 },
            { id: 2, win: 1, nw_600: -200, duration: 900 },
            { id: 3, win: 0, nw_600: 0, duration: 900 },
            { id: 4, win: 0, nw_600: null, duration: 900 },
        ],
        "nw_600",
    );
    assert.equal(r.n, 2);
    assert.equal(r.p, 0.5);
    assert.equal(
        r.bins.reduce((s, b) => s + b.n, 0),
        2,
    );
});
test("Wilson interval and no-data case", () => {
    assert.equal(interval(0, 0), null);
    assert.ok(interval(5, 10)[0] < 0.5 && interval(5, 10)[1] > 0.5);
    assert.ok(interval(10, 10)[1] <= 1.0000001);
});
test("real census is unique, complete and changes with the condition", () => {
    const d = JSON.parse(
        readFileSync(new URL("./data/matches.json", import.meta.url)),
    );
    assert.equal(new Set(d.matches.map((r) => r.id)).size, d.matches.length);
    assert.ok(d.matches.length > 11000);
    const a = analyse(d.matches, "nw_600"),
        b = analyse(d.matches, "nw_600", 5000);
    assert.ok(a.n > b.n && b.n > 0);
    assert.notEqual(a.p, b.p);
    assert.ok(a.n < d.matches.length);
});
test("adjacent duration cohorts do not double-count boundary matches", () => {
    const rows = [1499, 1500, 2399, 2400].map((duration, id) => ({ id, duration, win: 1, nw_600: 100 }));
    const cohorts = [[0, 25], [25, 40], [40, 120]].map(([lo, hi]) => analyse(rows, "nw_600", 0, lo, hi));
    assert.deepEqual(cohorts.map((r) => r.n), [1, 2, 1]);
    assert.equal(new Set(cohorts.flatMap((r) => r.selected.map((m) => m.id))).size, 4);
    assert.throws(() => analyse(rows, "nw_600", 0, 40, 25));
    assert.throws(() => analyse(rows, "nw_600", 0, NaN, 25));
});
