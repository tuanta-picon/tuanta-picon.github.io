/**
 * shared.js — dùng chung cho tất cả trang bài viết (posts/)
 * Tự động inject: header, footer, progress bar, back-to-top, TOC, dark mode
 */

const ROOT = '../';   // posts/ -> root

/* ── RENDER HEADER ─────────────────────────────────────────── */
function renderHeader() {
  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <div class="container header__inner">
      <a href="${ROOT}index.html" class="logo">
        <span class="logo__icon">✦</span>
        <span class="logo__text">tuanta</span>
      </a>
      <nav class="nav" id="nav">
        <a href="${ROOT}index.html"         class="nav__link">Trang chủ</a>
        <a href="${ROOT}index.html#posts"   class="nav__link">Bài viết</a>
        <a href="${ROOT}index.html#about"   class="nav__link">Về tôi</a>
        <a href="${ROOT}index.html#contact" class="nav__link">Liên hệ</a>
      </nav>
      <div class="header__actions">
        <button class="theme-toggle" id="themeToggle" aria-label="Chuyển giao diện">
          <span class="theme-toggle__icon">☾</span>
        </button>
        <button class="hamburger" id="hamburger" aria-label="Mở menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>`;
  document.body.prepend(header);
}

/* ── RENDER FOOTER ─────────────────────────────────────────── */
function renderFooter() {
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="container footer__inner">
      <p>© 2026 <strong>tuanta</strong> · Được xây dựng với ❤️ và HTML thuần</p>
      <div class="footer__links">
        <a href="${ROOT}index.html#posts">← Tất cả bài viết</a>
        <a href="${ROOT}index.html">Trang chủ</a>
      </div>
    </div>`;
  document.body.appendChild(footer);
}

/* ── DARK MODE ─────────────────────────────────────────────── */
function initDarkMode() {
  const html        = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon   = themeToggle.querySelector('.theme-toggle__icon');

  const saved = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  apply(saved);
  themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    localStorage.setItem('theme', next);
  });

  function apply(theme) {
    html.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☼' : '☾';
  }
}

/* ── MOBILE MENU ───────────────────────────────────────────── */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const nav       = document.getElementById('nav');
  hamburger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    hamburger.classList.toggle('open', open);
  });
}

/* ── READING PROGRESS BAR ──────────────────────────────────── */
function initProgressBar() {
  const bar = document.createElement('div');
  bar.className = 'progress-bar';
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.body.scrollHeight - window.innerHeight;
    bar.style.width = total > 0 ? (scrolled / total * 100) + '%' : '0%';
  }, { passive: true });
}

/* ── BACK TO TOP ───────────────────────────────────────────── */
function initBackToTop() {
  const btn = document.createElement('button');
  btn.className   = 'back-to-top';
  btn.textContent = '↑';
  btn.setAttribute('aria-label', 'Lên đầu trang');
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── TABLE OF CONTENTS (auto-generate) ────────────────────── */
function initTOC() {
  const tocEl = document.getElementById('toc');
  if (!tocEl) return;

  const headings = document.querySelectorAll('.article-body h2, .article-body h3');
  if (!headings.length) return;

  const list = document.createElement('ul');
  list.className = 'toc__list';

  headings.forEach((h, i) => {
    if (!h.id) h.id = 'heading-' + i;
    const li   = document.createElement('li');
    const a    = document.createElement('a');
    li.className = h.tagName === 'H3' ? 'toc-h3' : '';
    a.href        = '#' + h.id;
    a.textContent = h.textContent;
    li.appendChild(a);
    list.appendChild(li);
  });

  tocEl.appendChild(list);

  // Active heading spy
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const id  = entry.target.id;
      const link = tocEl.querySelector(`a[href="#${id}"]`);
      if (link) link.classList.toggle('active', entry.isIntersecting);
    });
  }, { rootMargin: '-64px 0px -80% 0px' });

  headings.forEach(h => observer.observe(h));
}

/* ── INIT ALL ──────────────────────────────────────────────── */
(function init() {
  renderHeader();
  renderFooter();
  initDarkMode();
  initMobileMenu();
  initProgressBar();
  initBackToTop();
  initTOC();
})();
