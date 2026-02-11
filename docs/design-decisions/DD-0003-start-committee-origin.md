# DD-0003-start-committee-origin

Decision date: 2026-02-11
Status: Accepted

Context
- CORE-01-03-01 places the Start Committee into Board but does not specify a coordinate.

Decision
- Use axial hex coordinate { q: 0, r: 0 } as the Start Committee placement during setup. This serves as a conventional origin only.

Rationale
- Keeps zone modeling explicit while remaining agnostic to future topology details (CORE-01-00-07..11). The choice does not affect rules beyond providing a valid coordinate.

Consequences
- If visuals/topology change, origin can be remapped without altering rules.
