# Handoff: VastuFirst Landing Page

## Overview
A premium marketing landing page for **VastuFirst** — a mobile app (Android + iOS, pre-launch) that gives home-builders a room-by-room vastu verdict before construction. The page announces "India's No. 1 Vastu App", drives email signups for launch notification, and demonstrates the product through scroll-linked animations.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype showing intended look and behavior, not production code to copy directly. Your task is to **recreate this design in the target codebase's existing environment** (Next.js/React, Vue, Astro, plain HTML — whatever the project uses) with its established patterns. If no environment exists yet, a static-first framework (Next.js or Astro) is recommended: the page is a single route with no backend except the email-capture endpoint.

`VastuFirst - Landing Page.dc.html` is the design source. It uses a proprietary component wrapper; ignore the `<x-dc>` / `sc-for` / `{{ }}` plumbing and read it for markup structure, inline styles (all styling is inline), and the logic class at the bottom (all animation code, plain JS).

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and animation behavior are final. Recreate pixel-perfectly.

## Design Tokens

Colors (Sage & Gold system):
- Ivory (page bg): `#F8F6F0` · Ivory-warm (alt section bg): `#F2EEE4`
- Ink (dark bg, primary text): `#232A22` · Ink-raised: `#2C352B` / `#3B4433`
- Sage (primary/brand): `#7A9E7E` · Sage-hover: `#8FB093` · Deep sage (links/focus): `#4C7355`, hover `#3B5E45`
- Gold (accent, never body text): `#C9A227` · Gold-tint bg: `#F5EFDA` · Gold-border: `#EAD9A6` · Bronze (readable gold-family text): `#6F5410`
- Neutrals: text-secondary `#4B5347`, text-muted `#6B7064`, faint `#98A08C`, borders `#DDDED3` / `#D3D6C9` / `#C4D0BE`, sage tints `#E4EBE1` / `#E7EEE6` / `#EFF2EA`
- Success text `#2E5539`, error border `#B3452E`
- Selection highlight: `#EAD9A6`

Typography (Google Fonts):
- Display: **Marcellus** (400 only) — headlines, screen titles, wordmark
- Body/UI: **DM Sans** (400/500/600)
- Mono: **DM Mono** (400/500) — kickers, labels, degree readouts; always with `letter-spacing: .1–.18em` + uppercase for kickers
- Indic scripts (marquee): Noto Serif Devanagari / Tamil / Telugu / Kannada / Bengali
- Scale: h1 `clamp(52px, 6.4vw, 92px)` line-height 1.02; h2 `clamp(36px, 3.6vw, 54px)` lh 1.08; body 15–19px lh 1.55–1.6; kickers 11px

Radii: pills/buttons `100px`, cards `16–18px`, phone bezel `44px` (screen `36px`), inner cards `10–14px`.
Shadows: phone only — `0 50px 90px -36px rgba(35,42,34,.55)`.
Page gutter: fluid `clamp(20px, 4vw, 48px)` (48px on desktop, 20px on phones); content max-width `1280px` (cards section `1080px`, CTA `680px`).
Breakpoints: `900px` wide and `800px` tall (see Responsive behaviour). Everything else is fluid — `clamp()`, `min()` and `auto-fit` grids — so there are no intermediate breakpoints to maintain.

## Screens / Sections (top to bottom)

### 0. Fixed chrome
- **Progress hairline**: fixed top, 2px, gold `#C9A227`, width = scroll % of document.
- **Nav**: fixed, `padding: clamp(12px,2vw,18px) clamp(18px,4vw,48px)`, bg `rgba(248,246,240,.82)` + `backdrop-filter: blur(14px)`, bottom border `rgba(211,214,201,.6)`. Left: logo mark (36×36 SVG grid-square with sage compass needle + gold center dot — copy the SVG from the design file) + "VastuFirst" in Marcellus 22px (First in sage). Right: two text links (How it works / The eight zones, DM Sans 14px 500, `#4B5347`→`#232A22` hover) + ink pill button "Coming soon — get notified" with a 6px pulsing gold dot (2.4s opacity .45↔1).

### 1. Hero (min-height 100vh, ivory)
- Background layers (both `pointer-events: none`): a faint 1200×800 SVG grid of `#D3D6C9` lines at `opacity: .5` that translates down at `scrollY * 0.12` (parallax); a 920px compass-dial SVG half off-canvas right (`right: -260px`, vertically centered, `opacity: .6`) rotating at `scrollY * 0.06` degrees.
- Two-column grid `1.15fr / .85fr`, gap 60px.
- Left: pill badge "VASTU BEFORE YOU BUILD" (mono 11px, sage border + tint); h1 **"India's No. 1 Vastu App"** ("Vastu" in sage `#7A9E7E`, line break after "No. 1"); 19px subline; two ink store badges (Apple + Play SVG glyphs, "COMING SOON ON" in gold mono 9px over "App Store"/"Google Play" 17px/500) + text link "Get launch access →"; mono meta row "16-zone analysis · Consultant-reviewed rules · 6 languages" with 4px gold dot separators.
- Right: phone mockup (330px wide, ink bezel `#0c0c0c` 10px padding, radius 44/36, screen height 640px, ivory) floating ±14px on a 7s ease-in-out loop. Screen: status bar (mono 11px `#98A08C`, "9:41 / VastuFirst"), "STEP 2 OF 3 · MARK NORTH" kicker, Marcellus title "Face the road, hold steady", live degree readout (DM Mono 44px + direction abbreviation in deep sage), a compass dial whose **tick ring rotates at `-scrollY * 0.12` deg** while sage needle/gold hub stay fixed, and a full-width sage button "Lock north" (sage bg, ink text, 600).
- **Compass placement (important):** the dial is *optically centred in the empty band between the degree readout and the button* — not pinned to the bottom of the screen. Implement it as an absolutely-positioned box inset `top: 212px; bottom: 74px; left: 10px; right: 10px` inside the 640px screen, `display: flex; align-items: center; justify-content: center`, holding an SVG with `viewBox="-110 -110 220 220"` at `width: 100%; height: 100%` (default `xMidYMid meet`). The dial then self-centres on both axes and shrinks with the screen instead of overflowing. On a 310px-wide screen this gives a ~264px dial centred at y ≈ 391px — ~48px clear above it and ~58px between it and the button.
- Degree readout = `(scrollY * 0.12) % 360`, direction = nearest of 16 compass points.
- Bottom center: scroll-hint mouse outline SVG.

### 2. Language marquee (ink band)
`padding: 18px 0`, `overflow: hidden`. A `width: max-content` row (gap 64px) of "Vastu before you build" translated into 6 scripts (see design file for exact strings), each in its Noto Serif face, ivory text, separated by gold `◆`. Content duplicated once; animate `translateX(0 → -50%)` linear infinite, 36s (tweakable 12–80s).

### 3. How it works — scroll-pinned phone (bg `#F2EEE4`)
- Outer wrapper `height: 340vh`; inner panel `position: sticky; top: 0; height: 100vh`, content vertically centered, grid `.9fr / 1.1fr` gap 80px.
- Left: phone mockup (same spec as hero) with a 560px hairline circle behind it. Three absolutely-stacked screens crossfade based on scroll progress `p = clamp(-rect.top / (rect.height - innerHeight))`, active index `min(2, floor(p*3))`. Inactive screens: `opacity: 0`, `translateY(±18px)`; transition `.45s`.
  - **Screen 1 "Draw your plot"**: floor-plan SVG — BEDROOM (sage tint), KITCHEN (gold tint), HALL, POOJA, dashed "+ ADD ROOM"; chips "4 rooms placed" / "30 × 40 ft".
  - **Screen 2 "Mark north"**: plot outline, dashed circle, sage bearing line to an "N" puck, gold center dot, caption "PLOT FACES 34° NE"; sage info card about true orientation.
  - **Screen 3 "Your result"**: score ring (r=26, circumference 163.4, sage arc) that **animates 0→78 over 1.1s** (cubic ease-out) the first time this screen activates; verdict "Good, with 2 fixes"; one gold-striped fix card (Kitchen — move to SE) + one sage-striped card (Pooja — keep in NE).
- Right: kicker "HOW IT WORKS", h2 "Three steps. Before one brick.", three step rows (mono gold number `01/02/03` + Marcellus 22px title + 15px body). Active step gets ivory bg + `#DDDED3` border (radius 16px); others transparent. Below: three 36×4px progress dashes, active = gold.
- **Short-viewport fit**: phone scales by `min(1, (innerHeight - 150) / 680)` on load/resize so nothing clips under ~830px viewports. On phones (`innerWidth <= 900`) the scale becomes `clamp(0.52, (innerHeight - 170) / 680, 0.86)` with `transform-origin: top center` and a compensating negative `margin-bottom` of `-(1 - scale) * 660px`, so the scaled bezel leaves no dead space below it.

### 4. The eight zones — scroll-driven mandala (ink bg)
- Wrapper `height: 320vh`; sticky 100vh panel, two columns.
- Right: SVG wheel `width: min(480px, 38vw)` — 8 annulus wedges (inner r 38, outer r 112, 45° each, N centered at top), fill `#2C352B`, active wedge `#7A9E7E` (fill transition .4s); direction abbreviations (mono 9px, `#B8BFAF`) rotated with their wedge; center circle "BRAHMA STHAN"; a fixed gold pointer at 12 o'clock outside the rotating group.
- Wheel rotation = `-p * 315` deg (p = section progress); active zone `i = min(7, floor(p*8))`.
- Left: kicker "THE EIGHT ZONES" (gold), h2 "Every direction has a duty.", then a live panel that swaps per zone: Marcellus 44px zone name + Devanagari name (22px `#98A08C`), element chip (sage tint) + degree-range chip (gold tint), 16.5px description in `#B8BFAF`, and "0X / 08 — keep scrolling to turn the dial" counter. All 8 zones' copy (N through NW: name, Devanagari, element, degree range, description) is in the design file's `zoneData()`.

### 5. Why VastuFirst (ivory)
Centered kicker + h2 "Advice you can trace, in the language you think in"; three cards (bg `#F2EEE4`, border `#DDDED3`, radius 18px, padding 30/28): line-icon SVG (26px, 1.5 stroke, deep sage or bronze), Marcellus 21px title, 14.5px body. Titles: "16-zone precision", "Sourced, not vague", "Six languages".

### 6. Notify CTA (bg `#F2EEE4`)
- Decorative quarter compass dial bottom-left (`opacity: .4`, rotates at `scrollY * 0.03`).
- Centered, max 680px: gold-tint pill "LAUNCHING SOON · ANDROID & IOS" with pulsing dot; h2 "Be the first to build it right"; one-line promise copy; email input (320px, pill, ivory bg, `#C4D0BE` border → `#4C7355` on focus) + sage pill button "Notify me".
- Behavior: invalid/empty email flashes the input border `#B3452E` for 1.2s; valid email swaps the form for a success pill (sage-tint bg, sage border, `#2E5539` text, check icon): "You're on the list. See you at launch." Wire the submit to your real waitlist endpoint.
- Below: two hairline mono pills "iOS — coming soon" / "Android — coming soon".

### 7. Footer (ink)
Logo mark + wordmark left; right mono 11px: "Vastu before you build · © {year} VastuFirst".

## Interactions & Behavior
- **Single scroll handler**, rAF-throttled (`requestAnimationFrame` guard), `{ passive: true }`, driving: progress bar, hero parallax/rotations, degree readout, sticky-section progress, wheel rotation, zone text swaps. DOM writes only (no React state) for 60fps.
- **Reveal-on-scroll**: elements marked `data-reveal="n"` start `opacity: 0; translateY(26px)` and transition to visible (`.7s cubic-bezier(.22,.8,.36,1)`) when 15% visible via IntersectionObserver, staggered `n * 110ms`, once only.
- **Nav links** smooth-scroll to section top minus 60px offset.
- **Reduced motion**: if `prefers-reduced-motion: reduce`, skip all scroll-linked transforms and the degree ticker (reveals and sticky screen swaps still function).
- Marquee speed and hero-phone float are the two intended config knobs.

## Responsive behaviour

Two thresholds, and they mean different things:

- **width ≤ 900px — phone layout**: stacking, type scale, chrome changes.
- **height ≤ 800px — release the pinned sections**: short laptop windows (1366×768, or any half-height window) need this as much as phones do. Without it the pinned 100vh "How it works" panel clips its third step row.

**Implementation note (read this first).** In the prototype these rules are applied imperatively from the logic class (`applyLayout()`, re-run on resize and after every render) rather than in a media query. That is a constraint of the prototype runtime only: it renders every style as an inline `style` attribute, and inline styles beat any stylesheet rule short of `!important`. **In a real codebase, implement all of this as ordinary CSS media queries / breakpoint props** — there is no reason to carry the JS approach across. The values below are the contract.

**Released pin (width ≤ 900px OR height ≤ 800px)**
- `#vfHowWrap` height `auto` (was `340vh`); panel `position: relative; height: auto; display: block; overflow: visible; padding: 64px <gutter> 76px`. `overflow: visible` matters — an `overflow: hidden` ancestor would break the sticky below it.
- The **phone cell becomes `position: sticky; top: 72px; z-index: 2`**, so the device holds its place while the step cards scroll past beneath it. The 560px hairline ring is hidden.
- Step rows: padding `16px 18px`, `min-height: 38vh`, `align-items: center`. The taller rows exist to buy scroll travel — a released pin only has the section's own height to work with, and three screens need roughly 400px+ of travel to read (at 924×540 the section is 950px tall, giving 410px).
- `fitPhone` always sets `transform-origin: top center` and `margin-bottom: -(1 - scale) * 660px`. This matters: `transform: scale()` shrinks the phone visually but not its layout box, so without the negative margin the row stays 660px tall and the section clips anyway.
- Phone scale = `clamp(0.52, (innerHeight - 170) / 680, cap)`, where cap is **0.66 below 900px wide** (so a step card still shows beneath the pinned device) and **0.86** on short-but-wide windows. Desktop stays `min(1, (innerHeight - 150) / 680)`.
- Zones panel: `height: auto; min-height: 100vh; align-items: flex-start; overflow: visible; padding: 78px <gutter> 36px` — it fits a normal viewport and, on a very short one, scrolls its last lines into view instead of clipping. Wheel `min(480px, 38vw, 46vh)`.
- Scroll-progress maths is untouched throughout: progress is still measured across the section wrapper, so screens 1→2→3 still crossfade and the score ring still animates the first time step 3 activates.

**Phone layout (width ≤ 900px)**
- Nav: the two text links are hidden; only the logo and the ink pill remain. The pill label shortens from "Coming soon — get notified" to **"Get notified"**, padding grows to `12px 18px` so the tap target clears 44px, link gap 12px.
- Hero: one column, gap 40px — copy first, phone below, both left-aligned as on desktop. Phone shell `min(330px, 88vw)`; the compass box (inset spec above) reflows on its own, so never hard-code a dial size. Background dial shrinks to 560px at `right: -230px`, `opacity: .4`.
- How it works: `#vfHowCols` switches from `grid` to **`display: block`** (copy gets `margin-top: 26px`). This is deliberate — a sticky grid item is bounded by its own grid area, so in a stacked single-column grid the phone would unstick immediately; block flow gives it the whole section as its sticky range.
- Zones: columns stack (copy above wheel), gap 20px, gutters 20px. Wheel `min(288px, 36vh)` — sized in **vh** on purpose so it survives short and landscape viewports. Type steps down against height: h2 `clamp(27px, 4.6vh, 34px)`, zone name `clamp(30px, 5vh, 40px)`, description `clamp(13.5px, 2vh, 15.5px)`; the reserved 180px copy block releases its min-height.
- Marquee 14px, gap 44px. CTA dial 420px at `left: -150px; bottom: -190px`.

**Fluid — no breakpoint involved**
- "Why VastuFirst" cards: `grid-template-columns: repeat(auto-fit, minmax(258px, 1fr))` — 3 up to 2 up to 1 up on their own.
- Email input `width: 320px; max-width: 100%`; every section padding is a `clamp()` pair; headline sizes use `clamp()` with vw.

**QA checklist**
- No horizontal scroll at 320 / 360 / 390 / 430px (the page root uses `overflow-x: clip`).
- Check short **desktop** windows too — 1366×768 and a half-height window — not just phone widths. Confirm the third step row and the progress dashes are present.
- The sticky phone clears the fixed nav (72px offset) and leaves room for one step card beneath it.
- Tap targets ≥ 44px: nav pill, "Notify me", "Lock north".
- `prefers-reduced-motion` still disables every scroll-linked transform.
- Check `100vh` against real mobile URL-bar behaviour; if it jumps, use `100dvh` for the pinned zones panel.

## State Management
Minimal: `notified` boolean (email capture success). Everything else is derived from scroll position at read time — no store needed.

## Assets
No raster assets. All imagery is inline SVG (logo mark, compass dials, floor plans, zone wheel, store glyphs) — copy paths directly from the design file. Logo PNG exports also exist in the project under `exports/logo/` if needed for og:image/social.

## Accessibility notes
- Gold `#C9A227` is decorative only — never body text on ivory (fails contrast); gold-family text uses bronze `#6F5410`.
- Buttons: ink-on-sage (4.92:1) and ivory-on-ink both pass AA.
- Decorative SVGs: `aria-hidden="true"`. Store badges are announcements, not links (nothing to link yet).
- Give the email input a visible-to-AT label and the form a proper submit.

## Files
- `VastuFirst - Landing Page.dc.html` — the full design: markup + inline styles + all animation logic (bottom `<script>`). Responsive rules live in two places: two `@media` blocks in the `<style>` at the top of the file, and the fluid `clamp()/min()/auto-fit` values inline.
- `VastuFirst - Sage & Gold Design System.dc.html` — the token and component reference this page draws from.
- `VastuFirst - Logo Shortlist.dc.html` — the marks currently under review.
- `tokens.json` — tokens as data, for web.
- `VastuTheme.kt` — the same tokens as a Compose theme, for the Android app.
- `support.js` — runtime needed to open the `.dc.html` files locally in a browser. Not part of the implementation.

## Open items
- The final logo is not selected yet; nav and footer use the interim grid-compass mark. Swap it once the shortlist is signed off.
- Email capture posts nowhere — wire it to the real waitlist endpoint.
- Store badges are announcements, not links, until the apps are listed.
