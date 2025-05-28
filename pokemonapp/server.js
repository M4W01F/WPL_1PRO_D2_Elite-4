require("dotenv").config();
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
app.use(express.static(path.join(__dirname, "public"))); // Statische bestanden serveren

const client = new MongoClient(process.env.MONGO_URI);
async function connectDB() {
    await client.connect();
    return client.db("Elite_4");
}

// **Redirect root (`/`) naar LandingPagina.html**
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "LandingPagina.html"));
});

// **Blokkeer directe toegang tot index.html**
app.get("/index.html", (req, res) => {
    res.status(403).send("Toegang geweigerd"); // Voorkom directe toegang tot index.html
});

// **Gebruiker registreren**
app.post("/api/register", async (req, res) => {
    const db = await connectDB();
    const { naam, email, wachtwoord } = req.body;

    if (!naam || !email || !wachtwoord) {
        return res.status(400).json({ error: "❌ Alle velden zijn verplicht!" });
    }

    try {
        await db.collection("gebruikers").insertOne({
            gebruikersnaam: naam,
            email: email.trim(), // Trim spaties
            wachtwoord: wachtwoord,
            gebruiker_id: Math.floor(Math.random() * 10000).toString(),
            collectie: [] // Lege collectie bij registratie
        });

        res.cookie("gebruiker", email.trim(), { httpOnly: true, maxAge: 86400000 }); // Blijf ingelogd (24 uur)
        res.status(201).json({ bericht: "✅ Registratie geslaagd en ingelogd!", email });
    } catch (error) {
        res.status(500).json({ error: "❌ Fout bij registratie." });
    }
});

// **Inloggen (met e-mail of gebruikersnaam)**
app.post("/api/inloggen", async (req, res) => {
    const db = await connectDB();
    let { emailOfGebruikersnaam, wachtwoord } = req.body;

    if (!emailOfGebruikersnaam || !wachtwoord) {
        return res.status(400).json({ error: "❌ Alle velden zijn verplicht!" });
    }

    try {
        emailOfGebruikersnaam = emailOfGebruikersnaam.trim();

        const gebruiker = await db.collection("gebruikers").findOne({
            $or: [{ email: emailOfGebruikersnaam }, { gebruikersnaam: emailOfGebruikersnaam }],
            wachtwoord: wachtwoord
        });

        if (!gebruiker) {
            return res.status(401).json({ error: "❌ Ongeldige inloggegevens!" });
        }

        res.cookie("gebruiker", gebruiker.email, { httpOnly: true, maxAge: 86400000 }); // Blijf ingelogd (24 uur)
        res.status(200).json({ bericht: "✅ Inloggen geslaagd!", gebruiker });

    } catch (error) {
        res.status(500).json({ error: "❌ Fout bij inloggen." });
    }
});

// **Uitloggen**
app.post("/api/uitloggen", (req, res) => {
    res.clearCookie("gebruiker"); // Verwijder cookie
    res.status(200).json({ bericht: "✅ Uitloggen geslaagd!" });
});

// **Controleer inlogstatus**
app.get("/api/checkInloggen", (req, res) => {
    const gebruikerEmail = req.cookies.gebruiker;
    res.json({ ingelogd: !!gebruikerEmail, email: gebruikerEmail });
});

// **Afhandelen van 404 (redirect naar LandingPagina)**
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "LandingPagina.html"));
});

// **Start de server**
app.listen(POORT, () => {
    console.log(`Server draait op poort ${POORT}`);
});