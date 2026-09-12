# LIFE//OS — System Architecture

## 1. System Topology

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER CLIENT                           │
│     Next.js App Router (React Client Components + Framer Motion) │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ HTTPS / Cookies (life_os_session)
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP SERVER                        │
│  ├── React Server Components (RSC) for initial page render       │
│  ├── Server Actions for authoritative domain mutations           │
│  ├── Custom Auth Service (scrypt hashing, HMAC-SHA256 tokens)    │
│  └── Domain Services (Progression Engine, Economy Service)      │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ Server-Scoped Supabase Client
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                     SUPABASE POSTGRESQL BACKEND                  │
│  ├── Profiles & Character Tables (User records & progression)    │
│  ├── Atomic Stored Procedures (complete_quest_rpc, etc.)         │
│  └── Foreign Key & Unique Constraints (Data integrity)          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Server & Client Boundaries

### React Server Components (RSC) & Server Actions
- Server Components render page layouts and fetch authenticated user profiles, character stats, and quests directly from the server.
- All domain mutations (quest completion, item purchases, quest chains) run through Next.js Server Actions.
- Server Actions enforce session authentication and user isolation by validating the `life_os_session` cookie before any database operation.

### React Client Components
- Handle interactive UI elements: quest completion animations, modal toggles, shop item previewing, and state transitions.
- Use Framer Motion for sleek cyberpunk / tactical RPG transitions.
- The browser never communicates with the database directly.

---

## 3. Custom Authentication & Session Flow

```
[ User Action: Login / Signup ]
              │
              ▼
    [ Next.js Server Action ] ──► Verifies scrypt password hash or creates profile
              │
              ▼
    [ Session Token Mint ]    ──► Signs HMAC-SHA256 JWT using LIFEOS_SESSION_SECRET
              │
              ▼
    [ HTTP-Only Cookie ]      ──► Sets life_os_session cookie (SameSite=Lax, Secure)
              │
              ▼
    [ Server Action Context ] ──► getCurrentUser() extracts verified user.id
```

1. **Authentication:** Custom email/password authentication using Node.js `crypto.scryptSync` with random 16-byte cryptographic salts.
2. **Session Persistence:** HTTP-only `life_os_session` cookie storing HMAC-SHA256 signed tokens with 7-day expiration.
3. **Route Protection:** Protected dashboard layout validates `getCurrentUser()` on each navigation and redirects unauthenticated requests to `/auth`.

---

## 4. Database & Progression Engine Responsibilities

### Database Responsibility (Supabase PostgreSQL)
- Stores canonical user profiles, character stats, tasks, completions, shop inventory, items, and achievements.
- Atomic Stored Procedures (`complete_quest_rpc`, `purchase_item_rpc`) accept `p_user_id` passed from validated server actions to guarantee atomic state changes.
- Table constraints (`UNIQUE(task_id)` on `task_completions`, `UNIQUE(user_id, item_id)` on `inventory`) prevent race conditions.

### Progression Engine Responsibility (Next.js Domain Services)
- Calculates XP thresholds, stat points, level increases, and gold rewards upon valid quest submission.
- Evaluates streak validity and momentum scores.
- Triggers achievement unlocks when threshold conditions are satisfied.
- **Strict Invariant:** The client browser is never trusted to calculate XP or gold.

---

## 5. Target Deployment Architecture

- **Frontend & App Server:** Deployed on **Vercel** (Serverless Node.js runtime).
- **Backend & Persistence:** Managed **Supabase** PostgreSQL instance.
- **Zero Third-Party Backend Dependencies:** Clean, maintainable Next.js 16 + TypeScript architecture.
