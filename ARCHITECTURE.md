# LIFE//OS — System Architecture

## 1. System Topology

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER CLIENT                           │
│     Next.js App Router (React Client Components + Framer Motion) │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ HTTPS / WSS
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP SERVER                        │
│  ├── React Server Components (RSC) for initial page render       │
│  ├── Server Actions for authoritative domain mutations           │
│  ├── Middleware for session refresh & authentication routing    │
│  └── Domain Services (Progression Engine, Economy Service)      │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ Supabase SSR / Node SDK
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                     SUPABASE BACKEND PLATFORM                    │
│  ├── Supabase Auth (JWT management, Session persistence)        │
│  ├── PostgreSQL Database (Authoritative state)                   │
│  └── Row Level Security (RLS policies scoping data per user)    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Server & Client Boundaries

### React Server Components (RSC)
- Render initial page layouts, fetch authenticated user profiles, character stats, and quest lists directly from Supabase server clients.
- Never expose API credentials or raw database connections to the client.
- Eliminate client-side waterfalls by performing data fetching on the server.

### React Client Components
- Handle interactive UI elements: quest completion animations, modal toggles, shop item previewing, and optimistic visual updates.
- Use Framer Motion for sleek RPG transitions.
- Communicate with the server exclusively via Next.js Server Actions or API Route Handlers.

---

## 3. Authentication & Session Flow

```
[ User Action: Login / Signup ]
              │
              ▼
    [ Supabase Auth API ] ──► Validates Credentials & Emits JWT
              │
              ▼
    [ Next.js Middleware ] ──► Reads Cookies, Refreshes Session, Sets Auth Headers
              │
              ▼
   [ Server Action / RSC ] ──► Context contains authenticated User ID (sub)
```

1. **Authentication:** Performed via `@supabase/ssr` leveraging browser PKCE flow for secure cookie-based session management.
2. **Session Persistence:** Next.js Middleware intercepts incoming HTTP requests, refreshes expiring Supabase sessions, and manages cookie rotation.
3. **Route Protection:** Public routes (`/auth`) redirect authenticated users to `/`. Protected routes (`/`, `/quests`, `/shop`, `/stats`, `/achievements`) redirect unauthenticated requests to `/auth`.

---

## 4. Database & Progression Engine Responsibilities

### Database Responsibility (Supabase PostgreSQL + RLS)
- Stores canonical user profiles, character stats, task records, completions, shop inventory, items, and achievements.
- Enforces data safety at the storage layer via Row Level Security (RLS) policies.
- Guarantees database integrity through foreign key constraints and transactional consistency.

### Progression Engine Responsibility (Next.js Domain Services)
- Calculates XP thresholds, stat points, level increases, and gold rewards upon valid quest submission.
- Evaluates streak validity (calendar date delta in UTC) and momentum scores.
- Triggers achievement unlocks when threshold conditions are satisfied.
- **Strict Invariant:** The client browser is never trusted to calculate XP or gold. The client submits only a `taskId`, and the server evaluates all rewards.

---

## 5. Security & Isolation Principles

1. **Row Level Security (RLS):** Every table containing user data relies on RLS (`auth.uid() = user_id`) to ensure users can only read/write their own records.
2. **No Exposed Service Role Keys:** All application code runs under standard Supabase anon/publishable key authorization, adhering strictly to user RLS bounds.
3. **Input Validation:** All Server Actions validate request payloads (e.g. using `zod` or strict TypeScript type assertion schemas) prior to database execution.
4. **Error Sanitization:** Database errors are logged server-side and mapped to safe, standardized client error messages to prevent database structure leakages.

---

## 6. Target Deployment Architecture

- **Frontend & App Server:** Deployed on **Vercel** (Edge / Serverless Node.js runtime).
- **Backend & Persistence:** Managed **Supabase** instance (Postgres DB + Auth Service).
- **Zero Third-Party Backend Dependencies:** No secondary Express or Python FastAPI backends are required, maintaining a clean, performant full-stack JavaScript/TypeScript architecture.
