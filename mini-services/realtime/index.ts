// ============================================================================
// SANCHIVA — Real-time notification service (socket.io)
// ----------------------------------------------------------------------------
// Runs on port 3003 (fixed — Caddy routes browser traffic here via the
// XTransformPort query param). Two responsibilities:
//
//   1. WebSocket fan-out: browser connects with their JWT access token;
//      the server validates it and joins a per-user room `user:<id>`.
//      Money-received / money-requested / card-frozen events are pushed to
//      that room in real time.
//
//   2. Internal HTTP notify endpoint: Next.js API routes POST to
//      http://localhost:3003/notify with { userId, event, payload } and this
//      service fans it out to the connected socket for that user.
// ============================================================================

import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const PORT = 3003;
const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "sanchiva_dev_access_secret_change_me_in_production_32chars";

const httpServer = createServer((req, res) => {
  // --- CORS pre-flight + JSON body parse for /notify ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/notify") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { userId, event, payload } = JSON.parse(body || "{}");
        if (!userId || !event) {
          res.writeHead(400);
          res.end(JSON.stringify({ ok: false, error: "userId + event required" }));
          return;
        }
        io.to(`user:${userId}`).emit(event, payload);
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, delivered: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: "invalid json" }));
      }
    });
    return;
  }

  // healthcheck
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, service: "sanchiva-realtime", connections: io.engine.clientsCount }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ ok: false, error: "not found" }));
});

const io = new Server(httpServer, {
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Authenticate each socket connection against the JWT access token.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next(new Error("NO_TOKEN"));
  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    socket.data.userId = payload.sub;
    next();
  } catch (e) {
    next(new Error("BAD_TOKEN"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  if (userId) {
    socket.join(`user:${userId}`);
    console.log(`[realtime] user ${userId} connected (${socket.id})`);
    // tell the client its own room so the UI can confirm the channel
    socket.emit("connected", { userId, at: new Date().toISOString() });
  }
  socket.on("disconnect", () => {
    console.log(`[realtime] user ${userId} disconnected`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[sanchiva-realtime] listening on :${PORT}`);
});

process.on("SIGTERM", () => httpServer.close(() => process.exit(0)));
process.on("SIGINT", () => httpServer.close(() => process.exit(0)));
