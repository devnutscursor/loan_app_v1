const mongoose = require('mongoose');

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/loan-app-system';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./src/models/user.model');
const Lender = require('./src/models/lender.model');
const Borrower = require('./src/models/borrower.model');

async function checkUsers() {
  try {
    console.log('Checking users in database...');
    
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`- ${user.email} (${user.role}) - ID: ${user._id}`);
      
      if (user.role === 'lender') {
        const lenderProfile = await Lender.findOne({ user: user._id });
        if (lenderProfile) {
          console.log(`  ✅ Has lender profile: ${lenderProfile._id}`);
        } else {
          console.log(`  ❌ No lender profile found`);
        }
      } else if (user.role === 'borrower') {
        const borrowerProfile = await Borrower.findOne({ user: user._id });
        if (borrowerProfile) {
          console.log(`  ✅ Has borrower profile: ${borrowerProfile._id}`);
        } else {
          console.log(`  ❌ No borrower profile found`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
checkUsers(); 