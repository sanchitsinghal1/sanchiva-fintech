'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SanchivaLogo } from '@/components/SanchivaLogo';
import { cn } from '@/lib/utils';

/**
 * AuthView — single component handling login / register / KYC as three
 * "panels" of one dialog. `initialView` selects which panel opens.
 */
export function AuthView({ initialView = 'login', onClose, onSwitch, forceKyc = false }) {
  const { login, register, completeKyc } = useAuth();
  const [view, setView] = useState(initialView);
  const [loading, setLoading] = useState(false);
  // Pre-fill demo creds when the panel opens on 'login' (preview convenience).
  const [form, setForm] = useState(() =>
    initialView === 'login'
      ? { email: 'aria@sanchiva.com', password: 'Sanchiva@2024' }
      : {}
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const switchView = (v) => {
    // On switching to login, pre-fill the demo creds; otherwise clear.
    setForm(v === 'login' ? { email: 'aria@sanchiva.com', password: 'Sanchiva@2024' } : {});
    setView(v);
    onSwitch?.(v);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back to Sanchiva');
        onClose?.();
      } else if (view === 'register') {
        await register({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        });
        toast.success('Account created — verify your identity to unlock transfers');
        switchView('kyc');
      } else if (view === 'kyc') {
        await completeKyc({
          dob: form.dob,
          address: form.address,
          city: form.city,
          occupation: form.occupation,
          incomeRange: form.incomeRange,
        });
        toast.success('KYC verified — banking unlocked');
        onClose?.();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={forceKyc ? undefined : onClose} className="sm:max-w-md">
      <div className="mb-6 flex flex-col items-center text-center">
        <SanchivaLogo size="md" />
        <h2 className="mt-5 text-2xl font-bold tracking-tight">
          {view === 'login' && 'Welcome back'}
          {view === 'register' && 'Open your account'}
          {view === 'kyc' && 'Verify your identity'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {view === 'login' && 'Sign in to your Sanchiva dashboard'}
          {view === 'register' && 'It takes 30 seconds. No paperwork.'}
          {view === 'kyc' && 'Complete KYC to unlock transfers and cards'}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {view === 'register' && (
          <Field label="Full name">
            <Input value={form.name || ''} onChange={set('name')} placeholder="Aria Sharma" required />
          </Field>
        )}

        {(view === 'login' || view === 'register') && (
          <>
            <Field label="Email">
              <Input
                type="email"
                value={form.email || ''}
                onChange={set('email')}
                placeholder="you@email.com"
                required
              />
            </Field>
            {view === 'register' && (
              <Field label="Phone">
                <Input value={form.phone || ''} onChange={set('phone')} placeholder="+91 90000 00000" required />
              </Field>
            )}
            <Field label="Password">
              <Input
                type="password"
                value={form.password || ''}
                onChange={set('password')}
                placeholder="At least 8 characters"
                required
              />
            </Field>
          </>
        )}

        {view === 'kyc' && (
          <>
            <Field label="Date of birth">
              <Input type="date" value={form.dob || ''} onChange={set('dob')} required />
            </Field>
            <Field label="Address">
              <Textarea value={form.address || ''} onChange={set('address')} placeholder="Flat, street, area" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <Input value={form.city || ''} onChange={set('city')} placeholder="Bengaluru" required />
              </Field>
              <Field label="Occupation">
                <Input value={form.occupation || ''} onChange={set('occupation')} placeholder="Engineer" required />
              </Field>
            </div>
            <Field label="Income range">
              <Input value={form.incomeRange || ''} onChange={set('incomeRange')} placeholder="12-25 LPA" required />
            </Field>
          </>
        )}

        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading && <Loader2 className="animate-spin" />}
          {view === 'login' && 'Sign in'}
          {view === 'register' && 'Create account'}
          {view === 'kyc' && 'Verify & continue'}
        </Button>
      </form>

      {!forceKyc && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {view === 'login' ? (
            <>
              New to Sanchiva?{' '}
              <button className="font-medium text-primary hover:underline" onClick={() => switchView('register')}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className="font-medium text-primary hover:underline" onClick={() => switchView('login')}>
                Sign in
              </button>
            </>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
        {view === 'kyc' ? <ShieldCheck className="h-3.5 w-3.5 text-primary" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
        {view === 'kyc'
          ? 'Your data is encrypted at rest and never shared.'
          : 'Demo seed: aria@sanchiva.com · Sanchiva@2024'}
      </div>
    </Dialog>
  );
}

function Field({ label, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
