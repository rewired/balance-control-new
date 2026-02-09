# R15 — Victory Tie

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 15

scope:
  phase: endgame
  action: none
  trigger: game_end

summary:
  If the highest influence on the board is tied, tied players share victory.

inputs:
- influence counts per player on board

outputs:
- winner set (one or more players)

constraints:
- there is no tie-breaker beyond shared victory

invariants:
- winners are exactly the players tied for highest influence

edge_cases:
- none
