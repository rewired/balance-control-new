# BALANCE // CONTROL

# NOTATION SPECIFICATION (Informative Layer)

Version: 01
Status: Non‑Normative (Not part of Simulation Specification)

This document defines the symbolic language used in rulebooks, tiles, summaries, and examples.
It does not modify, extend, or override the CORE-01 Simulation Specification.

In case of conflict, the formal rule system (CORE-01 / VAR-01 / ADD56-01) prevails.

---

# 1. PURPOSE

The notation system provides:

* Visual shorthand for rule effects
* Compact cost representation
* Icon-based resource identification
* Trigger visualization

The notation is purely representational.
All semantics are defined exclusively in the Simulation Specification.

---

# 2. CORE SYMBOLS

## 2.1 Influence

Symbol: ◉
Meaning: Influence object

Examples:
+◉1  → Add 1 Influence
−◉1  → Remove 1 Influence

Simulation Mapping:
+◉1  → Move 1 Influence from PersonalSupply to Board
−◉1  → Move 1 Influence from Board to PersonalSupply or remove as defined by rule

---

## 2.2 Resources

Symbol: ▲
Meaning: Resource object

Examples:
+▲2  → Add 2 Resources (resort defined separately)
−▲1  → Remove 1 Resource

Simulation Mapping:
+▲X  → Move X Resources from Bank to PersonalSupply
−▲X  → Move X Resources from PersonalSupply to Bank

---

## 2.3 Manipulation Marker

Symbol: ◼
Meaning: Structural change (move, replace, reduce)

This symbol does not generate objects.
It indicates modification of existing state.

---

## 2.4 Free Resort Marker

Symbol: ◇
Meaning: Variable resort selection for cost specification

Example:
▲◇1 → 1 Resource of any chosen resort

Constraints:
◇ is not a resource type.
◇ cannot exist in any zone.
◇ is resolved at payment time.

---

# 3. RESORT IDENTIFICATION

Resources always belong to a specific resort.

Resorts (Core):
DOM — Domestic Affairs
FOR — Foreign Affairs
INF — Information

Example representations:
+▲DOM2
+▲FOR1
−▲INF1

Simulation Mapping:
Each resource token has a Resort attribute.

---

# 4. COST NOTATION

Costs are expressed as sums of concrete resource symbols.

Example:
▲DOM2 + ▲INF1

Interpretation:
All listed resources must be paid simultaneously.
If payment cannot be completed in full, the action fails.

Simulation Mapping:
Move each listed Resource from PersonalSupply to Bank.
If any required Resource is unavailable, no state change occurs.

---

# 5. MAJORITY‑DEPENDENT EFFECTS

Symbolic Convention:
[ effect ]

Meaning:
Effect applies only if majority condition is met.

Example:
[+◉1]

Simulation Mapping:
Evaluate majority according to CORE-01-05 rules.
If majority exists, execute enclosed effect.
If tie or no majority, no state change.

---

# 6. TRIGGER SYMBOLS

## 6.1 Encirclement Trigger

Symbol: ⛶
Meaning: Resolve once when tile becomes fully surrounded.

Simulation Mapping:
Trigger corresponds to Hotspot resolution timing.

---

## 6.2 Recurring Settlement Trigger

Symbol: ♺
Meaning: Resolve during each Round Settlement.

Simulation Mapping:
Trigger corresponds to CORE-01-07 Round Settlement timing.

---

# 7. EXPANSION RESORT SYMBOLS (Informative Only)

These symbols appear only when respective modules are active.

ECO — Economy (Expansion 01)
SEC — Security (Expansion 02)
CLM — Climate (Expansion 03)

They follow identical resource rules as core resorts.

---

# 8. RESERVED RESORT SYMBOL

NRG — Energy

Reserved for future module.
Not present in current Core or Add‑Ons.

---

# 9. INTERPRETATION PRINCIPLE

Symbolic notation is a visual aid only.

In case of ambiguity:
Specific rule overrides general rule.
Explicit rule text overrides symbolic shorthand.
No implicit effects exist.

---

END OF NOTATION SPECIFICATION (INFORMATIVE)
