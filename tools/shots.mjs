// Photograph the landing page at real viewports and real scroll positions, so
// the scroll-driven sections can be LOOKED AT and not only compiled.
//
//   node tools/shots.mjs [baseUrl] [outDir]
//
// The Browser pane pauses requestAnimationFrame when it is not on screen, and
// every animation on this page rides on rAF — so the pane cannot photograph the
// pinned sections at all. Our own headless Chrome can.
//
// Each shot names the viewport and the fraction of the page it is taken at, so
// a missing step row or a clipped wheel is visible in the file list itself.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch, newTab, sleep } from './cdp.js';

const BASE = process.argv[2] || 'http://127.0.0.1:4321';
const OUT = process.argv[3] || 'shots';
const ONLY = process.env.ONLY || '';

// width, height, label — the QA checklist's viewports plus the two that have
// historically broken: a short laptop window, and a landscape phone.
const VIEWPORTS = [
  { w: 1440, h: 900, name: 'desktop-1440x900' },
  { w: 1920, h: 1080, name: 'desktop-1920x1080' },
  { w: 1366, h: 768, name: 'laptop-short-1366x768' },
  { w: 1280, h: 620, name: 'window-half-1280x620' },
  { w: 430, h: 932, name: 'phone-430x932' },
  { w: 390, h: 844, name: 'phone-390x844' },
  { w: 360, h: 740, name: 'phone-360x740' },
  { w: 320, h: 568, name: 'phone-320x568' },
  { w: 844, h: 390, name: 'phone-landscape-844x390' },
  { w: 768, h: 1024, name: 'tablet-768x1024' },
];

// Where to stop and look. Fractions of total scrollable height.
const STOPS = [0, 0.1, 0.24, 0.34, 0.44, 0.55, 0.66, 0.76, 0.86, 1];

mkdirSync(OUT, { recursive: true });

const browser = await launch(9411);
const tab = await newTab(browser.port);
await tab.send('Page.enable');
await tab.send('Runtime.enable');

const problems = [];
tab.on((m) => {
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    problems.push('console: ' + m.params.args.map((a) => a.value ?? a.description).join(' '));
  }
  if (m.method === 'Runtime.exceptionThrown') {
    problems.push('exception: ' + (m.params.exceptionDetails.exception?.description || ''));
  }
});

const shot = async (name) => {
  const { data } = await tab.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(OUT, name + '.png'), Buffer.from(data, 'base64'));
};

for (const vp of VIEWPORTS) {
  if (ONLY && !vp.name.includes(ONLY)) continue;

  await tab.send('Emulation.setDeviceMetricsOverride', {
    width: vp.w,
    height: vp.h,
    deviceScaleFactor: 1,
    mobile: vp.w < 768,
  });
  await tab.goto(BASE + '/', 1500);
  // Fonts change the phone's content height; fitPhone re-runs on fonts.ready.
  await tab.eval('document.fonts ? document.fonts.ready.then(()=>1) : 1');
  await sleep(700);

  const height = await tab.eval(
    'document.documentElement.scrollHeight - window.innerHeight',
  );

  for (const f of STOPS) {
    const y = Math.round(height * f);
    await tab.eval(`window.scrollTo(0, ${y}); 1`);
    // Long enough for the scroll handler's rAF AND the reveal stagger, whose
    // last element waits 4 x 110ms. A shorter wait photographs a half-revealed
    // section and reads as missing content.
    await sleep(900);
    await shot(`${vp.name}__${String(Math.round(f * 100)).padStart(3, '0')}pc`);
  }

  // Horizontal overflow is the single most common phone defect. Measure it.
  const overflow = await tab.eval(
    'document.documentElement.scrollWidth - document.documentElement.clientWidth',
  );
  if (overflow > 0) problems.push(`${vp.name}: horizontal overflow of ${overflow}px`);

  // Tap targets that must clear 44px — a touch rule, so only where there is touch.
  if (vp.w <= 900) {
    const small = await tab.eval(`
      (() => {
        const out = [];
        document.querySelectorAll('.nav__cta, #vfSubmit, #vfEmail').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.height && r.height < 44) {
            out.push((el.id || el.className) + ' ' + Math.round(r.height) + 'px');
          }
        });
        return out.join(', ');
      })()
    `);
    if (small) problems.push(`${vp.name}: tap target under 44px — ${small}`);
  }

  // Every headline must actually be Marcellus, not a fallback serif.
  const fonts = await tab.eval(`
    (() => {
      const pick = (sel) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '') : 'missing';
      };
      return JSON.stringify({
        h1: pick('.h1'), body: pick('.hero__sub'), mono: pick('.meta-row'),
        loaded: document.fonts ? document.fonts.check('16px Marcellus') : null,
      });
    })()
  `);
  const f = JSON.parse(fonts);
  if (!f.loaded) problems.push(`${vp.name}: Marcellus did not load (h1 is ${f.h1})`);

  console.log(`${vp.name}: ${STOPS.length} shots, page ${height + vp.h}px tall`);
}

// The privacy page too — it is the one Google Play will read.
await tab.send('Emulation.setDeviceMetricsOverride', {
  width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
});
await tab.goto(BASE + '/privacy', 1200);
await shot('privacy-desktop');
await tab.send('Emulation.setDeviceMetricsOverride', {
  width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
});
await tab.goto(BASE + '/privacy', 1200);
await shot('privacy-phone');

console.log('\n--- problems ---');
console.log(problems.length ? problems.join('\n') : 'none');

await tab.close();
browser.close();
process.exit(0);
