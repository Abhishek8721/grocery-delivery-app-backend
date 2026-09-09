const mongoose = require('mongoose');
const dns = require('dns');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Set DNS servers to Google Public DNS to reliably resolve SRV records on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore if unsupported
}

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log(`Connecting to MongoDB Atlas at: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000
    });
    console.log('✅ MongoDB Atlas connected successfully!');
  } catch (error) {
    console.warn(`MongoDB Atlas connection error: ${error.message}. Launching MongoDB Memory Server fallback...`);
    try {
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
