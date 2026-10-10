process.env.PORT = '5099';
process.env.TEST_PORT = '5099';
process.env.AUTO_SEED = 'false';

const { connectDB } = require('./src/config/db');
const { seedDataInternal } = require('./src/seed/seed');

async function main() {
  try {
    console.log('[RUNNER] Connecting to persistent database for clean test run...');
    await connectDB();
    console.log('[RUNNER] Seeding turnkey database records...');
    await seedDataInternal();
    console.log('[RUNNER] Clean seed complete. Starting test server on port 5099...');

    // Boot current server on port 5099
    require('./src/server');

    setTimeout(() => {
      console.log('[RUNNER] Executing full integration test suite...');
      require('./test-e2e');
    }, 1500);
  } catch (err) {
    console.error('[RUNNER_FATAL]', err);
    process.exit(1);
  }
}

main();
