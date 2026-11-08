# ERRATA-0023 — Investment Program conversion integration

Date: 2026-11-08
Status: Accepted for R21
Applies to: EXP-01 v1.3 with CORE-01 ConvertResources and active expansion modifiers
Decision: DD-0017, R21; approved by the user during the rules review.

## Defect

Investment Program offered a 2-ECO exchange during ConvertResources but was not itself a Grassroots. The specifications did not identify which Tiles needed control, whether the exchange replaced or supplemented the normal exchange, or which Tile supplied ContextTile and local modifiers.

## Approved correction

The authoritative correction is incorporated in `001-expansion01.md`:

- EXP-01-05-01/-02 require control of both Investment Program and the Grassroots used for ConvertResources. Choose either the ordinary 3:1 exchange or the alternative 2 ECO for 1 Resource of another active resort.
- EXP-01-05-03/-04 grant no separate activation, action, second exchange, repetition, or chaining. There is exactly one exchange per action.
- EXP-01-05-05 permits canonical virtual-only control of either Tile and imposes no adjacency requirement. Investment Program alone provides no conversion action.
- EXP-01-05-06 binds ContextTile exclusively to the Grassroots. Investment Program is the passive eligibility condition, not another execution Tile. Its local modifiers are not applied; its Blockade alone does not disable the option. A Grassroots Blockade prevents the exchange.
- EXP-01-05-07 substitutes only the base payment: 2 ECO plus applicable additional costs. Pay PersonalSupply to Bank and gain output Bank to PersonalSupply atomically. ECO and inactive resorts cannot be chosen as output.
- EXP-01-05-08 preserves ordinary output modification and the successful paid zero-output rule under SecurityLevel at the Grassroots.

Existing rule IDs and the default Grassroots exchange are preserved. The single-context treatment, including Blockade on Investment Program, is an explicit approved decision.

## Examples for later implementation verification

1. A controls Investment Program and a distant Grassroots, possibly through virtual Influence. A may use 2 ECO for 1 DOM at that Grassroots, or choose its ordinary 3:1 exchange.
2. Controlling only Investment Program, or only the Grassroots, does not make the 2-ECO option available.
3. A local Administration surcharge on the Grassroots is additional to the 2 ECO. Applicable global costs still apply once through the canonical resolver.
4. SecurityLevel on the Grassroots may reduce output to 0 with full payment and action use; SecurityLevel only on Investment Program does not reduce this exchange.
5. Blockade only on Investment Program does not prevent the passive option; Blockade on the chosen Grassroots prevents it.
6. With another expansion enabled, its active Resource resort is a permitted output. No inactive Resource or second conversion is created.

## Scope and implementation status

R21 is approved. R22 Supplemental Budget was subsequently approved in ERRATA-0024-supplemental-budget-payment.md. The other unresolved DD-0017 decisions remain separate.

Only rule documents are changed. Game code has not yet been adapted or verified against this conversion option.
