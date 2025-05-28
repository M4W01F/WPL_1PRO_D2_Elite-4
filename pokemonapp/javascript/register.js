document.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();

    // ✅ Haal invoerwaarden op uit `Aanmelden.html`
    const naam = document.getElementById("naam-input").value.trim();
    const email = document.getElementById("email-input").value.trim();
    const wachtwoord = document.getElementById("wachtwoord").value;
    const herhaalWachtwoord = document.getElementById("wachtwoord_herhaling-input").value;

    // 🚨 Controleer of wachtwoorden overeenkomen
    if (wachtwoord !== herhaalWachtwoord) {
        alert("❌ Wachtwoorden komen niet overeen!");
        return;
    }

    try {
        // ✅ Dynamische backend URL (werkt lokaal én op Render)
        const baseUrl = window.location.origin.includes("localhost") 
            ? "http://localhost:3000" 
            : "https://wpl-1pro-d2-elite-4.onrender.com";

        console.log("🔍 Registratie-verzoek naar:", baseUrl + "/api/register");

        // ✅ Verstuur API-verzoek naar backend
        const response = await fetch(baseUrl + "/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ naam, email, wachtwoord, collection: [] }),
            credentials: "include" // ✅ Zorg dat cookies correct worden verwerkt
        });

        console.log("📌 Server antwoord status:", response.status);

        // 🚨 Controleer of de server fout geeft
        if (!response.ok) {
            throw new Error(`❌ Server fout: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Server response:", data);

        // ✅ Check of registratie succesvol is
        if (data.email) {
            alert("✅ Registratie geslaagd!");
            localStorage.setItem("loggedInUser", JSON.stringify({ naam, email, collection: [] }));
            console.log("🎉 Gebruiker opgeslagen in localStorage:", data.email);
            window.location.href = "index.html"; // ✅ Redirect naar homepagina
        } else {
            alert("❌ " + (data.error || "Onbekende fout"));
        }
    } catch (error) {
        console.error("❌ Fout bij registratie:", error.message);
        alert("❌ Fout bij registratie: " + error.message);
    }
});