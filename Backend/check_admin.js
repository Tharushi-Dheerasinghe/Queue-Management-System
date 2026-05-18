import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://tsadun141:Nisindu12345@cluster0.chm1abj.mongodb.net/queuemanagementsystem";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  if (users.length === 0) {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash("admin123", 10);
    await mongoose.connection.db.collection('users').insertOne({
      name: "Super Admin",
      email: "admin@queue.com",
      password: hashedPassword,
      role: "company_super_admin",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log("Created admin@queue.com / admin123");
  } else {
    console.log(users.map(u => ({ email: u.email, role: u.role })));
  }
  process.exit(0);
}

run();
