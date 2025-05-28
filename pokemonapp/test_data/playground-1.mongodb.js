const { MongoClient } = require("mongodb"); // Zorg dat MongoClient is geïmporteerd

const uri = "mongodb+srv://dylandebrouwer:m4SQy74JJzZ57qH3@m4w01f.hpslzru.mongodb.net/?retryWrites=true&w=majority&appName=M4W01F";
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db("Elite_4");

        await db.collection("users").insertOne({
            username: "trainer123",
            email: "trainer123@example.com",
            password: "securepassword123",
            user_id: "001",
            collection: []
        });

        console.log("✅ Gebruiker succesvol toegevoegd!");
    } catch (error) {
        console.error("❌ Fout bij invoegen gebruiker:", error);
    } finally {
        await client.close();
    }
}

run(); // Voer de functie uit