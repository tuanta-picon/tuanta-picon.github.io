/* =========================================
   DARK MODE
   ========================================= */
const html          = document.documentElement;
const themeToggle   = document.getElementById('themeToggle');
const themeIcon     = themeToggle.querySelector('.theme-toggle__icon');

const savedTheme = localStorage.getItem('theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
});

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☼' : '☾';
}

/* =========================================
   MOBILE MENU
   ========================================= */
const hamburger = document.getElementById('hamburger');
const nav       = document.getElementById('nav');

hamburger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
});

// Close menu when a nav link is clicked
nav.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    hamburger.classList.remove('open');
  });
});

/* =========================================
   ACTIVE NAV LINK (scroll spy)
   ========================================= */
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav__link');

function updateActiveNav() {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 90) current = sec.id;
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
}

window.addEventListener('scroll', updateActiveNav, { passive: true });

/* =========================================
   SEARCH
   ========================================= */
const searchInput = document.getElementById('searchInput');
const postList    = document.getElementById('postList');
const noResults   = document.getElementById('noResults');
const postCards   = Array.from(postList.querySelectorAll('.post-card'));

searchInput.addEventListener('input', filterPosts);

function filterPosts() {
  const query  = searchInput.value.toLowerCase().trim();
  const filter = document.querySelector('.tag--link.active')?.dataset.filter || '';

  let visible = 0;

  postCards.forEach(card => {
    const title   = card.querySelector('.post-card__title').textContent.toLowerCase();
    const excerpt = card.querySelector('.post-card__excerpt').textContent.toLowerCase();
    const tags    = card.dataset.tags || '';

    const matchesQuery  = !query  || title.includes(query) || excerpt.includes(query) || tags.includes(query);
    const matchesFilter = !filter || tags.includes(filter);
    const show = matchesQuery && matchesFilter;

    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  noResults.style.display = visible === 0 ? 'block' : 'none';
}

/* =========================================
   TAG FILTER
   ========================================= */
const tagLinks = document.querySelectorAll('.tag--link[data-filter]');

tagLinks.forEach(tag => {
  tag.addEventListener('click', e => {
    e.preventDefault();
    // Scroll to posts section
    document.getElementById('posts').scrollIntoView({ behavior: 'smooth', block: 'start' });

    const isActive = tag.classList.contains('active');
    tagLinks.forEach(t => t.classList.remove('active'));

    if (!isActive) {
      tag.classList.add('active');
    }

    filterPosts();
  });
});

/* =========================================
   CONTACT FORM
   ========================================= */
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

contactForm.addEventListener('submit', e => {
  e.preventDefault();
  const btn = contactForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Đang gửi…';

  // Simulate sending (replace with actual backend/Formspree call)
  setTimeout(() => {
    contactForm.reset();
    formSuccess.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Gửi tin nhắn ✉️';
    setTimeout(() => (formSuccess.style.display = 'none'), 5000);
  }, 1200);
});

/* =========================================
   SMOOTH SCROLL for anchor links
   ========================================= */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
