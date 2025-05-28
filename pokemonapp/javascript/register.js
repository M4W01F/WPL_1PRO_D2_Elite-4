document.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const naam = document.getElementById("naam-input").value.trim();
    const email = document.getElementById("email-input").value.trim();
    const wachtwoord = document.getElementById("wachtwoord").value;
    const herhaalWachtwoord = document.getElementById("wachtwoord_herhaling-input").value;

    if (wachtwoord !== herhaalWachtwoord) {
        alert("❌ Wachtwoorden komen niet overeen!");
        return;
    }

    try {
        const response = await fetch("https://elite4-app.onrender.com/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ naam, email, wachtwoord, collection: [] })
        });

        if (response.headers.get("content-type")?.includes("text/html")) {
            throw new Error("❌ Server antwoordde met HTML. Controleer of de API correct is.");
        }

        const data = await response.json();
        if (response.ok) {
            alert("✅ Registratie geslaagd!");
            localStorage.setItem("loggedInUser", JSON.stringify({ naam, email, collection: [] }));
            window.location.href = "index.html";
        } else {
            alert("❌ " + data.error);
        }
    } catch (error) {
        alert("❌ Fout bij registratie: " + error.message);
    }
});