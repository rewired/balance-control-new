# R09 — Hotspots

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 9

scope:
  phase: main
  action: none
  trigger: enclosure_complete

summary:
  When a hotspot becomes fully enclosed, it resolves immediately using majority rules.

inputs:
- hotspot enclosure status
- influence distribution on involved tiles

outputs:
- hotspot effect result (as specified by the hotspot)

constraints:
- ties produce no effect (as specified)

invariants:
- hotspot resolution is immediate upon enclosure completion

edge_cases:
- none
