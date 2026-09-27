#!/usr/bin/env node
/**
 * Notify IndexNow about canonical www URLs after a successful Pages deploy.
 * Never exits non-zero — deploy must stay green even if pinging fails.
 *
 * Dry-run (no wait, no POST):
 *   node scripts/indexnow.mjs --dry-run
 *   node scripts/indexnow.mjs --dry-run --from HEAD~1 --to HEAD
 *   node scripts/indexnow.mjs --dry-run --files src/content/listings/example.md
 *   node scripts/indexnow.mjs --dry-run --sitemap
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const HOST = "www.bestlawnrobots.com";
const ORIGIN = `https://${HOST}`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const KEY_NAME = /^[0-9a-f]{32}\.txt$/i;
const ZERO_SHA = "0".repeat(40);

const STATIC_PAGES = new Map([
  ["src/pages/index.astro", "/"],
  ["src/pages/about.astro", "/about/"],
  ["src/pages/wire-free.astro", "/wire-free/"],
  ["src/pages/best-robotic-lawn-mowers-2026.astro", "/best-robotic-lawn-mowers-2026/"],
  ["src/pages/best-robot-mower-for-hills.astro", "/best-robot-mower-for-hills/"],
  ["src/pages/best-robot-mower-for-1-acre.astro", "/best-robot-mower-for-1-acre/"],
  ["src/content/hubs/best-robotic-lawn-mowers-2026.md", "/best-robotic-lawn-mowers-2026/"],
  ["src/content/hubs/best-robot-mower-for-hills.md", "/best-robot-mower-for-hills/"],
  ["src/content/hubs/best-robot-mower-for-1-acre.md", "/best-robot-mower-for-1-acre/"],
]);

const SITE_WIDE =
  /^(astro\.config\.|src\/content\.config\.ts$|src\/(layouts|lib|components|scripts)\/|src\/pages\/mowers\/\[slug\]\.astro$)/;

function args() {
  const argv = process.argv.slice(2);
  const out = { dryRun: false, sitemap: false, from: "", to: "", files: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--sitemap") out.sitemap = true;
    else if (a === "--from") out.from = argv[++i] ?? "";
    else if (a === "--to") out.to = argv[++i] ?? "";
    else if (a === "--files") {
      out.files = [];
      while (argv[i + 1] && !argv[i + 1].startsWith("--")) out.files.push(argv[++i]);
    }
  }
  return out;
}

function log(...parts) {
  console.log("[indexnow]", ...parts);
}

function warn(...parts) {
  console.warn("[indexnow]", ...parts);
}

function canonical(path) {
  if (path === "/") return `${ORIGIN}/`;
  const trimmed = path.replace(/^\/+|\/+$/g, "");
  return `${ORIGIN}/${trimmed}/`;
}

function homepage() {
  return canonical("/");
}

function loadKey() {
  const publicDir = join(ROOT, "public");
  const names = readdirSync(publicDir).filter((name) => KEY_NAME.test(name));
  if (names.length !== 1) {
    throw new Error(`expected one 32-hex IndexNow key file in public/, found ${names.length}`);
  }
  const name = names[0];
  const key = readFileSync(join(publicDir, name), "utf8").trim();
  const fromName = name.replace(/\.txt$/i, "");
  if (key !== fromName) {
    throw new Error(`IndexNow key file contents must match the filename (${name})`);
  }
  return {
    key,
    keyLocation: `${ORIGIN}/${name}`,
  };
}

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

function listingUrlFromFile(relPath) {
  const name = relPath.split("/").pop() ?? "";
  const fromName = name.replace(/\.md$/i, "");
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) return canonical(`/mowers/${fromName}`);
  const raw = readFileSync(abs, "utf8");
  const slug = frontmatterField(raw, "slug") || fromName;
  if (frontmatterField(raw, "status") === "draft") return null;
  return canonical(`/mowers/${slug}`);
}

function urlsFromChangedFiles(files) {
  const urls = new Set([homepage()]);
  let siteWide = false;
  for (const file of files) {
    const rel = file.replace(/\\/g, "/");
    if (SITE_WIDE.test(rel)) {
      siteWide = true;
      continue;
    }
    const staticPath = STATIC_PAGES.get(rel);
    if (staticPath) {
      urls.add(canonical(staticPath));
      continue;
    }
    if (rel.startsWith("src/content/listings/") && rel.endsWith(".md")) {
      const url = listingUrlFromFile(rel);
      if (url) urls.add(url);
      continue;
    }
    const photo = rel.match(/^public\/mowers\/([^/]+)\.webp$/);
    if (photo) {
      urls.add(canonical(`/mowers/${photo[1]}`));
    }
  }
  return { urls: [...urls], siteWide };
}

function gitDiff(from, to) {
  const out = execFileSync("git", ["diff", "--name-only", "--diff-filter=ACDMRT", from, to], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return out
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((m) => m[1].trim());
}

async function urlsFromSitemap() {
  const indexXml = await (await fetch(`${ORIGIN}/sitemap-index.xml`)).text();
  const childLocs = parseLocs(indexXml).filter((loc) => loc.includes("sitemap"));
  const targets = childLocs.length ? childLocs : [`${ORIGIN}/sitemap-0.xml`];
  const urls = [];
  for (const loc of targets) {
    const xml = await (await fetch(loc)).text();
    for (const url of parseLocs(xml)) {
      if (url.startsWith(`${ORIGIN}/`) && !url.includes("sitemap")) urls.push(url);
    }
  }
  return [...new Set(urls)];
}

function usableSha(value) {
  return Boolean(value) && value !== ZERO_SHA && /^[0-9a-f]{7,40}$/i.test(value);
}

async function resolveUrlList(opts) {
  if (opts.files) {
    const mapped = urlsFromChangedFiles(opts.files);
    if (mapped.siteWide) {
      log("site-wide source files in --files; using sitemap");
      return { source: "sitemap", urls: await urlsFromSitemap() };
    }
    return { source: "files", urls: mapped.urls };
  }
  if (opts.sitemap) {
    return { source: "sitemap", urls: await urlsFromSitemap() };
  }

  const from = opts.from || process.env.INDEXNOW_BEFORE || "";
  const to = opts.to || process.env.INDEXNOW_AFTER || (opts.from ? "HEAD" : "");
  const cliRange = Boolean(opts.from || opts.to);
  const envRange = usableSha(from) && usableSha(to);
  if (from && to && (cliRange || envRange)) {
    try {
      const files = gitDiff(from, to);
      log(`git diff ${from}..${to} (${files.length} files)`);
      const mapped = urlsFromChangedFiles(files);
      if (mapped.siteWide) {
        log("site-wide source files changed; using sitemap");
        return { source: "sitemap", urls: await urlsFromSitemap() };
      }
      return { source: "git", urls: mapped.urls };
    } catch (err) {
      warn(`git diff failed (${err.message}); falling back to sitemap`);
    }
  }

  log("no usable git range; using sitemap");
  return { source: "sitemap", urls: await urlsFromSitemap() };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForKey(key, keyLocation, { attempts = 10, delayMs = 6000 } = {}) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(keyLocation, { redirect: "follow" });
      const body = (await res.text()).trim();
      log(`key file attempt ${i}/${attempts}: HTTP ${res.status}`);
      if (res.ok && body === key) return true;
    } catch (err) {
      log(`key file attempt ${i}/${attempts}: ${err.message}`);
    }
    if (i < attempts) await sleep(delayMs);
  }
  warn("key file not confirmed live; submitting anyway");
  return false;
}

async function submit(payload) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const text = (await res.text()).slice(0, 500);
  const ok = res.status === 200 || res.status === 202;
  log(`POST ${ENDPOINT} → HTTP ${res.status}${ok ? " (ok)" : ""}`);
  if (text) log(text);
  return ok;
}

async function main() {
  const opts = args();
  const { key, keyLocation } = loadKey();
  const { source, urls } = await resolveUrlList(opts);
  const urlList = urls.length ? urls : [homepage()];

  const payload = { host: HOST, key, keyLocation, urlList };
  log(`source=${source} urls=${urlList.length}`);
  for (const url of urlList) log(`  ${url}`);

  if (opts.dryRun) {
    log("dry-run payload:");
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  await waitForKey(key, keyLocation);
  await submit(payload);
}

main().catch((err) => {
  warn(err.stack || err.message || err);
  process.exit(0);
});
