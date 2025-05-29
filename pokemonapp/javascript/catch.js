// Haal de stats van de huidige Buddy-Pokémon uit de collectie
async function haalBuddyUitCollectie(email) {
    try {
        console.log(`[DEBUG] - Start ophalen van Buddy-Pokémon voor gebruiker: ${email}`);

        const response = await fetch("/api/getUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`[ERROR] - Kan gebruiker niet ophalen. Status: ${response.status}`);
        }

        const data = await response.json();
        const user = data.user;

        if (!user || !user.collection || !Array.isArray(user.collection)) {
            console.error("[ERROR] - Geen geldige collectie gevonden in database!");
            return null;
        }

        const buddyPokemon = user.collection.find(pokemon => pokemon.isBuddy === true);

        if (!buddyPokemon) {
            console.error("[ERROR] - Geen buddy Pokémon gevonden.");
            return null;
        }

        console.log("[DEBUG] - Buddy-Pokémon geladen:", buddyPokemon);
        return buddyPokemon;

    } catch (error) {
        console.error("[ERROR] - Fout bij ophalen van Buddy-Pokémon:", error);
        return null;
    }
}

// Start het vangen van een Pokémon
async function startCatch(pokemonName) {
    try {
        console.log("[DEBUG] - Start vangproces...");

        const selectedPokemonName = document.getElementById("pokemon-selector").value.toLowerCase() || pokemonName;
        console.log(`[DEBUG] - Geselecteerde Pokémon: ${selectedPokemonName}`);

        if (!selectedPokemonName) {
            alert("Typ de naam van een Pokémon om te beginnen.");
            return;
        }

        // ✅ Haal Buddy Pokémon op
        const email = JSON.parse(localStorage.getItem("loggedInUser")).email;
        const buddy = await haalBuddyUitCollectie(email);

        if (!buddy) {
            alert("Geen actieve Buddy-Pokémon gevonden.");
            return;
        }

        // ✅ Haal tegenstander data van PokeAPI
        console.log(`[DEBUG] - Ophalen data voor tegenstander Pokémon: ${selectedPokemonName}`);
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${selectedPokemonName}/`);

        if (!response.ok) {
            throw new Error(`[ERROR] - Pokémon "${selectedPokemonName}" niet gevonden. Status: ${response.status}`);
        }

        const opponentPokemon = await response.json();
        console.log("[DEBUG] - Tegenstander Pokémon data geladen:", opponentPokemon);

        // ✅ Dynamisch berekende stats op basis van Buddy-Pokémon
        let opponentStats = {
            hp: opponentPokemon.stats[0].base_stat + buddy.stats.hp / 10,
            attack: opponentPokemon.stats[1].base_stat + buddy.stats.attack / 10,
            defense: opponentPokemon.stats[2].base_stat + buddy.stats.defense / 10,
            special_attack: opponentPokemon.stats[3].base_stat + buddy.stats.special_attack / 10,
            special_defense: opponentPokemon.stats[4].base_stat + buddy.stats.special_defense / 10,
            speed: opponentPokemon.stats[5].base_stat + buddy.stats.speed / 10
        };

        console.log("[DEBUG] - Tegenstander stats berekend:", opponentStats);

        // ✅ Bereken vangkans op basis van Buddy stats
        const catchChance = Math.min(95, (100 - opponentStats.defense + buddy.stats.attack) % 100);
        console.log(`[DEBUG] - Vangkans berekend: ${catchChance}%`);

        // ✅ Update UI
        document.getElementById("catch-interface").style.display = "block";
        document.getElementById("pokemon-naam").textContent = `Naam: ${opponentPokemon.name}`;
        document.getElementById("pokemon-level").textContent = `Level: ${buddy.level}`;
        document.getElementById("pokemon-image").innerHTML = `<img src="${opponentPokemon.sprites.front_default}" alt="${opponentPokemon.name}">`;

        document.getElementById("pokeball").addEventListener("click", async () => {
            console.log("[DEBUG] - Pokéball wordt gebruikt...");
            const kansen = document.getElementById("kansen");
            let aantalKansen = parseInt(kansen.textContent);

            if (aantalKansen > 0) {
                aantalKansen--;
                kansen.textContent = aantalKansen;

                const vangstGeslaagd = Math.random() * 100 < catchChance;
                console.log(`[DEBUG] - Vangpoging: ${vangstGeslaagd ? "Geslaagd" : "Mislukt"}`);

                if (vangstGeslaagd) {
                    alert("Gevangen! Geef je Pokémon een bijnaam.");
                    document.getElementById("bijnaam-panel").style.display = "block";

                    await voegPokemonToeAanCollectie(opponentPokemon, opponentStats, buddy.level);
                } else {
                    if (aantalKansen === 0) {
                        alert("Geen kansen meer. Je wordt teruggeleid naar de hoofdpagina.");
                        window.location.href = "./index.html";
                    } else {
                        alert("Niet gelukt. Probeer opnieuw.");
                    }
                }
            }
        });

    } catch (error) {
        console.error("[ERROR] - Fout bij vangproces:", error);
        alert(error.message);
    }
}

// Voeg Pokémon toe aan de collectie, maar zet isBuddy op false
async function voegPokemonToeAanCollectie(pokemonData, opponentStats, level) {
    try {
        console.log("[DEBUG] - Pokémon toevoegen aan collectie:", pokemonData.name);

        const email = JSON.parse(localStorage.getItem("loggedInUser")).email;

        const pokemon = {
            pokemon_name: pokemonData.name,
            pokemon_id: pokemonData.id,
            nickname: document.getElementById("pokemon-bijnaam").value || "",
            sprite: pokemonData.sprites.front_default,
            level: level, // Gebruik level van buddy Pokémon
            wins: 0,
            loses: 0,
            stats: opponentStats,
            isBuddy: false,
            moves: await haalStarterMoves(pokemonData.id)
        };

        console.log("[DEBUG] - Verstuur Pokémon data:", pokemon);

        const response = await fetch("/api/addPokemonToCollection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, collection: [pokemon] }),
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`[ERROR] - Kan Pokémon niet toevoegen. Status: ${response.status}`);
        }

        console.log("[DEBUG] - Pokémon succesvol toegevoegd.");
    } catch (error) {
        console.error("[ERROR] - Fout bij toevoegen van Pokémon aan collectie:", error);
    }
}