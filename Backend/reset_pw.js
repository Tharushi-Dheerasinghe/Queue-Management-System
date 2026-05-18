import mongoose from "mongoose";
import bcrypt from "bcryptjs";

async function run() {
  try {
    await mongoose.connect("mongodb+srv://tsadun141:Nisindu12345@cluster0.chm1abj.mongodb.net/queuemanagementsystem");
    const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
    const hashedPassword = await bcrypt.hash("123456", 10);
    await User.updateOne({ email: "admin@queue.com" }, { $set: { password: hashedPassword } });
    console.log("Password reset successfully to 123456");
    await mongoose.connection.close();
  } catch(e) {
    console.error(e);
  }
}

run();
