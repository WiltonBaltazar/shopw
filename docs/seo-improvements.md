# SEO Improvements — Cheesemania

## Overview

This document describes all planned SEO changes for the Cheesemania storefront. The site is a client-side React SPA (Laravel + TanStack Router). None of these changes affect the admin panel or API.

---

## 1. Per-page `<title>` and `<meta description>` — `react-helmet-async`

**Problem:** Every page shares the same title (`Cheesemania`) and description from `app.blade.php`. Google sees one page.

**Package:** `react-helmet-async`

**Files changed:**
- `package.json` — add dependency
- `resources/js/app.tsx` — wrap app in `<HelmetProvider>`
- `resources/js/routes/_public.index.tsx` — add `<Helmet>` with homepage title/description
- `resources/js/routes/_public.menu.tsx` — add `<Helmet>` with menu title/description
- `resources/js/routes/_public.produto.$slug.tsx` — add `<Helmet>` with product name, description, canonical URL

**Titles:**
| Page | Title | Description |
|---|---|---|
| Homepage | `Cheesemania — Cheesecakes Homemade em Maputo` | `Cheesecakes Homemade feitos com amor em Maputo, Moçambique. Encomende online e receba na sua porta. Opções sem lactose e fitness disponíveis.` |
| Menu | `Menu de Cheesecakes — Cheesemania Maputo` | `Explore o nosso menu de cheesecakes Homemade em Maputo. Sem lactose, fitness e sabores clássicos. Entrega ao domicílio em Maputo e Matola.` |
| Product | `{product.name} — Cheesemania Maputo` | `{product.name} Homemade feito em Maputo. {product.description?.slice(0,120)}` |
| Checkout | `Finalizar Encomenda — Cheesemania` | *(noindex — no crawl value)* |
| Order confirmation | `Encomenda #{reference} — Cheesemania` | *(noindex — no crawl value)* |

---

## 2. `robots.txt`

**Problem:** No guidance for crawlers. Admin and API routes are publicly accessible to bots.

**File created:** `public/robots.txt`

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout
Disallow: /encomenda/

Sitemap: https://cheesemania.co.mz/sitemap.xml
```

---

## 3. Dynamic XML Sitemap

**Problem:** Google must discover product pages by crawling links. New products may never be indexed.

**File changed:** `routes/web.php` — new `GET /sitemap.xml` route

**Includes:**
- `/` — priority 1.0
- `/menu` — priority 0.9
- `/produto/{slug}` for each active product — priority 0.8, lastmod from `updated_at`

**Not included:** `/checkout`, `/encomenda/*`, `/admin/*`

---

## 4. LocalBusiness JSON-LD (static)

**Problem:** Google can't surface rich business info (address, phone, category) in search results.

**File changed:** `resources/views/app.blade.php` — add `<script type="application/ld+json">` in `<head>`

```json
{
  "@context": "https://schema.org",
  "@type": "Bakery",
  "name": "Cheesemania",
  "description": "Cheesecakes Homemade em Maputo, Moçambique",
  "url": "https://cheesemania.co.mz",
  "telephone": "+258840000000",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Maputo",
    "addressCountry": "MZ"
  },
  "servesCuisine": "Cheesecakes",
  "priceRange": "$$",
  "sameAs": ["https://instagram.com/cheesemaniaa"]
}
```

> Note: `telephone` and `url` should be pulled from the `settings` table once the admin configures them, or hardcoded initially.

---

## 5. Product JSON-LD (per product page)

**Problem:** No product rich results possible in Google Search.

**File changed:** `resources/js/routes/_public.produto.$slug.tsx`

**Schema type:** `Product` with `AggregateOffer`

**Fields:**
- `name` — product name
- `description` — product description
- `image` — primary image URL
- `brand` — `{ "@type": "Brand", "name": "Cheesemania" }`
- `offers.lowPrice` — `price_range.min / 100`
- `offers.highPrice` — `price_range.max / 100`
- `offers.priceCurrency` — `"MZN"`
- `offers.availability` — `"https://schema.org/InStock"`

Injected via `react-helmet-async` `<Helmet>` once product data is loaded. No schema rendered during loading state.

---

## 6. Open Graph tags

**Problem:** WhatsApp and Instagram shares show no preview image or description. This directly impacts order volume since customers share product links.

**Files changed:**
- `resources/views/app.blade.php` — default/fallback OG tags
- `resources/js/routes/_public.produto.$slug.tsx` — per-product OG override
- `resources/js/routes/_public.menu.tsx` — menu OG
- `resources/js/routes/_public.index.tsx` — homepage OG

**Default tags in blade (fallback for all pages):**
```html
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Cheesemania" />
<meta property="og:locale" content="pt_MZ" />
<meta property="og:title" content="Cheesemania — Cheesecakes Homemade em Maputo" />
<meta property="og:description" content="Cheesecakes Homemade feitos com amor em Maputo, Moçambique." />
<meta property="og:image" content="https://cheesemania.co.mz/og-default.jpg" />
```

**Per-product override (via Helmet):**
- `og:title` — `{product.name} — Cheesemania`
- `og:description` — product description
- `og:image` — `product.primary_image.url`
- `og:url` — canonical product URL
- `og:type` — `product`

> `og-default.jpg` — a 1200×630px brand image needs to be created and placed in `public/`.

---

## 7. `<noscript>` fallback

**Problem:** If Google's crawler hits the page before JavaScript renders, it sees an empty `<div id="root">`.

**File changed:** `resources/views/app.blade.php`

**Change:** Add a `<noscript>` tag with basic business description and link inside `<body>`.

---

## 8. Noindex on transactional pages

**Problem:** Checkout and order confirmation pages have no value in search results and waste crawl budget.

**File changed:**
- `resources/js/routes/_public.checkout.tsx`
- `resources/js/routes/_public.encomenda.$reference.tsx`

**Change:** Add `<Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>` to both pages.

---

## Files Summary

| File | Change type |
|---|---|
| `package.json` | Add `react-helmet-async` |
| `resources/js/app.tsx` | Wrap in `HelmetProvider` |
| `resources/views/app.blade.php` | Add LocalBusiness JSON-LD, default OG tags, noscript |
| `resources/js/routes/_public.index.tsx` | Add `Helmet` (title, desc, OG) |
| `resources/js/routes/_public.menu.tsx` | Add `Helmet` (title, desc, OG) |
| `resources/js/routes/_public.produto.$slug.tsx` | Add `Helmet` (title, desc, canonical, OG, Product JSON-LD) |
| `resources/js/routes/_public.checkout.tsx` | Add `Helmet` (noindex) |
| `resources/js/routes/_public.encomenda.$reference.tsx` | Add `Helmet` (noindex) |
| `public/robots.txt` | New file |
| `routes/web.php` | Add `/sitemap.xml` route |

---

## Out of Scope

- **SSR / prerendering** — significant architectural change, deferred
- **Image alt text audit** — depends on data quality in DB, admin-side concern
- **Google Search Console submission** — manual step after deploy
- **`og-default.jpg`** — brand asset, needs to be created separately
