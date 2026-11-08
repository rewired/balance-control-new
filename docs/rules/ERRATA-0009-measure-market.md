# ERRATA-0009 — Measure acquisition and market refill

Date: 2026-11-07
Status: Accepted
Applies to: EXP-01 v1.3, EXP-02 v1.0, EXP-03 v1.0
Decision: DD-0017, R09; approved by the user during the rules review.

## Defect

TakeMeasure had no specified selection source or card transfer. Market refill timing, recycling transfer, counter preservation, and exhausted markets were incomplete. A market could otherwise stay empty even after a played card became available for recycling.

## Approved correction

The authoritative procedure is defined once in `001-expansion01.md` and referenced for the separate EXP-02/EXP-03 zones:

- EXP-01-02-E-01/-01B define three fixed market slots, with up to three face-up cards after exhaustion.
- EXP-01-03-06 initializes play counters to zero and hands empty, consistent with setup distributing all cards into the draw pile and market.
- EXP-01-06-04 through -04D take one face-up card into the corresponding hand, respect the applicable hand limit and any explicit prohibition/additional cost, refill that market, and then end the turn. The base Resource cost is zero.
- EXP-01-07-05 transfers the full Recycle pile to the empty Draw pile and shuffles it with the seeded random state only when a needed refill draw requires it.
- EXP-01-07-05A/-05B refill after a successful Take and after a played card reaches its prescribed pile, in fixed slot order, before turn end or a granted extra action.
- EXP-01-07-05C permits empty slots when both available piles are exhausted and forbids taking from an empty market.
- EXP-01-07-05D preserves counters, separates expansions, and keeps FinalDiscard permanently out of circulation.
- EXP-02-07-01A and EXP-03-07-01A apply these procedures to their own cards and zones for otherwise permitted actions, without creating new playing windows.

Existing rule IDs and the two-play lifecycle are preserved. Definitions shared through references do not mix decks.

## Examples for later implementation verification

1. Taking one of three face-up cards moves it into the player's hand and fills exactly its vacated slot if a replacement is available.
2. If Draw and Recycle are empty, taking a card can leave only two face-up cards. Taking from a fully empty market is unavailable.
3. When a refill needs a card and Draw is empty, Recycle is transferred and shuffled, without resetting counters or importing FinalDiscard cards.
4. A market is empty and an initially unplayed hand card is successfully played. Its first-play move to Recycle triggers refill; it may immediately reappear face up with play counter 1, before the additional Political Action.
5. Taking that card again does not change its counter. Its second play sends it to FinalDiscard; it cannot refill a market afterward.
6. An EXP-02 acquisition/refill never transfers EXP-01 or EXP-03 cards.

## Scope and implementation status

R10 still decides independent action availability without EXP-01 and global versus per-expansion limits. This correction uses the applicable limits without deciding that question. R17 still governs active effect instances independent of card recycling. No reaction window or free-form new action is added.

Only rule documents are changed. Game code has not yet been adapted or verified against this correction. Other open DD-0017 proposals remain separate.
