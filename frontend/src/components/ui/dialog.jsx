'use client';
import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Dialog — animated modal overlay.
 * Accepts EITHER `onClose()` (no-arg — used by every Sanchiva caller) OR
 * `onOpenChange(false)`. Closes via: the X button, backdrop click, or Escape.
 * The panel is max-height + scrollable so the X never overflows off-screen.
 */
export function Dialog({ open, onClose, onOpenChange, children, className, closeOnBackdrop = true }) {
  // Unified close — works whether the caller passed onClose or onOpenChange.
  const close = React.useCallback(() => {
    onClose?.();
    onOpenChange?.(false);
  }, [onClose, onOpenChange]);

  // Escape to dismiss + lock body scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => closeOnBackdrop && close()}
          />
          <motion.div
            className={cn(
              'relative z-10 my-auto max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl',
              className
            )}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', duration: 0.35 }}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 z-30 grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DialogHeader({ children }) {
  return <div className="mb-4 flex flex-col gap-1.5">{children}</div>;
}
export function DialogTitle({ children }) {
  return <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>;
}
export function DialogDescription({ children }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
