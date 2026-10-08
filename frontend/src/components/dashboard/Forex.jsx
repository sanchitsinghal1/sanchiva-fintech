'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Globe, ArrowLeftRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { inr } from '@/lib/utils';

export function Forex() {
  const [rates, setRates] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ from: 'INR', to: 'USD', amount: '1000' });
  const [exchanging, setExchanging] = useState(false);
  const load = async () => { setLoading(true); try { const [r, b] = await Promise.all([api.get('/api/forex/rates'), api.get('/api/forex/balances')]); setRates(r.rates||[]); setBalances(b.balances||[]); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const exchange = async (e) => { e.preventDefault(); setExchanging(true); try { const d = await api.post('/api/forex/exchange', { from: form.from, to: form.to, amount: Number(form.amount) }); toast.success(`Converted ${form.amount} ${form.from} → ${d.converted} ${form.to}`); await load(); } catch (err) { toast.error(err.message); } finally { setExchanging(false); } };
  const CURS = [{value:'INR',label:'INR'},{value:'USD',label:'USD'},{value:'EUR',label:'EUR'},{value:'GBP',label:'GBP'},{value:'AED',label:'AED'},{value:'SGD',label:'SGD'}];
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Multi-Currency & Forex</h1><p className="text-sm text-muted-foreground">Hold INR/USD/EUR + mock live FX rates + instant exchange.</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4" /> Your currency wallets</CardTitle><CardDescription>Multi-currency balances.</CardDescription></CardHeader><CardContent className="space-y-2">{loading ? <Skeleton className="h-32 w-full" /> : balances.map((c,i) => <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3"><span className="text-sm font-medium">{c.currency}</span><span className="font-semibold">{c.currency==='INR'?inr(c.balance):c.balance.toLocaleString()} {c.currency}</span></div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><ArrowLeftRight className="h-4 w-4" /> Exchange</CardTitle><CardDescription>Mock real-time FX conversion.</CardDescription></CardHeader><CardContent><form onSubmit={exchange} className="space-y-3"><div className="grid grid-cols-3 gap-3"><div className="space-y-1.5"><Label>From</Label><Select value={form.from} onValueChange={v=>setForm(f=>({...f,from:v}))} options={CURS} /></div><div className="space-y-1.5"><Label>To</Label><Select value={form.to} onValueChange={v=>setForm(f=>({...f,to:v}))} options={CURS} /></div><div className="space-y-1.5"><Label>Amount</Label><Input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required /></div></div><Button type="submit" disabled={exchanging} className="w-full gap-1">{exchanging&&<Loader2 className="h-4 w-4 animate-spin"/>}Exchange</Button></form><div className="mt-3 text-xs text-muted-foreground">Live rates (mock): {rates.map(r=>`1 ${r.base} = ${r.rate} ${r.quote} (${r.changePct>=0?'+':''}${r.changePct}%)`).slice(0,2).join(' · ')}</div></CardContent></Card>
      </div>
    </div>
  );
}
