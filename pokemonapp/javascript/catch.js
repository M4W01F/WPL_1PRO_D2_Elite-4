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

// Start het vangen van een Pokémon
async function startCatch(pokemonName) {
    const selectedPokemonName = document.getElementById("pokemon-selector").value.toLowerCase() || pokemonName;

    if (!selectedPokemonName) {
        alert("Typ de naam van een Pokémon om te beginnen!");
        return;
    }

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${selectedPokemonName}/`);
        if (!response.ok) {
            throw new Error(`Pokémon met de naam "${selectedPokemonName}" kon niet worden gevonden.`);
        }
        const pokemonData = await response.json();

        const email = JSON.parse(localStorage.getItem("loggedInUser")).email;
        const buddyPokemon = await haalBuddyUitCollectie(email);
        if (!buddyPokemon) {
            alert("Geen actieve Buddy-Pokémon gevonden.");
            return;
        }

        const levelVariatie = [-3, -2, -1, 0, 1, 2, 3][Math.floor(Math.random() * 7)];
        const pokemonLevel = Math.max(1, buddyPokemon.level + levelVariatie);

        let opponentStats = {
            hp: Math.round(pokemonData.stats[0].base_stat),
            attack: Math.round(pokemonData.stats[1].base_stat),
            defense: Math.round(pokemonData.stats[2].base_stat),
            special_attack: Math.round(pokemonData.stats[3].base_stat),
            special_defense: Math.round(pokemonData.stats[4].base_stat),
            speed: Math.round(pokemonData.stats[5].base_stat)
        };

        document.getElementById("pokemon-naam").textContent = `Naam: ${pokemonData.name}`;
        document.getElementById("pokemon-level").textContent = `Level: ${pokemonLevel}`;
        document.getElementById("pokemon-image").innerHTML = `<img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}" />`;

        document.getElementById("setup-container").style.display = "none";
        document.getElementById("catch-interface").style.display = "block";

        // ✅ Sla opponentStats en Buddy direct op voor vangstkans berekening
        document.getElementById("pokeball").addEventListener("click", async () => {
            const kansen = document.getElementById("kansen");
            let aantalKansen = parseInt(kansen.textContent);

            if (aantalKansen > 0) {
                aantalKansen--;

                kansen.textContent = aantalKansen;

                const vangstKans = Math.min(95, (100 - opponentStats.defense + buddyPokemon.stats.attack) % 100);
                const vangstGeslaagd = Math.random() * 100 < vangstKans;

                if (vangstGeslaagd) {
                    document.getElementById("popup").style.display = "flex";
                } else {
                    if (aantalKansen === 0) {
                        window.location.href = "./index.html";
                    } else {
                        alert("Niet gelukt! Probeer opnieuw.");
                    }
                }
            }
        });

        document.getElementById("popup-yes").addEventListener("click", () => {
            document.getElementById("popup").style.display = "none";
            document.getElementById("bijnaam-panel").style.display = "block";
        });

        document.getElementById("popup-no").addEventListener("click", async () => {
            document.getElementById("popup").style.display = "none";
            await voegPokemonToeAanCollectie(pokemonData, opponentStats, pokemonLevel, "");
            window.location.href = "./index.html";
        });

    } catch (error) {
        console.error("Fout bij vangproces:", error);
        alert(error.message);
    }
}

// Event Listener voor bijnaam
document.getElementById("submit-bijnaam").addEventListener("click", async () => {
    const nicknameInput = document.getElementById("pokemon-bijnaam").value.trim();
    const nickname = nicknameInput !== "" ? nicknameInput : "";

    await voegPokemonToeAanCollectie(laatstGevangenPokemon, laatstGevangenStats, laatstGevangenLevel, nickname);
    window.location.href = "./index.html";
});

async function voegPokemonToeAanCollectie(pokemonData, opponentStats, level, nickname) {
    try {
        console.log("[DEBUG] - Pokémon toevoegen of updaten in collectie:", pokemonData.name);

        const email = JSON.parse(localStorage.getItem("loggedInUser")).email;

        // Haal bestaande gebruiker op
        const response = await fetch("/api/getUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
            credentials: "include"
        });

        const data = await response.json();
        const user = data.user;

        // Controleer of Pokémon al in de collectie zit
        const bestaandePokemonIndex = user.collection.findIndex(pokemon =>
            pokemon.pokemon_id === pokemonData.id || pokemon.pokemon_name.toLowerCase() === pokemonData.name.toLowerCase()
        );

        if (bestaandePokemonIndex !== -1) {
            // Pokémon bestaat al, update gegevens
            console.log("[DEBUG] - Pokémon bestaat al, gegevens worden bijgewerkt.");
            user.collection[bestaandePokemonIndex].level = level;
            user.collection[bestaandePokemonIndex].nickname = nickname || user.collection[bestaandePokemonIndex].nickname;
            user.collection[bestaandePokemonIndex].stats = opponentStats;
            user.collection[bestaandePokemonIndex].wins += 1; // Optionele verbetering: wins bijhouden
        } else {
            // Pokémon bestaat nog niet, voeg toe aan collectie
            console.log("[DEBUG] - Nieuwe Pokémon wordt toegevoegd.");
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
                moves: await haalMoves(pokemonData.id)
            };
            user.collection.push(nieuwePokemon);
        }

        // Update de database met de bijgewerkte collectie
        const updateResponse = await fetch("/api/updateUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, collection: user.collection }),
            credentials: "include"
        });

        console.log("[DEBUG] - Pokémon collectie succesvol geüpdatet.");

    } catch (error) {
        console.error("[ERROR] - Fout bij toevoegen/updaten van Pokémon:", error);
    }
}

async function haalMoves(pokemonID) {
    try {
        console.log(`🌐 Haal moves op voor Pokémon ID: ${pokemonID}`);
        const antwoord = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonID}`);

        if (!antwoord.ok) {
            throw new Error(`❌ Kan moves niet ophalen voor ID: ${pokemonID} - Status: ${antwoord.status}`);
        }

        const data = await antwoord.json();
        const pokemonType = data.types.map(t => t.type.name);
        let moveSet = new Map();

        for (const moveData of data.moves) {
            for (const detail of moveData.version_group_details) {
                if (detail.move_learn_method.name === "level-up" && detail.level_learned_at > 0) {
                    const moveResponse = await fetch(`https://pokeapi.co/api/v2/move/${moveData.move.name}`);
                    const moveInfo = await moveResponse.json();

                    if (moveInfo.power > 0 && !moveSet.has(moveInfo.name)) {
                        moveSet.set(moveInfo.name, {
                            name: moveInfo.name,
                            power: moveInfo.power,
                            accuracy: moveInfo.accuracy,
                            priority: moveInfo.priority,
                            type: moveInfo.type.name,
                            damage_class: moveInfo.damage_class.name,
                            effect: moveInfo.effect_entries.length > 0 
                                ? moveInfo.effect_entries[0].effect 
                                : "Geen effect",
                        });
                    }
                }
            }
        }

        let selectedMoves = Array.from(moveSet.values()).slice(0, 4); // ✅ Converteer Map naar Array

        // ✅ Vul aan met type-moves als er minder dan 4 unieke moves zijn
        if (selectedMoves.length < 4) {
            for (const moveData of data.moves) {
                const moveResponse = await fetch(`https://pokeapi.co/api/v2/move/${moveData.move.name}`);
                const moveInfo = await moveResponse.json();

                if (moveInfo.power > 0 && pokemonType.includes(moveInfo.type.name) && !moveSet.has(moveInfo.name)) {
                    moveSet.set(moveInfo.name, {
                        name: moveInfo.name,
                        power: moveInfo.power,
                        accuracy: moveInfo.accuracy,
                        priority: moveInfo.priority,
                        type: moveInfo.type.name,
                        damage_class: moveInfo.damage_class.name,
                        effect: moveInfo.effect_entries.length > 0 
                            ? moveInfo.effect_entries[0].effect 
                            : "Geen effect",
                    });
                }

                if (moveSet.size === 4) break;
            }

            selectedMoves = Array.from(moveSet.values()).slice(0, 4); // ✅ Zorgt ervoor dat we precies 4 moves hebben
        }

        console.log("📌 Unieke moves geselecteerd:", selectedMoves);
        return selectedMoves;
    } catch (error) {
        console.error(`❌ Fout bij ophalen van moves:`, error);
        return [];
    }
}
