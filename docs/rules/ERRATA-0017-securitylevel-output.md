# ERRATA-0017 — SecurityLevel output types and zero output

Date: 2026-11-08
Status: Accepted for R16
Applies to: EXP-02 v1.0 and its interactions with CORE-01 and active expansions
Decision: DD-0017, R16; approved by the user during the rules review.

## Defect

“Effect output -1” did not distinguish Resource and Influence gains from object movement, Regulation operations, or nonnumeric instructions. The rules also did not say whether an action with output reduced to 0 remained a legal paid action or failed atomically.

## Approved correction

The authoritative correction is incorporated in `002-expansion02.md`:

- EXP-02-02-B-02/-02A classify reducible outputs: Resort Production, conversion output including Investment Program, direct Resource gains such as Future Investment, new Influence from formalization, and normal Hotspot Influence payouts including Labor Market. The latter are rewards even though the markers come from PersonalSupply.
- EXP-02-02-B-02B excludes ordinary Influence placement/movement, all Regulation placement/movement/removal, card and Tile procedures, majority/virtual Influence, costs/payments, prohibitions, durations, and other nonnumeric modifiers. Merely counting objects is insufficient to classify an operation as reducible output.
- Existing additive SecurityLevel stacking and floor 0 remain. Production reductions occur before majority distribution/Noise; ContextTile binding and Start Committee immunity remain applicable.
- EXP-02-04-B-05/-06 make a fully payable, otherwise legal zero-output action successful: pay all applicable costs, consume the action, and issue no refund. A legal zero-output option prevents automatic completion under R15c. Other legality and payment requirements still apply.
- EXP-02-04-B-07 preserves one-time Hotspot processing when its payout is reduced to 0. There is no later retry.

Existing rule IDs remain available. Investment Program's separate integration was subsequently approved in ERRATA-0023-investment-program-conversion.md. R18 subsequently reserved Countdown as inactive in ERRATA-0020-countdown-reserved.md. This clarification itself creates neither a new conversion action nor a Countdown operation.

## Examples for later implementation verification

1. A W3 with one applicable SecurityLevel produces 2 before normal distribution, absent other modifiers.
2. A 3:1 Grassroots conversion with one SecurityLevel pays 3 base Resources plus applicable additional costs and gains 0. The action succeeds and uses its slot.
3. Standard Committee formalization with one SecurityLevel pays its full applicable cost and creates 0 Influence. Start Committee immunity remains unchanged.
4. Ordinary Influence placement or movement and Authority Apparatus Regulation removal are not reduced by SecurityLevel; other restrictions and costs still apply.
5. A normal Hotspot Influence payout reduced from 1 to 0 is processed once, with no marker transferred and no later payout.
6. An action blocked by Blockade or lacking full payment does not become legal merely because its output would be 0.

## Scope and implementation status

R16 is approved. R17a active-effect identity was subsequently approved in ERRATA-0018-active-effect-instances.md; R17b ordering and payment/consumption commit behavior was subsequently approved in ERRATA-0019-effect-order-and-payment.md. The other unresolved DD-0017 decisions remain separate.

Only rule documents are changed. Game code has not yet been adapted or verified against these output classifications.
