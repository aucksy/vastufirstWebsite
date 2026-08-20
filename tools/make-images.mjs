// Render the social share card and the touch icon, and make web-sized copies of
// the app's own screens for the "How it works" phone.
//
//   node tools/make-images.mjs
//
// Re-run this whenever the wordmark, the headline or the logo mark changes, and
// whenever one of those app screens changes. Output goes straight into public/,
// which is committed.

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { launch, newTab, sleep } from './cdp.js';

const here = resolve(import.meta.dirname);
const browser = await launch(9421);
const tab = await newTab(browser.port);
await tab.send('Page.enable');

async function render(file, out, width, height) {
  await tab.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: false,
  });
  await tab.goto(pathToFileURL(resolve(here, file)).href, 1200);
  // Web fonts arrive after first paint; a card rendered in Times is worthless.
  await tab.eval('document.fonts ? document.fonts.ready.then(() => 1) : 1');
  await sleep(900);
  const { data } = await tab.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width, height, scale: 1 },
    captureBeyondViewport: true,
  });
  writeFileSync(resolve(here, '..', 'public', out), Buffer.from(data, 'base64'));
  console.log('wrote public/' + out, `${width}x${height}`);
}

await render('og-source.html', 'og.png', 1200, 630);
await render('icon-source.html', 'apple-touch-icon.png', 180, 180);

/* -------------------------------------------------------------------------
   The phone in "How it works" shows the app's OWN screens, not a drawing of
   them. The Android project records them in CI as 824x1830 PNGs; the site
   shows them about 310px wide, so 620 is a 2x copy and WebP costs about a
   third of the PNG. If a screen changes in the app, re-run this.
   ------------------------------------------------------------------------- */
const GOLDENS = resolve(here, '..', '..', 'app', 'src', 'androidUnitTest', 'roborazzi');
const SCREENS = [
  ['scan-review-printed/scan-review-printed__baseline.png', 'scan.webp'],
  ['marknorth-photo/marknorth-photo__baseline.png', 'north.webp'],
  ['report-free/report-free__baseline.png', 'report.webp'],
];
const SCREEN_WIDTH = 620;

if (!existsSync(GOLDENS)) {
  console.log(`skipped the app screens: no goldens at ${GOLDENS}`);
} else {
  mkdirSync(resolve(here, '..', 'public', 'screens'), { recursive: true });
  await tab.goto('about:blank', 300);
  for (const [src, out] of SCREENS) {
    const png = readFileSync(resolve(GOLDENS, src));
    // A data: URI, because a file:// image taints the canvas and toDataURL throws.
    const dataUrl = await tab.eval(`
      (async () => {
        const img = new Image();
        img.src = 'data:image/png;base64,${png.toString('base64')}';
        await img.decode();
        const c = document.createElement('canvas');
        c.width = ${SCREEN_WIDTH};
        c.height = Math.round(${SCREEN_WIDTH} * img.naturalHeight / img.naturalWidth);
        const g = c.getContext('2d');
        g.imageSmoothingQuality = 'high';
        g.drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL('image/webp', 0.88);
      })()
    `);
    const bytes = Buffer.from(dataUrl.split(',')[1], 'base64');
    writeFileSync(resolve(here, '..', 'public', 'screens', out), bytes);
    console.log(`wrote public/screens/${out}`, `${(bytes.length / 1024).toFixed(1)} KB`);
  }
}

await tab.close();
browser.close();
process.exit(0);
