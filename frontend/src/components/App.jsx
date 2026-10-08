'use client';
import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Landing } from '@/components/Landing';
import { AuthView } from '@/components/AuthView';
import { Dashboard } from '@/components/Dashboard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { SanchivaLogo } from '@/components/SanchivaLogo';

/**
 * App — single-route root (sandbox-robust: NO multi-route redirects, so a
 * redirect loop is IMPOSSIBLE by construction).
 *
 * God Mode: a SUPER_ADMIN sees the AdminDashboard by default and can toggle
 * to the regular Dashboard (and back) via a floating pill — both rendered
 * in-app, no route change → no loop.
 */
export function App() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState(null);
  const [adminView, setAdminView] = useState(true); // SUPER_ADMIN default: admin console

  const openAuth = useCallback((v) => setAuthView(v), []);
  const closeAuth = useCallback(() => setAuthView(null), []);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-mesh">
        <div className="flex flex-col items-center gap-4">
          <SanchivaLogo size="lg" />
          <div className="text-sm text-muted-foreground">Securing your session…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Landing onGetStarted={() => setAuthView('register')} onLogin={() => setAuthView('login')} />
        {authView && <AuthView initialView={authView} onClose={closeAuth} onSwitch={setAuthView} />}
      </>
    );
  }

  if (user.kycStatus !== 'VERIFIED' && user.role !== 'SUPER_ADMIN') {
    return <AuthView initialView="kyc" onClose={() => {}} onSwitch={setAuthView} forceKyc />;
  }

  if (user.role === 'SUPER_ADMIN') {
    return (
      <>
        {adminView ? <AdminDashboard onSwitchToDashboard={() => setAdminView(false)} /> : <Dashboard onSwitchToAdmin={() => setAdminView(true)} />}
        <button onClick={() => setAdminView((v) => !v)} className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2.5 text-xs font-medium shadow-2xl backdrop-blur transition-all hover:scale-105">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {adminView ? 'Switch to My Dashboard' : 'Back to Admin Console'}
        </button>
      </>
    );
  }

  return <Dashboard />;
}
