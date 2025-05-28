document.addEventListener("DOMContentLoaded", async () => {
    let user = JSON.parse(localStorage.getItem("loggedInUser")) || {};

    // ✅ Haal de meest actuele collectie uit de database
    if (user.email) {
        const dbUser = await fetchGebruikerUitDatabase(user.email);
        user.collection = dbUser.collection || [];
        localStorage.setItem("loggedInUser", JSON.stringify(user));
    }

    console.log("🔍 Gebruiker na database check:", user);
    console.log("✅ Collectie lengte:", user.collection.length);

    document.getElementById("niet-ingelogged").style.display = user.collection.length === 0 ? "block" : "none";
    document.getElementById("well-ingelogged").style.display = user.collection.length > 0 ? "block" : "none";

    if (user.collection.length === 0) {
        genereerStarterPokemon();
    }
});

// ✅ Haal gebruiker uit database
async function fetchGebruikerUitDatabase(email) {
    try {
        const response = await fetch("https://wpl-1pro-d2-elite-4.onrender.com/api/getUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`❌ Server fout: ${response.status}`);
        }

        const data = await response.json();
        return data.user || {};
    } catch (error) {
        console.error("❌ Fout bij ophalen van gebruiker:", error.message);
        return {};
    }
}

// ✅ Genereer de 3 starter-Pokémon
async function genereerStarterPokemon() {
    const pokemonContainer = document.getElementById("pokemon-container");
    const popup = document.getElementById("popup");
    const popupText = document.getElementById("popup-text");
    const popupYes = document.getElementById("popup-yes");
    const popupNo = document.getElementById("popup-no");

    if (!pokemonContainer) {
        console.error("❌ 'pokemon-container' bestaat niet in de DOM.");
        return;
    }

    console.log("🔍 Starter Pokémon worden gegenereerd...");

    const starterIds = [1, 4, 7]; // Bulbasaur, Charmander, Squirtle

    for (const id of starterIds) {
        try {
            console.log(`🌐 Ophalen van Pokémon met ID: ${id}`);
            const pokemon = await haalPokemonGegevensOp(id);
            
            if (!pokemon) {
                console.error(`❌ Geen gegevens gevonden voor Pokémon ID: ${id}`);
                continue;
            }

            console.log(`✅ Pokémon gevonden: ${pokemon.name} (ID: ${pokemon.id})`);
            
            const div = document.createElement("div");
            div.className = "starter-pokemon";
            div.innerHTML = `
                <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" style="width: 250px; height: 250px;">
                <p><strong>${pokemon.name}</strong></p>
            `;
            
            div.onclick = () => {
                console.log(`🟡 Gebruiker klikt op ${pokemon.name}`);
                popup.style.display = "flex";
                popupText.innerHTML = `Wilt u ${pokemon.name} als uw starter Pokémon kiezen?<br>
                <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" style="width: 150px; height: 150px;">`;

                popupYes.onclick = async () => {
                    console.log(`🟢 Gebruiker kiest ${pokemon.name} als starter!`);
                    popup.style.display = "none";
                    document.getElementById("niet-ingelogged").style.display = "none";
                    document.getElementById("well-ingelogged").style.display = "block";

                    // ✅ Haal moves en stats op
                    const moves = await haalStarterMoves(pokemon.id);
                    const stats = await haalPokemonStats(pokemon.id);

                    console.log("📌 Moves geselecteerd:", moves);
                    console.log("📌 Stats opgehaald:", stats);

                    // ✅ Voeg starter toe aan gebruiker
                    let user = JSON.parse(localStorage.getItem("loggedInUser")) || {};
                    user.collection = user.collection || [];
                    user.collection.push({
                        pokemon_name: pokemon.name,
                        pokemon_id: pokemon.id,
                        sprite: pokemon.sprites.front_default,
                        level: 5,
                        wins: 0,
                        loses: 0,
                        stats: stats,
                        isBuddy: true,
                        moves: moves
                    });

                    localStorage.setItem("loggedInUser", JSON.stringify(user));
                    console.log("✅ Starter opgeslagen in localStorage:", user.collection);

                    // ✅ Update gebruiker in database
                    await updateUserInDatabase(user.email, user.collection);
                };

                popupNo.onclick = () => {
                    console.log("🔴 Gebruiker weigert starter Pokémon");
                    popup.style.display = "none";
                };
            };
            
            pokemonContainer.appendChild(div);
        } catch (error) {
            console.error(`❌ Fout bij ophalen van Pokémon ID ${id}:`, error);
        }
    }
}

// ✅ Haal Pokémon-statistieken op
async function haalPokemonStats(pokemonID) {
    try {
        const antwoord = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonID}`);
        if (!antwoord.ok) {
            throw new Error(`Kon de Pokémon niet ophalen met ID: ${pokemonID}`);
        }

        const data = await antwoord.json();
        return {
            pokemon_name: data.name,
            pokemon_id: data.id,
            sprite: data.sprites.front_default,
            hp: data.stats[0].base_stat,
            attack: data.stats[1].base_stat,
            defense: data.stats[2].base_stat,
            special_attack: data.stats[3].base_stat,
            special_defense: data.stats[4].base_stat,
            speed: data.stats[5].base_stat
        };
    } catch (error) {
        console.error("❌ Fout bij ophalen van stats:", error);
        return {};
    }
}

// ✅ Update gebruiker in database
async function updateUserInDatabase(email, collection) {
    try {
        const response = await fetch("https://wpl-1pro-d2-elite-4.onrender.com/api/updateUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, collection }),
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`❌ Server fout: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Gebruiker succesvol bijgewerkt:", data);
    } catch (error) {
        console.error("❌ Fout bij updaten van gebruiker:", error.message);
    }
}