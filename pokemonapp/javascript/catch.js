// Haal pokemon naam uit pokedex
function getPokemonNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('pokemonName');
}

// Event Listener om catch te starten out pokedex
document.addEventListener('DOMContentLoaded', () => {
    const pokemonName = getPokemonNameFromURL();
    if (pokemonName) {
        startCatch(pokemonName);
    } else {
        console.error('Pokémon name is missing from the URL.');
    }
});

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

        // ✅ Dynamisch berekende stats + afronden met Math.round()
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

        laatstGevangenPokemon = pokemonData;
        laatstGevangenStats = opponentStats;
        laatstGevangenLevel = pokemonLevel;

        console.log(`[DEBUG] - Final Pokémon Level: ${pokemonLevel}`);
        console.log("[DEBUG] - Tegenstander stats berekend:", opponentStats);

        // ✅ Update de Pokémon details dynamisch in de UI
        document.getElementById("pokemon-naam").textContent = `Naam: ${pokemonData.name}`;
        document.getElementById("pokemon-level").textContent = `Level: ${pokemonLevel}`;
        document.getElementById("pokemon-image").innerHTML = `
            <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}" />
        `;

        // ✅ Verberg setup en toon catch-interface
        document.getElementById("setup-container").style.display = "none";
        document.getElementById("catch-interface").style.display = "block";

        // ✅ Bereken vangkans op basis van Buddy stats
        const catchChance = Math.min(95, (100 - opponentStats.defense + buddyPokemon.stats.attack) % 100);
        console.log(`[DEBUG] - Vangkans berekend: ${catchChance}%`);

    } catch (error) {
        console.error("Fout bij vangproces:", error);
        alert(error.message);
    }
}

// Pokeball click event
document.getElementById('pokeball').addEventListener('click', () => {
    const kansen = document.getElementById('kansen');
    let aantalKansen = parseInt(kansen.textContent);

    if (aantalKansen > 0) {
        aantalKansen--;
        kansen.textContent = aantalKansen;

        if (Math.random() > 0.5) { // Random success voorbeeeld
            document.getElementById('pokeball').style.display = 'none';
            document.getElementById('kansen').style.display = 'none';
            document.getElementById('kans').style.display = 'none';
            alert('Gevangen! Geef je Pokémon een bijnaam.');
            document.getElementById('bijnaam-panel').style.display = 'block';
        } else {
            if (aantalKansen === 0) {
                alert('Geen kansen meer! Je wordt teruggeleid naar de hoofdpagina.');
                window.location.href = './index.html';
            } else {
                alert('Niet gelukt! Probeer opnieuw.');
            }
        }
    }
});
