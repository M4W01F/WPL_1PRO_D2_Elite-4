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
            console.error(`Kan Pokémon met ID: ${pokemonId} niet ophalen.`);
            return null;
        }
    } catch (error) {
        console.error(`Error Pokémon met ID: ${pokemonId}`, error);
        return null;
    }
}

async function displayPokemonList() {
    console.log("[DEBUG] - Laden van Pokémon lijst gestart.");

    const pokemonList = document.getElementById('pokemon-list');
    pokemonList.innerHTML = "";

    const email = JSON.parse(localStorage.getItem("loggedInUser")).email;
    const userResponse = await fetch("/api/getUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include"
    });

    if (!userResponse.ok) {
        console.error("[ERROR] - Fout bij ophalen van gebruikersgegevens.");
        return;
    }

    const userData = await userResponse.json();
    if (!userData.user || !userData.user.collection) {
        console.error("[ERROR] - Geen geldige collectie gevonden.");
        return;
    }

    console.log("[DEBUG] - Gevonden collectie:", userData.user.collection);

    const buddyPokemonId = userData.user.collection.find(pokemon => pokemon.isBuddy)?.pokemon_id || null;

    for (let pokemonId = 1; pokemonId <= 1025; pokemonId++) {
        const pokemonData = await fetchPokemonData(pokemonId);
        if (pokemonData) {
            const gevangen = userData.user.collection.some(pokemon => pokemon.pokemon_id === pokemonId);
            const pokemonClass = gevangen ? "collectie" : "niet-gevangen";
            const buddyIndicator = pokemonId === buddyPokemonId ? `<span class="buddy-tag">⭐ Buddy</span>` : "";

            const listItem = document.createElement('div');
            listItem.className = pokemonClass;
            listItem.innerHTML = `
                ${pokemonClass === 'collectie' ? `<img src="./images/Poke_Ball.webp" alt="Poké Ball" style="width: 30px; height: 30px;">` : ""}
                <img src="${pokemonData.sprite}" alt="${pokemonData.name}">
                <strong>${pokemonData.id}</strong> ${buddyIndicator}
                <strong>${pokemonData.name}</strong>
                ${pokemonData.types.split(', ').map(type => `
                    <span class="type-badge" style="background-color: ${getTypeColor(type)}">${type}</span>
                `).join('')}
            `;

            listItem.onclick = () => pokemonDetails(pokemonData, pokemonClass);
            pokemonList.appendChild(listItem);
        }
    }

    console.log("[DEBUG] - Pokémon lijst succesvol weergegeven met Buddy-indicator.");
}

function pokemonDetails(pokemon, pokemonClass) {
    document.getElementById('pokemon-id').textContent = pokemon.id;
    document.getElementById('pokemon-naam').textContent = pokemon.name;
    
    const pokemonTypeElement = document.getElementById('pokemon-type');
    pokemonTypeElement.innerHTML = ''; // Verwijder eerdere inhoud
    pokemon.types.split(', ').forEach(type => {
        const typeBadge = document.createElement('span');
        typeBadge.textContent = type; // Type naam toevoegen
        typeBadge.className = 'type-badge'; // Voegd de classe toe
        typeBadge.style.backgroundColor = getTypeColor(type);
        typeBadge.style.color = '#fff';
        typeBadge.style.padding = '3px 8px';
        typeBadge.style.margin = '2px';
        typeBadge.style.borderRadius = '5px';
        typeBadge.style.display = 'inline-block';
        pokemonTypeElement.appendChild(typeBadge); // Voeg badge toe aan de type container
    });


    const spriteElement = document.getElementById('pokemon-sprite');
    spriteElement.src = pokemon.sprite;
    spriteElement.alt = pokemon.name;

    // Centreerd de sprite van de pokemon
    spriteElement.style.display = 'block';
    spriteElement.style.margin = '0 auto';

    // Maakt dit veld zichtbaar
    const detailsDiv = document.getElementById('pokemon-details');
    if (detailsDiv) {
        detailsDiv.hidden = false;

        // Style voor pokemon detail
        detailsDiv.style.position = 'fixed';
        detailsDiv.style.top = '50%'; // Centreeerd vertikaal
        detailsDiv.style.transform = 'translateY(-50%)'; // zorgt dat het in het midde is
        detailsDiv.style.left = '20px'; // maakt wit ruimte links
        detailsDiv.style.width = '225px'; // de dikte veranderd
        detailsDiv.style.backgroundColor = '#f9f9f9'; // achtergrond kleur moet nog veranderen
        detailsDiv.style.border = '1px solid gray'; // Border
        detailsDiv.style.padding = '15px';
        detailsDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'; // Shaduw
        detailsDiv.style.zIndex = '1000';
    } else {
        console.error('The "pokemon-details" div is missing from the DOM.');
    }

    const actionsContainer = document.getElementById('pokemon-acties');
    actionsContainer.innerHTML = ''; // Verwijderd vorige knoppen

    // Maakt "Battler" knop
    const battleButton = document.createElement('button');
    battleButton.textContent = 'Batteler';
    battleButton.onclick = (event) => {
        if (pokemonClass === 'collectie') {
            const confirmation = confirm('Ben je zeker dat je deze Pokémon wilt vangen?');
            if (!confirmation) {
                event.stopPropagation(); // Stop de actie
                return;
            }
        }
        const urlParams = new URLSearchParams({ pokemonName: pokemon.name });
        window.location.href = `batteler.html?${urlParams}`;
    };
    actionsContainer.appendChild(battleButton);
/*  gaan we niet implimenteren
    // Maakt "Vergelijken" knop
    const compareButton = document.createElement('button');
    compareButton.textContent = 'Vergelijken';
    compareButton.onclick = () => {
        
    };
    actionsContainer.appendChild(compareButton);
*/
    // Maakt "Catch" knop
    const catchButton = document.createElement('button');
    catchButton.textContent = 'Catch';
    catchButton.onclick = (event) => {
        if (pokemonClass === 'collectie') {
            const confirmation = confirm('Ben je zeker dat je deze Pokémon opnieuw wilt vangen?');
            if (!confirmation) {
                event.stopPropagation(); // Stop de actie
                return;
            }
        }
        const urlParams = new URLSearchParams({ pokemonName: pokemon.name });
        window.location.href = `catch.html?${urlParams}`;
    };
    actionsContainer.appendChild(catchButton);
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
    return typeColors[type] || "#d3d3d3"; // Default kleur voor onbekende types
}
document.addEventListener('DOMContentLoaded', displayPokemonList);
document.getElementById('search-input').addEventListener('input', function () {
    const searchTerm = this.value.trim().toLowerCase();

    if (!Array.isArray(allPokemonData) || allPokemonData.length === 0) {
        console.error("[ERROR] - Pokémon data ontbreekt of is ongeldig.");
        return;
    }

    const filteredPokemon = allPokemonData.filter(pokemon =>
        pokemon.name.toLowerCase().includes(searchTerm)
    );

    const pokemonList = document.getElementById('pokemon-list');
    pokemonList.innerHTML = filteredPokemon.length > 0 ? "" : "<p>Geen Pokémon gevonden.</p>";

    filteredPokemon.forEach(pokemonData => {
        const pokemonClass = userCollection.some(p => p.pokemon_id === pokemonData.id) ? 'collectie' : 'niet-gevangen';
        const buddyIndicator = pokemonData.isBuddy ? `<span class="buddy-tag">⭐ Buddy</span>` : "";

        const listItem = document.createElement('div');
        listItem.className = pokemonClass;
        listItem.innerHTML = `
            ${pokemonClass === 'collectie' ? `<img src="./images/Poke_Ball.webp" alt="Poké Ball" style="width: 30px; height: 30px;">` : ""}
            <img src="${pokemonData.sprite}" alt="${pokemonData.name}">
            <strong>${pokemonData.id}</strong> ${buddyIndicator}
            <strong>${pokemonData.name}</strong>
            <div>
                ${pokemonData.types.split(', ').map(type => `
                    <span class="type-badge" style="background-color: ${getTypeColor(type)}">${type}</span>
                `).join('')}
            </div>
        `;

        listItem.onclick = () => pokemonDetails(pokemonData, pokemonClass);
        pokemonList.appendChild(listItem);
    });

    console.log(`[DEBUG] - ${filteredPokemon.length} Pokémon gevonden voor zoekterm: '${searchTerm}'.`);
});
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-input");

    if (!searchInput) {
        console.error("[ERROR] - 'search-input' niet gevonden in de DOM.");
        return;
    }

    searchInput.addEventListener("input", function () {
        const searchTerm = this.value.trim().toLowerCase();

        if (!Array.isArray(allPokemonData) || allPokemonData.length === 0) {
            console.error("[ERROR] - Pokémon data ontbreekt of is ongeldig.");
            return;
        }

        const filteredPokemon = allPokemonData.filter(pokemon =>
            pokemon.name.toLowerCase().includes(searchTerm)
        );

        const pokemonList = document.getElementById("pokemon-list");
        pokemonList.innerHTML = filteredPokemon.length > 0 ? "" : "<p>Geen Pokémon gevonden.</p>";

        filteredPokemon.forEach(pokemonData => {
            const pokemonClass = userCollection.some(p => p.pokemon_id === pokemonData.id) ? "collectie" : "niet-gevangen";
            const buddyIndicator = pokemonData.isBuddy ? `<span class="buddy-tag">⭐ Buddy</span>` : "";

            const listItem = document.createElement("div");
            listItem.className = pokemonClass;
            listItem.innerHTML = `
                ${pokemonClass === "collectie" ? `<img src="./images/Poke_Ball.webp" alt="Poké Ball" style="width: 30px; height: 30px;">` : ""}
                <img src="${pokemonData.sprite}" alt="${pokemonData.name}">
                <strong>${pokemonData.id}</strong> ${buddyIndicator}
                <strong>${pokemonData.name}</strong>
                <div>
                    ${pokemonData.types.split(", ").map(type => `
                        <span class="type-badge" style="background-color: ${getTypeColor(type)}">${type}</span>
                    `).join("")}
                </div>
            `;

            listItem.onclick = () => pokemonDetails(pokemonData);
            pokemonList.appendChild(listItem);
        });

        console.log(`[DEBUG] - ${filteredPokemon.length} Pokémon gevonden voor zoekterm: '${searchTerm}'.`);
    });
});
