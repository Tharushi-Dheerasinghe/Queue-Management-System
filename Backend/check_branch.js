import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
  branchName: String,
  organizationName: String,
  organizationId: mongoose.Schema.Types.ObjectId,
});

const Branch = mongoose.model("Branch", branchSchema);

async function check() {
  await mongoose.connect("mongodb+srv://tsadun141:Nisindu12345@cluster0.chm1abj.mongodb.net/queuemanagementsystem");
  const branches = await Branch.find({ organizationName: /Tharushi/i });
  console.log(JSON.stringify(branches, null, 2));
  process.exit(0);
}

check();
