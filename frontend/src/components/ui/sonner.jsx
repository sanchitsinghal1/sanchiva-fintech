'use client';
import { Toaster as Sonner } from 'sonner';
import { useTheme } from 'next-themes';

export function Toaster() {
  const { theme } = useTheme();
  return (
    <Sonner
      theme={theme || 'dark'}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'rounded-xl border border-border bg-card text-card-foreground shadow-2xl',
          title: 'font-semibold',
          description: 'text-muted-foreground',
        },
      }}
    />
  );
}

export { toast } from 'sonner';
