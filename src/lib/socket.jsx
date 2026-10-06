/**
 * Socket.io provider — connects to the Express backend (port 5000) through
 * the Caddy gateway. Auth is cookie-based (withCredentials), so the
 * httpOnly access cookie rides along on the handshake.
 *
 * Exposes a subscribe(event, cb) helper used across the dashboard for
 * real-time money-received / money-requested / notification events.
 */
'use client';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const listeners = useRef(new Map());

  // (Re)connect whenever the logged-in user changes.
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    // Connect to the gateway root with XTransformPort=5000 so Caddy
    // routes the socket.io handshake (default path /socket.io/) to the
    // Express backend. Cookies ride along via withCredentials.
    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      query: { XTransformPort: 5000 },
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (e) => console.warn('[socket] connect_error', e.message));

    // Fan every server event out to all registered listeners.
    const EVENTS = ['connected', 'money-received', 'money-requested', 'request-update', 'card-frozen', 'notification'];
    EVENTS.forEach((ev) => {
      socket.on(ev, (payload) => {
        const cbs = listeners.current.get(ev) || [];
        cbs.forEach((cb) => cb(payload));
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  const subscribe = useCallback((event, cb) => {
    if (!listeners.current.has(event)) listeners.current.set(event, []);
    listeners.current.get(event).push(cb);
    return () => {
      const arr = listeners.current.get(event) || [];
      const idx = arr.indexOf(cb);
      if (idx >= 0) arr.splice(idx, 1);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ connected, subscribe, socket: socketRef }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
