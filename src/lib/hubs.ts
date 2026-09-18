import type { CollectionEntry } from "astro:content";
import { COVERAGE_BANDS, coverageBand, type CoverageBandId } from "./site";

export type HubListing = CollectionEntry<"listings">;

/**
 * Card-grid cutoff for the hills hub: AWD, or published work-area slope at/above this percent.
 * Editorial copy still explains lower % (30–50) as weaker hillside matches.
 */
export const HILL_SLOPE_MIN_PERCENT = 70;

/** Manufacturer-published coverage at or above this acreage is a primary 1-acre+ fit. */
export const ACRE_COVERAGE_MIN = 1;

/** Near-miss band from the 1-acre research brief (recommended coverage under 1.0). */
export const ACRE_NEAR_MISS_MIN = 0.75;

export const YARD_FIT_SECTIONS: Record<
  CoverageBandId,
  { heading: string; id: string; note: string }
> = {
  "under-0.5": {
    heading: "Small yards",
    id: "small-yards",
    note: "Published coverage under 0.5 acre.",
  },
  "0.5-1.5": {
    heading: "Mid-size yards",
    id: "mid-size-yards",
    note: "Published coverage 0.5–1.5 acres.",
  },
  "over-1.5": {
    heading: "Larger yards",
    id: "larger-yards",
    note: "Published coverage over 1.5 acres.",
  },
};

export function sortByBrandModel(a: HubListing, b: HubListing): number {
  return a.data.brand.localeCompare(b.data.brand) || a.data.model.localeCompare(b.data.model);
}

export function groupPublishedByYardFit(listings: HubListing[]) {
  return COVERAGE_BANDS.map((band) => {
    const section = YARD_FIT_SECTIONS[band.id];
    return {
      band,
      ...section,
      listings: listings
        .filter((listing) => coverageBand(listing.data.coverageAcres) === band.id)
        .sort(sortByBrandModel),
    };
  }).filter((group) => group.listings.length > 0);
}

export function isAwdDrive(driveType: string | undefined): boolean {
  return Boolean(driveType && /awd/i.test(driveType));
}

export function listingsForHills(listings: HubListing[]) {
  return listings
    .filter(
      (listing) =>
        isAwdDrive(listing.data.driveType) ||
        (listing.data.slopePercent !== undefined && listing.data.slopePercent >= HILL_SLOPE_MIN_PERCENT),
    )
    .sort((a, b) => {
      const slope = (b.data.slopePercent ?? 0) - (a.data.slopePercent ?? 0);
      if (slope !== 0) return slope;
      return sortByBrandModel(a, b);
    });
}

export function listingsForAcrePlus(listings: HubListing[]) {
  return listings
    .filter((listing) => listing.data.coverageAcres >= ACRE_COVERAGE_MIN)
    .sort((a, b) => {
      const coverage = a.data.coverageAcres - b.data.coverageAcres;
      if (coverage !== 0) return coverage;
      return sortByBrandModel(a, b);
    });
}

export function listingsForAcreNearMiss(listings: HubListing[]) {
  return listings
    .filter(
      (listing) =>
        listing.data.coverageAcres >= ACRE_NEAR_MISS_MIN && listing.data.coverageAcres < ACRE_COVERAGE_MIN,
    )
    .sort((a, b) => {
      const coverage = b.data.coverageAcres - a.data.coverageAcres;
      if (coverage !== 0) return coverage;
      return sortByBrandModel(a, b);
    });
}
