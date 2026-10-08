'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Smartphone, Globe, Shield, LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { timeAgo, cn } from '@/lib/utils';
const deviceIcon = (d) => /iphone|android/i.test(d||'') ? Smartphone : Monitor;
export function Sessions() {
  const { logout } = useAuth();
  const [sessions,setSessions]=useState([]); const [loading,setLoading]=useState(true);
  const load=async()=>{setLoading(true);try{setSessions((await api.get('/api/auth/sessions')).sessions||[]);}catch{}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);
  const revokeAll=async()=>{try{await api.post('/api/auth/logout',{});toast.success('Signed out of all other devices');await load();}catch(e){toast.error(e.message);}};
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between"><div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Active Sessions</h1><p className="text-sm text-muted-foreground">Devices currently (and recently) signed in to your account.</p></div><Button variant="outline" onClick={revokeAll} className="gap-1.5"><LogOut className="h-4 w-4" /> Sign out everywhere</Button></div>
      <Card className="border-success/30 bg-success/5"><CardContent className="flex items-center gap-3 py-4"><span className="grid h-9 w-9 place-items-center rounded-lg bg-success/15 text-success"><Shield className="h-4 w-4" /></span><div className="text-sm"><span className="font-medium">Your account is protected.</span> <span className="text-muted-foreground">If you see a device you don't recognise, sign out everywhere immediately.</span></div></CardContent></Card>
      <Card>
        <CardHeader><CardTitle>Login history</CardTitle><CardDescription>{(sessions||[]).length} recent session{(sessions||[]).length===1?'':'s'}.</CardDescription></CardHeader>
        <CardContent className="space-y-1">
          {loading?Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-14 w-full rounded-lg" />)
            : (sessions||[]).length===0 ? <div className="py-6 text-center text-sm text-muted-foreground">No recent logins recorded.</div>
            : (sessions||[]).map((s,i)=>{ const Icon=deviceIcon(s.device); const current=i===0; return (
              <motion.div key={s._id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:Math.min(i*0.04,0.3)}} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-secondary/50">
                <span className={cn('grid h-10 w-10 place-items-center rounded-full',current?'bg-success/15 text-success':'bg-secondary text-foreground')}><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-sm font-medium">{s.device} · {s.browser}</span>{current&&<Badge variant="success">This device</Badge>}</div><div className="text-xs text-muted-foreground">{s.location} · IP {s.ipAddress} · {timeAgo(s.createdAt)}</div></div>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </motion.div>);})}
        </CardContent>
      </Card>
    </div>
  );
}
