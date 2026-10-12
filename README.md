# Sanchiva — Next-Gen Fintech & Banking Platform

A production-grade MERN banking super-app with ACID money movement, real-time
websockets, a Super-Admin command center, 3D glassmorphic virtual cards, smart
analytics, savings vaults, an AI assistant, and dual payment-gateway support
(Stripe + Razorpay test mode).

## Tech Stack
- **Frontend:** Next.js (App Router), Tailwind CSS, Lucide, Recharts, Framer Motion, Socket.io-client
- **Backend:** Node.js, Express.js, Mongoose, Socket.io, JWT, express-rate-limit, PDFKit
- **Database:** MongoDB (Mongoose) with automated seeding
- **Real-time:** Socket.io (per-user JWT-authenticated rooms)
- **Payments:** Stripe Test Mode + Razorpay Test Mode

## Highlights
- **ACID money transfers** — MongoDB multi-document `$transaction` sessions; debit + credit + dual ledger rows commit as one unit (rollback on any failure → no phantom balances).
- **RBAC Super-Admin "God Mode"** — the founder email is auto-elevated to `SUPER_ADMIN`; dual access to the admin command center AND the regular dashboard via an in-app toggle (single-route SPA → no redirect loops).
- **Real-time push** — instant `money-received` / `money-requested` / `card-frozen` events over websockets.
- **Premium UI** — 3D-flipping virtual cards (freeze/reveal-CVV/set-limits), infinite-scroll transactions, spending analytics, savings vaults, receive-QR, and a dark-first responsive design.

## Project Structure
```
sanchiva/
├── backend/      # Express + Mongoose API (port 5000)
│   ├── src/{config,models,middleware,utils,controllers,routes,socket}
│   ├── server.js
│   └── .env / .env.example
├── frontend/     # Next.js App Router UI (port 3000)
│   ├── src/{app,components,lib,providers}
│   └── .env / .env.example
└── package.json  # root: `bun run dev` runs both via concurrently
```

## The 1% Manual Setup (the only secrets you paste)
1. **MongoDB Atlas** (free M0) → paste connection string into `backend/.env` `MONGODB_URI`.
2. **JWT secrets** → `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` × 2 → `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.
3. **Stripe** (https://dashboard.stripe.com → Developers → API keys) → `STRIPE_SECRET_KEY` (backend) + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (frontend).
4. **Razorpay** (https://dashboard.razorpay.com → Settings → API Keys) → `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`.
5. Run `bun run dev`.

## Run Locally
```bash
# from project root — starts the persistent MongoDB + backend + frontend
bun install          # root (concurrently) + cd backend && bun install + cd frontend && bun install
bun run seed         # creates the Super Admin + demo users + 30 days of analytics
bun run dev          # concurrently runs backend :5000 + frontend :3000
```
Open http://localhost:3000 — Super Admin login: `singhalsanchit852@gmail.com`.

## API Surface (all under `/api`, routed via the gateway)
Auth · Accounts · Transactions (ACID transfer) · Cards · Beneficiaries ·
Requests (split bills) · Analytics (spending + rewards) · Notifications ·
Stripe · Razorpay · Statement (PDF) · Chat (AI) · Vaults · Admin (RBAC).

## Deployment
- **Frontend:** Vercel (free) — root dir `frontend`, build `next build`.
- **Backend:** Render (free) or AWS EC2 t2.micro + PM2 — `node server.js`.
- **Database:** MongoDB Atlas M0 (free).

## License
MIT — built as a production-grade reference project.
