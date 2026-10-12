'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Calculator, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { inr, cn } from '@/lib/utils';

export function Loans() {
  const [data, setData] = useState({ loans: [], score: null });
  const [loading, setLoading] = useState(true);
  const [calc, setCalc] = useState({ principal: '500000', rate: '11.5', tenureMonths: '36' });
  const [result, setResult] = useState(null);
  const [computing, setComputing] = useState(false);
  const load = async () => { setLoading(true); try { const [l, s] = await Promise.all([api.get('/api/loans'), api.get('/api/loans/credit-score')]); setData({ loans: l.loans || [], score: s }); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const compute = async (e) => { e.preventDefault(); setComputing(true); try { const r = await api.post('/api/loans/calc', { principal: Number(calc.principal), rate: Number(calc.rate), tenureMonths: Number(calc.tenureMonths) }); setResult(r); } catch (e) { toast.error(e.message); } finally { setComputing(false); } };
  const scoreColor = data.score?.score >= 800 ? 'text-success' : data.score?.score >= 720 ? 'text-primary' : 'text-warning';
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Loans & Credit</h1><p className="text-sm text-muted-foreground">EMI calculator, active loans, and your credit score.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Credit Score</div>{loading ? <Skeleton className="h-8 w-24" /> : <div className={cn('text-3xl font-bold', scoreColor)}>{data.score?.score}</div>}{!loading && <Badge variant="muted" className="mt-1">{data.score?.rating}</Badge>}</CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Active Loans</div>{loading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{data.loans.length}</div>}</CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Total Outstanding</div>{loading ? <Skeleton className="h-8 w-28" /> : <div className="text-3xl font-bold">{inr(data.loans.reduce((s,l)=>s+l.outstanding,0))}</div>}</CardContent></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-4 w-4" /> EMI Calculator</CardTitle><CardDescription>Estimate your monthly EMI instantly.</CardDescription></CardHeader><CardContent><form onSubmit={compute} className="space-y-3"><div className="grid grid-cols-3 gap-3"><Field label="Principal (₹)"><Input type="number" value={calc.principal} onChange={e=>setCalc(c=>({...c,principal:e.target.value}))} required /></Field><Field label="Rate (%)"><Input type="number" step="0.1" value={calc.rate} onChange={e=>setCalc(c=>({...c,rate:e.target.value}))} required /></Field><Field label="Tenure (mo)"><Input type="number" value={calc.tenureMonths} onChange={e=>setCalc(c=>({...c,tenureMonths:e.target.value}))} required /></Field></div><Button type="submit" disabled={computing} className="w-full gap-1">{computing&&<Loader2 className="h-4 w-4 animate-spin"/>}Calculate EMI</Button>{result && <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-secondary/50 p-3 text-center"><div><div className="text-xs text-muted-foreground">Monthly EMI</div><div className="font-bold">{inr(result.emi)}</div></div><div><div className="text-xs text-muted-foreground">Interest</div><div className="font-bold">{inr(result.interest)}</div></div><div><div className="text-xs text-muted-foreground">Total</div><div className="font-bold">{inr(result.total)}</div></div></div>}</form></CardContent></Card>
        <Card><CardHeader><CardTitle>Active Loans</CardTitle><CardDescription>{data.loans.length} loan{data.loans.length===1?'':'s'}</CardDescription></CardHeader><CardContent className="space-y-2">{loading ? Array.from({length:2}).map((_,i)=><Skeleton key={i} className="h-20 w-full rounded-lg" />) : data.loans.map((l,i) => <motion.div key={l._id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}} className="rounded-lg border border-border p-3"><div className="flex items-center justify-between"><div className="text-sm font-medium">{l.type} Loan</div><Badge variant="success">{l.status}</Badge></div><div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>Principal {inr(l.principal)}</span><span>EMI {inr(l.emi)}/mo</span><span>Outstanding {inr(l.outstanding)}</span></div></motion.div>)}</CardContent></Card>
      </div>
    </div>
  );
}
function Field({label,children}){ return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>; }
