// Functie om Pokémon-gegevens op te halen
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
            console.error(`Kon Pokémon met ID: ${pokemonId} niet ophalen.`);
            return null;
        }
    } catch (error) {
        console.error(`Fout bij het ophalen van Pokémon met ID: ${pokemonId}`, error);
        return null;
    }
}

// Functie om de aangepaste dropdown dynamisch te vullen
async function populatePokemonDropdown() {
    const allPokemon = [];
    for (let i = 1; i <= 1025; i++) {
        const pokemonData = await fetchPokemonData(i);
        if (pokemonData) {
            allPokemon.push(pokemonData.name);
        }
    }
    console.log('Alle Pokémon:', allPokemon); // Debugging: Log alle Pokémon-namen
    return allPokemon;
}

// Functie om een subset van opties te filteren en weer te geven
function filterPokemonOptions(inputValue, allPokemon) {
    const dropdownContent = document.getElementById('pokemon-options');
    dropdownContent.innerHTML = ''; // Bestaande opties wissen
    const filteredPokemon = allPokemon.filter(name => name.toLowerCase().includes(inputValue.toLowerCase()));
    const limitedPokemon = filteredPokemon.slice(0, 5); // Beperkt de lijst tot 5 namen max
    console.log('Gefilterde Pokémon:', limitedPokemon); // Debugging: Log gefilterde Pokémon-namen
    limitedPokemon.forEach(name => {
        const option = document.createElement('div');
        option.classList.add('dropdown-item');
        option.innerText = name;
        option.addEventListener('click', () => {
            document.getElementById('pokemon-selector').value = name;
            dropdownContent.style.display = 'none';
        });
        dropdownContent.appendChild(option);
    });
    dropdownContent.style.display = limitedPokemon.length > 0 ? 'block' : 'none';
}


// Voeg een eventlistener toe voor wijzigingen in het invoerveld om opties te filteren
document.getElementById('pokemon-selector').addEventListener('input', function () {
    const inputValue = this.value;
    filterPokemonOptions(inputValue, allPokemon);
});

// Vul de aangepaste dropdown wanneer het document gereed is
let allPokemon = [];
document.addEventListener('DOMContentLoaded', async () => {
    allPokemon = await populatePokemonDropdown();
    filterPokemonOptions('', allPokemon); // Initiële populatie met alle Pokémon
});