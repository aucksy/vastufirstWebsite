# VastuFirst — the website

The marketing site for VastuFirst, at **[www.vastufirst.com](https://www.vastufirst.com)**.
One landing page, a privacy notice, and one endpoint that stores launch-list emails.

It also hosts the **privacy policy at a public address**, which Google Play requires before the
Android app can be listed.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:4321 — fast, but does not run the Worker
npm run cf:dev     # builds, then serves it exactly as Cloudflare does, on 127.0.0.1:8799
```

`cf:dev` is the one that matters before a deploy: it serves the same asset pipeline, the same
`_headers`, and the same `/api/notify` as production, with a local stand-in for the email store.

## Checking it

```bash
node tools/check-headers.mjs http://127.0.0.1:8799   # headers, redirects, the signup endpoint
node tools/smoke.mjs        http://127.0.0.1:8799   # drives the page in a real browser
node tools/shots.mjs        http://localhost:4321 shots
```

`shots.mjs` photographs the page at ten viewports and ten scroll positions, and fails on horizontal
overflow, a tap target under 44px, or a headline that fell back off Marcellus. **Look at the
pictures.** The scroll-pinned sections cannot be judged from a build log, and the in-app Browser
pane cannot photograph them at all — it pauses `requestAnimationFrame` when it is not on screen,
and every animation here rides on `requestAnimationFrame`. That is why these tools drive their own
headless Chrome.

Both point at a running origin, so the same commands check the live site:

```bash
node tools/check-headers.mjs https://www.vastufirst.com
```

## Deploying

```bash
npm run deploy     # astro build && wrangler pages deploy
```

Static output goes to `dist/` and is served by Cloudflare's asset server. The only code that runs
anywhere on this site is `functions/api/notify.ts`, which stores addresses in a Cloudflare KV
namespace bound as `WAITLIST`. Every page and asset is a file.

### How the domain is wired, and why it is wired that way

`vastufirst.com` keeps its DNS at **Namecheap**, because the domain's **email forwarding** lives
there — the MX records behind `contact@vastufirst.com`, the address the app's privacy policy
publishes. Moving the zone's nameservers to Cloudflare would mean re-creating them, and a silent
mail outage is not worth the tidiness. That is also why this is a **Pages** project rather than a
Worker: a Pages custom domain attaches with a single CNAME, a Worker custom domain needs the whole
zone.

Two records at Namecheap, and nothing else in that zone is touched:

| Host | Type | Value |
|---|---|---|
| `www` | CNAME | `vastufirst-website.pages.dev` — the site itself |
| `@` | URL Redirect Record | `https://www.vastufirst.com` — set from the domain's **Redirect Domain** panel, not from Advanced DNS |

`www.vastufirst.com` is the only custom domain on the Pages project, and the only canonical host.

**Why the bare domain is NOT a Pages custom domain.** It was tried. Cloudflare verifies a custom
domain by looking for a literal **CNAME** record, and an apex cannot have one — an ALIAS record
resolves to the right addresses but does not read as a CNAME, so verification sits at
`"CNAME record not set"` forever while `www`, which has a real CNAME, went active in minutes. An
apex pointed at Cloudflare with no active custom domain is worse than useless: it answers **409** on
http and fails the TLS handshake on https. Do not re-add it.

**Two traps, both paid for:**

- The apex redirect is **tied to Namecheap's parking service**. Changing the `www` CNAME away from
  `parkingpage.namecheap.com` silently withdrew the apex's address record with it, and the bare
  domain stopped resolving at all. If the bare domain ever goes dark, re-add the redirect from the
  **Domain** tab's *Redirect Domain* panel — the record-type dropdown in Advanced DNS is a custom
  widget that resists automation, and that panel writes the same record without it.
- The zone's negative-cache time is **3601 seconds**. Any resolver that asked while a record was
  missing keeps answering "no such name" for up to an hour after the fix, so a checker can call the
  bare domain broken while the authoritative nameserver is already correct. Check the source of
  truth before believing a resolver:

```bash
nslookup -type=A vastufirst.com dns1.registrar-servers.com
```

---

## How it is put together

| | |
|---|---|
| Astro, static output | one route plus two small pages; no server rendering to do |
| Plain CSS in `src/styles/global.css` | every token and every breakpoint in one readable file |
| One vanilla scroll engine | `src/scripts/landing.ts`, rAF-throttled, DOM writes only |
| Cloudflare Pages + static assets | the pages are served without running any code at all |

**Security and cache headers live in `public/_headers`, not in code.** A request that matches a
static asset is served by Cloudflare's asset server, so headers set in a Worker look right in the
source and are absent from every real response. That is not a hypothetical — it happened here, and
`check-headers.mjs` exists to catch it by reading a real response rather than the source.

The compass dial, the phone shell and the logo mark are each **one component used everywhere they
appear**. The dial is drawn three times on the page and the phone twice; sharing them is what stops
the three dials disagreeing about tick geometry after the next edit.

---

## Where the words come from

Nothing on this site is invented. Every number and every rule is read out of the app project at
`D:\Apps\VastuFirst`:

- the nine zones, their deities, elements and room rules — `rules/src/main/resources/ruleset/`
- the counts quoted on the "Why VastuFirst" cards — the same folder, counted 20 Aug 2026
- the privacy page — `docs/PRIVACY-POLICY.md`, which mirrors the app's own privacy screen

**If a rule changes in the app, change it here in the same week.** `src/data/zones.ts` is the one
file that holds the zone facts, and its header says the same thing.

---

## Where this departs from the design handoff, and why

The handoff (kept in `handoff/`) is followed to the pixel on layout, colour, type and motion. It is
**not** followed on statements of fact that turned out not to be true of the product. Each of these
is a deliberate change and each is reversible in one line.

| The handoff said | The site says | Why |
|---|---|---|
| **"Six languages"** card, and a marquee of the tagline in six Indian scripts | **"Nothing to sign up for"**, and a marquee of the nine Sanskrit zone names | The app is English only, permanently — a decision, not a phase. Nothing may imply another language is coming. The same rule explicitly protects the Sanskrit and Vastu vocabulary, so the band keeps its motion and its Devanagari. |
| **"16-zone analysis"** and **"16-zone precision"** | **"81-pada grid"** and **"The square grid, not pie slices"** | The engine scores on the 81-pada square grid. The 16-zone angular model is a separate, incompatible geometry that is not shipped and is gated on an unresolved review question. |
| **"Consultant-reviewed rules"** | **"Every rule sourced"** | The disputed rulings are our own most-attested reading, waiting for an expert to overturn any of them. Calling them consultant-reviewed today would not be true. |
| A **45° bearing range** chip on each zone | a **pada count** chip | Zones are not angular sectors in this engine. Bearings are real for the entrance — 32 positions of 11.25° each — and that is where the site mentions them. |
| An **invented element for every zone** ("Air · Vayu" for East, "Space · Varuna" for West) | the attribution the ruleset actually holds | Only four zones and the centre carry an element; the rest carry a deity. |
| **Eight** zone stops | **Nine** — the eight directions and the Brahmasthan centre | The ruleset has nine zones, and "the centre must stay open" is the one rule the app takes straight from the classical text. The wheel still turns exactly 315° across the eight wedges, then holds while the centre has its turn. |
| The centre label spins with the wheel | the centre does not rotate | It left "BRAHMA STHAN" printed upside down for half of every turn. The still point of a mandala does not turn. |
| **"Launching soon · Android & iOS"** | **"Launching soon · Android first"** | iOS is a later phase and has not started. |
| Zone copy asserting outcomes ("the zone of career and opportunity") | the same attributions, framed as tradition | The product's first non-negotiable forbids presenting vastu as fact, prediction or guaranteed outcome. The footer carries the disclaimer this requires. |

Two additions the handoff did not ask for: a **privacy page**, because Google Play needs one at a
public address, and a **footer disclaimer**, because the product rules require the honesty position
to be visible rather than buried.

## Still open

- The **logo** is the interim grid-compass mark. When the shortlist is signed off, replace
  `src/components/LogoMark.astro` and re-run `node tools/make-images.mjs` — the nav, the footer, the
  share card and the touch icon all read from that one file.
- **No price is quoted** anywhere on the site.
- The headline reads **"India's No. 1 Vastu App"**, restored on the owner's instruction on
  20 August 2026 after a spell as "Vastu before the concrete." Two things are on the record and
  neither is settled: the app is pre-launch with no users, and the product document names three
  competitors and says plainly that we are not first; and an unsubstantiated "No. 1" is a claim the
  Advertising Standards Council of India can be asked to rule on. It is the owner's call and it is
  reversible in one line, in two files — `src/components/Hero.astro` and `tools/og-source.html`,
  the second followed by `node tools/make-images.mjs`.
