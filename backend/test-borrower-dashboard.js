// Simple test to diagnose borrower dashboard data
require('dotenv').config();
const mongoose = require('mongoose');
const Borrower = require('./src/models/borrower.model');
const Loan = require('./src/models/loan.model');
const Lender = require('./src/models/lender.model');
const User = require('./src/models/user.model');

// Connect to database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

async function getBorrowerDashboardData(borrowerId) {
  try {
    // Get borrower profile
    const borrower = await Borrower.findById(borrowerId);
    
    if (!borrower) {
      console.error('Borrower profile not found');
      return;
    }

    console.log(`Found borrower: ${borrower._id} (linked to user ${borrower.user})`);
    
    // Query filter for current borrower
    const borrowerFilter = { borrower: borrower._id };
    
    // Total loans (excluding drafts)
    const totalLoans = await Loan.countDocuments({
      ...borrowerFilter,
      status: { $ne: 'draft' }
    });
    
    // Active loans with proper statuses
    const activeLoans = await Loan.countDocuments({
      ...borrowerFilter,
      status: { $in: ['Approved', 'Funded', 'Closed', 'Clear to Close'] }
    });
    
    // Pending applications with appropriate statuses
    const pendingApplications = await Loan.countDocuments({
      ...borrowerFilter,
      status: { $in: ['Application Submitted', 'Processing', 'Underwriting', 'Conditional Approval', 'Pre-Qualification', 'Application Started', 'Pending'] }
    });
    
    // Calculate total borrowed amount
    const borrowedAmountResult = await Loan.aggregate([
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
    
    const totalAmount = borrowedAmountResult[0]?.totalAmount || 0;

    // Get recent loans
    const recentLoans = await Loan.find(borrowerFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate([
        { path: 'lender', select: 'name companyName email' },
        { path: 'assignedLoanOfficer', select: 'firstName lastName email' }
      ]);
      
    // Calculate percentage changes (mock data for now, could be implemented with historical data)
    const percentChanges = {
      loans: 0,
      applications: 0,
      amount: 0
    };
    
    // Format the dashboard data in the structure expected by the frontend
    const dashboardData = {
      totalLoans,
      activeLoans,
      pendingApplications,
      totalAmount,
      percentChanges,
      recentLoans,
      profileCompletion: {
        personalInfo: borrower.user ? 100 : 0,
        financialInfo: borrower.financialInfo ? 100 : 0,
        employmentInfo: borrower.employment ? 100 : 0,
        documents: 0 
      },
      paymentSummary: {
        totalPaid: 0,
        upcomingPayment: 0,
        nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    };

    console.log('\n===== BORROWER DASHBOARD DATA =====');
    console.log(JSON.stringify(dashboardData, null, 2));

    console.log('\n===== BORROWER DASHBOARD STATISTICS =====');
    console.log(`Total Loans: ${totalLoans}`);
    console.log(`Active Loans: ${activeLoans}`);
    console.log(`Pending Applications: ${pendingApplications}`);
    console.log(`Total Borrowed Amount: $${totalAmount.toLocaleString()}`);
    
    console.log('\n===== RECENT LOANS =====');
    console.log(`Found ${recentLoans.length} recent loans`);
    
    recentLoans.forEach((loan, index) => {
      console.log(`\nLoan ${index + 1}:`);
      console.log(`- ID: ${loan._id}`);
      console.log(`- Status: ${loan.status}`);
      console.log(`- Loan Amount: $${(loan.loanDetails?.loanAmount || 0).toLocaleString()}`);
      console.log(`- Created: ${loan.createdAt}`);
      console.log(`- Last Updated: ${loan.updatedAt}`);
    });

    // Print loan status counts
    console.log('\n===== LOAN STATUS BREAKDOWN =====');
    
    const statusCounts = await Loan.aggregate([
      { $match: borrowerFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    statusCounts.forEach(status => {
      console.log(`${status._id || 'undefined'}: ${status.count}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Get borrower ID from command line
const borrowerId = process.argv[2];

if (!borrowerId) {
  console.error('Please provide a borrower ID as a command line argument');
  process.exit(1);
}

getBorrowerDashboardData(borrowerId);
