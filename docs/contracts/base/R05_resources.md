# R05 — Base Resources

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 5

scope:
  phase: all
  action: all
  trigger: none

summary:
  The base game uses three resources: interior, foreign, and media.

inputs:
- resource production (tiles, effects)
- resource costs (actions, effects)

outputs:
- resource balances per player

constraints:
- resources are discrete units
- a player cannot pay costs they cannot afford

invariants:
- resource balances are never negative
- resources persist until spent

edge_cases:
- insufficient resources make an action/effect illegal or prevent execution (as specified)
