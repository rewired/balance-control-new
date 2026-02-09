# R07 — Turn Structure

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 7

scope:
  phase: main
  action: all
  trigger: on_turn

summary:
  Each turn consists of (A) draw+place a tile, then (B) perform exactly one action.

inputs:
- active player
- draw deck
- board state
- player state

outputs:
- updated game state after tile placement + exactly one action

constraints:
- exactly one action is performed per turn
- the action must follow tile placement

invariants:
- turn order advances only after completing tile placement and one action

edge_cases:
- none
