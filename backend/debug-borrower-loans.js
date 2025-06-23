const mongoose = require('mongoose');
const Loan = require('./src/models/loan.model');
const Borrower = require('./src/models/borrower.model');

async function debugBorrowerLoans() {
  try {
    await mongoose.connect('mongodb://localhost:27017/loan_app');
    console.log('Connected to database');
    
    // Find a borrower
    const borrower = await Borrower.findOne().limit(1);
    if (!borrower) {
      console.log('No borrower found');
      return;
    }
    
    console.log('Borrower ID:', borrower._id.toString());
    
    // Check what loans exist for this borrower
    const loans = await Loan.find({ borrower: borrower._id }).select('status loanDetails createdAt isDraft');
    
    console.log('\n=== LOAN DATA ANALYSIS ===');
    console.log('Total loans found:', loans.length);
    
    if (loans.length === 0) {
      console.log('No loans found for this borrower');
      return;
    }
    
    const statusCounts = {};
    loans.forEach((loan, index) => {
      const status = loan.status || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      console.log(`\nLoan ${index + 1}:`);
      console.log('  ID:', loan._id.toString());
      console.log('  Status:', status);
      console.log('  Amount:', loan.loanDetails?.loanAmount || 'N/A');
      console.log('  Created:', loan.createdAt);
      console.log('  isDraft:', loan.isDraft);
    });
    
    console.log('\n=== STATUS SUMMARY ===');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count}`);
    });
    
    // Test current analytics logic
    console.log('\n=== TESTING CURRENT ANALYTICS LOGIC ===');
    
    // Total loans (excluding drafts)
    const totalLoans = await Loan.countDocuments({
      borrower: borrower._id,
      status: { $ne: 'draft' }
    });
    console.log('Total loans (excluding drafts):', totalLoans);
    
    // Active loans (using current logic)
    const activeLoans = await Loan.countDocuments({
      borrower: borrower._id,
      status: { $in: ['Funded', 'Closed'] }
    });
    console.log('Active loans (Funded/Closed):', activeLoans);
    
    // Try new active loans logic
    const newActiveLoans = await Loan.countDocuments({
      borrower: borrower._id,
      status: { $in: ['Approved', 'Funded', 'Closed', 'Clear to Close'] }
    });
    console.log('NEW Active loans (Approved/Funded/Closed/Clear to Close):', newActiveLoans);
    
    // Pending applications (using current logic)
    const pendingApplications = await Loan.countDocuments({
      borrower: borrower._id,
      status: { $in: ['Application Submitted', 'Processing', 'Underwriting', 'Conditional Approval'] }
    });
    console.log('Pending applications (Application Submitted/Processing/Underwriting/Conditional Approval):', pendingApplications);
    
    // Try new pending applications logic
    const newPendingApplications = await Loan.countDocuments({
      borrower: borrower._id,
      status: { $in: ['Application Submitted', 'Processing', 'Underwriting', 'Conditional Approval', 'Pre-Qualification', 'Application Started', 'Pending'] }
    });
    console.log('NEW Pending applications (with additional statuses):', newPendingApplications);
    
    // Try a broader pending search
    const allPending = await Loan.countDocuments({
      borrower: borrower._id,
      status: { $regex: /submitted|pending|processing|review|approval/i }
    });
    console.log('All pending (regex search):', allPending);
    
    // Get total borrowed amount
    const borrowedAmount = await Loan.aggregate([
      { 
        $match: { 
          borrower: borrower._id,
          status: { $in: ['Funded', 'Closed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$loanDetails.loanAmount' }
        }
      }
    ]);
    
    console.log('Total borrowed amount:', borrowedAmount[0]?.totalAmount || 0);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugBorrowerLoans();
