const mongoose = require('mongoose');

// Attempt to set DNS servers safely if supported
try {
  const dns = require('dns');
  if (typeof dns.setServers === 'function') {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  }
} catch (e) {
  // Ignore DNS override errors in restricted container environments
}

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.warn('⚠️ MONGODB_URI is not defined in environment variables.');
    } else {
      console.log(`Connecting to MongoDB Atlas at: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000
      });
      console.log('✅ MongoDB Atlas connected successfully!');
      return;
    }
  } catch (error) {
    console.warn(`MongoDB Atlas connection error: ${error.message}.`);
  }

  // Fallback to MongoMemoryServer only in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('Launching MongoDB Memory Server fallback for local dev...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`Connected to MongoMemoryServer fallback at: ${memoryUri}`);
    } catch (memErr) {
      console.error('Failed to initialize MongoDB Memory Server:', memErr.message);
    }
  } else {
    console.error('❌ Database connection unavailable. Server running in degraded mode.');
  }
};

module.exports = connectDB;

