import type { CollectionEntry } from "astro:content";
import { formatNav, listingPhotoSrc, withBase } from "./site";

type Listing = CollectionEntry<"listings">;

export function productJsonLd(listing: Listing, origin: URL | string) {
  const d = listing.data;
  const pageUrl = new URL(withBase(`mowers/${d.slug}`), origin).href;
  const image = new URL(listingPhotoSrc(d.slug, d.image), origin).href;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: d.title,
    description: d.verdict,
    image,
    brand: { "@type": "Brand", name: d.brand },
    model: d.model,
    url: pageUrl,
    category: formatNav(d.navigation),
  };

  if (d.priceUsd !== undefined) {
    data.offers = {
      "@type": "Offer",
      price: d.priceUsd,
      priceCurrency: "USD",
      url: d.officialUrl,
      availability: "https://schema.org/InStock",
    };
  }

  return data;
}

export function breadcrumbJsonLd(listing: Listing, origin: URL | string) {
  const d = listing.data;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Catalogue",
        item: new URL(withBase(), origin).href,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: d.title,
        item: new URL(withBase(`mowers/${d.slug}`), origin).href,
      },
    ],
  };
}
