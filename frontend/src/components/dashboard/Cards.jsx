'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Snowflake,
  Eye,
  EyeOff,
  Settings2,
  Loader2,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { api, withToast } from '@/lib/api';
import { VirtualCard } from '@/components/VirtualCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { inr } from '@/lib/utils';

export function Cards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealId, setCvv] = useState({ id: null, cvv: null });
  const [limitDialog, setLimitDialog] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/cards');
      setCards(data.cards);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const revealCvv = async (card) => {
    if (card.status === 'FROZEN') return toast.error('Cannot reveal CVV on a frozen card');
    try {
      const data = await api.get(`/api/cards/${card._id}/cvv`);
      setCvv({ id: card._id, cvv: data.cvv });
      // auto-hide after 6s
      setTimeout(() => setCvv({ id: null, cvv: null }), 6000);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const toggleFreeze = async (card) => {
    const next = card.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
    try {
      const data = await api.patch(`/api/cards/${card._id}`, { status: next });
      setCards((arr) => arr.map((c) => (c._id === card._id ? data.card : c)));
      toast.success(next === 'FROZEN' ? 'Card frozen' : 'Card unfrozen');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const updateLimits = async (limits) => {
    try {
      const data = await api.patch(`/api/cards/${limitDialog.card._id}`, limits);
      setCards((arr) => arr.map((c) => (c._id === limitDialog.card._id ? data.card : c)));
      setLimitDialog(null);
      toast.success('Limits updated');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Virtual Cards</h1>
        <p className="text-sm text-muted-foreground">Freeze, reveal CVV, and manage limits — instantly.</p>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="aspect-[1.586] w-full max-w-md rounded-2xl" />
          <Skeleton className="aspect-[1.586] w-full max-w-md rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((c, i) => {
            const frozen = c.status === 'FROZEN';
            const revealing = revealId.id === c._id;
            const cardWithCvv = { ...c, __cvv: revealId.cvv };
            return (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="space-y-4"
              >
                <div className="mx-auto max-w-md">
                  <VirtualCard card={cardWithCvv} reveal={revealing} frozen={frozen} />
                </div>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{c.network} · {c.type}</CardTitle>
                      <Badge variant={frozen ? 'warning' : 'success'}>
                        {frozen ? 'Frozen' : 'Active'}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">•••• {c.cardNumber.slice(-4)}</span>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-secondary/50 p-3">
                        <div className="text-xs text-muted-foreground">Daily limit</div>
                        <div className="font-semibold">{inr(c.dailyLimit)}</div>
                      </div>
                      <div className="rounded-lg bg-secondary/50 p-3">
                        <div className="text-xs text-muted-foreground">Monthly limit</div>
                        <div className="font-semibold">{inr(c.monthlyLimit)}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={frozen ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleFreeze(c)}
                        className="gap-1.5"
                      >
                        <Snowflake className="h-3.5 w-3.5" />
                        {frozen ? 'Unfreeze' : 'Freeze'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (revealing ? setCvv({ id: null, cvv: null }) : revealCvv(c))}
                        className="gap-1.5"
                      >
                        {revealing ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {revealing ? 'Hide CVV' : 'Reveal CVV'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLimitDialog({ card: c })}
                        className="gap-1.5"
                      >
                        <Settings2 className="h-3.5 w-3.5" /> Limits
                      </Button>
                    </div>

                    {/* Spend progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Spent this month</span>
                        <span>{inr(c.spentThisMonth)} / {inr(c.monthlyLimit)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, (c.spentThisMonth / c.monthlyLimit) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {limitDialog && (
        <LimitDialog card={limitDialog.card} onClose={() => setLimitDialog(null)} onSave={updateLimits} />
      )}
    </div>
  );
}

function LimitDialog({ card, onClose, onSave }) {
  const [daily, setDaily] = useState(card.dailyLimit);
  const [monthly, setMonthly] = useState(card.monthlyLimit);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await onSave({ dailyLimit: daily[0], monthlyLimit: monthly[0] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Settings2 className="h-4 w-4" /> Set transaction limits
        </DialogTitle>
        <DialogDescription>Adjust how much can be spent on this card per day / month.</DialogDescription>
      </DialogHeader>
      <div className="space-y-6 py-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Daily limit</Label>
            <span className="text-sm font-semibold">{inr(daily[0] || daily)}</span>
          </div>
          <Slider value={[typeof daily === 'number' ? daily : daily[0]]} onValueChange={setDaily} min={1000} max={200000} step={1000} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Monthly limit</Label>
            <span className="text-sm font-semibold">{inr(monthly[0] || monthly)}</span>
          </div>
          <Slider value={[typeof monthly === 'number' ? monthly : monthly[0]]} onValueChange={setMonthly} min={5000} max={1000000} step={5000} />
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Changes apply instantly to all future transactions.
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={submit} disabled={saving} className="flex-1">
          {saving && <Loader2 className="animate-spin" />} Save limits
        </Button>
      </div>
    </Dialog>
  );
}
