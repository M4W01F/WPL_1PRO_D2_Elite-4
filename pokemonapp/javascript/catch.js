// Haal Pokémon naam uit pokedex
function getPokemonNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("pokemonName");
}

// Event Listener om catch te starten vanuit de pokedex
document.addEventListener("DOMContentLoaded", () => {
    const pokemonName = getPokemonNameFromURL();
    if (pokemonName) {
        startCatch(pokemonName);
    } else {
        console.error("Pokémon name is missing from the URL.");
    }
});

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

// Globale variabelen voor laatst gevangen Pokémon
let laatstGevangenPokemon = null;
let laatstGevangenStats = null;
let laatstGevangenLevel = null;

// Start het vangen van een Pokémon
async function startCatch(pokemonName) {
    const selectedPokemonName = document.getElementById("pokemon-selector").value.toLowerCase() || pokemonName;

    if (!selectedPokemonName) {
        alert("Typ de naam van een Pokémon om te beginnen!");
        return;
    }

    try {
        // ✅ Haal tegenstander data op van PokeAPI
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${selectedPokemonName}/`);
        if (!response.ok) {
            throw new Error(`Pokémon met de naam "${selectedPokemonName}" kon niet worden gevonden.`);
        }
        const pokemonData = await response.json();

        // ✅ Haal Buddy Pokémon stats uit de collectie
        const email = JSON.parse(localStorage.getItem("loggedInUser")).email;
        const buddyPokemon = await haalBuddyUitCollectie(email);
        if (!buddyPokemon) {
            alert("Geen actieve Buddy-Pokémon gevonden.");
            return;
        }

        // ✅ Dynamisch berekende stats op basis van Buddy-Pokémon
        let opponentStats = {
            hp: pokemonData.stats[0].base_stat + buddyPokemon.stats.hp / 10,
            attack: pokemonData.stats[1].base_stat + buddyPokemon.stats.attack / 10,
            defense: pokemonData.stats[2].base_stat + buddyPokemon.stats.defense / 10,
            special_attack: pokemonData.stats[3].base_stat + buddyPokemon.stats.special_attack / 10,
            special_defense: pokemonData.stats[4].base_stat + buddyPokemon.stats.special_defense / 10,
            speed: pokemonData.stats[5].base_stat + buddyPokemon.stats.speed / 10
        };

        console.log("[DEBUG] - Tegenstander stats berekend:", opponentStats);

        // ✅ Bereken vangkans op basis van Buddy stats
        const catchChance = Math.min(95, (100 - opponentStats.defense + buddyPokemon.stats.attack) % 100);
        console.log(`[DEBUG] - Vangkans berekend: ${catchChance}%`);

        // ✅ Update de interface
        document.getElementById("pokemon-naam").textContent = `Naam: ${pokemonData.name}`;
        document.getElementById("pokemon-level").textContent = `Level: ${buddyPokemon.level}`;
        document.getElementById("pokemon-image").innerHTML = `<img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}">`;

        // ✅ Pokéball event listener voor vangmechanisme
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
                    // ✅ Pokémon is gevangen! Toon de popup
                    laatstGevangenPokemon = pokemonData;
                    laatstGevangenStats = opponentStats;
                    laatstGevangenLevel = buddyPokemon.level;
                    document.getElementById("popup").style.display = "block";
                } else {
                    if (aantalKansen === 0) {
                        alert("Geen kansen meer! Je wordt teruggeleid naar de hoofdpagina.");
                        window.location.href = "./index.html";
                    } else {
                        alert("Niet gelukt! Probeer opnieuw.");
                    }
                }
            }
        });

        // ✅ Toon de interface voor vangen
        document.getElementById("setup-container").style.display = "none";
        document.getElementById("catch-interface").style.display = "block";

        console.log(`Start catching: ${pokemonData.name}`);
    } catch (error) {
        console.error("[ERROR] - Fout bij vangproces:", error);
        alert(error.message);
    }
}

// ✅ Popup event listeners
document.getElementById("popup-yes").addEventListener("click", () => {
    document.getElementById("popup").style.display = "none";
    document.getElementById("bijnaam-panel").style.display = "block";
    updateNicknameInput();
});

document.getElementById("popup-no").addEventListener("click", async () => {
    document.getElementById("popup").style.display = "none";
    await voegPokemonToeAanCollectie(laatstGevangenPokemon, laatstGevangenStats, laatstGevangenLevel, "");
});

// ✅ Functie om de bijnaam correct in te vullen
function updateNicknameInput() {
    const nicknameInput = document.getElementById("nickname-input");
    if (nicknameInput) {
        nicknameInput.value = laatstGevangenPokemon.nickname || laatstGevangenPokemon.name;
    }
}

// ✅ Voeg Pokémon toe aan de collectie
async function voegPokemonToeAanCollectie(pokemonData, opponentStats, level, nickname) {
    try {
        console.log("[DEBUG] - Pokémon toevoegen aan collectie:", pokemonData.name);

        const email = JSON.parse(localStorage.getItem("loggedInUser")).email;

        // ✅ Haal bestaande gebruiker op
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
            return;
        }

        // ✅ Nieuwe Pokémon object maken
        const nieuwePokemon = {
            pokemon_name: pokemonData.name,
            pokemon_id: pokemonData.id,
            nickname: nickname || "",
            sprite: pokemonData.sprites.front_default,
            level: level,
            wins: 0,
            loses: 0,
            stats: opponentStats,
            isBuddy: false,
            moves: await haalStarterMoves(pokemonData.id)
        };

        // ✅ Voeg de nieuwe Pokémon toe aan de bestaande collectie
        user.collection.push(nieuwePokemon);

        console.log("[DEBUG] - Geüpdatete collectie:", user.collection);

        // ✅ Update de gebruiker in de database met de nieuwe collectie
        const updateResponse = await fetch("/api/updateUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, collection: user.collection }),
            credentials: "include"
        });

        if (!updateResponse.ok) {
            throw new Error(`[ERROR] - Kan gebruiker niet updaten. Status: ${updateResponse.status}`);
        }

        console.log("[DEBUG] - Pokémon succesvol toegevoegd aan de databasecollectie.");

    } catch (error) {
        console.error("[ERROR] - Fout bij toevoegen van Pokémon aan collectie:", error);
    }
}