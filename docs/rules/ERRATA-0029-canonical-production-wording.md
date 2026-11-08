# ERRATA-0029 — Complete canonical production wording

Date: 2026-11-08
Status: Accepted for R25b
Applies to: CORE-01 v1.0.14 and production interactions across active expansions
Decision: DD-0017, R25b; approved by the user during the rules review.

## Defect

EXP-03's production summary omitted EXP-01 output reductions, used undefined Overlay wording, and could suggest separate Climate/Regulation steps with intermediate floors. The canonical wording needed to place all additive output modifiers before one common floor and preserve recipient limits after ordinary distribution calculations.

## Approved correction

The authoritative correction is incorporated in `000-core.md`, `001-expansion01.md`, and `003-expansion03.md`:

- CORE-01-06-16-00 collects only eligible modifiers, respecting source-specific rules such as Investment Freeze.
- CORE-01-06-16(a)(2) applies expressly permitted doubling without creating new instances or stacking permission.
- CORE-01-06-16(a)(3)/(4) sum all applicable additive production output changes from active sources, including EXP-01, EXP-03, and Regulation output reductions such as SecurityLevel, then apply one minimum-0 floor. No intermediate source/expansion floor is introduced.
- Canonical majority, regular shares, original Noise remainder, receipt limits, and final transfers retain CORE-01-06-16(b)/(c)/-16A and R19.
- CORE-01-06-17 checks prohibitions first, retains R15a's automatic-production cost exemption, and excludes immediate Resource gains from the Resort Production pipeline.
- EXP-01-04-B-03, EXP-03-05-03/-04, and EXP-03-10-04 reference this one complete pipeline. The undefined Overlay category is explicitly resolved as Regulation, without introducing another object or calculation. Regulation cost/prohibition functions are not numeric output deductions.

Existing rule IDs remain available. Investment Freeze retains its accepted filtering; Supply Chain Disruption remains a recipient limit, not a Tile-output modifier. No additional Measure or Regulation instance is authorized.

## Examples for later implementation verification

1. Printed value 3, doubling, a Measure reduction of 1, and one SecurityLevel give output 4: 3×2−1−1.
2. With a positive A/B tie, those four allocate 2 each and Noise 0. If only A has Supply Chain Disruption, final transfers are A=1/B=2/Noise=0, with 1 not issued from Bank.
3. Printed value 1, doubling, and three permitted −1 output modifiers give −1 before the single floor and output 0 afterward. No negative Resource objects or intermediate transfers occur.
4. Investment Freeze filters its specified Measure modifiers before the calculation; applicable Regulation output reductions remain.
5. Blockade prevents production before execution. Administration does not create an automatic production fee or a numeric output reduction.
6. Future Investment's direct gain is resolved as its own effect, rather than doubled or distributed as Resort Production merely because it targets a ResortTile.

## Scope and implementation status

R25a and R25b are approved. R26 duplicate/faulty anchors and editing residue were subsequently corrected in ERRATA-0030-rule-anchor-cleanup.md, completing all 26 DD-0017 findings at the rule-document level.

Only rule documents are changed. Game code has not yet been adapted or verified against this production wording.
