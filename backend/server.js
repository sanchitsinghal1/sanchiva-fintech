/**
 * SANCHIVA — Express application entry point
 * ----------------------------------------------------------------------------
 * Architecture:
 *   - Helmet      → secure HTTP headers
 *   - CORS         → permissive for the Next.js frontend (CLIENT_URL)
 *   - globalLimiter → brute-force ceiling on every route
 *   - compression + morgan → perf + observability
 *   - Mongo (in-memory fallback) → real MongoDB with zero setup
 *   - REST under /api
 *   - Socket.io attached to the SAME http server — controllers push real-time
 *     events through utils/socketEmitter.
 *   - Centralised error handler is the LAST middleware.
 */
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/socket');
const routes = require('./src/routes');
const { errorHandler } = require('./src/middleware/error');
const { globalLimiter } = require('./src/middleware/rateLimit');

const app = express();
const httpServer = http.createServer(app);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan('dev'));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(globalLimiter);

app.get('/health', (_req, res) => res.json({ ok: true, service: 'sanchiva-api' }));
app.use('/api', routes);
app.use((req, res) =>
  res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Route not found' } })
);
app.use(errorHandler);

// Socket.io on the same HTTP server (path '/').
initSocket(httpServer);

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    httpServer.listen(PORT, () =>
      console.log(`🚀 Sanchiva API + Socket.io on :${PORT}  [${process.env.NODE_ENV || 'development'}]`)
    );
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

['SIGINT', 'SIGTERM'].forEach((sig) =>
  process.on(sig, () => {
    console.log(`\n${sig} received, shutting down...`);
    httpServer.close(() => process.exit(0));
  })
);
