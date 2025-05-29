// Haal Pokémon naam uit de Pokédex URL
function getPokemonNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('pokemonName');
}

// Event Listener om automatisch het vangproces te starten
document.addEventListener('DOMContentLoaded', async () => {
    const pokemonName = getPokemonNameFromURL();
    if (pokemonName) {
        await startCatch(pokemonName);
    } else {
        console.error('❌ Pokémon naam ontbreekt in de URL.');
    }
});

// Fetch buddy stats uit de database
let buddy;
async function haalBuddyStats() {
    try {
        const response = await fetch('/api/getBuddyStats');
        if (!response.ok) throw new Error(`❌ Fout bij ophalen van buddy stats: ${response.status}`);
        
        const data = await response.json();
        buddy = {
            stats: data.stats,
            level: data.level
        };

        console.log("✅ Buddy stats geladen:", buddy);
    } catch (error) {
        console.error('❌ Fout bij ophalen van buddy stats:', error);
    }
}

// Start het vangproces
async function startCatch(pokemonName) {
    await haalBuddyStats(); // Eerst Buddy stats ophalen

    const selectedPokemonName = document.getElementById('pokemon-selector').value.toLowerCase() || pokemonName;
    if (!selectedPokemonName) {
        alert('Typ de naam van een Pokémon om te beginnen!');
        return;
    }

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${selectedPokemonName}/`);
        if (!response.ok) throw new Error(`❌ Pokémon "${selectedPokemonName}" niet gevonden.`);
        
        const pokemonData = await response.json();

        // Stel level in op basis van Buddy
        pokemonData.level = buddy.level + [-3, -2, -1, 0, 1, 2, 3][Math.floor(Math.random() * 7)];

        // 🔥 Haal statistieken en moves op via jouw functies
        pokemonData.stats = await haalPokemonStats(pokemonData.id);
        pokemonData.moves = await haalStarterMoves(pokemonData.id);

        // Bereken de vangkans
        const catchChance = (100 - pokemonData.stats.defense + buddy.stats.attack) % 100;
        console.log(`🎯 Vangkans: ${catchChance}%`);

        // Update interface
        document.getElementById("catch-interface").style.display = "block";
        document.getElementById("pokemon-naam").textContent = `Naam: ${pokemonData.name}`;
        document.getElementById("pokemon-level").textContent = `Level: ${pokemonData.level}`;
        document.getElementById("pokemon-image").innerHTML = `<img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}" />`;

        document.getElementById("pokeball").addEventListener("click", async () => {
            const kansen = document.getElementById("kansen");
            let aantalKansen = parseInt(kansen.textContent);

            if (aantalKansen > 0) {
                aantalKansen--;
                kansen.textContent = aantalKansen;

                const vangstGeslaagd = Math.random() * 100 < catchChance;

                if (vangstGeslaagd) {
                    alert('🎉 Gevangen! Geef je Pokémon een bijnaam.');
                    document.getElementById("bijnaam-panel").style.display = "block";

                    // ✅ Voeg Pokémon toe aan collectie met volledige gegevens
                    await voegPokemonToeAanCollectie(pokemonData);
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
        alert(error.message);
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