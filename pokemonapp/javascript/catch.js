const isOverwrite = false;

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
    console.log("[DEBUG] - startCatch() gestart met parameter:", pokemonName);

    let selectedPokemonName = pokemonName || document.getElementById("pokemon-selector").value;
    if (!selectedPokemonName || typeof selectedPokemonName !== "string") {
        console.error("[DEBUG] - Ongeldige Pokémon naam:", selectedPokemonName);
        alert("Typ de naam van een Pokémon om te beginnen!");
        return;
    }

    selectedPokemonName = selectedPokemonName.toLowerCase();
    console.log("[DEBUG] - Verwerkte Pokémon naam:", selectedPokemonName);

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${selectedPokemonName}/`);
        if (!response.ok) {
            throw new Error(`Pokémon met de naam "${selectedPokemonName}" kon niet worden gevonden.`);
        }
        const pokemonData = await response.json();
        console.log("[DEBUG] - Pokémon gegevens geladen:", pokemonData.name);

        const email = JSON.parse(localStorage.getItem("loggedInUser")).email;
        const userResponse = await fetch("/api/getUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
            credentials: "include"
        });

        if (!userResponse.ok) {
            throw new Error("Gebruikersgegevens konden niet worden geladen.");
        }

        const userData = await userResponse.json();
        const userCollection = userData.user.collection;
        console.log("[DEBUG] - Gebruikers collectie geladen:", userCollection);

        const isDuplicate = userCollection.some(pokemon => pokemon.pokemon_name && pokemon.pokemon_name.toLowerCase() === selectedPokemonName);
        console.log("[DEBUG] - Is deze Pokémon een duplicaat?", isDuplicate);

        if (isDuplicate) {
            console.log("[DEBUG] - Pokémon is al gevangen. Toon duplicate-popup.");
            document.getElementById("duplicate-popup").style.display = "flex";

            document.getElementById("duplicate-popup-yes").addEventListener("click", () => {
                console.log("[DEBUG] - Gebruiker kiest overschrijven.");
                isOverwrite = true;
                document.getElementById("duplicate-popup").style.display = "none";
                catchProcess(pokemonData, email);
            });

            document.getElementById("duplicate-popup-no").addEventListener("click", () => {
                console.log("[DEBUG] - Gebruiker kiest niet overschrijven, pagina herladen.");
                window.location.reload();
            });

            return;
        }

        catchProcess(pokemonData, email);

    } catch (error) {
        console.error("[DEBUG] - Fout bij vangproces:", error);
        alert(error.message);
    }
}

function catchProcess(pokemonData, email) {
    try {
        console.log("[DEBUG] - Start vangproces voor:", pokemonData.name);

        const buddyPokemon = haalBuddyUitCollectie(email);
        if (!buddyPokemon) {
            console.error("[DEBUG] - Geen actieve Buddy-Pokémon gevonden!");
            alert("Geen actieve Buddy-Pokémon gevonden.");
            return;
        }

        console.log("[DEBUG] - Buddy Pokémon geladen uit database:", buddyPokemon);

        const pokemonLevel = buddyPokemon.level + [-3, -2, -1, 0, 1, 2, 3][Math.floor(Math.random() * 7)];
        console.log("[DEBUG] - Tegenstander Level berekend:", pokemonLevel);

        let opponentStats = {
            hp: Math.round(pokemonData.stats[0].base_stat),
            attack: Math.round(pokemonData.stats[1].base_stat),
            defense: Math.round(pokemonData.stats[2].base_stat),
            special_attack: Math.round(pokemonData.stats[3].base_stat),
            special_defense: Math.round(pokemonData.stats[4].base_stat),
            speed: Math.round(pokemonData.stats[5].base_stat)
        };

        for (let i = 1; i <= pokemonLevel; i++) {
            opponentStats.hp = Math.round(opponentStats.hp + opponentStats.hp / 50);
            opponentStats.attack = Math.round(opponentStats.attack + opponentStats.attack / 50);
            opponentStats.defense = Math.round(opponentStats.defense + opponentStats.defense / 50);
            opponentStats.speed = Math.round(opponentStats.speed + opponentStats.speed / 50);
            opponentStats.special_attack = Math.round(opponentStats.special_attack + opponentStats.special_attack / 50);
            opponentStats.special_defense = Math.round(opponentStats.special_defense + opponentStats.special_defense / 50);
        }

        console.log("[DEBUG] - Tegenstander Stats berekend:", opponentStats);

        document.getElementById("pokemon-naam").textContent = `Naam: ${pokemonData.name}`;
        document.getElementById("pokemon-level").textContent = `Level: ${pokemonLevel}`;
        document.getElementById("pokemon-image").innerHTML = `
            <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}" />
        `;

        document.getElementById("setup-container").style.display = "none";
        document.getElementById("catch-interface").style.display = "block";
        console.log("[DEBUG] - Catch Interface getoond.");

    } catch (error) {
        console.error("[DEBUG] - Fout bij voortzetting van vangproces:", error);
    }
}

// ✅ Pokéball event listener
document.getElementById("pokeball").addEventListener("click", async () => {
    const kansen = document.getElementById("kansen");
    let aantalKansen = parseInt(kansen.textContent);

    if (aantalKansen > 0) {
        aantalKansen--;

        const vangstKans = Math.min(95, (100 - laatstGevangenStats.defense + laatstGevangenBuddy.stats.attack) % 100);
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

async function voegPokemonToeAanCollectie(pokemonData, opponentStats, level, nickname) {
    try {
        console.log("[DEBUG] - Pokémon toevoegen aan collectie:", pokemonData.name);

        const email = JSON.parse(localStorage.getItem("loggedInUser")).email;

        // ✅ Haal bestaande gebruiker en collectie op
        const response = await fetch("/api/getUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
            credentials: "include"
        });

        const data = await response.json();
        const user = data.user;

        if (!user || !user.collection) {
            throw new Error("Geen geldige gebruiker of collectie gevonden.");
        }

        // ✅ Controleer of Pokémon al in de collectie zit
        const existingPokemonIndex = user.collection.findIndex(pokemon => pokemon.pokemon_name.toLowerCase() === pokemonData.name.toLowerCase());

        if (existingPokemonIndex !== -1 && isOverwrite) {
            // ✅ Overschrijf bestaande Pokémon
            console.log("[DEBUG] - Pokémon bestaat al, overschrijven...");
            user.collection[existingPokemonIndex] = {
                pokemon_name: pokemonData.name,
                pokemon_id: pokemonData.id,
                nickname: nickname || user.collection[existingPokemonIndex].nickname, // Behoud bestaande bijnaam als niet aangepast
                sprite: pokemonData.sprites.front_default,
                level: level,
                wins: user.collection[existingPokemonIndex].wins, // Behoud winststatistieken
                loses: user.collection[existingPokemonIndex].loses, // Behoud verliesstatistieken
                stats: opponentStats,
                isBuddy: user.collection[existingPokemonIndex].isBuddy, // Behoud Buddy-status
                moves: await haalMoves(pokemonData.id)
            };
        } else if (existingPokemonIndex === -1) {
            // ✅ Voeg nieuwe Pokémon toe als hij nog niet bestaat
            console.log("[DEBUG] - Pokémon bestaat nog niet, toevoegen...");
            user.collection.push({
                pokemon_name: pokemonData.name,
                pokemon_id: pokemonData.id,
                nickname: nickname || "",
                sprite: pokemonData.sprites.front_default,
                level: level,
                wins: 0,
                loses: 0,
                stats: opponentStats,
                isBuddy: false, // ✅ Pokémon wordt toegevoegd als geen Buddy
                moves: await haalMoves(pokemonData.id)
            });
        } else {
            console.log("[DEBUG] - Geen wijziging aangebracht.");
            return;
        }

        // ✅ Update de database met de aangepaste collectie
        const updateResponse = await fetch("/api/updateUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, collection: user.collection }),
            credentials: "include"
        });

        if (!updateResponse.ok) {
            throw new Error("Fout bij het updaten van de database.");
        }

        console.log("[DEBUG] - Pokémon succesvol toegevoegd/aangepast in de database.");

    } catch (error) {
        console.error("[ERROR] - Fout bij toevoegen of aanpassen van Pokémon in collectie:", error);
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
        const pokemonType = data.types.map(t => t.type.name); // ✅ Haal het type van de Pokémon op
        let moveSet = new Map(); // ✅ Gebruik een Map om duplicaten te voorkomen

        // ✅ Zoek alle unieke level-up moves met power > 0
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
