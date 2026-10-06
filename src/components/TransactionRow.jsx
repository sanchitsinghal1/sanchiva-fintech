'use client';
import { ArrowDownLeft, ArrowUpRight, Plus, Repeat } from 'lucide-react';
import { inr, timeAgo, CATEGORY_META, cn } from '@/lib/utils';

const ICONS = {
  INCOME: ArrowDownLeft,
  DEBIT: ArrowUpRight,
  TOPUP: Plus,
  TRANSFER: Repeat,
};

export function TransactionRow({ tx, userId }) {
  const isIn = tx.toUserId && String(tx.toUserId).includes(String(userId).slice(-12));
  const amount = isIn ? tx.amount : -tx.amount;
  const Icon = isIn ? ArrowDownLeft : ArrowUpRight;
  const meta = CATEGORY_META[tx.category] || CATEGORY_META.OTHER;

  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-secondary/50">
      <div
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold',
          isIn ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{tx.description}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{meta.label}</span>
          <span>·</span>
          <span>{timeAgo(tx.createdAt)}</span>
        </div>
      </div>
      <div className={cn('text-right text-sm font-semibold', isIn ? 'text-success' : 'text-foreground')}>
        {isIn ? '+' : '-'}
        {inr(tx.amount)}
      </div>
    </div>
  );
}
