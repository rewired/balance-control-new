# R07B — Place or Move Influence

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 7.2a

scope:
  phase: main
  action: influence
  trigger: on_turn

summary:
  The active player may place one influence marker or move one of their influence markers to an adjacent tile.

inputs:
- active player id
- influence supply for active player
- current influence distribution
- board adjacency

outputs:
- updated influence distribution
- updated influence supply (if placing)

constraints:
- max 3 influence markers per player per tile
- moving influence must follow adjacency
- a player can only move their own influence

invariants:
- per-tile per-player influence cap is enforced

edge_cases:
- placing beyond cap is illegal
- moving from a tile without owned influence is illegal
