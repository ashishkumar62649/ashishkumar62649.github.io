/* ===== Theme ===== */
const THEME_KEY = 'ashish-theme';
function getTheme() {
  return localStorage.getItem(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
}
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(THEME_KEY, t);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = t === 'dark' ? '&#9790;' : '&#9728;';
}

/* ===== Stars ===== */
function createStars() {
  const el = document.getElementById('stars');
  if (!el) return;
  const count = window.innerWidth < 768 ? 25 : 45;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.setProperty('--d', (4 + Math.random() * 6) + 's');
    s.style.setProperty('--o1', (0.03 + Math.random() * 0.1).toFixed(2));
    s.style.setProperty('--o2', (0.12 + Math.random() * 0.2).toFixed(2));
    s.style.animationDelay = (Math.random() * 6) + 's';
    el.appendChild(s);
  }
}

/* ===== Mobile Menu ===== */
function initMenu() {
  const h = document.getElementById('hamburger');
  const n = document.getElementById('nav-links');
  if (!h || !n) return;
  h.addEventListener('click', () => {
    n.classList.toggle('open');
    h.setAttribute('aria-expanded', n.classList.contains('open'));
  });
  n.querySelectorAll('a').forEach(a => a.addEventListener('click', () => n.classList.remove('open')));
}

/* ===== Active Nav ===== */
function setActive() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) a.classList.add('active');
  });
}

/* ===== Reveal on Scroll ===== */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ===== Hero Scroll Animation ===== */
function initHeroScroll() {
  const heroMotion = document.querySelector('.hero-motion');
  const heroCard = document.querySelector('.hero-card');
  const heroTopBar = document.querySelector('.hero-top-bar');
  const heroDecos = document.querySelectorAll('.hero-deco');
  const aboutSection = document.querySelector('.about-section');
  if (!heroMotion || !aboutSection) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // The scroll distance over which the hero animation plays
  // After this distance, the hero is fully scrolled out
  const ANIM_DISTANCE = window.innerHeight * 0.8;

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;

      // Progress from 0 (top) to 1 (fully scrolled)
      const progress = Math.min(scrollY / ANIM_DISTANCE, 1);

      // --- Hero heading: moves up and fades ---
      const headingY = progress * -120; // move up by 120px
      const headingOpacity = 1 - progress * 1.5;
      heroMotion.style.transform = `translateY(${headingY}px)`;
      heroMotion.style.opacity = Math.max(headingOpacity, 0);

      // --- Top bar: moves up and fades ---
      if (heroTopBar) {
        heroTopBar.style.transform = `translateY(${headingY * 0.6}px)`;
        heroTopBar.style.opacity = Math.max(headingOpacity, 0);
      }

      // --- Profile card: 3D rotation on Y axis ---
      if (heroCard) {
        // Card rotates from 0deg to 90deg (edge-on) back to 0deg
        // This creates the "turning card" effect
        let rotateY;
        let cardScale;
        let cardOpacity;

        if (progress < 0.5) {
          // First half: rotate toward edge-on
          rotateY = progress * 2 * 85; // 0 -> 85 degrees
          cardScale = 1 - progress * 0.3; // 1 -> 0.85
          cardOpacity = 1 - progress * 0.4;
        } else {
          // Second half: rotate back from edge-on
          rotateY = (1 - progress) * 2 * 85; // 85 -> 0 degrees
          cardScale = 0.7 + (progress - 0.5) * 0.6; // 0.7 -> 1
          cardOpacity = 0.6 + (progress - 0.5) * 0.8;
        }

        // Move card slightly up
        const cardY = progress * -30;

        heroCard.style.transform =
          `translateY(${cardY}px) ` +
          `scale(${cardScale}) ` +
          `perspective(800px) rotateY(${rotateY}deg)`;
        heroCard.style.opacity = Math.max(Math.min(cardOpacity, 1), 0);
      }

      // --- Decorations: parallax ---
      heroDecos.forEach((d, i) => {
        const speed = 0.02 + i * 0.01;
        const rotate = scrollY * (0.008 + i * 0.003);
        d.style.transform = `translateY(${scrollY * speed}px) rotate(${rotate}deg)`;
      });

      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ===== Card Tilt on Hover ===== */
function initCardTilt() {
  const cards = document.querySelectorAll('.hero-card');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !cards.length) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      // Only apply tilt if not being animated by scroll
      if (window.scrollY < 50) {
        card.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.03)`;
      }
    });
    card.addEventListener('mouseleave', () => {
      if (window.scrollY < 50) {
        card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) scale(1)';
      }
    });
  });
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  setTheme(getTheme());
  createStars();
  initMenu();
  setActive();
  initReveal();
  initHeroScroll();
  initCardTilt();

  const btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', () => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
});
