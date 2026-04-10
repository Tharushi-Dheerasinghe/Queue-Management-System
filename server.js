require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = 3000;

// MongoDB Connection URI
const uri = process.env.MONGO_URI;
let db;

// Connect to MongoDB once
async function connectDB() {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db('SmartQueueDB');
    console.log("Connected to MongoDB SmartQueueDB!");
}

app.use(express.json());

// API Route for Data Isolation
app.get('/api/tokens/:org_id', async (req, res) => {
    try {
        const orgIdStr = req.params.org_id;

        // Validate the ObjectId
        if (!ObjectId.isValid(orgIdStr)) {
            return res.status(400).json({ error: "Invalid organization ID." });
        }

        const orgId = new ObjectId(orgIdStr);
        const tokensCollection = db.collection('Tokens');

        // Query fetching ONLY tokens for the given org_id (Isolation)
        const tokens = await tokensCollection.find({ org_id: orgId }).toArray();
        
        // Also get the Org name for clarity in the response
        const orgsCollection = db.collection('Organizations');
        const org = await orgsCollection.findOne({ _id: orgId });

        res.json({
            organization: org ? org.name : 'Unknown',
            type: org ? org.type : 'Unknown',
            count: tokens.length,
            tokens: tokens
        });
    } catch (err) {
        console.error("Error fetching tokens:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start the server
app.listen(port, async () => {
    await connectDB();
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Test endpoint via GET /api/tokens/:org_id`);
});
