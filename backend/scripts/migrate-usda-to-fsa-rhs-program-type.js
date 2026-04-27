/**
 * One-time migration: loan program type `usda` → `fsa_rhs` (FSA/RHS-Guaranteed).
 * Run from backend folder: node scripts/migrate-usda-to-fsa-rhs-program-type.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('Set MONGODB_URI (or MONGO_URI) in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const loanPrograms = await db.collection('loanprograms').updateMany(
    { programType: 'usda' },
    { $set: { programType: 'fsa_rhs' } }
  );
  const loanRates = await db.collection('loanrates').updateMany(
    { programType: 'usda' },
    { $set: { programType: 'fsa_rhs' } }
  );

  console.log('LoanProgram matched:', loanPrograms.matchedCount, 'modified:', loanPrograms.modifiedCount);
  console.log('LoanRate matched:', loanRates.matchedCount, 'modified:', loanRates.modifiedCount);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
