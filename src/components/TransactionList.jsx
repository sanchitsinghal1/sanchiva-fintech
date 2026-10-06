'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { TransactionRow } from '@/components/TransactionRow';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';

/**
 * TransactionList — cursor-paginated infinite scroll.
 * A sentinel div sits at the bottom; an IntersectionObserver fetches the
 * next page when it scrolls into view. `nextCursor` is null when done.
 */
export function TransactionList({ category = 'ALL', type = 'ALL', q = '', pageSize = 20 }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [done, setDone] = useState(false);
  const sentinel = useRef(null);
  const observer = useRef(null);

  // Reset whenever filters change
  useEffect(() => {
    setItems([]);
    setCursor(null);
    setDone(false);
    setLoading(true);
  }, [category, type, q]);

  const load = useCallback(async () => {
    if (fetching || done) return;
    setFetching(true);
    try {
      const params = new URLSearchParams({ limit: String(pageSize) });
      if (cursor) params.set('cursor', cursor);
      if (category !== 'ALL') params.set('category', category);
      if (type !== 'ALL') params.set('type', type);
      if (q) params.set('q', q);
      const data = await api.get(`/api/transactions?${params.toString()}`);
      setItems((prev) => [...prev, ...(data.items || [])]);
      setCursor(data.nextCursor);
      if (!data.nextCursor) setDone(true);
    } catch (e) {
      setDone(true);
    } finally {
      setFetching(false);
      setLoading(false);
    }
  }, [cursor, fetching, done, category, type, q, pageSize]);

  // Initial load + load when filters change
  useEffect(() => {
    if (items.length === 0 && !done) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, done, category, type, q]);

  // Infinite-scroll observer
  useEffect(() => {
    if (!sentinel.current) return;
    observer.current?.disconnect();
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) load();
      },
      { rootMargin: '200px' }
    );
    observer.current.observe(sentinel.current);
    return () => observer.current?.disconnect();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0 && done) {
    return (
      <div className="grid place-items-center py-16 text-center">
        <div className="text-3xl">🔍</div>
        <p className="mt-2 text-sm text-muted-foreground">No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {items.map((tx, i) => (
        <motion.div
          key={tx._id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: Math.min(i * 0.015, 0.2) }}
        >
          <TransactionRow tx={tx} userId={user?._id} />
        </motion.div>
      ))}

      {/* Sentinel + footer */}
      <div ref={sentinel} className="h-1" />
      {fetching && (
        <div className="space-y-2 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}
      {done && items.length > 0 && (
        <div className="py-6 text-center text-xs text-muted-foreground">— End of transactions —</div>
      )}
    </div>
  );
}
