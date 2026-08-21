# CLAUDE.md — OutrankBid

## Current goal

Implementing the SEO plan (`outrankbid-seo-plan.md`). Priority order:

1. `/startup/[slug]` and `/category/[category]` server-rendered routes (currently only the homepage is indexable — category filtering is client-only API polling)
2. `rel="sponsored nofollow noopener noreferrer"` on every outbound startup link — non-negotiable, this is a paid-ranking product
3. Metadata + JSON-LD per route
4. `sitemap.ts`/`robots.ts` wired to real DB data (no hardcoded stubs)
5. Core Web Vitals pass on polling/leaderboard components

Do not touch homepage visual UI/copy — it's intentionally minimal. New SEO surface area goes into new routes and metadata, not new homepage text.

## Next.js conventions

- Server-render anything that needs to be indexed. No content-critical data fetched only in `useEffect` — check view-source, not just DevTools, before calling a route done.
- `"use client"` on the smallest component possible (e.g. just the polling leaderboard rows), never a whole page. Every boundary ships JS.
- Every image via `next/image` with explicit `width`/`height`. `priority` only on above-the-fold/LCP candidates (top-3 mini-leaderboard).
- Fonts via `next/font`, not a Google Fonts `<link>`.
- Every route needs `alternates.canonical` in its metadata, even if self-referencing.
- `metadataBase` is set in root layout — don't let OG images resolve as relative URLs.
- Internal links via `next/link`. External startup links via plain `<a>` with the sponsored/nofollow rel.
- Skeleton loaders must match final row dimensions exactly — mismatches cause CLS.

## Data model reminders

- `currentBid` on `startups` is derived from the `bids` ledger — never write to it directly outside the webhook fulfillment path.
- `payments` links 1:1 to a `bid`; status transitions happen only via the verified Dodo webhook (`/api/webhook/dodo-payments`), never client-side.
- New `slug` column on `startups` must be unique + indexed before `/startup/[slug]` ships.

## Before marking any SEO task done

- View raw HTML response (not hydrated DOM) and confirm content is actually there.
- Run Rich Results Test on any page with new JSON-LD.
- Confirm no regression in Lighthouse CLS/INP on the homepage leaderboard.
