# R14 — Game End

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 14

scope:
  phase: endgame
  action: none
  trigger: draw_pile_empty

summary:
  When the draw pile is empty, players stop drawing; after the last action, perform final settlement and end the game.

inputs:
- draw deck state
- turn progression state

outputs:
- game end signal
- final settlement applied

constraints:
- no new tiles are drawn once draw pile is empty
- final settlement is performed before determining victory

invariants:
- the game ends immediately after final settlement

edge_cases:
- none
