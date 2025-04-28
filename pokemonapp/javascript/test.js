async function fetchPokemon(pokemonNum) {
    const input = document.getElementById(`pokemon${pokemonNum}`);
    const img = document.getElementById(`img${pokemonNum}`);
    const statsTable = document.getElementById(`stats${pokemonNum}`);
    const typesDiv = document.getElementById(`types${pokemonNum}`);
    const weaknessesDiv = document.getElementById(`weaknesses${pokemonNum}`);
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
                    `<span class="type-badge" style="background-color: ${getTypeColor(type.type.name)}; color: white; padding: 5px 10px; border-radius: 5px; margin-right: 5px;">
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
                    `<span class="weakness-badge" style="background-color: ${getTypeColor(weakness)}; color: white; padding: 5px 10px; border-radius: 5px; margin-right: 5px;">
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

// Bereken gecombineerde zwaktes voor multi-typed Pokémon
async function getWeaknesses(types) {
    const typeEffectiveness = {
        normal: { double_damage_from: ["fighting"], half_damage_from: ["ghost"], no_damage_from: ["ghost"] },
        fire: { double_damage_from: ["water", "rock", "ground"], half_damage_from: ["fire", "grass", "ice", "bug", "steel", "fairy"], no_damage_from: [] },
        water: { double_damage_from: ["electric", "grass"], half_damage_from: ["fire", "water", "ice", "steel"], no_damage_from: [] },
        grass: { double_damage_from: ["fire", "ice", "poison", "flying", "bug"], half_damage_from: ["water", "electric", "grass", "ground"], no_damage_from: [] },
        electric: { double_damage_from: ["ground"], half_damage_from: ["electric", "flying", "steel"], no_damage_from: [] },
        ice: { double_damage_from: ["fire", "fighting", "rock", "steel"], half_damage_from: ["ice"], no_damage_from: [] },
        fighting: { double_damage_from: ["flying", "psychic", "fairy"], half_damage_from: ["bug", "rock", "dark"], no_damage_from: [] },
        poison: { double_damage_from: ["ground", "psychic"], half_damage_from: ["grass", "fighting", "poison", "bug", "fairy"], no_damage_from: [] },
        ground: { double_damage_from: ["water", "grass", "ice"], half_damage_from: ["poison", "rock"], no_damage_from: ["electric"] },
        flying: { double_damage_from: ["electric", "ice", "rock"], half_damage_from: ["grass", "fighting", "bug"], no_damage_from: ["ground"] },
        psychic: { double_damage_from: ["bug", "ghost", "dark"], half_damage_from: ["fighting", "psychic"], no_damage_from: [] },
        bug: { double_damage_from: ["fire", "flying", "rock"], half_damage_from: ["grass", "fighting", "ground"], no_damage_from: [] },
        rock: { double_damage_from: ["water", "grass", "fighting", "ground", "steel"], half_damage_from: ["normal", "fire", "poison", "flying"], no_damage_from: [] },
        ghost: { double_damage_from: ["ghost", "dark"], half_damage_from: ["poison", "bug"], no_damage_from: ["normal", "fighting"] },
        dragon: { double_damage_from: ["ice", "dragon", "fairy"], half_damage_from: ["fire", "water", "electric", "grass"], no_damage_from: [] },
        dark: { double_damage_from: ["fighting", "bug", "fairy"], half_damage_from: ["ghost", "dark"], no_damage_from: ["psychic"] },
        steel: { double_damage_from: ["fire", "fighting", "ground"], half_damage_from: ["normal", "grass", "ice", "flying", "psychic", "bug", "rock", "dragon", "steel", "fairy"], no_damage_from: ["poison"] },
        fairy: { double_damage_from: ["poison", "steel"], half_damage_from: ["fighting", "bug", "dark"], no_damage_from: ["dragon"] }
    };

    const weaknesses = new Set();
    let isFlying = false;

    // Zoek uit of de Pokémon een Flying-type heeft
    for (const type of types) {
        if (type.type.name === "flying") {
            isFlying = true;
        }

        const typeName = type.type.name;
        if (typeEffectiveness[typeName]) {
            // Voeg de zwaktes toe aan de set
            typeEffectiveness[typeName].double_damage_from.forEach(weakness => weaknesses.add(weakness));
        }
    }

    // Als de Pokémon een Flying-type heeft, pas dan de Ground-zwakte aan
    if (isFlying) {
        weaknesses.delete("ground"); // Verwijder Ground als zwakte
    }

    // Return de zwaktes als een array
    return [...weaknesses];
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
