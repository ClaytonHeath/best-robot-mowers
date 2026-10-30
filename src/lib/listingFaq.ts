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

function mustInclude(source: string, phrase: string, where: string, label = "Yarbo FAQ"): void {
  if (!source.includes(phrase)) {
    throw new Error(`${label} expected ${JSON.stringify(phrase)} in ${where}`);
  }
}

/** Stock wording from the price note only. Historical body text is not a current claim. */
function stockSentence(note: string): string {
  if (note.includes("InStock") || /\bin stock\b/i.test(note)) return " The offer was in stock.";
  if (/\b(sold out|out of stock)\b/i.test(note)) return " The offer was out of stock.";
  return "";
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
  mustInclude(note, "no compare-at", "priceNote");
  mustInclude(note, "$5,499.00", "priceNote");
  mustInclude(note, "sale has ended", "priceNote");
  mustInclude(note, "YAR-Y40-LM", "priceNote");
  mustInclude(note, "$7,199", "priceNote");
  mustInclude(note, "All-Season Pro", "priceNote");
  mustInclude(note, "8 Sep 2026", "priceNote");
  mustInclude(note, checked, "priceNote");

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
      answer: `The official US cart price recorded here is ${price} on ${checked} for SKU YAR-Y40-LM, the Yarbo Core plus Lawn Mower Pro module. There is no compare-at. It was $5,499.00 against a $5,999.00 compare-at on 8 Sep 2026, so that sale has ended.${stockSentence(note)} This SKU is not the $7,199 All-Season Pro 4-in-1 (Lawn Mower Pro + Snow Blower + Blower).`,
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

function i110Faqs(listing: Listing): FaqItem[] {
  const data = listing.data;
  const body = listing.body;
  if (!body) throw new Error("i110 listing body is missing; FAQ cannot be checked against it.");
  const note = data.priceNote;
  const label = "i110 FAQ";
  if (data.priceUsd !== 1099) throw new Error(`${label} expected priceUsd 1099`);
  if (data.coverageAcres !== 0.25) throw new Error(`${label} expected coverageAcres 0.25`);
  if (data.slopePercent !== 30) throw new Error(`${label} expected slopePercent 30`);
  if (data.cuttingWidthIn !== 7.1) throw new Error(`${label} expected cuttingWidthIn 7.1`);
  if (data.cuttingHeight !== "2–3.6 in, manual") throw new Error(`${label} expected cuttingHeight`);
  if (!data.wireFree) throw new Error(`${label} expected wireFree`);
  if (data.driveType !== "Front-wheel drive") throw new Error(`${label} expected front-wheel drive`);

  const checked = formatChecked(data.updated);
  mustInclude(note, "$1,099.00", "priceNote", label);
  mustInclude(note, "no compare-at", "priceNote", label);
  mustInclude(note, "SOLD OUT", "priceNote", label);
  mustInclude(note, "AA.12.02.03.0003", "priceNote", label);
  mustInclude(note, checked, "priceNote", label);

  mustInclude(body, "1.2× the recommended area (0.3 acre here, layout-dependent)", "body", label);
  mustInclude(body, "30% (17°)", "body", label);
  mustInclude(body, "10% (6°)", "body", label);
  mustInclude(body, "work-area slopes over 30%", "body", label);
  mustInclude(body, "EFLS 2.0 (Network RTK plus Visual SLAM)", "body", label);
  mustInclude(body, "140° VisionFence", "body", label);
  mustInclude(body, "A local antenna remains part of the install story when Network RTK is not available.", "body", label);
  mustInclude(body, "4G connectivity and anti-theft/GPS tracking require a separate Navimow Access+ 4G module.", "body", label);
  mustInclude(body, "three blades", "body", label);
  mustInclude(body, "5.1 Ah", "body", label);
  mustInclude(body, "about 120 minutes to charge", "body", label);
  mustInclude(body, "about 120 minutes of mowing", "body", label);
  mustInclude(body, "manual height 2–3.6 in", "body", label);
  mustInclude(body, data.driveType.toLowerCase(), "body", label);

  const price = formatPrice(data.priceUsd);
  const coverage = formatAcres(data.coverageAcres);
  const nav = formatNav(data.navigation);

  return [
    {
      question: "How much does the Segway Navimow i110 cost?",
      answer: `The official US store price recorded here is ${price} on ${checked} for SKU AA.12.02.03.0003, Navimow i110 | 0.25 acre. There is no compare-at.${stockSentence(note)}`,
    },
    {
      question: "How large a lawn is the Segway Navimow i110 rated for?",
      answer: `The coverage figure is ${coverage}. That number is the recommended mowing area. The same listing also records a mapping footnote of up to 1.2× the recommended area (0.3 acre here, layout-dependent).`,
    },
    {
      question: "Can the Segway Navimow i110 handle steep hills?",
      answer: `Work-area slope is ${data.slopePercent}% (17°). Boundary slope is 10% (6°). Drive is ${data.driveType.toLowerCase()}. The listing says it is a weaker match for work-area slopes over 30%.`,
    },
    {
      question: "Does the Segway Navimow i110 need a boundary wire?",
      answer: `No. It is wire-free. Navigation is ${nav}. This listing records EFLS 2.0 (Network RTK plus Visual SLAM) and a 140° VisionFence camera. A local antenna remains part of the install story when Network RTK is not available. 4G connectivity and anti-theft/GPS tracking require a separate Navimow Access+ 4G module.`,
    },
    {
      question: "What cutting width and height does the Segway Navimow i110 have?",
      answer: `Cutting width is ${data.cuttingWidthIn} in. Cutting height is ${data.cuttingHeight}. The cutting system is three blades. The battery is 5.1 Ah, with about 120 minutes of mowing and about 120 minutes to charge.`,
    },
  ];
}

/** Visible FAQ copy for a listing page. JSON-LD must use these same strings. */
export function faqsForListing(listing: Listing): FaqItem[] {
  if (listing.data.slug === "yarbo-lawn-mower-pro") return yarboFaqs(listing);
  if (listing.data.slug === "segway-navimow-i110") return i110Faqs(listing);
  return [];
}
