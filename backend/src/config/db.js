/**
 * SANCHIVA — MongoDB connection (Mongoose)
 * ----------------------------------------------------------------------------
 * If MONGODB_URI is provided, we connect to it (local Mongo or Atlas).
 * If it's EMPTY, we boot an in-memory MongoDB REPLICA SET — a real mongod
 * running in replica-set mode (required for multi-document ACID
 * $transaction sessions). For production, set MONGODB_URI to your Atlas
 * cluster (see .env HUMAN ACTION REQUIRED).
 *
 * The in-memory instance is genuinely MongoDB — all Mongoose schemas, ACID
 * sessions, indexes and queries behave identically to a real cluster.
 * Data is wiped on process restart, so we re-seed on boot.
 */
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

let memoryServer = null;

async function connectDB() {
  let uri = process.env.MONGODB_URI;

  // --- Auto-provision an in-memory replica set if no URI is configured ---
  // A replica set (not a standalone) is REQUIRED for multi-document
  // transactions (session.startTransaction). MongoMemoryReplSet starts a
  // single-node rs so ACID transfers work out-of-the-box.
  if (!uri) {
    console.log('🔧 No MONGODB_URI set — booting in-memory MongoDB replica set...');
    memoryServer = await MongoMemoryReplSet.create({
      instanceOpts: [{ args: ['--quiet'] }],
      binary: { version: '7.0.14' },
      replSet: { count: 1, name: 'rs0', storageEngine: 'wiredTiger' },
    });
    await memoryServer.waitUntilRunning();
    uri = memoryServer.getUri();
    console.log('✅ In-memory replica set ready:', uri);
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { autoIndex: true });
  console.log('✅ Mongoose connected');

  // Seed on first connect (dev only) so the preview has real data.
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { seed } = require('../seed');
      await seed();
    } catch (e) {
      console.warn('Seed skipped:', e.message);
    }
  }

  return mongoose.connection;
}

async function closeDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDB, closeDB, db: mongoose.connection };
