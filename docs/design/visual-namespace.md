# BALANCE // CONTROL

## Visual Namespace Specification (Resort & Tile Colors)

### 1. Naming Scheme

**Format**

```
--bc-<category>-<module>-<identifier>
```

### Categories

* `r` = Resort (produces Resources)
* `t` = Tile Type (structural class, not a Resource)

### Modules

* `core` → Base Game
* `ex01` → Economy & Labor
* `ex02` → Security & Order
* `ex03` → Climate & Future

### Identifier

* 3-letter code (Resort or Tile class)

---

## 0. UI Color

Background: Black #000000;

## 1. Player Colors

| Player Color (EN) | Variable     | Color (Hex) |
| ----------------- | ------------ | ----------- |
| Red               | `--bc-p-RED` | #E11D48     |
| Green             | `--bc-p-GRN` | #22C55E     |
| Blue              | `--bc-p-BLU` | #2B42D6     |
| Yellow            | `--bc-p-YLW` | #FACC15     |
| Magenta           | `--bc-p-MAG` | #D946EF     |
| Cyan              | `--bc-p-CYN` | #22D3EE     |

**Design Principles**

* Strongly saturated, clearly distinguishable
* Player colors must not collide with Tile type colors

---

# 2. Resorts (Resources)

| Resort (EN)         | Module | Identifier | Variable          | Color (Hex) | Material Symbol |
| ------------------- | ------ | ---------- | ----------------- | ----------- | --------------- |
| Domestic Affairs    | core   | DOM        | `--bc-r-core-DOM` | #3A5A78     | account_balance |
| Foreign Affairs     | core   | FOR        | `--bc-r-core-FOR` | #2E7D6E     | public          |
| Information Control | core   | INF        | `--bc-r-core-INF` | #6A4C93     | visibility      |
| Economy             | ex01   | ECO        | `--bc-r-ex01-ECO` | #8A6E2F     | factory         |
| Security            | ex02   | SEC        | `--bc-r-ex02-SEC` | #4E5B63     | shield          |
| Climate             | ex03   | CLM        | `--bc-r-ex03-CLM` | #3F7F4C     | eco             |

### Design Principles

* No proximity to player colors (Red, Green, Blue, Yellow, Magenta, Cyan)
* Medium saturation
* High readability on dark backgrounds
* Sufficient color distance between resorts

---

# 3. Tile Classes (Non-Resort)

| Tile Type (EN) | Module | Identifier | Variable          | Color (Hex) | Material Symbol |
| -------------- | ------ | ---------- | ----------------- | ----------- | --------------- |
| Committee      | core   | COM        | `--bc-t-core-COM` | #5C4B3B     | gavel           |
| Lobbyist       | core   | LOB        | `--bc-t-core-LOB` | #7A5C3A     | campaign        |
| Grassroots     | core   | GRS        | `--bc-t-core-GRS` | #4A6A5E     | hub             |
| Hotspot        | core   | HSP        | `--bc-t-core-HSP` | #8B2E2E     | priority_high   |

### Design Principles

* Clearly distinguishable from Resorts
* No overlap with player colors
* Slightly more neutral / muted
* Hotspot intentionally with higher contrast

---

# 4. System Logic (Conceptual)

* Resorts define **economic identity**
* Tile classes define **mechanical role**
* Module separation enables expansion-isolated color control
* Namespace guarantees scalability (ex04, ex05, …)

---
