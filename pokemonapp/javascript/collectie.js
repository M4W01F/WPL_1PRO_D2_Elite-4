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
            console.error(`Cannot fetch Pokémon with ID: ${pokemonId}.`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching Pokémon with ID: ${pokemonId}`, error);
        return null;
    }
}

async function displayCollectieList() {
    const pokemonList = document.getElementById('pokemon-list');

    for (let pokemonId = 1; pokemonId <= 12; pokemonId++) {
        const pokemonData = await fetchPokemonData(pokemonId);
        if (pokemonData) {
            const listItem = document.createElement('div');
            listItem.className = 'collectie';
            listItem.innerHTML = `
                <img src="./images/Poke_Ball.webp" alt="Poké Ball" style="width: 30px; height: 30px;">
                <img src="${pokemonData.sprite}" alt="${pokemonData.name}">
                <strong>${pokemonData.id}</strong>
                <strong>${pokemonData.name}</strong>
                ${pokemonData.types.split(', ').map(type => `
                    <span class="type-badge" style="background-color: ${getTypeColor(type)}">${type}</span>
                `).join('')}
            `;
            
            listItem.onclick = () => pokemonDetails(pokemonData);

            pokemonList.appendChild(listItem);
        }
    }
}

function pokemonDetails(pokemon) {
    document.getElementById('pokemon-id').textContent = pokemon.id;
    document.getElementById('pokemon-naam').textContent = pokemon.name;
    
    const pokemonTypeElement = document.getElementById('pokemon-type');
    pokemonTypeElement.innerHTML = ''; // Verwijder eerdere inhoud
    pokemon.types.split(', ').forEach(type => {
        const typeBadge = document.createElement('span');
        typeBadge.textContent = type; // Type naam toevoegen
        typeBadge.className = 'type-badge'; // Voegd de classe toe
        typeBadge.style.backgroundColor = getTypeColor(type);
        typeBadge.style.color = '#fff';
        typeBadge.style.padding = '3px 8px';
        typeBadge.style.margin = '2px';
        typeBadge.style.borderRadius = '5px';
        typeBadge.style.display = 'inline-block';
        pokemonTypeElement.appendChild(typeBadge); // Voeg badge toe aan de type container
    });


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

    // Maakt "buddy maken" knop
    const buddyButton = document.createElement('button');
    buddyButton.textContent = 'Buddy maken';
    buddyButton.onclick = () => {

    };
    actionsContainer.appendChild(buddyButton);
}

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

document.addEventListener('DOMContentLoaded', displayCollectieList);
