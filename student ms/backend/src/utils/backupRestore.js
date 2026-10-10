/**
 * Safe MongoDB Backup & Restore Utility
 * Usage:
 *   node src/utils/backupRestore.js backup
 *   node src/utils/backupRestore.js restore <timestamp-folder>
 */
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { connectDB, disconnectDB } = require('../config/db');

// List of all system models
const models = [
  'User',
  'Student',
  'Room',
  'Bed',
  'Fee',
  'Payment',
  'Attendance',
  'LeaveRequest',
  'Visitor',
  'Complaint',
  'Staff',
  'Salary',
  'Expense',
  'Inventory',
  'Announcement',
  'Notification',
  'ActivityLog',
  'Setting',
  'Admission',
  'CheckInOut',
];

const backupDir = path.join(__dirname, '../../backups');

const runBackup = async () => {
  await connectDB();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetDir = path.join(backupDir, timestamp);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`[BACKUP] 📦 Starting backup to: ${targetDir}`);
  const summary = {};

  for (const modelName of models) {
    try {
      const Model = require(`../models/${modelName}`);
      const records = await Model.find().lean();
      fs.writeFileSync(path.join(targetDir, `${modelName}.json`), JSON.stringify(records, null, 2));
      summary[modelName] = records.length;
      console.log(`[BACKUP] ✅ ${modelName}: exported ${records.length} records`);
    } catch (e) {
      console.warn(`[BACKUP] ⚠️ Failed to export ${modelName}: ${e.message}`);
    }
  }

  fs.writeFileSync(path.join(targetDir, 'metadata.json'), JSON.stringify({ timestamp: new Date().toISOString(), summary }, null, 2));
  console.log('[BACKUP] 🎉 Backup successfully completed!');
  await disconnectDB();
};

const runRestore = async (folderName) => {
  if (!folderName) {
    console.error('[RESTORE] ❌ Please provide the backup directory name. Example: node src/utils/backupRestore.js restore 2026-10-10T00-00-00');
    process.exit(1);
  }

  const targetDir = path.join(backupDir, folderName);
  if (!fs.existsSync(targetDir)) {
    console.error(`[RESTORE] ❌ Backup folder not found: ${targetDir}`);
    process.exit(1);
  }

  await connectDB();
  console.log(`[RESTORE] 📥 Restoring data from: ${targetDir}`);

  for (const modelName of models) {
    const filePath = path.join(targetDir, `${modelName}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const Model = require(`../models/${modelName}`);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(data) && data.length > 0) {
          // Safe upsert or insert without destructive wipe
          for (const item of data) {
            await Model.findByIdAndUpdate(item._id, item, { upsert: true, setDefaultsOnInsert: true });
          }
          console.log(`[RESTORE] ✅ ${modelName}: restored ${data.length} records`);
        }
      } catch (e) {
        console.warn(`[RESTORE] ⚠️ Failed to restore ${modelName}: ${e.message}`);
      }
    }
  }

  console.log('[RESTORE] 🎉 Restore completed safely.');
  await disconnectDB();
};

const main = async () => {
  const [action, target] = process.argv.slice(2);
  if (action === 'backup') {
    await runBackup();
  } else if (action === 'restore') {
    await runRestore(target);
  } else {
    console.log('Usage: node src/utils/backupRestore.js [backup|restore] [folderName]');
  }
};

if (require.main === module) {
  main().catch((err) => {
    console.error('[BACKUP/RESTORE_ERR]', err);
    process.exit(1);
  });
}

module.exports = { runBackup, runRestore };
