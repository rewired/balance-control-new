# R12 — Grassroots (Tile Type)

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 12

scope:
  phase: all
  action: none
  trigger: on_demand

summary:
  Grassroots tiles enable resource conversion (R07D) when controlled.

inputs:
- grassroots tile control status

outputs:
- eligibility flag for R07D

constraints:
- grassroots only matters if controlled

invariants:
- tied control implies no eligibility

edge_cases:
- none
