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
        const response = await fetch("/api/getUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`Kan gebruiker niet ophalen. Status: ${response.status}`);
        }

        const data = await response.json();
        const user = data.user;

        if (!user || !user.collection || !Array.isArray(user.collection)) {
            console.error("Geen geldige collectie gevonden in database!");
            return null;
        }

        return user.collection.find(pokemon => pokemon.isBuddy === true) || null;

    } catch (error) {
        console.error("Fout bij ophalen van Buddy-Pokémon:", error);
        return null;
    }
}

// Globale variabelen voor laatst gevangen Pokémon
let laatstGevangenPokemon = null;
let laatstGevangenStats = null;
let laatstGevangenLevel = null;
let laatstGevangenBuddy = null;

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
        laatstGevangenBuddy = buddyPokemon;

        // ✅ Dynamisch berekend level
        const levelVariatie = [-3, -2, -1, 0, 1, 2, 3][Math.floor(Math.random() * 7)];
        const pokemonLevel = Math.max(1, buddyPokemon.level + levelVariatie);

        // ✅ Dynamisch berekende stats
        let opponentStats = {
            hp: pokemonData.stats[0].base_stat,
            attack: pokemonData.stats[1].base_stat,
            defense: pokemonData.stats[2].base_stat,
            special_attack: pokemonData.stats[3].base_stat,
            special_defense: pokemonData.stats[4].base_stat,
            speed: pokemonData.stats[5].base_stat
        };

        for (let i = 1; i <= pokemonLevel; i++) {
            opponentStats.hp += opponentStats.hp / 50;
            opponentStats.attack += opponentStats.attack / 50;
            opponentStats.defense += opponentStats.defense / 50;
            opponentStats.speed += opponentStats.speed / 50;
            opponentStats.special_attack += opponentStats.special_attack / 50;
            opponentStats.special_defense += opponentStats.special_defense / 50;
        }

        laatstGevangenPokemon = pokemonData;
        laatstGevangenStats = opponentStats;
        laatstGevangenLevel = pokemonLevel;

        console.log(`[DEBUG] - Final Pokémon Level: ${pokemonLevel}`);
        console.log("[DEBUG] - Tegenstander stats berekend:", opponentStats);

        // ✅ Bereken vangkans op basis van Buddy stats
        const catchChance = Math.min(95, (100 - opponentStats.defense + buddyPokemon.stats.attack) % 100);
        console.log(`[DEBUG] - Vangkans berekend: ${catchChance}%`);

    } catch (error) {
        console.error("Fout bij vangproces:", error);
        alert(error.message);
    }
}

// ✅ Pokéball event listener
document.getElementById("pokeball").addEventListener("click", async () => {
    const kansen = document.getElementById("kansen");
    let aantalKansen = parseInt(kansen.textContent);

    if (aantalKansen > 0) {
        aantalKansen--;

        // ✅ Bereken dynamische vangkans
        const vangstKans = Math.min(95, (100 - laatstGevangenStats.defense + laatstGevangenBuddy.stats.attack) % 100);
        const vangstGeslaagd = Math.random() * 100 < vangstKans;

        console.log(`[DEBUG] - Vangkans: ${vangstKans}% | Resultaat: ${vangstGeslaagd ? "SUCCES" : "MISLUKT"}`);

        if (vangstGeslaagd) {
            document.getElementById("popup").style.display = "block";
        } else {
            if (aantalKansen === 0) {
                window.location.href = "./index.html";
            } else {
                alert("Niet gelukt! Probeer opnieuw.");
            }
        }
    }
});

// ✅ Popup event listeners
document.getElementById("popup-yes").addEventListener("click", () => {
    document.getElementById("popup").style.display = "none";
    document.getElementById("bijnaam-panel").style.display = "block";
});

document.getElementById("popup-no").addEventListener("click", async () => {
    document.getElementById("popup").style.display = "none";
    await voegPokemonToeAanCollectie(laatstGevangenPokemon, laatstGevangenStats, laatstGevangenLevel, "");
    window.location.href = "./index.html";
});

// ✅ Event Listener voor bijnaam
document.getElementById("submit-bijnaam").addEventListener("click", async () => {
    const nicknameInput = document.getElementById("pokemon-bijnaam").value.trim();
    const nickname = nicknameInput !== "" ? nicknameInput : "";

    await voegPokemonToeAanCollectie(laatstGevangenPokemon, laatstGevangenStats, laatstGevangenLevel, nickname);
    window.location.href = "./index.html";
});