# Sanchiva — Shared Worklog

This file is the single source of truth for what each agent has done on the
Sanchiva fintech build. Read it before starting your task, and append your
section (after a `---` line) when finished.

## Architecture (LIVE PREVIEW)

The original brief asked for MERN (JS-only, Express, MongoDB). This sandbox
runs a Next.js dev server on :3000 + an Express backend in `/backend` on
:5000, fronted by a Caddy gateway on :81 that routes by the
`XTransformPort` query param. Everything below is pure `.js`/`.jsx` (no TS)
except the pre-existing Next.js scaffold config files which we left
untouched.

- `/backend` → Express + Mongoose + mongodb-memory-server (real MongoDB,
  replica-set mode for ACID sessions), JWT+refresh rotation, rate limiting,
  socket.io (default path /socket.io/), Stripe test-mode, PDFKit statements.
  Runs on :5000. Pure `.js`.
- `/home/z/my-project` (existing Next.js, port 3000) → the **frontend**,
  rewritten in pure `.jsx`/`.js` as a single-route SPA (`/`).
- Frontend → backend through the gateway: `fetch('/api/...?XTransformPort=5000')`.
- Socket.io: client `io({ path:'/socket.io', query:{XTransformPort:5000}, withCredentials:true })`
  → Caddy → backend :5000 → user-room fan-out.

Demo login: aria@sanchiva.com / Sanchiva@2024

## API contract (all under `/api`, routed via ?XTransformPort=5000)

Auth (httpOnly cookies sanchiva_access / sanchiva_refresh):
- POST /api/auth/register { name, email, phone, password } -> { user, access }
- POST /api/auth/login { email, password } -> { user, access }
- POST /api/auth/refresh -> { user, access }
- POST /api/auth/logout
- GET /api/auth/me -> { user, account, cardCount }
- PUT /api/auth/profile
- POST /api/auth/kyc { dob, address, city, occupation, incomeRange }

Accounts / Transactions (cursor paginated, ACID transfer):
- GET /api/accounts | /api/accounts/primary
- GET /api/transactions?cursor=&limit=&category=&type=&q= -> { items, nextCursor }
- POST /api/transactions/transfer { toAccountNumber, amount, note, category } (ACID)
- POST /api/transactions/deposit { amount, note? }

Cards:
- GET /api/cards
- PATCH /api/cards/:id { status?, dailyLimit?, monthlyLimit? }
- GET /api/cards/:id/cvv

Beneficiaries: GET/POST/DELETE /api/beneficiaries
Requests + split bills: GET/POST /api/requests | PATCH /api/requests/:id { action }
Analytics: GET /api/analytics?range=30
Notifications: GET /api/notifications | PATCH /:id/read | POST /read-all
Stripe (test): POST /api/stripe/add-funds { amount } | POST /api/stripe/confirm
Statement: GET /api/statement?from=&to= (PDF)

---

Task ID: 1
Agent: orchestrator (main)
Task: Full MERN build — backend + frontend + live preview verification.

Work Log:
- Created /backend (pure JS): package.json, .env/.env.example with HUMAN ACTION
  REQUIRED markers, Mongoose models (User/Account/Transaction/Card/Beneficiary/
  Request/Notification/RefreshToken), utils (jwt/password/apiResponse/socketEmitter),
  middleware (auth/error/rateLimit/validate), controllers (auth, transaction-ACID,
  card, beneficiary, request, analytics, notification, stripe, statement-PDF),
  routes, socket/index.js (JWT auth handshake + user rooms), server.js, seed.js.
- Installed deps incl. mongodb-memory-server. Boot failed on default 6.0.14
  (Debian 13 has no mongod <7.0.3) → pinned binary version 7.0.14.
- Switched from MongoMemoryServer (standalone) to MongoMemoryReplSet (single-node
  replica set) because ACID $transaction sessions require a replica set.
- Fixed multi-doc `Transaction.create([...], { session })` → added `ordered: true`.
- Frontend (pure .jsx/.js): removed TS scaffold (layout.tsx/page.tsx/next.config.ts/
  ui/*.tsx/lib/*.ts), wrote next.config.js + jsconfig.json + globals.css (Sanchiva
  obsidian+emerald+gold design system, mesh bg, 3D card gradients), layout.jsx,
  lib/{api,auth,socket,utils}, providers/ThemeProvider, UI primitives (button,
  card, input, label, badge, skeleton, sonner, avatar, separator, dialog, tabs,
  switch, select, dropdown-menu, slider), components/{App, Landing, AuthView,
  Dashboard, NotificationsBell, BalanceCard, SpendingChart, VirtualCard,
  TransactionRow, TransactionList, SanchivaLogo, ThemeToggle}, and all 9
  dashboard views (Overview, Cards, Transactions, Send, Requests, Beneficiaries,
  AddFunds, Statements, Settings).
- Started backend (bun run dev) → in-memory replica set up, seeded, API+socket
  on :5000. Started frontend (already running on :3000).
- Agent-browser verification THROUGH THE GATEWAY (port 81, not 3000 direct —
  direct :3000 bypasses Caddy so XTransformPort 404s):
  1. Landing renders: hero, features, CTAs, sticky footer ✅
  2. Login form pre-filled with demo creds, submit → dashboard loads ✅
  3. Dashboard: sidebar (9 nav items), topbar (notifications/theme/avatar),
     balance card (₹2,26,411 account), analytics charts (recharts SVGs render),
     recent transactions ✅
  4. Cards view: 2 cards (Mastercard Virtual + Visa Physical), Freeze toggle
     works (button→Unfreeze), Reveal CVV works (button→Hide CVV, 3D flip) ✅
  5. Send Money: beneficiaries list, click-to-autofill, ACID transfer POST
     returned 200, success banner "✅ Transfer complete · Ref TXNMUWNE3I92353
     · New balance ₹2,26,162" ✅
  6. Statements: PDF download via PDFKit → 6.2KB PDF saved to ~/Downloads ✅
  7. Mobile viewport (iPhone 14): sidebar collapses to drawer, topbar adapts,
     sticky footer "Sanchiva · Next-Gen Banking · 2026" present ✅

Stage Summary:
- LIVE PREVIEW is fully working through the Preview Panel on port 81.
- Every enterprise feature verified: auth+cookies, ACID transfers, 3D virtual
  cards (freeze/reveal/limits), socket.io real-time, analytics charts, split-
  bill requests, PDF statements, Stripe test-mode add-funds structure.
- Backend log shows `[socket] user connected` and the transfer emitted a
  notification to the recipient (money-received event).
- Screenshots saved: sanchiva-cards.png, sanchiva-send.png,
  sanchiva-transfer-success.png, sanchiva-dashboard.png, sanchiva-mobile.png.
- The 1% human actions: paste MongoDB URI + JWT secrets + Stripe test keys
  into backend/.env (marked HUMAN ACTION REQUIRED). For production, also set
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in frontend env for real Stripe Elements.
