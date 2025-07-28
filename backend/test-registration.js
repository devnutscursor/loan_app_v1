const mongoose = require('mongoose');

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/loan-app-system';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const { createDefaultLoanPrograms } = require('./src/controllers/auth.controller');
const User = require('./src/models/user.model');
const Lender = require('./src/models/lender.model');
const LoanProgram = require('./src/models/loanProgram.model');

async function testRegistration() {
  try {
    console.log('Testing registration process...');
    
    // Create a test user
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'Lender',
      email: 'testlender@example.com',
      password: 'password123',
      role: 'lender',
      isEmailVerified: true
    });
    
    console.log(`✅ Created test user: ${testUser._id}`);
    
    // Create a test lender profile
    const testLender = await Lender.create({
      user: testUser._id,
      name: 'Test Lender Company',
      companyName: 'Test Lender Company',
      email: 'testlender@example.com',
      phone: '555-1234',
      nmls: '123456'
    });
    
    console.log(`✅ Created test lender profile: ${testLender._id}`);
    
    // Test creating default programs
    console.log('Testing createDefaultLoanPrograms...');
    await createDefaultLoanPrograms(testUser._id, testLender._id);
    
    // Check if programs were created
    const programs = await LoanProgram.find({ lender: testLender._id });
    console.log(`✅ Created ${programs.length} loan programs:`);
    
    programs.forEach(program => {
      console.log(`  - ${program.programName} (${program.programType})`);
    });
    
    // Clean up test data
    await LoanProgram.deleteMany({ lender: testLender._id });
    await Lender.findByIdAndDelete(testLender._id);
    await User.findByIdAndDelete(testUser._id);
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testRegistration(); 