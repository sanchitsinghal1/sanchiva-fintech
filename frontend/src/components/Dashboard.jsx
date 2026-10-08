'use client';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Send,
  Users,
  UserPlus,
  Plus,
  FileText,
  PiggyBank,
  Gift,
  ShieldCheck,
  Receipt,
  TrendingUp,
  Banknote,
  Umbrella,
  Globe,
  Briefcase,
  Settings as SettingsIcon,
  Menu,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useSocket } from '@/lib/socket';
import { toast } from 'sonner';
import { SanchivaLogo } from '@/components/SanchivaLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationsBell } from '@/components/NotificationsBell';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownItem, DropdownLabel, DropdownSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Overview } from '@/components/dashboard/Overview';
import { Cards } from '@/components/dashboard/Cards';
import { Transactions } from '@/components/dashboard/Transactions';
import { Send as SendView } from '@/components/dashboard/Send';
import { Requests } from '@/components/dashboard/Requests';
import { Beneficiaries } from '@/components/dashboard/Beneficiaries';
import { AddFunds } from '@/components/dashboard/AddFunds';
import { Statements } from '@/components/dashboard/Statements';
import { Settings } from '@/components/dashboard/Settings';
import { Vaults } from '@/components/dashboard/Vaults';
import { Rewards } from '@/components/dashboard/Rewards';
import { Sessions } from '@/components/dashboard/Sessions';
import { Bills } from '@/components/dashboard/Bills';
import { Wealth } from '@/components/dashboard/Wealth';
import { Loans } from '@/components/dashboard/Loans';
import { Insurance } from '@/components/dashboard/Insurance';
import { Forex } from '@/components/dashboard/Forex';
import { Business } from '@/components/dashboard/Business';
import { Chatbot } from '@/components/Chatbot';
import { ReceiveQR } from '@/components/ReceiveQR';

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'vaults', label: 'Vaults', icon: PiggyBank },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'send', label: 'Send Money', icon: Send },
  { id: 'requests', label: 'Requests', icon: Users },
  { id: 'bills', label: 'Bills & Recharge', icon: Receipt },
  { id: 'wealth', label: 'Wealth', icon: TrendingUp },
  { id: 'loans', label: 'Loans & Credit', icon: Banknote },
  { id: 'insurance', label: 'Insurance', icon: Umbrella },
  { id: 'forex', label: 'Forex', icon: Globe },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'rewards', label: 'Rewards', icon: Gift },
  { id: 'beneficiaries', label: 'Beneficiaries', icon: UserPlus },
  { id: 'add-funds', label: 'Add Funds', icon: Plus },
  { id: 'statements', label: 'Statements', icon: FileText },
  { id: 'sessions', label: 'Security', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

const VIEWS = {
  overview: Overview,
  cards: Cards,
  vaults: Vaults,
  transactions: Transactions,
  send: SendView,
  requests: Requests,
  bills: Bills,
  wealth: Wealth,
  loans: Loans,
  insurance: Insurance,
  forex: Forex,
  business: Business,
  rewards: Rewards,
  beneficiaries: Beneficiaries,
  'add-funds': AddFunds,
  statements: Statements,
  sessions: Sessions,
  settings: Settings,
};

export function Dashboard({ onSwitchToAdmin }) {
  const { user, account, logout, refreshAccount, refreshMe } = useAuth();
  const { subscribe, connected } = useSocket();
  const [view, setView] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // --- Real-time event handling ---------------------------------------------
  // Whenever money is received / requested, refetch balance + show a toast.
  useEffect(() => {
    const offReceived = subscribe('money-received', (p) => {
      toast.success(`₹${Number(p.amount).toLocaleString('en-IN')} received`, {
        description: `From ${p.from} · Ref ${p.reference?.slice(-8)}`,
      });
      refreshAccount();
      refreshMe();
      // bump the user to transactions if they're elsewhere
      if (view !== 'transactions' && view !== 'overview') {
        // optional nudge — don't force
      }
    });
    const offRequested = subscribe('money-requested', (p) => {
      toast(`₹${Number(p.amount).toLocaleString('en-IN')} requested`, {
        description: `${p.from} · ${p.description}`,
      });
    });
    const offFrozen = subscribe('card-frozen', (p) => {
      toast.success(`Card •••• ${p.last4} frozen`);
    });
    return () => {
      offReceived();
      offRequested();
      offFrozen();
    };
  }, [subscribe, refreshAccount, refreshMe, view]);

  const ActiveView = VIEWS[view];

  const SidebarContent = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map((item) => {
        const active = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setView(item.id);
              setMobileOpen(false);
            }}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-lg bg-primary shadow-lg shadow-primary/30"
                transition={{ type: 'spring', duration: 0.45, bounce: 0.18 }}
              />
            )}
            <item.icon className="relative z-10 h-[18px] w-[18px]" />
            <span className="relative z-10">{item.label}</span>
          </button>
        );
      })}
      <div className="mt-auto p-2">
        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-xs">
          <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-success' : 'bg-muted-foreground')} />
          <span className="text-muted-foreground">{connected ? 'Real-time connected' : 'Reconnecting…'}</span>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background bg-mesh">
      {/* --- Desktop sidebar --- */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card/40 glass lg:flex">
        <div className="flex h-16 items-center px-5">
          <SanchivaLogo size="sm" />
        </div>
        {SidebarContent}
      </aside>

      {/* --- Mobile sidebar drawer --- */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
            >
              <div className="flex h-16 items-center justify-between px-5">
                <SanchivaLogo size="sm" />
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- Main column --- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border glass-strong px-4 sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <NotificationsBell />
          <ThemeToggle />
          <DropdownMenu
            trigger={
              <button className="flex items-center gap-2 rounded-lg p-1 pr-3 transition-colors hover:bg-secondary">
                <Avatar name={user.name} color={user.avatarColor} size="sm" />
                <div className="hidden text-left sm:block">
                  <div className="text-sm font-medium leading-tight">{user.name}</div>
                  <div className="text-xs text-muted-foreground">Sanchiva Member</div>
                </div>
              </button>
            }
          >
            <DropdownLabel>Account</DropdownLabel>
            <DropdownItem onClick={() => setView('settings')}>
              <SettingsIcon className="h-4 w-4" /> Settings
            </DropdownItem>
            <DropdownItem onClick={() => setView('statements')}>
              <FileText className="h-4 w-4" /> Statements
            </DropdownItem>
            {user.role === 'SUPER_ADMIN' && onSwitchToAdmin && (
              <DropdownItem onClick={onSwitchToAdmin}>
                <ShieldCheck className="h-4 w-4" /> Admin Console
              </DropdownItem>
            )}
            <DropdownSeparator />
            <DropdownItem destructive onClick={logout}>
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownItem>
          </DropdownMenu>
        </header>

        {/* View body */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <ActiveView onNavigate={setView} onOpenQR={() => setShowQR(true)} />
          </div>
        </main>

        {/* Sticky footer */}
        <footer className="mt-auto border-t border-border/60 px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
          Sanchiva · Next-Gen Banking · {new Date().getFullYear()}
        </footer>
      </div>

      <Chatbot />
      <ReceiveQR open={showQR} onClose={() => setShowQR(false)} account={account} user={user} />
    </div>
  );
}
