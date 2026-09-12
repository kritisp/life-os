# LIFE//OS — Security Architecture & Threat Model

## 1. Custom Application Authentication Architecture

LIFE//OS operates on a secure, server-authoritative **Custom Application Authentication Architecture**:

```
Browser (User UI)
      │
      ▼  (HTTP-only, Secure, SameSite=Lax Cookie: life_os_session)
Next.js Server Action / Route Handler
      │
      ├─► 1. Verify Signed Session Token (HMAC-SHA256 via LIFEOS_SESSION_SECRET)
      ├─► 2. Extract Authenticated User Identity (user.id)
      │
      ▼  (p_user_id passed securely from validated session)
PostgreSQL Database / Atomic RPCs (tasks, characters, inventory)
```

### Core Security Guarantees
1. **Zero Browser DB Access:** The browser client is completely isolated from the database. All reads, mutations, and game transactions are executed via Next.js Server Actions.
2. **Fail-Closed Session Architecture:** `LIFEOS_SESSION_SECRET` is strictly required at runtime. If absent, the server fails closed, preventing session operations with weak or fallback keys.
3. **Hardened Password Hashing:** Passwords are hashed using Node.js `crypto.scryptSync` (64-byte key output) with a 16-byte cryptographic random salt. Password verification is performed using `crypto.timingSafeEqual` to eliminate timing side-channel attacks.
4. **Session Cookie Isolation:** Session tokens are transmitted exclusively inside `HttpOnly`, `SameSite=Lax`, and `Secure` (in production) cookies named `life_os_session`.

---

## 2. Server-Authoritative Progression Security

### Quest Completion Verification Checklist
When a user completes a quest:

```
[ Client Action: completeQuest(taskId) ]
                     │
                     ▼
┌───────────────────────────────────────────────────────────┐
│              SERVER ACTION VALIDATION FLOW                │
├───────────────────────────────────────────────────────────┤
│ 1. Verify Session    ──► Extract user.id from cookie      │
│ 2. Call Atomic RPC   ──► complete_quest_rpc(taskId, uid)  │
│ 3. Row-Level Locks   ──► SELECT ... FOR UPDATE tasks/char │
│ 4. Verify Ownership  ──► Check tasks.user_id = uid        │
│ 5. Duplicate Guard   ──► UNIQUE(task_id) constraint       │
│ 6. Reward & Level-Up ──► Computed server-side in Postgres │
└───────────────────────────────────────────────────────────┘
```

- **Client Input:** The client passes **only** the `taskId`. The user ID is extracted from the verified session.
- **Server Calculation:** The server/RPC fetches the quest's difficulty & attribute from the database, computes XP, Gold, and attribute gains, recalculates the level threshold, updates streaks, and commits the completion log.
- **Race Condition Immunity:** `public.task_completions` enforces a `UNIQUE(task_id)` constraint, preventing duplicate completions even under concurrent requests.

---

## 3. Economy & Shop Transaction Security

### Item Purchase Verification
When a user attempts to buy an item from the armory:

1. **Session Authorization:** Server validates `life_os_session` cookie and extracts `user.id`.
2. **Atomic RPC Execution:** Calls `purchase_item_rpc(itemId, user.id)`.
3. **Server Price & Balance Fetch:** Server locks the character row and reads `items.price` directly from the authoritative catalog.
4. **Sufficient Funds Check:** Rejects purchase if `character.gold < item.price`.
5. **Duplicate Ownership Check:** Rejects purchase if an entry for `(user_id, item_id)` already exists in `inventory`.
6. **Atomic Mutation:** 
   - Deducts `item.price` from `characters.gold`.
   - Inserts row into `inventory`.
   - Returns remaining gold and inventory record atomically.

---

## 4. Server-Side Data Scoping

Every database query in server actions explicitly filters on `authenticatedUser.id`:

```typescript
// Explicit user ID scoping on all queries
const { data: tasks } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

---

## 5. Defense Against Common Web Vulnerabilities

- **Cross-Site Scripting (XSS):** React / Next.js auto-escapes UI rendering. Quest titles, descriptions, and user inputs are strictly sanitized.
- **Cross-Site Request Forgery (CSRF):** Server Actions utilize Next.js built-in CSRF header protection.
- **Timing Attacks:** Password hash and HMAC signature comparisons use `crypto.timingSafeEqual`.
- **SQL Injection:** Parameterized queries and stored procedures protect all SQL operations.
- **Session Hijacking:** Cryptographically signed session tokens with 7-day expiration and HTTP-only cookie flags.

---

## 6. Environment & Secret Management

- `LIFEOS_SESSION_SECRET`: Cryptographically strong secret required for HMAC session signing (fail-closed).
- `SUPABASE_SECRET_KEY`: Server-only key for backend database interactions.
- `DATABASE_URL`: Direct PostgreSQL connection string for running migrations.
- `NEXT_PUBLIC_SUPABASE_URL`: Public endpoint for client connectivity.
- **Git Safety:** `.env.local` is strictly excluded in `.gitignore`.
