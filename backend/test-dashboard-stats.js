const Borrower = require('./src/models/borrower.model');
const User = require('./src/models/user.model');
const Loan = require('./src/models/loan.model');
const mongoose = require('mongoose');

// Simple test to diagnose borrower dashboard data
async function testDashboard() {
  try {
    await mongoose.connect('mongodb://localhost:27017/loan_app');
    console.log('Connected to database');
    
    // Find a borrower
    const borrower = await Borrower.findOne().limit(1);
    if (!borrower) {
      console.log('No borrower found');
      return;
    }
    
    console.log('Testing with borrower ID:', borrower._id.toString());
    
    // Define filter
    const borrowerFilter = { borrower: borrower._id };
    
    // Get loans with status counts
    const loans = await Loan.find(borrowerFilter).select('status loanDetails.loanAmount');
    const statusCounts = {};
    
    loans.forEach(loan => {
      const status = loan.status || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log(`Total loans for borrower: ${loans.length}`);
    console.log('Status counts:', statusCounts);
    
    // Test the queries for dashboard stats
    const totalLoans = await Loan.countDocuments({
      ...borrowerFilter,
      status: { $ne: 'draft' }
    });
    
    const activeLoans = await Loan.countDocuments({
      ...borrowerFilter,
      status: { $in: ['Approved', 'Funded', 'Closed', 'Clear to Close'] }
    });
    
    const pendingApplications = await Loan.countDocuments({
      ...borrowerFilter,
      status: { $in: ['Application Submitted', 'Processing', 'Underwriting', 'Conditional Approval', 'Pre-Qualification', 'Application Started', 'Pending'] }
    });
    
    const borrowedAmount = await Loan.aggregate([
      { 
        $match: { 
          ...borrowerFilter,
          status: { $in: ['Approved', 'Funded', 'Closed', 'Clear to Close'] }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $ifNull: ['$loanDetails.loanAmount', 0] } }
        }
      }
    ]);
    
    console.log('\nDashboard Stats:');
    console.log('Total Loans:', totalLoans);
    console.log('Active Loans:', activeLoans);
    console.log('Pending Applications:', pendingApplications);
    console.log('Total Borrowed:', borrowedAmount[0]?.totalAmount || 0);
    
    // Check for amount values
    console.log('\nChecking loan amounts:');
    loans.forEach((loan, i) => {
      console.log(`Loan ${i+1} (${loan.status}): Amount = ${loan.loanDetails?.loanAmount || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testDashboard();
