# LIFE//OS — Database Schema & Data Model

## 1. Schema Overview

The database is built on **Supabase PostgreSQL**. Data access is strictly controlled via **Row Level Security (RLS)** using `auth.uid()`.

```
               ┌────────────────┐
               │  auth.users    │
               └───────┬────────┘
                       │ 1:1
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌───────────────┐             ┌───────────────┐
│   profiles    │             │  characters   │
└───────────────┘             └───────┬───────┘
                                      │ 1:N
                       ┌──────────────┼──────────────┐
                       ▼              ▼              ▼
                 ┌───────────┐ ┌─────────────┐ ┌───────────┐
                 │   tasks   │ │  inventory  │ │   user_   │
                 └─────┬─────┘ └──────┬──────┘ │achievements│
                       │ 1:N          │ N:1    └─────┬─────┘
                       ▼              ▼              │ N:1
                 ┌───────────┐ ┌─────────────┐       │
                 │   task_   │ │    items    │◄──────┘
                 │completions│ └─────────────┘
                 └───────────┘
```

---

## 2. Table Definitions

### 2.1 `profiles`
Stores basic user identity information extending `auth.users`.

- **Primary Key:** `id` (UUID, references `auth.users.id` ON DELETE CASCADE)
- **Columns:**
  - `id`: UUID (PK)
  - `username`: TEXT (UNIQUE, NULLABLE)
  - `display_name`: TEXT (NULLABLE)
  - `avatar_url`: TEXT (NULLABLE)
  - `created_at`: TIMESTAMPTZ (DEFAULT `now()`)
  - `updated_at`: TIMESTAMPTZ (DEFAULT `now()`)
- **Ownership:** Scoped to `id = auth.uid()`
- **Indexes:** `idx_profiles_username` on `(username)`
- **RLS:** Users can read and update only their own profile row.

---

### 2.2 `characters`
Stores authoritative RPG character stats, level, XP, gold, streak, momentum, and archetype build.

- **Primary Key:** `id` (UUID, DEFAULT `gen_random_uuid()`)
- **Columns:**
  - `id`: UUID (PK)
  - `user_id`: UUID (FK references `profiles.id` ON DELETE CASCADE, UNIQUE)
  - `name`: TEXT (DEFAULT `'Operator'`)
  - `level`: INTEGER (DEFAULT 1, CHECK `level >= 1`)
  - `xp`: INTEGER (DEFAULT 0, CHECK `xp >= 0`)
  - `gold`: INTEGER (DEFAULT 0, CHECK `gold >= 0`)
  - `strength`: INTEGER (DEFAULT 10, CHECK `strength >= 0`)
  - `intellect`: INTEGER (DEFAULT 10, CHECK `intellect >= 0`)
  - `discipline`: INTEGER (DEFAULT 10, CHECK `discipline >= 0`)
  - `vitality`: INTEGER (DEFAULT 10, CHECK `vitality >= 0`)
  - `creativity`: INTEGER (DEFAULT 10, CHECK `creativity >= 0`)
  - `current_streak`: INTEGER (DEFAULT 0, CHECK `current_streak >= 0`)
  - `longest_streak`: INTEGER (DEFAULT 0, CHECK `longest_streak >= 0`)
  - `momentum`: INTEGER (DEFAULT 100, CHECK `momentum BETWEEN 0 AND 100`)
  - `archetype`: TEXT (DEFAULT `'The Balanced'`, e.g., `'The Builder'`, `'The Scholar'`)
  - `last_active_date`: DATE (NULLABLE)
  - `created_at`: TIMESTAMPTZ (DEFAULT `now()`)
  - `updated_at`: TIMESTAMPTZ (DEFAULT `now()`)
- **Ownership:** Scoped to `user_id = auth.uid()`
- **Indexes:** `idx_characters_user_id` on `(user_id)`
- **RLS:** Users can read their character state. Updates occur via authenticated server operations.

---

### 2.3 `tasks` (Quests)
Represents user quests available for execution.

- **Primary Key:** `id` (UUID, DEFAULT `gen_random_uuid()`)
- **Columns:**
  - `id`: UUID (PK)
  - `user_id`: UUID (FK references `profiles.id` ON DELETE CASCADE)
  - `title`: TEXT (NOT NULL)
  - `description`: TEXT (NULLABLE)
  - `category`: TEXT (NOT NULL, e.g. `'physical'`, `'coding'`, `'routine'`, `'endurance'`, `'creative'`)
  - `difficulty`: TEXT (NOT NULL, CHECK in `('easy', 'medium', 'hard', 'epic')`)
  - `attribute`: TEXT (NOT NULL, CHECK in `('strength', 'intellect', 'discipline', 'vitality', 'creativity')`)
  - `base_xp`: INTEGER (NOT NULL, CHECK `base_xp > 0`)
  - `base_gold`: INTEGER (NOT NULL, CHECK `base_gold >= 0`)
  - `is_archived`: BOOLEAN (DEFAULT `false`)
  - `created_at`: TIMESTAMPTZ (DEFAULT `now()`)
  - `updated_at`: TIMESTAMPTZ (DEFAULT `now()`)
- **Ownership:** Scoped to `user_id = auth.uid()`
- **Indexes:** `idx_tasks_user_id` on `(user_id)`, `idx_tasks_category` on `(user_id, category)`
- **RLS:** Full CRUD by owner (`user_id = auth.uid()`).

---

### 2.4 `task_completions`
Audit log and authoritative proof of completed quests.

- **Primary Key:** `id` (UUID, DEFAULT `gen_random_uuid()`)
- **Columns:**
  - `id`: UUID (PK)
  - `user_id`: UUID (FK references `profiles.id` ON DELETE CASCADE)
  - `task_id`: UUID (FK references `tasks.id` ON DELETE CASCADE)
  - `xp_awarded`: INTEGER (NOT NULL)
  - `gold_awarded`: INTEGER (NOT NULL)
  - `attribute_stat_awarded`: INTEGER (NOT NULL)
  - `completed_at`: TIMESTAMPTZ (DEFAULT `now()`)
  - `completion_date`: DATE (DEFAULT `CURRENT_DATE`)
- **Ownership:** Scoped to `user_id = auth.uid()`
- **Indexes:** `idx_task_completions_user_date` on `(user_id, completion_date)`, `idx_task_completions_task` on `(task_id)`
- **RLS:** Read/insert by owner (`user_id = auth.uid()`). Deletes prohibited to preserve history.

---

### 2.5 `items` (Armory Catalog)
Global static catalog of shop items (themes, badges, profile frames, cosmetics).

- **Primary Key:** `id` (UUID, DEFAULT `gen_random_uuid()`)
- **Columns:**
  - `id`: UUID (PK)
  - `name`: TEXT (NOT NULL)
  - `description`: TEXT (NOT NULL)
  - `category`: TEXT (NOT NULL, e.g. `'theme'`, `'badge'`, `'frame'`, `'effect'`)
  - `price`: INTEGER (NOT NULL, CHECK `price >= 0`)
  - `asset_url`: TEXT (NULLABLE)
  - `metadata`: JSONB (DEFAULT `'{}'::jsonb`)
  - `created_at`: TIMESTAMPTZ (DEFAULT `now()`)
- **Ownership:** Global catalog (public read-only for authenticated users).
- **Indexes:** `idx_items_category` on `(category)`
- **RLS:** Public read access for authenticated users. Writes restricted to admin/server migrations.

---

### 2.6 `inventory`
Tracks items purchased by users.

- **Primary Key:** `id` (UUID, DEFAULT `gen_random_uuid()`)
- **Columns:**
  - `id`: UUID (PK)
  - `user_id`: UUID (FK references `profiles.id` ON DELETE CASCADE)
  - `item_id`: UUID (FK references `items.id` ON DELETE CASCADE)
  - `is_equipped`: BOOLEAN (DEFAULT `false`)
  - `purchased_at`: TIMESTAMPTZ (DEFAULT `now()`)
  - UNIQUE constraint on `(user_id, item_id)` to prevent duplicate purchases.
- **Ownership:** Scoped to `user_id = auth.uid()`
- **Indexes:** `idx_inventory_user` on `(user_id)`
- **RLS:** Read/update equip status by owner (`user_id = auth.uid()`). Inserts handled via shop purchase Server Actions.

---

### 2.7 `achievements`
Global static list of unlockable achievements.

- **Primary Key:** `id` (UUID, DEFAULT `gen_random_uuid()`)
- **Columns:**
  - `id`: UUID (PK)
  - `code`: TEXT (UNIQUE, NOT NULL, e.g. `'FIRST_QUEST'`, `'STREAK_7'`)
  - `title`: TEXT (NOT NULL)
  - `description`: TEXT (NOT NULL)
  - `badge_icon`: TEXT (NOT NULL)
  - `xp_reward`: INTEGER (DEFAULT 0)
  - `gold_reward`: INTEGER (DEFAULT 0)
  - `created_at`: TIMESTAMPTZ (DEFAULT `now()`)
- **Ownership:** Global catalog (public read for authenticated users).
- **RLS:** Public read for authenticated users.

---

### 2.8 `user_achievements`
Unlocks earned by specific users.

- **Primary Key:** `id` (UUID, DEFAULT `gen_random_uuid()`)
- **Columns:**
  - `id`: UUID (PK)
  - `user_id`: UUID (FK references `profiles.id` ON DELETE CASCADE)
  - `achievement_id`: UUID (FK references `achievements.id` ON DELETE CASCADE)
  - `unlocked_at`: TIMESTAMPTZ (DEFAULT `now()`)
  - UNIQUE constraint on `(user_id, achievement_id)`
- **Ownership:** Scoped to `user_id = auth.uid()`
- **Indexes:** `idx_user_achievements_user` on `(user_id)`
- **RLS:** Read by owner (`user_id = auth.uid()`).

---

### 2.9 `quest_chains` & `quest_chain_tasks`
Tracks multi-stage campaign paths.

- **`quest_chains`:**
  - `id` (PK, UUID)
  - `user_id` (FK `profiles.id`)
  - `title` (TEXT)
  - `description` (TEXT)
  - `created_at` (TIMESTAMPTZ)
- **`quest_chain_tasks`:**
  - `id` (PK, UUID)
  - `chain_id` (FK `quest_chains.id` ON DELETE CASCADE)
  - `task_id` (FK `tasks.id` ON DELETE CASCADE)
  - `step_order` (INTEGER, NOT NULL)
  - UNIQUE constraint on `(chain_id, step_order)`
- **RLS:** Full CRUD by owner (`user_id = auth.uid()`).
