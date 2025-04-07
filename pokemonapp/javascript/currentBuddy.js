async function loadJSON() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/M4W01F/WPL_1PRO_D2_Elite-4/BackEnd-logic/pokemonapp/test_data/UserData.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} - ${response.statusText}`);
        }
        const jsonData = await response.json();
        getBuddyPokemonStats(jsonData);
    } catch (error) {
        console.error('Error loading JSON:', error);
    }
}

loadJSON();
async function getBuddyPokemonStats(data) {
    // vind de buddy
    const buddyPokemon = data.collection.find(pokemon => pokemon.isBuddy === true);

    if (buddyPokemon) {
        const pokemonId = buddyPokemon.pokemon_id;
        const level = buddyPokemon.level;

        // Extract alleen move namen en maakt zeker dat er alleen 4 moves zijn niet meer
        const moveNames = (buddyPokemon?.moves || []).map(move => move.name || "Unknown Move").slice(0, 4);
        while (moveNames.length < 4) {
            moveNames.push("Unknown Move"); // Placeholder
        }

        // Behuid de stats
        const buddyStats = {
            id: pokemonId,
            level: level,
            moves: moveNames
        };

        updateBuddyMoves(buddyStats.id, buddyStats.moves);
        setCurrentBuddy(buddyStats.id, buddyStats.level);
        updateFooterBuddySprite(buddyStats.id);
        fetchPokemonLearnableMoves(buddyStats.id);
    } else {
        throw new Error('No buddy Pokémon found.');
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


// Stel huidige buddy in en toon informatie
async function setCurrentBuddy(pokemonId, level) {
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
            <p><strong>Wins:</strong> 10</p>
            <p><strong>Losses:</strong> 2</p>
            <p><strong>Level:</strong> ${level}</p>
        `;
        
        // Bereken statistieken
        const baseStats = {
            hp: pokemon.stats[0].base_stat,
            attack: pokemon.stats[1].base_stat,
            defense: pokemon.stats[2].base_stat,
            speed: pokemon.stats[5].base_stat
        };


        let hp = baseStats.hp, attack = baseStats.attack, defense = baseStats.defense, speed = baseStats.speed;

        for (let i = 1; i <= level; i++) {
            hp += hp / 50;
            attack += attack / 50;
            defense += defense / 50;
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
            <p><strong>HP: ${Math.floor(hp)}</strong></p>
            <p><strong>Attack: ${Math.floor(attack)}</strong></p>
            <p><strong>Defense: ${Math.floor(defense)}</strong></p>
            <p><strong>Speed: ${Math.floor(speed)}</strong></p><br>
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

async function updateFooterBuddySprite(query) {
    try {
        const pokemon = await fetchPokemonData(query);
        if (pokemon) {
            const footerImg = document.getElementById('current-buddy-img');

            footerImg.src = pokemon.sprites.front_default;
            footerImg.alt = pokemon.name;
        } else {
            console.error(`Unable to update footer with Pokémon sprite for query: ${query}`);
        }
    } catch (error) {
        console.error(`Error while updating footer buddy sprite:`, error);
    }
}

async function updateBuddyMoves(id, moves) {
    try {
        console.log("Updating buddy moves:", moves);
        console.log("BuddyStats ID:", id);

        const allLearnableMoves = await fetchPokemonLearnableMoves(id);

        console.log("Fetched learnable moves:", allLearnableMoves);

        if (!Array.isArray(allLearnableMoves) || allLearnableMoves.length === 0) {
            console.error("No learnable moves fetched for the Pokémon.");
            document.getElementById('buddy-moves').innerHTML = "<p>No learnable moves available.</p>";
            return;
        }

        const availableMoves = allLearnableMoves.filter(move => !moves.includes(move));

        console.log("Available moves after filtering:", availableMoves);

        if (!Array.isArray(availableMoves) || availableMoves.length === 0) {
            console.error("No available moves to display.");
            document.getElementById('buddy-moves').innerHTML = "<p>No available moves to choose from.</p>";
            return;
        }

        const moveInputs = moves.map((moveName, index) => `
            <div style="margin-bottom: 10px;">
                <input type="text" placeholder="${moveName}" readonly style="margin-right: 10px; width: 90%; font-weight: bolder;">
                    <select onchange="handleMoveChange(${index}, ${moves})">
                    <option value="" disabled selected>Selecteer een move</option>
                    ${availableMoves.map(learnableMove => `<option value="${learnableMove}">${learnableMove}</option>`).join('')}
                </select>
            </div>
        `).join('');

        document.getElementById('buddy-moves').innerHTML = moveInputs;
    } catch (error) {
        console.error("Error updating buddy moves:", error);
        document.getElementById('buddy-moves').innerHTML = "<p>An error occurred while updating moves.</p>";
    }
}

async function fetchPokemonLearnableMoves(pokemonId) {
    try {
        console.log("Fetching learnable moves for Pokémon ID:", pokemonId);

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        if (response.ok) {
            const data = await response.json();

            console.log("Fetched data:", data);

            const moveNames = data.moves.map(moveEntry => moveEntry.move.name);
            console.log("Extracted move names:", moveNames);

            return moveNames;
        } else {
            console.error(`Failed to fetch learnable moves for Pokémon ID: ${pokemonId}`);
            return [];
        }
    } catch (error) {
        console.error("Error fetching learnable moves:", error);
        return [];
    }
}

function handleMoveChange(moveIndex, moves) {
    console.log("test")
    const selectedMove = moves[moveIndex];
    console.log(selectedMove)
    console.log("move selector",selectedMove)
    if (selectedMove) {
        moves[moveIndex] = selectedMove;

        console.log(`Move changed successfully to: ${selectedMove}`);

        updateBuddyMoves(moves);

        alert(`Move succesvol veranderd naar: ${selectedMove}`);
    }
}
