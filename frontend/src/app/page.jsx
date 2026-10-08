'use client';
import dynamic from 'next/dynamic';

// Render the whole SPA client-side — auth state determines what shows.
// (The backend holds the session in httpOnly cookies, so the very first
// paint is a branded splash until /api/auth/me resolves.)
const App = dynamic(() => import('@/components/App').then((m) => m.App), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-gradient-to-br from-primary to-emerald-700" />
        <div className="text-sm text-muted-foreground">Loading Sanchiva…</div>
      </div>
    </div>
  ),
});

export default function Page() {
  return <App />;
}
