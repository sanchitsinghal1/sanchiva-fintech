'use client';
import { useEffect, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth';
import { cn, timeAgo } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ICONS = {
  TRANSACTION: '💸',
  REQUEST: '🤝',
  SYSTEM: '🔔',
  SECURITY: '🔒',
};

export function NotificationsBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { subscribe } = useSocket();
  const { user } = useAuth();

  const fetchAll = useCallback(async () => {
    try {
      const data = await api.get('/api/notifications');
      setItems(data.notifications);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Real-time: when a 'notification' event arrives, refetch the bell.
  useEffect(() => {
    const off = subscribe('notification', fetchAll);
    const offRecv = subscribe('money-received', fetchAll);
    const offReq = subscribe('money-requested', fetchAll);
    return () => {
      off();
      offRecv();
      offReq();
    };
  }, [subscribe, fetchAll]);

  const unread = items.filter((n) => !n.read).length;

  const markAll = async () => {
    await api.post('/api/notifications/read-all', {});
    setItems((arr) => arr.map((n) => ({ ...n, read: true })));
  };

  const markOne = async (id) => {
    await api.patch(`/api/notifications/${id}/read`, {});
    setItems((arr) => arr.map((n) => (n._id === id ? { ...n, read: true } : n)));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center rounded-lg border border-border bg-card/60 text-foreground transition-colors hover:bg-secondary"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground shadow">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="text-sm font-semibold">Notifications</div>
              {unread > 0 && (
                <Button variant="ghost" size="sm" onClick={markAll} className="h-7 text-xs">
                  Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading…</div>
              ) : items.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">You're all caught up ✨</div>
              ) : (
                items.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => markOne(n._id)}
                    className={cn(
                      'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-secondary/50',
                      !n.read && 'bg-primary/5'
                    )}
                  >
                    <span className="mt-0.5 text-lg">{ICONS[n.type] || '🔔'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-tight">{n.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{n.message}</span>
                      <span className="mt-1 block text-[10px] text-muted-foreground/70">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
