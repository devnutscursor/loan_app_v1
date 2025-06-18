const mongoose = require('mongoose');
require('dotenv').config();
const Loan = require('./src/models/loan.model');
const Milestone = require('./src/models/milestone.model');
const { createDefaultMilestonesForLoan } = require('./src/utils/defaultMilestones');

async function testMilestoneCreation() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Create a test loan
    console.log('Creating test loan...');
    const testLoan = new Loan({
      status: 'Application Submitted',
      borrower: '64a087dc4edd0a0c9b96bc0e', // Replace with a valid borrower ID
      lender: '64a087dc4edd0a0c9b96bc0f',   // Replace with a valid lender ID
      loanDetail: {
        loanType: 'Purchase',
        requestedLoanAmount: 300000
      },
      property: {
        propertyValue: 400000
      }
    });

    // Save the loan
    await testLoan.save();
    console.log(`Test loan created with ID: ${testLoan._id}`);
    console.log(`Loan number: ${testLoan.loanNumber}`);

    // Create default milestones for the loan
    console.log('Creating default milestones...');
    await createDefaultMilestonesForLoan(testLoan._id);

    // Fetch the milestones for this loan
    console.log('Fetching milestones...');
    const milestones = await Milestone.find({ loan: testLoan._id }).sort({ order: 1 });

    // Display the milestones
    console.log(`Found ${milestones.length} milestones for loan ${testLoan._id}:`);
    milestones.forEach((milestone, index) => {
      console.log(`${index + 1}. ${milestone.name} - Status: ${milestone.status}`);
      console.log(`   Deadline: ${milestone.deadlineDate}`);
    });

    // Verify the first milestone is in_progress and others are pending
    const firstMilestone = milestones[0];
    if (firstMilestone && firstMilestone.status === 'in_progress') {
      console.log('✓ First milestone is correctly set to in_progress');
    } else {
      console.log('❌ First milestone status is incorrect:', firstMilestone?.status);
    }

    const otherMilestones = milestones.slice(1);
    const allOthersPending = otherMilestones.every(m => m.status === 'pending');
    if (allOthersPending) {
      console.log('✓ All other milestones are correctly set to pending');
    } else {
      console.log('❌ Some milestones have incorrect status');
    }

    // Verify deadline dates
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    const today = new Date();

    const allDeadlinesSet = milestones.every(m => {
      const deadlineDate = new Date(m.deadlineDate);
      // Allow ±1 day difference due to timezone and test execution timing
      const diffDays = Math.abs(Math.round((deadlineDate - oneWeekFromNow) / (24 * 60 * 60 * 1000)));
      return diffDays <= 1;
    });

    if (allDeadlinesSet) {
      console.log('✓ All milestones have deadline date set to approximately one week from now');
    } else {
      console.log('❌ Some milestones have incorrect deadline dates');
    }

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testMilestoneCreation();
