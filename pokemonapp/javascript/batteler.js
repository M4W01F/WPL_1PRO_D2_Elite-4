// Functie om dynamisch de informatie van Pokemon en Buddy te genereren
function updateInfo(pokemon, buddy) {
    const pokemonInfo = `
        <p><b>${pokemon.name}</b></p>
        <img src="${pokemon.sprite}" alt="${pokemon.name} sprite" />
        <p>Level: ${pokemon.level}</p>
        <p>HP: ${pokemon.hp}</p>
    `;

    const buddyInfo = `
        <p><b>${buddy.name}</b></p>
        <img src="${buddy.sprite}" alt="${buddy.name} sprite" />
        <p>Level: ${buddy.level}</p>
        <p>HP: ${buddy.hp}</p>
    `;

    document.getElementById('pokemon-info').innerHTML = pokemonInfo;
    document.getElementById('buddy-info').innerHTML = buddyInfo;
}

// Functie om dynamisch de moves te genereren
function updateBuddyMoves(moves) {
    const moveButtons = moves.map(move => `<button onclick="handleMoveClick('${move}')">${move}</button>`).join('');
    document.getElementById('buddy-moves').innerHTML = moveButtons;
}

// Functie om dynamisch de resultaten van de moves bij te werken
function updateMoveResult(isPlayer, move, effectiveness, playerHp, opponentHp) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'move-resultaat';

    if (isPlayer) {
        resultDiv.innerHTML = `
            <p>Jij gebruikte: ${move}</p>
            <p>Effectiviteit: ${effectiveness}</p>
            <p>Jouw HP: ${playerHp}</p>
            <p>Tegenstander HP: ${opponentHp}</p>
        `;
    } else {
        resultDiv.innerHTML = `
            <p>Tegenstander gebruikte: ${move}</p>
            <p>Effectiviteit: ${effectiveness}</p>
            <p>Jouw HP: ${playerHp}</p>
            <p>Tegenstander HP: ${opponentHp}</p>
        `;
    }
    
    document.getElementById('move-resultaat').appendChild(resultDiv);
}

// Functie om een move te verwerken wanneer erop wordt geklikt
function handleMoveClick(move) {
    // Voorbeeld voor het verlies van hp
    const effectiveness = Math.random() > 0.5 ? 'effectief' : 'niet effectief';
    pokemon.hp -= Math.floor(Math.random() * 40);
    buddy.hp -= Math.floor(Math.random() * 40);
    
    // Maak de move resultaat div leeg voordat een nieuw resultaat getoond word.
    document.getElementById('move-resultaat').innerHTML = '';

    updateMoveResult(true, move, effectiveness, buddy.hp, pokemon.hp);
    updateInfo(pokemon, buddy);
}

// Voorbeeld data
const pokemon = {
    name: '',
    level: 10,
    hp: 100
};

const buddy = {
    name: 'charmander',
    level: 10,
    hp: 80,
    moves: ['Scratch', 'Ember', 'Growl', 'Flamethrower']
};

// Functie om het gevecht te starten
async function startBattle() {
    const selectedPokemonName = document.getElementById('pokemon-selector').value.toLowerCase();

    if (!selectedPokemonName) {
        alert('Typ de naam van een Pokémon om te beginnen!');
        return;
    }

    try {
        // Fetch Pokémon data van de API
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${selectedPokemonName}/`);
        const buddyResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${buddy.name.toLowerCase()}/`);
        if (!response.ok) {
            throw new Error(`Pokémon met de naam "${selectedPokemonName}" kon niet worden gevonden.`);
        }
        if (!buddyResponse.ok) {
            throw new Error(`Pokémon met de naam "${buddy.name}" kon niet worden gevonden.`);
        }

        const pokemonData = await response.json();
        const buddyData = await buddyResponse.json();

    // Werk het globale `pokemon` object bij
    pokemon.name = selectedPokemonName;
    pokemon.level = 10; // Standaard niveau word later verander naar een random number generator voor max 5 levels boven de buddy level the zijn of min 5 levels onder.
    pokemon.hp = 100;   // Standaard HP
    pokemon.sprite = pokemonData.sprites.front_default;
    buddy.sprite = buddyData.sprites.back_default;

    // Werk de gevechtsinterface bij met JS-functies
    updateInfo(pokemon, buddy);

    // Wissel zichtbaarheid
    document.getElementById('setup-container').style.display = 'none';
    document.getElementById('battle-interface').style.display = 'block';

    document.querySelector('footer').style.display = 'none';
    document.querySelector('nav').style.display = 'none';
    } catch (error) {
        alert(error.message);
    }
}
// Roep de functies aan om de informatie te updaten
updateInfo(pokemon, buddy);
updateBuddyMoves(buddy.moves);
