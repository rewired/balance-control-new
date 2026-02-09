# R07D — Convert Resources (Grassroots)

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 7.2c

scope:
  phase: main
  action: convert_resources
  trigger: on_turn

summary:
  Trade 2 identical resources into 1 different resource; max once per turn.

inputs:
- active player resources

outputs:
- resource balances updated

constraints:
- input resources must be two units of the same type
- output resource must be a different type
- max 1 conversion per turn

invariants:
- resources never go negative
- conversion conserves total resources minus 1 (2→1)

edge_cases:
- insufficient resources: action illegal
