let currentIndex = 0;
const isLoggedIn = false; // Zet op true als gebruiker is ingelogd.
const userProject = "Pokemon"; // Alleen toegankelijk project voor de gebruiker.

const track = document.querySelector('.carousel-track');
const projects = document.querySelectorAll('.project');
const prevButton = document.querySelector('.carousel-button.prev');
const nextButton = document.querySelector('.carousel-button.next');

function updateCarousel() {
  const width = projects[0].clientWidth + 20; // Inclusief marge
  track.style.transform = `translateX(-${currentIndex * width}px)`;
}

nextButton.addEventListener('click', () => {
  if (currentIndex < projects.length - 1) {
    currentIndex++;
    updateCarousel();
  }
});

prevButton.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    updateCarousel();
  }
});

projects.forEach((project) => {
  project.addEventListener('click', () => {
    const selectedProject = project.dataset.project;
    if (!isLoggedIn) {
      alert("Je moet eerst inloggen om door te gaan.");
    } else if (selectedProject !== userProject) {
      alert("Je kunt hier niet aan deelnemen.");
    } else {
      alert(`Welkom bij het ${selectedProject} project!`);
      // Navigatie naar de projectpagina kan hier worden toegevoegd:
      // window.location.href = `${selectedProject}-landingpage.html`;
    }
  });
});