/**
 * Test script for retrieving loan drafts with the new loan number format
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
    console.log('Starting test: Retrieving loan with numeric loan number as draft...');
    
    // 1. Find a loan with a numeric loan number
    const loans = await Loan.find({ loanNumber: { $regex: /^\d+$/ }, status: { $ne: 'deleted' } })
      .limit(5)
      .sort({ createdAt: -1 });
    
    if (loans.length === 0) {
      console.log('No loans found with numeric loan numbers');
      mongoose.disconnect();
      return;
    }
    
    console.log(`Found ${loans.length} loans with numeric loan numbers`);
    
    for (const loan of loans) {
      console.log('-------------------------------------------');
      console.log(`Testing loan: ${loan._id}, Number: ${loan.loanNumber}`);
      
      // 2. Find the borrower for this loan
      const borrower = await Borrower.findById(loan.borrower || loan.primaryBorrower);
      if (!borrower) {
        console.log('No borrower found for this loan, skipping...');
        continue;
      }
      
      // 3. Find the user associated with this borrower
      const user = await User.findById(borrower.user);
      if (!user) {
        console.log('No user found for this borrower, skipping...');
        continue;
      }
      
      console.log(`Associated user: ${user._id}, email: ${user.email}`);
      
      // 4. Simulate the draft finding logic by ID
      const draftViaId = await Loan.findOne({
        _id: loan._id.toString(),
        $or: [
          { borrower: borrower._id },
          { primaryBorrower: borrower._id }
        ],
        status: "draft",
        isDraft: true
      });
      
      console.log(`Draft retrieval via ID: ${draftViaId ? 'Found' : 'Not found'}`);
      
      // 5. Simulate the draft finding logic by loan number
      const draftViaNumber = await Loan.findOne({
        loanNumber: loan.loanNumber,
        $or: [
          { borrower: borrower._id }, 
          { primaryBorrower: borrower._id }
        ],
        status: "draft", 
        isDraft: true
      });
      
      console.log(`Draft retrieval via Number: ${draftViaNumber ? 'Found' : 'Not found'}`);
      
      // 6. Test actual loan retrieval by number
      const loanByNumber = await Loan.findOne({ loanNumber: loan.loanNumber });
      
      console.log(`Loan retrieval via Number: ${loanByNumber ? 'Found' : 'Not found'}`);
    }
    
    console.log('-------------------------------------------');
    console.log('Tests completed successfully!');
  } catch (error) {
    console.error('Error during tests:', error);
  } finally {
    mongoose.disconnect();
    console.log('Database disconnected');
  }
}
