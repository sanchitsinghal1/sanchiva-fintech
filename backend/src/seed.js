/**
 * SANCHIVA — Database seed (dev)
 * Run with:  cd backend && node src/seed.js
 * Also auto-run on first boot by config/db.js (in-memory mode).
 * Creates demo users, accounts, cards, beneficiaries, 90 days of categorized
 * transactions, and pending requests — so the analytics charts, infinite-
 * scroll list, and split-bill flows have meaningful data on first launch.
 *
 * Demo login:  aria@sanchiva.com  /  Sanchiva@2024
 */
const mongoose = require('mongoose');
const User = require('./models/User');
const Account = require('./models/Account');
const Card = require('./models/Card');
const Beneficiary = require('./models/Beneficiary');
const Request = require('./models/Request');
const Notification = require('./models/Notification');
const Transaction = require('./models/Transaction');
const { hashPassword } = require('./utils/password');

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(42);
const pick = (a) => a[Math.floor(rng() * a.length)];
const money = (min, max) => Math.round((min + rng() * (max - min)) * 100) / 100;
const digits = (n) => Array.from({ length: n }, () => Math.floor(rng() * 10)).join('');

const CATEGORIES = ['FOOD', 'TRAVEL', 'BILLS', 'SHOPPING', 'TRANSFER', 'OTHER'];
const MERCHANTS = {
  FOOD: ['Swiggy', 'Zomato', "Blue Tokai Coffee", "Domino's", 'BigBasket'],
  TRAVEL: ['Uber', 'IRCTC', 'IndiGo', 'Ola', 'MakeMyTrip'],
  BILLS: ['BESCOM Electricity', 'Airtel Broadband', 'Jio Fiber', 'BBMP Water'],
  SHOPPING: ['Amazon', 'Flipkart', 'Myntra', 'Apple Store', 'Croma'],
  TRANSFER: ['Peer Transfer'],
  OTHER: ['Misc'],
};

async function makeUser(o) {
  const passwordHash = await hashPassword('Sanchiva@2024');
  const user = await User.create({
    name: o.name,
    email: o.email,
    phone: o.phone,
    passwordHash,
    kycStatus: 'VERIFIED',
    avatarColor: o.color,
    city: 'Bengaluru',
    country: 'India',
    occupation: o.occupation || 'Software Engineer',
    incomeRange: '12-25 LPA',
    address: `${Math.floor(rng() * 200)} MG Road`,
    dob: '1996-04-12',
  });
  const account = await Account.create({
    userId: user._id,
    accountNumber: digits(10),
    type: 'SAVINGS',
    balance: money(50000, 250000),
  });
  return { user, account };
}

async function makeCard(user, account, color) {
  return Card.create({
    userId: user._id,
    accountId: account._id,
    cardNumber: `4242 4242 4242 ${digits(4)}`,
    cardHolder: user.name.toUpperCase(),
    expiryMonth: String(1 + Math.floor(rng() * 12)).padStart(2, '0'),
    expiryYear: String(27 + Math.floor(rng() * 5)),
    cvvHash: `demo:${digits(3)}`,
    network: pick(['VISA', 'MASTERCARD']),
    type: pick(['VIRTUAL', 'PHYSICAL']),
    color,
    spentToday: money(0, 5000),
    spentThisMonth: money(0, 40000),
  });
}

async function seed() {
  // Idempotent: only seed if no users exist.
  const count = await User.countDocuments();
  if (count > 0) {
    console.log('Seed skipped — data already present.');
    return;
  }
  console.log('🌱 Seeding Sanchiva database...');

  const aria = await makeUser({
    name: 'Aria Sharma',
    email: 'aria@sanchiva.com',
    phone: '+91 98765 43210',
    color: 'emerald',
    occupation: 'Product Designer',
  });
  const peers = await Promise.all([
    makeUser({ name: 'Rohan Verma', email: 'rohan@sanchiva.com', phone: '+91 90000 11111', color: 'violet' }),
    makeUser({ name: 'Meera Iyer', email: 'meera@sanchiva.com', phone: '+91 90000 22222', color: 'amber' }),
    makeUser({ name: 'Karan Malhotra', email: 'karan@sanchiva.com', phone: '+91 90000 33333', color: 'rose' }),
  ]);

  await makeCard(aria.user, aria.account, 'emerald');
  await makeCard(aria.user, aria.account, 'obsidian');

  for (const p of peers) {
    await Beneficiary.create({
      userId: aria.user._id,
      name: p.user.name,
      accountNumber: p.account.accountNumber,
      bankName: 'Sanchiva Bank',
      ifsc: 'SANC0001',
      nickname: p.user.name.split(' ')[0],
    });
  }

  const now = Date.now();
  const txns = [];
  for (let i = 0; i < 220; i++) {
    const daysAgo = Math.floor(rng() * 90);
    const createdAt = new Date(now - daysAgo * 86400_000 - Math.floor(rng() * 86400_000));
    const isIncome = rng() < 0.15;
    const category = isIncome ? 'INCOME' : pick(CATEGORIES);
    const merchant = pick(MERCHANTS[category] || ['Misc']);
    const amount = isIncome ? money(5000, 60000) : money(50, 4500);
    txns.push(
      Transaction.create({
        fromAccountId: isIncome ? null : aria.account._id,
        toAccountId: isIncome ? aria.account._id : null,
        fromUserId: isIncome ? null : aria.user._id,
        toUserId: isIncome ? aria.user._id : null,
        amount,
        type: isIncome ? 'DEPOSIT' : 'PAYMENT',
        status: 'COMPLETED',
        category,
        description: merchant,
        reference: `TXN${Math.floor(rng() * 1e9)}`,
        createdAt,
      })
    );
  }
  await Promise.all(txns);

  await Request.create({
    fromUserId: peers[0].user._id,
    toUserId: aria.user._id,
    amount: 1850,
    description: 'Dinner at Toit last Friday',
    type: 'REQUEST',
    status: 'PENDING',
  });
  await Request.create({
    fromUserId: peers[1].user._id,
    toUserId: aria.user._id,
    amount: 4200,
    description: 'Goa trip — flight + stay split',
    type: 'SPLIT',
    totalAmount: 12600,
    splitMembers: [
      { userId: aria.user._id, name: 'Aria', share: 4200 },
      { userId: peers[1].user._id, name: 'Meera', share: 4200 },
      { userId: peers[2].user._id, name: 'Karan', share: 4200 },
    ],
    status: 'PENDING',
  });

  await Notification.create([
    { userId: aria.user._id, title: 'Welcome to Sanchiva', message: 'Your premium banking account is ready.', type: 'SYSTEM' },
    { userId: aria.user._id, title: 'Salary credited', message: '₹58,400 received from Acme Corp Payroll.', type: 'TRANSACTION' },
    { userId: aria.user._id, title: 'New money request', message: 'Rohan requested ₹1,850 from you.', type: 'REQUEST' },
    { userId: aria.user._id, title: 'Card delivered', message: 'Your Sanchiva Virtual Card is now active.', type: 'SECURITY' },
  ]);

  console.log('✅ Seed complete.');
  console.log('   Login with:  aria@sanchiva.com  /  Sanchiva@2024');
}

// standalone run
if (require.main === module) {
  require('dotenv').config();
  mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sanchiva')
    .then(() => seed().then(() => process.exit(0)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { seed };
