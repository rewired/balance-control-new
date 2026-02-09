# R11 — Committees (Tile Type)

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 11

scope:
  phase: all
  action: none
  trigger: on_demand

summary:
  Committees enable the formalize influence action when controlled.

inputs:
- committee tile control status

outputs:
- eligibility flag for R07C

constraints:
- committee only matters if controlled

invariants:
- tied control implies no control (R08), thus no eligibility

edge_cases:
- none
