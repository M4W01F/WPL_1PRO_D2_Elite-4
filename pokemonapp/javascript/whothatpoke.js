document.addEventListener("DOMContentLoaded", async () => {
    try {
        const email = JSON.parse(localStorage.getItem("loggedInUser")).email;
        if (!email) {
            console.error("Geen ingelogde gebruiker gevonden.");
            return;
        }

        const buddyId = await haalBuddyUitCollectie(email);
        if (!buddyId) {
            console.error("Geen buddy Pokémon gevonden in database.");
            return;
        }

        const buddyResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${buddyId}/`);
        if (!buddyResponse.ok) {
            throw new Error(`Buddy-Pokémon met ID "${buddyId}" kon niet worden gevonden.`);
        }
        const buddyData = await buddyResponse.json();

        buddy.id = buddyId;
        buddy.name = buddyData.name;
        buddy.sprite = buddyData.sprites.front_default;
        buddy.level = buddyData.level;

    } catch (error) {
        console.error("Fout bij het laden van Buddy-Pokémon uit database:", error);
    }
});

async function haalBuddyUitCollectie(email) {
    try {
        const response = await fetch("/api/getUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`Kan gebruiker niet ophalen. Status: ${response.status}`);
        }

        const data = await response.json();
        const user = data.user;

        if (!user || !user.collection || !Array.isArray(user.collection)) {
            console.error("Geen geldige collectie gevonden in database!");
            return null;
        }

        const buddyPokemon = user.collection.find(pokemon => pokemon.isBuddy === true);
        if (!buddyPokemon) {
            console.error("Geen actieve Buddy-Pokémon gevonden.");
            return null;
        }

        buddy.moves = buddyPokemon.moves || ["", "", "", ""];
        buddy.level = buddyPokemon.level

        console.log("[DEBUG] - Buddy ID:", buddyPokemon.pokemon_id);

        return buddyPokemon.pokemon_id;

    } catch (error) {
        console.error("Fout bij ophalen van Buddy-Pokémon:", error);
        return null;
    }
}

const buddy = {
    name: "",
    level: 0,
    hp: 0,
    maxHp: 0,
    moves: ['', '', '', '']
};

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
async function checkGuess() {
    const userGuess = guessInput.value.trim().toLowerCase();

    if (!userGuess) {
        result.textContent = "Please enter a Pokémon name!";
        return;
    }

    if (userGuess === currentPokemon.name) {
        result.textContent = `Correct! It's ${currentPokemon.name.toUpperCase()}!`;
        pokemonImage.style.filter = "brightness(1)"; // Reveal Pokémon
        nextButton.style.display = "block";
        const email = JSON.parse(localStorage.getItem("loggedInUser")).email;

        const response = await fetch("/api/getUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
            credentials: "include"
        });

        const data = await response.json();
        const user = data.user;

        const buddyIndex = user.collection.findIndex(p => p.pokemon_id === buddy.id);
            if (buddyIndex !== null && user.collection[buddyIndex]) {
                user.collection[buddyIndex].level += 1;
                await updateUserCollection(email, user.collection);
            }
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

async function updateUserCollection(email, updatedCollection) {
    try {
        const response = await fetch("/api/updateUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, collection: updatedCollection }),
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`Fout bij updaten van gebruiker. Status: ${response.status}`);
        }

        console.log("[DEBUG] - Pokémon collectie succesvol geüpdatet.");

    } catch (error) {
        console.error("[ERROR] - Fout bij updaten van de Pokémon collectie:", error);
    }
}
