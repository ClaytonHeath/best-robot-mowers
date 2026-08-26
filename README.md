# Best Robot Lawn Mowers

A curated public directory of robot lawn mowers — wire-free LiDAR / RTK / vision models and boundary-wire machines. Run by **Clayton Moulynox**.

The site is a static Astro app. There is no CMS, auth, or backend. The homepage is a filterable index of published listings. Each listing is one Markdown file that becomes one SEO page.

## Run locally

Requires Node 22+.

```bash
npm install
npm run dev
```

Open the URL Astro prints (usually `http://localhost:4321/best-robot-mowers/`). The `/best-robot-mowers` prefix is the GitHub Pages base path.

```bash
npm run build    # writes a static site to dist/
npm run preview  # serves dist/
```

`astro.config.ts` uses a placeholder site URL:

- `site`: `https://claytonheath.github.io`
- `base`: `/best-robot-mowers`

Change those when a custom domain is attached. GitHub Pages deploy is `.github/workflows/deploy.yml` (enable Pages → GitHub Actions in the repo settings).

## Publisher contract: add a listing

Create **one Markdown file** in `src/content/listings/`. Filename should match the slug, e.g. `segway-navimow-x390.md`.

Only `status: published` listings appear on the homepage and get a public page. Drafts are validated at build time but not routed.

Official product pages are the source of truth. **If a spec is not on the official page, omit the field rather than guess.** Leave `affiliateUrl` empty (`""`) unless there is a real affiliate URL.

### Frontmatter schema (required unless marked optional)

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Page heading, usually `Brand Model`. |
| `brand` | string | e.g. `Segway Navimow`. |
| `slug` | string | Lowercase kebab-case. Used as `/mowers/{slug}/`. |
| `model` | string | SKU / model name. |
| `status` | `published` \| `draft` | Drafts do not ship as pages. |
| `priceUsd` | number, **optional** | USD number only. Omit if unknown. |
| `priceNote` | string | Always explain the price (MSRP, cart, date). Use `""` only if there is truly nothing to say. |
| `coverageAcres` | number | Manufacturer recommended area, in acres. |
| `slopePercent` | number, **optional** | Max slope **inside** the work area, percent. |
| `navigation` | enum or array | `lidar` \| `rtk` \| `vision` \| `boundary-wire` \| `hybrid`. Use an array when mixed, e.g. `[rtk, vision]`. |
| `wireFree` | boolean | `true` if no perimeter wire is required for a normal install. |
| `whoItsFor` | string | Short, specific. Not a slogan. |
| `verdict` | string | Honest one-liner, including the catch. |
| `affiliateUrl` | string, **optional** | Full URL or `""`. |
| `officialUrl` | string | Required. Official product URL. |
| `image` | string, **optional** | Path or URL. Omit if none. |
| `updated` | date | `YYYY-MM-DD`. Date specs were checked. |

Optional extras (all omitted unless the official page states them): `cuttingWidthIn` (number, inches), `cuttingHeight` (string), `noiseDb` (number), `weightLbs` (number), `ipRating` (string), `driveType` (string).

### Markdown body (write these four sections)

1. **What it is**
2. **Who it's for**
3. **Standout details** (specs and real differentiators)
4. **Honest verdict** (including caveats)

Link the official source in the body. Rebuild (`npm run build`) must stay green — Zod will fail the build on invalid frontmatter.

### Minimal example

```yaml
---
title: Example Brand Model X
brand: Example
slug: example-brand-model-x
model: Model X
status: draft
priceUsd: 1999
priceNote: MSRP on the official US page on 26 Aug 2026.
coverageAcres: 0.5
slopePercent: 30
navigation:
  - vision
  - rtk
wireFree: true
whoItsFor: Flat suburban lawns up to half an acre that want a vision mower and no buried wire.
verdict: Fine for a simple half-acre; skip it if the yard is steep or heavily treed.
affiliateUrl: ""
officialUrl: https://example.com/products/model-x
updated: 2026-08-26
---

## What it is

## Who it's for

## Standout details

## Honest verdict
```

## Project structure

```
src/content.config.ts          # Zod schema (source of truth)
src/content/listings/*.md      # one file per mower
src/pages/index.astro          # filterable directory
src/pages/mowers/[slug].astro  # listing pages
src/pages/about.astro          # methodology
src/lib/site.ts                # formatting helpers and base-path links
```

Homepage filters are static: they run in a small client script against `data-*` attributes and URL search params (`?wire=free&coverage=under-0.5&nav=lidar`). No backend.

## Seed listings

Published on first ship, specs checked against official pages on 26 Aug 2026:

- [Segway Navimow X390](https://navimow.com/products/segway-navimow-x390)
- [Mammotion LUBA 3 AWD 1500](https://us.mammotion.com/products/luba-3-awd-robot-lawn-mower)
- [Worx Landroid Vision Cloud WR310.1](https://www.worx.com/landroid-vision-cloud.html)
