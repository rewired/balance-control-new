# R13 — Noise Pool

source:
  canon_file: 001-grundregeln_v1.0.9.md
  canon_section: 13

scope:
  phase: all
  action: none
  trigger: none

summary:
  Noise represents politically unusable resources; it cannot be spent, traded, or recovered.

inputs:
- noise increments (e.g., from R10 remainder)

outputs:
- updated noise pool

constraints:
- noise cannot be spent
- noise cannot be converted
- noise cannot be recovered unless canon specifies a rule (none specified here)

invariants:
- noise balances are non-negative integers

edge_cases:
- none
