/* =========================================
   CONSTANTS & STATE
   ========================================= */
const PAGE_SIZE = 4;   // số bài hiển thị mỗi lần

let allPosts      = []; // tất cả bài không featured
let filteredPosts = []; // sau khi search/filter
let shownCount    = 0;
let activeFilter  = '';

/* =========================================
   DOM REFS
   ========================================= */
const featuredEl  = document.getElementById('featuredPost');
const postList    = document.getElementById('postList');
const noResults   = document.getElementById('noResults');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const searchInput = document.getElementById('searchInput');

/* =========================================
   FETCH MANIFEST & BOOTSTRAP
   ========================================= */
async function init() {
  try {
    const res  = await fetch('posts/manifest.json');
    if (!res.ok) throw new Error('manifest not found');
    const data = await res.json();

    const featured = data.posts.find(p => p.featured);
    allPosts       = data.posts.filter(p => !p.featured);
    filteredPosts  = [...allPosts];

    renderFeatured(featured);
    renderBatch(true);
    updateStats(data.posts);
  } catch (err) {
    console.error('Không thể tải manifest:', err);
    // Fallback: ẩn skeleton, hiện thông báo lỗi
    if (featuredEl) featuredEl.innerHTML =
      '<p style="color:var(--text-muted);padding:20px">Không thể tải bài viết nổi bật.</p>';
    if (postList) postList.innerHTML =
      '<p style="color:var(--text-muted);padding:20px">Không thể tải danh sách bài viết.</p>';
  }
}

/* =========================================
   RENDER: featured card
   ========================================= */
function renderFeatured(post) {
  if (!featuredEl || !post) return;
  featuredEl.innerHTML = `
    <article class="featured-card">
      <div class="featured-card__meta">
        <span class="tag tag--featured">Nổi bật</span>
        ${post.tags.map(t => `<span class="tag tag--cat">${t}</span>`).join('')}
      </div>
      <h3 class="featured-card__title">
        <a href="posts/${post.slug}.html">${post.title}</a>
      </h3>
      <p class="featured-card__excerpt">${post.excerpt}</p>
      <div class="featured-card__footer">
        <span class="post-date">📅 ${post.date}</span>
        <span class="read-time">⏱ ${post.readTime} phút đọc</span>
        <a href="posts/${post.slug}.html" class="read-more">Đọc tiếp →</a>
      </div>
    </article>`;
}

/* =========================================
   RENDER: one post card
   ========================================= */
function createPostCard(post) {
  const card    = document.createElement('article');
  card.className = 'post-card';
  card.dataset.tags = post.tags.map(t => t.toLowerCase()).join(' ');
  card.innerHTML = `
    <div class="post-card__tags">
      ${post.tags.map(t => `<span class="tag">${t}</span>`).join('')}
    </div>
    <h3 class="post-card__title">
      <a href="posts/${post.slug}.html">${post.title}</a>
    </h3>
    <p class="post-card__excerpt">${post.excerpt}</p>
    <div class="post-card__footer">
      <span class="post-date">${post.date}</span>
      <span class="read-time">${post.readTime} phút</span>
    </div>`;
  return card;
}

/* =========================================
   RENDER: batch of posts (load-more)
   ========================================= */
function renderBatch(reset = false) {
  if (reset) {
    postList.innerHTML = '';
    shownCount = 0;
  }

  const batch = filteredPosts.slice(shownCount, shownCount + PAGE_SIZE);

  // Add skeleton while "loading" (aesthetic only – data is instant locally)
  batch.forEach(post => {
    const card = createPostCard(post);
    card.style.animationDelay = ((shownCount % PAGE_SIZE) * 0.07) + 's';
    postList.appendChild(card);
    shownCount++;
  });

  const remaining = filteredPosts.length - shownCount;
  loadMoreBtn.style.display   = remaining > 0 ? 'flex' : 'none';
  loadMoreBtn.textContent     = remaining > 0
    ? `Xem thêm ${Math.min(remaining, PAGE_SIZE)} bài ↓`
    : '';
  noResults.style.display     = filteredPosts.length === 0 ? 'block' : 'none';
}

/* =========================================
   FILTER: search + tag
   ========================================= */
function applyFilter() {
  const query = searchInput.value.toLowerCase().trim();

  filteredPosts = allPosts.filter(post => {
    const matchQuery = !query ||
      post.title.toLowerCase().includes(query)   ||
      post.excerpt.toLowerCase().includes(query) ||
      post.tags.some(t => t.toLowerCase().includes(query));

    const matchTag = !activeFilter ||
      post.tags.some(t => t.toLowerCase().includes(activeFilter));

    return matchQuery && matchTag;
  });

  renderBatch(true);
}

/* =========================================
   UPDATE sidebar stats from manifest
   ========================================= */
function updateStats(posts) {
  const totalEl = document.getElementById('statTotal');
  const tagsEl  = document.getElementById('statTags');
  if (totalEl) totalEl.textContent = posts.length;
  if (tagsEl) {
    const uniqueTags = new Set(posts.flatMap(p => p.tags));
    tagsEl.textContent = uniqueTags.size;
  }
}

/* =========================================
   EVENTS
   ========================================= */
searchInput.addEventListener('input', applyFilter);

loadMoreBtn.addEventListener('click', () => {
  loadMoreBtn.disabled = true;
  loadMoreBtn.textContent = 'Đang tải...';
  // rAF để browser paint trạng thái disable trước
  requestAnimationFrame(() => {
    renderBatch(false);
    loadMoreBtn.disabled = false;
  });
});

// Tag filter (sidebar)
document.querySelectorAll('.tag--link[data-filter]').forEach(tag => {
  tag.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('posts').scrollIntoView({ behavior: 'smooth', block: 'start' });

    const wasActive = tag.classList.contains('active');
    document.querySelectorAll('.tag--link').forEach(t => t.classList.remove('active'));

    if (!wasActive) {
      tag.classList.add('active');
      activeFilter = tag.dataset.filter;
    } else {
      activeFilter = '';
    }

    applyFilter();
  });
});

/* =========================================
   DARK MODE
   ========================================= */
const html        = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = themeToggle.querySelector('.theme-toggle__icon');

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
});
nav.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    hamburger.classList.remove('open');
  });
});

/* =========================================
   SCROLL SPY
   ========================================= */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__link');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 90) current = sec.id;
  });
  navLinks.forEach(link =>
    link.classList.toggle('active', link.getAttribute('href') === '#' + current)
  );
}, { passive: true });

/* =========================================
   CONTACT FORM
   ========================================= */
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

contactForm.addEventListener('submit', e => {
  e.preventDefault();
  const btn = contactForm.querySelector('button[type="submit"]');
  btn.disabled    = true;
  btn.textContent = 'Đang gửi…';
  setTimeout(() => {
    contactForm.reset();
    formSuccess.style.display = 'block';
    btn.disabled    = false;
    btn.textContent = 'Gửi tin nhắn ✉️';
    setTimeout(() => (formSuccess.style.display = 'none'), 5000);
  }, 1200);
});

/* =========================================
   SMOOTH SCROLL
   ========================================= */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* =========================================
   KICK OFF
   ========================================= */
init();
