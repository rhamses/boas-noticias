#!/usr/bin/env node
/**
 * Lê um JSON no stdin e grava um Markdown em src/content/noticias.
 * Não sobrescreve arquivo existente. O contrato está no README.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const collectionDir = path.join(root, 'src', 'content', 'noticias');

const LIMITS = {
  title: 300,
  description: 2000,
  source: 200,
  sourceUrl: 2000,
  body: 100_000,
};

function fail(message) {
  console.error(`ingest-noticia: ${message}`);
  process.exit(1);
}

function requiredString(value, name, max) {
  if (typeof value !== 'string') fail(`${name} deve ser texto.`);
  const trimmed = value.trim();
  if (!trimmed) fail(`${name} não pode ficar vazio.`);
  if (trimmed.length > max) fail(`${name} passa de ${max} caracteres.`);
  return trimmed;
}

function slugify(title) {
  const slug = title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  if (!slug) fail('não foi possível gerar um slug a partir do título.');
  return slug;
}

function parsePubDate(value) {
  if (typeof value !== 'string' || !value.trim()) fail('pubDate deve ser texto.');
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split('-').map(Number);
    const utc = new Date(Date.UTC(year, month - 1, day));
    if (
      utc.getUTCFullYear() !== year ||
      utc.getUTCMonth() !== month - 1 ||
      utc.getUTCDate() !== day
    ) {
      fail('pubDate não é uma data válida.');
    }
    return raw;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) fail('pubDate não é uma data válida.');
  return date.toISOString();
}

function parseSourceUrl(value) {
  const raw = requiredString(value, 'sourceUrl', LIMITS.sourceUrl);
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail('sourceUrl não é uma URL válida.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    fail('sourceUrl precisa usar http ou https.');
  }
  return url.href;
}

function uniqueFile(slug) {
  const candidates = [slug, ...Array.from({ length: 98 }, (_, index) => `${slug}-${index + 2}`)];
  for (const name of candidates) {
    const filename = `${name}.md`;
    const file = path.join(collectionDir, filename);
    if (!file.startsWith(collectionDir + path.sep)) fail('caminho inválido.');
    if (!fs.existsSync(file)) return { file, filename };
  }
  fail('já existem muitos arquivos com esse slug.');
}

const raw = fs.readFileSync(0, 'utf8').replace(/^\uFEFF/, '');
if (!raw.trim()) fail('stdin vazio. Envie um JSON.');

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  fail('JSON inválido.');
}
if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
  fail('o JSON precisa ser um objeto.');
}

const title = requiredString(payload.title, 'title', LIMITS.title);
const description = requiredString(payload.description, 'description', LIMITS.description);
const source = requiredString(payload.source, 'source', LIMITS.source);
const sourceUrl = parseSourceUrl(payload.sourceUrl);
const pubDate = parsePubDate(payload.pubDate);
const body = requiredString(payload.body, 'body', LIMITS.body);

const pubDateYaml = pubDate.includes('T') ? JSON.stringify(pubDate) : pubDate;
const markdown = [
  '---',
  `title: ${JSON.stringify(title)}`,
  `description: ${JSON.stringify(description)}`,
  `pubDate: ${pubDateYaml}`,
  `source: ${JSON.stringify(source)}`,
  `sourceUrl: ${JSON.stringify(sourceUrl)}`,
  '---',
  '',
  body,
  '',
].join('\n');

fs.mkdirSync(collectionDir, { recursive: true });
const { file, filename } = uniqueFile(slugify(title));
fs.writeFileSync(file, markdown, 'utf8');
process.stdout.write(`src/content/noticias/${filename}\n`);
