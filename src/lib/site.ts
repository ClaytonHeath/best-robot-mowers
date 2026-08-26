export const SITE_NAME = "Best Robot Lawn Mowers";
export const SITE_TAGLINE = "A hardware-catalog directory of robot lawn mowers.";
export const OWNER = "A Justamanstanding project";
export const SITE_DESCRIPTION =
  "Official photos and printed specs for wire-free LiDAR, RTK, and vision robot mowers, plus boundary-wire models. A Justamanstanding project — not a ranking for sale.";

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

export function isPresentUrl(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}
