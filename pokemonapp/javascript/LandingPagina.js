document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.carousel-track');
    const projects = Array.from(track.children);
    const nextButton = document.querySelector('.carousel-button.next');
    const prevButton = document.querySelector('.carousel-button.prev');

    let currentIndex = 0;

    const updateCarousel = () => {
        const offset = -projects[currentIndex].offsetWidth * currentIndex;
        track.style.transform = `translateX(${offset}px)`;
    };

    const showNextSlide = () => {
        currentIndex = (currentIndex + 1) % projects.length;
        updateCarousel();
    };

    const showPrevSlide = () => {
        currentIndex = (currentIndex - 1 + projects.length) % projects.length;
        updateCarousel();
    };

    nextButton.addEventListener('click', showNextSlide);
    prevButton.addEventListener('click', showPrevSlide);

    // Automatisch schuiven (elke 3 seconden)
    setInterval(showNextSlide, 3000);
});
const userLoggedIn = false; // Simuleert of een gebruiker is ingelogd
const userProjects = ["Project Groep A"]; // Projecten waaraan de gebruiker kan deelnemen

const projects = [
  { name: "Project Groep A", img: "project-a.jpg" },
  { name: "Project Groep B", img: "project-b.jpg" },
];

const projectList = document.querySelector(".project-list");

projects.forEach((project) => {
  const projectDiv = document.createElement("div");
  projectDiv.classList.add("project");

  projectDiv.innerHTML = `
    <img src="${project.img}" alt="${project.name}">
    <h2>${project.name}</h2>
    <button onclick="selectProject('${project.name}')">Kies Project</button>
  `;

  projectList.appendChild(projectDiv);
});

function selectProject(projectName) {
  if (!userLoggedIn) {
    alert("Je moet eerst inloggen om een project te selecteren.");
    return;
  }

  if (!userProjects.includes(projectName)) {
    alert("Je kunt niet deelnemen aan dit project.");
    return;
  }

  alert(`Welkom bij ${projectName}!`);
  // Hier kun je doorverwijzen naar de projectpagina
  window.location.href = `/project/${Pokemon}`;}