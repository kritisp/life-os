# LIFE//OS
> **Gamify progress. Not guilt.**

LIFE//OS is a full-stack, production-quality RPG character operating system that converts real-world habits, tasks, and accomplishments into true character progression, attribute growth, and armory unlocks.

---

## 🌟 Product Highlights & Key Features

- **Authentic RPG OS Identity:** Built with a dark tactical palette (`#0b0d0f`, `#d7a646` muted gold, CRT scanlines, IBM Plex Mono & DM Sans typography).
- **Server-Authoritative Progression:** Zero client trust. XP, Gold, Level Ups, Attributes, and Prices are calculated strictly on the server or inside PostgreSQL RPC functions.
- **7-Archetype Class Classifier:** Deterministic character build engine evaluating *The Builder*, *The Scholar*, *The Warrior*, *The Creator*, *The Disciplined*, *The Strategist*, and *The Balanced*.
- **Quest Board & Campaign Chains:** Real-world task management with difficulty tiers (`Easy`, `Medium`, `Hard`, `Epic`), attribute alignments, and multi-stage campaign chains.
- **Armory Shop & Inventory:** Purchase interface themes, avatar frames, and particle effects using earned Gold.
- **Atomic Database Integrity:** Race-condition-proof stored procedures (`complete_quest_rpc`, `purchase_item_rpc`) with Postgres row locks (`FOR UPDATE`) and Supabase RLS.

---

## 🏗️ Architecture & Stack

```
           +---------------------------------------------+
           | Next.js 16 App Router (TypeScript, React 19)|
           +----------------------+----------------------+
                                  |
               Server Actions &   | Auth SSR Cookies
               Domain Engine      v
           +---------------------------------------------+
           |           Supabase Postgres & Auth          |
           | (RLS Enabled, Triggers, Atomic RPC Functions)|
           +---------------------------------------------+
```

- **Framework:** Next.js 16 (App Router, Server Actions)
- **Language:** TypeScript
- **Styling & Motion:** Tailwind CSS + Framer Motion + Lucide Icons
- **Database & Auth:** Supabase SSR (Auth, PostgreSQL, Row Level Security)

---

## 🚀 Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🗄️ Database Setup (Supabase)

1. Open your Supabase SQL Editor.
2. Run the complete schema script located at [`supabase/schema.sql`](file:///e:/desk/chichu/life-os/supabase/schema.sql).
3. This creates all 10 tables, Row Level Security policies, indexes, auto-user profile/character creation triggers, initial seed catalogs, and atomic stored procedures (`complete_quest_rpc`, `purchase_item_rpc`).

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open browser at http://localhost:3000
```

---

## 🧪 Verification & Build Commands

```bash
# Type check
npx tsc --noEmit

# Lint check
npm run lint

# Production build
npm run build
```

---

## 🕹️ Demo Journey Walkthrough

1. **Sign Up (`/auth`):** Register a new operator profile. Auto-creates Level 1 character with 10 points across all attributes.
2. **Quest Board (`/quests`):** Create a quest (e.g., *Build Login API*, Hard, Intellect). Click **COMPLETE**. Experience authoritative XP, Gold, Intellect stat gain, floating reward badge, and audio-visual celebration.
3. **Character Command Center (`/character`):** View your stat radar distribution, XP orbit ring, and click **REFLECT ON THIS BUILD** to see your deterministic build trajectory dialog.
4. **Armory Shop (`/shop`):** Spend earned Gold to unlock cosmetic themes or frames and view them persist in your inventory grid.
5. **Quest Chains (`/chains`):** Create a multi-step campaign path (*The Developer's Path*) and track your progress.
6. **Achievements (`/achievements`):** View automatically unlocked achievement badges (*First Blood*, *Momentum Rising*, etc.).
