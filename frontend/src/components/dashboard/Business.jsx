'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { FileText, Link as LinkIcon, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { inr, formatDate } from '@/lib/utils';
const STATUS = { PAID: 'success', SENT: 'default', OVERDUE: 'destructive', DRAFT: 'muted', CANCELLED: 'muted' };
export function Business() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [link, setLink] = useState({ amount: '500', note: '' });
  const [genLink, setGenLink] = useState(null);
  const [creating, setCreating] = useState(false);
  const load = async () => { setLoading(true); try { setData(await api.get('/api/business/invoices')); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const genPaymentLink = async (e) => { e.preventDefault(); setCreating(true); try { const d = await api.post('/api/business/pay-link', { amount: Number(link.amount), note: link.note }); setGenLink(d); toast.success('Payment link created'); } catch (err) { toast.error(err.message); } finally { setCreating(false); } };
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Business Banking</h1><p className="text-sm text-muted-foreground">GST invoices, payment links, payouts & reconciliation.</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Total Invoiced</div>{loading ? <Skeleton className="h-8 w-28" /> : <div className="text-2xl font-bold">{inr(data?.total||0)}</div>}</CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Paid</div>{loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold text-success">{inr(data?.paid||0)}</div>}</CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Outstanding</div>{loading ? <Skeleton className="h-8 w-28" /> : <div className="text-2xl font-bold text-warning">{inr(data?.outstanding||0)}</div>}</CardContent></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Invoices</CardTitle><CardDescription>{data?.invoices?.length || 0} invoices</CardDescription></CardHeader><CardContent className="space-y-2">{loading ? Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-16 w-full rounded-lg" />) : (data?.invoices||[]).map((inv,i) => <motion.div key={inv._id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:Math.min(i*0.04,0.3)}} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-secondary/50"><div className="min-w-0 flex-1"><div className="text-sm font-medium">{inv.number} · {inv.client}</div><div className="text-xs text-muted-foreground">Due {formatDate(inv.dueDate)}</div></div><div className="text-right"><div className="text-sm font-semibold">{inr(inv.amount)}</div><Badge variant={STATUS[inv.status]} className="mt-0.5">{inv.status}</Badge></div></motion.div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Payment Link</CardTitle><CardDescription>Generate a collect-now link.</CardDescription></CardHeader><CardContent><form onSubmit={genPaymentLink} className="space-y-3"><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Amount (₹)</Label><Input type="number" value={link.amount} onChange={e=>setLink(l=>({...l,amount:e.target.value}))} required /></div><div className="space-y-1.5"><Label>Note</Label><Input value={link.note} onChange={e=>setLink(l=>({...l,note:e.target.value}))} placeholder="For services" /></div></div><Button type="submit" disabled={creating} className="w-full gap-1">{creating&&<Loader2 className="h-4 w-4 animate-spin"/>}Generate link</Button>{genLink && <div className="mt-3 rounded-lg bg-secondary/50 p-3"><div className="text-xs text-muted-foreground">Payment URL</div><div className="mt-1 break-all font-mono text-sm text-primary">{genLink.url}</div><div className="mt-1 text-sm">Amount: {inr(genLink.amount)}</div></div>}</form></CardContent></Card>
      </div>
    </div>
  );
}
