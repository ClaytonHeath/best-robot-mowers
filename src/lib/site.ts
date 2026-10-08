export const SITE_NAME = "Best Robot Lawn Mowers";
/** Canonical origin. Must match astro.config `site` and public/CNAME (www). */
export const SITE_URL = "https://www.bestlawnrobots.com";
export const SITE_TAGLINE =
  "Official photos, published specs, and a short caveat for each robot mower.";
export const OWNER = "A Justamanstanding project";
export const SITE_DESCRIPTION =
  "Official photos, the specs the manufacturer publishes, and a one-line caveat on what each machine is actually for. Filter by wire, coverage, and navigation.";

/** Brand wordmark card (1200×630). Not a product photo. */
export const SHARE_IMAGE = "og.webp";

export function shareImageSrc(): string {
  return assetPath(SHARE_IMAGE);
}

export const NAV_LABELS = {
  lidar: "LiDAR",
  rtk: "RTK",
  vision: "Vision",
  "boundary-wire": "Boundary wire",
  hybrid: "Hybrid",
} as const;

export type NavigationType = keyof typeof NAV_LABELS;

export const COVERAGE_BANDS = [
  { id: "under-0.5", label: "Under 0.5 acre", min: 0, max: 0.5 },
  { id: "0.5-1.5", label: "0.5–1.5 acres", min: 0.5, max: 1.5 },
  { id: "over-1.5", label: "Over 1.5 acres", min: 1.5, max: Infinity },
] as const;

export type CoverageBandId = (typeof COVERAGE_BANDS)[number]["id"];

export function withBase(path = ""): string {
  const base = import.meta.env.BASE_URL;
  const trimmed = path.replace(/^\/+/, "");
  if (!trimmed) return base;
  return `${base}${trimmed}${trimmed.endsWith("/") ? "" : "/"}`;
}

export function assetPath(path: string): string {
  const base = import.meta.env.BASE_URL;
  const trimmed = path.replace(/^\/+/, "");
  return `${base}${trimmed}`;
}

export function listingPath(slug: string): string {
  return withBase(`mowers/${slug}`);
}

export function listingPhotoSrc(slug: string, image?: string): string {
  if (image && /^https?:\/\//i.test(image)) return image;
  if (image && image.trim()) return assetPath(image.replace(/^\/+/, ""));
  return assetPath(`mowers/${slug}.webp`);
}

export function formatNav(types: NavigationType[]): string {
  return types.map((type) => NAV_LABELS[type]).join(" + ");
}

export function coverageBand(acres: number): CoverageBandId {
  if (acres < 0.5) return "under-0.5";
  if (acres <= 1.5) return "0.5-1.5";
  return "over-1.5";
}

export function formatAcres(acres: number): string {
  const rounded = Number.isInteger(acres) ? acres.toFixed(0) : acres.toString();
  return `${rounded} acre${acres === 1 ? "" : "s"}`;
}

export function formatPrice(priceUsd: number | undefined, fallback = "Price varies"): string {
  if (priceUsd === undefined) return fallback;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number.isInteger(priceUsd) ? 0 : 2,
  }).format(priceUsd);
}

export function formatUpdated(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Search results cut snippets at roughly 155–160 characters. */
export const META_DESCRIPTION_MAX = 155;

function clipAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–—-]+$/, "");
  return `${trimmed}…`;
}

export interface ListingMetaInput {
  title: string;
  verdict: string;
  coverageAcres: number;
  slopePercent?: number;
  priceUsd?: number;
  navigation: NavigationType[];
  wireFree: boolean;
}

/** Spec-led snippet built only from frontmatter already shown on the page, capped for search results. */
export function listingMetaDescription(listing: ListingMetaInput): string {
  const nav = listing.navigation
    .map((type) => (type === "lidar" || type === "rtk" ? NAV_LABELS[type] : NAV_LABELS[type].toLowerCase()))
    .join(" + ");
  const wire = listing.wireFree ? "wire-free " : listing.navigation.includes("boundary-wire") ? "" : "boundary-wire ";
  const specs = [`up to ${formatAcres(listing.coverageAcres)}`];
  if (listing.slopePercent !== undefined) specs.push(`${listing.slopePercent}% slopes`);
  if (listing.priceUsd !== undefined && !listing.verdict.includes(formatPrice(listing.priceUsd))) {
    specs.push(formatPrice(listing.priceUsd));
  }
  const lead = `${listing.title}: ${wire}${nav} robot mower for ${specs.join(", ")}.`;
  if (lead.length >= META_DESCRIPTION_MAX - 30) return clipAtWord(lead, META_DESCRIPTION_MAX);
  return clipAtWord(`${lead} ${listing.verdict}`, META_DESCRIPTION_MAX);
}

export function isPresentUrl(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

function origin(): string {
  return SITE_URL.replace(/\/+$/, "");
}

/** Absolute page URL with the site's trailing-slash style. */
export function absoluteUrl(path = ""): string {
  const relative = withBase(path);
  return `${origin()}${relative.startsWith("/") ? relative : `/${relative}`}`;
}

export function listingCanonicalUrl(slug: string): string {
  return absoluteUrl(`mowers/${slug}`);
}

function absoluteAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const relative = assetPath(path);
  return `${origin()}${relative.startsWith("/") ? relative : `/${relative}`}`;
}

export interface ListingJsonLdInput {
  title: string;
  brand: string;
  model: string;
  verdict: string;
  slug: string;
  image?: string;
  priceUsd?: number;
  officialUrl: string;
}

/** Product + Offer only. No Review, aggregateRating, reviewRating, Person, or FAQPage. */
export function productJsonLd(listing: ListingJsonLdInput): Record<string, unknown> {
  const url = listingCanonicalUrl(listing.slug);
  const product: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    brand: { "@type": "Brand", name: listing.brand },
    description: listing.verdict,
    url,
  };
  if (listing.model) {
    product.sku = listing.model;
    product.model = listing.model;
  }
  if (listing.image?.trim()) {
    product.image = absoluteAssetUrl(listingPhotoSrc(listing.slug, listing.image));
  }
  if (listing.priceUsd !== undefined) {
    product.offers = {
      "@type": "Offer",
      price: listing.priceUsd,
      priceCurrency: "USD",
      url: isPresentUrl(listing.officialUrl) ? listing.officialUrl : url,
    };
  }
  return product;
}

export function listingBreadcrumbJsonLd(listing: Pick<ListingJsonLdInput, "title" | "slug">): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl() },
      {
        "@type": "ListItem",
        position: 2,
        name: listing.title,
        item: listingCanonicalUrl(listing.slug),
      },
    ],
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  const url = absoluteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url,
    },
  };
}

/** Homepage documentation list (url, name, position). Not a Product carousel. */
export function itemListJsonLd(listings: { title: string; slug: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: listings.map((listing, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: listing.title,
      url: listingCanonicalUrl(listing.slug),
    })),
  };
}

/** Hub / collection URL. ItemList of listings only — no Review or aggregateRating. */
export function collectionPageJsonLd(input: {
  name: string;
  description: string;
  path: string;
  listings: { title: string; slug: string }[];
}): Record<string, unknown> {
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl(),
    },
    mainEntity: {
      "@type": "ItemList",
      name: input.name,
      numberOfItems: input.listings.length,
      itemListElement: input.listings.map((listing, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: listing.title,
        url: listingCanonicalUrl(listing.slug),
      })),
    },
  };
}

export function pageBreadcrumbJsonLd(name: string, path: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl() },
      { "@type": "ListItem", position: 2, name, item: absoluteUrl(path) },
    ],
  };
}

/** Serialize JSON-LD so `</script>` in copy cannot break the tag. */
export function stringifyJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
