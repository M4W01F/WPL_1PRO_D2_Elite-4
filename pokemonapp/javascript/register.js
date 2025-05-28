document.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();

    // Haal de invoerwaarden uit `register.html`
    const naam = document.getElementById("naam-input").value;
    const email = document.getElementById("email-input").value;
    const wachtwoord = document.getElementById("wachtwoord").value;
    const herhaalWachtwoord = document.getElementById("wachtwoord_herhaling-input").value;

    // Controleer of wachtwoorden overeenkomen
    if (wachtwoord !== herhaalWachtwoord) {
        alert("❌ Wachtwoorden komen niet overeen!");
        return;
    }

    try {
        // Stuur gegevens naar Express-server (MongoDB)
        const response = await fetch("http://localhost:3000/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ naam, email, wachtwoord, collection: [] }) // Lege collectie
        });

        const data = await response.json();
        if (response.ok) {
            alert("Registratie succesvol!");

            // Sla ingelogde gebruiker op in `localStorage`
            localStorage.setItem("loggedInUser", JSON.stringify({ naam, email, collection: [] }));

            // Redirect naar `index.html`
            window.location.href = "index.html";
        } else {
            alert("❌ " + data.error);
        }
    } catch (error) {
        alert("❌ Fout bij registratie: " + error.message);
    }
});