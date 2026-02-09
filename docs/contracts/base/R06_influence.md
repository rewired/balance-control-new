# R06 — Influence Basics

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 6

scope:
  phase: all
  action: influence
  trigger: none

summary:
  Influence represents political control and is placed on tiles.

inputs:
- influence placement / movement intents
- influence supply per player

outputs:
- updated influence distribution on the board

constraints:
- each influence marker belongs to exactly one player
- influence markers are placed on tiles only

invariants:
- influence amounts are integers and non-negative

edge_cases:
- none
