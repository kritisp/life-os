# LIFE//OS — Security Architecture & Threat Model

## 1. Core Security Tenets

1. **Zero Client Trust:** The browser frontend is considered an untrusted interface. All domain actions (quest completion, item purchases, stat leveling) must be validated server-side.
2. **Strict Identity Isolation:** Row Level Security (RLS) policies mandate that authenticated users can only query, update, or delete their own data.
3. **Least Privilege Credentials:** The application exclusively uses standard publishable/anon Supabase credentials (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Service-role administrative keys are **never** bundled or exposed.
4. **Input Hygiene & Error Masking:** All incoming parameters are validated before execution. Database error stack traces are suppressed and replaced with sanitized user messages.

---

## 2. Server-Authoritative Progression Security

### Quest Completion Verification Checklist
When a user triggers a quest completion request:

```
[ Client Action: submitCompletion(taskId) ]
                     │
                     ▼
┌───────────────────────────────────────────────────────────┐
│              SERVER ACTION VALIDATION FLOW                │
├───────────────────────────────────────────────────────────┤
│ 1. Verify Session    ──► Reject if unauthenticated        │
│ 2. Verify Ownership  ──► Check tasks.user_id = user.id    │
│ 3. Check Eligibility ──► Ensure task is active & valid    │
│ 4. Prevent Duplicate ──► Enforce rate / duplicate rules   │
│ 5. Calculate Rewards ──► Server calculates XP/Gold/Stats │
│ 6. Commit Database   ──► Atomic PostgreSQL Transaction    │
└───────────────────────────────────────────────────────────┘
```

- **Client Input:** The client passes **only** the `taskId`.
- **Server Calculation:** The server fetches the quest's difficulty & attribute from the database, computes XP, Gold, and attribute gains, recalculates the level threshold, updates streaks, and commits the completion log.
- **Client Manipulation Defense:** Attempts to pass modified `xp`, `gold`, or `level` values in request payloads are completely ignored or rejected.

---

## 3. Economy & Shop Transaction Security

### Item Purchase Verification
When a user attempts to buy an item from the armory:

1. **Server Balance Fetch:** The server reads `characters.gold` for `auth.uid()`.
2. **Server Price Fetch:** The server reads `items.price` directly from the authoritative `items` table.
3. **Sufficient Funds Check:** Rejects purchase if `character.gold < item.price`.
4. **Duplicate Ownership Check:** Rejects purchase if an entry for `(user_id, item_id)` already exists in `inventory`.
5. **Atomic Purchase Execution:** 
   - Deducts `item.price` from `characters.gold`.
   - Inserts row into `inventory`.
   - Performed within an atomic database RPC function or Server Action transaction.

---

## 4. Row Level Security (RLS) Policy Blueprint

Every table enforces RLS. Example policy definitions:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policy
CREATE POLICY "Users access own profile" ON profiles
  FOR ALL USING (id = auth.uid());

-- 2. Characters Policy
CREATE POLICY "Users read own character" ON characters
  FOR SELECT USING (user_id = auth.uid());

-- 3. Tasks Policy
CREATE POLICY "Users manage own tasks" ON tasks
  FOR ALL USING (user_id = auth.uid());

-- 4. Items Catalog Policy
CREATE POLICY "Authenticated users view shop items" ON items
  FOR SELECT TO authenticated USING (true);
```

---

## 5. Defense Against Common Web Vulnerabilities

- **Cross-Site Scripting (XSS):** Next.js automatically escapes React components. User input (quest titles, descriptions) is sanitized prior to rendering.
- **Cross-Site Request Forgery (CSRF):** Server Actions utilize Next.js's built-in CSRF protection header tokens.
- **SQL Injection:** Supabase client uses parameterized queries exclusively. Raw string interpolation in SQL queries is strictly prohibited.
- **Session Hijacking:** Auth tokens stored in `SameSite=Lax`, `HttpOnly`, `Secure` cookies managed by `@supabase/ssr`.

---

## 6. Environment & Secret Management

- `NEXT_PUBLIC_SUPABASE_URL`: Safe for client exposure.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Safe for client exposure (restricted by RLS).
- **Service Role Keys:** Explicitly prohibited from frontend or server codebase.
- **Git Safety:** `.env.local` ignored by default; `.env.example` provides non-sensitive template documentation.
