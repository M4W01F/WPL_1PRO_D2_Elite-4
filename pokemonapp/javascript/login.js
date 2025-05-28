document.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();

    // ✅ Haal invoerwaarden uit `inlog.html`
    const emailOrUsername = document.getElementById("login-input").value.trim(); // ✅ Trim whitespace
    const wachtwoord = document.getElementById("login-password").value;

    try {
        // ✅ Verstuur login-verzoek naar de server
        const response = await fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ emailOrUsername, wachtwoord })
        });

        const data = await response.json();
        if (response.ok) {
            alert("✅ Inloggen succesvol!");
            localStorage.setItem("loggedInUser", JSON.stringify(data.user));
            window.location.href = "index.html"; // ✅ Redirect naar homepagina
        } else {
            alert("❌ " + data.error);
        }
    } catch (error) {
        alert("❌ Fout bij inloggen: " + error.message);
    }
});