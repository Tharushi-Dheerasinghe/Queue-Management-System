import mongoose from 'mongoose';

const run = async () => {
  try {
    const MONGODB_URI = "mongodb+srv://tsadun141:Nisindu12345@cluster0.chm1abj.mongodb.net/queuemanagementsystem";
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected. Dropping branchId_1_serviceName_1 index from services collection...");
    
    const collection = mongoose.connection.db.collection('services');
    await collection.dropIndex('branchId_1_serviceName_1');
    
    console.log("Successfully dropped index branchId_1_serviceName_1");
  } catch (error) {
    if (error.codeName === 'IndexNotFound') {
        console.log("Index branchId_1_serviceName_1 already dropped or not found.");
    } else {
        console.error("Error:", error);
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
