/* eslint-disable no-console */
/**
 * One-time index sync helper.
 *
 * Why: Older versions had a UNIQUE index on (companyId, ghlOpportunityId) which can
 * block mapping multiple app loans to the same GHL opportunity (some locations
 * enforce 1 opportunity per contact).
 *
 * Run:
 *   node src/scripts/syncGhlOpportunityMapIndexes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const GhlOpportunityMap = require('../models/ghlOpportunityMap.model');

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('Missing MONGODB_URI (or MONGO_URI) in environment');

  await mongoose.connect(uri);
  console.log('Connected. Syncing GhlOpportunityMap indexes...');

  const res = await GhlOpportunityMap.syncIndexes();
  console.log('syncIndexes result:', res);

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

