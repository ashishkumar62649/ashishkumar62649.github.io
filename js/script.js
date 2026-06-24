// Theme
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

// Stars
function createStars() {
  const el = document.getElementById('stars');
  if (!el) return;
  for (let i = 0; i < 60; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.setProperty('--d', (4 + Math.random() * 6) + 's');
    s.style.setProperty('--o1', (0.05 + Math.random() * 0.15).toFixed(2));
    s.style.setProperty('--o2', (0.2 + Math.random() * 0.3).toFixed(2));
    s.style.animationDelay = (Math.random() * 6) + 's';
    el.appendChild(s);
  }
}

// Mobile menu
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

// Scroll fade
function initFade() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
}

// Active nav
function setActive() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) a.classList.add('active');
  });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  setTheme(getTheme());
  createStars();
  initMenu();
  setActive();
  requestAnimationFrame(initFade);

  const btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', () => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
});
