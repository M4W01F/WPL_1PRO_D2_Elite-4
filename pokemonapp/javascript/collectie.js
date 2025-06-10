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
            console.error(`Cannot fetch Pokémon with ID: ${pokemonId}.`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching Pokémon with ID: ${pokemonId}`, error);
        return null;
    }
}

async function displayCollectieList() {
    console.log("[DEBUG] - Laden van Pokémon collectie gestart.");

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

    const gesorteerdeCollectie = userData.user.collection.sort((a, b) => a.pokemon_id - b.pokemon_id);

    for (const pokemon of gesorteerdeCollectie) {
        try {
            const apiResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.pokemon_id}/`);
            if (!apiResponse.ok) {
                throw new Error(`Kan gegevens niet ophalen voor Pokémon ID: ${pokemon.pokemon_id}`);
            }

            const apiData = await apiResponse.json();
            const types = apiData.types?.map(typeInfo => typeInfo.type.name).join(', ') || "Onbekend";

            console.log(`[DEBUG] - API data opgehaald voor ${pokemon.pokemon_name}:`, types);

            const buddyIndicator = pokemon.isBuddy ? `<span class="buddy-tag">⭐ Buddy</span>` : "";

            const listItem = document.createElement('div');
            listItem.className = 'collectie';
            listItem.innerHTML = `
                <img src="./images/Poke_Ball.webp" alt="Poké Ball" style="width: 30px; height: 30px;">
                <img src="${pokemon.sprite}" alt="${pokemon.pokemon_name}">
                <strong>${pokemon.pokemon_id}</strong> ${buddyIndicator}
                <strong>${pokemon.pokemon_name}</strong>
                <div>
                    ${types.split(', ').map(type => `
                        <span class="type-badge" style="background-color: ${getTypeColor(type)}">${type}</span>
                    `).join('')}
                </div>
            `;

            listItem.onclick = () => {
                console.log("[DEBUG] - Klik op Pokémon:", pokemon.pokemon_name);
                pokemonDetails({
                    id: pokemon.pokemon_id,
                    name: pokemon.pokemon_name,
                    types: types,
                    sprite: pokemon.sprite
                });
            };
            pokemonList.appendChild(listItem);

        } catch (error) {
            console.error(`[ERROR] - Fout bij ophalen van API data voor ${pokemon.pokemon_name}:`, error);
        }
    }

    console.log("[DEBUG] - Pokémon collectie succesvol weergegeven met Buddy-indicatie.");
}

function pokemonDetails(pokemon) {
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

    // Maakt "buddy maken" knop
    const buddyButton = document.createElement('button');
    buddyButton.textContent = 'Buddy maken';
    buddyButton.onclick = async () => {
        console.log("[DEBUG] - Buddy wijziging gestart.");

        const email = JSON.parse(localStorage.getItem("loggedInUser")).email;
        const pokemonId = document.getElementById("pokemon-id").textContent;

        if (!pokemonId) {
            console.error("[ERROR] - Geen geldige Pokémon-ID gevonden.");
            alert("Selecteer een Pokémon om als Buddy te maken.");
            return;
        }

        try {
            const userResponse = await fetch("/api/getUser", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
                credentials: "include"
            });

            if (!userResponse.ok) {
                throw new Error("Fout bij ophalen van gebruikersgegevens.");
            }

            const userData = await userResponse.json();
            if (!userData.user || !userData.user.collection) {
                throw new Error("Gebruiker heeft geen Pokémon collectie.");
            }

            console.log("[DEBUG] - Huidige collectie opgehaald:", userData.user.collection);

            userData.user.collection.forEach(pokemon => {
                pokemon.isBuddy = pokemon.pokemon_id == pokemonId;
            });

            console.log("[DEBUG] - Nieuwe collectie met bijgewerkte Buddy-status:", userData.user.collection);

            const updateResponse = await fetch("/api/updateUser", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, collection: userData.user.collection }),
                credentials: "include"
            });

            if (!updateResponse.ok) {
                throw new Error("Fout bij updaten van de collectie.");
            }

            console.log("[DEBUG] - Buddy succesvol bijgewerkt!");
            alert("Je nieuwe Buddy is ingesteld!");
            window.location.reload();

        } catch (error) {
            console.error("[ERROR] - Fout bij het wijzigen van Buddy-status:", error);
            alert(error.message);
        }
    };
    actionsContainer.appendChild(buddyButton);
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

document.addEventListener('DOMContentLoaded', displayCollectieList);
