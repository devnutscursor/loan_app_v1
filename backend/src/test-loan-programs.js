const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import the createDefaultLoanPrograms function
const { createDefaultLoanPrograms } = require('./controllers/auth.controller');

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB');
    runTest();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function runTest() {
  try {
    // Create a test user
    const User = require('./models/user.model');
    const Lender = require('./models/lender.model');
    const LoanProgram = require('./models/loanProgram.model');
    
    // Create a unique email with a timestamp
    const timestamp = new Date().getTime();
    const testEmail = `test-${timestamp}@test.com`;
    
    // Create a test user
    const user = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: testEmail,
      password: 'password123',
      phone: '1234567890',
      role: 'lender'
    });
    
    console.log('Created test user:', user._id);
    
    // Create a lender profile
    const lender = await Lender.create({
      user: user._id
    });
    
    console.log('Created test lender:', lender._id);
    
    // Create default loan programs
    await createDefaultLoanPrograms(user._id, lender._id);
    
    console.log('Default loan programs creation attempted');
    
    // Check if loan programs were created
    const loanPrograms = await LoanProgram.find({ lender: lender._id });
    
    console.log(`Found ${loanPrograms.length} loan programs for the lender`);
    
    if (loanPrograms.length > 0) {
      console.log('Loan program types created:');
      loanPrograms.forEach(program => {
        console.log(`- ${program.programName} (${program.programType})`);
      });
      console.log('Implementation successful!');
    } else {
      console.log('No loan programs found. Implementation failed.');
    }
    
    // Clean up
    console.log('Cleaning up test data...');
    await LoanProgram.deleteMany({ lender: lender._id });
    await Lender.findByIdAndDelete(lender._id);
    await User.findByIdAndDelete(user._id);
    console.log('Test data cleaned up');
    
    console.log('Test completed');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
} 