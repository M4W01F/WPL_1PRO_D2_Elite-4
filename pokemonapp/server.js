require("dotenv").config();
const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"))); // Statische bestanden serveren

const client = new MongoClient(process.env.MONGO_URI);
async function connectDB() {
    await client.connect();
    return client.db("Elite_4");
}

// **Hoofdpagina**
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "LandingPagina.html"));
});

// **Blokkeer directe toegang tot index.html**
app.get("/index.html", (req, res) => {
    res.status(403).send("Access Denied");
});

// **API-endpoint om een gebruiker te registreren**
app.post("/api/register", async (req, res) => {
    const db = await connectDB();
    const { naam, email, wachtwoord } = req.body;

    if (!naam || !email || !wachtwoord) {
        return res.status(400).json({ error: "❌ Alle velden zijn verplicht!" });
    }

    try {
        await db.collection("users").insertOne({
            username: naam,
            email: email.trim(),
            password: wachtwoord,
            user_id: Math.floor(Math.random() * 10000).toString(),
            collection: [] // ✅ Lege collectie bij aanmaak
        });

        res.cookie("user", email.trim(), { httpOnly: true, maxAge: 86400000 }); // 24 uur geldig
        res.status(201).json({ message: "✅ Gebruiker succesvol geregistreerd en ingelogd!", email });
    } catch (error) {
        res.status(500).json({ error: "❌ Fout bij registratie." });
    }
});

// **API-endpoint om een gebruiker in te loggen (via e-mail of gebruikersnaam)**
app.post("/api/login", async (req, res) => {
    const db = await connectDB();
    let { emailOrUsername, wachtwoord } = req.body;

    if (!emailOrUsername || !wachtwoord) {
        return res.status(400).json({ error: "❌ Alle velden zijn verplicht!" });
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

        res.cookie("user", user.email, { httpOnly: true, maxAge: 86400000 }); // 24 uur geldig
        res.status(200).json({ message: "✅ Inloggen succesvol!", user });
    } catch (error) {
        res.status(500).json({ error: "❌ Fout bij inloggen." });
    }
});

// **API-endpoint om uit te loggen**
app.post("/api/logout", (req, res) => {
    res.clearCookie("user");
    res.status(200).json({ message: "✅ Uitloggen succesvol!" });
});

// **API-endpoint om te controleren of een gebruiker ingelogd is**
app.get("/api/checkLogin", (req, res) => {
    const userEmail = req.cookies.user;
    if (userEmail) {
        res.json({ loggedIn: true, email: userEmail });
    } else {
        res.json({ loggedIn: false });
    }
});

// **Wildcard route om alle niet-herkende requests naar `index.html` te sturen**
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// **Start de server**
app.listen(PORT, () => {
    console.log(`🚀 Server draait op poort ${PORT}`);
});