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
    
    // Set start date to current date for the first milestone
    let currentStartDate = new Date();
    
    // Create each milestone
    for (let i = 0; i < defaultMilestones.length; i++) {
      const milestoneName = defaultMilestones[i];
      
      // Calculate deadlineDate for the current milestone (1 week from currentStartDate)
      const deadlineDate = new Date(currentStartDate); // Create a new Date object to avoid modifying currentStartDate directly
      deadlineDate.setDate(deadlineDate.getDate() + 7);
      
      await Milestone.create({
        loan: loanId,
        name: milestoneName,
        description: `Standard milestone: ${milestoneName}`,
        order: i + 1, // 1-based ordering
        status: i === 0 ? 'in_progress' : 'pending', // First milestone is in progress
        startDate: currentStartDate, // Use the calculated start date
        deadlineDate: deadlineDate, // Use the calculated deadline date
        notificationSent: false
      });
      
      console.log(`Created milestone "${milestoneName}" for loan ${loanId} from ${currentStartDate.toISOString()} to ${deadlineDate.toISOString()}`);
      
      // Set the start date for the next milestone to be the deadline of the current one
      currentStartDate = deadlineDate;
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
