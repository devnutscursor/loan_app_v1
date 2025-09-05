#!/usr/bin/env node

/**
 * Script to check and verify database indexes for performance optimization
 * Run with: node scripts/check-indexes.js
 */

const mongoose = require('mongoose');

async function checkIndexes() {
  try {
    // Connect to database using the same method as the app
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/loan-app-system';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get collections
    const db = mongoose.connection.db;
    
    // Check Lender collection indexes
    console.log('\n=== Lender Collection Indexes ===');
    const lenderIndexes = await db.collection('lenders').indexes();
    console.log('Lender indexes:');
    lenderIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Check Borrower collection indexes
    console.log('\n=== Borrower Collection Indexes ===');
    const borrowerIndexes = await db.collection('borrowers').indexes();
    console.log('Borrower indexes:');
    borrowerIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Check Loan collection indexes
    console.log('\n=== Loan Collection Indexes ===');
    const loanIndexes = await db.collection('loans').indexes();
    console.log('Loan indexes:');
    loanIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Verify required indexes exist
    console.log('\n=== Index Verification ===');
    
    const requiredIndexes = {
      lenders: [
        { name: 'company_1', key: { company: 1 } },
        { name: 'user_1', key: { user: 1 } },
        { name: 'company_1_isActive_1', key: { company: 1, isActive: 1 } }
      ],
      borrowers: [
        { name: 'lender_1', key: { lender: 1 } },
        { name: 'user_1', key: { user: 1 } },
        { name: 'lender_1_isActive_1', key: { lender: 1, isActive: 1 } }
      ],
      loans: [
        { name: 'lender_1', key: { lender: 1 } },
        { name: 'borrower_1', key: { borrower: 1 } },
        { name: 'lender_1_status_1', key: { lender: 1, status: 1 } },
        { name: 'status_1', key: { status: 1 } },
        { name: 'createdAt_-1', key: { createdAt: -1 } }
      ]
    };

    // Check each collection
    for (const [collectionName, requiredIndexList] of Object.entries(requiredIndexes)) {
      console.log(`\nChecking ${collectionName} collection:`);
      const existingIndexes = await db.collection(collectionName).indexes();
      
      for (const requiredIndex of requiredIndexList) {
        const exists = existingIndexes.some(index => 
          JSON.stringify(index.key) === JSON.stringify(requiredIndex.key)
        );
        
        if (exists) {
          console.log(`  ✅ ${requiredIndex.name}: EXISTS`);
        } else {
          console.log(`  ❌ ${requiredIndex.name}: MISSING`);
        }
      }
    }

    // Performance test queries
    console.log('\n=== Performance Test Queries ===');
    
    // Test company lenders query
    const testStart = Date.now();
    const testLenders = await db.collection('lenders').find({ company: { $exists: true } }).limit(1).toArray();
    const testDuration = Date.now() - testStart;
    console.log(`Company lenders query test: ${testDuration}ms`);

    // Test borrower count query
    const borrowerTestStart = Date.now();
    const testBorrowers = await db.collection('borrowers').find({ lender: { $exists: true } }).limit(1).toArray();
    const borrowerTestDuration = Date.now() - borrowerTestStart;
    console.log(`Borrower count query test: ${borrowerTestDuration}ms`);

    // Test loan aggregation query
    const loanTestStart = Date.now();
    const testLoans = await db.collection('loans').aggregate([
      { $match: { lender: { $exists: true } } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]).toArray();
    const loanTestDuration = Date.now() - loanTestStart;
    console.log(`Loan aggregation query test: ${loanTestDuration}ms`);

    console.log('\n✅ Index check completed successfully');
    
  } catch (error) {
    console.error('Error checking indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the check
checkIndexes();
