# Best Robot Lawn Mowers

A curated public directory of robot lawn mowers — wire-free LiDAR / RTK / vision models and boundary-wire machines. **A Justamanstanding project.**

The site is a static Astro app. There is no CMS, auth, or backend. The homepage is a filterable index of published listings. Each listing is one Markdown file that becomes one SEO page, with an official manufacturer product photo when the brand publishes one.

Live site: **https://bestlawnrobots.com**. GitHub Pages is the public host; Railway is leftover.

## Run locally

Requires Node 22+.

```bash
npm install
npm run dev
```

Open the URL Astro prints (usually `http://localhost:4321/`).

```bash
npm run build    # writes a static site to dist/
npm run preview  # Astro preview of dist/
npm start        # serve dist/ (Railway start command)
```

`astro.config.ts`:

- `site`: `https://bestlawnrobots.com`
- `base`: `/`

## Deploy

Production publishes from `main` via GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`). Custom domain: **www.bestlawnrobots.com** (apex `bestlawnrobots.com` redirects to www).

`railway.toml` is leftover so Railway does not break during DNS cutover. It still:

1. `npm run build` → `dist/`
2. `npm start` → serve `dist/` on `$PORT`

If you prefer Railpack’s built-in static file server instead of `serve`, set the service variable `RAILPACK_STATIC_FILE_ROOT=dist` (and `RAILPACK_NODE_VERSION=22`).

PR CI (`.github/workflows/build.yml`) still runs `npm run build` on every pull request.

## Publisher contract: add a listing

Create **one Markdown file** in `src/content/listings/`. Filename should match the slug, e.g. `segway-navimow-x390.md`.

Only `status: published` listings appear on the homepage and get a public page. Drafts are validated at build time but not routed.

Official product pages are the source of truth. **If a spec is not on the official page, omit the field rather than guess.** Leave `affiliateUrl` empty (`""`) unless there is a real affiliate URL.

Save an official product photo into `public/mowers/{slug}.webp` (see `public/mowers/SOURCES.txt`) and set `image` in frontmatter. Do not generate fake photos of real products. If the manufacturer page has no usable still, omit `image` — the card uses a stamped missing-photo plate.

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
| `image` | string, **optional** | Path under `public/`, e.g. `/mowers/{slug}.webp`. |
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
src/lib/site.ts                # branding, formatting, paths
public/mowers/                 # official product stills
.github/workflows/deploy.yml   # GitHub Pages production deploy
railway.toml                   # leftover Railway static deploy (DNS cutover)
```

Homepage filters are static: they run in a small client script against `data-*` attributes and URL search params (`?wire=free&coverage=under-0.5&nav=lidar`). No backend.

## Seed listings

Published listings, specs checked against official pages on 26 Aug 2026:

- [Segway Navimow X390](https://navimow.com/products/segway-navimow-x390)
- [Mammotion LUBA 3 AWD 1500](https://us.mammotion.com/products/luba-3-awd-robot-lawn-mower)
- [Worx Landroid Vision Cloud WR310.1](https://www.worx.com/landroid-vision-cloud.html)
- [ECOVACS GOAT A3000 LiDAR PRO](https://www.ecovacs.com/us/shop/goat-robotic-lawn-mower/goat-a3000-lidar-pro)
