/**
 * Test script to create default milestones for an existing loan
 * 
 * This can be used to add default milestones to loans that were created
 * before the automatic milestone feature was implemented.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDatabase } = require('./src/config/database');
const Milestone = require('./src/models/milestone.model');
const Loan = require('./src/models/loan.model');
const { createDefaultMilestonesForLoan } = require('./src/utils/defaultMilestones');

// Command line arguments
const loanId = process.argv[2];

if (!loanId) {
  console.error('Please provide a loan ID as an argument');
  console.log('Usage: node create-default-milestones.js [loanId]');
  process.exit(1);
}

const run = async () => {
  try {
    await connectDatabase();
    
    // Verify the loan exists
    const loan = await Loan.findById(loanId);
    if (!loan) {
      console.error(`Loan with ID ${loanId} not found`);
      process.exit(1);
    }
    console.log(`Found loan: ${loan._id} (${loan.loanNumber || 'No loan number'})`);
    
    // Check if the loan already has milestones
    const existingMilestones = await Milestone.find({ loan: loanId });
    console.log(`Loan currently has ${existingMilestones.length} milestones`);
    
    if (existingMilestones.length > 0) {
      console.log('Warning: This loan already has milestones. Delete them first if you want to replace them.');
      console.log('Existing milestones:');
      existingMilestones.forEach((milestone, index) => {
        console.log(`${index + 1}. ${milestone.name} (${milestone.status})`);
      });
      
      // Prompt for confirmation
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('Do you want to proceed and add more milestones? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          await createDefaultMilestonesForLoan(loanId);
          console.log('Default milestones added successfully');
        } else {
          console.log('Operation cancelled');
        }
        readline.close();
        process.exit(0);
      });
    } else {
      // No existing milestones, proceed with creation
      await createDefaultMilestonesForLoan(loanId);
      console.log('Default milestones added successfully');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

run();
