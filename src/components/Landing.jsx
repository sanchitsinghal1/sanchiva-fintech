'use client';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  CreditCard,
  LineChart,
  Users,
  Bell,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { SanchivaLogo } from '@/components/SanchivaLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const FEATURES = [
  { icon: CreditCard, title: '3D Virtual Cards', desc: 'Freeze, reveal CVV, and set limits on glassmorphic cards that flip in 3D.' },
  { icon: Zap, title: 'Instant Transfers', desc: 'ACID-backed money movement. If anything fails mid-flight, it rolls back.' },
  { icon: Bell, title: 'Real-Time Push', desc: 'Socket.io streams money-received and money-requested events the instant they happen.' },
  { icon: LineChart, title: 'Smart Analytics', desc: 'Interactive charts break down spend by Food, Travel, Bills, Shopping — and net cash flow.' },
  { icon: Users, title: 'Split Bills', desc: 'Request money from any registered user. Split a bill across friends in one tap.' },
  { icon: ShieldCheck, title: 'Enterprise Security', desc: 'JWT + refresh-token rotation, rate limiting, httpOnly cookies, KYC gating.' },
];

const STATS = [
  { value: '₹4.2Cr+', label: 'Processed this quarter' },
  { value: '120K+', label: 'Active accounts' },
  { value: '99.99%', label: 'Uptime' },
  { value: '<40ms', label: 'Avg. transfer latency' },
];

export function Landing({ onGetStarted, onLogin }) {
  return (
    <div className="flex min-h-screen flex-col bg-background bg-mesh">
      {/* --- Header --- */}
      <header className="sticky top-0 z-40 border-b border-border/60 glass-strong">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <SanchivaLogo size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={onLogin} className="hidden sm:inline-flex">
              Sign in
            </Button>
            <Button variant="gold" onClick={onGetStarted} className="group">
              Get Started
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* --- Hero --- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge variant="default" className="mb-6 gap-1.5">
              <Sparkles className="h-3 w-3" />
              Next-Gen Fintech · Built for India, scaled globally
            </Badge>
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Banking, <span className="text-gradient">reimagined</span> for the next decade.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              Sanchiva is a complete banking platform — virtual cards, instant ACID transfers,
              real-time money, smart analytics, split bills, PDF statements, and Stripe-powered
              top-ups. Secure by design, breathtaking by default.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="gold" onClick={onGetStarted} className="group w-full sm:w-auto">
                Open your free account
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={onLogin} className="w-full sm:w-auto">
                Sign in
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Demo login · <span className="font-mono text-foreground/80">aria@sanchiva.com</span> ·{' '}
              <span className="font-mono text-foreground/80">Sanchiva@2024</span>
            </p>
          </motion.div>

          {/* --- Floating card preview --- */}
          <motion.div
            initial={{ opacity: 0, y: 32, rotateX: 12 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mt-14 max-w-md"
          >
            <div className="card-emerald relative aspect-[1.586] w-full rounded-2xl p-6 text-white shadow-2xl shadow-emerald-900/40">
              <div className="flex items-start justify-between">
                <SanchivaLogo withWordmark={false} size="md" />
                <div className="text-right text-[10px] font-medium uppercase tracking-widest opacity-80">
                  {`Virtual · VISA`}
                </div>
              </div>
              <div className="mt-6 h-9 w-12 rounded-md bg-gradient-to-br from-yellow-200/90 to-amber-400/90 shadow-inner" />
              <div className="mt-5 font-mono text-lg tracking-[0.18em]">4242 4242 4242 1337</div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-[9px] uppercase tracking-widest opacity-70">Cardholder</div>
                  <div className="text-sm font-medium">ARIA SHARMA</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-widest opacity-70">Valid Thru</div>
                  <div className="text-sm font-medium">08/29</div>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-accent/30 blur-2xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Stats --- */}
      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold tracking-tight sm:text-3xl">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --- Features --- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything a modern bank should be</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Eight enterprise-grade systems, one cohesive experience.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group relative rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- Security band --- */}
      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-12 text-center sm:px-6 lg:px-8">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h3 className="text-2xl font-bold">Money that never moves halfway</h3>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Every transfer runs inside a MongoDB session. Debit + credit + ledger rows commit
            atomically — or the entire operation rolls back. No phantom balances. No lost money.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {['JWT + Refresh rotation', 'Rate limiting', 'KYC gating', 'httpOnly cookies', 'Helmet + CORS'].map(
              (s) => (
                <Badge key={s} variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  {s}
                </Badge>
              )
            )}
          </div>
        </div>
      </section>

      {/* --- Final CTA --- */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Your next bank is one click away.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Join the preview. No paperwork, no waiting — your virtual card is issued the moment you sign up.
        </p>
        <Button size="lg" variant="gold" onClick={onGetStarted} className="mt-8 group">
          Create my Sanchiva account
          <ArrowRight className="transition-transform group-hover:translate-x-1" />
        </Button>
      </section>

      {/* --- Footer (sticky to bottom) --- */}
      <footer className="mt-auto border-t border-border/60 bg-card/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <SanchivaLogo size="sm" />
          <p>© {new Date().getFullYear()} Sanchiva. Built as a production-grade reference.</p>
          <div className="flex gap-4">
            <span>Security</span>
            <span>Privacy</span>
            <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
