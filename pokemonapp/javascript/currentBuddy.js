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

// Controleert of de cookies leeg zijn en vult ze met moves uit JSON, indien nodig.
async function fetchPokemonLearnableMoves(pokemonId) {
    try {
        console.log("Fetching learnable moves for Pokémon ID:", pokemonId);

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        if (!response.ok) {
            console.error(`Failed to fetch learnable moves for Pokémon ID: ${pokemonId}`);
            return [];
        }

        const data = await response.json();
        console.log("Fetched data:", data);

        // Filter moves learned through level-up and TM/HM
        const learnableMoves = data.moves.filter(moveEntry =>
            moveEntry.version_group_details.some(detail =>
                ["level-up", "machine"].includes(detail.move_learn_method.name)
            )
        ).map(moveEntry => moveEntry.move.name);

        // Fetch move details to filter out status moves AND remove moves with power <= 0 or null
        const filteredMovePromises = learnableMoves.map(async (moveName) => {
            const moveResponse = await fetch(`https://pokeapi.co/api/v2/move/${moveName}`);
            if (!moveResponse.ok) return null;

            const moveData = await moveResponse.json();

            // Remove status moves and moves with power null or 0
            return (moveData.damage_class.name !== "status" && moveData.power > 0) ? moveName : null;
        });

        const filteredMoves = (await Promise.all(filteredMovePromises)).filter(move => move);
        console.log("Extracted moves with valid power:", filteredMoves);

        return filteredMoves;

    } catch (error) {
        console.error("Error fetching learnable moves:", error);
        return [];
    }
}

// Werk de buddy-sprite in de voettekst bij in de DOM
function updateFooterBuddySprite(pokemon) {
    const footerImg = document.getElementById('current-buddy-img');
    if (footerImg && pokemon.sprites && pokemon.sprites.front_default) {
        footerImg.src = pokemon.sprites.front_default;
        footerImg.alt = pokemon.name;
        console.log(`Afbeelding in voettekst bijgewerkt naar: ${footerImg.src}`);
    } else {
        console.error("Afbeeldingselement in voettekst niet gevonden of Pokémon-gegevens zijn ongeldig.");
    }
}

// Buddy stats en moves
async function getBuddyPokemonStats(data) {
    try {
        // Vind de buddy-Pokémon in de JSON-gegevens
        const buddyPokemon = data.collection.find(pokemon => pokemon.isBuddy === true);

        if (buddyPokemon) {
            const pokemonId = buddyPokemon.pokemon_id; // ID van de buddy-Pokémon
            const level = buddyPokemon.level; // Level van de buddy
            const wins = buddyPokemon.wins;
            const loses = buddyPokemon.loses;

            // Controleer of moves al in cookies bestaan
            const moves = await initializeMovesFromJSON(pokemonId); // Haal moves uit cookies of JSON
            console.log("Moves geladen:", moves);

            // Stel de buddy-statistieken samen
            const buddyStats = {
                id: pokemonId,
                level: level,
                moves: moves,
                wins: wins,
                loses: loses
            };

            console.log("Buddy-Pokémon-statistieken:", buddyStats);

            // Haal Pokémon-gegevens op van de API en werk de DOM bij
            const pokemon = await fetchPokemonData(buddyStats.id);
            updateFooterBuddySprite(pokemon);

            updateBuddyMoves(buddyStats.id, buddyStats.moves);
            setCurrentBuddy(buddyStats.id, buddyStats.level, buddyStats.wins, buddyStats.loses);
            fetchPokemonLearnableMoves(buddyStats.id);
        } else {
            console.error("Geen buddy-Pokémon gevonden in de JSON-gegevens.");
        }
    } catch (error) {
        console.error("Fout bij het verwerken van buddy-Pokémon-statistieken:", error);
    }
}

// Stel huidige buddy in en toon informatie
async function setCurrentBuddy(pokemonId, level, wins, loses) {
    const pokemon = await fetchPokemonData(pokemonId);
    const species = await fetchSpeciesData(pokemonId);
    if (pokemon && species) {
        const buddyDiv = document.getElementById('current-buddy-info');
        const statsDiv = document.getElementById('buddy-stats');
        const evolutionDiv = document.getElementById('buddy-evolution');

        buddyDiv.innerHTML = `
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" style="width: 150px; height: 150px;">
            <p><strong>Naam:</strong> ${pokemon.name}</p>
            <p><strong>Bijnaam:</strong> Blaze</p>
            <p><strong>ID:</strong> ${pokemon.id}</p>
            <p><strong>Wins:</strong> ${wins}</p>
            <p><strong>Losses:</strong> ${loses}</p>
            <p><strong>Level:</strong> ${level}</p>
        `;
        
        // Bereken statistieken
        const baseStats = {
            hp: pokemon.stats[0].base_stat,
            attack: pokemon.stats[1].base_stat,
            defense: pokemon.stats[2].base_stat,
            sAttack: pokemon.stats[3].base_stat,
            sDefense: pokemon.stats[4].base_stat,
            speed: pokemon.stats[5].base_stat
        };


        let hp = baseStats.hp, attack = baseStats.attack, sAttack = baseStats.sAttack, defense = baseStats.defense, sDefense = baseStats.sDefense, speed = baseStats.speed;

        for (let i = 1; i <= level; i++) {
            hp += hp / 50;
            attack += attack / 50;
            defense += defense / 50;
            sAttack += sAttack / 50;
            sDefense += sDefense / 50;
            speed += speed / 50;
        }

        // Bereken typen en zwaktes dynamisch
        const types = pokemon.types.map(typeInfo => typeInfo.type.name);
        const weaknesses = calculateCombinedWeaknesses(types);

        const typeBadges = types.map(type => `
            <span class="type-badge" style="background-color: ${getTypeColor(type)}; color: #fff; border-radius: 5px; padding: 5px 10px; margin-right: 5px;">${type}</span>
        `).join('');

        const weaknessBadges = weaknesses.map(({ type, multiplier }) => `
            <span class="type-badge" style="background-color: ${getTypeColor(type)}; color: #fff; border-radius: 5px; padding: 5px 10px; margin-right: 5px;">
                ${type} (${multiplier}x)
            </span>
        `).join('');

        statsDiv.innerHTML = `
            <p><strong>Stats:</strong></p>
            <p><strong>HP: &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;<b>${Math.floor(hp)}</b></strong></p>
            <p><strong>Attack: &nbsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;<b>${Math.floor(attack)}</b></strong></p>
            <p><strong>Defense: &ensp;&emsp;&emsp;&emsp;&emsp;&emsp;<b>${Math.floor(defense)}</b></strong></p>
            <p><strong>Special-Atack: &ensp;&ensp;&emsp;&emsp;<b>${Math.floor(sAttack)}</b></strong></p>
            <p><strong>Special-Defence: &nbsp;&ensp;&emsp;<b>${Math.floor(sDefense)}</b></strong></p>
            <p><strong>Speed: &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;<b>${Math.floor(speed)}</b></strong></p><br>
            <p><strong>Types:</strong></p>
            ${typeBadges}<br><br>
            <p><strong>Zwaktes:</strong></p>
            ${weaknessBadges}
        `;

        // Evolutieketen ophalen en tonen
        const evolutionChain = [];
        const chain = species.evolution_chain.url;
        const evolutionResponse = await fetch(chain);
        const evolutionData = await evolutionResponse.json();

        let evolution = evolutionData.chain;
        while (evolution) {
            evolutionChain.push(evolution.species.name);
            evolution = evolution.evolves_to[0];
        }

        evolutionDiv.innerHTML = `
            <p><strong>Evolutie Lijn:</strong></p>
            ${await Promise.all(
                evolutionChain.map(async name => {
                    const evoData = await fetchPokemonData(name);
                    return `
                        <div style="
                            display: inline-block;
                            border: 3px solid #ccc;
                            border-radius: 50%;
                            padding: 5px;
                            margin: 5px;
                            width: 60px;
                            height: 60px;
                            text-align: center;
                        ">
                            <img src="${evoData.sprites.front_default}" alt="${evoData.name}" style="width: 50px; height: 50px;">
                        </div>
                    `;
                })
            ).then(sprites => sprites.join(''))}
        `;
    }
}

// Update de moves van uw buddy.
async function updateBuddyMoves(id, moves) {
    try {
        if (!Array.isArray(moves) || moves.length === 0) {
            console.error("Moves-array is ongeldig of leeg.");
            document.getElementById('buddy-moves').innerHTML = "<p>Geen moves beschikbaar.</p>";
            return;
        }

        console.log("Buddy moves bijwerken:", moves);

        const allLearnableMoves = await fetchPokemonLearnableMoves(id);
        allLearnableMoves.sort((a, b) => a.localeCompare(b)); // Alfabetisch gesorteerd
        const availableMoves = allLearnableMoves.filter(move => !moves.includes(move)); // Filter bestaande moves
        console.log("Beschikbare moves:", availableMoves);

        // Fetch move details voor elke move
        const moveDataPromises = moves.map(async (moveName, index) => {
            const moveInfo = await GetMoveInfo(moveName); // Fetch move details
            const moveType = moveInfo.type;
            const moveColor = getTypeColor(moveType);
            const movePower = moveInfo.power || "N/A";
            const moveAccuracy = moveInfo.accuracy || "N/A";

            return `
        <div style="margin-bottom: 2%; padding: 1%; border-radius: 2%; background-color: ${moveColor}; color: white; width: 95%; height: auto;">
            <div style="width: 100%; text-align: left;">
                <span style="font-size: 2vw; font-weight: bold; display: block;">${moveName}</span>
                <hr style="border: 0.5px solid rgba(255,255,255,0.5); margin: 1% 0;">
                <p style="margin: 1% 0; font-size: 1.5vw;">🗡️ <strong>Power:</strong> ${movePower}</p>
                <p style="margin: 1% 0; font-size: 1.5vw;">🎯 <strong>Accuracy:</strong> ${moveAccuracy}%</p>
            </div>
            <select onchange="handleMoveChange(${index}, '${id}')" 
                    style="background: white; border: none; padding: 0.5%; border-radius: 2%; font-size: 1.5vw; width: 100%; display: block; margin-top: 1%;">
                <option value="" disabled selected>Selecteer een move</option>
                ${availableMoves.map(learnableMove => `<option value="${learnableMove}">${learnableMove}</option>`).join('')}
            </select>
        </div>

            `;
        });

        const moveInputs = await Promise.all(moveDataPromises);
        document.getElementById('buddy-moves').innerHTML = moveInputs.join('');
    } catch (error) {
        console.error("Fout bij het bijwerken van buddy moves:", error);
        document.getElementById('buddy-moves').innerHTML = "<p>Er is een fout opgetreden bij het bijwerken van moves.</p>";
    }
}

function updateMovesInCookies(moveIndex, id, newMove) {
    try {
        // Haal de huidige moves op uit cookies
        const cookieMoves = getCookie(`buddy_${id}_moves`);
        if (cookieMoves) {
            const moves = JSON.parse(cookieMoves);
            console.log("Huidige moves:", moves);

            // Controleer of de moves een string-array is
            if (!Array.isArray(moves) || typeof moves[0] !== "string") {
                console.error("Moves-array is niet correct geformatteerd. Initialisatie vereist.");
                return;
            }

            // Werk de specifieke move bij
            moves[moveIndex] = newMove;
            console.log(`Move op index ${moveIndex} gewijzigd naar: ${newMove}`);

            // Sla de bijgewerkte moves opnieuw op in cookies
            setCookie(`buddy_${id}_moves`, JSON.stringify(moves), 7);
            console.log("Bijgewerkte moves opgeslagen in cookies:", moves);

            alert(`Move succesvol gewijzigd naar: ${newMove}`);
        } else {
            console.error("Moves niet gevonden in cookies. Kan niet bijwerken.");
        }
    } catch (error) {
        console.error("Fout bij het bijwerken van moves in cookies:", error);
    }
}

function handleMoveChange(moveIndex, id) {
    try {
        const moveSelectElement = document.querySelectorAll('select')[moveIndex];
        const selectedMove = moveSelectElement.value;

        if (!selectedMove) {
            console.error("Geen geselecteerde move. Kan niet bijwerken.");
            return;
        }

        const cookieMoves = getCookie(`buddy_${id}_moves`);
        if (!cookieMoves || cookieMoves === "undefined") {
            console.error("Moves niet gevonden in cookies. Kan niet bijwerken.");
            return;
        }

        const moves = JSON.parse(cookieMoves);
        console.log("Huidige moves uit cookies:", moves);

        moves[moveIndex] = selectedMove; // Update de specifieke move
        console.log(`Move op index ${moveIndex} gewijzigd naar: ${selectedMove}`);

        setCookie(`buddy_${id}_moves`, JSON.stringify(moves), 7); // Sla de bijgewerkte moves opnieuw op
        console.log("Bijgewerkte moves opgeslagen in cookies:", moves);

        updateBuddyMoves(id, moves); // Herlaad de moves in de DOM
    } catch (error) {
        console.error("Fout bij het wijzigen van een move:", error);
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

// Haal soortgegevens van een Pokémon op
async function fetchSpeciesData(query) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${query}`);
        if (response.ok) {
            const species = await response.json();
            return species; // Retourneer het soort-object
        } else {
            console.error(`Kan de Pokémon-soort niet ophalen met query: ${query}.`);
            return null;
        }
    } catch (error) {
        console.error(`Fout bij het ophalen van Pokémon-soortgegevens:`, error);
        return null;
    }
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

// Kleuren koppelen aan typen
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
    return typeColors[type] || "#d3d3d3";
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
