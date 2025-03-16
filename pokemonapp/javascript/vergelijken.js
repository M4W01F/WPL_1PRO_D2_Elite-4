async function fetchPokemon(num) {
    const input = document.getElementById(`pokemon${num}`);
    const img = document.getElementById(`img${num}`);
    const statsTable = document.getElementById(`stats${num}`);
    const pokemonName = input.value.toLowerCase().trim();

    if (!pokemonName) return;

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        if (!response.ok) {
            throw new Error(`Pokémon "${pokemonName}" niet gevonden.`);
        }

        const pokemonData = await response.json();

        img.src = pokemonData.sprites.front_default;
        img.alt = `${pokemonData.name}`;

        statsTable.innerHTML = `
            <tr><th>Stat</th><th>Waarde</th></tr>
            ${pokemonData.stats
                .map(stat => `<tr><td>${stat.stat.name}</td><td>${stat.base_stat}</td></tr>`)
                .join('')}
        `;

        const typesRow = document.createElement("tr");
        const typeBadges = pokemonData.types
            .map(
                type =>
                    `<span class="type-badge" style="background-color: ${getTypeColor(type.type.name)}; 
                                  color: white; 
                                  padding: 5px 10px; 
                                  border-radius: 5px; 
                                  margin-right: 5px;">
                        ${type.type.name}
                    </span>`
            )
            .join(" ");
        typesRow.innerHTML = `
            <td colspan="2">
                <strong>Types:</strong><br>
                ${typeBadges}
            </td>
        `;
        statsTable.appendChild(typesRow);

        const weaknesses = await getWeaknesses(pokemonData.types);
        const weaknessesRow = document.createElement("tr");
        const weaknessBadges = weaknesses
            .map(
                weakness =>
                    `<span class="type-badge" style="background-color: ${getTypeColor(weakness)}; 
                                  color: white; 
                                  padding: 5px 10px; 
                                  border-radius: 5px; 
                                  margin-right: 5px;">
                        ${weakness}
                    </span>`
            )
            .join(" ");
        weaknessesRow.innerHTML = `
            <td colspan="2">
                <strong>Weaknesses:</strong><br>
                ${weaknessBadges}
            </td>
        `;
        statsTable.appendChild(weaknessesRow);

    } catch (error) {
        alert(`Fout: ${error.message}`);
    }
}

async function getWeaknesses(types) {
    const typeWeaknesses = {
        normal: ["fighting"],
        fire: ["water", "ground", "rock"],
        water: ["electric", "grass"],
        electric: ["ground"],
        grass: ["fire", "ice", "poison", "flying", "bug"],
        bug: ["fire", "flying", "rock"],
        rock: ["water", "grass", "fighting", "ground", "steel"],
        ground: ["water", "ice", "grass"],
        ice: ["fire", "fighting", "rock", "steel"],
        fighting: ["flying", "psychic", "fairy"],
        ghost: ["ghost", "dark"],
        psychic: ["bug", "ghost", "dark"],
        dark: ["fighting", "bug", "fairy"],
        fairy: ["poison", "steel"],
        poison: ["ground", "psychic"],
        flying: ["electric", "ice", "rock"],
        dragon: ["ice", "dragon", "fairy"],
        steel: ["fire", "fighting", "ground"]
    };
    const weaknesses = [];
    for (const type of types) {
        const typeName = type.type.name;
        if (typeWeaknesses[typeName]) {
            weaknesses.push(...typeWeaknesses[typeName]);
        }
    }

    return [...new Set(weaknesses)];
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
