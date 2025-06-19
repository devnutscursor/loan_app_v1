/**
 * Test script to verify the isVerified and isLiquid fields are working correctly for assets
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Loan = require('./src/models/loan.model');

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully!');
    runTests();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function runTests() {
  try {
    console.log('Starting test: Checking asset fields in loan model...');
    
    // Find an existing loan to update
    const testLoanId = '20250618013'; // Loan number from the URL
    const existingLoan = await Loan.findOne({ loanNumber: testLoanId });
    
    if (!existingLoan) {
      console.error(`No loan found with loan number: ${testLoanId}`);
      return;
    }
    
    console.log('Found existing loan to update:', existingLoan._id);
    
    // Create test asset data
    const testAssets = {
      checkingAndSavings: [
        {
          bankName: 'Test Bank',
          accountType: 'Checking',
          value: 5000,
          isVerified: true,
          isLiquid: true
        },
        {
          bankName: 'Another Bank',
          accountType: 'Savings',
          value: 10000,
          isVerified: false, 
          isLiquid: true
        }
      ],
      stocksAndBonds: [
        {
          description: 'AAPL Stock',
          value: 15000,
          isVerified: true,
          isLiquid: false
        }
      ],
      giftsAndGrants: [
        {
          assetType: 'Cash Gift',
          source: 'Relative',
          value: 20000,
          deposited: true,
          isVerified: true,
          isLiquid: true
        }
      ]
    };
    
    // Update the loan with our test assets
    existingLoan.assets = testAssets;
    await existingLoan.save();
    console.log('Updated loan with test assets');
    
    // Retrieve the loan to confirm the fields were saved
    const savedLoan = await Loan.findOne({ loanNumber: testLoanId });
    
    console.log('Retrieved loan - checking fields:');
    
    // Check checkingAndSavings
    console.log('\nChecking & Savings Accounts:');
    savedLoan.assets.checkingAndSavings.forEach((account, idx) => {
      console.log(`Account ${idx + 1}: ${account.bankName}`);
      console.log(`  Value: $${account.value}`);
      console.log(`  Type: ${account.accountType}`);
      console.log(`  isVerified: ${account.isVerified !== undefined ? account.isVerified : 'undefined'}`);
      console.log(`  isLiquid: ${account.isLiquid !== undefined ? account.isLiquid : 'undefined'}`);
    });
    
    // Check stocks and bonds
    console.log('\nStocks & Bonds:');
    savedLoan.assets.stocksAndBonds.forEach((stock, idx) => {
      console.log(`Stock/Bond ${idx + 1}: ${stock.description}`);
      console.log(`  Value: $${stock.value}`);
      console.log(`  isVerified: ${stock.isVerified !== undefined ? stock.isVerified : 'undefined'}`);
      console.log(`  isLiquid: ${stock.isLiquid !== undefined ? stock.isLiquid : 'undefined'}`);
    });
    
    // Check gifts and grants
    console.log('\nGifts & Grants:');
    savedLoan.assets.giftsAndGrants.forEach((gift, idx) => {
      console.log(`Gift/Grant ${idx + 1}: ${gift.assetType} from ${gift.source}`);
      console.log(`  Value: $${gift.value}`);
      console.log(`  Deposited: ${gift.deposited}`);
      console.log(`  isVerified: ${gift.isVerified !== undefined ? gift.isVerified : 'undefined'}`);
      console.log(`  isLiquid: ${gift.isLiquid !== undefined ? gift.isLiquid : 'undefined'}`);
    });
    console.log('\nTest completed successfully.');
    
  } catch (error) {
    console.error('Error during tests:', error);
  } finally {
    mongoose.disconnect();
    console.log('Database disconnected');
  }
}
