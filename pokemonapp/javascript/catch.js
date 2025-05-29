// Haal Pokémon naam uit URL of invoerveld
function getPokemonNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('pokemonName');
}

// Start het vangen van een Pokémon
async function startCatch(pokemonName) {
    try {
        const selectedPokemonName = document.getElementById('pokemon-selector').value.toLowerCase() || pokemonName;
        if (!selectedPokemonName) {
            alert('Typ de naam van een Pokémon om te beginnen.');
            return;
        }

        // Haal buddy direct uit de database
        const buddyResponse = await fetch('/api/getCurrentBuddy');
        if (!buddyResponse.ok) throw new Error('Kan Buddy niet ophalen.');
        const buddy = await buddyResponse.json();

        console.log('Buddy geladen:', buddy);

        // Haal Pokémon data van PokeAPI
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${selectedPokemonName}/`);
        if (!response.ok) throw new Error(`Pokémon "${selectedPokemonName}" niet gevonden.`);
        const opponentPokemon = await response.json();

        // Bereken de stats van de tegenstander op basis van buddy level
        let opponentStats = {
            hp: opponentPokemon.stats[0].base_stat / 50,
            attack: opponentPokemon.stats[1].base_stat / 50,
            defense: opponentPokemon.stats[2].base_stat / 50,
            special_attack: opponentPokemon.stats[3].base_stat / 50,
            special_defense: opponentPokemon.stats[4].base_stat / 50,
            speed: opponentPokemon.stats[5].base_stat / 50
        };

        console.log('Tegenstander stats berekend:', opponentStats);

        // Bereken de vangkans
        const catchChance = (100 - opponentStats.defense + buddy.stats.attack) % 100;
        console.log('Vangkans:', catchChance, '%');

        // Update de interface
        document.getElementById("catch-interface").style.display = "block";
        document.getElementById("pokemon-naam").textContent = `Naam: ${opponentPokemon.name}`;
        document.getElementById("pokemon-level").textContent = `Level: ${buddy.level}`;
        document.getElementById("pokemon-image").innerHTML = `<img src="${opponentPokemon.sprites.front_default}" alt="${opponentPokemon.name}">`;

        document.getElementById("pokeball").addEventListener("click", async () => {
            const kansen = document.getElementById("kansen");
            let aantalKansen = parseInt(kansen.textContent);

            if (aantalKansen > 0) {
                aantalKansen--;
                kansen.textContent = aantalKansen;

                const vangstGeslaagd = Math.random() * 100 < catchChance;

                if (vangstGeslaagd) {
                    alert('Gevangen. Geef je Pokémon een bijnaam.');
                    document.getElementById("bijnaam-panel").style.display = "block";

                    // Voeg Pokémon toe aan collectie met de juiste stats
                    await voegPokemonToeAanCollectie(opponentPokemon, opponentStats);
                } else {
                    if (aantalKansen === 0) {
                        alert('Geen kansen meer. Je wordt teruggeleid naar de hoofdpagina.');
                        window.location.href = './index.html';
                    } else {
                        alert('Niet gelukt. Probeer opnieuw.');
                    }
                }
            }
        });

    } catch (error) {
        alert(error.message);
    }
}

// Voeg Pokémon toe met correcte stats
async function voegPokemonToeAanCollectie(pokemonData, opponentStats) {
    try {
        console.log('Voeg gevangen Pokémon toe aan collectie:', pokemonData.name);

        const pokemon = {
            pokemon_name: pokemonData.name,
            pokemon_id: pokemonData.id,
            nickname: document.getElementById("pokemon-bijnaam").value || "",
            sprite: pokemonData.sprites.front_default,
            level: buddy.level,
            wins: 0,
            loses: 0,
            stats: opponentStats,
            isBuddy: true,
            moves: await haalStarterMoves(pokemonData.id)
        };

        const response = await fetch('/api/addPokemonToCollection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pokemon)
        });

        if (!response.ok) throw new Error(`Kan Pokémon niet toevoegen - Status: ${response.status}`);
        console.log('Pokémon succesvol toegevoegd.');
    } catch (error) {
        console.error('Fout bij toevoegen van Pokémon aan collectie:', error);
    }
}