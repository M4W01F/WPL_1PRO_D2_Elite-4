document.addEventListener('DOMContentLoaded', () => {
    const pokemonContainer = document.getElementById('pokemon-container'); // Selecteer de juiste container
    const popup = document.getElementById('popup'); // Pop-up container
    const popupText = document.getElementById('popup-text'); // Tekst in de pop-up
    const popupYes = document.getElementById('popup-yes'); // Ja-knop
    const popupNo = document.getElementById('popup-no'); // Nee-knop

    if (pokemonContainer) {
        genereerStarterPokemon(pokemonContainer, popup, popupText, popupYes, popupNo);
    } else {
        console.error("De container 'pokemon-container' bestaat niet in de DOM.");
    }
});

// Genereer de 3 starter Pokémon divs
async function genereerStarterPokemon(container, popup, popupText, popupYes, popupNo) {
    const starterIds = [1, 7, 4]; // IDs voor Bulbasaur, Charmander en Squirtle
    for (const id of starterIds) {
        const pokemon = await haalPokemonGegevensOp(id);
        if (pokemon) {
            const div = document.createElement('div'); // Maak een div voor elke Pokémon
            div.className = 'starter-pokemon';
            div.innerHTML = `
                <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" style="width: 250px; height: 250px;">
                <p><strong>${pokemon.name}</strong></p>
            `;
            div.onclick = () => {
                // Toon de pop-up bij klikken
                popup.style.display = 'flex';
                popupText.innerHTML = `Wilt u ${pokemon.name} als uw starter Pokémon kiezen?<br><img src="
                ${pokemon.sprites.front_default}" alt="${pokemon.name}" style="width: 150px; height: 150px; margin-top: 10px;">`;
            
                // Actie bij klikken op "Ja"
                popupYes.onclick = () => {
                    popup.style.display = 'none'; // Verberg de pop-up
                    document.getElementById('niet-ingelogged').style.display = 'none'; // Verberg de huidige sectie
                    document.getElementById('well-ingelogged').style.display = 'block'; // Toon de nieuwe sectie
                };
            
                // Actie bij klikken op "Nee"
                popupNo.onclick = () => {
                    popup.style.display = 'none'; // Verberg de pop-up
                };
            };
            container.appendChild(div); // Voeg de div toe aan de pokemon-container
        }
    }
}

// Haal Pokémon-gegevens op
async function haalPokemonGegevensOp(query) {
    try {
        const antwoord = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
        if (antwoord.ok) {
            const pokemon = await antwoord.json();
            return pokemon; // Retourneer de Pokémon-gegevens
        } else {
            console.error(`Kon de Pokémon niet ophalen met ID: ${query}.`);
            return null;
        }
    } catch (fout) {
        console.error(`Fout bij het ophalen van Pokémon-gegevens:`, fout);
        return null;
    }
}
