require("dotenv").config({ path: "/etc/secrets/.env" });
const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const POORT = process.env.PORT || 3000;
const corsOptions = {
    origin: ["https://wpl-1pro-d2-elite-4.onrender.com", "https://elite4-app.onrender.com"],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
};


app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/javascript", express.static(path.join(__dirname, "javascript")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/css", express.static(path.join(__dirname, "css")));

const client = new MongoClient(process.env.MONGO_URI);
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

// Redirect naar LandingPagina.html als root wordt bezocht
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "LandingPagina.html"));
});

// Statische bestanden goed instellen
const beveiligdePaginas = [
    "index.html",
    "batteler.html",
    "buddy.html",
    "catch.html",
    "collectie.html",
    "pokedex.html",
    "vergelijken.html",
    "whothapoke.html"
];

// Logica voor beveiligde pagina’s: Redirect naar inlogpagina als niet-ingelogd
beveiligdePaginas.forEach((pagina) => {
    app.get(`/${pagina}`, (req, res) => {
        if (!req.cookies.user) {
            return res.redirect("/inlog.html");
        }
        res.sendFile(path.join(__dirname, pagina));
    });
});

// Open toegang tot `inlog.html` en `Aanmelden.html`
app.get("/inlog.html", (req, res) => {
    res.sendFile(path.join(__dirname, "inlog.html"));
});

app.get("/Aanmelden.html", (req, res) => {
    res.sendFile(path.join(__dirname, "Aanmelden.html"));
});

// **Registratie API**
app.post("/api/register", async (req, res) => {
    console.log("🔍 Registratie-request ontvangen:", req.body);

    const db = await connectDB();
    const { naam, email, wachtwoord } = req.body;

    if (!naam || !email || !wachtwoord) {
        return res.status(400).json({ error: "❌ Alle velden zijn verplicht!" });
    }

    try {
        const existingUser = await db.collection("users").findOne({ email: email.trim() });
        if (existingUser) {
            return res.status(409).json({ error: "❌ Email is al geregistreerd!" });
        }

        const newUser = {
            username: naam,
            email: email.trim(),
            password: wachtwoord,
            user_id: Math.floor(Math.random() * 10000).toString(),
            collection: []
        };

        console.log("📌 Gebruiker wordt opgeslagen:", newUser);
        await db.collection("users").insertOne(newUser);

        res.cookie("user", email.trim(), { httpOnly: true, maxAge: 86400000 });
        res.status(201).json({ message: "✅ Registratie geslaagd!", email });
    } catch (error) {
        console.error("❌ Fout bij registratie:", error);
        res.status(500).json({ error: "❌ Fout bij registratie." });
    }
});

// **Login API**
app.post("/api/login", async (req, res) => {
    const db = await connectDB();
    let { emailOrUsername, wachtwoord } = req.body;

    if (!emailOrUsername || !wachtwoord) {
        return res.status(400).json({ error: "❌ Vul alle velden correct in!" });
    }

    try {
        const user = await db.collection("users").findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
            password: wachtwoord
        });

        if (!user) {
            return res.status(401).json({ error: "❌ Ongeldige inloggegevens!" });
        }

        res.cookie("user", user.email, { httpOnly: true, maxAge: 86400000 });
        res.status(200).json({ message: "✅ Inloggen geslaagd!", user });
    } catch (error) {
        console.error("❌ Fout bij inloggen:", error);
        res.status(500).json({ error: "❌ Fout bij inloggen." });
    }
});

// **Uitloggen API**
app.post("/api/logout", (req, res) => {
    res.clearCookie("user"); // Verwijder cookie
    res.status(200).json({ message: "✅ Uitloggen geslaagd!" });
});

// **Controleer loginstatus**
app.get("/api/checkLogin", (req, res) => {
    const userEmail = req.cookies.user;
    res.json({ loggedIn: !!userEmail, email: userEmail });
});

app.post("/api/getUser", async (req, res) => {
    const db = await connectDB();
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "❌ Email is verplicht!" });
    }

    try {
        const user = await db.collection("users").findOne({ email: email.trim() });

        if (!user) {
            return res.status(404).json({ error: "❌ Gebruiker niet gevonden!" });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error("❌ Fout bij ophalen van gebruiker:", error);
        res.status(500).json({ error: "❌ Fout bij ophalen van gebruiker." });
    }
});

app.post("/api/updateUser", async (req, res) => {
    const db = await connectDB();
    const { email, collection } = req.body;

    if (!email || !collection) {
        return res.status(400).json({ error: "❌ Email en collectie zijn verplicht!" });
    }

    try {
        await db.collection("users").updateOne(
            { email: email.trim() },
            { $set: { collection: collection } }
        );

        res.status(200).json({ message: "✅ Gebruiker succesvol bijgewerkt!" });
    } catch (error) {
        console.error("❌ Fout bij updaten van gebruiker:", error);
        res.status(500).json({ error: "❌ Fout bij updaten van gebruiker." });
    }
});

app.post("/api/updateBuddy", async (req, res) => {
    try {
        const db = await connectDB();
        const { email, pokemon_id } = req.body;

        if (!email || !pokemon_id) {
            return res.status(400).json({ error: "❌ Email en Pokémon ID zijn verplicht!" });
        }

        console.log(`🔄 Updaten buddy Pokémon voor gebruiker: ${email}, nieuwe buddy ID: ${pokemon_id}`);

        await db.collection("users").updateOne(
            { email: email.trim() },
            { $set: { "collection.$[elem].isBuddy": false } },
            { arrayFilters: [{ "elem.isBuddy": true }] }
        );

        await db.collection("users").updateOne(
            { email: email.trim(), "collection.pokemon_id": pokemon_id },
            { $set: { "collection.$.isBuddy": true } }
        );

        res.status(200).json({ message: "✅ Buddy succesvol bijgewerkt!" });
        console.log("🎉 Buddy Pokémon succesvol gewijzigd in database!");

    } catch (error) {
        console.error("❌ Fout bij updaten van buddy Pokémon:", error);
        res.status(500).json({ error: "❌ Fout bij updaten van buddy Pokémon." });
    }
});

// **Start server**
app.listen(POORT, () => {
    console.log(`🚀 Server draait op poort ${POORT}`);
});