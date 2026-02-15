// Presentation Navigation & Animations
document.addEventListener('DOMContentLoaded', () => {
  // Progress bar
  const progressBar = document.querySelector('.progress-bar');
  const slides = document.querySelectorAll('.slide');
  const navDots = document.querySelectorAll('.slide-nav a');

  // Scroll progress
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    if (progressBar) progressBar.style.width = progress + '%';

    // Update nav dots
    slides.forEach((slide, i) => {
      const rect = slide.getBoundingClientRect();
      if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
        navDots.forEach(d => d.classList.remove('active'));
        if (navDots[i]) navDots[i].classList.add('active');
      }
    });
  });

  // Intersection Observer for fade-in animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Keyboard navigation
  let currentSlide = 0;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      currentSlide = Math.min(currentSlide + 1, slides.length - 1);
      slides[currentSlide].scrollIntoView({ behavior: 'smooth' });
    }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      currentSlide = Math.max(currentSlide - 1, 0);
      slides[currentSlide].scrollIntoView({ behavior: 'smooth' });
    }
    // F for fullscreen
    if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  });

  // Smooth scroll for nav dots
  navDots.forEach((dot, i) => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      currentSlide = i;
      slides[i].scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Animated counters
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        const target = parseInt(entry.target.dataset.count);
        const suffix = entry.target.dataset.suffix || '';
        const prefix = entry.target.dataset.prefix || '';
        let current = 0;
        const step = Math.ceil(target / 40);
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          entry.target.textContent = prefix + current + suffix;
        }, 30);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => counterObserver.observe(c));
});
