const { MongoClient } = require('mongodb');

async function setupDatabase() {
  const uri = "mongodb+srv://Tharushi:Uthpala2002@cluster0.acgshgt.mongodb.net/?appName=Cluster";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected successfully to MongoDB.");

    const db = client.db('SmartQueueDB');

    // Clean up if needed (optional but good for a fresh setup, we'll just insert)
    const orgsCollection = db.collection('Organizations');
    const tokensCollection = db.collection('Tokens');

    // Organizations Data
    const orgs = [
      { name: 'City Hospital', type: 'Hospital' },
      { name: 'BOC Bank', type: 'Bank' }
    ];

    console.log("\nInserting Organizations...");
    const orgResult = await orgsCollection.insertMany(orgs);
    console.log(`${orgResult.insertedCount} organizations inserted.`);
    
    // Create tokens with references to the orgs
    const hospitalOrgId = orgResult.insertedIds[0];
    const bankOrgId = orgResult.insertedIds[1];

    const tokens = [
      {
        org_id: hospitalOrgId,
        metadata: { patient_reason: "Fever" },
        createdAt: new Date()
      },
      {
        org_id: bankOrgId,
        metadata: { service: "Deposit" },
        createdAt: new Date()
      }
    ];

    console.log("\nInserting Tokens...");
    const tokenResult = await tokensCollection.insertMany(tokens);
    console.log(`${tokenResult.insertedCount} tokens inserted.`);

    // Now list them to verify
    console.log("\n--- Verification ---");
    const listedOrgs = await orgsCollection.find().toArray();
    console.log("Organizations in DB:");
    console.dir(listedOrgs, { depth: null });

    const listedTokens = await tokensCollection.find().toArray();
    console.log("\nTokens in DB:");
    console.dir(listedTokens, { depth: null });

  } catch (err) {
    console.error("Error setting up database:", err);
  } finally {
    await client.close();
    console.log("\nConnection closed.");
  }
}

setupDatabase();
