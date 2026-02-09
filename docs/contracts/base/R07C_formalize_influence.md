# R07C — Formalize Influence (Committees)

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 7.2b

scope:
  phase: main
  action: formalize_influence
  trigger: on_turn

summary:
  If controlling at least one committee, pay 1 of each base resource to gain 1 new influence into supply; it cannot be used in the same turn.

inputs:
- committee control status for active player
- active player resources
- active player influence supply / total influence count

outputs:
- resource balances updated (cost paid)
- influence supply increased by 1

constraints:
- precondition: active player controls >= 1 committee (per R08)
- cost: 1 interior, 1 foreign, 1 media
- global influence max: 7 total influence
- gained influence cannot be used in the same turn

invariants:
- resources never go negative
- total influence never exceeds 7

edge_cases:
- if at 7 influence: action is illegal
- if insufficient resources: action is illegal
