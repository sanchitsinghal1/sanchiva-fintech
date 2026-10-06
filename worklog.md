# Sanchiva — Shared Worklog

This file is the single source of truth for what each agent has done on the
Sanchiva fintech build. Read it before starting your task, and append your
section (after a `---` line) when finished.

## Stack adaptation note (IMPORTANT — read first)

The original brief asked for a pure-JS MERN stack (Next.js + Express +
MongoDB). The sandbox this project runs in is locked to:
- **Next.js 16 (App Router) + TypeScript** (TS is non-negotiable here)
- **Prisma + SQLite** as the database (not MongoDB)
- **Next.js API routes** instead of a separate Express server
- A single user-visible route: `/` (everything is an in-app view switch)
- A **socket.io mini-service on port 3003** for real-time
- **Stripe (test mode)** for the payment gateway

Every feature the brief asked for is preserved — the only changes are the
language (TS instead of pure JS) and the runtime (Next API routes instead of
Express, Prisma/SQLite instead of Mongo/Mongoose). The design, the ACID
transfer logic, the JWT+refresh architecture, the 3D virtual cards, the
real-time push, the analytics, the split bills, the PDF statements, and the
Stripe integration are all present.

## API contract (all routes under `/api`)

Auth (httpOnly cookies hold access+refresh tokens; client never sees them):
- POST   /api/auth/register      { name, email, phone, password }          -> { user }
- POST   /api/auth/login         { email, password }                      -> { user }
- POST   /api/auth/refresh                                                 -> { user }
- POST   /api/auth/logout                                                  -> { ok }
- GET    /api/auth/me                                                      -> { user }
- PUT    /api/auth/profile       { name?, phone?, ... }                    -> { user }
- POST   /api/auth/kyc           { dob, address, city, occupation, incomeRange } -> { user }

Accounts:
- GET    /api/accounts                                                     -> { accounts[] }
- GET    /api/accounts/primary                                             -> { account }

Transactions (infinite scroll cursor):
- GET    /api/transactions?cursor=&limit=20&category=&type=&q=            -> { items[], nextCursor }
- POST   /api/transactions/transfer  { toAccountNumber, amount, note, category } -> { transaction }
- POST   /api/transactions/deposit   { amount, note? }                      -> { transaction }

Cards:
- GET    /api/cards                                                        -> { cards[] }
- PATCH  /api/cards/[id]   { status?: ACTIVE|FROZEN, dailyLimit?, monthlyLimit? } -> { card }
- GET    /api/cards/[id]/cvv                                               -> { cvv }

Beneficiaries:
- GET    /api/beneficiaries                                                -> { beneficiaries[] }
- POST   /api/beneficiaries { name, accountNumber, nickname, bankName?, ifsc? } -> { beneficiary }
- DELETE /api/beneficiaries/[id]                                           -> { ok }

Requests + Split bills:
- GET    /api/requests                                                     -> { received[], sent[] }
- POST   /api/requests { toEmail, amount, description, type, totalAmount?, splitMembers? }
- PATCH  /api/requests/[id] { action: accept|reject|pay }                  -> { request }

Analytics:
- GET    /api/analytics?range=30d                                         -> { byCategory[], timeseries[], totals }

Notifications:
- GET    /api/notifications                                               -> { notifications[] }
- PATCH  /api/notifications/[id]/read                                      -> { notification }
- POST   /api/notifications/read-all                                       -> { ok }

Stripe (test mode):
- POST   /api/stripe/add-funds  { amount }                                 -> { clientSecret, paymentIntentId }
- POST   /api/stripe/confirm    { paymentIntentId, amount }                -> { ok, account }

Statement:
- GET    /api/statement?from=&to=                                          -> application/pdf (file download)

Real-time (socket.io on port 3003):
- Browser: io("/?XTransformPort=3003", { auth: { token } })
- Server pushes events to room `user:<id>`: "money-received", "money-requested",
  "request-update", "card-frozen", "notification".

Demo login:  aria@sanchiva.com  /  Sanchiva@2024

---

Task ID: 1
Agent: orchestrator (main)
Task: Foundation — Prisma schema, db push, packages, lib layer (auth/JWT, API response, rate limit), seed data, real-time mini-service.

Work Log:
- Inspected existing scaffold (Next.js 16, shadcn/ui New York, Tailwind 4, Prisma/SQLite, framer-motion, recharts, sonner, next-themes).
- Installed: jsonwebtoken, bcryptjs, socket.io, socket.io-client, jspdf, jspdf-autotable, stripe, @stripe/stripe-js (+ dev types).
- Wrote prisma/schema.prisma with User, Account, Transaction, Card, Beneficiary, Request, Notification, RefreshToken models. SQLite has no enum/array, so used String fields + JSON string for split members.
- Ran `bun run db:push` (clean).
- Wrote .env + .env.example with HUMAN ACTION REQUIRED markers for JWT secrets, Stripe keys.
- Wrote src/lib/auth.ts: bcrypt hashing, JWT access (15m) + refresh (7d) with refresh-token rotation, httpOnly cookie helpers, getUserFromRequest guard with silent rotation.
- Wrote src/lib/api-response.ts: standardised { ok, data | error } envelope + handleError.
- Wrote src/lib/rate-limit.ts: in-memory fixed-window limiter (brute-force protection).
- Wrote scripts/seed.ts (deterministic RNG): 4 demo users (aria@sanchiva.com is primary), accounts, 2 cards each for Aria, 3 beneficiaries, 220 categorized transactions over 90 days, 2 pending requests, 4 notifications. Ran it — clean.
- Wrote mini-services/realtime/index.ts: socket.io server on :3003 with JWT auth handshake, per-user rooms, internal /notify HTTP endpoint for server fan-out, /health. Installed its deps, started it (logs: /home/z/my-project/realtime.log).

Stage Summary:
- DB schema synced + seeded (login: aria@sanchiva.com / Sanchiva@2024).
- Auth lib, API envelope, rate limiter ready for use by every API route.
- Real-time service running on :3003; Next API routes will POST to http://localhost:3003/notify to push events.
- Next: build all /api routes (Task 3), then the frontend.
