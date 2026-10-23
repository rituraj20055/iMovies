const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { seedDatabase } = require('./seedData');

let mongoMemoryServer = null;

/**
 * Safely sanitizes a MongoDB connection string by masking user credentials for logging
 */
const sanitizeMongoUri = (uri) => {
  if (!uri) return 'undefined';
  return uri.replace(/\/\/(.*?)@/, (match, credentials) => {
    const parts = credentials.split(':');
    const user = parts[0] || '***';
    return `//${user}:******@`;
  });
};

/**
 * Connect to MongoDB Atlas (with local in-memory fallback for zero-config offline testing)
 */
const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  // Detect unconfigured template placeholders
  const isPlaceholder =
    !rawUri ||
    rawUri.includes('<password>') ||
    rawUri.includes('<username>') ||
    rawUri.includes('<cluster') ||
    rawUri.includes('your_password');

  if (isPlaceholder) {
    console.warn('\n⚠️ [MongoDB Atlas Config Notice]: MONGODB_URI is not set or contains placeholder credentials in server/.env.');
    console.warn('👉 To connect to your cloud cluster, open server/.env and paste your MongoDB Atlas connection string:');
    console.warn('   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/imovies?retryWrites=true&w=majority\n');
  }

  // Attempt connection to Atlas if a valid connection string is provided
  if (rawUri && !isPlaceholder) {
    try {
      const sanitized = sanitizeMongoUri(rawUri);
      console.log(`🔌 Attempting MongoDB Atlas connection to: ${sanitized}...`);

      const conn = await mongoose.connect(rawUri, {
        serverSelectionTimeoutMS: 5000,
        autoIndex: true,
      });

      console.log(`✅ Successfully connected to MongoDB Atlas!`);
      console.log(`   Host: ${conn.connection.host}`);
      console.log(`   Database: ${conn.connection.name}`);

      await seedDatabase();
      return conn;
    } catch (err) {
      console.error(`\n❌ [MongoDB Atlas Connection Failed]: ${err.message}`);

      // Detailed troubleshooting instructions
      if (
        err.message.includes('bad auth') ||
        err.message.includes('Authentication failed') ||
        err.code === 8000
      ) {
        console.error('🔑 [Authentication Check]: Database username or password in MONGODB_URI is invalid.');
        console.error('   Action: Verify credentials in MongoDB Atlas -> Database Access.');
        console.error('   Note: If your password contains special characters (like @, #, $, %, +, /), they must be URL-encoded (e.g. "@" becomes "%40").');
      } else if (
        err.message.includes('ETIMEOUT') ||
        err.message.includes('ENOTFOUND') ||
        err.message.includes('querySrv') ||
        err.message.includes('Server selection timed out')
      ) {
        console.error('🌐 [Network Access Check]: Connection timed out or DNS resolution failed.');
        console.error('   Action: Ensure your IP is whitelisted in MongoDB Atlas:');
        console.error('   1. Go to cloud.mongodb.com -> Network Access.');
        console.error('   2. Click "Add IP Address" -> Select "Allow Access from Anywhere" (0.0.0.0/0) or add your current IP.');
      } else {
        console.error(`ℹ️ Error details: ${err.stack || err.message}`);
      }

      if (process.env.NODE_ENV === 'production') {
        throw err;
      }

      console.warn('\n⚠️ Atlas connection could not be established. Launching local In-Memory MongoDB so development and testing can proceed seamlessly...\n');
    }
  }

  // Fallback: Local / In-Memory MongoDB instance for testing & zero-config local operation
  try {
    if (!mongoMemoryServer) {
      console.log('🚀 Initializing local In-Memory MongoDB instance...');
      mongoMemoryServer = await MongoMemoryServer.create();
    }
    const memUri = mongoMemoryServer.getUri();
    console.log(`🔌 Connecting to In-Memory MongoDB: ${memUri}`);

    const conn = await mongoose.connect(memUri);
    console.log('✅ Connected to In-Memory MongoDB successfully!');
    await seedDatabase();
    return conn;
  } catch (memErr) {
    console.error('❌ Fatal error: Failed to initialize database connection:', memErr.message);
    throw memErr;
  }
};

// Global Mongoose connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB runtime error:', err.message);
});

module.exports = { connectDB, sanitizeMongoUri };
