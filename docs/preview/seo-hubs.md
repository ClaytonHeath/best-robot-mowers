# SEO hub preview notes

Preview-only routes (do not merge until Clayton reviews). GitHub Pages deploys from `main`.

## Local preview

```bash
npm run build && npm run preview
```

Then open:

- http://localhost:4321/best-robotic-lawn-mowers-2026/
- http://localhost:4321/best-robot-mower-for-hills/
- http://localhost:4321/best-robot-mower-for-1-acre/

Canonical URLs (www, trailing slash) once on `main`:

- https://www.bestlawnrobots.com/best-robotic-lawn-mowers-2026/
- https://www.bestlawnrobots.com/best-robot-mower-for-hills/
- https://www.bestlawnrobots.com/best-robot-mower-for-1-acre/

## Copy drop-in

Hub copy is `src/content/hubs/*.md` (title/description/slug/updated + Markdown body). Publisher-brief HTML comments are stripped. Relative draft links were rewritten to live hub paths. Listing cards stay `ListingCard` stills from `/mowers/{slug}.webp` — no new photos.

Schema is CollectionPage + ItemList + breadcrumbs only. No FAQPage, AggregateRating, or Review.
