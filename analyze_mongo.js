const { MongoClient } = require('mongodb');

async function analyze() {
  const uri = "mongodb+srv://Tharushi:Uthpala2002@cluster0.acgshgt.mongodb.net/?appName=Cluster";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected successfully to MongoDB.");

    const adminDb = client.db('admin');
    const dbsInfo = await adminDb.admin().listDatabases();
    
    let userDbsFound = false;

    for (const dbInfo of dbsInfo.databases) {
       if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;
       
       userDbsFound = true;
       console.log(`\n============================`);
       console.log(`Database: ${dbInfo.name}`);
       console.log(`============================`);
       
       const db = client.db(dbInfo.name);
       const collections = await db.listCollections().toArray();
       
       if (collections.length === 0) {
          console.log(`  No collections found.`);
          continue;
       }

       for (const colInfo of collections) {
          console.log(`\n  Collection: ${colInfo.name}`);
          const collection = db.collection(colInfo.name);
          const count = await collection.countDocuments();
          console.log(`  Document Count: ${count}`);
          
          if (count > 0) {
             const sampleDoc = await collection.findOne();
             console.log(`  Schema Structure (based on 1 document):`);
             printSchema(sampleDoc, "    ");
          } else {
             console.log(`  No documents to analyze schema.`);
          }
       }
    }
    
    if (!userDbsFound) {
       console.log("No non-system databases were found. The database might be empty.");
    }
  } catch (err) {
    console.error("Error analyzing MongoDB:", err);
  } finally {
    await client.close();
  }
}

function printSchema(obj, indent = "") {
    if (obj === null) {
        console.log(`${indent}null`);
        return;
    }
    
    if (Array.isArray(obj)) {
        if (obj.length > 0) {
            console.log(`${indent}[Array of:]`);
            printSchema(obj[0], indent + "  ");
        } else {
            console.log(`${indent}[] (Empty Array)`);
        }
        return;
    }
    
    if (typeof obj === 'object') {
        if (obj instanceof Date) {
            console.log(`${indent}Date`);
            return;
        }
        if (obj.constructor && obj.constructor.name === "ObjectId") {
             console.log(`${indent}ObjectId`);
             return;
        }

        for (const [key, value] of Object.entries(obj)) {
            let typeStr = typeof value;
            if (value === null) typeStr = 'null';
            else if (Array.isArray(value)) typeStr = 'Array';
            else if (value instanceof Date) typeStr = 'Date';
            else if (typeof value === 'object') {
                 if (value.constructor && value.constructor.name === "ObjectId") {
                     typeStr = 'ObjectId';
                 } else {
                     typeStr = 'Object';
                 }
            }
            
            console.log(`${indent}${key}: ${typeStr}`);
            if (typeStr === 'Object' || typeStr === 'Array') {
                printSchema(value, indent + "  ");
            }
        }
        return;
    }
}

analyze();
