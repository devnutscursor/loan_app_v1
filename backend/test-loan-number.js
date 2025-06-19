const mongoose = require('mongoose');
require('dotenv').config();
const Loan = require('./src/models/loan.model');

async function testLoanNumberGeneration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Create a test loan with minimal required fields
    const testLoan = new Loan({
      status: 'draft',
      borrower: '64a087dc4edd0a0c9b96bc0e', // Replace with a valid borrower ID
      loanDetail: {
        loanType: 'Purchase',
        requestedLoanAmount: 300000
      },
      property: {
        propertyValue: 400000
      }
    });

    // Save the loan to trigger the pre-save hook
    await testLoan.save();

    // Log the generated loan number
    console.log('Generated loan number:', testLoan.loanNumber);
    console.log('Loan ID:', testLoan._id);

    // Create another loan to verify incrementing sequence
    const testLoan2 = new Loan({
      status: 'draft',
      borrower: '64a087dc4edd0a0c9b96bc0e', // Replace with a valid borrower ID
      loanDetail: {
        loanType: 'Purchase',
        requestedLoanAmount: 350000
      },
      property: {
        propertyValue: 450000
      }
    });

    await testLoan2.save();
    console.log('Generated loan number 2:', testLoan2.loanNumber);
    console.log('Loan ID 2:', testLoan2._id);

    // Fetch all loans from today to see the sequence
    const today = new Date();
    const year = today.getFullYear().toString();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    
    const todayPrefix = `${year}${month}${day}`;
    console.log('Looking for loans with prefix:', todayPrefix);

    const todaysLoans = await Loan.find({
      loanNumber: { $regex: `^${todayPrefix}` }
    }).sort({ loanNumber: 1 });

    console.log('Today\'s loans:');
    todaysLoans.forEach(loan => {
      console.log(`- ${loan.loanNumber} (ID: ${loan._id})`);
    });

    console.log(`Found ${todaysLoans.length} loans with today's date prefix`);

    // Disconnect from database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error testing loan number generation:', error);
  }
}

testLoanNumberGeneration();
