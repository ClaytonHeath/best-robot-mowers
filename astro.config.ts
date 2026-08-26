import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sitemap, { type SitemapItem } from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SITE = "https://www.bestlawnrobots.com";

type SitemapItemWithImages = SitemapItem & {
  img?: { url: string; title?: string }[];
};

function isoFromFile(relPath: string): string {
  return statSync(join(ROOT, relPath)).mtime.toISOString();
}

function isoFromUpdated(updated: string | undefined, filePath: string): string {
  if (updated) {
    const parsed = new Date(/T/.test(updated) ? updated : `${updated}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return statSync(filePath).mtime.toISOString();
}

function frontmatterField(raw: string, key: string): string | undefined {
  return raw.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.trim();
}

function listingSitemapMeta(): Map<string, { lastmod: string; image?: string; title?: string }> {
  const dir = join(ROOT, "src/content/listings");
  const bySlug = new Map<string, { lastmod: string; image?: string; title?: string }>();
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md")) continue;
    const filePath = join(dir, name);
    const raw = readFileSync(filePath, "utf8");
    if (frontmatterField(raw, "status") !== "published") continue;
    const slug = frontmatterField(raw, "slug");
    if (!slug) continue;
    const image = frontmatterField(raw, "image");
    bySlug.set(slug, {
      lastmod: isoFromUpdated(frontmatterField(raw, "updated"), filePath),
      title: frontmatterField(raw, "title"),
      image: image || undefined,
    });
  }
  return bySlug;
}

const listings = listingSitemapMeta();

export default defineConfig({
  site: SITE,
  base: "/",
  trailingSlash: "always",
  integrations: [
    sitemap({
      serialize(item): SitemapItem {
        const out: SitemapItemWithImages = { ...item };
        const pathname = new URL(item.url).pathname;
        const listingMatch = pathname.match(/^\/mowers\/([^/]+)\/$/);
        if (listingMatch) {
          const listing = listings.get(listingMatch[1]);
          if (listing) {
            out.lastmod = listing.lastmod;
            if (listing.image) {
              const imagePath = listing.image.startsWith("/") ? listing.image : `/${listing.image}`;
              out.img = [
                {
                  url: listing.image.startsWith("http") ? listing.image : `${SITE}${imagePath}`,
                  title: listing.title,
                },
              ];
            }
            return out;
          }
        }
        if (pathname === "/") {
          out.lastmod = isoFromFile("src/pages/index.astro");
          return out;
        }
        if (pathname === "/about/") {
          out.lastmod = isoFromFile("src/pages/about.astro");
          return out;
        }
        return out;
      },
    }),
  ],
});
