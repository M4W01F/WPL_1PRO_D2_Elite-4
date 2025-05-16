const { stat } = require("fs");

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

        const types = pokemonData.types.map(typeInfo => typeInfo.type.name);
        const weaknesses = calculateCombinedWeaknesses(types);


        const weaknessesRow = document.createElement("tr");
        const weaknessBadges = weaknesses.map(({ type, multiplier }) => `
            <span class="type-badge" style="background-color: ${getTypeColor(type)}; color: #fff; border-radius: 5px; padding: 5px 10px; margin-right: 5px;">
                ${type} (${multiplier}x)
            </span>
        `).join('');
        weaknessesRow.innerHTML = `
            <td colspan="2">
                <strong>Weaknesses:</strong><br>
                ${weaknessBadges}
            </td>
        `;
        statsTable.appendChild(weaknessesRow);

        //Voor visueel te vergelijken
        if (pokemon1IsLoaded() && pokemon2IsLoaded()) {
            comparePokemonStats();
        }

    } catch (error) {
        alert(`Fout: ${error.message}`);
    }
}

// Bereken gecombineerde zwaktes voor multi-typed Pokémon
function calculateCombinedWeaknesses(types) {
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

    const weaknesses = {};

    // Proceseerd elk type
    types.forEach(type => {
        const effectiveness = typeEffectiveness[type];
        if (!effectiveness) return;

        // Toont double shade van dit type.
        effectiveness.double_damage_from.forEach(weakness => {
            weaknesses[weakness] = (weaknesses[weakness] || 1) * 2;
        });

        // Plaats half shade van dit type
        effectiveness.half_damage_from.forEach(resistance => {
            weaknesses[resistance] = (weaknesses[resistance] || 1) / 2;
        });

        // Plaats geen shade vam dit type
        effectiveness.no_damage_from.forEach(immunity => {
            weaknesses[immunity] = 0; // Op 0 gezet om immuniteit te aantonen.
        });
    });

    // Filter de multipliers uit die 1 of 0 zijn
    return Object.entries(weaknesses)
        .filter(([_, multiplier]) => multiplier > 1)
        .map(([type, multiplier]) => ({ type, multiplier }));
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

function getStatValues(statsTableId) {
    const rows = document.querySelectorAll(`#${statsTableId} tr`);
    const stats = {};
    // Rijen van index 1 t/m 6 (want index 0 is header, daarna 6 stats)
    for (let i = 1; i <= 6; i++) {
        const cells = rows[i].cells;
        if (cells.length < 2) continue;
        const statName = cells[0].textContent.trim();
        const statValue = parseInt(cells[1].textContent);
        stats[statName] = statValue;
    }
    return stats;
}

function comparePokemonStats() {
    const statNames = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
    const comparisonTable = document.getElementById("comparisonTable");
    comparisonTable.innerHTML = `<tr><th>Stat</th><th>Vergelijking</th></tr>`;
    
    statNames.forEach(statName => {
        const row1 = Array.from(document.querySelectorAll("#stats1 tr"))
            .find(row => row.children[0]?.textContent === statName);
        const row2 = Array.from(document.querySelectorAll("#stats2 tr"))
            .find(row => row.children[0]?.textContent === statName);

        if (!row1 || !row2) return;

        const statValue1 = parseInt(row1.children[1].textContent);
        const statValue2 = parseInt(row2.children[1].textContent);

        let arrow = "==";
        let color = "white";

        if (statValue1 > statValue2) {
            arrow = ">>";
            color = "green";
        } else if (statValue1 < statValue2) {
            arrow = "<<";
            color = "red";
        }

        comparisonTable.innerHTML += `
            <tr>
                <td style="color: ${color}; font-weight: bold;">${statName}</td>
                <td style="color: ${color}; font-size: 20px;">${arrow}</td>
            </tr>
        `;
    });
}

function pokemon1IsLoaded() {
    const stats1 = document.getElementById("stats1").rows;
    return stats1.length > 2;
}

function pokemon2IsLoaded() {
    const stats2 = document.getElementById("stats2").rows;
    return stats2.length > 2;
}
