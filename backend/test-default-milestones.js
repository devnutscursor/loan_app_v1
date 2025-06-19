const mongoose = require('mongoose');
require('dotenv').config();
const { createDefaultMilestonesForLoan } = require('./src/utils/defaultMilestones');
const Milestone = require('./src/models/milestone.model');

async function testDefaultMilestones() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    
    // Find a recent loan to test with
    const Loan = require('./src/models/loan.model');
    const loans = await Loan.find().sort({ createdAt: -1 }).limit(1);
    
    if (loans.length === 0) {
      console.log('No loans found in the database');
      return;
    }
    
    const loan = loans[0];
    console.log(`Testing with existing loan: ${loan._id} (${loan.loanNumber})`);
    
    // Check for existing milestones and remove them
    const existingMilestones = await Milestone.find({ loan: loan._id });
    if (existingMilestones.length > 0) {
      console.log(`Found ${existingMilestones.length} existing milestones, removing them first...`);
      await Milestone.deleteMany({ loan: loan._id });
      console.log('Existing milestones removed');
    }
    
    // Create default milestones
    console.log('Creating default milestones...');
    await createDefaultMilestonesForLoan(loan._id);
    
    // Verify the created milestones
    const milestones = await Milestone.find({ loan: loan._id }).sort({ order: 1 });
    console.log(`\nCreated ${milestones.length} milestones for loan ${loan._id}:`);
    
    milestones.forEach((milestone, index) => {
      console.log(`${index + 1}. ${milestone.name} (${milestone.status})`);
      console.log(`   Deadline: ${milestone.deadlineDate.toISOString().split('T')[0]}`);
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
    
    // Verify all deadlines are set to 1 week from now
    const today = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    const allDeadlinesCorrect = milestones.every(m => {
      const deadlineTime = new Date(m.deadlineDate).getTime();
      const nowTime = today.getTime();
      const diff = Math.abs(deadlineTime - (nowTime + oneWeek));
      
      // Allow for a 12-hour difference due to timezone conversions and test execution timing
      return diff <= (12 * 60 * 60 * 1000);
    });
    
    if (allDeadlinesCorrect) {
      console.log('✅ All milestones have deadline set to approximately one week from now');
    } else {
      console.log('❌ Some milestones have incorrect deadlines');
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
testDefaultMilestones();
