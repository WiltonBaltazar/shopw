# Responsive Audit Report
**Project:** Shopw (Cheesemania storefront)  
**Stack:** React 19 + TanStack Router + Tailwind CSS v4 + Laravel  
**Date:** 2026-04-04  
**Auditor:** Claude Code (responsive-audit skill)

---

## Executive Summary

The site is well-structured with a mobile-first approach and consistent `md`/`lg` breakpoint usage. The core user journeys (browse → product detail → checkout) are responsive. However, several issues affect touch usability, intermediate screen sizes (640–767px), and typography scaling at large viewports.

**Overall Score: 72 / 100**

| Area | Score | Status |
|---|---|---|
| Breakpoints | 6/10 | ⚠️ Gap |
| Grid | 9/10 | ✅ Good |
| Typography | 6/10 | ⚠️ Partial |
| Spacing | 7/10 | ⚠️ Inconsistent |
| Visual Hierarchy | 8/10 | ✅ Good |
| Touch Targets | 5/10 | ❌ Failing |

---

## 1. Breakpoints

**Tailwind v4 defaults in use:** `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)  
**Breakpoints actually used:** `md` and `lg` only — `sm` is never used, `xl` is never used.

### Issues

| Severity | Finding |
|---|---|
| HIGH | **No `sm` breakpoint** — content jumps from 375px mobile to 768px tablet. A ~393px gap with zero adaptation. |
| LOW | **No `xl`+ scaling** — at 1280px and above, `max-w-6xl` caps layout correctly, but no breakpoint-specific refinements exist. |

### Affected Components at 640–767px
- **Footer:** Single-column on mobile → 3-column at 768px. At 640–767px, a 2-column intermediate would prevent the single-column from feeling sparse.
- **Product grid (menu page):** `grid-cols-2` → `md:grid-cols-3`. At 600px, 2 columns are fine but cards are relatively wide.
- **Testimonials:** Carousel-only on mobile → 3-col grid at 768px. At 640–767px, carousel still shows one card at a time even though there's space for 2.

### Recommendation
```tsx
// Add sm breakpoints for key transitions
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">

// Footer
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.15fr_1fr_1fr] gap-10 md:gap-12">
```

---

## 2. Grid Layout

The grid system is well-implemented across all major sections.

| Component | Mobile | sm | md | lg |
|---|---|---|---|---|
| Product listing | 2-col | — | 3-col | 4-col |
| Homepage featured | horizontal scroll | — | 4-col grid | 4-col grid |
| Testimonials | carousel (1) | — | 3-col grid | 3-col grid |
| Footer | 1-col | — | 3-col | 3-col |
| Product detail | stacked | — | 2-col | 2-col |
| Checkout | stacked | — | 5-col (3+2) | 5-col |

### Issues

| Severity | Finding |
|---|---|
| MEDIUM | **No `sm` column transition** for product grid and footer (see Breakpoints section). |
| LOW | Product detail remains 2-col at all desktop sizes — could benefit from a `lg:gap-16` for visual breathing room. |

### Status: ✅ Compliant with minor gaps

---

## 3. Typography

**Font:** Poppins (single font for both `--font-serif` and `--font-sans` — semantic tokens exist but both map to same font)

### Scale Analysis

| Element | Mobile | Desktop | Method |
|---|---|---|---|
| Hero H1 | clamp(2.6rem, 9vw, 5rem) | clamp(2.6rem, 9vw, 5rem) | ✅ Fluid |
| Section H2 | `text-xl` (20px) | `md:text-2xl` (24px) | ⚠️ Only 1 step |
| Product card title | `text-[15px]` | `md:text-base` (16px) | ⚠️ Minimal change |
| Product detail H1 | `text-2xl` (24px) | `md:text-3xl` (30px) | ✅ Good |
| Body / descriptions | `text-sm` (14px) | `text-sm` (14px) | ❌ No scaling |
| Nav links | `text-sm` (14px) | `text-sm` (14px) | ⚠️ Fixed |
| Bottom CTA H2 | `text-2xl` (24px) | `md:text-3xl` (30px) | ✅ Good |

### Issues

| Severity | Finding |
|---|---|
| MEDIUM | **Section headings plateau at `text-2xl` (24px)**. At `lg` (1024px+) and wider, headings don't scale further — feels undersized on large monitors. |
| MEDIUM | **Body text fixed at `text-sm`** — no responsive scaling on long-form content (product descriptions, blog posts). |
| LOW | `--font-serif` and `--font-sans` both resolve to Poppins — semantic token distinction is unused, making future font changes harder to apply selectively. |

### Recommendation
```css
/* In @theme, add a proper fluid type scale */
--text-body: clamp(0.875rem, 1.5vw, 1rem);   /* 14px → 16px */
--text-h2: clamp(1.25rem, 3vw, 2rem);          /* 20px → 32px */
```
Or use Tailwind responsive variants at `lg`:
```tsx
<h2 className="text-xl md:text-2xl lg:text-3xl">
```

---

## 4. Spacing

**Container pattern:** `max-w-6xl mx-auto` — consistent ✅  
**Section vertical rhythm:** `py-14 md:py-20` (56px → 80px) — consistent ✅

### Issues

| Severity | Finding |
|---|---|
| MEDIUM | **`px-5 md:px-4` inconsistency** — mobile gets 20px horizontal padding while desktop gets 16px. This means mobile has MORE edge padding than desktop, which is backwards from conventional practice and creates a visual mismatch between the fixed-padding sections and the grid-contained sections. Some sections use `md:px-6` instead, creating three different desktop padding values. |
| LOW | **Bottom CTA section** uses `max-w-xs` (320px) — on landscape phones (568px–667px), this creates a narrow, centred column with very large gutters that wastes space. |

### Padding Audit

| Location | Mobile | Desktop |
|---|---|---|
| Featured products header | `px-5` | `md:px-4` ← inconsistent |
| Testimonials header | `px-5` | `md:px-4` ← inconsistent |
| How it works | `px-5` | `md:px-4` ← inconsistent |
| Footer | `px-5` | `md:px-6` ← different value |
| Product detail | `px-4` | `px-4` ✅ consistent |

### Recommendation
Standardize to `px-4 md:px-6` or `px-5 md:px-6` throughout. The mobile value should be ≤ the desktop value.

---

## 5. Visual Hierarchy

The hierarchy is well-maintained across breakpoints.

- ✅ Hero → Featured Products → Testimonials → How It Works → CTA is clear at all sizes
- ✅ Product card: image-first on mobile, hover overlay on desktop, always-visible CTA bar on mobile
- ✅ Sticky bottom bar on mobile (product detail + checkout) prevents CTA from being lost
- ✅ Cart drawer slides over content on all sizes
- ✅ Badge placement (top-left) and favorites (top-right) consistent across breakpoints
- ⚠️ At 640–767px, the testimonials carousel can show only 1 card despite screen space for 2

---

## 6. Touch Targets

WCAG 2.5.5 (AA) requires interactive targets ≥ 44×44px. WCAG 2.5.8 (AA in WCAG 2.2) requires 24×24px minimum with adequate spacing.

| Element | Rendered Size | Status |
|---|---|---|
| Hero CTA button | `py-3.5 px-7` → ~48px tall | ✅ Pass |
| Mobile nav links | `py-3` + `text-sm` → ~38px | ⚠️ Borderline |
| Hamburger button | `p-2.5` + 20px icon → ~40px | ⚠️ Borderline |
| Cart icon button | `p-2.5` + icon → ~40px | ⚠️ Borderline |
| Cart drawer close | `p-2` + 20px icon → **36px** | ❌ Fail |
| Product image arrows | `w-9 h-9` = **36×36px** | ❌ Fail |
| Image dot indicators | `w-2 h-2` = **8×8px** | ❌ Fail (no tap area) |
| Quantity -/+ buttons | Not measured separately but small | ⚠️ Verify |
| WhatsApp FAB | `w-12 h-12` = 48×48px | ✅ Pass |
| Sticky bottom CTA | Full-width `py-3.5` → ~52px | ✅ Pass |
| Mobile menu links | `py-3` full-width | ✅ Pass (full width) |

### Critical Failures

```tsx
// ❌ Cart drawer close — too small
<button onClick={onClose} className="p-2 -mr-1 ...">  {/* 36px */}
// ✅ Fix
<button onClick={onClose} className="p-3 -mr-2 ...">  {/* 44px */}

// ❌ Product image arrows — too small  
className="w-9 h-9 ..."  {/* 36px */}
// ✅ Fix
className="w-11 h-11 ..."  {/* 44px */}

// ❌ Image dot indicators — no tap area
className="w-2 h-2 rounded-full ..."
// ✅ Fix — add minimum tap area with padding
className="w-2 h-2 rounded-full p-2 -m-2 ..."
```

---

## 7. Compliance Summary by Breakpoint

| Breakpoint | Range | Status | Notes |
|---|---|---|---|
| Mobile (default) | 0–639px | ⚠️ Mostly pass | Touch target failures, fixed body text |
| `sm` | 640–767px | ❌ No adaptation | Same as mobile, no intermediate layout |
| `md` | 768–1023px | ✅ Pass | Major layout transitions work well |
| `lg` | 1024–1279px | ✅ Pass | 4-col product grid, good spacing |
| `xl`+ | 1280px+ | ⚠️ Acceptable | Max-width container prevents over-stretching |

---

## 8. Priority Remediation List

| Priority | Issue | File(s) | Effort |
|---|---|---|---|
| P0 | Cart drawer close button touch target (36px → 44px) | `CartDrawer.tsx` | 5 min |
| P0 | Product image arrows touch target (36px → 44px) | `_public.produto.$slug.tsx` | 5 min |
| P0 | Image dot indicators — add tap area | `_public.produto.$slug.tsx` | 5 min |
| P1 | Add `sm` breakpoint for product grid and footer | `_public.menu.tsx`, `Footer.tsx` | 30 min |
| P1 | Standardize horizontal padding (`px-4 md:px-6` or `px-5 md:px-6`) | `_public.index.tsx`, all sections | 30 min |
| P2 | Section headings: add `lg:text-3xl` scaling | `_public.index.tsx`, `_public.menu.tsx` | 15 min |
| P2 | Body text: add `md:text-base` on product descriptions | `_public.produto.$slug.tsx` | 10 min |
| P3 | Testimonials carousel: show 2 cards at `sm` breakpoint | `_public.index.tsx` | 1 hr |

---

## 9. What's Working Well

- ✅ Mobile-first approach throughout — desktop classes always override, never the reverse
- ✅ Horizontal scroll carousels on mobile with `snap-x snap-mandatory` and `scrollbar-hide`
- ✅ Dual UI patterns: sticky bottom bars on mobile, inline CTAs on desktop
- ✅ Fluid hero heading with `clamp()` — scales beautifully across all widths
- ✅ Cart drawer: `w-full max-w-sm` — fills small screens, constrains on large
- ✅ WhatsApp FAB repositions correctly between mobile (`bottom-[4.5rem]`) and desktop (`md:bottom-6`) to avoid sticky cart bar overlap
- ✅ Product detail: swipeable carousel on mobile, static gallery with arrows on desktop
- ✅ Checkout: sidebar order summary hidden on mobile (sticky bar instead)
- ✅ `max-w-6xl` container used consistently — prevents layout breakage on ultra-wide displays

---

*Generated by `/ui-design:responsive-audit` — follow up with `/design-screen` to redesign problem areas.*
