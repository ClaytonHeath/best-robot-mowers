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
 * Dreame A3 AWD siblings for the A3 AWD 1000 page, then two close peers
 * already published here: the same 0.25-acre LiDAR cut class, and another
 * 80% AWD LiDAR listing. Cells are listing fields only. The build fails if
 * a slug is missing, if any column is no longer LiDAR, or if a Dreame
 * sibling is no longer Dreame all-wheel drive.
 */
export const A3_AWD_1000_SLUG = "dreame-a3-awd-1000";

export const A3_AWD_1000_PEER_SLUGS = [
  "dreame-a3-awd-2000",
  "dreame-a3-awd-pro-2500",
  "dreame-a3-awd-pro-3500",
  "dreame-a3-awd-pro-5000",
  "mova-lidax-ultra-1000",
  "mammotion-luba-3-awd-1500",
] as const;

const A3_AWD_1000_SIBLING_SLUGS = new Set<string>([
  "dreame-a3-awd-2000",
  "dreame-a3-awd-pro-2500",
  "dreame-a3-awd-pro-3500",
  "dreame-a3-awd-pro-5000",
]);

function requireA3Awd1000Column(item: Listing, role: "subject" | "peer"): void {
  if (!item.data.navigation.includes("lidar")) {
    throw new Error(`A3 AWD 1000 comparison ${role} ${item.data.slug} is not a LiDAR listing`);
  }
  const dreameSibling = role === "subject" || A3_AWD_1000_SIBLING_SLUGS.has(item.data.slug);
  if (!dreameSibling) return;
  if (item.data.brand !== "Dreame") {
    throw new Error(`A3 AWD 1000 comparison ${role} ${item.data.slug} is not a Dreame listing`);
  }
  if (item.data.driveType !== "All-wheel drive") {
    throw new Error(`A3 AWD 1000 comparison ${role} ${item.data.slug} is not all-wheel drive`);
  }
}

/** Spec table for the A3 AWD 1000 page. Values come from published listing fields. */
export function a3Awd1000Comparison(listings: Listing[]): ListingComparison {
  return buildComparison(
    listings,
    A3_AWD_1000_SLUG,
    A3_AWD_1000_PEER_SLUGS,
    "A3 AWD 1000",
    requireA3Awd1000Column,
    {
      heading: "Compared with Dreame A3 AWD siblings and close peers",
      lead: "The A3 AWD 1000 is listed here next to the other published Dreame A3 AWD listings and two close peers, not every LiDAR or AWD model in this directory:",
      caption: "Listing specs for the A3 AWD 1000, the other Dreame A3 AWD listings, and two close peers",
    },
  );
}

/**
 * Dreame A3 AWD siblings for the A3 AWD 2000 page. Same published family as
 * the 1000 comparison, with this SKU as the subject and no extra peers.
 * Cells are listing fields only. The build fails if a slug is missing, if
 * any column is no longer LiDAR, or if a column is no longer Dreame
 * all-wheel drive.
 */
export const A3_AWD_2000_SLUG = "dreame-a3-awd-2000";

export const A3_AWD_2000_PEER_SLUGS = [
  "dreame-a3-awd-1000",
  "dreame-a3-awd-pro-2500",
  "dreame-a3-awd-pro-3500",
  "dreame-a3-awd-pro-5000",
] as const;

function requireA3Awd2000Column(item: Listing, role: "subject" | "peer"): void {
  if (!item.data.navigation.includes("lidar")) {
    throw new Error(`A3 AWD 2000 comparison ${role} ${item.data.slug} is not a LiDAR listing`);
  }
  if (item.data.brand !== "Dreame") {
    throw new Error(`A3 AWD 2000 comparison ${role} ${item.data.slug} is not a Dreame listing`);
  }
  if (item.data.driveType !== "All-wheel drive") {
    throw new Error(`A3 AWD 2000 comparison ${role} ${item.data.slug} is not all-wheel drive`);
  }
}

/** Spec table for the A3 AWD 2000 page. Values come from published listing fields. */
export function a3Awd2000Comparison(listings: Listing[]): ListingComparison {
  return buildComparison(
    listings,
    A3_AWD_2000_SLUG,
    A3_AWD_2000_PEER_SLUGS,
    "A3 AWD 2000",
    requireA3Awd2000Column,
    {
      heading: "Compared with other Dreame A3 AWD listings",
      lead: "The A3 AWD 2000 is listed here next to the other published Dreame A3 AWD listings, not every LiDAR or AWD model in this directory:",
      caption: "Listing specs for the A3 AWD 2000 and the other Dreame A3 AWD listings",
    },
  );
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

/**
 * Segway Navimow siblings for the i110 page. Closest listed choices first:
 * smaller i-series, same-acreage AWD, same-acreage H2, next LiDAR i2, then
 * the one-acre X3. Cells are listing fields only. The build fails if a slug
 * is missing or is no longer Segway Navimow.
 * i206 AWD, H220, and the larger X350 / X390 / X430 stay off this table.
 */
export const I110_SLUG = "segway-navimow-i110";

export const I110_PEER_SLUGS = [
  "segway-navimow-i105",
  "segway-navimow-i210-awd",
  "segway-navimow-h210",
  "segway-navimow-i215-lidar",
  "segway-navimow-x330",
] as const;

function requireSegwayNavimow(item: Listing, role: "subject" | "peer"): void {
  if (item.data.brand !== "Segway Navimow") {
    throw new Error(`i110 comparison ${role} ${item.data.slug} is not a Segway Navimow listing`);
  }
}

function requireText(source: string, phrase: string, label: string): void {
  if (!source.includes(phrase)) {
    throw new Error(`${label} expected ${JSON.stringify(phrase)}`);
  }
}

function priceOn(listing: Listing): string {
  if (listing.data.priceUsd === undefined) {
    throw new Error(`i110 comparison listing ${listing.data.slug} has no priceUsd`);
  }
  return `${formatPrice(listing.data.priceUsd)} (${formatChecked(listing.data.updated)})`;
}

/** Spec table for the i110 page. Values come from published listing fields. */
export function i110Comparison(listings: Listing[]): ListingComparison {
  const bySlug = new Map(listings.map((item) => [item.data.slug, item]));
  const subject = bySlug.get(I110_SLUG);
  if (!subject?.body) throw new Error("i110 comparison missing the subject listing body");
  const i105 = bySlug.get("segway-navimow-i105");
  const i210 = bySlug.get("segway-navimow-i210-awd");
  const h210 = bySlug.get("segway-navimow-h210");
  const i215 = bySlug.get("segway-navimow-i215-lidar");
  const x330 = bySlug.get("segway-navimow-x330");
  if (!i105 || !i210 || !h210 || !i215 || !x330?.body) {
    throw new Error("i110 comparison missing a published sibling listing");
  }

  if (subject.data.coverageAcres !== 0.25 || subject.data.slopePercent !== 30) {
    throw new Error("i110 comparison note expected coverage 0.25 and slope 30");
  }
  if (i105.data.coverageAcres !== 0.125 || i105.data.slopePercent !== 30) {
    throw new Error("i110 choosing copy expected i105 coverage 0.125 and slope 30");
  }
  if (i105.data.cuttingWidthIn !== 7.1 || i105.data.driveType !== "Front-wheel drive") {
    throw new Error("i110 choosing copy expected i105 7.1 in front-wheel drive");
  }
  if (i210.data.coverageAcres !== 0.25 || i210.data.slopePercent !== 45 || i210.data.driveType !== "AWD") {
    throw new Error("i110 choosing copy expected i210 AWD at 0.25 acre and 45%");
  }
  requireText(i210.data.priceNote, "sale against a $1,299.00 compare-at", "i110 choosing copy");
  if (h210.data.coverageAcres !== 0.25 || h210.data.navigation.join(",") !== "lidar,rtk,vision") {
    throw new Error("i110 choosing copy expected H210 at 0.25 acre with LiDAR, RTK, and vision");
  }
  if (i215.data.coverageAcres !== 0.37 || i215.data.navigation.join(",") !== "lidar,vision") {
    throw new Error("i110 choosing copy expected i215 LiDAR + vision at 0.37 acre");
  }
  requireText(i215.data.priceNote, "sale against a $1,599.00 compare-at", "i110 choosing copy");
  if (x330.data.coverageAcres !== 1 || x330.data.slopePercent !== 50 || x330.data.driveType !== "Rear-wheel drive") {
    throw new Error("i110 choosing copy expected X330 rear-wheel drive at 1 acre and 50%");
  }

  requireText(
    subject.body,
    `0.125-acre i-series cart at ${priceOn(i105)}, with the same front-wheel drive, 30% work-area slope, and 7.1-inch deck`,
    "i110 choosing copy",
  );
  requireText(
    subject.body,
    `all-wheel drive at ${priceOn(i210)} on sale with a 45% slope rating`,
    "i110 choosing copy",
  );
  requireText(subject.body, `${priceOn(h210)} with LiDAR, RTK, and vision`, "i110 choosing copy");
  requireText(subject.body, `0.37-acre LiDAR + vision cart at ${priceOn(i215)} on sale`, "i110 choosing copy");
  requireText(
    subject.body,
    `1-acre X3 at ${priceOn(x330)}, rear-wheel drive, with a 50% work-area slope`,
    "i110 choosing copy",
  );
  requireText(subject.body, "1.2× the recommended area (0.3 acre here, layout-dependent)", "i110 comparison note");
  requireText(subject.body, "30% (17°)", "i110 comparison note");
  requireText(subject.body, "10% (6°)", "i110 comparison note");
  requireText(subject.body, "three blades", "i110 comparison note");
  requireText(subject.body, "58 dB(A)", "i110 comparison note");
  if (subject.body.includes("sound pressure") || subject.body.includes("sound power")) {
    throw new Error("i110 comparison note expected this listing not to split sound power and sound pressure");
  }
  if (subject.body.includes("charging station")) {
    throw new Error("i110 comparison note expected no charging-station ingress claim on this listing");
  }

  requireText(x330.body, "Recommended mowing area: **1 acre**", "i110 comparison note");
  if (x330.body.includes("1.2×")) {
    throw new Error("i110 comparison note expected the X330 listing not to state a 1.2× maximum");
  }
  requireText(x330.body, "inside the working area: 50%", "i110 comparison note");
  requireText(x330.body, "at the boundary: 25%", "i110 comparison note");
  requireText(x330.body, "6 blades", "i110 comparison note");
  requireText(x330.body, "60 dB(A)** sound power and **52 dB(A)** sound pressure", "i110 comparison note");
  requireText(x330.body, "**IP66** for the mower, charging station and power supply", "i110 comparison note");
  requireText(x330.body, "Not published for the X330", "i110 comparison note");
  requireText(x330.body, "Connect+ / 4G terms", "i110 comparison note");

  const coverage = formatAcres(subject.data.coverageAcres);
  return buildComparison(listings, I110_SLUG, I110_PEER_SLUGS, "i110", requireSegwayNavimow, {
    heading: "Compared with other Segway Navimow robot mowers",
    lead: "The i110 is listed here next to other published Segway Navimow listings, not every Navimow model in this directory:",
    caption: "Listing specs for the i110 and other published Segway Navimow mowers",
    note: `Coverage in this table is each listing’s coverage figure. For the i110, that figure is the recommended mowing area (${coverage}). The same listing also records a mapping footnote of up to 1.2× the recommended area (0.3 acre here, layout-dependent). The X330 listing does not state a higher maximum. Max slope in this table is each listing’s slope percent. On this listing that figure is the work-area slope, 30% (17°), and the boundary slope is 10% (6°). The X330 listing records 50% inside the working area and 25% at the boundary. The i110 listing records three blades; the X330 listing records 6 blades. The X330 noise figure in this table is the 60 dB(A) sound-power figure on that listing; the same listing also records 52 dB(A) sound pressure. The i110 listing states 58 dB(A) and does not split those. The X330 listing also records IP66 for the charging station and power supply; the i110 listing does not. The X330 listing does not publish Connect+ / 4G terms.`,
  });
}
