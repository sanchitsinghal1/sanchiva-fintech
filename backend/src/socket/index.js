/**
 * Socket.io real-time layer, attached to the same Express HTTP server.
 *   - Authenticates each connection via the JWT access token (handshake.auth
 *     or cookie).
 *   - Joins the socket into a per-user room `user:<id>`.
 *   - Controllers push events through emitToUser() (utils/socketEmitter).
 * Events emitted to the client: 'connected', 'money-received',
 * 'money-requested', 'request-update', 'notification'.
 */
const { Server } = require('socket.io');
const { verifyAccess } = require('../utils/jwt');
const { setIO } = require('../utils/socketEmitter');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

function parseCookie(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    })
  );
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    // Default path '/socket.io/' — distinct from REST routes at /api/*
    // so socket.io only intercepts its own handshakes, not API traffic.
    // The Caddy gateway routes by the XTransformPort query param.
    cors: { origin: CLIENT_URL, credentials: true },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Auth handshake — reject sockets without a valid access token.
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      parseCookie(socket.handshake.headers.cookie).sanchiva_access;
    if (!token) return next(new Error('NO_TOKEN'));
    const payload = verifyAccess(token);
    if (!payload) return next(new Error('BAD_TOKEN'));
    socket.data.userId = payload.sub;
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`[socket] user ${userId} connected (${socket.id})`);
      socket.emit('connected', { userId, at: new Date().toISOString() });
    }
    socket.on('disconnect', () => console.log(`[socket] user ${userId} disconnected`));
  });

  setIO(io);
  return io;
}

module.exports = { initSocket };
