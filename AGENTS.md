# Working on deadlock match analysis

Read PROVENANCE.md and examples/portfolio/README.md first.
Keep calculation and decision logic in model.mjs, independently runnable in Node.
Run `node --test examples/portfolio/model.test.mjs` after changes.
Keep generated fixtures labelled; never present sample outcomes as measured production results.
Preserve the project's workflow: Collect match data, take comparable checkpoints and split matches by a condition. Compare win rates for economy, damage, objectives and other stats, with sample sizes and uncertainty beside each result.
Add regression checks for changed decisions, including missing or invalid inputs.
Do not add credentials, user records or runtime account integrations to the demo.
