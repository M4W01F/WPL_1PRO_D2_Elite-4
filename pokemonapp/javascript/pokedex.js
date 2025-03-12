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
            listItem.style.border = "1px dashed gray";
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

    const spriteElement = document.getElementById('pokemon-sprite');
    spriteElement.src = pokemon.sprite;
    spriteElement.alt = pokemon.name;

    // Centreerd de sprite van de pokemon
    spriteElement.style.display = 'block';
    spriteElement.style.margin = '0 auto';

    // Maakt dit veld zichtbaar
    const detailsDiv = document.getElementById('pokemon-details');
    if (detailsDiv) {
        detailsDiv.hidden = false;

        // Style voor pokemon detail
        detailsDiv.style.position = 'fixed';
        detailsDiv.style.top = '50%'; // Centreeerd vertikaal
        detailsDiv.style.transform = 'translateY(-50%)'; // zorgt dat het in het midde is
        detailsDiv.style.left = '20px'; // maakt wit ruimte links
        detailsDiv.style.width = '225px'; // de dikte veranderd
        detailsDiv.style.backgroundColor = '#f9f9f9'; // achtergrond kleur moet nog veranderen
        detailsDiv.style.border = '1px solid gray'; // Border
        detailsDiv.style.padding = '15px';
        detailsDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'; // Shaduw
        detailsDiv.style.zIndex = '1000';
    } else {
        console.error('The "pokemon-details" div is missing from the DOM.');
    }

    const actionsContainer = document.getElementById('pokemon-acties');
    actionsContainer.innerHTML = ''; // Verwijderd vorige knoppen

    // Maakt "Battler" knop
    const battleButton = document.createElement('button');
    battleButton.textContent = 'Battler';
    battleButton.onclick = () => {
        const urlParams = new URLSearchParams({ pokemonName: pokemon.name });
        window.location.href = `batteler.html?${urlParams}`; 
    };
    actionsContainer.appendChild(battleButton);

    // Maakt "Vergelijken" knop
    const compareButton = document.createElement('button');
    compareButton.textContent = 'Vergelijken';
    compareButton.onclick = () => {
        
    };
    actionsContainer.appendChild(compareButton);

    // Maakt "Catch" knop
    const catchButton = document.createElement('button');
    catchButton.textContent = 'Catch';
    catchButton.onclick = () => {
        const urlParams = new URLSearchParams({ pokemonName: pokemon.name });
        window.location.href = `catch.html?${urlParams}`;
    };
    actionsContainer.appendChild(catchButton);
}

document.addEventListener('DOMContentLoaded', displayPokemonList);
