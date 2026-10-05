import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { postId, parseDate, readPosts } from '../scripts/content.mjs';

const baseline = JSON.parse(readFileSync(new URL('./legacy-links.json', import.meta.url)));
test('all 125 historical URLs match the UTC Hexo build', () => {
  const posts = new Map(readPosts().map(p => [`_posts/${p.file}`, `${p.id}/`]));
  assert.equal(baseline.length, 125);
  for (const old of baseline) assert.equal(posts.get(old.source), old.path, old.source);
});
test('explicit nested slug preserves Chinese, case, punctuation and ignores title', () => {
  assert.equal(postId({ date: '2020-01-02 00:00:00', slug: 'Go/中文（测试）', title: 'changed' }), '2020/01/02/Go/中文（测试）');
});
test('date and slug fail closed', () => {
  for (const date of ['2020-02-30', 'invalid', '2020-13-01', '2020-01-01T25:00:00']) assert.throws(() => parseDate(date));
  for (const slug of ['', '../a', '/a', 'a//b', 'a?b', 'a#b', 'a%20b']) assert.throws(() => postId({ date: '2020-01-01', slug }));
});
test('publication paths are independent of machine timezone', () => {
  const run = TZ => execFileSync(process.execPath, ['--input-type=module', '-e', "import {readPosts} from './scripts/content.mjs'; console.log(JSON.stringify(readPosts().map(p=>p.id)))"], { env: { ...process.env, TZ }, encoding: 'utf8' });
  assert.equal(run('UTC'), run('Asia/Shanghai'));
  assert.equal(run('UTC'), run('America/Los_Angeles'));
});

test('duplicate URLs and invalid YAML dates are rejected before indexing', () => {
  const root = mkdtempSync(join(tmpdir(), 'blog-content-'));
  try {
    const text = '---\ntitle: Test\ndate: 2020-01-01\nslug: test\n---\nText';
    writeFileSync(join(root, 'one.md'), text);
    writeFileSync(join(root, 'two.md'), text);
    assert.throws(() => readPosts(root), /Duplicate article URL/);
    rmSync(join(root, 'two.md'));
    writeFileSync(join(root, 'one.md'), text.replace('2020-01-01', '2020-02-30'));
    assert.throws(() => readPosts(root), /Invalid UTC publication date/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
