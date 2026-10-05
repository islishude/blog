import { readFileSync, existsSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
import { parseDate, readPosts } from './content.mjs';
const baseline = JSON.parse(readFileSync('tests/legacy-links.json', 'utf8'));
const posts = readPosts();
const bySource = new Map(posts.map(p => [`_posts/${p.file}`, `${p.id}/`]));
for (const old of baseline) assert.equal(bySource.get(old.source), old.path, old.source);
const site = 'https://blog.islishude.xyz';
const rss = [...readFileSync('dist/rss.xml', 'utf8').matchAll(/<link>(.*?)<\/link>/g)].map(m => decodeURIComponent(m[1]));
const sitemap = [...readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m => decodeURIComponent(m[1]));
for (const { id, data } of posts) {
  if (data.draft || parseDate(data.date).getTime() > Date.now()) continue;
  const html = readFileSync(`dist/${id}/index.html`, 'utf8');
  assert.equal(decodeURIComponent(html.match(/rel="canonical" href="([^"]+)"/)?.[1] ?? ""), `${site}/${id}/`, `canonical: ${id}`);
  assert.ok(rss.includes(`${site}/${id}/`), `RSS: ${id}`);
  assert.ok(sitemap.includes(`${site}/${id}/`), `sitemap: ${id}`);
}
// Check local anchors' page targets across all generated pages, including adjacent posts and lists.
for (const file of readdirSync('dist', { recursive: true }).filter(f => f.endsWith('.html'))) {
  const html = readFileSync(`dist/${file}`, 'utf8');
  for (const [, href] of html.matchAll(/href="([^"#]*)"/g)) {
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const path = decodeURIComponent(href.split(/[?#]/)[0]);
    assert.ok(existsSync(`dist${path}`) || existsSync(`dist${path}/index.html`), `${file}: broken ${href}`);
  }
}
assert.ok(existsSync('dist/pagefind/pagefind.js'), 'search index missing');
const indexedPaths = new Set(readdirSync('dist/pagefind/fragment').map(file => {
  const text = gunzipSync(readFileSync(`dist/pagefind/fragment/${file}`)).toString();
  return decodeURIComponent(JSON.parse(text.slice(text.indexOf('{'))).url);
}));
for (const { id, data } of posts) {
  if (data.draft || parseDate(data.date).getTime() > Date.now()) continue;
  assert.ok(indexedPaths.has(`/${id}/`), `search result URL missing: ${id}`);
}
console.log(`Verified ${baseline.length} legacy URLs, article canonicals, RSS, sitemap, search result URLs, and local page links.`);
