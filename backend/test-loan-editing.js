/**
 * Test script for retrieving loans for editing with the updated endpoint
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Loan = require('./src/models/loan.model');
const Borrower = require('./src/models/borrower.model');
const User = require('./src/models/user.model');

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
    console.log('Starting test: Retrieving loans for editing with the updated endpoint...');
    
    // 1. Find a loan with a numeric loan number - specifically loan 20250618013
    const targetLoanNumber = '20250618013';
    const loan = await Loan.findOne({ loanNumber: targetLoanNumber });
    
    if (!loan) {
      console.log(`No loan found with loan number ${targetLoanNumber}`);
      mongoose.disconnect();
      return;
    }
    
    console.log(`Found loan with ID: ${loan._id}, Number: ${loan.loanNumber}, Status: ${loan.status}, isDraft: ${loan.isDraft}`);
    
    // 2. Find the borrower for this loan
    const borrower = await Borrower.findById(loan.borrower || loan.primaryBorrower);
    if (!borrower) {
      console.log('No borrower found for this loan, exiting...');
      mongoose.disconnect();
      return;
    }
    
    // 3. Find the user associated with this borrower
    const user = await User.findById(borrower.user);
    if (!user) {
      console.log('No user found for this borrower, exiting...');
      mongoose.disconnect();
      return;
    }
    
    console.log(`Associated user: ${user._id}, email: ${user.email}`);
    
    // 4. Using our updated query logic to find loans for editing
    const foundLoan = await Loan.findOne({
      loanNumber: targetLoanNumber,
      $or: [
        { borrower: borrower._id },
        { primaryBorrower: borrower._id }
      ]
    });
    
    console.log(`Loan found with updated logic: ${foundLoan ? 'YES' : 'NO'}`);
    if (foundLoan) {
      console.log(`  ID: ${foundLoan._id}`);
      console.log(`  Loan Number: ${foundLoan.loanNumber}`);
      console.log(`  Status: ${foundLoan.status}`);
      console.log(`  isDraft: ${foundLoan.isDraft}`);
      console.log(`  Create Date: ${foundLoan.createdAt}`);
    }
    
    console.log('-------------------------------------------');
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during tests:', error);
  } finally {
    mongoose.disconnect();
    console.log('Database disconnected');
  }
}
