/**
 * Buyer-first related listings for listing pages.
 * Prefer the opposite boundary type when the current listing’s hard limit is
 * buried wire vs wire-free; then closest coverageAcres. Never random, never ratings.
 */

export interface RelatedSource {
  slug: string;
  title: string;
  brand: string;
  wireFree: boolean;
  coverageAcres: number;
  verdict: string;
  whoItsFor: string;
  image?: string;
}

export interface RelatedPick<T extends RelatedSource = RelatedSource> {
  listing: T;
  reason: string;
}

const RELATED_LIMIT = 3;

/** Honest one-liner from the *other* listing’s own copy. */
export function relatedReason(
  current: Pick<RelatedSource, "wireFree">,
  related: Pick<RelatedSource, "wireFree" | "verdict" | "whoItsFor">,
): string {
  if (!current.wireFree && related.wireFree) {
    return `If you will not bury wire — ${related.whoItsFor}`;
  }
  if (current.wireFree !== related.wireFree) {
    return related.whoItsFor;
  }
  return related.verdict;
}

export function pickRelatedListings<T extends RelatedSource>(
  current: T,
  all: T[],
  limit = RELATED_LIMIT,
): RelatedPick<T>[] {
  const others = all.filter((item) => item.slug !== current.slug);

  others.sort((a, b) => {
    // Wire vs wire-free is the install hard limit on a boundary-wire listing.
    if (!current.wireFree) {
      const aOpposite = a.wireFree !== current.wireFree ? 0 : 1;
      const bOpposite = b.wireFree !== current.wireFree ? 0 : 1;
      if (aOpposite !== bOpposite) return aOpposite - bOpposite;
    }
    const coverageDelta =
      Math.abs(a.coverageAcres - current.coverageAcres) -
      Math.abs(b.coverageAcres - current.coverageAcres);
    if (coverageDelta !== 0) return coverageDelta;
    return a.slug.localeCompare(b.slug);
  });

  return others.slice(0, Math.min(limit, others.length)).map((listing) => ({
    listing,
    reason: relatedReason(current, listing),
  }));
}
