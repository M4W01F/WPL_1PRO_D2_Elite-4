document.addEventListener("DOMContentLoaded", async () => {
    console.log("🔍 Pagina geladen: index.js gestart!");

    let user = JSON.parse(localStorage.getItem("loggedInUser")) || {};
    console.log("📌 Gebruiker in localStorage:", user);

    // ✅ Haal de meest actuele collectie uit de database
    if (user.email) {
        console.log("🌐 Gebruiker heeft een e-mail, ophalen uit database:", user.email);
        const dbUser = await fetchGebruikerUitDatabase(user.email);
        user.collection = dbUser.collection || [];
        localStorage.setItem("loggedInUser", JSON.stringify(user));
    } else {
        console.warn("⚠️ Geen ingelogde gebruiker gevonden! Toon niet-ingelogged sectie.");
    }

    console.log("✅ Collectie na database check:", user.collection);
    console.log("📌 Collectie lengte:", user.collection.length);

    document.getElementById("niet-ingelogged").style.display = user.collection.length === 0 ? "block" : "none";
    document.getElementById("well-ingelogged").style.display = user.collection.length > 0 ? "block" : "none";

    if (user.collection.length === 0) {
        console.log("🟡 Collectie is leeg, genereer starter-Pokémon!");
        genereerStarterPokemon();
    } else {
        console.log("✅ Gebruiker heeft Pokémon in collectie, start normale weergave.");
    }
});

// ✅ Haal gebruiker uit database en log fouten
async function fetchGebruikerUitDatabase(email) {
    try {
        console.log(`🌐 Fetch gebruiker uit database voor email: ${email}`);
        const response = await fetch("https://wpl-1pro-d2-elite-4.onrender.com/api/getUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`❌ Server fout bij ophalen gebruiker: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Gebruiker succesvol opgehaald uit database:", data.user);
        return data.user || {};
    } catch (error) {
        console.error("❌ Fout bij ophalen van gebruiker uit database:", error.message);
        return {};
    }
}

// ✅ Genereer de starter-Pokémon opties
async function genereerStarterPokemon() {
    const pokemonContainer = document.getElementById("pokemon-container");
    const popup = document.getElementById("popup");
    const popupText = document.getElementById("popup-text");
    const popupYes = document.getElementById("popup-yes");
    const popupNo = document.getElementById("popup-no");

    const starterIds = [1, 7, 4]; // ✅ Correcte volgorde: Bulbasaur → Squirtle → Charmander
    for (const id of starterIds) {
        const pokemon = await haalPokemonGegevensOp(id);
        if (pokemon) {
            console.log(`✅ Pokémon geladen: ${pokemon.name}`);

            const div = document.createElement("div");
            div.className = "starter-pokemon"; // ✅ Hier wordt de stijl toegepast
            
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

                // ✅ Base stats verhogen per level
                let level = 5;
                let { hp, attack, defense, speed, special_attack, special_defense } = stats;

                for (let i = 1; i <= level; i++) {
                    hp += Math.round(hp / 50);
                    attack += Math.round(attack / 50);
                    defense += Math.round(defense / 50);
                    speed += Math.round(speed / 50);
                    special_attack += Math.round(special_attack / 50);
                    special_defense += Math.round(special_defense / 50);
                }

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
                    stats: { hp, attack, defense, special_attack, special_defense, speed },
                    isBuddy: true,
                    moves: moves
                });

                localStorage.setItem("loggedInUser", JSON.stringify(user));
                console.log("✅ Starter Pokémon opgeslagen in localStorage:", user.collection);

                // ✅ Update gebruiker in database
                await updateUserInDatabase(user.email, user.collection);
            };

                popupNo.onclick = () => {
                    console.log("🔴 Gebruiker weigert starter Pokémon");
                    popup.style.display = "none";
                };
            };

            pokemonContainer.appendChild(div);
        }
    }
}

// ✅ Haal Pokémon-gegevens op
async function haalStarterMoves(pokemonID) {
    try {
        console.log(`🌐 Haal moves op voor Pokémon ID: ${pokemonID}`);
        const antwoord = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonID}`);

        if (!antwoord.ok) {
            throw new Error(`❌ Kan moves niet ophalen voor ID: ${pokemonID} - Status: ${antwoord.status}`);
        }

        const data = await antwoord.json();
        const pokemonType = data.types.map(t => t.type.name); // ✅ Haal het type van de Pokémon op
        let levelUpMoves = [];

        // ✅ Haal alle level-up moves op
        data.moves.forEach(move => {
            move.version_group_details.forEach(detail => {
                if (detail.move_learn_method.name === "level-up" && detail.level_learned_at > 0) {
                    levelUpMoves.push({ name: move.move.name, level: detail.level_learned_at });
                }
            });
        });

        // ✅ Sorteer level-up moves en selecteer de laatste 4
        levelUpMoves.sort((a, b) => b.level - a.level);
        let selectedMoves = levelUpMoves.slice(0, 4).map(move => move.name);

        // ✅ Vul aan met moves van hetzelfde type als er minder dan 4 zijn
        if (selectedMoves.length < 4) {
            for (const moveData of data.moves) {
                const moveDetails = await fetch(`https://pokeapi.co/api/v2/move/${moveData.move.name}`);
                const moveInfo = await moveDetails.json();

                if (moveInfo.power > 0 && pokemonType.includes(moveInfo.type.name)) {
                    selectedMoves.push(moveData.move.name);
                }

                if (selectedMoves.length === 4) break;
            }
        }

        console.log("📌 Moves geselecteerd:", selectedMoves);
        return selectedMoves;
    } catch (error) {
        console.error(`❌ Fout bij ophalen van moves:`, error);
        return [];
    }
}

async function updateUserInDatabase(email, collection) {
    try {
        console.log("🌐 Updaten gebruiker in database met starter Pokémon...");
        
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