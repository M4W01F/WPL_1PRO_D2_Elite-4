// Selecteer de carousel en knoppen
const track = document.querySelector('.carousel-track');
const prevButton = document.querySelector('.carousel-button.prev');
const nextButton = document.querySelector('.carousel-button.next');

// **Projectdata behouden**
const projectData = [
    { name: "Pokemon", img: "./images/Pokemon_landinPagina.jpg" },
    { name: "Fortnite", img: "./images/fornite.jpeg" },
    { name: "LegoMasters", img: "./images/legomasters.jpg" },
    { name: "Fifa", img: "./images/fifa.jpg" },
    { name: "Lord of the Rings", img: "./images/Lotr.jpg" },
    { name: "Magic The Gathering", img: "./images/mtg.jpeg" }
];

// **Dynamische projectvolgorde instellen**
function reorderProjects(startIndex) {
    return [...projectData.slice(startIndex), ...projectData.slice(0, startIndex)];
}

// **Dynamisch projecten genereren op basis van nieuwe volgorde**
function loadProjects(startIndex = 0) {
    track.innerHTML = ''; // Verwijder bestaande inhoud

    const orderedProjects = reorderProjects(startIndex);
    
    orderedProjects.forEach((project) => {
        const projectElement = document.createElement('div');
        projectElement.classList.add('project');
        projectElement.setAttribute('data-project', project.name);

        projectElement.innerHTML = `
            <img src="${project.img}" alt="${project.name}">
            <h2>${project.name}</h2>
        `;

        // **Klikfunctionaliteit toevoegen aan elk project**
        projectElement.addEventListener("click", () => {
            handleProjectClick(project.name);
        });

        track.appendChild(projectElement);
    });

    track.style.transform = `translateX(0px)`; // Reset de positie
}

// **Project klikfunctionaliteit**
function handleProjectClick(selectedProject) {
    if (selectedProject === "Pokemon") {
        window.location.href = "inlog.html"; // Naar inlogpagina voor Pokemon
    } else {
        alert(`Je kunt niet deelnemen aan: ${selectedProject}`);
    }
}

let currentIndex = 0; // Houd de huidige startpositie bij

// **Beweeg naar de volgende slide**
function moveToNext() {
    currentIndex = (currentIndex + 1) % projectData.length; // Circulaire navigatie
    loadProjects(currentIndex);
}

// **Beweeg naar de vorige slide**
function moveToPrev() {
    currentIndex = (currentIndex - 1 + projectData.length) % projectData.length; // Circulaire navigatie
    loadProjects(currentIndex);
}

// **Event listeners voor de knoppen**
nextButton.addEventListener("click", moveToNext);
prevButton.addEventListener("click", moveToPrev);

// **Laad initiële projecten**
loadProjects(0);