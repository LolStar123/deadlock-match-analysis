# deadlock match analysis: working example

Change a metric threshold and compare conditional win rates with confidence intervals.

**[Open the demo](https://lolstar123.github.io/deadlock-match-analysis/)** · [Calculation / workflow code](model.mjs) · [Checks](model.test.mjs)

![Example output](preview.png)

## Run it

From the repository root, with Python 3 and Node.js 22:

```sh
python -m http.server 8000 --directory examples/portfolio
```

Open http://localhost:8000. Change an input, or edit the JSON fixture, then export the computed result as JSON or CSV.

```sh
node --test examples/portfolio/model.test.mjs
```

## What it does

Collect match data, take comparable checkpoints and split matches by a condition. Compare win rates for economy, damage, objectives and other stats, with sample sizes and uncertainty beside each result.

## Scope and source

Generated checkpoint fixtures. Associations do not establish that changing a stat causes a win.

deadlock_analytics/urn_checkpoint_analyze.py and scripts/deadlock_metrics_lib.py; fixed-clock comparisons and conditional analyses.

`model.mjs` is the small public implementation. `app.mjs` connects its inputs and outputs to the browser. No package install or network key is needed to run the example. GitHub Pages runs the same files after the checks pass.
