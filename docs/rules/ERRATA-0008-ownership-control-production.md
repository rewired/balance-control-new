# ERRATA-0008 — Ownership, activation rights, and zero-majority production

Date: 2026-11-07
Status: Accepted
Applies to: CORE-01 v1.0.14, CORE-01-04/-05/-06/-08
Decision: DD-0017, all three R08 recommendations; approved by the user during the rules review.

## Defect and explicit design changes

The ordinary Move action did not restrict marker ownership. Standard Committee and Grassroots activations did not require control. The specific tied-production exception did not exclude a zero-to-zero tie, and the canonical distribution list overlapped between no controller and tied leaders.

The approved decisions explicitly change or supplement those literal readings; they are not inferred from unstated board-game conventions.

## Approved correction

The authoritative correction is incorporated in `000-core.md`:

- CORE-01-04-12 limits the ordinary Influence Move to one of the active player's own markers.
- CORE-01-04-14A and -21A require control of the Standard Committee or Grassroots used.
- CORE-01-05-03B uses the same canonical majority result, including applicable virtual Influence, without an additional real-marker requirement.
- CORE-01-08-07A exempts Start Committee formalization from the control requirement, preserving its existing restrictions and costs.
- CORE-01-06-13 excludes zero-highest-total production, including any payout to Noise.
- CORE-01-06-14 limits tied production to leaders sharing a positive highest total.
- CORE-01-06-16(b)/(c) explicitly uses these disjoint distribution cases while preserving printed value, doubling, output modifiers, floors, and canonical majority ordering.

Existing rule IDs are preserved. The resource Bank model, standard conversion rate, and Lobbyist bonus rules remain as previously approved.

## Examples for later implementation verification

1. A may move an A-owned Influence marker but cannot use the ordinary Move action to move B's marker.
2. A cannot FormalizeInfluence through a Standard Committee controlled by B or with no controller.
3. A controls a Grassroots solely through an applicable Lobbyist bonus. That control is sufficient to activate ConvertResources without an A-owned real marker on the Grassroots.
4. Start Committee formalization remains usable without control, subject to the timing gate, once-per-game limit, payment, cap, and applicable immunity rules.
5. With W5 and majority totals A=1, B=1, C=0, A and B receive two Resources each and Noise receives one, absent other modifiers. C receives none.
6. With W5 and totals 0:0:0, nobody receives Resources and none go to Noise.
7. A physically empty ResortTile with an applicable positive Lobbyist bonus is not a zero-total case; the canonical majority result determines its production recipients.

## Scope and implementation status

Only rule documents are changed. Game code has not yet been adapted or verified against these decisions. This erratum does not add a new movement adjacency restriction, a new Measure action, or Authority Apparatus activation rules. Other open DD-0017 proposals remain separate.
