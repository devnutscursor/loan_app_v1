/**
 * MCR Backfill Migration Script
 * 
 * Run this ONCE after deploying the MCR schema changes to populate:
 * 1. LoanStatusHistory — one entry per existing loan using current status + createdAt
 * 2. LoanCompensation — one empty record per existing loan
 * 
 * Usage: node backend/scripts/mcr-backfill.js
 * 
 * Safe to run multiple times — uses upsert/findOneAndUpdate to avoid duplicates.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/database');

// Import models
const Loan = require('../src/models/loan.model');
const LoanStatusHistory = require('../src/models/loanStatusHistory.model');
const LoanCompensation = require('../src/models/loanCompensation.model');

async function backfill() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Get all existing loans
    const loans = await Loan.find({}).select('_id status createdAt assignedLoanOfficer').lean();
    console.log(`Found ${loans.length} existing loans to backfill`);

    let statusCreated = 0;
    let compCreated = 0;
    let skippedStatus = 0;
    let skippedComp = 0;

    for (const loan of loans) {
      // 1. Create initial LoanStatusHistory entry if none exists
      const existingHistory = await LoanStatusHistory.findOne({ loan: loan._id });
      if (!existingHistory) {
        await LoanStatusHistory.create({
          loan: loan._id,
          previousStatus: null,
          newStatus: loan.status || 'Application Started',
          changedBy: loan.assignedLoanOfficer || null,
          changeReason: 'Backfill — initial status from existing loan',
          createdAt: loan.createdAt
        });
        statusCreated++;
      } else {
        skippedStatus++;
      }

      // 2. Create LoanCompensation record if none exists
      const existingComp = await LoanCompensation.findOne({ loan: loan._id });
      if (!existingComp) {
        await LoanCompensation.create({ loan: loan._id });
        compCreated++;
      } else {
        skippedComp++;
      }
    }

    console.log('\n=== Backfill Complete ===');
    console.log(`LoanStatusHistory: ${statusCreated} created, ${skippedStatus} already existed`);
    console.log(`LoanCompensation: ${compCreated} created, ${skippedComp} already existed`);
    console.log(`Total loans processed: ${loans.length}`);

    await mongoose.disconnect();
    console.log('Disconnected from database');
    process.exit(0);
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  }
}

backfill();
