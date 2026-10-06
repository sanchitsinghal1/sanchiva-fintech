'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { inr } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function BalanceCard({ account, user, className }) {
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(account?.accountNumber || '');
      setCopied(true);
      toast.success('Account number copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'card-emerald relative overflow-hidden rounded-2xl p-6 text-white shadow-2xl shadow-emerald-900/30',
        className
      )}
    >
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-widest opacity-80">
            {account?.type} · {account?.currency}
          </div>
          <div className="mt-1 text-sm opacity-90">{user?.name}</div>
        </div>
        <button
          onClick={() => setHidden((h) => !h)}
          className="rounded-md p-1.5 opacity-80 transition hover:bg-white/10 hover:opacity-100"
          aria-label="Toggle balance visibility"
        >
          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <div className="relative z-10 mt-6">
        <div className="text-xs uppercase tracking-widest opacity-70">Available balance</div>
        <div className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          {hidden ? '₹ ••••••••' : inr(account?.balance || 0, { decimals: 2 })}
        </div>
      </div>

      <div className="relative z-10 mt-6 flex items-center justify-between text-sm">
        <div>
          <div className="text-[10px] uppercase tracking-widest opacity-70">Account number</div>
          <button onClick={copy} className="mt-0.5 flex items-center gap-1.5 font-mono tracking-wider hover:underline">
            {account?.accountNumber?.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3')}
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 opacity-70" />}
          </button>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest opacity-70">IFSC</div>
          <div className="mt-0.5 font-mono">SANC0001</div>
        </div>
      </div>

      {/* decorative blobs */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
    </motion.div>
  );
}
