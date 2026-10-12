'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Plus,
  Users,
  FileText,
  QrCode,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { BalanceCard } from '@/components/BalanceCard';
import { SpendingByCategory, CashFlowChart } from '@/components/SpendingChart';
import { TransactionList } from '@/components/TransactionList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { inr } from '@/lib/utils';

const QUICK = [
  { id: 'send', label: 'Send', icon: Send, variant: 'default' },
  { id: 'add-funds', label: 'Add Funds', icon: Plus, variant: 'gold' },
  { id: 'requests', label: 'Request', icon: Users, variant: 'outline' },
  { id: 'statements', label: 'Statement', icon: FileText, variant: 'outline' },
];

export function Overview({ onNavigate, onOpenQR }) {
  const { user, account, refreshAccount } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [range, setRange] = useState('30');
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async (r) => {
    setLoading(true);
    try {
      const data = await api.get(`/api/analytics?range=${r}`);
      setAnalytics(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAccount();
    loadAnalytics(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const stats = analytics?.totals || { totalIn: 0, totalOut: 0, net: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground">Here's your money at a glance.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          {account ? <BalanceCard account={account} user={user} /> : <Skeleton className="h-52 w-full rounded-2xl" />}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {QUICK.map((q) => (
              <Button
                key={q.id}
                variant={q.variant}
                className="flex flex-col gap-1.5 py-4"
                onClick={() => onNavigate(q.id)}
              >
                <q.icon className="h-5 w-5" />
                <span className="text-xs">{q.label}</span>
              </Button>
            ))}
            <Button variant="outline" className="flex flex-col gap-1.5 py-4" onClick={() => onOpenQR?.()}>
              <QrCode className="h-5 w-5" />
              <span className="text-xs">Receive</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <StatCard
            label="Money in"
            value={loading ? null : inr(stats.totalIn)}
            icon={<TrendingUp className="h-4 w-4" />}
            tone="success"
          />
          <StatCard
            label="Money out"
            value={loading ? null : inr(stats.totalOut)}
            icon={<TrendingDown className="h-4 w-4" />}
            tone="destructive"
          />
          <StatCard
            label="Net flow"
            value={loading ? null : inr(stats.net)}
            icon={<Wallet className="h-4 w-4" />}
            tone="primary"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Spending analytics</CardTitle>
            <p className="text-xs text-muted-foreground">Categorised by where your money went.</p>
          </div>
          <Tabs value={range} onValueChange={setRange}>
            <TabsList>
              <TabsTrigger value="7">7d</TabsTrigger>
              <TabsTrigger value="30">30d</TabsTrigger>
              <TabsTrigger value="90">90d</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-sm font-medium">Cash flow</div>
            {loading ? <Skeleton className="h-[260px] w-full" /> : <CashFlowChart data={analytics?.timeseries || []} />}
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">By category</div>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <SpendingByCategory data={analytics?.byCategory || []} />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent transactions</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('transactions')} className="gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="max-h-[420px] overflow-y-auto">
            <TransactionList pageSize={5} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon, tone }) {
  const tones = {
    success: 'text-success bg-success/10',
    destructive: 'text-destructive bg-destructive/10',
    primary: 'text-primary bg-primary/10',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-2">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${tones[tone]}`}>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">
        {value === null ? <Skeleton className="h-7 w-28" /> : value}
      </div>
    </motion.div>
  );
}
