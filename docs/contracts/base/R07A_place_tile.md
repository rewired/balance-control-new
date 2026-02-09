# R07A — Draw and Place Tile

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 7.1

scope:
  phase: main
  action: place_tile
  trigger: on_turn

summary:
  A drawn tile must be placed adjacent to the existing layout on empty space; tiles cannot be stacked unless explicitly allowed.

inputs:
- drawn tile
- current board layout
- board adjacency rules (hex neighbors)

outputs:
- board updated with the placed tile
- draw deck decremented

constraints:
- placement must be adjacent to existing layout (as defined by canon)
- placement must be on empty space
- placing a tile on top of another tile is forbidden unless explicitly allowed

invariants:
- a coordinate can contain at most one tile (base rule)
- placement cannot delete or move existing tiles

edge_cases:
- unplaceable tiles are handled as specified in canon (if specified)
