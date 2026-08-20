// Render the social share card and the touch icon to PNG with real web fonts.
//
//   node tools/make-images.mjs
//
// Re-run this whenever the wordmark, the headline, or the logo mark changes.
// Output goes straight into public/, which is committed.

import { writeFileSync } from 'node:fs';
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

await tab.close();
browser.close();
process.exit(0);
