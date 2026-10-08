'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users as UsersIcon, Wallet, TrendingUp, Activity, ShieldCheck, Server, Database, Wifi, Crown, Search, CheckCircle2, Snowflake, Eye, Ban, LogOut, RefreshCw, Bell } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { SanchivaLogo } from '@/components/SanchivaLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import { inr, timeAgo, cn } from '@/lib/utils';

export function AdminDashboard({ onSwitchToDashboard }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [platform, setPlatform] = useState({ series: [], totals: {} });
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [actioning, setActioning] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [s, u, sess, p, h] = await Promise.allSettled([
      api.get('/api/admin/stats'), api.get('/api/admin/users'), api.get('/api/admin/sessions?limit=12'),
      api.get('/api/admin/platform-stats?range=30'), api.get('/api/admin/health'),
    ]);
    if (s.status === 'fulfilled') setStats(s.value);
    if (u.status === 'fulfilled') setUsers(u.value?.users || []);
    if (sess.status === 'fulfilled') setSessions(sess.value?.sessions || []);
    if (p.status === 'fulfilled') setPlatform(p.value || { series: [], totals: {} });
    if (h.status === 'fulfilled') setHealth(h.value);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    const t = setInterval(async () => {
      try { setSessions((await api.get('/api/admin/sessions?limit=12')).sessions || []); } catch {}
      try { setHealth(await api.get('/api/admin/health')); } catch {}
    }, 15000);
    return () => clearInterval(t);
  }, [loadAll]);

  const act = async (id, action, label) => {
    setActioning(id + action);
    try {
      if (action === 'approve-kyc') await api.patch(`/api/admin/users/${id}/approve-kyc`, {});
      if (action === 'freeze') await api.patch(`/api/admin/users/${id}/freeze`, {});
      if (action === 'revoke') await api.post(`/api/admin/users/${id}/revoke-sessions`, {});
      toast.success(label); await loadAll();
    } catch (e) { toast.error(e.message); }
    finally { setActioning(null); }
  };

  const filtered = (users || []).filter((u) => (u.name || '').toLowerCase().includes(q.toLowerCase()) || (u.email || '').toLowerCase().includes(q.toLowerCase()));
  const platformFee = stats ? Math.round(stats.totalVolume * 0.0018) : 0;

  return (
    <div className="min-h-screen bg-background bg-mesh">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border glass-strong px-4 sm:px-6">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-lg shadow-primary/30"><Crown className="h-4 w-4" /></div>
        <div><div className="text-sm font-semibold leading-tight">Sanchiva Command Center</div><div className="text-xs text-muted-foreground">Super Admin · {user?.email}</div></div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={onSwitchToDashboard} className="gap-1.5"><Eye className="h-3.5 w-3.5" /> My Dashboard</Button>
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div><h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">CEO Command Center <Crown className="h-6 w-6 text-accent" /></h1><p className="text-sm text-muted-foreground">Real-time platform overview, user directory & system health.</p></div>
          <Button variant="outline" size="sm" onClick={loadAll} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric loading={loading} icon={<UsersIcon className="h-4 w-4" />} label="Registered Users" value={stats ? String(stats.totalUsers) : null} tone="primary" />
          <Metric loading={loading} icon={<Wallet className="h-4 w-4" />} label="Platform Liquidity" value={stats ? inr(stats.totalLiquidity) : null} tone="success" />
          <Metric loading={loading} icon={<TrendingUp className="h-4 w-4" />} label="Transaction Volume" value={stats ? inr(stats.totalVolume) : null} tone="gold" />
          <Metric loading={loading} icon={<Activity className="h-4 w-4" />} label="Platform Fees (est.)" value={stats ? inr(platformFee) : null} tone="violet" sub="0.18% mock rate" />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Platform Reach · last 30 days</CardTitle><CardDescription>{platform.totals?.activeUsers ? `${platform.totals.activeUsers.toLocaleString()} active-user sessions` : '—'} · {platform.totals?.newSignups ? `${platform.totals.newSignups} new signups` : '—'}</CardDescription></div>
              <Badge variant="success" className="gap-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> LIVE</Badge>
            </CardHeader>
            <CardContent>
              {loading || !platform.series?.length ? <Skeleton className="h-[280px] w-full" /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={platform.series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <defs><linearGradient id="gDau" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.35} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient><linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f5b942" stopOpacity={0.3} /><stop offset="95%" stopColor="#f5b942" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
                    <YAxis tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} tickLine={false} axisLine={false} width={42} />
                    <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="activeUsers" name="Daily Active Users" stroke="#10b981" strokeWidth={2} fill="url(#gDau)" />
                    <Area type="monotone" dataKey="pageViews" name="Page Views" stroke="#f5b942" strokeWidth={2} fill="url(#gViews)" />
                    <Area type="monotone" dataKey="newSignups" name="New Signups" stroke="#a855f7" strokeWidth={2} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Server className="h-4 w-4" /> System Health</CardTitle><CardDescription>Real-time infrastructure status.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <HealthRow loading={loading} icon={<Activity className="h-4 w-4" />} label="API Status" value={health ? 'Operational' : null} sub={health ? `${health.uptimePct}% uptime` : ''} ok />
              <HealthRow loading={loading} icon={<Database className="h-4 w-4" />} label="Database Latency" value={health ? `${health.dbLatencyMs} ms` : null} sub="< 40ms target" ok={health?.dbLatencyMs < 60} />
              <HealthRow loading={loading} icon={<Wifi className="h-4 w-4" />} label="Websocket Connections" value={health ? String(health.activeSockets) : null} sub="socket.io live" ok />
              <HealthRow loading={loading} icon={<ShieldCheck className="h-4 w-4" />} label="Active Sessions" value={stats ? `${stats.totalUsers - (stats.frozenAccounts || 0)} active` : null} sub={`${stats?.frozenAccounts || 0} frozen`} ok />
              <div className="mt-2 rounded-lg border border-border p-3">
                <div className="mb-2 text-xs font-medium text-muted-foreground">Loyalty Tier Distribution</div>
                <div className="flex flex-wrap gap-2">{stats?.tiers && Object.entries(stats.tiers).map(([t, n]) => (<Badge key={t} variant={t === 'OBSIDIAN' ? 'warning' : t === 'GOLD' ? 'default' : 'muted'}>{t} · {n}</Badge>))}</div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Recent Logins <span className="ml-1 h-1.5 w-1.5 animate-pulse rounded-full bg-success" /></CardTitle><CardDescription>Live session feed (auto-refreshes).</CardDescription></CardHeader>
            <CardContent className="max-h-[320px] space-y-1 overflow-y-auto">
              {(sessions || []).length === 0 ? <div className="py-6 text-center text-sm text-muted-foreground">No logins yet.</div> : sessions.map((s, i) => (
                <motion.div key={s._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/50">
                  <Avatar name={s.userName} color="emerald" size="sm" />
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{s.userName}</div><div className="truncate text-xs text-muted-foreground">{s.location} · {s.device}/{s.browser}</div></div>
                  <div className="text-right text-[10px] text-muted-foreground">{timeAgo(s.createdAt)}</div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>New Signups · last 30 days</CardTitle><CardDescription>Daily registration volume.</CardDescription></CardHeader>
            <CardContent>{loading || !platform.series?.length ? <Skeleton className="h-[240px] w-full" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={platform.series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(8)} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
                  <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="newSignups" name="New Signups" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}</CardContent>
          </Card>
        </div>
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="flex items-center gap-2"><UsersIcon className="h-4 w-4" /> User Directory</CardTitle><CardDescription>{filtered.length} registered members.</CardDescription></div>
            <div className="relative w-full max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="pl-9" /></div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="pb-2 pr-3 font-medium">Member</th><th className="pb-2 pr-3 font-medium">Role</th><th className="pb-2 pr-3 font-medium">Balance</th><th className="pb-2 pr-3 font-medium">KYC</th><th className="pb-2 pr-3 font-medium">Status</th><th className="pb-2 pr-3 font-medium text-right">Actions</th></tr></thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u._id} className="border-b border-border/60 align-middle hover:bg-secondary/30">
                      <td className="py-2.5 pr-3"><div className="flex items-center gap-2.5"><Avatar name={u.name} color={u.avatarColor} size="sm" /><div className="min-w-0"><div className="truncate font-medium">{u.name}</div><div className="truncate text-xs text-muted-foreground">{u.email}</div></div></div></td>
                      <td className="pr-3">{u.role === 'SUPER_ADMIN' ? <Badge variant="warning" className="gap-1"><Crown className="h-3 w-3" /> Super Admin</Badge> : <Badge variant="muted">User</Badge>}</td>
                      <td className="pr-3 font-medium">{inr(u.balance || 0)}</td>
                      <td className="pr-3"><Badge variant={u.kycStatus === 'VERIFIED' ? 'success' : 'warning'}>{u.kycStatus}</Badge></td>
                      <td className="pr-3">{u.frozen ? <Badge variant="destructive">Frozen</Badge> : <Badge variant="success">Active</Badge>}</td>
                      <td className="pr-3"><div className="flex flex-wrap justify-end gap-1">
                        {u.kycStatus !== 'VERIFIED' && <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" disabled={actioning === u._id + 'approve-kyc'} onClick={() => act(u._id, 'approve-kyc', 'KYC approved')}><CheckCircle2 className="h-3 w-3" /> Approve</Button>}
                        {u.role !== 'SUPER_ADMIN' && <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" disabled={actioning === u._id + 'freeze'} onClick={() => act(u._id, 'freeze', u.frozen ? 'Account unfrozen' : 'Account frozen')}><Snowflake className="h-3 w-3" /> {u.frozen ? 'Unfreeze' : 'Freeze'}</Button>}
                        <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => toast.info(`View-as for ${u.name} (read-only support mode)`)}><Eye className="h-3 w-3" /> View</Button>
                        {u.role !== 'SUPER_ADMIN' && <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs text-destructive" disabled={actioning === u._id + 'revoke'} onClick={() => act(u._id, 'revoke', 'All sessions revoked')}><Ban className="h-3 w-3" /> Revoke</Button>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <footer className="mt-8 py-6 text-center text-xs text-muted-foreground">Sanchiva Command Center · Secured by RBAC · {new Date().getFullYear()}</footer>
      </main>
    </div>
  );
}
function Metric({ loading, icon, label, value, tone, sub }) {
  const tones = { primary: 'text-primary bg-primary/10', success: 'text-success bg-success/10', gold: 'text-accent bg-accent/10', violet: 'text-violet-500 bg-violet-500/10' };
  return (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-2"><span className={cn('grid h-8 w-8 place-items-center rounded-lg', tones[tone])}>{icon}</span><span className="text-xs text-muted-foreground">{label}</span></div><div className="mt-3 text-2xl font-bold tracking-tight">{loading || value === null ? <Skeleton className="h-7 w-28" /> : value}</div>{sub && <div className="mt-1 text-[10px] text-muted-foreground">{sub}</div>}</motion.div>);
}
function HealthRow({ loading, icon, label, value, sub, ok }) {
  return (<div className="flex items-center gap-3 rounded-lg border border-border p-3"><span className={cn('grid h-8 w-8 place-items-center rounded-lg', ok ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>{icon}</span><div className="flex-1"><div className="text-sm font-medium">{label}</div><div className="text-xs text-muted-foreground">{sub}</div></div><div className="text-right text-sm font-semibold">{loading || !value ? <Skeleton className="h-5 w-16" /> : value}</div><span className={cn('h-2 w-2 rounded-full', ok ? 'bg-success' : 'bg-warning')} /></div>);
}
