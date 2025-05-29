// Haal de stats van de huidige Buddy-Pokémon uit de collectie
async function haalBuddyUitCollectie() {
    try {
        console.log('[DEBUG] - Start ophalen van Buddy-Pokémon...');
        const response = await fetch('/api/getBuddyPokemon');

        if (!response.ok) {
            throw new Error(`[ERROR] - Kan Buddy-Pokémon niet ophalen. Status: ${response.status}`);
        }

        const buddyPokemon = await response.json();
        console.log('[DEBUG] - Buddy-Pokémon geladen:', buddyPokemon);
        return buddyPokemon;
    } catch (error) {
        console.error('[ERROR] - Fout bij ophalen van Buddy-Pokémon:', error);
        return null;
    }
}

// Start het vangen van een Pokémon
async function startCatch(pokemonName) {
    try {
        console.log('[DEBUG] - Start catch proces...');
        
        const selectedPokemonName = document.getElementById('pokemon-selector').value.toLowerCase() || pokemonName;
        console.log(`[DEBUG] - Geselecteerde Pokémon: ${selectedPokemonName}`);

        if (!selectedPokemonName) {
            alert('Typ de naam van een Pokémon om te beginnen.');
            return;
        }

        // Haal buddy-Pokémon uit de collectie
        const buddy = await haalBuddyUitCollectie();
        if (!buddy) {
            alert('Geen actieve Buddy-Pokémon gevonden.');
            return;
        }

        // Haal Pokémon data van PokeAPI
        console.log(`[DEBUG] - Ophalen data voor tegenstander Pokémon: ${selectedPokemonName}`);
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${selectedPokemonName}/`);

        if (!response.ok) {
            throw new Error(`[ERROR] - Pokémon "${selectedPokemonName}" niet gevonden. Status: ${response.status}`);
        }

        const opponentPokemon = await response.json();
        console.log('[DEBUG] - Tegenstander Pokémon data geladen:', opponentPokemon);

        // Bereken de stats van de tegenstander op basis van buddy level
        let opponentStats = {
            hp: opponentPokemon.stats[0].base_stat / 50,
            attack: opponentPokemon.stats[1].base_stat / 50,
            defense: opponentPokemon.stats[2].base_stat / 50,
            special_attack: opponentPokemon.stats[3].base_stat / 50,
            special_defense: opponentPokemon.stats[4].base_stat / 50,
            speed: opponentPokemon.stats[5].base_stat / 50
        };

        console.log('[DEBUG] - Tegenstander stats berekend:', opponentStats);

        // Bereken de vangkans op basis van buddy stats
        const catchChance = (100 - opponentStats.defense + buddy.stats.attack) % 100;
        console.log(`[DEBUG] - Vangkans berekend: ${catchChance}%`);

        // Update de interface
        document.getElementById("catch-interface").style.display = "block";
        document.getElementById("pokemon-naam").textContent = `Naam: ${opponentPokemon.name}`;
        document.getElementById("pokemon-level").textContent = `Level: ${buddy.level}`;
        document.getElementById("pokemon-image").innerHTML = `<img src="${opponentPokemon.sprites.front_default}" alt="${opponentPokemon.name}">`;

        document.getElementById("pokeball").addEventListener("click", async () => {
            console.log('[DEBUG] - Pokéball wordt gebruikt...');
            const kansen = document.getElementById("kansen");
            let aantalKansen = parseInt(kansen.textContent);

            if (aantalKansen > 0) {
                aantalKansen--;
                kansen.textContent = aantalKansen;

                const vangstGeslaagd = Math.random() * 100 < catchChance;
                console.log(`[DEBUG] - Vangpoging: ${vangstGeslaagd ? 'Geslaagd' : 'Mislukt'}`);

                if (vangstGeslaagd) {
                    alert('Gevangen. Geef je Pokémon een bijnaam.');
                    document.getElementById("bijnaam-panel").style.display = "block";

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
        console.error('[ERROR] - Fout bij vangproces:', error);
        alert(error.message);
    }
}

// Voeg Pokémon toe aan de collectie, maar zet isBuddy op false
async function voegPokemonToeAanCollectie(pokemonData, opponentStats) {
    try {
        console.log('[DEBUG] - Voeg Pokémon toe aan collectie:', pokemonData.name);

        const pokemon = {
            pokemon_name: pokemonData.name,
            pokemon_id: pokemonData.id,
            nickname: document.getElementById("pokemon-bijnaam").value || "",
            sprite: pokemonData.sprites.front_default,
            level: buddy.level,
            wins: 0,
            loses: 0,
            stats: opponentStats,
            isBuddy: false, // Zet isBuddy expliciet op false
            moves: await haalStarterMoves(pokemonData.id)
        };

        console.log('[DEBUG] - Verstuur Pokémon data:', pokemon);

        const response = await fetch('/api/addPokemonToCollection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pokemon)
        });

        if (!response.ok) {
            throw new Error(`[ERROR] - Kan Pokémon niet toevoegen. Status: ${response.status}`);
        }

        console.log('[DEBUG] - Pokémon succesvol toegevoegd.');
    } catch (error) {
        console.error('[ERROR] - Fout bij toevoegen van Pokémon aan collectie:', error);
    }
}