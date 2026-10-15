import type { CollectionEntry } from "astro:content";
import {
  ACRE_COVERAGE_MIN,
  ACRE_NEAR_MISS_MIN,
  HILL_SLOPE_MIN_PERCENT,
  YARD_FIT_SECTIONS,
  listingsForAcreNearMiss,
  listingsForAcrePlus,
  listingsForHills,
  sortByBrandModel,
} from "./hubs";
import { COVERAGE_BANDS, coverageBand, formatPrice, type FaqItem } from "./site";

type Listing = CollectionEntry<"listings">;

export interface YardPriceRow {
  heading: string;
  coverage: string;
  note: string;
  count: number;
  price: string;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function priceLabel(priceUsd: number | undefined): string {
  return priceUsd === undefined ? "price not stated" : formatPrice(priceUsd);
}

function withPrice(listing: Listing): string {
  return `${listing.data.title} at ${priceLabel(listing.data.priceUsd)}`;
}

/** Hub prose uses "0.75 acre" under 1 acre and "6 acres" above it. */
function coverageLabel(acres: number): string {
  const rounded = Number.isInteger(acres) ? acres.toFixed(0) : acres.toString();
  return `${rounded} acre${acres > 1 ? "s" : ""}`;
}

function countNoun(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function proseNote(note: string): string {
  const stripped = note.replace(/\.$/, "");
  return stripped.charAt(0).toLowerCase() + stripped.slice(1);
}

function priceRange(prices: number[], missing: number): string {
  if (prices.length === 0) return "Price not stated";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = min === max ? formatPrice(min) : `${formatPrice(min)}–${formatPrice(max)}`;
  if (missing === 0) return range;
  const label = missing === 1 ? "listing with price not stated" : "listings with price not stated";
  return `${range} (${missing} ${label})`;
}

/** Yard-fit rows for the price table. Bands with no published listings are omitted. */
export function yardPriceRows(listings: Listing[]): YardPriceRow[] {
  return COVERAGE_BANDS.flatMap((band) => {
    const section = YARD_FIT_SECTIONS[band.id];
    const inBand = listings.filter((listing) => coverageBand(listing.data.coverageAcres) === band.id);
    if (inBand.length === 0) return [];
    const prices = inBand.flatMap((listing) => (listing.data.priceUsd === undefined ? [] : [listing.data.priceUsd]));
    return [
      {
        heading: section.heading,
        coverage: band.label,
        note: proseNote(section.note),
        count: inBand.length,
        price: priceRange(prices, inBand.length - prices.length),
      },
    ];
  });
}

export function statedPriceSummary(listings: Listing[]): string {
  const priced = listings.filter((listing) => listing.data.priceUsd !== undefined);
  if (priced.length === 0) return "No published listing states a US price.";
  const min = Math.min(...priced.map((listing) => listing.data.priceUsd!));
  const max = Math.max(...priced.map((listing) => listing.data.priceUsd!));
  const lows = priced.filter((listing) => listing.data.priceUsd === min).sort(sortByBrandModel);
  const highs = priced.filter((listing) => listing.data.priceUsd === max).sort(sortByBrandModel);
  const missing = listings.length - priced.length;
  const missingSentence =
    missing === 0
      ? `All ${countNoun(listings.length, "published listing states", "published listings state")} a price.`
      : `${countNoun(missing, "listing does", "listings do")} not state a price (${joinList(
          listings
            .filter((listing) => listing.data.priceUsd === undefined)
            .sort(sortByBrandModel)
            .map((listing) => listing.data.title),
        )}).`;
  const lowNames = joinList(lows.map((listing) => listing.data.title));
  if (min === max) {
    return `The stated US price is ${formatPrice(min)} (${lowNames}). ${missingSentence}`;
  }
  const highNames = joinList(highs.map((listing) => listing.data.title));
  return `Stated US prices run from ${formatPrice(min)} (${lowNames}) to ${formatPrice(max)} (${highNames}). ${missingSentence}`;
}

function bandClause(row: YardPriceRow): string {
  const where = `${row.heading.toLowerCase()} (${row.note}, ${countNoun(row.count, "listing")})`;
  if (row.price === "Price not stated") {
    return `${where} ${row.count === 1 ? "does" : "do"} not state a price`;
  }
  return `${where} ${row.count === 1 ? "is" : "run"} ${row.price}`;
}

function namesAtCoverage(listings: Listing[], acres: number): string {
  return joinList(
    listings
      .filter((listing) => listing.data.coverageAcres === acres)
      .sort(sortByBrandModel)
      .map(withPrice),
  );
}

function spanSentence(group: Listing[], lowLabel: string, highLabel: string): string {
  const min = Math.min(...group.map((listing) => listing.data.coverageAcres));
  const max = Math.max(...group.map((listing) => listing.data.coverageAcres));
  if (min === max) return `That figure is ${coverageLabel(min)} (${namesAtCoverage(group, min)}).`;
  return `${lowLabel} is ${coverageLabel(min)} (${namesAtCoverage(group, min)}). ${highLabel} is ${coverageLabel(max)} (${namesAtCoverage(group, max)}).`;
}

function costAnswer(listings: Listing[]): string {
  if (listings.length === 0) return statedPriceSummary(listings);
  const rows = yardPriceRows(listings);
  const bands = rows.length ? ` By yard fit, ${rows.map(bandClause).join("; ")}.` : "";
  const missing = listings.some((listing) => listing.data.priceUsd === undefined);
  const stamp = missing
    ? "The stamp on each card shows the same price when the listing has one."
    : "The stamp on each card shows that same price.";
  return `${statedPriceSummary(listings)}${bands} Each figure is the price recorded on that listing. The price note on the listing page says what the number is. ${stamp}`;
}

function wireAnswer(listings: Listing[]): string {
  const wired = listings.filter((listing) => !listing.data.wireFree).sort(sortByBrandModel);
  const free = listings.length - wired.length;
  const freeSentence = `${countNoun(free, "published listing is", "published listings are")} wire-free.`;
  const wiredSentence =
    wired.length === 0
      ? "None of the published listings require a boundary wire."
      : `${countNoun(wired.length, "listing requires", "listings require")} a boundary wire: ${joinList(wired.map(withPrice))}.`;
  return `Wire-free on this site means the machine is sold to hold a work area with RTK, vision, LiDAR, or a mix, not a buried perimeter loop. You still place a charging station. ${freeSentence} ${wiredSentence} A simple open rectangle can still be a better match for boundary wire than a wire-free kit that needs clear sky or camera sight lines.`;
}

function acreAnswer(listings: Listing[]): string {
  const plus = listingsForAcrePlus(listings);
  const near = listingsForAcreNearMiss(listings);
  const plusSentence =
    plus.length === 0
      ? `No published listing has recommended coverage of at least ${coverageLabel(ACRE_COVERAGE_MIN)}.`
      : `${countNoun(plus.length, "published listing has", "published listings have")} recommended coverage of at least ${coverageLabel(ACRE_COVERAGE_MIN)}. ${spanSentence(plus, "The lowest of those figures", "The highest")}`;
  const band = `from ${coverageLabel(ACRE_NEAR_MISS_MIN)} up to, but not including, ${coverageLabel(ACRE_COVERAGE_MIN)}`;
  const nearSentence =
    near.length === 0
      ? `No published listing is in the near-miss band ${band}.`
      : `${countNoun(near.length, "listing is a near-miss", "listings are near-misses")}, with recommended coverage ${band}. ${spanSentence(near, "The lowest near-miss", "The highest near-miss")}`;
  return `${plusSentence} ${nearSentence} Recommended coverage is the manufacturer figure on the listing. The Best robot mower for 1 acre page uses this same split.`;
}

function slopeAnswer(listings: Listing[]): string {
  const hills = listingsForHills(listings);
  let answer = `${countNoun(hills.length, "published listing meets", "published listings meet")} the hills rule: the drive type includes AWD, or the published work-area slope is at least ${HILL_SLOPE_MIN_PERCENT}%.`;
  const withSlope = listings.filter((listing) => listing.data.slopePercent !== undefined);
  if (withSlope.length === 0) {
    answer += " No published listing states a slope percent.";
  } else {
    const max = Math.max(...withSlope.map((listing) => listing.data.slopePercent!));
    const atMax = withSlope.filter((listing) => listing.data.slopePercent === max).sort(sortByBrandModel);
    answer += ` The highest published slope is ${max}% (${joinList(atMax.map(withPrice))}).`;
  }
  answer +=
    " Slope on a listing is the maximum the manufacturer publishes inside the work area, unless that listing also states a lower boundary figure. Wet grass, drop-offs, and driveways are not that number.";
  const below = hills
    .filter((listing) => listing.data.slopePercent === undefined || listing.data.slopePercent < HILL_SLOPE_MIN_PERCENT)
    .sort(sortByBrandModel);
  if (below.length > 0) {
    const bits = below.map((listing) => {
      const slope = listing.data.slopePercent === undefined ? "slope not stated" : `${listing.data.slopePercent}%`;
      return `${listing.data.title} (${slope}, ${priceLabel(listing.data.priceUsd)})`;
    });
    answer += ` Listings stay in that hills set below ${HILL_SLOPE_MIN_PERCENT}% when the drive type includes AWD: ${joinList(bits)}.`;
  }
  answer += " The Best robot mower for hills page uses this same rule.";
  return answer;
}

function directoryAnswer(listings: Listing[]): string {
  const rules = joinList(
    COVERAGE_BANDS.map((band) => {
      const section = YARD_FIT_SECTIONS[band.id];
      return `${section.heading} (${proseNote(section.note)})`;
    }),
  );
  const rows = yardPriceRows(listings);
  const now =
    rows.length === 0
      ? " Right now no band has a published listing."
      : ` Right now the page shows ${joinList(rows.map((row) => `${row.count} in ${row.heading}`))}.`;
  return `This page groups published listings by yard fit: ${rules}. A band is omitted when it has no published listings.${now} There is no #1 model and no score.`;
}

/** Visible FAQ copy for the 2026 hub. JSON-LD must use these same strings. */
export function faqsFor2026Hub(listings: Listing[]): FaqItem[] {
  return [
    {
      question: "How much do robotic lawn mowers cost?",
      answer: costAnswer(listings),
    },
    {
      question: "What is the difference between wire-free and boundary-wire mowers?",
      answer: wireAnswer(listings),
    },
    {
      question: "Which robot mowers suit about an acre?",
      answer: acreAnswer(listings),
    },
    {
      question: "Which robot mowers handle steep slopes?",
      answer: slopeAnswer(listings),
    },
    {
      question: "How is this directory organized?",
      answer: directoryAnswer(listings),
    },
  ];
}
