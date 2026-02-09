# R02 — Open Information

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 2

scope:
  phase: all
  action: all
  trigger: none

summary:
  All information in the game is public and visible to all players.

inputs:
- full game state (board, resources, markers, tiles in play, deck state as specified)

outputs:
- none

constraints:
- no hidden hands
- no secret resources
- no face-down tiles or markers

invariants:
- any state change must remain observable to all players

edge_cases:
- none
