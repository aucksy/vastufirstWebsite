// Drive the real page in a real browser against the real Worker: submit the
// waitlist form, check the console is clean under the live CSP, and confirm the
// scroll engine actually moves things.
//
//   node tools/smoke.mjs [baseUrl]

import { launch, newTab, sleep } from './cdp.js';

const BASE = process.argv[2] || 'http://127.0.0.1:8799';
let failures = 0;
const ok = (pass, label, extra = '') => {
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${extra ? '  — ' + extra : ''}`);
};

const browser = await launch(9431);
const tab = await newTab(browser.port);
await tab.send('Page.enable');
await tab.send('Runtime.enable');
await tab.send('Log.enable');

const noise = [];
tab.on((m) => {
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) {
    noise.push(m.params.type + ': ' + m.params.args.map((a) => a.value ?? a.description).join(' '));
  }
  if (m.method === 'Runtime.exceptionThrown') {
    noise.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  }
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
    noise.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
  }
});

await tab.send('Emulation.setDeviceMetricsOverride', {
  width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
});
await tab.goto(BASE + '/', 2200);
await tab.eval('document.fonts ? document.fonts.ready.then(()=>1) : 1');

// --- the scroll engine actually drives the DOM -----------------------------
const before = await tab.eval(
  'JSON.stringify({deg: vfDeg.textContent, wheel: vfWheel.getAttribute("transform"), zone: vfZName.textContent, bar: vfProgress.style.width})',
);
await tab.eval('window.scrollTo(0, document.documentElement.scrollHeight * 0.55); 1');
await sleep(700);
const after = await tab.eval(
  'JSON.stringify({deg: vfDeg.textContent, wheel: vfWheel.getAttribute("transform"), zone: vfZName.textContent, bar: vfProgress.style.width})',
);
const b = JSON.parse(before);
const a = JSON.parse(after);
ok(a.deg !== b.deg, 'the compass degree readout moves on scroll', `${b.deg} -> ${a.deg}`);
ok(a.wheel !== b.wheel, 'the zone wheel rotates on scroll', `${b.wheel} -> ${a.wheel}`);
ok(a.zone !== b.zone, 'the zone panel swaps on scroll', `${b.zone} -> ${a.zone}`);
ok(a.bar !== b.bar, 'the progress hairline advances', `${b.bar} -> ${a.bar}`);

// --- the three app screens crossfade, and the last one wins ----------------
// This replaced a check on a counting-up score ring. That ring lived on a
// hand-drawn screen standing in for the app; the phone now shows the app's own
// rendered screens, so there is no ring to count. The point of the check is the
// same and it now also proves the pictures actually arrive.
await tab.eval('window.scrollTo(0, document.getElementById("vfHowWrap").offsetTop + document.getElementById("vfHowWrap").offsetHeight - window.innerHeight - 40); 1');
await sleep(1200);
const how = JSON.parse(await tab.eval(`
  JSON.stringify({
    third: vfScr2.style.opacity,
    first: vfScr0.style.opacity,
    step: vfStep2.className,
    dash: vfDot2.className,
    file: (vfScr2.querySelector('img').currentSrc || '').split('/').pop(),
    px: vfScr2.querySelector('img').naturalWidth,
  })
`));
ok(how.third === '1', 'the last of the three app screens is showing at the end', how.third);
ok(how.first === '0', 'the first app screen has faded out', how.first);
ok(/is-active/.test(how.step), 'step 03 is the highlighted row', how.step);
ok(/is-active/.test(how.dash), 'the third progress dash is lit', how.dash);
ok(how.px > 0, 'the app screenshot really loaded', `${how.file} at ${how.px}px`);

// --- the last zone is the Brahmasthan centre, and it lights up -------------
await tab.eval('window.scrollTo(0, document.getElementById("vfZoneWrap").offsetTop + document.getElementById("vfZoneWrap").offsetHeight - window.innerHeight - 5); 1');
await sleep(700);
const last = await tab.eval(
  'JSON.stringify({name: vfZName.textContent, idx: vfZIdx.textContent, centre: vfCentre.getAttribute("fill"), wheel: vfWheel.getAttribute("transform")})',
);
const L = JSON.parse(last);
ok(L.name === 'Brahmasthan', 'the ninth stop is the Brahmasthan', L.name);
ok(L.idx === '09', 'the counter reads 09', L.idx);
ok(L.centre === '#7A9E7E', 'the centre lights up on its own stop', L.centre);
ok(/rotate\(-315\)/.test(L.wheel), 'the wheel finishes at exactly -315 degrees', L.wheel);

// --- the waitlist form, driven like a person -------------------------------
await tab.eval('document.getElementById("vfNotify").scrollIntoView(); 1');
await sleep(500);

// empty box first
await tab.eval('document.getElementById("vfSubmit").click(); 1');
await sleep(400);
const emptyState = await tab.eval(
  'JSON.stringify({err: vfFormMsg.textContent, flash: vfEmail.classList.contains("is-error"), successShown: !vfSuccess.hidden})',
);
const E = JSON.parse(emptyState);
ok(E.err.length > 0, 'an empty box shows a real message', E.err);
ok(E.flash === true, 'an empty box flashes the input border');
ok(E.successShown === false, 'the success pill is NOT shown before submitting');

// a real address
await tab.eval(`(() => {
  const i = document.getElementById('vfEmail');
  i.value = 'smoke.test@example.com';
  i.dispatchEvent(new Event('input', { bubbles: true }));
  document.getElementById('vfSubmit').click();
})()`);
await sleep(1400);
const done = await tab.eval(
  'JSON.stringify({formHidden: document.getElementById("vfForm").hidden, success: !vfSuccess.hidden, text: vfSuccess.textContent.trim()})',
);
const D = JSON.parse(done);
ok(D.formHidden === true, 'the form is replaced after a good address');
ok(D.success === true, 'the success pill appears');
ok(/on the list/.test(D.text), 'the success pill says the right thing', D.text.slice(0, 60));

// --- reduced motion turns the scroll-linked transforms off -----------------
await tab.send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
});
await tab.goto(BASE + '/', 1500);
await tab.eval('window.scrollTo(0, 2000); 1');
await sleep(600);
const rm = await tab.eval(
  'JSON.stringify({dial: document.getElementById("vfHeroDial").style.transform, deg: vfDeg.textContent, bar: vfProgress.style.width})',
);
const R = JSON.parse(rm);
ok(R.dial === '', 'reduced motion: the hero dial is not rotated', JSON.stringify(R.dial));
ok(R.deg === '0°', 'reduced motion: the degree ticker does not run', R.deg);
ok(R.bar !== '0%' && R.bar !== '', 'reduced motion: the progress bar still works', R.bar);

// --- with JavaScript off, the page must still be readable ------------------
// Reveal-on-scroll hides most of the page until an observer shows it. Without
// the noscript override a visitor with JavaScript off gets a blank page and no
// signup form at all.
await tab.send('Emulation.setScriptExecutionDisabled', { value: true });
await tab.goto(BASE + '/', 1800);
const off = await tab.eval(`
  (() => {
    const vis = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return 'missing';
      const r = el.getBoundingClientRect();
      return getComputedStyle(el).opacity + '|' + Math.round(r.height);
    };
    return JSON.stringify({ h1: vis('.h1'), form: vis('#vfForm'), card: vis('.card') });
  })()
`);
const O = JSON.parse(off);
ok(O.h1.startsWith('1|'), 'no JavaScript: the headline is visible', O.h1);
ok(O.form.startsWith('1|'), 'no JavaScript: the signup form is visible', O.form);
ok(O.card.startsWith('1|'), 'no JavaScript: the cards are visible', O.card);
await tab.send('Emulation.setScriptExecutionDisabled', { value: false });

// --- console must be clean under the live CSP ------------------------------
const real = noise.filter((n) => !/favicon|DevTools|Autofocus/i.test(n));
ok(real.length === 0, 'no console errors or CSP violations', real.slice(0, 4).join(' | '));

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
await tab.close();
browser.close();
process.exit(failures ? 1 : 0);
