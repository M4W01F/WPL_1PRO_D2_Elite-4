// Functie om dynamisch de informatie van Pokemon en Buddy te genereren
function updateInfo(pokemon, buddy) {
    const pokemonInfo = `
        <p>Pokemon: ${pokemon.name}</p>
        <p>Level: ${pokemon.level}</p>
        <p>HP: ${pokemon.hp}</p>
    `;

    const buddyInfo = `
        <p>Buddy: ${buddy.name}</p>
        <p>Level: ${buddy.level}</p>
        <p>HP: ${buddy.hp}</p>
    `;

    document.getElementById('pokemon-info').innerHTML = pokemonInfo;
    document.getElementById('buddy-info').innerHTML = buddyInfo;
}

// Functie om dynamisch de moves te genereren
function updateBuddyMoves(moves) {
    const moveButtons = moves.map(move => `<button>${move}</button>`).join('');
    document.getElementById('buddy-moves').innerHTML = moveButtons;
}

// Functie om dynamisch de resultaten van de moves bij te werken
function updateMoveResult(isPlayer, move, effectiveness, playerHp, opponentHp) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'move-result';

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

    document.getElementById('move-results').appendChild(resultDiv);
}

// Voorbeeld data
const pokemon = {
    name: 'Pikachu',
    level: 15,
    hp: 100
};

const buddy = {
    name: 'Charmander',
    level: 10,
    hp: 80,
    moves: ['Scratch', 'Ember', 'Growl', 'Flamethrower']
};

// Roep de functies aan om de informatie te updaten
updateInfo(pokemon, buddy);
updateBuddyMoves(buddy.moves);
