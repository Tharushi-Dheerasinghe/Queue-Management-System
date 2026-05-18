import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  try {
    const MONGODB_URI = "mongodb+srv://tsadun141:Nisindu12345@cluster0.chm1abj.mongodb.net/queuemanagementsystem";
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected. Dropping serviceName_1 index from services collection...");
    
    // We can access the raw collection
    const collection = mongoose.connection.db.collection('services');
    await collection.dropIndex('serviceName_1');
    
    console.log("Successfully dropped index serviceName_1");
  } catch (error) {
    if (error.codeName === 'IndexNotFound') {
        console.log("Index serviceName_1 already dropped or not found.");
    } else {
        console.error("Error:", error);
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
