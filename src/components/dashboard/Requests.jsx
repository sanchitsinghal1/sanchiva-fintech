'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, Users, UserPlus, Check, X, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { inr, timeAgo } from '@/lib/utils';

export function Requests() {
  const { user, refreshAccount } = useAuth();
  const [data, setData] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await api.get('/api/requests');
      setData(d);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const act = async (req, action) => {
    try {
      const res = await api.patch(`/api/requests/${req._id}`, { action });
      toast.success(action === 'pay' ? 'Request paid' : `Request ${action}ed`);
      await refreshAccount();
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Requests & Split Bills</h1>
          <p className="text-sm text-muted-foreground">Request money from any Sanchiva user — or split a bill.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} className="gap-1">
          <UserPlus className="h-4 w-4" /> {showForm ? 'Cancel' : 'New request'}
        </Button>
      </div>

      {showForm && <NewRequestForm onCreate={load} onClose={() => setShowForm(false)} />}

      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">Received ({data.received.length})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({data.sent.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-4 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
          ) : data.received.length === 0 ? (
            <Empty label="No requests for you right now" />
          ) : (
            data.received.map((r) => (
              <RequestCard key={r._id} req={r} incoming onAct={act} />
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-4 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
          ) : data.sent.length === 0 ? (
            <Empty label="You haven't requested money from anyone yet" />
          ) : (
            data.sent.map((r) => <RequestCard key={r._id} req={r} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NewRequestForm({ onCreate, onClose }) {
  const [type, setType] = useState('REQUEST');
  const [form, setForm] = useState({ toEmail: '', amount: '', description: '', totalAmount: '', splitMembers: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        toEmail: form.toEmail,
        amount: Number(form.amount),
        description: form.description,
        type,
        totalAmount: type === 'SPLIT' ? Number(form.totalAmount || form.amount) : undefined,
        splitMembers:
          type === 'SPLIT' && form.splitMembers
            ? form.splitMembers
                .split(',')
                .map((s) => s.trim())
                .map((s) => ({ name: s, share: Number(form.amount) }))
            : undefined,
      };
      await api.post('/api/requests', body);
      toast.success('Request sent');
      setForm({ toEmail: '', amount: '', description: '', totalAmount: '', splitMembers: '' });
      onCreate();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New money request</CardTitle>
        <CardDescription>Recipient must be a registered Sanchiva user.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2">
            {['REQUEST', 'SPLIT'].map((t) => (
              <Button
                key={t}
                type="button"
                variant={type === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType(t)}
              >
                {t === 'REQUEST' ? 'Simple request' : 'Split bill'}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Recipient email">
              <Input
                type="email"
                value={form.toEmail}
                onChange={(e) => setForm((f) => ({ ...f, toEmail: e.target.value }))}
                placeholder="rohan@sanchiva.com"
                required
              />
            </Field>
            <Field label="Amount (₹)">
              <Input
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </Field>
          </div>
          {type === 'SPLIT' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Total bill (₹)">
                <Input
                  type="number"
                  min="1"
                  value={form.totalAmount}
                  onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                  placeholder="e.g. 12600"
                />
              </Field>
              <Field label="Split members (comma-separated names)">
                <Input
                  value={form.splitMembers}
                  onChange={(e) => setForm((f) => ({ ...f, splitMembers: e.target.value }))}
                  placeholder="Aria, Meera, Karan"
                />
              </Field>
            </div>
          )}
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What's this for?"
              required
            />
          </Field>
          <Button type="submit" disabled={saving} className="gap-1">
            {saving ? <Loader2 className="animate-spin" /> : <Send className="h-4 w-4" />}
            Send request
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RequestCard({ req, incoming = false, onAct }) {
  const from = req.fromUserId || {};
  const to = req.toUserId || {};
  const party = incoming ? from : to;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <Avatar name={party.name || '?'} color={party.avatarColor || 'emerald'} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{incoming ? from.name : `To ${to.name}`}</span>
              <Badge variant={req.type === 'SPLIT' ? 'warning' : 'default'}>
                {req.type === 'SPLIT' ? 'Split' : 'Request'}
              </Badge>
              <Badge variant="muted">{req.status}</Badge>
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {req.description} · {timeAgo(req.createdAt)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{inr(req.amount)}</div>
            {req.type === 'SPLIT' && req.totalAmount > 0 && (
              <div className="text-[10px] text-muted-foreground">of {inr(req.totalAmount)}</div>
            )}
          </div>
          {incoming && req.status === 'PENDING' && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onAct(req, 'reject')} className="gap-1">
                <X className="h-3.5 w-3.5" /> Reject
              </Button>
              <Button size="sm" onClick={() => onAct(req, 'pay')} className="gap-1">
                <Check className="h-3.5 w-3.5" /> Pay now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Empty({ label }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
      <Users className="h-8 w-8 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
