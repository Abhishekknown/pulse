const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pulse', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Failed: ${error.message}`);
    console.error(`\n💡 Make sure MongoDB is running. You can:`);
    console.error(`   1. Install & start MongoDB locally: sudo systemctl start mongod`);
    console.error(`   2. Use MongoDB Atlas: update MONGO_URI in .env with your Atlas connection string`);
    console.error(`   3. Install MongoDB: https://www.mongodb.com/docs/manual/installation/\n`);
    console.error(`   The server will continue running, but database operations will fail.\n`);
  }
};

module.exports = connectDB;
