const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hostel_db';
  
  try {
    console.log(`[DB] Attempting connection to configured MongoDB (${uri})...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[DB] ✅ MongoDB connected successfully to ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
  } catch (err) {
    console.error(`[DB] ❌ Could not connect to configured MongoDB (${uri}): ${err.message}`);
    
    // Explicit environment flag check - never silent!
    if (process.env.ALLOW_IN_MEMORY_DB === 'true' && process.env.NODE_ENV !== 'production') {
      console.warn('[DB] =========================================================================');
      console.warn('[DB] ⚠️ EXPLICIT OVERRIDE: ALLOW_IN_MEMORY_DB is set to "true".');
      console.warn('[DB] Starting temporary in-memory MongoDB instance for local testing.');
      console.warn('[DB] ⚠️ CAUTION: Records created in this session are EPHEMERAL and NOT persistent!');
      console.warn('[DB] To persist records: start MongoDB service or set MONGODB_URI in backend/.env');
      console.warn('[DB] =========================================================================');
      
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memoryUri = mongodInstance.getUri();
        await mongoose.connect(memoryUri);
        console.log('[DB] ✅ In-memory development database connected.');
      } catch (memErr) {
        console.error('[DB] ❌ Failed to start embedded MongoDB Memory Server:', memErr.message);
        throw memErr;
      }
    } else {
      console.error('[DB] =========================================================================');
      console.error('[DB] 🛑 FATAL: Persistent MongoDB is unavailable and in-memory fallback is disabled.');
      console.error('[DB] 📋 REQUIRED CONFIGURATION:');
      console.error('[DB]   1. Ensure MongoDB service is running locally on 127.0.0.1:27017');
      console.error('[DB]      (e.g., net start MongoDB or mongod --dbpath <data_dir>)');
      console.error('[DB]   2. OR configure MongoDB Atlas URI in backend/.env:');
      console.error('[DB]      MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hostel_db');
      console.error('[DB]   3. OR if running local tests without installed MongoDB, explicitly enable:');
      console.error('[DB]      ALLOW_IN_MEMORY_DB=true in backend/.env');
      console.error('[DB] =========================================================================');
      throw new Error(`MongoDB connection failed (${uri}): ${err.message}. Configure MONGODB_URI or start MongoDB service.`);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
