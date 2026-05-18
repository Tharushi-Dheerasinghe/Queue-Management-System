import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  organizationName: String,
  branding: Object,
});

const Organization = mongoose.model("Organization", organizationSchema);

async function check() {
  await mongoose.connect("mongodb+srv://tsadun141:Nisindu12345@cluster0.chm1abj.mongodb.net/queuemanagementsystem");
  const orgs = await Organization.find({ organizationName: /Tharushi/i });
  console.log(JSON.stringify(orgs, null, 2));
  process.exit(0);
}

check();
