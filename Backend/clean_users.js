import mongoose from "mongoose";

async function run() {
  try {
    await mongoose.connect("mongodb+srv://tsadun141:Nisindu12345@cluster0.chm1abj.mongodb.net/queuemanagementsystem");
    
    // We import the real User model to ensure schemas match if needed, but strict:false is fine
    const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
    
    const users = await User.find({}).lean();
    console.log("All Users:", users.map(u => ({ id: u._id, email: u.email, role: u.role })));
    
    // Find the first superadmin
    const superAdmin = users.find(u => u.role === "company_super_admin");
    
    if (!superAdmin) {
      console.log("No superadmin found! Cannot delete.");
    } else {
      console.log("Keeping superadmin:", superAdmin.email);
      // Delete all users EXCEPT this superadmin
      const result = await User.deleteMany({ _id: { $ne: superAdmin._id } });
      console.log("Deleted count:", result.deletedCount);
    }
    
    await mongoose.connection.close();
  } catch(e) {
    console.error(e);
  }
}

run();
