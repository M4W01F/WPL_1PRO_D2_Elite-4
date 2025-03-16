async function fetchPokemon(num) {
    const input = document.getElementById(`pokemon${num}`);
    const img = document.getElementById(`img${num}`);
    const statsTable = document.getElementById(`stats${num}`);
    const pokemonName = input.value.toLowerCase().trim();

    if (!pokemonName) return;

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        if (!response.ok) {
            throw new Error(`Pokémon "${pokemonName}" niet gevonden.`);
        }

        const pokemonData = await response.json();
        img.src = pokemonData.sprites.front_default; 


        statsTable.innerHTML = `
            <tr><th>Stat</th><th>Waarde</th></tr>
            ${pokemonData.stats.map(stat => `<tr><td>${stat.stat.name}</td><td>${stat.base_stat}</td></tr>`).join('')}
        `;


        const typesElement = document.createElement("p");
        typesElement.innerHTML = `<tr><td>Types:</tr></td> ${pokemonData.types.map(type => type.type.name).join(", ")}`;
        statsTable.appendChild(typesElement);


        const weaknessesElement = document.createElement("p");
        const weaknesses = await getWeaknesses(pokemonData.types);
        weaknessesElement.innerHTML = `<tr><td>Weaknesses:  </tr></td> ${weaknesses.join(", ")}`;
        statsTable.appendChild(weaknessesElement);

    } catch (error) {
        alert('Niet gelukt! Probeer opnieuw.');
    }
}


async function getWeaknesses(types) {
    const typeWeaknesses = {
        "fire": ["water", "ground", "rock"],
        "water": ["electric", "grass"],
        "electric": ["ground"],
        "grass": ["fire", "ice", "poison", "flying", "bug"],
        "bug": ["fire", "flying", "rock"],
        "rock": ["water", "grass", "fighting", "ground", "steel"],
        "ground": ["water", "ice", "grass", "ice"],
        "ice": ["fire", "fighting", "rock", "steel"],
        "fighting": ["flying", "psychic", "fairy"],
        "ghost": ["ghost", "dark"],
        "psychic": ["bug", "ghost", "dark"],
        "dark": ["fighting", "bug", "fairy"],
        "fairy": ["poison", "steel"]
    };

    //Zwaktes
    const weaknesses = [];
    for (const type of types) {
        const typeName = type.type.name;
        if (typeWeaknesses[typeName]) {
            weaknesses.push(...typeWeaknesses[typeName]);
        }
    }

    return [...new Set(weaknesses)]; 
}

//Evolutie path
async function getEvolutionPath(pokemonName) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`);
    const data = await response.json();
    const evolutionUrl = data.evolution_chain.url;
    const evolutionResponse = await fetch(evolutionUrl);
    const evolutionData = await evolutionResponse.json();
    const evolutionChain = [];
    let evolution = evolutionData.chain;
    while (evolution) {
        evolutionChain.push(evolution.species.name);
        evolution = evolution.evolves_to[0]; 
    }

    return evolutionChain;
}
