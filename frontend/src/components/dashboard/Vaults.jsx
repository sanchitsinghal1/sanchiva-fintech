'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Loader2, Trash2, ArrowDownToLine, ArrowUpFromLine, Target } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/separator';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { inr, cn } from '@/lib/utils';

const ICONS = ['🎯','🏖️','💻','🚗','🏠','✈️','🎓','💍','📱','🎁'];
const COLORS = ['emerald','violet','amber','rose','cyan','obsidian'];

export function Vaults() {
  const { refreshAccount } = useAuth();
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [txVault, setTxVault] = useState(null);
  const load = async () => { setLoading(true); try { setVaults((await api.get('/api/vaults')).vaults || []); } catch (e) { toast.error(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between"><div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Vaults & Pots</h1><p className="text-sm text-muted-foreground">Ring-fence savings goals from your spendable balance.</p></div><Button onClick={() => setShowCreate(true)} className="gap-1.5"><Plus className="h-4 w-4" /> New vault</Button></div>
      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-44 w-full rounded-2xl" />)}</div>
        : (vaults||[]).length===0 ? <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center"><Target className="h-8 w-8 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">No vaults yet. Create your first savings goal.</p></div>
        : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(vaults||[]).map((v,i)=>{ const pct=v.target>0?Math.min(100,(v.current/v.target)*100):0; return (
          <motion.div key={v._id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}>
            <Card className="overflow-hidden">
              <div className={cn('flex items-center gap-3 p-4', `card-${v.color}`)}><span className="text-2xl">{v.icon||'🎯'}</span><div className="text-white"><div className="font-semibold">{v.name}</div><div className="text-xs opacity-80">{pct.toFixed(0)}% of goal</div></div></div>
              <CardContent className="pt-4">
                <div className="flex items-end justify-between"><div><div className="text-xs text-muted-foreground">Saved</div><div className="text-xl font-bold">{inr(v.current||0)}</div></div><div className="text-right"><div className="text-xs text-muted-foreground">Target</div><div className="text-sm font-medium">{inr(v.target||0)}</div></div></div>
                <Progress value={pct} className="mt-3" />
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={()=>setTxVault({vault:v,mode:'deposit'})}><ArrowDownToLine className="h-3.5 w-3.5" /> Add</Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={()=>setTxVault({vault:v,mode:'withdraw'})}><ArrowUpFromLine className="h-3.5 w-3.5" /> Withdraw</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={async()=>{try{await api.delete(`/api/vaults/${v._id}`);toast.success('Vault closed');load();refreshAccount();}catch(e){toast.error(e.message);}}}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>);})}</div>}
      {showCreate && <CreateVaultDialog onClose={()=>setShowCreate(false)} onCreated={()=>{load();setShowCreate(false);}} />}
      {txVault && <TxDialog vault={txVault.vault} mode={txVault.mode} onClose={()=>setTxVault(null)} onDone={()=>{load();refreshAccount();setTxVault(null);}} />}
    </div>
  );
}
function CreateVaultDialog({onClose,onCreated}){ const [form,setForm]=useState({name:'',target:'',icon:'🎯',color:'emerald'}); const [saving,setSaving]=useState(false);
  const submit=async(e)=>{e.preventDefault();setSaving(true);try{await api.post('/api/vaults',{name:form.name,target:Number(form.target),icon:form.icon,color:form.color});toast.success('Vault created');onCreated();}catch(err){toast.error(err.message);}finally{setSaving(false);}};
  return (<Dialog open onClose={onClose}><DialogHeader><DialogTitle>Create a vault</DialogTitle><DialogDescription>Set a savings goal and watch it fill up.</DialogDescription></DialogHeader>
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5"><Label>Goal name</Label><Input value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} placeholder="Goa Trip" required /></div>
      <div className="space-y-1.5"><Label>Target amount (₹)</Label><Input type="number" min="1" value={form.target} onChange={(e)=>setForm(f=>({...f,target:e.target.value}))} required /></div>
      <div className="space-y-1.5"><Label>Icon</Label><div className="flex flex-wrap gap-2">{ICONS.map(ic=><button key={ic} type="button" onClick={()=>setForm(f=>({...f,icon:ic}))} className={cn('grid h-9 w-9 place-items-center rounded-lg border text-lg',form.icon===ic?'border-primary bg-primary/10':'border-border')}>{ic}</button>)}</div></div>
      <div className="space-y-1.5"><Label>Color</Label><div className="flex flex-wrap gap-2">{COLORS.map(c=><button key={c} type="button" onClick={()=>setForm(f=>({...f,color:c}))} className={cn(`card-${c} h-8 w-8 rounded-full`,form.color===c&&'ring-2 ring-primary ring-offset-2 ring-offset-background')} />)}</div></div>
      <Button type="submit" disabled={saving} className="w-full gap-1">{saving&&<Loader2 className="animate-spin" />} Create vault</Button>
    </form></Dialog>);
}
function TxDialog({vault,mode,onClose,onDone}){ const [amount,setAmount]=useState(''); const [saving,setSaving]=useState(false); const isDeposit=mode==='deposit';
  const submit=async(e)=>{e.preventDefault();setSaving(true);try{await api.post(`/api/vaults/${vault._id}/${mode}`,{amount:Number(amount)});toast.success(isDeposit?`Added to ${vault.name}`:`Withdrawn from ${vault.name}`);onDone();}catch(err){toast.error(err.message);}finally{setSaving(false);}};
  return (<Dialog open onClose={onClose}><DialogHeader><DialogTitle>{isDeposit?'Add to':'Withdraw from'} {vault.name}</DialogTitle><DialogDescription>{isDeposit?'Moves money from your spendable balance into this vault.':'Moves money from this vault back to your balance.'}</DialogDescription></DialogHeader>
    <form onSubmit={submit} className="space-y-4"><div className="space-y-1.5"><Label>Amount (₹)</Label><Input type="number" min="1" value={amount} onChange={(e)=>setAmount(e.target.value)} autoFocus required /></div>
      <Button type="submit" disabled={saving} className="w-full gap-1" variant={isDeposit?'default':'outline'}>{saving&&<Loader2 className="animate-spin" />} {isDeposit?'Add to vault':'Withdraw'}</Button></form></Dialog>);
}
