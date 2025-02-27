async function fetchPokemonData(pokemonId) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/`);
        if (response.ok) {
            const pokemon = await response.json();
            return {
                id: pokemon.id,
                name: pokemon.name,
                types: pokemon.types.map(typeInfo => typeInfo.type.name).join(', '),
                sprite: pokemon.sprites.front_default
            };
        } else {
            console.error(`Kan Pokémon met ID: ${pokemonId} niet ophalen.`);
            return null;
        }
    } catch (error) {
        console.error(`Error Pokémon met ID: ${pokemonId}`, error);
        return null;
    }
}

async function displayPokemonList() {
    const pokemonList = document.getElementById('pokemon-list');

    for (let pokemonId = 1; pokemonId <= 1025; pokemonId++) {
        const pokemonData = await fetchPokemonData(pokemonId);
        if (pokemonData) {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <img src="${pokemonData.sprite}" alt="${pokemonData.name}">
                <strong>ID: ${pokemonData.id} </strong>
                <strong>Naam: ${pokemonData.name} </strong>
                <strong>Type: ${pokemonData.types} </strong>
            `;
            listItem.onclick = () => pokemonDetails(pokemonData);
            pokemonList.appendChild(listItem);
        }
    }
}
function pokemonDetails(pokemon) {
    document.getElementById('pokemon-id').textContent = pokemon.id;
    document.getElementById('pokemon-naam').textContent = pokemon.name;
    document.getElementById('pokemon-level').textContent = pokemon.level;
    document.getElementById('pokemon-type').textContent = pokemon.types;
    document.getElementById('pokemon-sprite').src = pokemon.sprite;
    document.getElementById('pokemon-sprite').alt = pokemon.name;
}

document.addEventListener('DOMContentLoaded', displayPokemonList);
