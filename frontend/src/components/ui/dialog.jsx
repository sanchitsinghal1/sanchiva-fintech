'use client';
import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dialog({ open, onOpenChange, children, className }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange?.(false)}
          />
          <motion.div
            className={cn(
              'relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl',
              className
            )}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', duration: 0.35 }}
          >
            <button
              onClick={() => onOpenChange?.(false)}
              className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
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
