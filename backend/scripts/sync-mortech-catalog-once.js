#!/usr/bin/env node
require('dotenv').config();

const mongoose = require('mongoose');
const { connectDatabase } = require('../src/config/database');
const { syncMortechCatalog } = require('../src/services/mortechCatalog.service');
const { MortechProduct, MortechInvestor } = require('../src/models/mortechCatalog.model');

async function run() {
  try {
    console.log('[sync-mortech-catalog-once] Connecting to MongoDB...');
    await connectDatabase();

    console.log('[sync-mortech-catalog-once] Sync started...');
    const result = await syncMortechCatalog();

    const [investorCount, productCount] = await Promise.all([
      MortechInvestor.countDocuments({}),
      MortechProduct.countDocuments({}),
    ]);

    console.log(
      `[sync-mortech-catalog-once] Done. fetched investors=${result.investors}, fetched products=${result.products}`
    );
    console.log(
      `[sync-mortech-catalog-once] MongoDB now has investors=${investorCount}, products=${productCount}`
    );

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[sync-mortech-catalog-once] Failed:', error.message);
    try {
      await mongoose.connection.close();
    } catch (_) {
      // ignore close errors
    }
    process.exit(1);
  }
}

run();
