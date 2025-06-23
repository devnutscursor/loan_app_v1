const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function main() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');

    // Import models
    const AuditLog = require('./src/models/auditLog.model');
    const Lender = require('./src/models/lender.model');
    const User = require('./src/models/user.model');
    const Loan = require('./src/models/loan.model');
    
    // Get a sample lender
    const lender = await Lender.findOne({}).exec();
    if (!lender) {
      console.log('No lenders found');
      return;
    }
    
    console.log(`Using lender ID: ${lender._id}`);
    
    // Simulate getLenderActivities
    const limit = 5;
    
    // Get recent messages
    const recentMessages = [];
    try {
      const Message = require('./src/models/message.model');
      const messages = await Message.find({ 
        recipientRole: 'lender'
      })
      .sort({ createdAt: -1 })
      .limit(limit);
      
      recentMessages.push(...messages);
      console.log(`Found ${messages.length} recent messages`);
    } catch (messageError) {
      console.error('Error fetching recent messages:', messageError);
    }
    
    // Get recent status changes from audit logs
    const statusChanges = [];
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Fixed query that doesn't use string literals for date fields
      const auditLogs = await AuditLog.find({
        entityType: 'loan',
        eventType: 'status_change',
        createdAt: { $gte: thirtyDaysAgo }
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
      
      statusChanges.push(...auditLogs);
      console.log(`Found ${auditLogs.length} status changes in audit logs`);
    } catch (auditError) {
      console.error('Error fetching status changes:', auditError);
    }
    
    // Combine and sort activities
    const activities = [...recentMessages, ...statusChanges]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
    
    console.log(`Total combined activities: ${activities.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();
