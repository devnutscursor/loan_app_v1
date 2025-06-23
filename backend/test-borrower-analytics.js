const mongoose = require('mongoose');
require('dotenv').config();

// Alternative: Test via direct database access (simulating the controller logic)
async function testAnalyticsLogic() {
  try {
    console.log('=== Testing Analytics Logic Directly ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loan_app');
    
    const Loan = require('./src/models/loan.model');
    const Borrower = require('./src/models/borrower.model');
    const User = require('./src/models/user.model'); // Load User model to avoid schema error
    
    // Get a borrower ID for testing
    const borrower = await Borrower.findOne({}).populate('user');
    
    if (!borrower) {
      console.log('No borrowers found in database');
      return;
    }
    
    console.log(`Testing with borrower: ${borrower.user.firstName} ${borrower.user.lastName} (ID: ${borrower._id})`);
    
    // Simulate the analytics logic
    const borrowerFilter = { borrower: borrower._id };
    
    // Get all-time totals
    const allTimeStats = await Loan.aggregate([
      { $match: { ...borrowerFilter, status: { $ne: 'draft' } } },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          activeLoans: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Funded', 'Closed']] },
                1,
                0
              ]
            }
          },
          pendingApplications: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Application Submitted', 'Processing', 'Underwriting', 'Conditional Approval']] },
                1,
                0
              ]
            }
          },
          totalBorrowed: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Funded', 'Closed']] },
                '$loanDetails.loanAmount',
                0
              ]
            }
          }
        }
      }
    ]);
    
    const stats = allTimeStats[0] || {
      totalLoans: 0,
      activeLoans: 0,
      pendingApplications: 0,
      totalBorrowed: 0
    };
    
    console.log('\n=== Analytics Results ===');
    console.log(`Total Loans: ${stats.totalLoans}`);
    console.log(`Active Loans: ${stats.activeLoans}`);
    console.log(`Pending Applications: ${stats.pendingApplications}`);
    console.log(`Total Borrowed: $${stats.totalBorrowed?.toLocaleString() || 0}`);
    
    // Also check what loans exist for this borrower
    console.log('\n=== Borrower Loans ===');
    const loans = await Loan.find(borrowerFilter).select('status loanDetails.loanAmount createdAt').limit(5);
    loans.forEach((loan, index) => {
      console.log(`${index + 1}. Status: ${loan.status}, Amount: $${loan.loanDetails?.loanAmount?.toLocaleString() || 'N/A'}, Created: ${loan.createdAt.toLocaleDateString()}`);
    });
    
    mongoose.disconnect();
    
  } catch (error) {
    console.error('Error testing analytics logic:', error);
    mongoose.disconnect();
  }
}

// Run the test
testAnalyticsLogic();
