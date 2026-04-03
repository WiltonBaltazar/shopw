# Cheesemania — Mobile-First Shopping Experience Design Specification

> **Goal:** Improve the buyer shopping experience for mobile-dominant users in Maputo, Mozambique.
> **Context:** Artisanal cheesecake e-commerce · React + Tailwind CSS 4 · Poppins font · Primary purple `#685D94`

---

## 1. Layout Grid System

### Base Grid (Mobile — 0–767px)
| Property       | Value                    |
|---------------|--------------------------|
| Columns       | 4                        |
| Gutter        | 16px (`gap-4`)           |
| Margin        | 16px (`px-4`)            |
| Max width     | 100vw                    |
| Content width | `100vw - 32px`           |

### Tablet (768–1023px — `md:`)
| Property       | Value                    |
|---------------|--------------------------|
| Columns       | 8                        |
| Gutter        | 20px (`gap-5`)           |
| Margin        | 24px (`px-6`)            |
| Max width     | 768px                    |

### Desktop (1024px+ — `lg:`)
| Property       | Value                    |
|---------------|--------------------------|
| Columns       | 12                       |
| Gutter        | 24px (`gap-6`)           |
| Margin        | auto (centered)          |
| Max width     | 1152px (`max-w-6xl`)     |

### Tailwind Implementation
```
Mobile:   grid grid-cols-4 gap-4 px-4
Tablet:   md:grid-cols-8 md:gap-5 md:px-6
Desktop:  lg:grid-cols-12 lg:gap-6 max-w-6xl mx-auto
```

### Product Grid Columns
| Screen      | Columns | Card min-width |
|------------|---------|----------------|
| Mobile     | 2       | ~155px         |
| Tablet     | 3       | ~220px         |
| Desktop    | 4       | ~260px         |

---

## 2. Visual Hierarchy — Per Screen

### 2.1 Home Page (Mobile)

**Current problem:** Hero takes up the full viewport; products are below the fold.

**Redesigned priority order:**
```
┌────────────────────────┐
│  Navbar (fixed, 56px)  │  ← Persistent, always accessible
├────────────────────────┤
│  Compact Hero          │  ← Reduced: py-14 (from py-24)
│  "More Cheese,         │     Tagline: text-3xl (from text-4xl)
│   More Joy"            │     CTA button visible without scroll
│  [Ver o Menu]          │
├────────────────────────┤
│  🔥 Featured Products  │  ← Moved higher; 2-col grid
│  ┌──────┬──────┐       │     Card shows price + tap affordance
│  │  🍰  │  🍰  │       │
│  ├──────┼──────┤       │     NEW: Visible "Ver" button on mobile
│  │  🍰  │  🍰  │       │     (replaces hover-only overlay)
│  └──────┴──────┘       │
├────────────────────────┤
│  How it Works (horiz)  │  ← Horizontal scroll instead of stack
│  [01] → [02] → [03]   │
├────────────────────────┤
│  Sticky Cart Bar       │  ← Bottom-fixed, always visible
└────────────────────────┘
```

### 2.2 Menu / Catalog Page (Mobile)

**Current problem:** Category filters wrap to multiple rows. No search.

**Redesigned priority order:**
```
┌────────────────────────┐
│  Navbar                │
├────────────────────────┤
│  "Menu" + subtitle     │  ← Compact header
├────────────────────────┤
│  🔍 Search bar         │  ← NEW: Sticky search below navbar
├────────────────────────┤
│  [All][Cat1][Cat2]►    │  ← Horizontal scroll strip (overflow-x-auto)
│                        │     no wrapping; scrollbar hidden
├────────────────────────┤
│  Product Grid (2-col)  │  ← Cards with visible CTA on mobile
│  ┌──────┬──────┐       │
│  │      │      │       │
│  ├──────┼──────┤       │
│  │      │      │       │     Pull-to-refresh optional
│  └──────┴──────┘       │
├────────────────────────┤
│  Sticky Cart Bar       │
└────────────────────────┘
```

### 2.3 Product Detail Page (Mobile)

**Current problem:** Long scrolling page; Add to Cart scrolls off-screen; no swipe on images.

**Redesigned priority order:**
```
┌────────────────────────┐
│  Navbar                │
├────────────────────────┤
│  ← Menu (back button)  │
├────────────────────────┤
│  Image Carousel        │  ← Full-width, swipeable
│  ┌────────────────┐    │     Touch swipe with dot indicators
│  │                │    │     aspect-[4/5] for better mobile ratio
│  │   (swipe ←→)   │    │     Thumbnails become dots on mobile
│  └────────────────┘    │
│  ● ○ ○ ○               │
├────────────────────────┤
│  Category · Badges     │
│  Product Name          │  ← text-2xl (compact from text-3xl)
│  Price                 │  ← text-xl, bold, primary color
│  Description           │  ← Collapsible after 3 lines on mobile
├────────────────────────┤
│  ⏰ 24h advance notice │
├────────────────────────┤
│  Attribute Selectors   │  ← Pill buttons, full-width rows
│  Flavour Pickers       │  ← Grid of pills, not flex-wrap
│  Addons                │  ← Larger checkboxes (w-5 h-5)
├────────────────────────┤
│  ░░░░░░░░░░░░░░░░░░░░  │  ← Spacer for sticky bar
├────────────────────────┤
│  ┌────────────────────┐│  ← NEW: Sticky bottom bar
│  │ [−] 1 [+]  [Add ▶]││     Fixed to bottom on mobile
│  │         899 MT     ││     Shows price + quantity + CTA
│  └────────────────────┘│
└────────────────────────┘
```

### 2.4 Checkout Page (Mobile)

**Current problem:** Order summary is below the form; buyers can't see their cart.

**Redesigned priority order:**
```
┌────────────────────────┐
│  Navbar                │
├────────────────────────┤
│  "Finalizar Encomenda" │
├────────────────────────┤
│  Collapsible Summary   │  ← NEW: Accordion at top on mobile
│  ┌────────────────────┐│     Shows "2 itens · 1,798 MT ▼"
│  │ 🍰 Cheesecake ×1   ││     Tap to expand/collapse
│  │ 🍰 Oreo ×1         ││     Sticky when expanded
│  │ Total: 1,798 MT    ││
│  └────────────────────┘│
├────────────────────────┤
│  Customer Info         │  ← Full-width inputs, 48px height
│  [Nome completo      ] │
│  [Telefone (MPesa)   ] │     type="tel" with inputmode
├────────────────────────┤
│  Delivery Toggle       │  ← Full-width toggle buttons
│  [🚚 Entrega | 🏪 Lev]│
├────────────────────────┤
│  Region Selector       │  ← Only if delivery selected
│  Address Field         │
├────────────────────────┤
│  Date & Time           │  ← Stacked on mobile (1 col)
│  [📅 Data de entrega ] │     Native date picker
│  [🕐 Horário         ] │     Scrollable time chips instead of <select>
├────────────────────────┤
│  Notes                 │
├────────────────────────┤
│  ┌────────────────────┐│  ← Sticky bottom CTA
│  │ Total: 1,998 MT    ││     Shows running total + delivery fee
│  │ [Confirmar e Pagar]││
│  └────────────────────┘│
└────────────────────────┘
```

---

## 3. Typography Scale

**Font family:** Poppins (already configured as both `--font-serif` and `--font-sans`)

| Role                | Mobile           | Desktop           | Weight  | Line Height | Tailwind                          |
|---------------------|------------------|-------------------|---------|-------------|-----------------------------------|
| Hero heading        | 30px / `text-3xl`| 48px / `text-5xl` | 700     | 1.1         | `text-3xl md:text-5xl font-bold`  |
| Page title          | 24px / `text-2xl`| 30px / `text-3xl` | 600     | 1.2         | `text-2xl md:text-3xl font-semibold` |
| Section heading     | 20px / `text-xl` | 24px / `text-2xl` | 600     | 1.3         | `text-xl md:text-2xl font-semibold` |
| Product name (card) | 15px / `text-[15px]` | 16px / `text-base` | 600 | 1.3      | `text-[15px] md:text-base font-semibold` |
| Product name (detail)| 24px / `text-2xl`| 30px / `text-3xl`| 600     | 1.2         | `text-2xl md:text-3xl font-semibold` |
| Price (detail)      | 20px / `text-xl` | 24px / `text-2xl` | 500     | 1.2         | `text-xl md:text-2xl font-medium` |
| Price (card)        | 14px / `text-sm` | 14px / `text-sm`  | 400     | 1.4         | `text-sm`                         |
| Body text           | 14px / `text-sm` | 14px / `text-sm`  | 400     | 1.6         | `text-sm leading-relaxed`         |
| Caption / label     | 12px / `text-xs` | 12px / `text-xs`  | 500     | 1.4         | `text-xs font-medium`             |
| Badge text          | 11px / `text-[11px]`| 11px           | 600     | 1.0         | `text-[11px] font-semibold`       |
| Button text         | 14px / `text-sm` | 14px / `text-sm`  | 500     | 1.0         | `text-sm font-medium`             |
| Input text          | 16px / `text-base`| 14px / `text-sm` | 400     | 1.4         | `text-base md:text-sm`            |

> **Important:** Mobile inputs use `text-base` (16px) to prevent iOS auto-zoom on focus.

### Heading hierarchy on mobile
```
h1  →  text-2xl  (24px)   Page titles, product names
h2  →  text-xl   (20px)   Section headings
h3  →  text-base (16px)   Sub-sections, card titles
```

---

## 4. Color System

### 4.1 Existing Primary Palette (Keep)
| Token           | Hex       | Usage                               |
|----------------|-----------|-------------------------------------|
| `primary-50`   | `#f3f2f8` | Subtle backgrounds, selected states |
| `primary-100`  | `#e6e4f1` | Borders on active elements          |
| `primary-200`  | `#cdc9e3` | Decorative step numbers             |
| `primary-300`  | `#b3aed5` | Disabled primary                    |
| `primary-400`  | `#9790be` | Focus rings                         |
| `primary-500`  | `#685D94` | **Primary CTA**, cart badge         |
| `primary-600`  | `#5a5082` | CTA hover                           |
| `primary-700`  | `#4c4370` | Text accent, link hover             |
| `primary-800`  | `#3d365a` | Dark text accent                    |

### 4.2 Extended Semantic Colors (New)
Add these to `@theme` in `app.css`:

```css
/* Semantic surface tokens */
--color-surface:         #ffffff;
--color-surface-muted:   #fafaf9;   /* stone-50 */
--color-surface-sunken:  #f5f5f4;   /* stone-100 */

/* Semantic text tokens */
--color-text-primary:    #1c1917;   /* stone-900 */
--color-text-secondary:  #78716c;   /* stone-500 */
--color-text-muted:      #a8a29e;   /* stone-400 */
--color-text-inverse:    #ffffff;

/* Semantic border tokens */
--color-border:          #e7e5e4;   /* stone-200 */
--color-border-muted:    #f5f5f4;   /* stone-100 */

/* Status colors */
--color-success:         #16a34a;   /* green-600 */
--color-success-light:   #f0fdf4;   /* green-50 */
--color-warning:         #d97706;   /* amber-600 */
--color-warning-light:   #fffbeb;   /* amber-50 */
--color-error:           #dc2626;   /* red-600 */
--color-error-light:     #fef2f2;   /* red-50 */
```

### 4.3 Contrast Ratios (WCAG AA)
| Combo                          | Ratio  | Pass? |
|-------------------------------|--------|-------|
| `primary-500` on white        | 4.8:1  | AA    |
| `primary-700` on white        | 7.2:1  | AAA   |
| White on `primary-500`        | 4.8:1  | AA    |
| `stone-500` on white          | 4.6:1  | AA    |
| `stone-400` on white          | 3.0:1  | Fail* |
| `stone-500` on `stone-50`     | 4.3:1  | AA    |

> *`stone-400` captions should only be used for supplementary text, never for actionable labels.

---

## 5. Spacing System

### Base Unit: 4px

| Token | Value | Tailwind | Usage                                      |
|-------|-------|----------|--------------------------------------------|
| `xs`  | 4px   | `1`      | Icon-to-text gap, badge padding            |
| `sm`  | 8px   | `2`      | Tight element gaps, inline spacing         |
| `md`  | 12px  | `3`      | Card internal padding (mobile)             |
| `base`| 16px  | `4`      | **Page margin**, component gaps, input padding |
| `lg`  | 20px  | `5`      | Card gaps in grid                          |
| `xl`  | 24px  | `6`      | Section internal padding                   |
| `2xl` | 32px  | `8`      | Section separator, form field groups       |
| `3xl` | 48px  | `12`     | Page vertical rhythm                       |
| `4xl` | 64px  | `16`     | Major section breaks                       |

### Touch Target Minimums
| Element                  | Min Size | Current  | Recommended      |
|--------------------------|----------|----------|------------------|
| Button / CTA             | 48px     | 44px     | `py-3.5 min-h-12`|
| Icon button (cart, menu) | 44px     | 40px     | `p-2.5` (44px)   |
| Quantity ± buttons       | 44px     | 40px     | `w-11 h-11`      |
| Filter pills             | 44px h   | ~36px    | `py-2.5 px-4`    |
| Thumbnail                | 56px     | 56px     | `w-16 h-16`(64px)|
| Checkbox hit area        | 44px     | 16px     | 44px label wrap  |

### Safe Areas (Mobile)
```
Bottom sticky bars:   pb-safe  (iOS home indicator: ~34px)
Navbar clearance:     pt-16    (64px fixed header)
Sticky cart clearance: pb-24   (96px at bottom for sticky CTA)
```

---

## 6. Responsive Behavior — Per Component

### 6.1 Navbar
| Behavior        | Mobile (< 768px)               | Desktop (768px+)             |
|----------------|--------------------------------|------------------------------|
| Height         | 56px (`h-14`)                  | 64px (`h-16`)                |
| Logo           | `text-lg`                      | `text-xl`                    |
| Nav links      | Hidden → hamburger menu        | Visible inline               |
| Cart icon      | Always visible                 | Always visible               |
| Mobile menu    | Full-width dropdown            | N/A                          |

### 6.2 ProductCard
| Behavior         | Mobile                          | Desktop                       |
|-----------------|--------------------------------|-------------------------------|
| Image ratio     | `aspect-square`                | `aspect-square`               |
| CTA overlay     | **Always visible** (small bar) | Hover reveal (current)        |
| Card text       | Name + price only              | Name + price                  |
| Image border    | `rounded-xl`                   | `rounded-2xl`                 |
| Tap feedback    | `active:scale-[0.98]`          | `hover:scale-105` on image    |

**Key change:** On mobile, replace the hover overlay with a persistent small "Ver" button or make the entire card clearly tappable with a subtle arrow/chevron indicator.

### 6.3 Product Detail — Image Gallery
| Behavior          | Mobile                          | Desktop                       |
|------------------|--------------------------------|-------------------------------|
| Layout           | Full-width carousel             | Side-by-side with info        |
| Aspect ratio     | `aspect-[4/5]`                 | `aspect-square`               |
| Navigation       | Swipe + dot indicators          | Click arrows + thumbnails     |
| Thumbnails       | Hidden (dots instead)           | Row below image               |

### 6.4 Product Detail — Options & CTA
| Behavior          | Mobile                          | Desktop                       |
|------------------|--------------------------------|-------------------------------|
| Options layout   | Full-width stacked              | Same (natural flow)           |
| Qty + Add to Cart| **Sticky bottom bar**           | Inline (current position)     |
| Sticky bar height| 72px + pb-safe                  | N/A                           |
| Price display    | Inside sticky bar               | Inline above selectors        |

### 6.5 Category Filters (Menu Page)
| Behavior          | Mobile                          | Desktop                       |
|------------------|--------------------------------|-------------------------------|
| Layout           | Horizontal scroll strip         | Flex wrap (current)           |
| Overflow         | `overflow-x-auto` + hidden bar | Visible wrap                  |
| Scroll hint      | Fade gradient on right edge     | N/A                           |
| Padding          | `scroll-pl-4`                  | N/A                           |

### 6.6 Checkout Form
| Behavior          | Mobile                          | Desktop                       |
|------------------|--------------------------------|-------------------------------|
| Layout           | Single column                   | 3/5 + 2/5 grid               |
| Order summary    | **Collapsible top accordion**   | Sticky sidebar                |
| Date + time      | Stacked (1 col each)            | Side by side (2 col)          |
| Submit button    | **Sticky bottom bar**           | Inline at form end            |
| Input height     | 48px (`py-3`)                   | 44px (`py-2.5`)               |
| Input font       | 16px (prevent zoom)             | 14px                          |

### 6.7 CartDrawer
| Behavior          | Mobile                          | Desktop                       |
|------------------|--------------------------------|-------------------------------|
| Width            | 100vw                           | `max-w-sm` (384px)            |
| Entry            | Slide from right                | Slide from right              |
| Close            | Swipe right to dismiss          | Click X or backdrop           |

### 6.8 StickyCartBar
| Behavior          | Mobile                          | Desktop                       |
|------------------|--------------------------------|-------------------------------|
| Visibility       | Always (when items > 0)         | Always (when items > 0)       |
| Width            | Full with 16px margin           | `max-w-lg` centered           |
| Safe area        | `pb-safe`                       | N/A                           |

---

## 7. Dark Mode Specification

### 7.1 Color Mapping

Add to `app.css` using Tailwind's `@media (prefers-color-scheme: dark)`:

| Light Token          | Light Value  | Dark Value   | Dark Token Name       |
|---------------------|-------------|-------------|----------------------|
| `surface`           | `#ffffff`   | `#1c1917`   | stone-900            |
| `surface-muted`     | `#fafaf9`   | `#292524`   | stone-800            |
| `surface-sunken`    | `#f5f5f4`   | `#1c1917`   | stone-900            |
| `text-primary`      | `#1c1917`   | `#fafaf9`   | stone-50             |
| `text-secondary`    | `#78716c`   | `#a8a29e`   | stone-400            |
| `text-muted`        | `#a8a29e`   | `#78716c`   | stone-500            |
| `border`            | `#e7e5e4`   | `#44403c`   | stone-700            |
| `border-muted`      | `#f5f5f4`   | `#292524`   | stone-800            |
| `primary-500`       | `#685D94`   | `#9790be`   | primary-400 (lifted) |
| `primary-50`        | `#f3f2f8`   | `#3d365a`   | primary-800 (inverted)|

### 7.2 Component-Level Dark Adaptations

| Component           | Light                        | Dark                          |
|---------------------|------------------------------|-------------------------------|
| Navbar bg           | `bg-white/95`                | `dark:bg-stone-900/95`        |
| Navbar border       | `border-stone-100`           | `dark:border-stone-800`       |
| Product card bg     | `bg-stone-100`               | `dark:bg-stone-800`           |
| Pill (unselected)   | `border-stone-200 text-stone-700` | `dark:border-stone-600 dark:text-stone-300` |
| Pill (selected)     | `bg-stone-900 text-white`    | `dark:bg-white dark:text-stone-900` |
| Input bg            | `bg-white border-stone-200`  | `dark:bg-stone-800 dark:border-stone-700` |
| Cart drawer         | `bg-white`                   | `dark:bg-stone-900`           |
| Sticky cart bar     | `bg-stone-900`               | `dark:bg-primary-600`         |
| Checkout summary    | `bg-stone-50`                | `dark:bg-stone-800`           |
| Badges (lactose)    | `bg-emerald-500`             | `dark:bg-emerald-600`         |
| Badges (fitness)    | `bg-violet-500`              | `dark:bg-violet-600`          |
| CTA button          | `bg-primary-500`             | `dark:bg-primary-400 dark:text-stone-900` |
| Body background     | `#ffffff`                    | `#1c1917`                     |
| Body text           | `#292524`                    | `#e7e5e4`                     |

### 7.3 Image Handling in Dark Mode
- Product images: No filter (photos should remain accurate)
- Placeholder bg: `dark:bg-stone-800`
- Image overlays: Increase opacity slightly (`bg-black/50` instead of `bg-black/40`)

### 7.4 Implementation Strategy
```css
/* app.css */
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
  }
  body {
    background-color: #1c1917;
    color: #e7e5e4;
  }
}
```
Use Tailwind's `dark:` variant throughout components. No JS toggle needed initially — respect system preference.

---

## 8. Specific Implementation Changes (Priority Order)

### P0 — Critical Mobile Fixes

#### 8.1 ProductCard: Mobile tap affordance
**File:** `resources/js/components/ui/ProductCard.tsx`
```
Change: Replace hover-only overlay with always-visible mobile CTA
- Mobile: Show a small persistent "Ver →" text or chevron below card
- Desktop: Keep existing hover overlay
- Add: active:scale-[0.98] transition for tap feedback
```

#### 8.2 Product Detail: Sticky Add-to-Cart bar
**File:** `resources/js/routes/_public.produto.$slug.tsx`
```
Change: On mobile, fix the quantity + add-to-cart section to bottom
- Wrap in a sticky bottom bar component (md:hidden)
- Include: quantity controls + price + Add to Cart button
- Add pb-safe and pb-24 spacer to main content
- Keep inline layout on desktop (hidden md:flex)
```

#### 8.3 Product Detail: Swipeable image carousel
**File:** `resources/js/routes/_public.produto.$slug.tsx`
```
Change: Add touch swipe support to image gallery
- Use CSS scroll-snap: overflow-x-auto snap-x snap-mandatory
- Each image: snap-center w-full flex-shrink-0
- Replace thumbnails with dot indicators on mobile
- Keep arrow buttons + thumbnails on desktop
```

#### 8.4 Checkout: Order summary accordion (mobile)
**File:** `resources/js/routes/_public.checkout.tsx`
```
Change: Move order summary to collapsible section at top on mobile
- Mobile: Accordion showing "N itens · Total MT ▼" — tap to expand
- Desktop: Keep sticky sidebar (current layout)
- Add sticky bottom submit bar on mobile
```

### P1 — Important UX Improvements

#### 8.5 Menu: Horizontal scrolling category filters
**File:** `resources/js/routes/_public.menu.tsx`
```
Change: flex-wrap → horizontal scroll on mobile
- Mobile: overflow-x-auto flex-nowrap scrollbar-hide
- Add scroll-padding and fade gradient hint on right
- Desktop: Keep flex-wrap (current)
```

#### 8.6 Home: Compact hero section
**File:** `resources/js/routes/_public.index.tsx`
```
Change: Reduce mobile hero padding
- py-24 → py-14 on mobile
- text-4xl → text-3xl on mobile
- Keep md:py-32 md:text-6xl for desktop
```

#### 8.7 Touch targets: Increase all interactive elements
**Files:** Multiple components
```
Change: Ensure 44px minimum touch targets
- Quantity buttons: w-10 h-10 → w-11 h-11
- Navbar icon buttons: p-2 → p-2.5
- Category pills: py-2 → py-2.5
- Mobile inputs: py-2.5 → py-3, text-sm → text-base
```

### P2 — Nice to Have

#### 8.8 Cart drawer: Swipe-to-dismiss
```
Add: Touch gesture to close cart drawer by swiping right
```

#### 8.9 "How it works": Horizontal scroll on mobile
**File:** `resources/js/routes/_public.index.tsx`
```
Change: grid-cols-1 → horizontal scroll strip on mobile
- Each step card: min-w-[240px] flex-shrink-0
- Desktop: Keep 3-col grid
```

#### 8.10 Search: Add product search to menu page
**File:** `resources/js/routes/_public.menu.tsx`
```
Add: Search input above category filters
- Client-side filter on product name
- Sticky below navbar on scroll
```

---

## 9. Animation & Micro-interactions

| Interaction               | Animation                                        | Duration |
|--------------------------|--------------------------------------------------|----------|
| Page transitions         | Fade in (`opacity 0→1`)                          | 200ms    |
| Card tap                 | `active:scale-[0.98]`                            | 150ms    |
| Image carousel swipe     | CSS `scroll-snap` (native smooth)                | —        |
| Sticky bar appear        | `translate-y-full → translate-y-0`               | 300ms    |
| Cart drawer              | `translate-x-full → translate-x-0`               | 300ms    |
| Toast notification       | Slide up + fade + auto-dismiss progress           | 4500ms   |
| Button press             | `active:scale-[0.97]` + `transition-transform`   | 100ms    |
| Accordion expand         | `max-height: 0 → auto` with `transition`         | 250ms    |
| Loading skeletons        | `animate-pulse`                                  | 2000ms   |

---

## 10. Accessibility Checklist

- [ ] All interactive elements ≥ 44px touch target
- [ ] Color contrast ≥ 4.5:1 for text, ≥ 3:1 for large text
- [ ] Focus-visible rings on all interactive elements (`focus-visible:ring-2 ring-primary-400`)
- [ ] `aria-label` on icon-only buttons (cart, menu, close, quantity ±)
- [ ] Image `alt` text on all product images (already present)
- [ ] Form labels associated with inputs (already present)
- [ ] Error messages linked via `aria-describedby`
- [ ] Reduced motion: `prefers-reduced-motion` disables animations
- [ ] Screen reader announcements for cart updates (`aria-live="polite"`)
- [ ] Skip to main content link

---

## 11. Performance Considerations (Mobile)

| Optimization                    | Implementation                                    |
|--------------------------------|---------------------------------------------------|
| Image lazy loading             | `loading="lazy"` on product images below fold     |
| Image sizing                   | Serve 400px for mobile, 800px for desktop (srcset) |
| Font loading                   | `font-display: swap` for Poppins                  |
| Skeleton screens               | Already in place — keep                            |
| Interaction responsiveness     | CSS-only animations (no JS animation libraries)    |
| Bundle size                    | No new dependencies needed for P0/P1 changes       |

---

## Follow-up Recommendation

After implementing P0 changes, run `/responsive-audit` to verify all breakpoints render correctly.
