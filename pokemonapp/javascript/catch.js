// Haal Pokémon naam uit de Pokédex URL
function getPokemonNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('pokemonName');
}

// Event Listener om automatisch het vangproces te starten als een Pokémon uit de Pokédex wordt geselecteerd
document.addEventListener('DOMContentLoaded', () => {
    const pokemonName = getPokemonNameFromURL();
    if (pokemonName) {
        startCatch(pokemonName);
    } else {
        console.error('❌ Pokémon naam ontbreekt in de URL.');
    }
});

// Fetch buddy stats uit de database
fetch('/api/getBuddyStats')
    .then(response => response.json())
    .then(data => {
        buddy = {
            stats: data.stats,
            level: data.level
        };

        console.log("✅ Buddy stats geladen:", buddy);

        document.getElementById("startCatch").addEventListener("click", () => {
            const pokemonName = document.getElementById("pokemon-selector").value;
            startCatch(pokemonName);
        });
    })
    .catch(error => console.error('❌ Fout bij ophalen van buddy stats:', error));

async function startCatch(pokemonName) {
    if (!pokemonName) return;

    try {
        const response = await fetch(`/api/getPokemon?name=${pokemonName}`);
        if (!response.ok) throw new Error(`❌ Fout bij ophalen van Pokémon: ${response.status}`);
        
        const pokemon = await response.json();
        pokemon.level = buddy.level + [-3, -2, -1, 0, 1, 2, 3][Math.floor(Math.random() * 7)];

        // 🔥 Haal statistieken en moves op via jouw functies
        pokemon.stats = await haalPokemonStats(pokemon.id);
        pokemon.moves = await haalMoves(pokemon.id);

        // Bereken de vangkans
        const catchChance = (100 - pokemon.stats.defense + buddy.stats.attack) % 100;
        console.log(`🎯 Vangkans: ${catchChance}%`);

        // Update interface
        document.getElementById("catch-interface").style.display = "block";
        document.getElementById("pokemon-naam").innerText = `Naam: ${pokemon.name}`;
        document.getElementById("pokemon-level").innerText = `Level: ${pokemon.level}`;
        document.getElementById("pokemon-image").innerHTML = `<img src="${pokemon.sprite}" alt="${pokemon.name}" width="200px">`;

        // ✅ Pokéball click event met correcte vangkans
        document.getElementById('pokeball').addEventListener('click', async () => {
            const kansen = document.getElementById('kansen');
            let aantalKansen = parseInt(kansen.textContent);

            if (aantalKansen > 0) {
                aantalKansen--;
                kansen.textContent = aantalKansen;

                const vangstGeslaagd = Math.random() * 100 < catchChance;

                if (vangstGeslaagd) {
                    alert('🎉 Gevangen! Geef je Pokémon een bijnaam.');
                    document.getElementById('bijnaam-panel').style.display = 'block';

                    // ✅ Voeg Pokémon toe aan collectie met volledige gegevens
                    await voegPokemonToeAanCollectie(pokemon);
                } else {
                    if (aantalKansen === 0) {
                        alert('❌ Geen kansen meer! Je wordt teruggeleid naar de hoofdpagina.');
                        window.location.href = './index.html';
                    } else {
                        alert('⚡ Niet gelukt! Probeer opnieuw.');
                    }
                }
            }
        });

    } catch (error) {
        console.error('❌ Fout bij ophalen van Pokémon:', error);
    }
}

// Haal statistieken van de Pokémon op
async function haalPokemonStats(pokemonID) {
    try {
        console.log(`🌐 Haal statistieken op voor Pokémon ID: ${pokemonID}`);
        const antwoord = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonID}`);

        if (!antwoord.ok) throw new Error(`❌ Kan statistieken niet ophalen - Status: ${antwoord.status}`);

        const data = await antwoord.json();
        let stats = {
            hp: data.stats[0].base_stat,
            attack: data.stats[1].base_stat,
            defense: data.stats[2].base_stat,
            special_attack: data.stats[3].base_stat,
            special_defense: data.stats[4].base_stat,
            speed: data.stats[5].base_stat
        };

        console.log("📌 Basisstatistieken opgehaald:", stats);
        return stats;
    } catch (error) {
        console.error(`❌ Fout bij ophalen van statistieken:`, error);
        return {};
    }
}

// Haal de beste moves van de Pokémon op
async function haalMoves(pokemonID) {
    try {
        console.log(`🌐 Haal moves op voor Pokémon ID: ${pokemonID}`);
        const antwoord = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonID}`);

        if (!antwoord.ok) throw new Error(`❌ Kan moves niet ophalen - Status: ${antwoord.status}`);

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
                            effect: moveInfo.effect_entries.length > 0 ? moveInfo.effect_entries[0].effect : "No effect",
                        });
                    }
                }
            }
        }

        let selectedMoves = Array.from(moveSet.values()).slice(0, 4); 

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
                        effect: moveInfo.effect_entries.length > 0 ? moveInfo.effect_entries[0].effect : "No effect",
                    });
                }

                if (moveSet.size === 4) break;
            }

            selectedMoves = Array.from(moveSet.values()).slice(0, 4);
        }

        console.log("📌 Unieke moves geselecteerd:", selectedMoves);
        return selectedMoves;
    } catch (error) {
        console.error(`❌ Fout bij ophalen van moves:`, error);
        return [];
    }
}

// Voeg de Pokémon toe aan de collectie
async function voegPokemonToeAanCollectie(pokemon) {
    try {
        console.log(`📦 Voeg gevangen Pokémon toe aan collectie: ${pokemon.name}`);

        const response = await fetch('/api/addPokemonToCollection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pokemon)
        });

        if (!response.ok) throw new Error(`❌ Kan Pokémon niet toevoegen - Status: ${response.status}`);

        console.log("✅ Pokémon succesvol toegevoegd!");
    } catch (error) {
        console.error("❌ Fout bij toevoegen van Pokémon aan collectie:", error);
    }
}