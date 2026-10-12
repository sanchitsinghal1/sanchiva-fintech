'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { inr, cn } from '@/lib/utils';

export function Wealth() {
  const { refreshAccount } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setData(await api.get('/api/wealth')); } catch {} finally { setLoading(false); } })(); }, []);
  const pl = data?.pl || 0; const plPct = data?.plPct || 0; const up = pl >= 0;
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Wealth & Investments</h1><p className="text-sm text-muted-foreground">FD, Mutual Funds, Stocks, Gold, Bonds — one portfolio.</p></div>
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="relative overflow-hidden rounded-2xl border border-border p-6">
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', up ? 'from-emerald-500 to-emerald-800' : 'from-rose-500 to-rose-800')} />
        <div className="relative z-10 text-white">
          <div className="text-xs uppercase tracking-widest opacity-80">Total portfolio value</div>
          <div className="text-3xl font-bold">{loading ? '…' : inr(data?.current || 0)}</div>
          <div className="mt-1 text-sm">Invested {loading ? '…' : inr(data?.invested || 0)} · P&L <span className="font-semibold">{up ? '+' : ''}{inr(pl)} ({up?'+':''}{plPct}%)</span></div>
        </div>
      </motion.div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-4 w-4" /> Holdings</CardTitle><CardDescription>{data?.investments?.length || 0} instruments</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {loading ? Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-16 w-full rounded-lg" />)
            : (data?.investments||[]).map((inv,i) => { const u = inv.returnsPct >= 0; return (
              <motion.div key={inv._id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:Math.min(i*0.04,0.3)}} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-secondary/50">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">{inv.type.slice(0,2)}</span>
                <div className="min-w-0 flex-1"><div className="text-sm font-medium">{inv.name}</div><div className="text-xs text-muted-foreground">{inv.type}{inv.units ? ` · ${inv.units} units` : ''}</div></div>
                <div className="text-right"><div className="text-sm font-semibold">{inr(inv.currentValue)}</div><Badge variant={u?'success':'destructive'} className="gap-1">{u?<TrendingUp className="h-3 w-3"/>:<TrendingDown className="h-3 w-3"/>}{u?'+':''}{inv.returnsPct}%</Badge></div>
              </motion.div>);})}
        </CardContent>
      </Card>
    </div>
  );
}
