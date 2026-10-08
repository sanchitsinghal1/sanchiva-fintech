'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Zap, Droplet, Wifi, Smartphone, Car, Flame, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { inr, cn, formatDate } from '@/lib/utils';

const CAT_ICON = { ELECTRICITY: Zap, WATER: Droplet, BROADBAND: Wifi, MOBILE: Smartphone, FASTAG: Car, GAS: Flame };

export function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const load = async () => { setLoading(true); try { setBills((await api.get('/api/bills')).bills || []); } catch (e) { toast.error(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const pay = async (id) => { setPaying(id); try { const d = await api.post(`/api/bills/${id}/pay`, {}); toast.success('Bill paid'); await load(); } catch (e) { toast.error(e.message); } finally { setPaying(null); } };
  const pending = bills.filter(b => b.status === 'PENDING');
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bills & Recharge</h1><p className="text-sm text-muted-foreground">BBPS-style one-tap bill payments with AutoPay.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pending.length === 0 ? null : pending.map(b => <StatBox key={b._id} label={b.category} value={inr(b.amount)} />)}
      </div>
      <Card>
        <CardHeader><CardTitle>Upcoming & recent bills</CardTitle><CardDescription>{pending.length} pending · {bills.length - pending.length} paid</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {loading ? Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-16 w-full rounded-lg" />)
            : bills.length === 0 ? <div className="py-6 text-center text-sm text-muted-foreground">No bills. Add one to get started.</div>
            : bills.map((b,i) => { const Icon = CAT_ICON[b.category] || Zap; return (
              <motion.div key={b._id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:Math.min(i*0.04,0.3)}} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-secondary/50">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><div className="text-sm font-medium">{b.biller}</div><div className="text-xs text-muted-foreground">{b.category} · {b.consumerNumber}{b.dueDate ? ` · due ${formatDate(b.dueDate)}` : ''}</div></div>
                <div className="text-right"><div className="text-sm font-semibold">{inr(b.amount)}</div><Badge variant={b.status==='PAID'?'success':'warning'} className="mt-0.5">{b.status}</Badge></div>
                {b.status==='PENDING' && <Button size="sm" disabled={paying===b._id} onClick={()=>pay(b._id)} className="gap-1">{paying===b._id?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:null}Pay</Button>}
              </motion.div>);})}
        </CardContent>
      </Card>
    </div>
  );
}
function StatBox({label,value}){ return <div className="rounded-xl border border-border bg-card p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="text-lg font-bold">{value}</div></div>; }
