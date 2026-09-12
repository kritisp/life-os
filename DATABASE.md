# LIFE//OS — Database Schema & Data Model

## 1. Schema Overview

The database is hosted on **Supabase PostgreSQL**. User accounts, character profiles, quests, and game economics are managed via the custom auth architecture and stored procedures.

```
                  ┌───────────────┐
                  │   profiles    │
                  └───────┬───────┘
                          │ 1:1
                          ▼
                  ┌───────────────┐
                  │  characters   │
                  └───────┬───────┘
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
Stores custom authentication user records and profile metadata.

- **Primary Key:** `id` (UUID, DEFAULT `gen_random_uuid()`)
- **Columns:**
  - `id`: UUID (PK)
  - `email`: TEXT (UNIQUE, NOT NULL)
  - `password_hash`: TEXT (scrypt salt:hash string)
  - `username`: TEXT (UNIQUE, NULLABLE)
  - `display_name`: TEXT (NULLABLE)
  - `avatar_url`: TEXT (NULLABLE)
  - `created_at`: TIMESTAMPTZ (DEFAULT `now()`)
  - `updated_at`: TIMESTAMPTZ (DEFAULT `now()`)
- **Access:** Direct browser DB access is disabled; operations occur via server actions.

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
  - `momentum`: INTEGER (DEFAULT 0, CHECK `momentum BETWEEN 0 AND 100`)
  - `archetype`: TEXT (DEFAULT `'The Balanced'`)
  - `last_active_date`: DATE (NULLABLE)
  - `created_at`: TIMESTAMPTZ (DEFAULT `now()`)
  - `updated_at`: TIMESTAMPTZ (DEFAULT `now()`)
- **Indexes:** `idx_characters_user_id` on `(user_id)`

---

### 2.3 `tasks` (Quests)
Represents user quests available for execution.

- **Primary Key:** `id` (UUID, DEFAULT `gen_random_uuid()`)
- **Columns:**
  - `id`: UUID (PK)
  - `user_id`: UUID (FK references `profiles.id` ON DELETE CASCADE)
  - `title`: TEXT (NOT NULL)
  - `description`: TEXT (NULLABLE)
  - `category`: TEXT (NOT NULL)
  - `difficulty`: TEXT (NOT NULL, CHECK in `('easy', 'medium', 'hard', 'epic')`)
  - `attribute`: TEXT (NOT NULL, CHECK in `('strength', 'intellect', 'discipline', 'vitality', 'creativity')`)
  - `base_xp`: INTEGER (NOT NULL, CHECK `base_xp > 0`)
  - `base_gold`: INTEGER (NOT NULL, CHECK `base_gold >= 0`)
  - `is_archived`: BOOLEAN (DEFAULT `false`)
  - `created_at`: TIMESTAMPTZ (DEFAULT `now()`)
  - `updated_at`: TIMESTAMPTZ (DEFAULT `now()`)
- **Indexes:** `idx_tasks_user_id` on `(user_id)`, `idx_tasks_category` on `(user_id, category)`

---

### 2.4 `task_completions`
Audit log and authoritative proof of completed quests with duplicate guard.

- **Primary Key:** `id` (UUID, DEFAULT `gen_random_uuid()`)
- **Columns:**
  - `id`: UUID (PK)
  - `user_id`: UUID (FK references `profiles.id` ON DELETE CASCADE)
  - `task_id`: UUID (FK references `tasks.id` ON DELETE CASCADE, UNIQUE)
  - `xp_awarded`: INTEGER (NOT NULL)
  - `gold_awarded`: INTEGER (NOT NULL)
  - `attribute_stat_awarded`: INTEGER (NOT NULL)
  - `completed_at`: TIMESTAMPTZ (DEFAULT `now()`)
  - `completion_date`: DATE (DEFAULT `CURRENT_DATE`)
- **Unique Constraint:** `UNIQUE(task_id)` ensures idempotent quest completion.
- **Indexes:** `idx_task_completions_user_date` on `(user_id, completion_date)`

---

### 2.5 `items` (Armory Catalog)
Global static catalog of shop items.

- **Primary Key:** `id` (UUID, DEFAULT `gen_random_uuid()`)
- **Columns:**
  - `id`: UUID (PK)
  - `name`: TEXT (NOT NULL)
  - `description`: TEXT (NOT NULL)
  - `category`: TEXT (NOT NULL, CHECK in `('theme', 'badge', 'frame', 'effect')`)
  - `price`: INTEGER (NOT NULL, CHECK `price >= 0`)
  - `asset_url`: TEXT (NULLABLE)
  - `metadata`: JSONB (DEFAULT `'{}'::jsonb`)
  - `created_at`: TIMESTAMPTZ (DEFAULT `now()`)

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
- **Unique Constraint:** `UNIQUE(user_id, item_id)` prevents duplicate purchases.

---

### 2.7 `achievements` & `user_achievements`
Global achievements catalog and unlocked user achievements.

- **`achievements`:**
  - `id` (PK, UUID)
  - `code` (TEXT UNIQUE)
  - `title` (TEXT)
  - `description` (TEXT)
  - `badge_icon` (TEXT)
  - `xp_reward` (INTEGER)
  - `gold_reward` (INTEGER)
- **`user_achievements`:**
  - `id` (PK, UUID)
  - `user_id` (FK `profiles.id`)
  - `achievement_id` (FK `achievements.id`)
  - `unlocked_at` (TIMESTAMPTZ)
  - `UNIQUE(user_id, achievement_id)`

---

### 2.8 `quest_chains` & `quest_chain_tasks`
- **`quest_chains`:** `id`, `user_id`, `title`, `description`, `created_at`
- **`quest_chain_tasks`:** `id`, `chain_id`, `task_id`, `step_order`, `UNIQUE(chain_id, step_order)`
