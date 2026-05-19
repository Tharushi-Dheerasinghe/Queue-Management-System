import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://tharushiuthpala780_db_user:8cW87GsEXx4SpNNW@cluster0.zacymyc.mongodb.net/Queue_Management?retryWrites=true&w=majority";

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
