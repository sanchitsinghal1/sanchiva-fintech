// ============================================================================
// SANCHIVA — Database seed
// ----------------------------------------------------------------------------
// Run with:  bun run scripts/seed.ts
// Creates demo users (KYC-verified), their primary accounts, virtual cards,
// beneficiaries, and ~3 months of categorized transactions. Designed so the
// analytics charts, infinite-scroll transaction list, and split-bill flows
// all have meaningful data on first launch.
// ============================================================================

import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

// Tiny seeded RNG so the seed is deterministic across runs.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(42);
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const money = (min: number, max: number) =>
  Math.round((min + rng() * (max - min)) * 100) / 100;

const CATEGORIES = ["FOOD", "TRAVEL", "BILLS", "SHOPPING", "INCOME", "TRANSFER", "OTHER"];
const MERCHANTS: Record<string, string[]> = {
  FOOD: ["Swiggy", "Zomato", "Blue Tokai Coffee", "Domino's", "BigBasket"],
  TRAVEL: ["Uber", "IRCTC", "IndiGo", "Ola", "Makemytrip"],
  BILLS: ["BESCOM Electricity", "Airtel Broadband", "Jio Fiber", "BBMP Water"],
  SHOPPING: ["Amazon", "Flipkart", "Myntra", "Apple Store", "Croma"],
  INCOME: ["Salary Credit", "Refund", "Cashback"],
  TRANSFER: ["Peer Transfer"],
  OTHER: ["Misc"],
};

async function makeUser(opts: {
  name: string;
  email: string;
  phone: string;
  color: string;
  city?: string;
  occupation?: string;
}) {
  const passwordHash = await hashPassword("Sanchiva@2024");
  const user = await db.user.create({
    data: {
      email: opts.email,
      passwordHash,
      name: opts.name,
      phone: opts.phone,
      kycStatus: "VERIFIED",
      avatarColor: opts.color,
      city: opts.city ?? "Bengaluru",
      country: "India",
      occupation: opts.occupation ?? "Software Engineer",
      incomeRange: "12-25 LPA",
      address: `${Math.floor(rng() * 200)} MG Road`,
    },
  });
  const account = await db.account.create({
    data: {
      userId: user.id,
      accountNumber: String(10_000_000 + Math.floor(rng() * 89_999_999)),
      type: "SAVINGS",
      balance: money(50000, 250000),
      currency: "INR",
    },
  });
  return { user, account };
}

async function makeCard(user: { id: string; name: string }, account: { id: string }, color: string) {
  const last4 = String(1000 + Math.floor(rng() * 8999));
  const cardNumber = `4242 4242 4242 ${last4}`;
  const expiryMonth = String(1 + Math.floor(rng() * 12)).padStart(2, "0");
  const expiryYear = String(27 + Math.floor(rng() * 5));
  // CVV stored as a hashed value; we also keep the raw 3 digits available
  // for the demo reveal toggle by storing them obfuscated. In production,
  // the CVV would never be retrievable — only transiently shown to the user
  // by the issuing bank.
  const cvv = String(100 + Math.floor(rng() * 899));
  const cvvHash = `demo:${cvv}`; // demo-only marker; see cards API.
  return db.card.create({
    data: {
      userId: user.id,
      accountId: account.id,
      cardNumber,
      cardHolder: user.name.toUpperCase(),
      expiryMonth,
      expiryYear,
      cvvHash,
      network: pick(["VISA", "MASTERCARD"]),
      type: pick(["VIRTUAL", "PHYSICAL"]),
      status: "ACTIVE",
      dailyLimit: 50000,
      monthlyLimit: 200000,
      color,
      spentToday: money(0, 5000),
      spentThisMonth: money(0, 40000),
    },
  });
}

async function main() {
  console.log("🌱 Seeding Sanchiva database...");
  // Wipe (safe — dev only)
  await db.notification.deleteMany();
  await db.refreshToken.deleteMany();
  await db.request.deleteMany();
  await db.beneficiary.deleteMany();
  await db.transaction.deleteMany();
  await db.card.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();

  // --- Primary demo user (the one you'll log in as) ------------------------
  const { user: aria, account: ariaAcc } = await makeUser({
    name: "Aria Sharma",
    email: "aria@sanchiva.com",
    phone: "+91 98765 43210",
    color: "emerald",
    city: "Bengaluru",
    occupation: "Product Designer",
  });
  // --- Peer users (so transfers + requests have real recipients) -----------
  const peers = await Promise.all([
    makeUser({ name: "Rohan Verma", email: "rohan@sanchiva.com", phone: "+91 90000 11111", color: "violet" }),
    makeUser({ name: "Meera Iyer", email: "meera@sanchiva.com", phone: "+91 90000 22222", color: "amber" }),
    makeUser({ name: "Karan Malhotra", email: "karan@sanchiva.com", phone: "+91 90000 33333", color: "rose" }),
  ]);

  // --- Cards for the primary user -------------------------------------------
  await makeCard(aria, ariaAcc, "emerald");
  await makeCard(aria, ariaAcc, "obsidian");

  // --- Beneficiaries ---------------------------------------------------------
  for (const p of peers) {
    await db.beneficiary.create({
      data: {
        userId: aria.id,
        name: p.user.name,
        accountNumber: p.account.accountNumber,
        bankName: "Sanchiva Bank",
        ifsc: "SANC0001",
        nickname: p.user.name.split(" ")[0],
      },
    });
  }

  // --- 90 days of transactions for Aria --------------------------------------
  const txs: Promise<any>[] = [];
  const now = Date.now();
  for (let i = 0; i < 220; i++) {
    const daysAgo = Math.floor(rng() * 90);
    const createdAt = new Date(now - daysAgo * 86400_000 - Math.floor(rng() * 86400_000));
    const isIncome = rng() < 0.15;
    const category = isIncome ? "INCOME" : pick(CATEGORIES.filter((c) => c !== "INCOME"));
    const merchants = MERCHANTS[category] ?? ["Misc"];
    const merchant = pick(merchants);
    const amount = isIncome ? money(5000, 60000) : money(50, 4500);
    txs.push(
      db.transaction.create({
        data: {
          fromAccountId: isIncome ? null : ariaAcc.id,
          toAccountId: isIncome ? ariaAcc.id : null,
          fromUserId: isIncome ? "external" : aria.id,
          toUserId: isIncome ? aria.id : "external",
          amount,
          type: isIncome ? "DEPOSIT" : "PAYMENT",
          status: "COMPLETED",
          category,
          description: merchant,
          reference: `TXN${Math.floor(rng() * 1e9)}`,
          createdAt,
        },
      })
    );
  }
  await Promise.all(txs);

  // --- A pending money request from a peer ----------------------------------
  await db.request.create({
    data: {
      fromUserId: peers[0].user.id,
      toUserId: aria.id,
      amount: 1850,
      description: "Dinner at Toit last Friday",
      type: "REQUEST",
      status: "PENDING",
    },
  });
  await db.request.create({
    data: {
      fromUserId: peers[1].user.id,
      toUserId: aria.id,
      amount: 4200,
      description: "Goa trip — flight + stay split",
      type: "SPLIT",
      totalAmount: 12600,
      splitMembers: JSON.stringify([
        { userId: aria.id, name: "Aria", share: 4200 },
        { userId: peers[1].user.id, name: "Meera", share: 4200 },
        { userId: peers[2].user.id, name: "Karan", share: 4200 },
      ]),
      status: "PENDING",
    },
  });

  // --- Welcome notifications ------------------------------------------------
  await db.notification.createMany({
    data: [
      { userId: aria.id, title: "Welcome to Sanchiva", message: "Your premium banking account is ready.", type: "SYSTEM" },
      { userId: aria.id, title: "Salary credited", message: "₹58,400 received from Acme Corp Payroll.", type: "TRANSACTION" },
      { userId: aria.id, title: "New money request", message: "Rohan requested ₹1,850 from you.", type: "REQUEST" },
      { userId: aria.id, title: "Card delivered", message: "Your Sanchiva Virtual Card is now active.", type: "SECURITY" },
    ],
  });

  console.log("✅ Seed complete.");
  console.log("   Login with:  aria@sanchiva.com  /  Sanchiva@2024");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
