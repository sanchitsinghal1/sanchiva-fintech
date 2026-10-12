// Sanchiva shared helpers
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format a number as INR currency
export function inr(n, opts = {}) {
  const value = Number(n || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: opts.decimals ?? 0,
    minimumFractionDigits: opts.decimals ?? 0,
  }).format(value);
}

// Compact INR (₹1.2L / ₹3.4Cr) for tight spaces
export function inrCompact(n) {
  const v = Number(n || 0);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
}

export function formatDate(d, style = 'medium') {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: style }).format(new Date(d));
}

export function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return formatDate(d, 'short');
}

// Mask a card PAN: "4242 4242 4242 1337" → "•••• •••• •••• 1337"
export function maskCard(num) {
  if (!num) return '•••• •••• •••• ••••';
  const clean = String(num).replace(/\s+/g, '');
  const last4 = clean.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

export function initials(name = '') {
  return name
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Map avatarColor key → tailwind gradient classes
export const GRADIENTS = {
  emerald: 'from-emerald-500 to-teal-700',
  violet: 'from-violet-500 to-purple-800',
  amber: 'from-amber-500 to-orange-700',
  rose: 'from-rose-500 to-pink-700',
  cyan: 'from-cyan-500 to-sky-700',
};

export const CATEGORY_META = {
  FOOD: { label: 'Food & Dining', icon: '🍽️' },
  TRAVEL: { label: 'Travel', icon: '✈️' },
  BILLS: { label: 'Bills', icon: '💡' },
  SHOPPING: { label: 'Shopping', icon: '🛍️' },
  INCOME: { label: 'Income', icon: '📈' },
  TRANSFER: { label: 'Transfer', icon: '🔁' },
  OTHER: { label: 'Other', icon: '•' },
};
