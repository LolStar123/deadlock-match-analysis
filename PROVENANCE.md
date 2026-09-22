# Data provenance

Source: Atul's existing `deadlock_analytics/urn_rows.jsonl` and `urn_checkpoints.jsonl`.
The export contains 11,423 complete games dated 2026-05-26 to 2026-06-05.
Only six players on each of two teams with complementary win flags are accepted.
Team 0 minus Team 1 differences are exported, without player/account identifiers.
Checkpoint differences are null unless all twelve players have the checkpoint.

The application uses one match per observation. Tied metrics are excluded from leader
comparisons. The plots show empirical bins, not a fitted or invented distribution.
Selection and missingness can bias comparisons. Final-game metrics are not pregame forecasts.
