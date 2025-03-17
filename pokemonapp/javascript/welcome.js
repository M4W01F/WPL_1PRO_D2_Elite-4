const track = document.querySelector('.carousel-track');
const projects = Array.from(document.querySelectorAll('.project'));
const prevButton = document.querySelector('.carousel-button.prev');
const nextButton = document.querySelector('.carousel-button.next');

// Klonen voor een oneindige loop
const firstClone = projects[0].cloneNode(true);
const lastClone = projects[projects.length - 1].cloneNode(true);
track.appendChild(firstClone);
track.insertBefore(lastClone, projects[0]);

let currentIndex = 1; // Start bij het eerste 'echte' item
const projectWidth = projects[0].clientWidth + 20; // Breedte inclusief marge
track.style.transform = `translateX(-${currentIndex * projectWidth}px)`; // Beweeg naar de volgende slide

// Beweeg naar de volgende slide
function moveToNext() {
  currentIndex++;
  track.style.transition = 'transform 0.5s ease-in-out';
  track.style.transform = `translateX(-${currentIndex * projectWidth}px)`;

  // Reset bij het bereiken van de klonen
  track.addEventListener('transitionend', () => {
    if (projects[currentIndex] && projects[currentIndex].id === 'first-clone') {
      track.style.transition = 'none'; // Verwijder overgang
      currentIndex = 1; // Zet terug naar de eerste echte project
      track.style.transform = `translateX(-${currentIndex * projectWidth}px)`; // Weer naar de echte eerste
    }
  });
}

// Beweeg naar de vorige slide
function moveToPrev() {
  currentIndex--;
  track.style.transition = 'transform 0.5s ease-in-out';
  track.style.transform = `translateX(-${currentIndex * projectWidth}px)`;

  // Reset bij het bereiken van de klonen
  track.addEventListener('transitionend', () => {
    if (projects[currentIndex] && projects[currentIndex].id === 'last-clone') {
      track.style.transition = 'none'; // Verwijder overgang
      currentIndex = projects.length - 1; // Zet terug naar het laatste echte project
      track.style.transform = `translateX(-${currentIndex * projectWidth}px)`; // Weer naar het laatste
    }
  });
}

// Event listeners voor de knoppen
nextButton.addEventListener('click', moveToNext);
prevButton.addEventListener('click', moveToPrev);

// Klikacties voor projecten
projects.forEach((project) => {
  project.addEventListener('click', () => {
    const selectedProject = project.dataset.project;
    if (selectedProject === "Pokemon") {
      window.location.href = "inlog.html"; // Naar inlogpagina voor Pokemon
    } else {
      alert("Je kunt hier niet aan deelnemen."); // Toon alert voor andere projecten
    }
  });
});

// Voeg hier de functionaliteit toe voor continue beweging van de carrousel
let autoSlideInterval = setInterval(moveToNext, 3000); // Automatisch elke 3 seconden naar de volgende

// Stop de automatische beweging bij handmatig navigeren
nextButton.addEventListener('click', () => {
  clearInterval(autoSlideInterval); // Stop automatische beweging
  autoSlideInterval = setInterval(moveToNext, 3000); // Start weer de automatische beweging
});

prevButton.addEventListener('click', () => {
  clearInterval(autoSlideInterval); // Stop automatische beweging
  autoSlideInterval = setInterval(moveToNext, 3000); // Start weer de automatische beweging
});