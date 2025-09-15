const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from config.env
dotenv.config({ path: './config/config.env' });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useCreateIndex: true, // Deprecated in Mongoose 6.x+
      // useFindAndModify: false, // Deprecated in Mongoose 6.x+
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
