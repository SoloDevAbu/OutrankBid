# OutrankBid SEO Implementation Plan

**For: coding agent implementation. Every item is a required change unless marked (optional).**

---

## 0. Priority order (do not reorder)

1. Indexable route architecture (startup pages + category pages) — without this, nothing else matters.
2. Sponsored link compliance (`rel="sponsored nofollow"`) — non-negotiable, avoids penalty risk.
3. Metadata + structured data per route.
4. Sitemap/robots wired to real DB data.
5. Core Web Vitals hardening given the polling/optimistic-UI pattern.
6. Content additions to `/how-it-works` for topical authority.

---

## 1. New indexable routes (the core fix)

### 1.1 `/startup/[slug]` — individual startup pages

Currently a visitor's only path to a startup is an outbound click from the homepage. That means:

- Zero long-tail keyword capture ("is [startup] worth it", "[startup] alternative", "[startup] review")
- Zero pages for Google to actually rank beyond the homepage
- No place to accumulate internal links pointing at a specific startup

**Action:** Add `app/startup/[slug]/page.tsx`. Add a `slug` column to `startups` in `db/schema.ts` if not present (unique, indexed).

Page contents (data-driven, no manual copy needed since it's rendered from existing DB fields):

- Startup name, logo, description, category, current rank, current bid amount (transparency helps trust — and gives you fresh, unique on-page content per page)
- Historical rank/bid trend if you want a differentiator (optional, but great for return visits + dwell time signal)
- A clearly labeled outbound CTA button → external site (see §2 for link attributes)
- Breadcrumb: Home → Category → Startup

```tsx
// app/startup/[slug]/page.tsx
export async function generateStaticParams() {
  const startups = await getAllStartupSlugs();
  return startups.map((s) => ({ slug: s.slug }));
}
export const revalidate = 300; // 5 min — ranks/bids change, but don't need per-request SSR

export async function generateMetadata({ params }): Promise<Metadata> {
  const startup = await getStartupBySlug(params.slug);
  if (!startup) return {};
  return {
    title: `${startup.name} — Ranked #${startup.rank} in ${startup.category}`,
    description: `${startup.name}: ${startup.shortDescription}. Currently ranked #${startup.rank} in ${startup.category} on OutrankBid.`,
    alternates: { canonical: `https://outrankbid.com/startup/${startup.slug}` },
    openGraph: {
      title: `${startup.name} on OutrankBid`,
      description: startup.shortDescription,
      images: [{ url: startup.logoUrl, width: 1200, height: 630 }],
      type: "website",
    },
  };
}
```

### 1.2 `/category/[category]` — server-rendered category pages

Right now filtering happens via `fetch('/api/leaderboard?category=...')` from a client component. That's invisible to crawlers — a filtered view of your leaderboard (e.g. "Best AI dev tools ranked") currently cannot rank for that query at all.

**Action:** Add `app/category/[category]/page.tsx` as a real server-rendered route. Keep your existing client-side polling _inside_ this page for live updates, but the initial HTML response must contain the server-rendered, category-filtered list.

```tsx
// app/category/[category]/page.tsx
export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((c) => ({ category: c.slug }));
}
export const revalidate = 60;

export async function generateMetadata({ params }): Promise<Metadata> {
  const category = await getCategoryMeta(params.category);
  return {
    title: `Top ${category.label} Startups — Live Leaderboard | OutrankBid`,
    description: `See which ${category.label} startups are trending right now, ranked by community bids on OutrankBid.`,
    alternates: { canonical: `https://outrankbid.com/category/${params.category}` },
  };
}

export default async function CategoryPage({ params }) {
  const startups = await getLeaderboard({ category: params.category }); // server fetch, not client
  return <LeaderboardView initialData={startups} category={params.category} />;
  // LeaderboardView can still be a client component that polls for live updates —
  // it just needs to receive server-fetched initialData as first paint, not fetch on mount.
}
```

Update the homepage's category filter `<button>`s (§4.2 of your UI spec) to actually navigate via `next/link` to `/category/[slug]` instead of only mutating client state. This is the single highest-leverage change in this whole plan — it turns 1 page into N indexable pages with almost no new UI.

### 1.3 Homepage stays lean, links out to both

No new visible UI copy needed on the homepage itself, per your constraint — the leaderboard rows already link to `/startup/[slug]` (instead of, or in addition to, the direct outbound click), and category filter pills become real links.

---

## 2. Sponsored link compliance — do not skip this

This is a paid-ranking product. Every outbound link from a startup row to the startup's actual site is a paid placement per Google's Link Spam guidelines. Undisclosed paid links that pass PageRank are treated as a link scheme and can trigger a manual action against the whole domain.

**Action — apply to every outbound link to a startup's external URL, everywhere it appears (homepage row, mini-leaderboard, `/startup/[slug]` page):**

```tsx
<a
  href={startup.externalUrl}
  target="_blank"
  rel="sponsored nofollow noopener noreferrer"
>
  {startup.name}
</a>
```

- `sponsored` — tells Google this is a paid placement (required, this is literally what the attribute exists for).
- `nofollow` — belt-and-suspenders, include both per Google's own guidance for paid links.
- `noopener noreferrer` — standard security practice for `target="_blank"`.

This costs you nothing SEO-wise on your own domain (internal links to `/startup/[slug]` and `/category/[x]` should NOT have this — only the actual external outbound link gets it), and it's the difference between a compliant marketplace and a link scheme in Google's eyes.

(Optional but recommended: add a small "Sponsored" or "Paid Placement" label near the bid amount. Transparency here is a trust signal, and paid-ranking transparency is increasingly something both users and Google's helpful-content systems reward rather than penalize.)

---

## 3. Metadata — per route

Root layout:

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://outrankbid.com"),
  title: { default: "OutrankBid — Live Startup Leaderboard", template: "%s | OutrankBid" },
  description: "Discover trending startups ranked by real-time community bids. See who's rising, filter by category, and find your next favorite tool.",
  openGraph: { siteName: "OutrankBid", type: "website" },
  twitter: { card: "summary_large_image" },
};
```

Homepage (`app/page.tsx`) — since it's dynamic/live, still give it a strong static shell description:

```tsx
export const metadata: Metadata = {
  title: "OutrankBid — Live Startup Leaderboard",
  description: "The real-time leaderboard where startups compete for visibility. Filter by category, see live bid rankings, and discover what's trending now.",
  alternates: { canonical: "https://outrankbid.com" },
};
```

`/pricing`:

```tsx
export const metadata: Metadata = {
  title: "Pricing — Bid for Leaderboard Placement",
  description: "View OutrankBid's bidding packages and subscription tiers. Choose a plan to place your startup at the top of the leaderboard.",
  alternates: { canonical: "https://outrankbid.com/pricing" },
};
```

`/how-it-works` (new/expanded — see §6):

```tsx
export const metadata: Metadata = {
  title: "How OutrankBid Works — Bidding, Ranking & Fulfillment Explained",
  description: "Learn how startup bids translate into leaderboard rank, how payments are processed via Dodo Payments, and how rankings update in real time.",
  alternates: { canonical: "https://outrankbid.com/how-it-works" },
};
```

Do not add `generateMetadata` to `/checkout` or `/customer-portal` beyond a basic `noindex` (§5) — these are transactional, not content pages.

---

## 4. Structured data (JSON-LD)

### 4.1 Homepage — `ItemList` for the leaderboard

Because the leaderboard is literally a ranked list, `ItemList` is the correct schema and is a documented path to rich results for ranking/list content.

```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: topStartups.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `https://outrankbid.com/startup/${s.slug}`,
    name: s.name,
  })),
};
```

### 4.2 `/startup/[slug]` — `SoftwareApplication` or `Organization`

Use `SoftwareApplication` if the startups are dev tools/software (matches your target audience); fall back to `Organization` for general startups.

```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: startup.name,
  applicationCategory: startup.category,
  url: startup.externalUrl,
  image: startup.logoUrl,
  description: startup.shortDescription,
};
```

### 4.3 `/pricing` — `Product` + `Offer` per plan

```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: plan.name,
  offers: {
    "@type": "Offer",
    price: plan.price,
    priceCurrency: "USD",
    url: "https://outrankbid.com/pricing",
  },
};
```

### 4.4 `/how-it-works` — `FAQPage`

Only if the page contains actual Q&A content (see §6 — it should). `FAQPage` rich results are one of the highest-CTR SERP features available and cost nothing beyond correctly marked-up copy you're already planning to write.

### 4.5 Root layout — `Organization`

```tsx
{
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OutrankBid",
  url: "https://outrankbid.com",
  logo: "https://outrankbid.com/logo.png",
}
```

Validate every template with Google's Rich Results Test before shipping — schema errors silently disqualify the page from rich results with no warning in Search Console for weeks.

---

## 5. sitemap.ts / robots.ts — wired to the real database

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const startups = await db.query.startups.findMany({ columns: { slug: true, updatedAt: true } });
  const categories = await getAllCategories();

  return [
    { url: "https://outrankbid.com", changeFrequency: "always", priority: 1 },
    { url: "https://outrankbid.com/pricing", changeFrequency: "monthly", priority: 0.6 },
    { url: "https://outrankbid.com/how-it-works", changeFrequency: "monthly", priority: 0.6 },
    ...categories.map((c) => ({
      url: `https://outrankbid.com/category/${c.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    ...startups.map((s) => ({
      url: `https://outrankbid.com/startup/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
```

```ts
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/checkout", "/customer-portal"] },
    ],
    sitemap: "https://outrankbid.com/sitemap.xml",
  };
}
```

Add explicit `noindex` to `/checkout` and `/customer-portal` route metadata as well (belt-and-suspenders — robots.txt disallow prevents crawling, but noindex is what prevents indexing if a URL somehow gets discovered/linked externally):

```tsx
export const metadata: Metadata = { robots: { index: false, follow: false } };
```

---

## 6. `/how-it-works` — content plan for topical authority

You mentioned you might rework this page — this is where you build the keyword/topical relevance that a pure-leaderboard homepage can't carry on its own. Structure it as real FAQ content (feeds §4.4 schema directly):

Suggested H2/FAQ sections:

- "How does startup ranking work on OutrankBid?" — explain bid → rank mechanism
- "What happens when I place a bid?" — payment → webhook → fulfillment, in plain language
- "How often does the leaderboard update?" — sets expectation, also a natural place to mention real-time/live nature (good for "real-time startup ranking" type queries)
- "Is placement paid or organic?" — directly addresses the sponsored-link transparency point from §2; good for trust and for the FAQPage schema
- "How do I track my clicks and ROI?" — ties to your `click_events` analytics, useful for the startup-owner search intent ("startup leaderboard ROI", "paid startup advertising")

This page should internally link to `/pricing`, `/category/[popular-category]`, and 2-3 example `/startup/[slug]` pages once they exist — this is the internal-linking backbone that makes the whole site look like a coherent topic cluster rather than one isolated leaderboard.

---

## 7. Core Web Vitals — specific to this UI's patterns

Your spec already leans on: 30s polling, optimistic UI on click, skeleton loaders, avatars, badges, hover scale animations. That's exactly the pattern that silently ships too much client JS if you're not careful.

- **Isolate the polling logic.** The component that polls `/api/leaderboard` every 30s and does optimistic click updates should be the _smallest possible_ client component — wrap just the list/rows, not the whole page including header/stats-pill/filters. Every unnecessary `"use client"` boundary ships JS the crawler and the user's INP score don't need.
- **Avatars/logos via `next/image`**, always, with explicit `width`/`height` to prevent the rank-reordering animation (`group-hover:scale-105`, row re-sorting) from causing CLS on load.
- **`priority` on the top-3 mini-leaderboard avatars** (above the fold, LCP candidates) — not on rows further down the list.
- **Skeleton loaders must match final layout dimensions exactly** — a skeleton that's a different height than the loaded row is a self-inflicted CLS hit.
- **Font loading** via `next/font` for whatever typeface backs the aggressive `uppercase tracking-widest text-[8px]` styling — self-hosted, no render-blocking Google Fonts request.
- **The "LIVE NOW" pulsing dot and refresh spinner** — pure CSS animation, not JS-driven — keeps them off the INP budget entirely.

---

## 8. Verification checklist before shipping

1. `curl` or view-source each of `/`, `/category/[x]`, `/startup/[x]` — confirm the leaderboard rows/startup data are in the raw HTML, not only present after client hydration.
2. Confirm every outbound startup link has `rel="sponsored nofollow noopener noreferrer"` — grep the rendered HTML for `target="_blank"` and check each has the full `rel` string.
3. Run Rich Results Test on: homepage (ItemList), one `/startup/[slug]` page, `/pricing`, `/how-it-works`.
4. Confirm `/sitemap.xml` includes real startup/category URLs pulled from the DB, not a hardcoded stub.
5. Confirm `/checkout` and `/customer-portal` return `noindex` and are blocked in `robots.txt`.
6. Lighthouse pass on homepage AND on a `/startup/[slug]` page — the leaderboard's polling/animation pattern is exactly where INP/CLS regressions hide.
7. Submit sitemap in Google Search Console; watch the Coverage report over the following weeks specifically for the new `/startup/` and `/category/` URLs to confirm they're being indexed, not excluded.
