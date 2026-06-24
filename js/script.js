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
  const count = window.innerWidth < 768 ? 30 : 50;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.setProperty('--d', (4 + Math.random() * 6) + 's');
    s.style.setProperty('--o1', (0.04 + Math.random() * 0.12).toFixed(2));
    s.style.setProperty('--o2', (0.15 + Math.random() * 0.25).toFixed(2));
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
  const title = document.querySelector('.hero-scroll-title');
  const image = document.querySelector('.hero-scroll-image');
  if (!title && !image) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const progress = Math.min(scrollY / (vh * 0.6), 1);

      if (title) {
        const y = progress * -80;
        const opacity = 1 - progress * 1.2;
        title.style.transform = `translateY(${y}px)`;
        title.style.opacity = Math.max(opacity, 0);
      }
      if (image) {
        const y = progress * -30;
        const scale = 1 + progress * 0.05;
        const rotateY = progress * 8;
        image.style.transform = `translateY(${y}px) scale(${scale}) perspective(800px) rotateY(${rotateY}deg)`;
        image.style.opacity = Math.max(1 - progress * 0.3, 0.5);
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ===== Profile Card Tilt ===== */
function initCardTilt() {
  const card = document.querySelector('.hero-image-card');
  if (!card) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) scale(1)';
  });
}

/* ===== Decorative Parallax ===== */
function initDecoParallax() {
  const decos = document.querySelectorAll('.hero-deco');
  if (!decos.length) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      decos.forEach((d, i) => {
        const speed = 0.03 + i * 0.015;
        const rotate = scrollY * (0.01 + i * 0.005);
        d.style.transform = `translateY(${scrollY * speed}px) rotate(${rotate}deg)`;
      });
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
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
  initDecoParallax();

  const btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', () => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
});
