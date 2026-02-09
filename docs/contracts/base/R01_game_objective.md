# R01 — Game Objective

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 1

scope:
  phase: none
  action: none
  trigger: game_end

summary:
  The goal is to have the most influence on the board at game end.

inputs:
- influence markers on board per player

outputs:
- victory determination

constraints:
- only influence on the board counts
- influence in supply does not count

invariants:
- influence counts are non-negative integers

edge_cases:
- victory ties are handled by R15
