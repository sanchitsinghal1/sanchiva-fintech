'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Heart, Car, Plane, Home } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { inr, formatDate, cn } from '@/lib/utils';
const ICON = { LIFE: Shield, HEALTH: Heart, MOTOR: Car, TRAVEL: Plane, HOME: Home, TERM: Shield };
export function Insurance() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setPolicies((await api.get('/api/insurance')).policies || []); } catch {} finally { setLoading(false); } })(); }, []);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Insurance</h1><p className="text-sm text-muted-foreground">All your policies in one place — life, health, motor, travel.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-40 w-full rounded-2xl" />)
          : policies.length === 0 ? <div className="col-span-full py-12 text-center text-sm text-muted-foreground">No policies. Add one to get started.</div>
          : policies.map((p,i) => { const Icon = ICON[p.type] || Shield; return (
            <motion.div key={p._id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}>
              <Card className="overflow-hidden"><div className={cn('flex items-center gap-3 p-4', p.type==='HEALTH'?'card-rose':p.type==='TERM'?'card-obsidian':p.type==='MOTOR'?'card-amber':'card-emerald')}><Icon className="h-6 w-6 text-white" /><div className="text-white"><div className="font-semibold">{p.type}</div><div className="text-xs opacity-80">{p.provider}</div></div></div>
                <CardContent className="pt-4"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Sum insured</span><span className="font-semibold">{inr(p.sumInsured)}</span></div><div className="mt-1 flex justify-between text-sm"><span className="text-muted-foreground">Premium</span><span className="font-semibold">{inr(p.premium)}/yr</span></div><div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>Policy</span><span className="font-mono">{p.policyNumber}</span></div><div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>Valid till</span><span>{formatDate(p.endDate)}</span></div><Badge variant="success" className="mt-3">{p.status}</Badge></CardContent></Card>
            </motion.div>);})}
      </div>
    </div>
  );
}
