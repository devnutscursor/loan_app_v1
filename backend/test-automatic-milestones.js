const mongoose = require('mongoose');
require('dotenv').config();
const Milestone = require('./src/models/milestone.model');

async function testAutomaticMilestoneCreation() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    
    // Create a minimal loan via API
    console.log('Creating a new loan via API...');
    
    // Find a borrower and lender ID to use
    const Borrower = require('./src/models/borrower.model');
    const Lender = require('./src/models/lender.model');
    
    const borrowers = await Borrower.find().limit(1);
    const lenders = await Lender.find().limit(1);
    
    if (borrowers.length === 0 || lenders.length === 0) {
      console.log('Could not find borrower or lender in the database');
      return;
    }
    
    const borrowerId = borrowers[0]._id;
    const lenderId = lenders[0]._id;
    
    // Create a loan directly using the model and then use the utility function
    const Loan = require('./src/models/loan.model');
    const { createDefaultMilestonesForLoan } = require('./src/utils/defaultMilestones');
    
    const testLoan = new Loan({
      status: 'Application Submitted',
      borrower: borrowerId,
      lender: lenderId,
      purpose: "Home Purchase",
      property: {
        propertyValue: 400000
      },
      loanDetail: {
        loanType: "Purchase",
        requestedLoanAmount: 300000
      }
    });
    
    // Save the loan
    await testLoan.save();
    const createdLoanId = testLoan._id;
    
    console.log('Loan created successfully');
    console.log(`Loan ID: ${createdLoanId}`);
    console.log(`Loan Number: ${testLoan.loanNumber}`);
    
    // Manually create default milestones
    console.log('Creating default milestones...');
    await createDefaultMilestonesForLoan(createdLoanId);
    
    // Wait a moment to ensure milestones had time to be created
    console.log('Waiting for milestones to be created...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if milestones were automatically created
    const milestones = await Milestone.find({ loan: createdLoanId }).sort({ order: 1 });
    
    console.log(`\nFound ${milestones.length} milestones for the newly created loan:`);
    
    if (milestones.length === 0) {
      console.log('❌ No milestones were automatically created!');
    } else {
      console.log('✅ Milestones were automatically created!');
      
      milestones.forEach((milestone, index) => {
        console.log(`${index + 1}. ${milestone.name} (${milestone.status})`);
      });
      
      // Verify first milestone is in_progress
      const firstMilestone = milestones[0];
      console.log('\nValidations:');
      if (firstMilestone && firstMilestone.status === 'in_progress') {
        console.log('✅ First milestone is correctly set to in_progress');
      } else {
        console.log('❌ First milestone status is incorrect:', firstMilestone?.status);
      }
      
      // Verify all other milestones are pending
      const otherMilestones = milestones.slice(1);
      const allOthersPending = otherMilestones.every(m => m.status === 'pending');
      if (allOthersPending) {
        console.log('✅ All other milestones are correctly set to pending');
      } else {
        console.log('❌ Some milestones have incorrect status');
      }
    }
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the test
testAutomaticMilestoneCreation();
