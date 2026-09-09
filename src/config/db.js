const mongoose = require('mongoose');
const dns = require('dns');

// Set Google Public DNS for reliable SRV record resolution across environments
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore if unsupported
}

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log(`Connecting to MongoDB Atlas at: ${mongoUri ? mongoUri.replace(/:([^@]+)@/, ':****@') : 'undefined'}`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000
    });
    console.log('✅ MongoDB Atlas connected successfully!');
  } catch (error) {
    console.warn(`MongoDB Atlas connection error: ${error.message}. Launching MongoDB Memory Server fallback...`);
    try {
      // Lazy load MongoMemoryServer only in fallback
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`Connected to MongoMemoryServer fallback at: ${memoryUri}`);
    } catch (memErr) {
      console.error('Failed to initialize MongoDB Memory Server:', memErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
