async function startCatch() {
    const selectedPokemonName = document.getElementById('pokemon-selector').value.toLowerCase();

    if (!selectedPokemonName) {
        alert('Typ de naam van een Pokémon om te beginnen!');
        return;
    }

    try {
        // Fetch Pokémon data van de API
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${selectedPokemonName}/`);
        if (!response.ok) {
            throw new Error(`Pokémon met de naam "${selectedPokemonName}" kon niet worden gevonden.`);
        }
        
        const pokemonData = await response.json();

        // Update de Pokémon details dynamisch
        document.getElementById('pokemon-naam').textContent = `Naam: ${pokemonData.name}`;
        document.getElementById('pokemon-level').textContent = `Level: ${Math.floor(Math.random() * 50 + 1)}`; // Random Level

        // toont de Pokémon sprite
        document.getElementById('pokemon-image').innerHTML = `
            <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}" />
        `;

        // veranderd de display settings
        document.getElementById('setup-container').style.display = 'none';
        document.getElementById('catch-interface').style.display = 'block';
        document.querySelector('footer').style.display = 'none';

        console.log(`Start catching: ${pokemonData.name}`);
    } catch (error) {
        alert(error.message);
    }
}

// Pokeball click event
document.getElementById('pokeball').addEventListener('click', () => {
    const kansen = document.getElementById('kansen');
    let aantalKansen = parseInt(kansen.textContent);

    if (aantalKansen > 0) {
        aantalKansen--;
        kansen.textContent = aantalKansen;

        if (Math.random() > 0.5) { // Random success voorbeeeld
            document.getElementById('pokeball').style.display = 'none';
            document.getElementById('kansen').style.display = 'none';
            document.getElementById('kans').style.display = 'none';
            alert('Gevangen! Geef je Pokémon een bijnaam.');
            document.getElementById('bijnaam-panel').style.display = 'block';
        } else {
            if (aantalKansen === 0) {
                alert('Geen kansen meer! Je wordt teruggeleid naar de hoofdpagina.');
                window.location.href = './index.html';
            } else {
                alert('Niet gelukt! Probeer opnieuw.');
            }
        }
    }
});
