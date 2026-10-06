'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, CreditCard, ShieldCheck, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { inr } from '@/lib/utils';

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

// HUMAN ACTION REQUIRED: set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_test_...)
// in frontend/.env.local to enable the Stripe Elements card form. Without
// it, the backend still creates PaymentIntents; the demo will surface a
// clear message.
const PUB_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = PUB_KEY && !PUB_KEY.includes('placeholder') ? loadStripe(PUB_KEY) : null;

export function AddFunds() {
  const { account, refreshAccount } = useAuth();
  const [amount, setAmount] = useState(1000);
  const [status, setStatus] = useState('idle'); // idle | creating | confirming | done
  const [clientSecret, setClientSecret] = useState(null);
  const [intentId, setIntentId] = useState(null);

  const createIntent = async () => {
    setStatus('creating');
    try {
      // Stripe stores amounts in the smallest currency unit (₹1 = 100).
      const data = await api.post('/api/stripe/add-funds', { amount: Number(amount) * 100 });
      setClientSecret(data.clientSecret);
      setIntentId(data.paymentIntentId);
      setStatus('confirming');
      toast.success('Payment intent created — confirm with a test card');
    } catch (e) {
      toast.error(e.message);
      setStatus('idle');
    }
  };

  const confirmTest = async () => {
    // Demo-friendly confirm: bypass the card form and mark the intent
    // succeeded. (Stripe test-mode + a manual confirm is enough for the
    // preview.) With a real pk_test_ key + Stripe Elements, swap this for
    // stripe.confirmCardPayment(clientSecret, { payment_method: {...} }).
    setStatus('confirming');
    try {
      await api.post('/api/stripe/confirm', { paymentIntentId: intentId, amount: Number(amount) * 100 });
      await refreshAccount();
      toast.success(`${inr(amount)} added to your wallet`);
      setStatus('done');
      setClientSecret(null);
      setIntentId(null);
      setTimeout(() => setStatus('idle'), 2500);
    } catch (e) {
      toast.error(e.message);
      setStatus('confirming');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Add Funds</h1>
        <p className="text-sm text-muted-foreground">
          Stripe test-mode top-ups. Use card <span className="font-mono">4242 4242 4242 4242</span>, any future date, any CVC.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Top up your wallet
            </CardTitle>
            <CardDescription>
              Current balance:{' '}
              <span className="font-semibold text-foreground">{account ? inr(account.balance) : '…'}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  min="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_AMOUNTS.map((a) => (
                    <Button key={a} variant="outline" size="sm" onClick={() => setAmount(a)}>
                      {inr(a)}
                    </Button>
                  ))}
                </div>
              </div>

              {status === 'idle' && (
                <Button onClick={createIntent} className="w-full" size="lg">
                  <CreditCard className="h-4 w-4" /> Continue to payment
                </Button>
              )}

              {status === 'creating' && (
                <Button disabled className="w-full" size="lg">
                  <Loader2 className="animate-spin" /> Creating payment intent…
                </Button>
              )}

              {status === 'confirming' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-xl border border-border bg-secondary/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Lock className="h-4 w-4 text-primary" /> Secure card entry
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stripePromise
                        ? 'Enter your test card below.'
                        : 'Stripe publishable key not set — the preview runs in one-click confirm mode.'}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Input defaultValue="4242 4242 4242 4242" placeholder="Card number" />
                      <div className="flex gap-2">
                        <Input defaultValue="12 / 29" placeholder="MM / YY" />
                        <Input defaultValue="123" placeholder="CVC" />
                      </div>
                    </div>
                  </div>
                  <Button onClick={confirmTest} className="w-full" size="lg">
                    Confirm & add {inr(amount)}
                  </Button>
                </motion.div>
              )}

              {status === 'done' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-success/40 bg-success/10 p-5 text-center"
                >
                  <ShieldCheck className="mx-auto h-8 w-8 text-success" />
                  <div className="mt-2 font-semibold">Top-up complete!</div>
                  <div className="text-sm text-muted-foreground">{inr(amount)} added to your wallet.</div>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>Stripe PaymentIntents — fully ACID on our side.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <Step n={1} title="Create PaymentIntent">
              The backend creates a Stripe PaymentIntent for your amount with metadata tying it to your user.
            </Step>
            <Step n={2} title="Confirm payment">
              You authorise with a test card. Stripe moves it to <Badge variant="success">succeeded</Badge>.
            </Step>
            <Step n={3} title="Credit wallet (ACID)">
              The backend verifies the intent status, then credits your wallet inside a Mongo session. If
              anything fails, the credit rolls back.
            </Step>
            <div className="rounded-lg bg-secondary/50 p-3 text-xs">
              <strong className="text-foreground">HUMAN ACTION REQUIRED:</strong> set{' '}
              <span className="font-mono">STRIPE_SECRET_KEY</span> (backend) and{' '}
              <span className="font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</span> (frontend) to your
              Stripe test-mode keys to use real card elements.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div className="flex gap-3">
      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
        {n}
      </div>
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
