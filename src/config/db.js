const mongoose = require('mongoose');
const dns = require('dns');

// Configure DNS for MongoDB Atlas SRV record resolution across all environments
try {
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
  if (typeof dns.setServers === 'function') {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  }
} catch (e) {
  console.warn('DNS server override notice:', e.message);
}

const DEFAULT_MONGO_URI = 'mongodb+srv://abhisheksahu8721_db_user:6V77uAYgAyNSXOXW@cluster0.494ez2r.mongodb.net/grocery_delivery_db?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGO_URI;
  console.log(`Connecting to MongoDB Atlas at: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000
    });
    console.log('✅ MongoDB Atlas connected successfully!');
    return;
  } catch (error) {
    console.error(`MongoDB Atlas connection error: ${error.message}`);
  }

  // Fallback to MongoMemoryServer if Atlas is unreachable and in non-production
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('Launching MongoDB Memory Server fallback...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`Connected to MongoMemoryServer fallback at: ${memoryUri}`);
    } catch (memErr) {
      console.error('Failed to initialize MongoDB Memory Server:', memErr.message);
    }
  }
};

module.exports = connectDB;


