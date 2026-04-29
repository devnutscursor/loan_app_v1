const dns = require('dns');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Node on Windows can use a resolver that fails SRV for mongodb+srv; Compass/Electron often does not.
function applyAtlasSrvDnsWorkaround() {
  if (!process.env.MONGODB_URI?.startsWith('mongodb+srv://')) return;
  const servers = (process.env.NODE_DNS_SERVERS || '8.8.8.8,1.1.1.1')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (servers.length) dns.setServers(servers);
}

// Database connection function
const connectDatabase = async () => {
  try {
    applyAtlasSrvDnsWorkaround();
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/loan-app-system';
    
    await mongoose.connect(mongoURI);
    
    logger.info('MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    return mongoose.connection;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDatabase };
