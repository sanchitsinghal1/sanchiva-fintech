// /**
//  * Socket.io provider — connects to the Express backend (port 5000) through
//  * the Caddy gateway. Auth is cookie-based (withCredentials), so the
//  * httpOnly access cookie rides along on the handshake.
//  *
//  * Exposes a subscribe(event, cb) helper used across the dashboard for
//  * real-time money-received / money-requested / notification events.
//  */
// 'use client';
// import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
// import { io } from 'socket.io-client';
// import { useAuth } from '@/lib/auth';
// import { toast } from 'sonner';

// const SocketContext = createContext(null);

// export function SocketProvider({ children }) {
//   const { user } = useAuth();
//   const socketRef = useRef(null);
//   const [connected, setConnected] = useState(false);
//   const listeners = useRef(new Map());

//   // (Re)connect whenever the logged-in user changes.
//   useEffect(() => {
//     if (!user) {
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//         socketRef.current = null;
//       }
//       setConnected(false);
//       return;
//     }

//     // Connect to the gateway root with XTransformPort=5000 so Caddy
//     // routes the socket.io handshake (default path /socket.io/) to the
//     // Express backend. Cookies ride along via withCredentials.
//     const socket = io({
//       path: '/socket.io',
//       transports: ['websocket', 'polling'],
//       withCredentials: true,
//       reconnection: true,
//       reconnectionAttempts: Infinity,
//       reconnectionDelay: 1500,
//       query: { XTransformPort: 5000 },
//     });
//     socketRef.current = socket;

//     socket.on('connect', () => setConnected(true));
//     socket.on('disconnect', () => setConnected(false));
//     socket.on('connect_error', (e) => console.warn('[socket] connect_error', e.message));

//     // Fan every server event out to all registered listeners.
//     const EVENTS = ['connected', 'money-received', 'money-requested', 'request-update', 'card-frozen', 'notification'];
//     EVENTS.forEach((ev) => {
//       socket.on(ev, (payload) => {
//         const cbs = listeners.current.get(ev) || [];
//         cbs.forEach((cb) => cb(payload));
//       });
//     });

//     return () => {
//       socket.disconnect();
//       socketRef.current = null;
//       setConnected(false);
//     };
//   }, [user]);

//   const subscribe = useCallback((event, cb) => {
//     if (!listeners.current.has(event)) listeners.current.set(event, []);
//     listeners.current.get(event).push(cb);
//     return () => {
//       const arr = listeners.current.get(event) || [];
//       const idx = arr.indexOf(cb);
//       if (idx >= 0) arr.splice(idx, 1);
//     };
//   }, []);

//   return (
//     <SocketContext.Provider value={{ connected, subscribe, socket: socketRef }}>
//       {children}
//     </SocketContext.Provider>
//   );
// }

// export function useSocket() {
//   const ctx = useContext(SocketContext);
//   if (!ctx) throw new Error('useSocket must be used within SocketProvider');
//   return ctx;
// }




/**
 * Socket.io प्रोवाइडर — Express बैकएंड के Socket.io सर्वर से कनेक्ट करता है।
 *
 * डायनामिक टारगेट (प्रोडक्शन फिक्स — lib/api.js की मिरर कॉपी):
 *   - यदि NEXT_PUBLIC_API_URL सेट है (Vercel पर प्रोडक्शन), तो सीधे
 *     डिप्लॉयड Render बैकएंड (निरपेक्ष URI) से कनेक्ट करें, withCredentials के साथ ताकि
 *     httpOnly ऑथ कुकी (प्रोडक्शन में sameSite=none; secure) साथ चल सके।
 *   - यदि NEXT_PUBLIC_API_URL खाली है (localhost / सैंडबॉक्स प्रीव्यू), तो कनेक्ट करें
 *     ?XTransformPort=5000 (रिलेटिव, सेम-ओरिजिन) के जरिए Caddy गेटवे से।
 *
 * ऑथ कुकी-आधारित है; हैंडशेक सर्वर-साइड JWT-वेरिफाइड है।
 * डैशबोर्ड भर में रियल-टाइम मनी-रिसीव्ड / मनी-रिक्वेस्टेड / नोटिफिकेशन इवेंट्स के लिए
 * सब्सक्राइब(event, cb) हेल्पर प्रदान करता है।
 */
'use client';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

const SocketContext = createContext(null);

// प्रोडक्शन: NEXT_PUBLIC_API_URL=https://your-api.onrender.com (Vercel में सेट करें)।
// खाली (localhost/सैंडबॉक्स): रिलेटिव गेटवे पाथ का उपयोग करें।
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const listeners = useRef(new Map());

  // (जब भी लॉग-इन यूजर बदले तो) फिर से कनेक्ट करें।
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    let socket;
    if (API_BASE) {
      // प्रोडक्शन: डिप्लॉयड बैकएंड (क्रॉस-ओरिजिन) से सीधे कनेक्ट करें।
      socket = io(API_BASE, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1500,
      });
    } else {
      // सैंडबॉक्स / localhost — हैंडशेक को Caddy गेटवे से रूट करें।
      socket = io({
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1500,
        query: { XTransformPort: 5000 },
      });
    }
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (e) => console.warn('[socket] connect_error', e.message));

    // हर सर्वर इवेंट को सभी रजिस्टर्ड लिसनर्स तक पहुंचाएं।
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