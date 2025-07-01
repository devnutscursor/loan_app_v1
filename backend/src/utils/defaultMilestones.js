/**
 * Utility for creating default milestones for new loans
 */

const Milestone = require('../models/milestone.model');
const Loan = require('../models/loan.model');

/**
 * Create default milestones for a newly created loan
 * @param {string} loanId - The ID of the loan to create milestones for
 */
const createDefaultMilestonesForLoan = async (loanId) => {
  try {
    console.log(`Creating default milestones for loan ${loanId}`);
    
    // Define the default milestone names in order
    const defaultMilestones = [
      "Pre Approved",
      "Found My House",
      "Disclosure & Needs List Sent",
      "Loan Conditions Received",
      "Loan Submitted for Approval",
      "Appraisal Ordered",
      "Initial Loan Approval Received",
      "Final Conditions Requested",
      "Appraisal Received",
      "Submitted for Final Approval",
      "Final Approval In",
      "Closing Docs Ordered",
      "Loan Closed"
    ];
    
    // Set start date to current date
    const startDate = new Date();
    
    // Create milestones with deadlines one week in the future
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    // Create each milestone
    for (let i = 0; i < defaultMilestones.length; i++) {
      const milestoneName = defaultMilestones[i];
      
      await Milestone.create({
        loan: loanId,
        name: milestoneName,
        description: `Standard milestone: ${milestoneName}`,
        order: i + 1, // 1-based ordering
        status: i === 0 ? 'in_progress' : 'pending', // First milestone is in progress
        startDate: startDate,
        deadlineDate: oneWeekFromNow, // Default deadline is one week from now
        notificationSent: false
      });
      
      console.log(`Created milestone "${milestoneName}" for loan ${loanId}`);
    }
    
    // Calculate initial completion percentage (first milestone is in progress = 50% of 1/13 = ~4%)
    const initialCompletionPercentage = Math.round((0.5 / defaultMilestones.length) * 100);
    
    // Update the loan with the initial completion percentage
    await Loan.findByIdAndUpdate(loanId, { completionPercentage: initialCompletionPercentage });
    console.log(`Set initial completion percentage for loan ${loanId} to ${initialCompletionPercentage}%`);
    
    console.log(`Successfully created ${defaultMilestones.length} default milestones for loan ${loanId}`);
    return true;
  } catch (error) {
    console.error(`Error creating default milestones for loan ${loanId}:`, error);
    throw error;
  }
};

module.exports = {
  createDefaultMilestonesForLoan
};
