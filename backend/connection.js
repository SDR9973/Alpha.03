const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './.env' });

// Connection URI
const uri = process.env.MONGODB_URI;

// Create a new MongoClient
const client = new MongoClient(uri);

async function run() {
    try {
        // Connect the client to the server
        await client.connect();
        console.log("Connected successfully to MongoDB");

        // Further operations
        const database = client.db('netXplore');
        const collection = database.collection('researcher');

        // Query for a document
        const doc = await collection.findOne({});
        console.log(doc);
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

run().catch(console.error);
