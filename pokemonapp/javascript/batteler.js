// Laad het JSON-bestand, vind de buddy-Pokémon, en werk de voettekst-sprite bij
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const filePath = "./test_data/UserData.json"; // Pad naar JSON-bestand
        const response = await fetch(filePath); // Haal JSON-bestand op
        jsonData = await response.json(); // Parse JSON-bestand
        console.log("Loaded JSON data:", jsonData);

        const buddyPokemon = jsonData.collection.find(pokemon => pokemon.isBuddy === true); // Vind de buddy Pokémon
        if (buddyPokemon) {
            await getBuddyPokemonStats(jsonData); // Verwerk buddy-Pokémon-statistieken
        } else {
            console.error("Geen buddy Pokémon gevonden.");
        }
    } catch (error) {
        console.error("Fout bij het laden van JSON of bijwerken van buddy sprite:", error);
    }
});

// Zet een cookie
function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

// Haal een cookie op
function getCookie(name) {
    const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
        const [key, val] = cookie.split('=');
        acc[key] = decodeURIComponent(val);
        return acc;
    }, {});
    return cookies[name];
}

// Controleer of een cookie leeg is
function isCookieEmpty(name) {
    const cookieValue = getCookie(name);
    return !cookieValue || cookieValue === '';
}

async function initializeMovesFromJSON(id) {
    try {
        const cookieMoves = getCookie(`buddy_${id}_moves`);
        if (cookieMoves && !isCookieEmpty(`buddy_${id}_moves`)) {
            console.log("Moves geladen uit cookies:", JSON.parse(cookieMoves));
            return JSON.parse(cookieMoves); // Gebruik moves uit cookies
        }

        console.log("Cookies zijn leeg. Moves worden geladen uit JSON.");

        const filePath = "./test_data/UserData.json"; // Pad naar je JSON-bestand
        const response = await fetch(filePath);
        const jsonData = await response.json();

        const buddyPokemon = jsonData.collection.find(pokemon => pokemon.pokemon_id === id);
        if (buddyPokemon) {
            const moves = buddyPokemon.moves.map(move => move.name || "Onbekende Beweging");
            console.log("Moves geladen uit JSON:", moves);

            // Sla de moves op in cookies
            setCookie(`buddy_${id}_moves`, JSON.stringify(moves), 7);
            console.log("Moves succesvol opgeslagen in cookies:", moves);

            return moves;
        } else {
            console.error("Geen buddy Pokémon gevonden in JSON.");
            return [];
        }
    } catch (error) {
        console.error("Fout bij het initialiseren van moves:", error);
        return [];
    }
}

// Laad de moves uit cookies
async function loadMoves(id) {
    try {
        // Controleer of moves in de cookies bestaan
        const cookieMoves = getCookie(`buddy_${id}_moves`);
        if (!cookieMoves || isCookieEmpty(`buddy_${id}_moves`)) {
            console.log("Cookies zijn leeg, moves worden geladen uit JSON.");

            // Laad JSON-gegevens
            const filePath = "./test_data/UserData.json"; // Pad naar je JSON-bestand
            const response = await fetch(filePath);
            jsonData = await response.json();

            // Vind de buddy Pokémon en stel cookies in
            const buddyPokemon = jsonData.collection.find(pokemon => pokemon.pokemon_id === id);
            if (buddyPokemon) {
                setCookie(`buddy_${id}_moves`, JSON.stringify(buddyPokemon.moves), 7);
                console.log("Moves opgeslagen in cookies:", buddyPokemon.moves);
                return buddyPokemon.moves; // Retourneer de moves uit de JSON
            } else {
                console.error("Geen buddy Pokémon gevonden in JSON.");
                return [];
            }
        } else {
            console.log("Moves geladen uit cookies:", JSON.parse(cookieMoves));
            return JSON.parse(cookieMoves); // Retourneer de moves uit de cookies
        }
    } catch (error) {
        console.error("Fout bij het laden van moves:", error);
        return [];
    }
}

// Buddy stats en moves
async function getBuddyPokemonStats(data) {
    try {
        // Vind de buddy-Pokémon in de JSON-gegevens
        const buddyPokemon = data.collection.find(pokemon => pokemon.isBuddy === true);

        if (buddyPokemon) {
            const pokemonId = buddyPokemon.pokemon_id; // ID van de buddy-Pokémon
            const level = buddyPokemon.level; // Niveau van de buddy

            // Controleer of moves al in cookies bestaan
            const moves = await initializeMovesFromJSON(pokemonId); // Haal moves uit cookies of JSON
            console.log("Moves geladen:", moves);

            // Stel de buddy-statistieken samen
            const buddyStats = {
                id: pokemonId,
                level: level,
                moves: moves
            };

            console.log("Buddy-Pokémon-statistieken:", buddyStats);
            
            // Roep de functies aan om de informatie te updaten
            updateBuddyMoves(buddyStats.moves);
            setCurrentBuddy(buddyStats.id, buddyStats.level)

        } else {
            console.error("Geen buddy-Pokémon gevonden in de JSON-gegevens.");
        }
    } catch (error) {
        console.error("Fout bij het verwerken van buddy-Pokémon-statistieken:", error);
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
        console.log(buddyData.name);
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
        <p>HP: ${pokemon.hp}/${pokemon.maxHp || 100}</p>
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
        <p>HP: ${buddy.hp}/${buddy.maxHp || 100}</p>
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
    document.getElementById('move-resultaat').style.display = 'block';
    // Voorbeeld voor het verlies van hp
    const effectiveness = Math.random() > 0.5 ? 'effectief' : 'niet effectief';
    pokemon.hp -= Math.floor(Math.random() * 40);
    buddy.hp -= Math.floor(Math.random() * 40);
    if (pokemon.hp < 0) {
        pokemon.hp = 0;
    }
    if (buddy.hp < 0) {
        buddy.hp = 0;
    }
    // Maak de move resultaat div leeg voordat een nieuw resultaat getoond word.
    document.getElementById('move-resultaat').innerHTML = '';

    updateMoveResult(true, move, effectiveness, buddy.hp, pokemon.hp);
    updateInfo(pokemon, buddy);

    // Als tegenstander of buddy hun hp op minstens 0 staat
    const resultDiv = document.createElement('div');
    resultDiv.className = 'move-resultaat';
    resultDiv.style.position = 'relative'; // To position the arrow inside it
    
    if (buddy.hp <= 0) {
        document.getElementById('move-resultaat').innerHTML = '';
        document.getElementById('buddy-moves').style.display = 'none';
        resultDiv.innerHTML = `
            <p>${buddy.name} kan niet meer vechten!</p>
            <br>
            <p>${pokemon.name} heeft dit gevecht gewonnen.</p>
            <br>
            <p>Je krijgt 1 Lost aangerekend.</p>
            <div class="click-pijl">Klik om verder te gaan ></div>
        `;
    
        resultDiv.onclick = () => {
            window.location.href = 'index.html'; // Redirect to index.html
        };
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
            <div class="click-pijl">Klik om verder te gaan ></div>
        `;
    
        resultDiv.onclick = () => {
            window.location.href = 'index.html'; // Redirect to index.html
        };
    }
    
    document.getElementById('move-resultaat').appendChild(resultDiv);
    
    // Stijling voor pijl animatie
    const style = document.createElement('style');
    style.textContent = `
        .click-pijl {
            position: absolute;
            bottom: 10px;
            right: 10px;
            animation: move-left-right 1.5s infinite;
            font-size: 12px;
            color: #fff;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
        }

        @keyframes move-left-right {
            0% {
                transform: translateX(0);
            }
            50% {
                transform: translateX(-10px);
            }
            100% {
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);
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
        normal: { double_damage_from: ["fighting"], half_damage_from: ["ghost"], no_damage_from: ["ghost"] },
        fire: { double_damage_from: ["water", "rock", "ground"], half_damage_from: ["fire", "grass", "ice", "bug", "steel", "fairy"], no_damage_from: [] },
        water: { double_damage_from: ["electric", "grass"], half_damage_from: ["fire", "water", "ice", "steel"], no_damage_from: [] },
        grass: { double_damage_from: ["fire", "ice", "poison", "flying", "bug"], half_damage_from: ["water", "electric", "grass", "ground"], no_damage_from: [] },
        electric: { double_damage_from: ["ground"], half_damage_from: ["electric", "flying", "steel"], no_damage_from: [] },
        ice: { double_damage_from: ["fire", "fighting", "rock", "steel"], half_damage_from: ["ice"], no_damage_from: [] },
        fighting: { double_damage_from: ["flying", "psychic", "fairy"], half_damage_from: ["bug", "rock", "dark"], no_damage_from: [] },
        poison: { double_damage_from: ["ground", "psychic"], half_damage_from: ["grass", "fighting", "poison", "bug", "fairy"], no_damage_from: [] },
        ground: { double_damage_from: ["water", "grass", "ice"], half_damage_from: ["poison", "rock"], no_damage_from: ["electric"] },
        flying: { double_damage_from: ["electric", "ice", "rock"], half_damage_from: ["grass", "fighting", "bug"], no_damage_from: ["ground"] },
        psychic: { double_damage_from: ["bug", "ghost", "dark"], half_damage_from: ["fighting", "psychic"], no_damage_from: [] },
        bug: { double_damage_from: ["fire", "flying", "rock"], half_damage_from: ["grass", "fighting", "ground"], no_damage_from: [] },
        rock: { double_damage_from: ["water", "grass", "fighting", "ground", "steel"], half_damage_from: ["normal", "fire", "poison", "flying"], no_damage_from: [] },
        ghost: { double_damage_from: ["ghost", "dark"], half_damage_from: ["poison", "bug"], no_damage_from: ["normal", "fighting"] },
        dragon: { double_damage_from: ["ice", "dragon", "fairy"], half_damage_from: ["fire", "water", "electric", "grass"], no_damage_from: [] },
        dark: { double_damage_from: ["fighting", "bug", "fairy"], half_damage_from: ["ghost", "dark"], no_damage_from: ["psychic"] },
        steel: { double_damage_from: ["fire", "fighting", "ground"], half_damage_from: ["normal", "grass", "ice", "flying", "psychic", "bug", "rock", "dragon", "steel", "fairy"], no_damage_from: ["poison"] },
        fairy: { double_damage_from: ["poison", "steel"], half_damage_from: ["fighting", "bug", "dark"], no_damage_from: ["dragon"] }
    };

    const weaknesses = {};

    // Proceseerd elk type
    types.forEach(type => {
        const effectiveness = typeEffectiveness[type];
        if (!effectiveness) return;

        // Toont double shade van dit type.
        effectiveness.double_damage_from.forEach(weakness => {
            weaknesses[weakness] = (weaknesses[weakness] || 1) * 2;
        });

        // Plaats half shade van dit type
        effectiveness.half_damage_from.forEach(resistance => {
            weaknesses[resistance] = (weaknesses[resistance] || 1) / 2;
        });

        // Plaats geen shade vam dit type
        effectiveness.no_damage_from.forEach(immunity => {
            weaknesses[immunity] = 0; // Op 0 gezet om immuniteit te aantonen.
        });
    });

    // Filter de multipliers uit die 1 of 0 zijn
    return Object.entries(weaknesses)
        .filter(([_, multiplier]) => multiplier > 1)
        .map(([type, multiplier]) => ({ type, multiplier }));
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
