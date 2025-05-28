document.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailOrUsername = document.getElementById("login-input").value.trim();
    const wachtwoord = document.getElementById("login-password").value;

    try {
        const response = await fetch("https://elite4-app.onrender.com/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ emailOrUsername, wachtwoord })
        });

        if (response.headers.get("content-type")?.includes("text/html")) {
            throw new Error("❌ Server antwoordde met HTML. Controleer of de API correct is.");
        }

        const data = await response.json();
        if (response.ok) {
            alert("✅ Inloggen succesvol!");
            localStorage.setItem("loggedInUser", JSON.stringify(data.user));
            window.location.href = "index.html";
        } else {
            alert("❌ " + data.error);
        }
    } catch (error) {
        alert("❌ Fout bij inloggen: " + error.message);
    }
});