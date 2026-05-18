import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://tsadun141:Nisindu12345@cluster0.chm1abj.mongodb.net/queuemanagementsystem";

async function clearDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;

    await db.collection("organizations").deleteMany({});
    console.log("Cleared organizations.");
    
    await db.collection("branches").deleteMany({});
    console.log("Cleared branches.");
    
    await db.collection("services").deleteMany({});
    console.log("Cleared services.");
    
    await db.collection("counters").deleteMany({});
    console.log("Cleared counters.");
    
    await db.collection("tokens").deleteMany({});
    console.log("Cleared tokens.");
    
    await db.collection("worksessions").deleteMany({});
    console.log("Cleared worksessions.");
    
    await db.collection("notifications").deleteMany({});
    console.log("Cleared notifications.");
    
    await db.collection("branchrequests").deleteMany({});
    console.log("Cleared branchrequests.");

    // Delete all users except super admins
    const result = await db.collection("users").deleteMany({
      role: { $nin: ["company_super_admin", "police_super_admin", "hospital_super_admin"] }
    });
    console.log(`Cleared ${result.deletedCount} users (kept super admins).`);

    console.log("Dummy data cleared successfully.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

clearDB();
