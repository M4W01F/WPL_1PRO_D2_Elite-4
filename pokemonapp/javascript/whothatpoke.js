const pokemonImage = document.getElementById("pokemonImage");
const guessInput = document.getElementById("guessInput");
const submitButton = document.getElementById("submitButton");
const result = document.getElementById("result");
const nextButton = document.getElementById("nextButton");

let currentPokemon = null; // Stores the current Pokémon data

// Function to fetch a random Pokémon
async function fetchRandomPokemon() {
    const randomId = Math.floor(Math.random() * 898) + 1; // Pokémon up to Gen 8
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
    const data = await response.json();

    currentPokemon = {
        name: data.name.toLowerCase(),
        sprite: data.sprites.other["official-artwork"].front_default
    };

    // Display Pokémon silhouette
    pokemonImage.src = currentPokemon.sprite;
    pokemonImage.style.filter = "brightness(0)"; // Hide Pokémon initially
    result.textContent = "";
    guessInput.value = "";
    nextButton.style.display = "none";
}

// Function to check the user's guess
function checkGuess() {
    const userGuess = guessInput.value.trim().toLowerCase();

    if (!userGuess) {
        result.textContent = "Please enter a Pokémon name!";
        return;
    }

    if (userGuess === currentPokemon.name) {
        result.textContent = `Correct! It's ${currentPokemon.name.toUpperCase()}!`;
        pokemonImage.style.filter = "brightness(1)"; // Reveal Pokémon
        nextButton.style.display = "block";
    } else {
        result.textContent = `Wrong! The correct answer was ${currentPokemon.name.toUpperCase()}.`;
        pokemonImage.style.filter = "brightness(1)"; // Reveal Pokémon even when wrong
        nextButton.style.display = "block"; // Allow user to move to next Pokémon
    }
}

// Event listeners
submitButton.addEventListener("click", checkGuess);
nextButton.addEventListener("click", fetchRandomPokemon);
guessInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        checkGuess();
    }
});

// Start the game
fetchRandomPokemon();
