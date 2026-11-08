# ERRATA-0004 — Initial Resources and unbounded Bank

Date: 2026-11-07
Status: Accepted
Applies to: CORE-01 v1.0.14, CORE-01-00 State Model and CORE-01-03 Setup
Decision: DD-0017, R04; approved by the user during the rules review.

## Defect

Setup did not specify initial Resource holdings, Noise contents, or Bank availability. Production and other gains required transfers from Bank, without defining a finite supply or how shortages should resolve.

## Approved correction

The authoritative correction is incorporated directly in `000-core.md`:

- CORE-01-00-04A makes Bank an unbounded source for every active Resource resort. There is no Bank-shortage reduction or failure of a prescribed payout.
- CORE-01-00-04B permits creation of exactly the missing Resource objects in Bank when a prescribed transfer needs them, within the same atomic resolution. Objects are transferred from Bank and remain in exactly one zone.
- CORE-01-00-04C excludes inactive resorts, including their counters and objects.
- CORE-01-00-04D preserves each cost rule's specified payment source; Bank availability is not free access to a player's costs.
- CORE-01-03-07 starts each player at zero Resources and Noise empty.
- CORE-01-03-08 starts without pre-created Bank Resource objects, supplies them on demand, and preserves payment returns to Bank.

This defines an unbounded reserve without requiring infinitely many existing objects or an infinite numeric inventory in a serialized game state. Any later software representation must preserve deterministic object provisioning and canonical state hashing.

## Examples for later implementation verification

1. Before any production, all players hold zero Resources, Noise is empty, and no finite Bank stock needs to be seeded.
2. An unmodified W5 with a sole controller pays five Resources even when no objects of that resort currently exist in Bank. The five objects are supplied in Bank and transferred atomically.
3. If Bank already holds two Resources of the needed resort, a prescribed payout of five requires only three additional objects.
4. A player holding only two DOM cannot pay a three-DOM cost using Bank's unbounded reserve.
5. With EXP-02 inactive, no SEC objects or SEC counters exist. With it active, a permitted Grassroots conversion can receive SEC from Bank even if none have previously been paid into it.
6. Existing modifiers and prohibitions can still reduce or prevent output. Unbounded Bank availability removes only stock shortages; it does not change production values or create an automatic payout.

## Scope and implementation status

No starting Resources or resource-generating actions beyond the approved rules are introduced. Regulation costs and their payer (R15), receiving-player limits (R19), and other open DD-0017 decisions remain separate.

Only rule documents are changed. Game code has not yet been adapted or verified against this correction. Existing rule IDs are preserved; other open DD-0017 proposals are not approved by this erratum.
