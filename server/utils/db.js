const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { seedDatabase } = require('./seedData');

let mongoMemoryServer = null;

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://localhost:27017/imovies';

  try {
    console.log(`🔌 Attempting MongoDB connection to: ${primaryUri}...`);
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log('✅ Connected to MongoDB at', primaryUri);
    await seedDatabase();
  } catch (err) {
    console.warn(`⚠️ Could not connect to primary MongoDB (${err.message}).`);
    console.log('🚀 Launching embedded In-Memory MongoDB Server for seamless zero-config execution...');

    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const memUri = mongoMemoryServer.getUri();
      console.log(`✅ In-Memory MongoDB running at: ${memUri}`);

      await mongoose.connect(memUri);
      console.log('✅ Connected to In-Memory MongoDB!');
      await seedDatabase();
    } catch (memErr) {
      console.error('❌ Failed to start In-Memory MongoDB:', memErr.message);
      throw memErr;
    }
  }
};

module.exports = { connectDB };
