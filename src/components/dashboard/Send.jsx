'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, Send as SendIcon, UserPlus, ArrowRight } from 'lucide-react';
import { api, withToast } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { inr } from '@/lib/utils';

const CATEGORIES = [
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'FOOD', label: 'Food' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'BILLS', label: 'Bills' },
  { value: 'SHOPPING', label: 'Shopping' },
  { value: 'OTHER', label: 'Other' },
];

export function Send({ onNavigate }) {
  const { account, refreshAccount } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loadingBen, setLoadingBen] = useState(true);
  const [form, setForm] = useState({ toAccountNumber: '', amount: '', note: '', category: 'TRANSFER' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(null);

  const loadBen = async () => {
    try {
      const data = await api.get('/api/beneficiaries');
      setBeneficiaries(data.beneficiaries);
    } finally {
      setLoadingBen(false);
    }
  };
  useEffect(() => {
    loadBen();
  }, []);

  const pickBeneficiary = (b) => setForm((f) => ({ ...f, toAccountNumber: b.accountNumber }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const data = await api.post('/api/transactions/transfer', {
        toAccountNumber: form.toAccountNumber,
        amount: Number(form.amount),
        note: form.note,
        category: form.category,
      });
      setSuccess(data.transaction);
      await refreshAccount();
      toast.success(`Sent ${inr(form.amount)} successfully`);
      setForm({ toAccountNumber: '', amount: '', note: '', category: 'TRANSFER' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Send Money</h1>
        <p className="text-sm text-muted-foreground">ACID-backed transfers. If anything fails, it rolls back.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer</CardTitle>
            <CardDescription>
              Available balance:{' '}
              <span className="font-semibold text-foreground">{account ? inr(account.balance) : '…'}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Recipient account number</Label>
                <Input
                  value={form.toAccountNumber}
                  onChange={(e) => setForm((f) => ({ ...f, toAccountNumber: e.target.value }))}
                  placeholder="10-digit account number"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                    options={CATEGORIES}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Note (optional)</Label>
                  <Input
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="Dinner, rent…"
                  />
                </div>
              </div>
              <Button type="submit" disabled={sending} className="w-full" size="lg">
                {sending ? <Loader2 className="animate-spin" /> : <SendIcon className="h-4 w-4" />}
                {sending ? 'Sending…' : 'Send money'}
              </Button>
            </form>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-lg border border-success/40 bg-success/10 p-3 text-sm"
              >
                ✅ Transfer complete · Ref <span className="font-mono">{success.reference}</span> · New balance{' '}
                {inr(success.newBalance)}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Beneficiaries quick-pick */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Saved beneficiaries</CardTitle>
              <CardDescription>Tap to auto-fill the recipient.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('beneficiaries')} className="gap-1">
              <UserPlus className="h-3.5 w-3.5" /> Manage
            </Button>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {loadingBen ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
            ) : beneficiaries.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No beneficiaries yet. Add one to send faster.
              </div>
            ) : (
              beneficiaries.map((b) => (
                <button
                  key={b._id}
                  onClick={() => pickBeneficiary(b)}
                  className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-secondary/60"
                >
                  <Avatar name={b.name} color="emerald" size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{b.nickname}</div>
                    <div className="font-mono text-xs text-muted-foreground">{b.accountNumber}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
