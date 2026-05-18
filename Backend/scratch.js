import mongoose from "mongoose";
import { bulkCreateSystem } from "./controllers/organizationController.js";

async function run() {
  await mongoose.connect('mongodb+srv://tsadun141:Nisindu12345@cluster0.chm1abj.mongodb.net/queuemanagementsystem');
  console.log("DB connected");

  const req = {
    body: {
      tenantType: "hospital",
      organizationName: "HospitalD",
      branding: {},
      branches: [
        {
          branchName: "Colombo",
          city: "Colombo",
          units: [
            { serviceName: "opd" },
            { serviceName: "pharmacy" }
          ]
        }
      ]
    }
  };

  const res = {
    status: (code) => ({
      json: (data) => console.log("Response:", code, data)
    })
  };

  try {
    await bulkCreateSystem(req, res);
  } catch(e) {
    console.error("Error calling bulkCreateSystem:", e);
  }
  process.exit(0);
}

run().catch(console.error);
