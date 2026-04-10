const { MongoClient } = require('mongodb');

async function addMoreData() {
  const uri = "mongodb+srv://Tharushi:Uthpala2002@cluster0.acgshgt.mongodb.net/?appName=Cluster";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected successfully to MongoDB.");

    const db = client.db('SmartQueueDB');
    const orgsCollection = db.collection('Organizations');
    const tokensCollection = db.collection('Tokens');

    // 1. Insert Additional Organizations Data
    const newOrgs = [
      { name: 'Cargills Supermarket', type: 'Supermarket' },
      { name: 'City Police Station', type: 'Police Station' }
    ];

    console.log("\nInserting Additional Organizations...");
    const orgResult = await orgsCollection.insertMany(newOrgs);
    console.log(`${orgResult.insertedCount} organizations inserted.`);
    
    // 2. Create tokens with references to the new orgs
    const supermarketOrgId = orgResult.insertedIds[0];
    const policeOrgId = orgResult.insertedIds[1];

    const newTokens = [
      {
        org_id: supermarketOrgId,
        metadata: { cart_items: 5, is_priority: false },
        createdAt: new Date()
      },
      {
        org_id: policeOrgId,
        metadata: { case_type: "Emergency", priority_level: 1 },
        createdAt: new Date()
      }
    ];

    console.log("\nInserting Additional Tokens...");
    const tokenResult = await tokensCollection.insertMany(newTokens);
    console.log(`${tokenResult.insertedCount} tokens inserted.`);

    // 3. Verify specifically the new insertions
    console.log("\n--- Verification of New Data ---");
    const listedOrgs = await orgsCollection.find({ _id: { $in: Object.values(orgResult.insertedIds) } }).toArray();
    console.log("Newly Added Organizations:");
    console.dir(listedOrgs, { depth: null });

    const listedTokens = await tokensCollection.find({ _id: { $in: Object.values(tokenResult.insertedIds) } }).toArray();
    console.log("\nNewly Added Tokens:");
    console.dir(listedTokens, { depth: null });

  } catch (err) {
    console.error("Error inserting additional data:", err);
  } finally {
    await client.close();
    console.log("\nConnection closed.");
  }
}

addMoreData();
