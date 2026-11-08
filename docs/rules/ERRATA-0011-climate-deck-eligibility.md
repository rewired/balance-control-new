# ERRATA-0011 — ECO-dependent Climate Measure eligibility

Date: 2026-11-07
Status: Accepted
Applies to: EXP-03 v1.0, EXP-03-03 Setup
Decision: DD-0017, R11; approved by the user during the rules review.

Subsequent correction: R18 was separately approved on 2026-11-08 in ERRATA-0020-countdown-reserved.md. It excludes M14 and M15 unconditionally. Current eligible deck sizes are 13 with EXP-01 and 10 without; the original R11 counts and M15 eligibility recorded below are historical and superseded to that extent.

## Defect and design choice

EXP-03 could be used without EXP-01, but all fifteen Measures were included even though four had printed ECO costs. ECO does not exist when EXP-01 is inactive. An explicit substitution effect might permit payment in some circumstances, so these cards were not necessarily unplayable in every configuration; the missing decision was their intended setup eligibility.

## Approved correction

The authoritative correction is incorporated in `003-expansion03.md`:

- EXP-03-03-02 filters the deck before shuffling and includes one copy of each eligible Measure.
- EXP-03-03-02A includes Energy Crisis (M06), Technology Initiative (M09), Supply Chain Disruption (M11), and Future Committee (M15) only when EXP-01 is active. Otherwise these cards are outside the match material and no zone contains them.
- EXP-03-03-02B fixes eligibility at setup independently of later cost substitutions and preserves printed prices.
- EXP-03-03-02C specifies fifteen eligible cards with EXP-01 and eleven without it, before the unchanged three-card face-up setup.

No ECO resource state is introduced merely to support Climate cards. Excluded cards are not placed in Recycle or FinalDiscard; they are not match objects. Existing rule IDs are preserved.

## Examples for later implementation verification

1. CORE + EXP-03 starts with eleven Climate Measures, three open and eight in MeasureDrawPile. No excluded card can be taken or recycled later.
2. CORE + EXP-02 + EXP-03 uses the same eleven-card Climate set. A later Order Partnership does not introduce the four excluded cards.
3. With EXP-01 + EXP-03, all fifteen Climate Measures are included, three open and twelve in MeasureDrawPile; their printed ECO costs remain unchanged.

## Scope and implementation status

This original filter applied to the four specified cards and did not itself decide R18 or invent substitute prices. R18 subsequently reserved Countdown and excluded M14/M15; use EXP-03-03-02 through -02D and ERRATA-0020 for the current combined eligibility and deck counts.

Only rule documents are changed. Game code has not yet been adapted or verified against this setup filter. Other open DD-0017 proposals remain separate.
