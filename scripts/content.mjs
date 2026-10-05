import { readdirSync, readFileSync } from 'node:fs';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';

export function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2})?Z?$/.test(value)) {
    throw new Error(`Invalid UTC publication date: ${value}`);
  }
  const normalized = value.replace(' ', 'T').replace(/Z$/, '');
  const iso = normalized.length === 10 ? `${normalized}T00:00:00` : normalized;
  const date = new Date(`${iso}Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 19) !== iso) {
    throw new Error(`Invalid UTC publication date: ${value}`);
  }
  return date;
}

export function postId(data) {
  const slug = data.slug;
  // Historical Hexo slugs include the category directory. Never slugify them.
  if (typeof slug !== 'string' || !slug || slug.split('/').some(s => !s || s === '.' || s === '..') || /[?#%\\\s]/u.test(slug)) {
    throw new Error(`Invalid explicit article slug: ${slug}`);
  }
  return `${parseDate(data.date).toISOString().slice(0, 10).replaceAll('-', '/')}/${slug}`;
}

export function excerpt(body) {
  return body.replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]*>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*`>_]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);
}

export function readPosts(root = 'source/_posts') {
  const files = readdirSync(root, { recursive: true }).filter(f => f.endsWith('.md')).sort();
  const ids = new Set();
  return files.map(file => {
    const { data, content } = matter(readFileSync(`${root}/${file}`, 'utf8'), { engines: { yaml: parseYaml } });
    const id = postId(data);
    if (ids.has(id)) throw new Error(`Duplicate article URL: /${id}/`);
    ids.add(id);
    if (!data.title || typeof data.title !== 'string') throw new Error(`Missing title: ${file}`);
    return { file, id, data, content };
  });
}
