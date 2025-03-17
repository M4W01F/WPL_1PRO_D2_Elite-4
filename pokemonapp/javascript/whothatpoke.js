// Async function to fetch Pokémon data
async function fetchPokemonData(pokemonId) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/`);
        if (response.ok) {
            const pokemon = await response.json();
            return {
                id: pokemon.id,
                name: pokemon.name,
                sprite: pokemon.sprites.front_default // Image URL
            };
        } else {
            console.error(`Could not fetch Pokémon with ID: ${pokemonId}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching Pokémon with ID: ${pokemonId}`, error);
        return null;
    }
}

// Select the HTML elements
const pokemonImage = document.getElementById("pokemonImage");
const guessInput = document.getElementById("guessInput");
const submitButton = document.getElementById("submitButton");
const resultDiv = document.getElementById("result");
const nextButton = document.getElementById("nextButton");

let currentPokemon = {};

// Function to generate a random Pokémon and display its image
async function getRandomPokemon() {
    // Get a random Pokémon ID between 1 and 1025
    const randomId = Math.floor(Math.random() * 1025) + 1;
    currentPokemon = await fetchPokemonData(randomId);

    if (currentPokemon) {
        pokemonImage.src = currentPokemon.sprite; // Set the Pokémon image
        pokemonImage.alt = currentPokemon.name; // Set alt text for the image
        resultDiv.textContent = '';
        guessInput.value = '';
        nextButton.style.display = 'none';
    }
}

// Function to check the user's guess
function checkGuess() {
    const userGuess = guessInput.value.trim().toLowerCase();

    if (userGuess === currentPokemon.name) {
        resultDiv.textContent = `Correct! It's ${currentPokemon.name}!`;
        resultDiv.style.color = 'green';
        nextButton.style.display = 'block';
    } else {
        resultDiv.textContent = `Wrong! The correct answer was ${currentPokemon.name}.`;
        resultDiv.style.color = 'red';
        nextButton.style.display = 'block';
    }
}

// Event listeners
submitButton.addEventListener("click", checkGuess);
nextButton.addEventListener("click", getRandomPokemon);

// Start the game with a random Pokémon
getRandomPokemon();
