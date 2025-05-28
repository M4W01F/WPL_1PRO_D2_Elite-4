require("dotenv").config({ path: "/etc/secrets/.env" });
const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const POORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/javascript", express.static(path.join(__dirname, "javascript")));
app.use("/images", express.static(path.join(__dirname, "images")));

const client = new MongoClient(process.env.MONGO_URI);
async function testDB() {
    try {
        const db = await connectDB();
        if (!db) {
            console.error("❌ Database niet geladen!");
            return;
        }
        const users = await db.collection("users").find().toArray();
        console.log("🔍 Gebruikers in database:", users);
    } catch (error) {
        console.error("❌ Fout bij ophalen van gebruikers:", error);
    }
}
testDB();
async function connectDB() {
    try {
        await client.connect();
        console.log("✅ Verbonden met MongoDB!");
        return client.db("Elite_4");
    } catch (error) {
        console.error("❌ Fout bij verbinden met MongoDB:", error);
        return null; // Voorkom dat de server crasht
    }
}

// **Hoofdpagina → Redirect naar `LandingPagina.html`**
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "LandingPagina.html"));
});

// **Blokkeer directe toegang tot `index.html`**
app.get("/index.html", (req, res) => {
    res.status(403).send("❌ Toegang geweigerd");
});

// **Registratie API**
app.post("/api/register", async (req, res) => {
    const db = await connectDB();
    const { naam, email, wachtwoord } = req.body;

    if (!naam || !email || !wachtwoord) {
        return res.status(400).json({ error: "❌ Alle velden zijn verplicht!" });
    }

    try {
        await db.collection("users").insertOne({
            username: naam,
            email: email.trim(), // Trim spaties
            password: wachtwoord,
            user_id: Math.floor(Math.random() * 10000).toString(),
            collection: [] // Lege collectie bij registratie
        });

        res.cookie("user", email.trim(), { httpOnly: true, maxAge: 86400000 }); // Blijf ingelogd (24 uur)
        res.status(201).json({ message: "✅ Registratie geslaagd!", email });
    } catch (error) {
        res.status(500).json({ error: "❌ Fout bij registratie." });
    }
});

// **Login API**
app.post("/api/login", async (req, res) => {
    const db = await connectDB();
    let { emailOrUsername, wachtwoord } = req.body;

    if (!emailOrUsername.trim() || !wachtwoord.trim()) {
        return res.status(400).json({ error: "❌ Vul alle velden correct in!" });
    }

    try {
        emailOrUsername = emailOrUsername.trim();

        const user = await db.collection("users").findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
            password: wachtwoord
        });

        if (!user) {
            return res.status(401).json({ error: "❌ Ongeldige inloggegevens!" });
        }

        res.cookie("user", user.email, { httpOnly: true, maxAge: 86400000 }); // Blijf ingelogd (24 uur)
        res.status(200).json({ message: "✅ Inloggen geslaagd!", user });

    } catch (error) {
        res.status(500).json({ error: "❌ Fout bij inloggen." });
    }
});

// **Uitloggen API**
app.post("/api/logout", (req, res) => {
    res.clearCookie("user"); // ✅ Verwijder cookie
    res.status(200).json({ message: "✅ Uitloggen geslaagd!" });
});

// **Controleer loginstatus**
app.get("/api/checkLogin", (req, res) => {
    const userEmail = req.cookies.user;
    res.json({ loggedIn: !!userEmail, email: userEmail });
});

// **Start server**
app.listen(POORT, () => {
    console.log(`🚀 Server draait op poort ${POORT}`);
});