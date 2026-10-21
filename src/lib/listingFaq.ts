import type { CollectionEntry } from "astro:content";
import { coverageBand, formatAcres, formatNav, formatPrice, type FaqItem } from "./site";

type Listing = CollectionEntry<"listings">;

/**
 * Published listings in the larger-yards band (coverage over 1.5 acres)
 * besides the Lawn Mower Pro. The comparison table on that page copies
 * these listings; the build fails if the set changes.
 */
export const LARGER_YARD_COMPARISON_SLUGS = [
  "segway-navimow-x390",
  "husqvarna-automower-440-iq",
  "lymow-one-plus-10a",
] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatChecked(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function mustInclude(source: string, phrase: string, where: string): void {
  if (!source.includes(phrase)) {
    throw new Error(`Yarbo FAQ expected ${JSON.stringify(phrase)} in ${where}`);
  }
}

function listingBody(listing: Listing): string {
  const body = listing.body;
  if (!body) throw new Error("Yarbo listing body is missing; FAQ cannot be checked against it.");
  return body;
}

/**
 * Fail the build when a new published listing enters the larger-yards band,
 * so the hardcoded comparison on the Yarbo page cannot go stale.
 */
export function assertLargerYardPeers(listings: Listing[]): void {
  const peers = listings
    .filter(
      (item) => item.data.slug !== "yarbo-lawn-mower-pro" && coverageBand(item.data.coverageAcres) === "over-1.5",
    )
    .map((item) => item.data.slug)
    .sort();
  const expected = [...LARGER_YARD_COMPARISON_SLUGS].sort();
  if (peers.join("|") !== expected.join("|")) {
    throw new Error(
      `Yarbo larger-yard comparison is out of date. Published over-1.5 listings: ${peers.join(", ") || "(none)"}.`,
    );
  }
}

function yarboFaqs(listing: Listing): FaqItem[] {
  const data = listing.data;
  const body = listingBody(listing);
  const note = data.priceNote;
  if (data.priceUsd === undefined) throw new Error("Yarbo FAQ missing priceUsd");
  if (data.slopePercent === undefined) throw new Error("Yarbo FAQ missing slopePercent");
  if (data.cuttingWidthIn === undefined) throw new Error("Yarbo FAQ missing cuttingWidthIn");
  if (!data.cuttingHeight) throw new Error("Yarbo FAQ missing cuttingHeight");
  if (!data.wireFree) throw new Error("Yarbo FAQ expected wireFree");
  if (data.driveType !== "Dual drive motors") throw new Error("Yarbo FAQ expected dual drive motors");

  const checked = formatChecked(data.updated);
  mustInclude(note, "$5,999.00", "priceNote");
  mustInclude(note, "InStock", "priceNote");
  mustInclude(note, "YAR-Y40-LM", "priceNote");
  mustInclude(note, "$7,199", "priceNote");
  mustInclude(note, "All-Season Pro", "priceNote");
  mustInclude(note, "8 Sep 2026", "priceNote");
  if (checked !== "8 Sep 2026") throw new Error(`Yarbo FAQ price date is ${checked}, not the price-note date`);

  mustInclude(body, "Max Mowing Size of 6 acres (25,000 m²)", "body");
  mustInclude(body, "1.7 acres (6,880 m²)", "body");
  mustInclude(body, "120 min", "body");
  mustInclude(body, "70% (35°)", "body");
  mustInclude(body, "2 in (50 mm)", "body");
  mustInclude(body, "PPVS / RTK + multi-sensor", "body");
  mustInclude(body, "binocular cameras", "body");
  mustInclude(body, "Data Center", "body");
  mustInclude(body, "NetRTK", "body");
  mustInclude(body, "docking station", "body");
  mustInclude(body, `${data.cuttingWidthIn} in (500 mm)`, "body");
  mustInclude(body, "app/auto height from", "body");
  mustInclude(body, data.cuttingHeight, "body");
  mustInclude(body, "Dual Straight-Blade", "body");
  mustInclude(body, "2×300W", "body");
  mustInclude(data.verdict, "tracked-core", "verdict");

  const price = formatPrice(data.priceUsd);
  const coverage = formatAcres(data.coverageAcres);
  const nav = formatNav(data.navigation);

  return [
    {
      question: "How much does the Yarbo Lawn Mower Pro cost?",
      answer: `The official US cart price recorded here is ${price} on ${checked} for SKU YAR-Y40-LM, the Yarbo Core plus Lawn Mower Pro module. The same product page showed a $5,999 compare-at, and the offer was in stock. This SKU is not the $7,199 All-Season Pro 4-in-1 (Lawn Mower Pro + Snow Blower + Blower).`,
    },
    {
      question: "How large a lawn is the Yarbo Lawn Mower Pro rated for?",
      answer: `The coverage figure is ${coverage}. That number is Yarbo’s Max Mowing Size of 6 acres (25,000 m²). The same listing also records a mowing area per day of 1.7 acres (6,880 m²) and a mowing time per charge of 120 min.`,
    },
    {
      question: "Can the Yarbo Lawn Mower Pro handle steep hills?",
      answer: `Max climbing ability is ${data.slopePercent}% (35°). Vertical obstacle clearance is 2 in (50 mm). Drive is ${data.driveType.toLowerCase()} on a modular tracked-core. A separate boundary-slope figure is not stated.`,
    },
    {
      question: "Does the Yarbo Lawn Mower Pro need a boundary wire?",
      answer: `No. It is wire-free. Navigation is ${nav}. This listing records the product-page description as PPVS / RTK + multi-sensor, with binocular cameras, ultrasonic sensors, and a bumper. The bundle includes a Data Center for local RTK, and NetRTK is noted where coverage exists. The docking station is included.`,
    },
    {
      question: "What cutting width and height does the Yarbo Lawn Mower Pro have?",
      answer: `Cutting width is ${data.cuttingWidthIn} in (500 mm). Cutting height is app/auto from ${data.cuttingHeight}. The cutting system is dual straight blades with two 300W cutting motors.`,
    },
  ];
}

/** Visible FAQ copy for a listing page. JSON-LD must use these same strings. */
export function faqsForListing(listing: Listing): FaqItem[] {
  if (listing.data.slug === "yarbo-lawn-mower-pro") return yarboFaqs(listing);
  return [];
}
