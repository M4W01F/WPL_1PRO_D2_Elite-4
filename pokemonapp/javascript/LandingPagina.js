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