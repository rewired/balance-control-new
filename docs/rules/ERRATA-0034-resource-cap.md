# ERRATA-0034 — Resort supply cap

Date: 2026-11-10
Status: Implemented
Applies to: CORE-01-07-04A
Decision: [DD-0038](../design-decisions/DD-0038-tactical-depth-variants.md)

At the end of every regular or final Round Settlement, each player keeps up to 12 Resources in each active resort. Transfer the excess in each resort directly to Noise. Apply the cap after all production, receipt limits, and other Settlement effects. A victory that ends the game before Settlement follows CORE-01-09-00.

If a player holds 11 INF and receives 4 INF during Settlement, they keep 12 INF and transfer 3 INF to Noise. Resolve each resort independently.

New matches record the rule at setup. Existing saved matches and replays use their recorded rules. The playtest in DD-0038 used ERRATA-0033 and FreeMeasurePickup as its common baseline.
