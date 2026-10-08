'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, UserPlus, Trash2, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export function Beneficiaries({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', accountNumber: '', nickname: '', bankName: 'Sanchiva Bank', ifsc: 'SANC0001' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await api.get('/api/beneficiaries');
      setItems(d.beneficiaries);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/beneficiaries', form);
      toast.success('Beneficiary added');
      setForm({ name: '', accountNumber: '', nickname: '', bankName: 'Sanchiva Bank', ifsc: 'SANC0001' });
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/api/beneficiaries/${id}`);
      setItems((arr) => arr.filter((b) => b._id !== id));
      toast.success('Beneficiary removed');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Beneficiaries</h1>
        <p className="text-sm text-muted-foreground">Save payees for faster, safer transfers.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Add beneficiary
            </CardTitle>
            <CardDescription>Registered Sanchiva accounts transfer instantly.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={add} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></Field>
                <Field label="Nickname"><Input value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))} required /></Field>
              </div>
              <Field label="Account number"><Input value={form.accountNumber} onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))} required /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Bank"><Input value={form.bankName} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))} /></Field>
                <Field label="IFSC"><Input value={form.ifsc} onChange={(e) => setForm((f) => ({ ...f, ifsc: e.target.value }))} /></Field>
              </div>
              <Button type="submit" disabled={saving} className="w-full gap-1">
                {saving ? <Loader2 className="animate-spin" /> : <Send className="h-4 w-4" />} Add beneficiary
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your saved payees</CardTitle>
            <CardDescription>{items.length} beneficiary{items.length === 1 ? '' : 'ies'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
            ) : items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No beneficiaries yet.
              </div>
            ) : (
              items.map((b) => (
                <motion.div
                  key={b._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-secondary/50"
                >
                  <Avatar name={b.name} color="emerald" size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{b.nickname}</div>
                    <div className="font-mono text-xs text-muted-foreground">{b.accountNumber}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(b._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))
            )}
            <Button variant="outline" className="mt-2 w-full" onClick={() => onNavigate('send')}>
              Go to Send Money →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
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
