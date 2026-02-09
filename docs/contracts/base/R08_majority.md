# R08 — Majority & Control

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 8

scope:
  phase: all
  action: none
  trigger: on_demand

summary:
  Control exists when one player has a strict majority of influence on a tile; ties mean no control.

inputs:
- influence per tile per player

outputs:
- control status: leader player id or null; tie participants if applicable

constraints:
- ties result in no control

invariants:
- control is derived, not stored

edge_cases:
- no influence: no control
