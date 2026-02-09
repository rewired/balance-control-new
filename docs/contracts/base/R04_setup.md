# R04 — Game Setup

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 4

scope:
  phase: setup
  action: none
  trigger: none

summary:
  The game is initialized with shuffled tiles, starting resources, and influence supply.

inputs:
- number of players
- tile deck composition (base)
- starting resources per player (as specified)

outputs:
- initial board layout (empty unless specified)
- shuffled draw deck
- player resource balances
- player influence supply

constraints:
- starting player is determined as described in canon
- setup must not add influence to the board unless specified

invariants:
- after setup, all players start symmetrically except for starting-player order

edge_cases:
- none
