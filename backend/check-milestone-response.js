// check-milestone-response.js
// Script to directly test the milestone API response format

require('dotenv').config();
const axios = require('axios');

// Replace with a valid loan ID and token from your environment
const loanId = process.argv[2]; // Pass loan ID as first argument
const token = process.argv[3]; // Pass token as second argument

if (!loanId || !token) {
  console.error('Usage: node check-milestone-response.js <loanId> <token>');
  process.exit(1);
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://loan-app-backend-1qkk.onrender.com/';

async function checkMilestoneResponse() {
  try {
    console.log(`Checking milestone data for loan: ${loanId}`);
    
    const response = await axios.get(
      `${API_URL}/api/v1/loans/${loanId}/milestones`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('API Response status:', response.status);
    console.log('Response structure:', {
      dataKeys: Object.keys(response.data),
      status: response.data.status,
      hasData: !!response.data.data,
      dataKeys: response.data.data ? Object.keys(response.data.data) : [],
      milestones: response.data.data?.milestones ? `Array(${response.data.data.milestones.length})` : null,
      overallProgress: response.data.data?.overallProgress,
      currentMilestone: response.data.data?.currentMilestone ? 'Present' : 'Not present'
    });
    
    if (response.data.data?.milestones?.length > 0) {
      // Calculate progress from milestones manually
      const milestones = response.data.data.milestones;
      const completedCount = milestones.filter(m => m.status === 'completed' || m.isCompleted === true).length;
      const inProgressCount = milestones.filter(m => m.status === 'in_progress' || m.status === 'current').length;
      const totalCount = milestones.length;
      
      const calculatedProgress = Math.round(((completedCount + (inProgressCount * 0.5)) / totalCount) * 100);
      
      console.log('Milestone Progress Calculation:');
      console.log(`- API provided progress: ${response.data.data.overallProgress}`);
      console.log(`- Manual calculation: ${calculatedProgress}%`);
      console.log(`- Completed milestones: ${completedCount}/${totalCount}`);
      console.log(`- In-progress milestones: ${inProgressCount}/${totalCount}`);
      
      // Print milestone details
      console.log('\nMilestone Details:');
      milestones.forEach((m, i) => {
        console.log(`${i+1}. ${m.title} - Status: ${m.status} - Completed: ${m.isCompleted}`);
      });
    }
    
  } catch (error) {
    console.error('Error fetching milestone data:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

checkMilestoneResponse();
