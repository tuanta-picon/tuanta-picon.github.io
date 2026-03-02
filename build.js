#!/usr/bin/env node
/**
 * build.js — Tự động scan posts/*.html và tạo lại posts/manifest.json
 *
 * Cách dùng:
 *   node build.js
 *
 * Khi thêm file HTML mới vào posts/, chạy lệnh này để cập nhật manifest.
 * Có thể tích hợp vào pre-commit hook hoặc GitHub Actions.
 */

const fs   = require('fs');
const path = require('path');

const postsDir     = path.join(__dirname, 'posts');
const manifestPath = path.join(postsDir, 'manifest.json');

// ── Helpers ──────────────────────────────────────────────────

/** Lấy nội dung text giữa thẻ HTML (bỏ inner tags) */
function innerText(html, regex) {
  const m = html.match(regex);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

/** Parse "dd tháng mm, yyyy" → "yyyy-mm-dd" để sort */
function parseViDate(str) {
  const monthMap = {
    '1':'01','2':'02','3':'03','4':'04','5':'05','6':'06',
    '7':'07','8':'08','9':'09','10':'10','11':'11','12':'12',
  };
  const m = str.match(/(\d+)\s+tháng\s+(\d+),\s+(\d{4})/);
  if (!m) return '0000-00-00';
  const [, d, mo, y] = m;
  return `${y}-${monthMap[mo] || '00'}-${d.padStart(2, '0')}`;
}

// ── Scan posts/ ───────────────────────────────────────────────

const files = fs.readdirSync(postsDir)
  .filter(f => f.endsWith('.html'))
  .sort();

if (!files.length) {
  console.log('Không tìm thấy file HTML nào trong posts/');
  process.exit(0);
}

const posts = files.map(filename => {
  const slug = filename.replace('.html', '');
  const html = fs.readFileSync(path.join(postsDir, filename), 'utf8');

  // Title: từ <h1 class="article-title">
  const title = innerText(html, /<h1[^>]*class="article-title"[^>]*>([\s\S]*?)<\/h1>/) || slug;

  // Excerpt: từ <meta name="description" content="...">
  const excerptM = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  const excerpt  = excerptM ? excerptM[1] : '';

  // Tags: từ <div class="article-header__tags"> ... </div>
  const tagsBlockM = html.match(/<div class="article-header__tags">([\s\S]*?)<\/div>/);
  const tags = [];
  if (tagsBlockM) {
    const tagRe = /<span[^>]*class="tag[^"]*"[^>]*>([^<]+)<\/span>/g;
    let tm;
    while ((tm = tagRe.exec(tagsBlockM[1])) !== null) {
      const t = tm[1].trim();
      if (t !== 'Nổi bật') tags.push(t);   // bỏ badge "Nổi bật"
    }
  }

  // Featured: kiểm tra tag--featured
  const featured = html.includes('class="tag tag--featured"');

  // Date: tìm "X tháng Y, YYYY" trong bài
  const dateM = html.match(/<span>(\d+\s+tháng\s+\d+,\s+\d{4})<\/span>/);
  const date  = dateM ? dateM[1] : '';
  const dateISO = parseViDate(date);

  // Read time: "⏱ X phút"
  const rtM     = html.match(/⏱\s*(\d+)\s+phút/);
  const readTime = rtM ? parseInt(rtM[1], 10) : 5;

  return { slug, title, excerpt, date, dateISO, readTime, tags, featured };
});

// Sort: featured trước, sau đó mới nhất đến cũ nhất
posts.sort((a, b) => {
  if (a.featured && !b.featured) return -1;
  if (!a.featured && b.featured) return  1;
  return b.dateISO.localeCompare(a.dateISO);
});

// ── Ghi manifest ──────────────────────────────────────────────

const manifest = {
  generated: new Date().toISOString().split('T')[0],
  posts,
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

console.log(`✓ manifest.json đã cập nhật — ${posts.length} bài viết`);
posts.forEach(p =>
  console.log(`  ${p.featured ? '★' : '·'} [${p.dateISO}] ${p.slug}`)
);
