require('dns').setServers(['8.8.8.8']);
require('dotenv').config();
const mongoose = require('mongoose');

// Connect Database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const cleanDatabase = async () => {
    await connectDB();
    
    // We will bypass the strict Mongoose schema validation by using `collection.updateOne`
    // This allows us to overwrite the corrupted array with an empty valid one.
    
    try {
        const result = await mongoose.connection.db.collection('users').updateMany(
            {}, 
            { $set: { appliedUniversities: [] } }
        );
        
        console.log(`Successfully sanitized ${result.modifiedCount} user profiles.`);
        console.log("Wiped corrupt arrays bypassing CastError.");
    } catch (err) {
        console.error("Error during wipe:", err);
    }
    
    process.exit(0);
};

cleanDatabase();
