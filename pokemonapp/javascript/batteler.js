function getHealthBar(character) {
    // Dynamisch de maximale HP van het personage bepalen
    const maxHp = character.maxHp || 100; // Controleer of maxHp beschikbaar is, anders standaard op 100
    const healthPercentage = (character.hp / maxHp) * 100;
    let color;

    // Stel de kleur in
    if (healthPercentage > 75) {
        color = "green";
    } else if (healthPercentage > 50) {
        color = "yellow";
    } else if (healthPercentage > 25) {
        color = "orange";
    } else {
        color = "red";
    }

    // Genereer de hp balk
    return `
        <div style="width: 80%; margin-left: 10%; background-color: lightgray; height: 10px; border-radius: 5px;">
            <div style="width: ${healthPercentage}%; background-color: ${color}; height: 100%; border-radius: 5px;"></div>
        </div>
    `;
}

// Update de informatie van pokemon en buddy
function updateInfo(pokemon, buddy) {
    const pokemonInfo = `
        <p><b>${pokemon.name}</b></p>
        ${getHealthBar(pokemon)} <!-- Gezondheidsbalk voor Pokémon -->
        <img src="${pokemon.sprite}" alt="${pokemon.name} sprite" />
        <p>Level: ${pokemon.level}</p>
        <p>HP: ${pokemon.hp}/${pokemon.maxHp || 100}</p> <!-- Dynamische max HP -->
    `;

    const buddyInfo = `
        <p><b>${buddy.name}</b></p>
        ${getHealthBar(buddy)} <!-- Gezondheidsbalk voor Buddy -->
        <img src="${buddy.sprite}" alt="${buddy.name} sprite" />
        <p>Level: ${buddy.level}</p>
        <p>HP: ${buddy.hp}/${buddy.maxHp || 100}</p> <!-- Dynamische max HP -->
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
    // Maakt het dat je moet vechten en dat je niet zomaar kan weglopen wanner je denkt dat je gaat verliezen.
    document.getElementById('run-away').style.display = 'none';
    // Voorbeeld voor het verlies van hp
    const effectiveness = Math.random() > 0.5 ? 'effectief' : 'niet effectief';
    pokemon.hp -= Math.floor(Math.random() * 40);
    buddy.hp -= Math.floor(Math.random() * 40);
    
    // Maak de move resultaat div leeg voordat een nieuw resultaat getoond word.
    document.getElementById('move-resultaat').innerHTML = '';

    updateMoveResult(true, move, effectiveness, buddy.hp, pokemon.hp);
    updateInfo(pokemon, buddy);

    // Als tegenstander of buddy hun hp op minstens 0 staat
    const resultDiv = document.createElement('div');
    resultDiv.className = 'move-resultaat';
    if (buddy.hp <= 0) {
        document.getElementById('move-resultaat').innerHTML = '';
        document.getElementById('buddy-moves').style.display = 'none';
        resultDiv.innerHTML = `
        <p>${buddy.name} kan niet meer vechten!</p>
        <br>
        <p>${pokemon.name} heeft dit gevecht gewonnen.</p>
        <br>
        <p>Je krijgt 1 Lost aangerekend.</p>
    `;
    }
    if (pokemon.hp <= 0) {
        document.getElementById('move-resultaat').innerHTML = '';
        document.getElementById('buddy-moves').style.display = 'none';
        resultDiv.innerHTML = `
        <p>${pokemon.name} kan niet meer vechten!</p>
        <br>
        <p>${buddy.name} heeft dit gevecht gewonnen.</p>
        <br>
        <p>Je krijgt 1 Win aangerekend.</p>
    `;
    }
    document.getElementById('move-resultaat').appendChild(resultDiv);
}

// Voorbeeld data
const pokemon = {
    name: '',
    level: 10,
    hp: 100,
    maxHp: 100
};

const buddy = {
    name: 'charmander',
    level: 10,
    hp: 100,
    maxHp: 100,
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
