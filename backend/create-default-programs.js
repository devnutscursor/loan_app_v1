const mongoose = require('mongoose');
const { createDefaultLoanPrograms } = require('./src/controllers/auth.controller');
const logger = require('./src/utils/logger');

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/loan-app-system';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Lender = require('./src/models/lender.model');
const LoanProgram = require('./src/models/loanProgram.model');

async function createDefaultProgramsForExistingLenders() {
  try {
    console.log('Starting to create default programs for existing lenders...');
    
    // Get all lenders
    const lenders = await Lender.find({});
    console.log(`Found ${lenders.length} lenders`);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const lender of lenders) {
      try {
        // Check if lender already has loan programs
        const existingPrograms = await LoanProgram.find({ lender: lender._id });
        
        if (existingPrograms.length === 0) {
          console.log(`Creating default programs for lender: ${lender._id} (${lender.companyName || lender.name})`);
          
          // Create default programs for this lender
          await createDefaultLoanPrograms(lender.user, lender._id);
          createdCount++;
          
          console.log(`✅ Created default programs for lender: ${lender._id}`);
        } else {
          console.log(`⏭️  Skipping lender ${lender._id} - already has ${existingPrograms.length} programs`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error creating programs for lender ${lender._id}:`, error.message);
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total lenders: ${lenders.length}`);
    console.log(`Programs created: ${createdCount}`);
    console.log(`Lenders skipped: ${skippedCount}`);
    console.log('Default programs creation completed!');
    
  } catch (error) {
    console.error('Error in createDefaultProgramsForExistingLenders:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
createDefaultProgramsForExistingLenders(); 