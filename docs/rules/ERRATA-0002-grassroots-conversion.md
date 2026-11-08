# ERRATA-0002 — Grassroots conversion

Date: 2026-11-07
Status: Accepted
Applies to: CORE-01 v1.0.14, CORE-01-02 Components, CORE-01-04 Turn Structure, ADD56-01
Decision: DD-0017, R02; approved by the user during the rules review.

## Defect

CORE-01-04-22 delegated ConvertResources costs and output to Grassroots tile text, but the normative specification supplied no such text or distribution of conversion types.

## Approved correction

The authoritative correction is incorporated directly in `000-core.md`:

- CORE-01-02-14A and ADD56-01-01-13A give all eight core Grassroots and the two additional 5–6-player Grassroots the same printed conversion text.
- CORE-01-04-22A defines the base exchange: three Resources of one resort for exactly one Resource of a different resort.
- CORE-01-04-22B restricts both choices to active resource resorts, including active expansion resources.
- CORE-01-04-22C specifies payment to Bank and output from Bank into the active player's PersonalSupply.
- CORE-01-04-22D limits the action to one exchange unless explicitly overridden.
- CORE-01-04-22E preserves the same-resort base cost when additional costs apply and binds the exchange to canonical atomic effect resolution.

Existing rule IDs and tile counts are preserved. This is an approved new 3:1 design decision, not a reconstruction of missing original tile text or a claim of balance validation.

## Consequences and remaining decisions

- With EXP-02 active, conversion can obtain SEC, resolving the missing acquisition route recorded as DD-0017 R12. It does not introduce SEC production or starting SEC.
- With EXP-01 active, ECO is eligible. The existing Investment Program retains a better stated 2-ECO-to-1 exchange rate; whether it replaces or supplements the Grassroots exchange remains DD-0017 R21.
- No tile-control requirement is added; activation rights remain part of R08.
- Initial Bank contents and availability remain part of R04. This correction does not decide the Bank model.

## Examples for later implementation verification

1. In CORE, 3 DOM can be exchanged for 1 FOR. Mixed input 2 DOM + 1 INF does not satisfy the base cost.
2. With EXP-02 active, 3 INF can be exchanged for 1 SEC. With EXP-02 inactive, SEC cannot be selected as input or output.
3. A +1 INF surcharge makes 3 DOM + 1 INF the total cost for obtaining 1 FOR; it does not permit 2 DOM + 1 INF as the base input.
4. Paying 6 DOM does not authorize two exchanges within one ordinary ConvertResources action.
5. Both additional 5–6-player Grassroots provide the same exchange as the eight core Grassroots.

## Implementation status

This step updates normative documentation only. Game code has not yet been adapted or verified against this correction. Other open DD-0017 proposals are not approved by this erratum; R12 is resolved only as a direct consequence of the approved active-resource conversion rule.
