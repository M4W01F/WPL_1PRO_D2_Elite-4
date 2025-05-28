document.addEventListener("DOMContentLoaded", async () => {
    const pokemonContainer = document.getElementById("pokemon-container");
    const popup = document.getElementById("popup");
    const popupText = document.getElementById("popup-text");
    const popupYes = document.getElementById("popup-yes");
    const popupNo = document.getElementById("popup-no");

    // ✅ Haal gebruiker op uit localStorage
    const user = JSON.parse(localStorage.getItem("loggedInUser")) || {};
    const collectieLeeg = !user.collection || user.collection.length === 0;

    // ✅ Toon de juiste sectie
    document.getElementById("niet-ingelogged").style.display = collectieLeeg ? "block" : "none";
    document.getElementById("well-ingelogged").style.display = collectieLeeg ? "none" : "block";

    if (pokemonContainer && collectieLeeg) {
        genereerStarterPokemon(pokemonContainer, popup, popupText, popupYes, popupNo);
    } else {
        console.error("❌ De container 'pokemon-container' bestaat niet in de DOM.");
    }
});

// ✅ Genereer de 3 starter-Pokémon opties
async function genereerStarterPokemon(container, popup, popupText, popupYes, popupNo) {
    const starterIds = [1, 4, 7]; // Bulbasaur, Charmander, Squirtle
    for (const id of starterIds) {
        const pokemon = await haalPokemonGegevensOp(id);
        if (pokemon) {
            const div = document.createElement("div");
            div.className = "starter-pokemon";
            div.innerHTML = `
                <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" style="width: 250px; height: 250px;">
                <p><strong>${pokemon.name}</strong></p>
            `;
            div.onclick = () => {
                popup.style.display = "flex";
                popupText.innerHTML = `Wilt u ${pokemon.name} als uw starter Pokémon kiezen?<br>
                <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" style="width: 150px; height: 150px; margin-top: 10px;">`;

                popupYes.onclick = async () => {
                    popup.style.display = "none";
                    document.getElementById("niet-ingelogged").style.display = "none";
                    document.getElementById("well-ingelogged").style.display = "block";

                    // ✅ Voeg starter-Pokémon toe aan gebruiker
                    const moves = await haalStarterMoves(pokemon.id);
                    const stats = await haalPokemonStats(pokemon.id);

                    const user = JSON.parse(localStorage.getItem("loggedInUser")) || {};
                    user.collection = user.collection || [];
                    user.collection.push({
                        pokemon_name: pokemon.name,
                        pokemon_id: pokemon.id,
                        level: 5,
                        wins: 0,
                        loses: 0,
                        stats: stats,
                        isBuddy: true,
                        moves: moves
                    });

                    localStorage.setItem("loggedInUser", JSON.stringify(user));

                    // ✅ Update gebruiker in database
                    await updateUserInDatabase(user.email, user.collection);
                };

                popupNo.onclick = () => {
                    popup.style.display = "none";
                };
            };
            container.appendChild(div);
        }
    }
}

// ✅ Haal Pokémon-data op
async function haalPokemonGegevensOp(query) {
    try {
        const antwoord = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
        if (antwoord.ok) {
            return await antwoord.json();
        } else {
            console.error(`Kon de Pokémon niet ophalen met ID: ${query}.`);
            return null;
        }
    } catch (fout) {
        console.error(`Fout bij het ophalen van Pokémon-gegevens:`, fout);
        return null;
    }
}

// ✅ Haal moves op
async function haalStarterMoves(pokemonID) {
    try {
        const antwoord = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonID}`);
        if (!antwoord.ok) {
            throw new Error(`Kon de Pokémon niet ophalen met ID: ${pokemonID}`);
        }

        const data = await antwoord.json();
        let levelUpMoves = [];
        let hmTmMoves = [];

        data.moves.forEach(move => {
            move.version_group_details.forEach(detail => {
                if (detail.move_learn_method.name === "level-up") {
                    levelUpMoves.push({ name: move.move.name, level: detail.level_learned_at });
                } else if (detail.move_learn_method.name === "machine") {
                    hmTmMoves.push(move.move.name);
                }
            });
        });

        levelUpMoves.sort((a, b) => b.level - a.level);
        let selectedMoves = levelUpMoves.slice(0, 4).map(move => move.name);

        if (selectedMoves.length < 4) {
            for (const moveName of hmTmMoves) {
                const moveDetails = await fetch(`https://pokeapi.co/api/v2/move/${moveName}`);
                const moveData = await moveDetails.json();
                if (moveData.power > 0) {
                    selectedMoves.push(moveName);
                }
                if (selectedMoves.length === 4) break;
            }
        }

        return selectedMoves;
    } catch (error) {
        console.error("❌ Fout bij het ophalen van moves:", error);
        return [];
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
            hp: data.stats[0].base_stat,
            attack: data.stats[1].base_stat,
            defense: data.stats[2].base_stat,
            special_attack: data.stats[3].base_stat,
            special_defense: data.stats[4].base_stat,
            speed: data.stats[5].base_stat
        };
    } catch (error) {
        console.error("❌ Fout bij het ophalen van stats:", error);
        return {};
    }
}

// ✅ Update gebruiker in database
async function updateUserInDatabase(email, collection) {
    try {
        const response = await fetch("https://wpl-1pro-d2-elite-4.onrender.com/api/updateUser", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
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