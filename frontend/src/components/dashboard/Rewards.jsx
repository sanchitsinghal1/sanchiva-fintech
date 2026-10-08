'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Gift, Sparkles, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { inr, timeAgo, cn } from '@/lib/utils';
const TIER_META = { SILVER:{label:'Silver',color:'from-slate-400 to-slate-600',perks:'1% base cashback · basic vaults'}, GOLD:{label:'Gold',color:'from-amber-400 to-amber-600',perks:'2% cashback · multi-currency · priority support'}, OBSIDIAN:{label:'Obsidian',color:'from-emerald-500 to-emerald-800',perks:'Up to 5% cashback · disposable cards · concierge'} };
export function Rewards() {
  const [data,setData]=useState(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{try{setData(await api.get('/api/analytics/rewards'));}catch{}finally{setLoading(false);}})();},[]);
  const tier=data?.tier||'SILVER'; const meta=TIER_META[tier];
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Rewards & Tiers</h1><p className="text-sm text-muted-foreground">Your loyalty status, cashback earned, and perks.</p></div>
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="relative overflow-hidden rounded-2xl border border-border p-6">
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90',meta.color)} />
        <div className="relative z-10 flex items-center gap-4 text-white">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 backdrop-blur"><Crown className="h-8 w-8" /></div>
          <div className="flex-1"><div className="text-xs uppercase tracking-widest opacity-80">Current tier</div><div className="text-3xl font-bold">{meta.label}</div><div className="text-sm opacity-90">{meta.perks}</div></div>
          <Badge className="border-0 bg-white/20 text-white">{tier}</Badge>
        </div>
      </motion.div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard loading={loading} icon={<Gift className="h-4 w-4" />} label="Total cashback earned" value={data?inr(data.cashbackTotal):null} />
        <StatCard loading={loading} icon={<TrendingUp className="h-4 w-4" />} label="90-day spend volume" value={data?inr(data.volume):null} />
        <StatCard loading={loading} icon={<Sparkles className="h-4 w-4" />} label="Perks unlocked" value={data?(tier==='OBSIDIAN'?'All':tier==='GOLD'?'6':'3'):null} />
      </div>
      <Card>
        <CardHeader><CardTitle>Recent cashback</CardTitle><CardDescription>Auto-granted 1–5% on Shopping transactions.</CardDescription></CardHeader>
        <CardContent className="space-y-1">
          {loading?Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-12 w-full rounded-lg" />)
            : (data?.recent||[]).length ? data.recent.map(c=>(
              <div key={c._id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/50">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-success/15 text-success"><Gift className="h-4 w-4" /></span>
                <div className="flex-1"><div className="text-sm font-medium">{c.merchant||'Shopping'}</div><div className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</div></div>
                <Badge variant="success">+{c.rate}%</Badge>
                <div className="w-20 text-right font-semibold text-success">+{inr(c.amount)}</div>
              </div>)) : <div className="py-6 text-center text-sm text-muted-foreground">No cashback yet — shop with your card to earn 1–5% back.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
function StatCard({loading,icon,label,value}){ return <div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span><span className="text-xs text-muted-foreground">{label}</span></div><div className="mt-3 text-xl font-bold">{loading||value===null?<Skeleton className="h-6 w-24"/>:value}</div></div>; }
