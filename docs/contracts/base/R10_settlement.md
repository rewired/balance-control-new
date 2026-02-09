# R10 — Round Settlement (Settlement / Rundenabrechnung)

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 10

scope:
  phase: settlement
  action: none
  trigger: end_of_round

summary:
  Each yield-producing tile is resolved based on majority; ties split yield and remainder goes to noise.

inputs:
- all yield-producing tiles on board
- tile yields (per produced resource)
- influence per tile per player

outputs:
- per-player resource deltas
- noise pool delta

constraints:
- no influence → 0 yield
- unique majority → full yield to leader
- tie → floor split among tied leaders
- remainder → added to noise pool

invariants:
- yield conservation: yield == sum(awarded) + remainder_to_noise
- awarded amounts are non-negative integers
- noise increment is non-negative integer

edge_cases:
- multi-resource tiles are resolved per resource type using the same logic
