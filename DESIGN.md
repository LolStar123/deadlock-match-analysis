# Deadlock analysis demo design

The page answers one question at a time: when a team leads in a measurable stat, how often does it win?

The interface uses the real 11,423-match census. A stat selector, minimum lead and duration filter define the cohort. The answer, sample size and Wilson interval appear before the distribution, so a large percentage cannot hide a tiny sample. Matching games remain inspectable and exportable.

The visual language borrows Deadlock's murky green and red without copying its HUD. Monospace labels make the page feel like match telemetry; the large blunt headline keeps it understandable to someone who has never played.

Rules:

- One game is one observation.
- Missing checkpoints and ties stay excluded.
- End-state statistics are clearly labelled as associations.
- Sample size and uncertainty stay beside every win rate.
- Desktop and mobile must expose the same controls without horizontal overflow.
