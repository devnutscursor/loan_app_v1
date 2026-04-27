/* eslint-disable no-console */
/**
 * One-time index sync helper.
 *
 * Why: Older versions had a UNIQUE index on (companyId, ghlContactId) which prevents
 * mapping the same GHL contact to multiple Borrower records (e.g. borrower applies
 * to multiple loan officers in the same company).
 *
 * Run:
 *   node src/scripts/syncGhlContactMapIndexes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const GhlContactMap = require('../models/ghlContactMap.model');

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Missing MONGODB_URI (or MONGO_URI) in environment');

  await mongoose.connect(uri);
  console.log('Connected. Syncing GhlContactMap indexes...');

  // Drops indexes that no longer match schema and creates missing ones.
  const res = await GhlContactMap.syncIndexes();
  console.log('syncIndexes result:', res);

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

