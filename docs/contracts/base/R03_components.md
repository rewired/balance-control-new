# R03 — Game Components (Rule-relevant)

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 3

scope:
  phase: setup
  action: none
  trigger: none

summary:
  Defines the rule-relevant components used by the base game.

inputs:
- number of players

outputs:
- component pool definitions in initial state (deck, markers, resources)

constraints:
- only the listed components exist
- component counts are fixed for the match

invariants:
- components are discrete items and cannot be fractional

edge_cases:
- none
