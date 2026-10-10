const mongoose = require('mongoose');
const dns = require('dns');

let mongodInstance = null;

// Configure reliable DNS servers for SRV resolution when using Atlas (prevents querySrv ECONNREFUSED on local/restricted ISPs)
const setupDnsServers = () => {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  } catch (err) {
    console.warn(`[DB] Warning: Could not override DNS servers: ${err.message}`);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hostel_db';
  const isSrv = uri.startsWith('mongodb+srv://');
  
  if (isSrv) {
    setupDnsServers();
  }

  const connectOptions = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  };

  try {
    const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log(`[DB] 🔌 Attempting connection to persistent MongoDB (${maskedUri})...`);
    
    await mongoose.connect(uri, connectOptions);
    console.log(`[DB] ✅ MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    const isDnsError = err.message && (err.message.includes('querySrv') || err.message.includes('ECONNREFUSED'));
    
    if (isDnsError && isSrv) {
      console.warn(`[DB] ⚠️ DNS SRV query failed (${err.message}). Retrying with explicit Google & Cloudflare DNS...`);
      try {
        setupDnsServers();
        await mongoose.connect(uri, connectOptions);
        console.log(`[DB] ✅ MongoDB connected successfully on DNS retry to ${mongoose.connection.host}/${mongoose.connection.name}`);
        return;
      } catch (retryErr) {
        console.error(`[DB] ❌ Secondary Atlas connection attempt failed: ${retryErr.message}`);
      }
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const allowInMemory = process.env.ALLOW_IN_MEMORY_DB === 'true';

    // Strictly forbid in-memory database in production
    if (!isProduction && allowInMemory) {
      console.warn('[DB] =========================================================================');
      console.warn('[DB] ⚠️ EXPLICIT OVERRIDE: ALLOW_IN_MEMORY_DB is set to "true" in non-production.');
      console.warn('[DB] Starting temporary in-memory MongoDB instance for local testing/development.');
      console.warn('[DB] ⚠️ CAUTION: Records created in this session are EPHEMERAL and NOT persistent!');
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
      console.error(`[DB] Error: ${err.message}`);
      console.error('[DB] 📋 TROUBLESHOOTING & RESOLUTION STEPS:');
      console.error('[DB]   1. For MongoDB Atlas (mongodb+srv://...):');
      console.error('[DB]      - Ensure Network Access / IP Whitelist includes 0.0.0.0/0 (or your server IP).');
      console.error('[DB]      - Verify database username and password in MONGODB_URI.');
      console.error('[DB]      - If your ISP blocks SRV records, switch to the standard 3-shard seed list URI:');
      console.error('[DB]        mongodb://<user>:<password>@host1:27017,host2:27017,host3:27017/hostel_db?ssl=true&replicaSet=...&authSource=admin');
      console.error('[DB]   2. For Local MongoDB:');
      console.error('[DB]      - Ensure MongoDB service is running (net start MongoDB or mongod).');
      console.error('[DB]   3. For CI/Testing without MongoDB:');
      console.error('[DB]      - Set ALLOW_IN_MEMORY_DB=true ONLY when NODE_ENV is NOT production.');
      console.error('[DB] =========================================================================');
      throw new Error(`Persistent database connection failed: ${err.message}.`);
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

