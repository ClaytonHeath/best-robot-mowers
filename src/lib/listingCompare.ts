import type { CollectionEntry } from "astro:content";
import { formatAcres, formatNav, formatPrice, listingPath } from "./site";

type Listing = CollectionEntry<"listings">;

/**
 * LiDAR peers for the Anthbot M5 LiDAR page. Each slug is a published
 * listing whose navigation includes lidar. Cells are listing fields only.
 * The build fails if a slug is missing or is no longer LiDAR.
 */
export const M5_LIDAR_SLUG = "anthbot-m5-lidar";

export const M5_LIDAR_PEER_SLUGS = [
  "anthbot-m5-pro",
  "anthbot-m9-pro",
  "ecovacs-goat-a2000-lidar-pro",
  "segway-navimow-i215-lidar",
  "mammotion-luba-mini-2-awd-1500h",
] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const NOT_LISTED = "not listed";

export interface ComparePeer {
  title: string;
  href: string;
}

export interface CompareColumn {
  title: string;
  href?: string;
}

export interface CompareRow {
  label: string;
  cells: string[];
}

export interface ListingComparison {
  heading: string;
  /** Sentence before the peer links. The page adds the shared “no ranking” wording after the links. */
  lead: string;
  caption: string;
  /** Extra sentence for this listing only. Omitted when the shared wording is enough. */
  note?: string;
  peers: ComparePeer[];
  columns: CompareColumn[];
  rows: CompareRow[];
}

function formatChecked(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function listed(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : NOT_LISTED;
}

function columnCells(listing: Listing, label: string): string[] {
  const data = listing.data;
  if (data.priceUsd === undefined) {
    throw new Error(`${label} comparison listing ${data.slug} has no priceUsd`);
  }
  return [
    `${formatPrice(data.priceUsd)} (${formatChecked(data.updated)})`,
    formatAcres(data.coverageAcres),
    data.slopePercent === undefined ? NOT_LISTED : `${data.slopePercent}%`,
    formatNav(data.navigation),
    data.wireFree ? "Wire-free" : "Boundary wire",
    data.cuttingWidthIn === undefined ? NOT_LISTED : `${data.cuttingWidthIn} in`,
    listed(data.cuttingHeight),
    listed(data.driveType),
    data.noiseDb === undefined ? NOT_LISTED : `${data.noiseDb} dB`,
    data.weightLbs === undefined ? NOT_LISTED : `${data.weightLbs} lb`,
    listed(data.ipRating),
  ];
}

const ROW_LABELS = [
  "US price",
  "Coverage",
  "Max slope",
  "Navigation",
  "Boundary",
  "Cutting width",
  "Cutting height",
  "Drive",
  "Noise",
  "Weight",
  "Ingress rating",
] as const;

function buildComparison(
  listings: Listing[],
  subjectSlug: string,
  peerSlugs: readonly string[],
  label: string,
  validate: (item: Listing, role: "subject" | "peer") => void,
  copy: Pick<ListingComparison, "heading" | "lead" | "caption" | "note">,
): ListingComparison {
  const bySlug = new Map(listings.map((item) => [item.data.slug, item]));
  const subject = bySlug.get(subjectSlug);
  if (!subject) throw new Error(`${label} comparison missing the subject listing`);
  validate(subject, "subject");

  const peers = peerSlugs.map((slug) => {
    const item = bySlug.get(slug);
    if (!item) throw new Error(`${label} comparison missing published listing ${slug}`);
    validate(item, "peer");
    return item;
  });

  const columns = [subject, ...peers];
  const cells = columns.map((item) => columnCells(item, label));
  return {
    ...copy,
    peers: peers.map((item) => ({
      title: item.data.title,
      href: listingPath(item.data.slug),
    })),
    columns: columns.map((item, index) => ({
      title: item.data.title,
      href: index === 0 ? undefined : listingPath(item.data.slug),
    })),
    rows: ROW_LABELS.map((rowLabel, row) => ({
      label: rowLabel,
      cells: cells.map((column) => column[row] ?? NOT_LISTED),
    })),
  };
}

function requireLidar(item: Listing, role: "subject" | "peer"): void {
  if (!item.data.navigation.includes("lidar")) {
    throw new Error(`M5 LiDAR comparison ${role} ${item.data.slug} is not a LiDAR listing`);
  }
}

/** Spec table for the M5 LiDAR page. Values come from published listing fields. */
export function m5LidarComparison(listings: Listing[]): ListingComparison {
  return buildComparison(listings, M5_LIDAR_SLUG, M5_LIDAR_PEER_SLUGS, "M5 LiDAR", requireLidar, {
    heading: "Compared with other LiDAR robot mowers",
    lead: "The M5 LiDAR is listed here next to other published LiDAR listings, not every LiDAR model in this directory:",
    caption: "Listing specs for the M5 LiDAR and other published LiDAR mowers",
  });
}

/**
 * Anthbot siblings for the Genie 3000 page. Same-PDP Genie SKUs first, then
 * the other published Anthbot lines named for this refresh. Cells are listing
 * fields only. The build fails if a slug is missing or is no longer Anthbot.
 * M5 Pro and M9 Pro stay off this table: they are the LiDAR + RTK variants of
 * the M5 and M9 size classes already included.
 */
export const GENIE_3000_SLUG = "anthbot-genie-3000";

export const GENIE_3000_PEER_SLUGS = [
  "anthbot-genie-1000",
  "anthbot-genie",
  "anthbot-n8",
  "anthbot-m9",
  "anthbot-m5",
  "anthbot-m5-lidar",
] as const;

function requireAnthbot(item: Listing, role: "subject" | "peer"): void {
  if (item.data.brand !== "Anthbot") {
    throw new Error(`Genie 3000 comparison ${role} ${item.data.slug} is not an Anthbot listing`);
  }
}

/** Spec table for the Genie 3000 page. Values come from published listing fields. */
export function genie3000Comparison(listings: Listing[]): ListingComparison {
  const subject = listings.find((item) => item.data.slug === GENIE_3000_SLUG);
  if (!subject?.body) {
    throw new Error("Genie 3000 comparison missing the subject listing body");
  }
  if (!subject.body.includes("0.89 acre / up to 3600 m²") || !subject.body.includes("recommended yard-fit")) {
    throw new Error("Genie 3000 comparison note expected the marketed-ceiling wording in the listing body");
  }
  const coverage = formatAcres(subject.data.coverageAcres);
  return buildComparison(listings, GENIE_3000_SLUG, GENIE_3000_PEER_SLUGS, "Genie 3000", requireAnthbot, {
    heading: "Compared with other Anthbot robot mowers",
    lead: "The Genie 3000 is listed here next to other published Anthbot listings, not every Anthbot model in this directory:",
    caption: "Listing specs for the Genie 3000 and other published Anthbot mowers",
    note: `Coverage in this table is each listing’s coverage figure. For the Genie 3000, that figure is the recommended coverage (${coverage}). The marketed ceiling on this listing is 0.89 acre / up to 3600 m², not the recommended yard-fit.`,
  });
}
