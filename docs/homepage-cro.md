# Homepage CRO — Cheesemania

Recommendations from CRO audit of `_public.index.tsx`. Ordered by priority.

---

## Quick Wins

### 1. Surface the 24h advance notice in the hero

**Problem:** Visitors don't know orders require 24h advance. They get surprised at checkout and bounce.

**Fix:** Add below the hero CTA button.

```tsx
<p className="mt-3 text-xs text-stone-400">
  Encomendas com 24h de antecedência · Entrega em Maputo e Matola
</p>
```

---

### 2. Change hero CTA copy

**Problem:** "Ver o Menu" describes navigation, not value.

**Options (pick one):**
- `Encomendar agora` — direct
- `Escolher o meu cheesecake` — personal, lower commitment
- `Ver os sabores` — sensory, food-specific

**Where:** `seo.hero_cta_text` in the admin settings, or hardcode in the hero if not using dynamic text.

---

### 3. Add M-Pesa to the badges strip

**Problem:** Payment trust is a top blocker in the Mozambican market. M-Pesa acceptance isn't visible anywhere on the homepage.

**Fix:** Add to the badges array in the marquee strip:

```tsx
'✦ Pagamento via M-Pesa',
```

---

### 4. Reframe the social proof signal

**Problem:** "200 encomendas" sounds like a starting floor, not a milestone.

**Options:**
- `+200 clientes satisfeitos`
- `Mais de 50 encomendas este mês` (if true — adds recency)

**Where:** The trust signals row in the hero section (`h-d5` block).

---

## High-Impact Changes

### 5. Add a dedicated hero image (most important)

**Problem:** The hero image slot uses `seo_og_image` as its source. If it's not set, visitors see a `🍰` emoji placeholder. A food product without an appetizing photo in the first viewport kills appetite-driven conversions.

**Options:**

**Option A — Add a `hero_image_url` setting (recommended)**

In `app/Models/Setting.php` (or wherever settings are stored), add a new key `hero_image_url`. In the admin settings panel, add a field for it. In `hooks.ts`:

```ts
export interface SeoSettings {
  // ... existing fields
  hero_image_url: string | null   // add this
}

const SEO_DEFAULTS: SeoSettings = {
  // ...
  hero_image_url: null,
}
```

In the hero image block in `_public.index.tsx`, use `seo.hero_image_url ?? seo.seo_og_image` as the `src`.

**Option B — Upload a static image to `public/images/` and hardcode it as the fallback**

```tsx
<img src={seo.seo_og_image ?? '/images/hero-cheesecake.jpg'} ... />
```

---

### 6. Add a testimonials section

**Problem:** Zero customer voices on the homepage. The data model already has `reviews_count` and `average_rating` on products — they're just not surfaced here.

**Add between the Featured Products section and How It Works:**

```tsx
{/* ── TESTIMONIALS ── */}
<section className="py-14 px-5 max-w-6xl mx-auto md:px-4">
  <h2 className="font-sans font-bold text-stone-900 text-xl mb-8 text-center md:text-2xl">
    O que dizem os nossos clientes
  </h2>
  <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
    {[
      { quote: 'Melhor cheesecake que já comi em Maputo!', name: 'Ana M.', detail: 'Cliente desde 2023' },
      { quote: 'Perfeito para o aniversário da minha filha. Todos adoraram.', name: 'Carlos S.', detail: 'Maputo' },
      { quote: 'A opção sem lactose é incrível. Não perco nada do sabor!', name: 'Fátima N.', detail: 'Matola' },
    ].map(({ quote, name, detail }) => (
      <div key={name} className="flex-shrink-0 w-[80vw] max-w-[300px] snap-start md:w-auto md:max-w-none bg-stone-50 rounded-2xl p-5">
        <div className="flex gap-0.5 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="text-stone-700 text-sm leading-relaxed mb-4">"{quote}"</p>
        <p className="text-xs font-semibold text-stone-800">{name}</p>
        <p className="text-xs text-stone-400">{detail}</p>
      </div>
    ))}
  </div>
</section>
```

> **Note:** Replace the hardcoded quotes with real customer reviews once you have them. You can eventually pull these dynamically from the reviews API.

---

### 7. Change the bottom CTA section

**Problem:** The bottom CTA ("Pronto para encomendar? Ver o Menu Completo") repeats the exact same framing as the hero. At the bottom of the page, the visitor needs a reason to commit — not another browse invitation.

**Replace the bottom CTA section with:**

```tsx
<section className="py-16 px-5 text-center">
  <div className="max-w-xs mx-auto">
    <p className="text-4xl mb-4">🎂</p>
    <h2 className="font-sans font-black text-stone-900 text-2xl md:text-3xl leading-tight mb-3">
      Pronta a encantar na sua próxima celebração?
    </h2>
    <p className="text-stone-400 text-sm mb-2 leading-relaxed">
      Explore o menu e personalize o seu cheesecake.
    </p>
    <p className="text-stone-400 text-xs mb-7">
      Entrega em Maputo · Pagamento via M-Pesa · 24h de antecedência
    </p>
    <Link
      to="/menu"
      className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 active:scale-[0.97] text-white font-semibold px-8 py-4 rounded-full transition-all text-sm shadow-lg"
      style={{ boxShadow: '0 8px 24px #685D9438' }}
    >
      Fazer a minha encomenda
      <ArrowRight size={15} />
    </Link>
  </div>
</section>
```

---

### 8. Add a WhatsApp contact button

**Problem:** Many customers in the Mozambican market want to confirm before ordering online. A WhatsApp link reduces fence-sitter abandonment.

**Option A — Floating button (highest visibility)**

Add to `PublicLayout.tsx` above `<StickyCartBar />`:

```tsx
<a
  href="https://wa.me/258XXXXXXXXX"   // replace with real number
  target="_blank"
  rel="noopener noreferrer"
  className="fixed bottom-20 right-4 z-40 flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full shadow-lg transition-colors md:bottom-6"
  aria-label="Contactar via WhatsApp"
>
  {/* WhatsApp SVG icon */}
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
</a>
```

**Option B — Line in the hero trust signals row (less intrusive)**

```tsx
<a href="https://wa.me/258XXXXXXXXX" className="flex items-center gap-1 text-green-600 hover:text-green-700">
  <span>💬</span> WhatsApp
</a>
```

---

## A/B Test Ideas

| What to test | Variant A (current) | Variant B |
|---|---|---|
| Hero CTA copy | "Ver o Menu" | "Escolher o meu cheesecake" |
| Price signal in hero | Hidden | "A partir de X MT" below CTA |
| Testimonials section | Not present | Added between products + how it works |
| WhatsApp button | Not present | Floating button |

---

## Hero Copy Alternatives

**Tagline** (currently: *Homemade · Maputo*)
- `Maputo's favourite cheesecake`
- `Feito em Maputo, entregue à sua porta`
- `Homemade · Sem conservantes · Maputo`

**Subheading** (currently: generic "made with love")
- `Cheesecakes feitos à encomenda, entregues frescos em Maputo e Matola. Com ou sem lactose.`
- `Cada cheesecake é feito à mão, com ingredientes frescos, especialmente para si.`
