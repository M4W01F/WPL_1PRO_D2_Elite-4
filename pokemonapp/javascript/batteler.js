document.addEventListener("DOMContentLoaded", async () => {
    try {
        const email = JSON.parse(localStorage.getItem("loggedInUser")).email;
        const buddyId = await haalBuddyUitCollectie(email); // ✅ Haalt ID en vult buddy.moves
        if (!buddyId) {
            console.error("Geen buddy Pokémon gevonden in de database.");
            return;
        }

        const buddyResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${buddyId}/`);
        if (!buddyResponse.ok) {
            throw new Error(`Buddy-Pokémon met ID "${buddyId}" kon niet worden gevonden.`);
        }
        const buddyData = await buddyResponse.json();

        // ✅ Buddy stats bijwerken
        buddy.name = buddyData.name;
        buddy.sprite = buddyData.sprites.front_default;
        buddy.level = buddyData.level;

        console.log("[DEBUG] - Buddy geladen uit database:", buddy);

        // ✅ Moves zijn al gevuld in `buddy.moves` door `haalBuddyUitCollectie()`
        updateBuddyMoves(buddy.moves);
        setCurrentBuddy(buddyId, buddy.level);
        
    } catch (error) {
        console.error("Fout bij het laden van Buddy-Pokémon uit database:", error);
    }
});

async function haalBuddyUitCollectie(email) {
    try {
        const response = await fetch("/api/getUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`Kan gebruiker niet ophalen. Status: ${response.status}`);
        }

        const data = await response.json();
        const user = data.user;

        if (!user || !user.collection || !Array.isArray(user.collection)) {
            console.error("Geen geldige collectie gevonden in database!");
            return null;
        }

        const buddyPokemon = user.collection.find(pokemon => pokemon.isBuddy === true);
        if (!buddyPokemon) {
            console.error("Geen actieve Buddy-Pokémon gevonden.");
            return null;
        }

        // ✅ Vul bestaande buddy.moves en level in met de geladen moves uit MongoDB
        buddy.moves = buddyPokemon.moves || ["", "", "", ""];
        buddy.level = buddyPokemon.level

        console.log("[DEBUG] - Buddy ID:", buddyPokemon.pokemon_id);
        console.log("[DEBUG] - Buddy Moves:", buddy.moves);

        return buddyPokemon.pokemon_id; // ✅ Retourneer alleen de ID

    } catch (error) {
        console.error("Fout bij ophalen van Buddy-Pokémon:", error);
        return null;
    }
}

async function loadMovesFromDB(pokemonID) {
    try {
        console.log(`🌐 Haal moves op uit MongoDB voor Pokémon ID: ${pokemonID}`);

        const response = await fetch("/api/getMoves", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pokemon_id: pokemonID }),
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`❌ Kan moves niet ophalen. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("📌 Moves geladen uit MongoDB:", data.moves);
        return data.moves || [];

    } catch (error) {
        console.error("❌ Fout bij het laden van moves uit MongoDB:", error);
        return [];
    }
}

// Stel huidige buddy in en toon informatie
async function setCurrentBuddy(pokemonId, level) {
    const buddyData = await fetchPokemonData(pokemonId);

    if (buddyData) {
        
        // Bereken statistieken
        const baseStats = {
            hp: buddyData.stats[0].base_stat,
            attack: buddyData.stats[1].base_stat,
            defense: buddyData.stats[2].base_stat,
            sAttack: buddyData.stats[3].base_stat,
            sDefense: buddyData.stats[4].base_stat,
            speed: buddyData.stats[5].base_stat
        };


        let hp = baseStats.hp, attack = baseStats.attack, defense = baseStats.defense, speed = baseStats.speed, sAttack = baseStats.sAttack, sDefense = baseStats.sDefense;

        for (let i = 1; i <= level; i++) {
            hp += hp / 50;
            attack += attack / 50;
            defense += defense / 50;
            speed += speed / 50;
            sAttack += sAttack / 50;
            sDefense += sDefense / 50;
        }
        buddy.name = buddyData.name;
        buddy.level = level;
        buddy.maxHp = Math.round(hp, 0);
        buddy.hp = Math.round(hp, 0);
        buddy.attack = attack;
        buddy.defense = defense;
        buddy.speed = speed;
        buddy.sAttack = sAttack;
        buddy.sDefense = sDefense;
        buddy.types = buddyData.types.map(typeInfo => typeInfo.type.name);
        // Bereken typen en zwaktes dynamisch
        buddy.weakness = calculateCombinedWeaknesses(buddy.types);

        buddy.chosenMove = null;
    }
}

// Haal Pokémon-gegevens op met behulp van een query (ID of naam)
async function fetchPokemonData(query) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
        if (response.ok) {
            const pokemon = await response.json();
            return pokemon; // Retourneer het Pokémon-object
        } else {
            console.error(`Kan de Pokémon niet ophalen met query: ${query}.`);
            return null;
        }
    } catch (error) {
        console.error(`Fout bij het ophalen van Pokémon-gegevens:`, error);
        return null;
    }
}

// Haal pokemon naam uit pokedex
function getPokemonNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('pokemonName');
}

// Event listeener om pokemon gevecht te starten uit pokedex
document.addEventListener('DOMContentLoaded', () => {
    const pokemonName = getPokemonNameFromURL();
    if (pokemonName) {
        startBattle(pokemonName); // Call startBattle with the Pokémon name
    } else {
        console.error('Pokémon name is missing from the URL.');
    }
});

// De bar met uw hp en kleuren op hoeveel precentage
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
        <div style="width: 80%; margin-left: 10%; background-color: lightgray; height: 10px; border-radius: 5px; border: 2px solid black;">
            <div style="width: ${healthPercentage}%; background-color: ${color}; height: 100%; border-radius: 5px;"></div>
        </div>
    `;
}

// Update de informatie van pokemon en buddy
async function updateInfo(pokemon, buddy) {
    const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.name}/`);
    const buddyResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${buddy.name}/`);
    const pokemonData = await pokemonResponse.json();
    const buddyData = await buddyResponse.json();

    // Get type colors based on the first type
    const pokemonTypeColor = getTypeColor(pokemonData.types[0].type.name);
    const buddyTypeColor = getTypeColor(buddyData.types[0].type.name);

    // Update Pokémon Info Section
    const pokemonInfoElement = document.getElementById('pokemon-info'); // Get the Pokémon div
    pokemonInfoElement.style.backgroundColor = pokemonTypeColor; // Set the background color
    const pokemonInfo = `
        <p><b>${pokemon.name}</b></p>
        ${getHealthBar(pokemon)} <!-- Health bar -->
        <img src="${pokemon.sprite}" alt="${pokemon.name} sprite" />
        <p>Level: ${pokemon.level}</p>
        <p>HP: ${Math.round(pokemon.hp)}/${pokemon.maxHp || 100}</p>
    `;
    pokemonInfoElement.innerHTML = pokemonInfo;

    // Update Buddy Info Section
    const buddyInfoElement = document.getElementById('buddy-info'); // Get the Buddy div
    buddyInfoElement.style.backgroundColor = buddyTypeColor; // Set the background color
    const buddyInfo = `
        <p><b>${buddy.name}</b></p>
        ${getHealthBar(buddy)} <!-- Health bar -->
        <img src="${buddy.sprite}" alt="${buddy.name} sprite" />
        <p>Level: ${buddy.level}</p>
        <p>HP: ${Math.round(buddy.hp)}/${buddy.maxHp || 100}</p>
    `;
    buddyInfoElement.innerHTML = buddyInfo;
}

// Functie om dynamisch de moves te genereren
async function updateBuddyMoves(moves) {
    if (!Array.isArray(moves) || moves.length === 0) {
        console.error("Moves-array is ongeldig of leeg.");
        document.getElementById('buddy-moves').innerHTML = "<p>Geen moves beschikbaar.</p>";
        return;
    }

    console.log("Buddy moves bijwerken:", moves);

    const moveDataPromises = moves.map(async (move) => {
        const moveInfo = await GetMoveInfo(move); // Fetch move details
        const moveType = moveInfo.type;
        const moveColor = getTypeColor(moveType);
        const movePower = moveInfo.power || "N/A";
        const moveAccuracy = moveInfo.accuracy || "N/A";

        return `
            <button style="
                background-color: ${moveColor};
                padding-top: 10px;
                padding-right: 10px;
                padding-bottom: 90px;
                font-size: 15px;
                font-weight: bold;
                border-radius: 8px;
                border: 1px solid black;
                color: white;
                justify-content: center;
            " onclick="handleMoveClick('${move}')">
                ${move}<br><br>Power: ${movePower}<br>Accuracy: ${moveAccuracy}%
            </button>
        `;
    });

    const moveButtons = await Promise.all(moveDataPromises);
    document.getElementById('buddy-moves').innerHTML = moveButtons.join('');
}

// Roep de functie aan nadat de DOM is geladen
document.addEventListener("DOMContentLoaded", async () => {
    await updateBuddyMoves();
});

// Functie om dynamisch de resultaten van de moves bij te werken
function updateMoveResult(isPlayer, move, effectiveness) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'move-resultaat click-next';

    let effectivenessText;
    if (effectiveness === 0) {
        effectivenessText = 'Immuun';
    } else if (effectiveness < 1) {
        effectivenessText = 'Niet effectief';
    } else if (effectiveness >= 1 && effectiveness < 2) {
        effectivenessText = 'Effectief';
    } else if (effectiveness >= 2 && effectiveness <= 4) {
        effectivenessText = 'Super effectief';
    } else {
        effectivenessText = 'Extreem effectief';
    }

    resultDiv.innerHTML = `
        <p>${isPlayer ? 'Jij' : 'Tegenstander'} gebruikte: ${move}</p>
        <p>Effectiviteit: ${effectivenessText}</p>
        <p>Jouw HP: ${Math.round(buddy.hp)}</p>
        <p>Tegenstander HP: ${Math.round(pokemon.hp)}</p>
        <br>
        <p>Klik om verder te gaan ></p>
    `;

    resultDiv.onclick = () => {
        resultDiv.remove();
        continueBattle();
    };

    document.getElementById('move-resultaat').appendChild(resultDiv);
}


// Functie om een move te verwerken wanneer erop wordt geklikt
async function handleMoveClick(move) {
    document.getElementById('run-away').style.display = 'none';
    document.getElementById('move-resultaat').style.display = 'block';
    document.getElementById('buddy-moves').style.visibility = 'hidden';

    console.log(pokemon.weakness);
    console.log(buddy.weakness);

    buddy.chosenMove = move;

    const attackOrder = await determineAttackOrder(pokemon, buddy);

    let currentIndex = 0;

    function processAttack() {
        if (currentIndex >= attackOrder.length) {
            document.getElementById('buddy-moves').style.visibility = 'visible';
            return;
        }

        const attacker = attackOrder[currentIndex];
        const defender = attacker === pokemon ? buddy : pokemon;
        const move = attacker.chosenMove;

        if (move) {
            GetMoveInfo(move).then(moveInfo => {
                const moveType = moveInfo.type;

                calculateDamage(attacker, defender, move).then(damage => {
                    const effectiveness = defender.weakness.find(weakness => weakness.type === moveType)?.multiplier || 1;
                    let effectivenessText;
                    if (effectiveness === 0) {
                        effectivenessText = 'Immuun';
                    } else if (effectiveness < 1) {
                        effectivenessText = 'Niet effectief';
                    } else if (effectiveness >= 1 && effectiveness < 2) {
                        effectivenessText = 'Effectief';
                    } else if (effectiveness >= 2 && effectiveness <= 4) {
                        effectivenessText = 'Super effectief';
                    } else {
                        effectivenessText = 'Extreem effectief';
                    }

                    defender.hp -= damage;

                    // Zorg ervoor dat HP niet onder 0 zakt
                    if (defender.hp < 0) {
                        defender.hp = 0;
                    }

                    updateInfo(pokemon, buddy);
                    document.getElementById('move-resultaat').innerHTML = '';

                    const resultDiv = document.createElement('div');
                    resultDiv.className = 'move-resultaat click-next';
                    resultDiv.innerHTML = `
                        <p>${attacker === buddy ? 'Jij' : 'Tegenstander'} gebruikte: ${move}</p>
                        <p>Effectiviteit: ${effectivenessText}</p>
                        <p>Jouw HP: ${Math.round(buddy.hp)}</p>
                        <p>Tegenstander HP: ${Math.round(pokemon.hp)}</p>
                        <br>
                        <p>Klik om verder te gaan >>></p>
                    `;

                    document.getElementById('move-resultaat').appendChild(resultDiv);

                    if (defender.hp <= 0) {
                        checkBattleEnd();
                        return;
                    }

                    resultDiv.onclick = () => {
                        resultDiv.remove();
                        currentIndex++;
                        processAttack();
                    };
                });
            });
        } else {
            currentIndex++;
            processAttack();
        }
    }

    function checkBattleEnd() {
        document.getElementById('move-resultaat').innerHTML = '';
        document.getElementById('buddy-moves').style.display = 'none';

        let msg1, msg2, msg3;
        if (buddy.hp <= 0) {
            msg1 = `${buddy.name} kan niet meer vechten!`;
            msg2 = `${pokemon.name} heeft dit gevecht gewonnen.`;
            msg3 = 'Je krijgt 1 Lost aangerekend.';
        } else if (pokemon.hp <= 0) {
            msg1 = `${pokemon.name} kan niet meer vechten!`;
            msg2 = `${buddy.name} heeft dit gevecht gewonnen.`;
            msg3 = 'Je krijgt 1 Win aangerekend.';
        }

        const resultDiv = document.createElement('div');
        resultDiv.className = 'move-resultaat click-next';
        resultDiv.innerHTML = `
            <p>${msg1}</p>
            <br>
            <p>${msg2}</p>
            <br>
            <p>${msg3}</p>
            <div class="click-pijl">Klik om verder te gaan ></div>
        `;

        resultDiv.onclick = () => {
            window.location.href = 'index.html';
        };

        document.getElementById('move-resultaat').appendChild(resultDiv);
    }

    processAttack();
}


// Voorbeeld data
const pokemon = {
    name: '',
    level: 0,
    hp: 0,
    maxHp: 0,
    moves: ['', '', '', '']
};

const buddy = {
    name: "",
    level: 0,
    hp: 0,
    maxHp: 0,
    moves: ['', '', '', '']
};

async function startBattle(pokemonName) {
    const selectedPokemonName = document.getElementById('pokemon-selector').value.toLowerCase() || pokemonName;

    if (!selectedPokemonName) {
        alert('Typ de naam van een Pokémon om te beginnen!');
        return;
    }

    try {
        const email = JSON.parse(localStorage.getItem("loggedInUser")).email;
        const buddyId = await haalBuddyUitCollectie(email); 

        if (!buddyId) {
            console.error("Geen buddy Pokémon gevonden in database.");
            return;
        }



        // Fetch Pokémon data van de API
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${selectedPokemonName}/`);
        const buddyResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${buddyId}/`);
        if (!response.ok) {
            throw new Error(`Pokémon met de naam "${selectedPokemonName}" kon niet worden gevonden.`);
        }
        if (!buddyResponse.ok) {
            throw new Error(`Pokémon met de naam "${buddyId}" kon niet worden gevonden.`);
        }

        const pokemonData = await response.json();
        const buddyData = await buddyResponse.json();

        // Werk het globale `pokemon` object bij
        const baseStats = {
            hp: pokemonData.stats[0].base_stat,
            attack: pokemonData.stats[1].base_stat,
            defense: pokemonData.stats[2].base_stat,
            sAttack: pokemonData.stats[3].base_stat,
            sDefense: pokemonData.stats[4].base_stat,
            speed: pokemonData.stats[5].base_stat
        };


        let hp = baseStats.hp, attack = baseStats.attack, defense = baseStats.defense, speed = baseStats.speed, sAttack = baseStats.sAttack, sDefense = baseStats.sDefense;

        pokemon.name = pokemonData.name;
        pokemon.level = buddy.level + [-3, -2, -1, 0, 1, 2, 3][Math.floor(Math.random() * 7)];
        for (let i = 1; i <= pokemon.level; i++) {
            hp += hp / 50;
            attack += attack / 50;
            defense += defense / 50;
            speed += speed / 50;
            sAttack += sAttack / 50;
            sDefense += sDefense / 50;
        }
        pokemon.hp = Math.round(hp);
        pokemon.maxHp = Math.round(hp, 0);
        pokemon.attack = attack;
        pokemon.defense = defense;
        pokemon.speed = speed;
        pokemon.sAttack = sAttack;
        pokemon.sDefense = sDefense;
        pokemon.types = pokemonData.types.map(typeInfo => typeInfo.type.name);
        pokemon.weakness = calculateCombinedWeaknesses(pokemon.types);
        
        pokemon.sprite = pokemonData.sprites.front_default;
        buddy.sprite = buddyData.sprites.back_default;

        // Tegenstander moves
        const learnableMoves = pokemonData.moves.filter(move => {
            return move.version_group_details.some(detail =>
                detail.level_learned_at <= pokemon.level && detail.move_learn_method.name === 'level-up'
            );
        }).map(move => move.move.name);

        // Selecteerd de laatste 4 moves
        pokemon.moves = learnableMoves.slice(-4);

        let maxDamage = 0;
        let chosenMove = null;

        for (const move of pokemon.moves) {
            const moveInfo = await GetMoveInfo(move);
            const movePower = moveInfo.power || 0;
            const moveType = moveInfo.type;

            if (movePower > 0) {
                const typeEffectiveness = buddy.weakness.find(weakness => weakness.type === moveType)?.multiplier || 1;
                const damage = movePower * typeEffectiveness;

                if (damage > maxDamage) {
                    maxDamage = damage;
                    chosenMove = move;
                }
            }
        }

        pokemon.chosenMove = chosenMove;

        // Werk de gevechtsinterface aan
        updateInfo(pokemon, buddy);

        // Wissel zichtbaarheid
        document.getElementById('setup-container').style.display = 'none';
        document.getElementById('battle-interface').style.display = 'block';

        document.querySelector('nav').style.display = 'none';
    } catch (error) {
        alert(error.message);
    }
}

// Kleuren van het type
function getTypeColor(type) {
    const typeColors = {
        fire: "#f08030",
        water: "#6890f0",
        grass: "#78c850",
        electric: "#f8d030",
        psychic: "#f85888",
        ice: "#98d8d8",
        dragon: "#7038f8",
        dark: "#705848",
        fairy: "#ee99ac",
        normal: "#a8a878",
        fighting: "#c03028",
        flying: "#a890f0",
        poison: "#a040a0",
        ground: "#e0c068",
        rock: "#b8a038",
        bug: "#a8b820",
        ghost: "#705898",
        steel: "#b8b8d0"
    };
    return typeColors[type] || "#d3d3d3"; // Default color for unknown types
}

// Bereken gecombineerde zwaktes voor multi-typed Pokémon
function calculateCombinedWeaknesses(types) {
const typeEffectiveness = {
    normal: { 
        double_damage_from: ["fighting"], 
        half_damage_from: [], 
        no_damage_from: ["ghost"], 
        single_damage_from: ["normal", "fire", "water", "electric", "grass", "ice", "poison", "ground", "flying", "psychic", "bug", "rock", "dragon", "dark", "steel", "fairy"]
    },
    fire: { 
        double_damage_from: ["water", "rock", "ground"], 
        half_damage_from: ["fire", "grass", "ice", "bug", "steel", "fairy"], 
        no_damage_from: [], 
        single_damage_from: ["normal", "electric", "fighting", "poison", "flying", "psychic", "ghost", "dragon", "dark"]
    },
    water: { 
        double_damage_from: ["electric", "grass"], 
        half_damage_from: ["fire", "water", "ice", "steel"], 
        no_damage_from: [], 
        single_damage_from: ["normal", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "fairy"]
    },
    grass: { 
        double_damage_from: ["fire", "ice", "poison", "flying", "bug"], 
        half_damage_from: ["water", "electric", "grass", "ground"], 
        no_damage_from: [], 
        single_damage_from: ["normal", "fighting", "psychic", "rock", "ghost", "dragon", "dark", "steel", "fairy"]
    },
    electric: { 
        double_damage_from: ["ground"], 
        half_damage_from: ["electric", "flying", "steel"], 
        no_damage_from: [], 
        single_damage_from: ["normal", "fire", "water", "grass", "ice", "fighting", "poison", "psychic", "bug", "rock", "ghost", "dragon", "dark", "fairy"]
    },
    ice: { 
        double_damage_from: ["fire", "fighting", "rock", "steel"], 
        half_damage_from: ["ice"], 
        no_damage_from: [], 
        single_damage_from: ["normal", "water", "electric", "grass", "poison", "ground", "flying", "psychic", "bug", "ghost", "dragon", "dark", "fairy"]
    },
    fighting: { 
        double_damage_from: ["flying", "psychic", "fairy"], 
        half_damage_from: ["bug", "rock", "dark"], 
        no_damage_from: [], 
        single_damage_from: ["normal", "fire", "water", "electric", "grass", "ice", "poison", "ground", "ghost", "dragon", "steel", "fighting"]
    },
    poison: { 
        double_damage_from: ["ground", "psychic"], 
        half_damage_from: ["grass", "fighting", "poison", "bug", "fairy"], 
        no_damage_from: [], 
        single_damage_from: ["normal", "fire", "water", "electric", "ice", "flying", "rock", "ghost", "dragon", "dark", "steel"]
    },
    ground: { 
        double_damage_from: ["water", "grass", "ice"], 
        half_damage_from: ["poison", "rock"], 
        no_damage_from: ["electric"], 
        single_damage_from: ["normal", "fire", "electric", "ice", "fighting", "psychic", "bug", "ghost", "dragon", "dark", "steel", "fairy"]
    },
    flying: { 
        double_damage_from: ["electric", "ice", "rock"], 
        half_damage_from: ["grass", "fighting", "bug"], 
        no_damage_from: ["ground"], 
        single_damage_from: ["normal", "fire", "water", "electric", "poison", "psychic", "ghost", "dragon", "dark", "steel", "fairy"]
    },
    psychic: { 
        double_damage_from: ["bug", "ghost", "dark"], 
        half_damage_from: ["fighting", "psychic"], 
        no_damage_from: [], 
        single_damage_from: ["normal", "fire", "water", "electric", "grass", "ice", "poison", "ground", "flying", "rock", "dragon", "steel", "fairy"]
    },
    bug: { 
        double_damage_from: ["fire", "flying", "rock"], 
        half_damage_from: ["grass", "fighting", "ground"], 
        no_damage_from: [], 
        single_damage_from: ["normal", "water", "electric", "ice", "poison", "psychic", "ghost", "dragon", "dark", "steel", "fairy", "bug"]
    },
    rock: { 
        double_damage_from: ["water", "grass", "fighting", "ground", "steel"], 
        half_damage_from: ["normal", "fire", "poison", "flying"], 
        no_damage_from: [], 
        single_damage_from: ["electric", "ice", "psychic", "bug", "ghost", "dragon", "dark", "fairy", "rock"]
    },
    ghost: { 
        double_damage_from: ["ghost", "dark"], 
        half_damage_from: ["poison", "bug"], 
        no_damage_from: ["normal", "fighting"], 
        single_damage_from: ["fire", "water", "electric", "grass", "ice", "ground", "flying", "psychic", "rock", "dragon", "steel", "fairy"]
    },
    dragon: { 
        double_damage_from: ["ice", "dragon", "fairy"], 
        half_damage_from: ["fire", "water", "electric", "grass"], 
        no_damage_from: [], 
        single_damage_from: ["normal", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dark", "steel"]
    },
    dark: { 
        double_damage_from: ["fighting", "bug", "fairy"], 
        half_damage_from: ["ghost", "dark"], 
        no_damage_from: ["psychic"], 
        single_damage_from: ["normal", "fire", "water", "electric", "grass", "ice", "poison", "ground", "flying", "rock", "dragon", "steel"]
    },
    steel: { 
        double_damage_from: ["fire", "fighting", "ground"], 
        half_damage_from: ["normal", "grass", "ice", "flying", "psychic", "bug", "rock", "dragon", "steel", "fairy"], 
        no_damage_from: ["poison"], 
        single_damage_from: ["water", "electric", "dark", "ghost"]
    },
    fairy: { 
        double_damage_from: ["poison", "steel"], 
        half_damage_from: ["fighting", "bug", "dark"], 
        no_damage_from: ["dragon"], 
        single_damage_from: ["normal", "fire", "water", "electric", "grass", "ice", "ground", "flying", "psychic", "rock", "ghost", "steel"]
    }
};

    const weaknesses = {};

    // Proceseerd elk type
    types.forEach(type => {
        const effectiveness = typeEffectiveness[type];
        if (!effectiveness) return;

        effectiveness.double_damage_from.forEach(weakness => {
            weaknesses[weakness] = (weaknesses[weakness] || 1) * 2;
        });

        effectiveness.half_damage_from.forEach(resistance => {
            weaknesses[resistance] = (weaknesses[resistance] || 1) / 2;
        });

        effectiveness.no_damage_from.forEach(immunity => {
            weaknesses[immunity] = 0;
        });

        effectiveness.single_damage_from.forEach(neutral => {
            weaknesses[neutral] = weaknesses[neutral] || 1; // Zorgt ervoor dat normale schade correct wordt weergegeven
        });
    });


    // Filter de multipliers uit die 1 of 0 zijn
    return Object.entries(weaknesses).map(([type, multiplier]) => ({ type, multiplier }));
}

async function GetMoveInfo(moveName) {
    const url = `https://pokeapi.co/api/v2/move/${moveName}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return {
            type: data.type.name,
            power: data.power,
            accuracy: data.accuracy,
            priority: data.priority,
            damage_class: data.damage_class.name,
            effect: data.effect_entries.length > 0 ? data.effect_entries[0].effect : "No effect description available"
        };
    } catch (error) {
        console.error("Error fetching move data:", error);
    }
}

// Functie om de schade te berekenen
async function calculateDamage(attacker, defender, move) {
    const moveInfo = await GetMoveInfo(move);
    const moveType = moveInfo.type;
    const movePower = moveInfo.power || 0;
    const moveAccuracy = moveInfo.accuracy || 100;
    const movePriority = moveInfo.priority || 0;

    // Bereken de basis schade
    const baseDamage = ((2 * attacker.level / 5 + 2) * movePower * attacker.attack / defender.defense) / 50 + 2;

    // Bereken de type-effectiviteit
    const typeEffectiveness = defender.weakness.find(weakness => weakness.type === moveType)?.multiplier || 1;

    // Bereken de totale schade
    const totalDamage = baseDamage * typeEffectiveness;

    return totalDamage;
}

// Functie om de volgorde van aanvallen te bepalen
async function determineAttackOrder(pokemon, buddy) {
    const pokemonSpeed = pokemon.speed;
    const buddySpeed = buddy.speed;

    const pokemonMovePriority = pokemon.chosenMove ? (await GetMoveInfo(pokemon.chosenMove)).priority : 0;
    const buddyMovePriority = buddy.chosenMove ? (await GetMoveInfo(buddy.chosenMove)).priority : 0;

    if (pokemonMovePriority > buddyMovePriority) {
        return [pokemon, buddy];
    } else if (pokemonMovePriority < buddyMovePriority) {
        return [buddy, pokemon];
    } else {
        if (pokemonSpeed > buddySpeed) {
            return [pokemon, buddy];
        } else {
            return [buddy, pokemon];
        }
    }
}
