# ERRATA-0021 — Supply Chain Disruption receipt limit

Date: 2026-11-08
Status: Accepted for R19
Applies to: CORE-01 v1.0.14 and EXP-03 v1.0 with EXP-01 active
Decision: DD-0017, R19; approved by the user during the rules review.

## Defect

Supply Chain Disruption capped a player's receipt at 1 per production instance without defining the instance, the cap's position relative to tie distribution, or the destination of the reduction. Treating it as a Tile-output reduction would also change other players' shares and the Noise remainder.

## Approved correction

The authoritative correction is incorporated in `000-core.md` and `003-expansion03.md`:

- CORE-01-06-16(c)/-16A determine regular shares and tie remainder before executing final transfers under any expressly applicable receipt limit. A receipt limit is separate from the canonical Tile-output modifier stage.
- EXP-03-08-M11-05/-06 define one production instance as the complete production of one ResortTile in a Settlement, including a final one. All normal output modifiers, floors, and canonical majority calculations precede receipt limiting.
- EXP-03-08-M11-07 caps only the targeted player's final share at min(regular share, 1). Other shares are unchanged. A zero share remains zero, and there is no provisional payout followed by reclamation.
- EXP-03-08-M11-08 leaves the reduction unissued in Bank. It goes neither to other players nor to Noise. Noise receives only the original tie remainder. The unbounded Bank does not materialize Resources merely for a cancelled portion.
- EXP-03-08-M11-09 applies the cap per affected player and per ResortTile, retaining a maximum of 1 under multiple instances. Investment Freeze does not ignore this recipient limit. The card's printed cost, target, and duration remain unchanged.

Existing rule IDs are retained. R11's setup eligibility remains applicable: this ECO-cost card exists only with EXP-01 active. The general timing vocabulary remains R25.

## Examples for later implementation verification

1. Output 5 with a positive A/B tie normally allocates A=2, B=2, Noise=1. With only A affected, transfer A=1, B=2, Noise=1; leave 1 unissued in Bank.
2. A sole affected controller of output 5 receives 1; the remaining 4 are not issued. No Noise is created by the cap.
3. If both tied A/B players are affected in the first example, transfer 1 to each and the original 1 to Noise; leave 2 unissued.
4. Zero output, Blockade, or highest total Influence 0 does not become a 1-Resource payout.
5. A player with positive regular shares from three different Tiles may receive 1 from each, rather than only 1 for the entire Settlement.
6. Multiple copies of the receipt limit on a player retain maximum 1. Investment Freeze may ignore applicable Tile modifiers, but this receipt cap remains applicable afterward.

## Scope and implementation status

R19 is approved. R20 component counts were subsequently approved in ERRATA-0022-component-setup.md. Timing vocabulary remains R25, and the other unresolved DD-0017 decisions remain separate.

Only rule documents are changed. Game code has not yet been adapted or verified against these receipt rules.
