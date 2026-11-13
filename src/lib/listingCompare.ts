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

function columnCells(listing: Listing): string[] {
  const data = listing.data;
  if (data.priceUsd === undefined) {
    throw new Error(`M5 LiDAR comparison listing ${data.slug} has no priceUsd`);
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

/** Spec table for the M5 LiDAR page. Values come from published listing fields. */
export function m5LidarComparison(listings: Listing[]): ListingComparison {
  const bySlug = new Map(listings.map((item) => [item.data.slug, item]));
  const subject = bySlug.get(M5_LIDAR_SLUG);
  if (!subject) throw new Error("M5 LiDAR comparison missing the subject listing");
  if (!subject.data.navigation.includes("lidar")) {
    throw new Error("M5 LiDAR comparison subject is not a LiDAR listing");
  }

  const peers = M5_LIDAR_PEER_SLUGS.map((slug) => {
    const item = bySlug.get(slug);
    if (!item) throw new Error(`M5 LiDAR comparison missing published listing ${slug}`);
    if (!item.data.navigation.includes("lidar")) {
      throw new Error(`M5 LiDAR comparison peer ${slug} is not a LiDAR listing`);
    }
    return item;
  });

  const columns = [subject, ...peers];
  const cells = columns.map(columnCells);
  return {
    peers: peers.map((item) => ({
      title: item.data.title,
      href: listingPath(item.data.slug),
    })),
    columns: columns.map((item, index) => ({
      title: item.data.title,
      href: index === 0 ? undefined : listingPath(item.data.slug),
    })),
    rows: ROW_LABELS.map((label, row) => ({
      label,
      cells: cells.map((column) => column[row] ?? NOT_LISTED),
    })),
  };
}
