async function fetchPokemon(num) {
    const input = document.getElementById(`pokemon${num}`);
    const img = document.getElementById(`img${num}`);
    const statsTable = document.getElementById(`stats${num}`);
    const pokemonName = input.value.toLowerCase().trim();
    
    if (!pokemonName) return;
    
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        if (!response.ok) {
            throw new Error(`Pokémon "${pokemonName}" niet gevonden.`); //Pokemon naam bestaat niet (error)
        }
        
        const pokemonData = await response.json();
        img.src = pokemonData.sprites.front_default;
        statsTable.innerHTML = `
            <tr><th>Stat</th><th>Waarde</th></tr>
            ${pokemonData.stats.map(stat => `<tr><td>${stat.stat.name}</td><td>${stat.base_stat}</td></tr>`).join('')}
        `;
    } catch (error) {
        alert('Niet gelukt! Probeer opnieuw.'); //error bericht
    }
}
        
 

