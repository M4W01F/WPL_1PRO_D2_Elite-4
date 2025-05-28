document.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();

    // ✅ Haal invoerwaarden uit `inlog.html`
    const emailOrUsername = document.getElementById("login-input").value.trim();
    const wachtwoord = document.getElementById("login-password").value;

    try {
        // ✅ Dynamische URL (werkt lokaal en op Render)
        const baseUrl = window.location.origin.includes("localhost") 
            ? "http://localhost:3000" 
            : "https://elite4-app.onrender.com";

        console.log("🔍 Login-verzoek naar:", baseUrl + "/api/login");

        // ✅ Verstuur login-verzoek naar de server met extra headers
        const response = await fetch(baseUrl + "/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ emailOrUsername, wachtwoord }),
            credentials: "include" // ✅ Nodig voor cookies
        });

        console.log("📌 Server antwoord status:", response.status);

        if (!response.ok) {
            throw new Error(`❌ Server fout: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Server response:", data);

        if (data.user) {
            alert("✅ Inloggen succesvol!");
            localStorage.setItem("loggedInUser", JSON.stringify(data.user));
            console.log("🎉 Gebruiker opgeslagen in localStorage:", data.user);
            window.location.href = "index.html"; // ✅ Redirect naar homepagina
        } else {
            console.error("❌ Login mislukt:", data.error);
            alert("❌ " + (data.error || "Onbekende fout"));
        }
    } catch (error) {
        console.error("❌ Fout bij inloggen:", error.message);
        alert("❌ Fout bij inloggen: " + error.message);
    }
});