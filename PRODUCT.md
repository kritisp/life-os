# LIFE//OS — Product Specification

> **Tagline:** Gamify progress. Not guilt.

---

## 1. Vision & Core Philosophy

**LIFE//OS** is a production-grade RPG character operating system where real-world human actions become meaningful character progression. 

Most productivity apps fail because they rely on shame, guilt, and overwhelming task backlogs. **LIFE//OS** reframes personal growth into an engaging RPG identity engine.

### Core Philosophy
- **Progress Over Guilt:** Missed days decay momentum or streak counters, but **never strip earned XP, levels, or achievements**.
- **RPG Character Identity:** A user's real-life choices shape their character class/build over time.
- **Server-Authoritative Fairness:** Progression cannot be cheated from the client console. Every quest completion is validated server-side.

---

## 2. Core Attributes & Character Builds

Every real-life activity fuels one of five primary attributes:

| Attribute | Associated Real-Life Activities | Icon / Theme |
| :--- | :--- | :--- |
| **Strength (STR)** | Gym, resistance training, physical labor | Crimson / Force |
| **Intellect (INT)** | Coding, studying, research, reading technical literature | Cyan / Neural |
| **Discipline (DIS)** | Meditation, morning routines, habit adherence, sleep tracking | Amber / Order |
| **Vitality (VIT)** | Running, cardio, yoga, hydration, recovery | Emerald / Life |
| **Creativity (CRE)** | Writing, UI design, music composition, digital art | Purple / Forge |

### Dynamic Archetype / Build System
A user's primary attributes determine their current RPG Build Archetype. Archetype classification is deterministic and calculated on the server from attribute weightings:

- **The Builder:** High INT + High CRE (Engineers, Architects, System Designers)
- **The Scholar:** High INT + High DIS (Researchers, Academics, Polymaths)
- **The Warrior:** High STR + High VIT (Athletes, Physical Competitors)
- **The Creator:** High CRE + High DIS (Writers, Artists, Product Designers)
- **The Disciplined:** Balanced DIS across routine categories (Monk / Operator)
- **The Strategist:** High INT + High STR + High DIS (Tactical Leaders, Founders)

---

## 3. Core Loop

```
[ Real Life Action ]
       │
       ▼
[ Select / Trigger Quest ]
       │
       ▼
[ Submit Completion ] ──► [ Server Validation & Security Check ]
                                 │
                                 ▼
                     [ Authoritative Reward Engine ]
                     ├── XP & Level Calculations
                     ├── Gold Accrual
                     ├── Attribute Stat Point Allocations
                     ├── Streak & Momentum Calculation
                     └── Achievement / Quest Chain Triggering
                                 │
                                 ▼
                     [ Rich Visual Feedback ]
                     ( XP Gain, Level Up Overlay, Stat Growth )
```

---

## 4. Quest System & Quest Chains

### Quest Structure
Every quest is an actionable real-world objective:
- **Title & Description**
- **Category:** Physical, Knowledge, Routine, Endurance, Creative
- **Difficulty Tier:**
  - **Easy:** Base 50 XP, 15 Gold
  - **Medium:** Base 100 XP, 35 Gold
  - **Hard:** Base 250 XP, 90 Gold
  - **Epic:** Base 500 XP, 200 Gold
- **Associated Attribute:** STR, INT, DIS, VIT, or CRE
- **Timestamps:** Created, Completed, Expiration (if time-boxed)

### Quest Chains
Ordered, multi-step quest lines representing complex milestones. Completing step N unlocks step N+1.

*Example — THE DEVELOPER'S PATH:*
1. Read React Server Components documentation (+INT)
2. Build a standalone UI component (+INT, +CRE)
3. Implement a secure API endpoint (+INT)
4. Ship feature to production (+INT, +DIS)
5. Write technical reflection log (+INT)

---

## 5. Progression Engine & Formulas

### Leveling Mechanics
Level progression is non-linear to maintain long-term engagement while rewarding early momentum.

$$\text{XP Required for Level } N = 100 \times N^{1.5}$$

- **Level 1 → 2:** 100 XP
- **Level 2 → 3:** 283 XP
- **Level 5 → 6:** 1,118 XP
- **Level 10 → 11:** 3,162 XP

### Streak & Momentum
- **Streak:** Tracks consecutive active calendar days (UTC). Missing a day resets the current streak to 0, but retains `longest_streak`. Earned XP is **never** revoked.
- **Momentum (0 - 100%):** A rolling 7-day consistency metric calculated server-side. Daily activity adds momentum; inactive days cause gradual decay. High momentum awards cosmetic badge flair.

---

## 6. Economy & In-Game Shop

Users accumulate **Gold** solely through authenticated quest completions.

### Shop Offerings
- **Visual Themes:** Cyberpunk Tactical, Slate Command, Solarized Monk, Obsidian Void.
- **Cosmetic Badges & Frames:** Avatar borders, title cards, status insignias.
- **Particle & Sound Effects:** Level-up animations, completion soundscapes.
- **Character Customizations:** Custom title tags, build banners.

*Guarantees:* All purchases are processed atomically in PostgreSQL transactions to prevent double-spending or client-tampered prices.

---

## 7. Achievements

Persisted milestones unlocked upon reaching specific criteria:
- **First Quest:** Complete your initial quest.
- **3-Day Streak:** Maintain 3 consecutive active days.
- **7-Day Streak:** Maintain a full week of consistent progress.
- **10 Quests Completed:** Complete 10 total quests.
- **Level 5 Milestone:** Reach Character Level 5.
- **First Purchase:** Acquire an item from the armory shop.

---

## 8. UX/UI Philosophy & Core Screens

### Design Vision
LIFE//OS is designed as a **tactical RPG character operating system**. It eschews corporate dashboard clutter, bright purple SaaS gradients, and generic round cards in favor of a sleek, dark, high-contrast command hub.

### Core Screens
1. **Auth (`/auth`):** Secure login & signup modal/page with RPG terminal aesthetics.
2. **Character Command Center (`/` or `/dashboard`):** Real-time level progress, core stat radar/bars, current build archetype, active streak, momentum index, today's priority quests.
3. **Quest Board (`/quests`):** Active quests, filterable by attribute/difficulty, with completion triggers and quest creation modal.
4. **Quest Chains (`/chains`):** Visual path nodes tracking multi-stage campaign progress.
5. **Armory Shop (`/shop`):** Inventory and cosmetic store powered by Gold.
6. **Progress & Stats (`/stats`):** Deep breakdown of attribute distribution and historical completion logs.
7. **Achievements (`/achievements`):** Grid of unlocked and locked badges with completion progress.
