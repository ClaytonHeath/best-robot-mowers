#!/usr/bin/env node
/**
 * Fail when any built page's <meta name="description"> exceeds 155 characters
 * (JS string.length after HTML-entity resolution — the value browsers expose).
 * Run after `astro build` so dist/ exists. Does not rewrite copy.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const MAX = 155;
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, "dist");

function walkHtml(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, acc);
    else if (entry.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#0*39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return match ? (match[1] ?? match[2]) : undefined;
}

function metaDescription(html) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    if (attr(tag, "name")?.toLowerCase() !== "description") continue;
    const content = attr(tag, "content");
    return content === undefined ? "" : decodeEntities(content);
  }
  return undefined;
}

function pagePath(file) {
  const rel = relative(DIST, file).replaceAll("\\", "/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  return `/${rel.replace(/\.html$/, "")}`;
}

if (!existsSync(DIST)) {
  console.error("Meta description check needs dist/. Run `astro build` first.");
  process.exit(1);
}

const pages = walkHtml(DIST).sort();
if (!pages.length) {
  console.error("Meta description check found no HTML in dist/.");
  process.exit(1);
}

const missing = [];
const tooLong = [];

for (const file of pages) {
  const path = pagePath(file);
  const description = metaDescription(readFileSync(file, "utf8"));
  if (description === undefined) {
    missing.push(path);
    continue;
  }
  if (description.length > MAX) {
    tooLong.push({ path, length: description.length, description });
  }
}

if (missing.length || tooLong.length) {
  if (tooLong.length) {
    console.error(`Meta description over ${MAX} characters (${tooLong.length}):`);
    for (const item of tooLong) {
      console.error(`  ${item.path} (${item.length}): ${item.description}`);
    }
  }
  if (missing.length) {
    console.error(`Missing <meta name="description"> (${missing.length}):`);
    for (const path of missing) console.error(`  ${path}`);
  }
  process.exit(1);
}

console.log(`Meta descriptions OK (${pages.length} pages, ≤${MAX} chars).`);
