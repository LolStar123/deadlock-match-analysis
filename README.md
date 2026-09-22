# deadlock match analysis

Compares match conditions to find which stats are most associated with winning.

<!-- working-example:start -->
## Try it in a minute

**[Live example](https://lolstar123.github.io/deadlock-match-analysis/)** · [Example code](examples/portfolio/model.mjs) · [Run locally](examples/portfolio/README.md) · [Atul's website](https://atul-kanodia-fieldnotes.atulswaggalicious.chatgpt.site)

Change a metric threshold and compare conditional win rates with confidence intervals.

<img src="examples/portfolio/preview.png" alt="deadlock match analysis example inputs and calculated output" width="760">

<!-- working-example:end -->

## The project

Collect match data, take comparable checkpoints and split matches by a condition. Compare win rates for economy, damage, objectives and other stats, with sample sizes and uncertainty beside each result.

The urn was one question. The bigger question was what actually matters.

## Find your way around

| Path | What is here |
| --- | --- |
| [examples/portfolio](examples/portfolio) | Runnable browser example and fixtures |
| [model.mjs](examples/portfolio/model.mjs) | Actual calculation or workflow |
| [model.test.mjs](examples/portfolio/model.test.mjs) | Reproducible checks and edge cases |
| [PROVENANCE.md](PROVENANCE.md) | How this example relates to the full project |
| [AGENTS.md](AGENTS.md) | Instructions for extending the example |

## Quick start

```sh
python -m http.server 8000 --directory examples/portfolio
node --test examples/portfolio/model.test.mjs
```

Open http://localhost:8000. No dependencies, accounts or API keys needed.

## What is included

Generated checkpoint fixtures. Associations do not establish that changing a stat causes a win.
