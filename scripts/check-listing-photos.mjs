#!/usr/bin/env node
/**
 * Fail the build when a published listing is missing its official still.
 * Drafts may omit image. Never generate photos of real mowers.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const LISTINGS_DIR = join(ROOT, "src/content/listings");
const MOWERS_DIR = join(ROOT, "public/mowers");

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function frontmatterField(raw, key) {
  const match = raw.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  if (!match) return undefined;
  const value = match[1].trim();
  return value ? unquote(value) : undefined;
}

const errors = [];
const published = [];

for (const name of readdirSync(LISTINGS_DIR).sort()) {
  if (!name.endsWith(".md")) continue;
  const filePath = join(LISTINGS_DIR, name);
  const raw = readFileSync(filePath, "utf8");
  const status = frontmatterField(raw, "status");
  const slug = frontmatterField(raw, "slug");
  const image = frontmatterField(raw, "image");

  if (status !== "published") continue;
  if (!slug) {
    errors.push(`${name}: published listing is missing slug`);
    continue;
  }

  const expected = `/mowers/${slug}.webp`;
  if (image !== expected) {
    errors.push(
      `${name}: published listings require image: ${expected} (got ${image ?? "(missing)"})`,
    );
  }

  const stillPath = join(MOWERS_DIR, `${slug}.webp`);
  try {
    const info = statSync(stillPath);
    if (!info.isFile() || info.size <= 0) {
      errors.push(`${name}: ${expected} exists but is empty`);
    } else {
      published.push({ slug, bytes: info.size });
    }
  } catch {
    errors.push(`${name}: missing still at public/mowers/${slug}.webp`);
  }
}

if (errors.length) {
  console.error("Published listing photo check failed:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Published listing stills OK (${published.length}):`);
for (const item of published) {
  console.log(`  ${item.slug}.webp (${item.bytes} bytes)`);
}
