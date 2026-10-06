'use client';
import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Landing } from '@/components/Landing';
import { AuthView } from '@/components/AuthView';
import { Dashboard } from '@/components/Dashboard';
import { SanchivaLogo } from '@/components/SanchivaLogo';

/**
 * App — the single-route root component.
 * Three render branches driven by auth state + a local `authView` toggle:
 *   - loading  → branded splash
 *   - no user  → Landing (with Login/Register/KYC modal switcher)
 *   - user     → Dashboard (sidebar + view-switched content)
 */
export function App() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState(null); // 'login' | 'register' | 'kyc' | null

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
        {authView && (
          <AuthView
            initialView={authView}
            onClose={closeAuth}
            onSwitch={setAuthView}
          />
        )}
      </>
    );
  }

  if (user.kycStatus !== 'VERIFIED') {
    return <AuthView initialView="kyc" onClose={() => {}} onSwitch={setAuthView} forceKyc />;
  }

  return <Dashboard />;
}
