// Prove the response headers, the redirects and the waitlist endpoint against a
// running origin — local wrangler, or the live site.
//
//   node tools/check-headers.mjs [baseUrl]
//
// This exists because headers set in the Worker looked correct in the source and
// were absent from every real response: Cloudflare serves a matching static
// asset without invoking the Worker at all. Only a real response proves it.

const BASE = process.argv[2] || 'http://127.0.0.1:8799';
const REQUIRED = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'SAMEORIGIN',
  'strict-transport-security': /max-age=\d+/,
  'content-security-policy': /default-src 'self'/,
  'permissions-policy': /camera=\(\)/,
};

let failures = 0;
const ok = (pass, label, extra = '') => {
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`);
};

// A deployment that is seconds old answers a cold edge with a 522 or a stale
// body, which reads as a broken site and is not one. Warm it first.
for (let i = 0; i < 12; i++) {
  try {
    const warm = await fetch(BASE + '/', { cache: 'no-store' });
    const body = await warm.text();
    if (warm.ok && body.includes('vfZoneWrap')) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 2500));
}

const res = await fetch(BASE + '/');
ok(res.status === 200, 'GET / is 200', String(res.status));

for (const [name, want] of Object.entries(REQUIRED)) {
  const got = res.headers.get(name);
  const pass = got != null && (want instanceof RegExp ? want.test(got) : got === want);
  ok(pass, `header ${name}`, got == null ? 'MISSING' : got.slice(0, 70));
}

// The CSP must permit everything the page actually pulls in.
const html = await (await fetch(BASE + '/')).text();
const csp = res.headers.get('content-security-policy') || '';
// Assert the marker is present first — an empty or 404 body would otherwise
// make both of these pass by vacuum, which is exactly how a broken build hides.
ok(html.includes('fonts.googleapis.com'), 'the page really does link Google Fonts');
ok(csp.includes('fonts.googleapis.com'), 'CSP allows the Google Fonts stylesheet');
ok(html.includes('_astro/'), 'the page really does load a bundled script');
ok(/script-src[^;]*'self'/.test(csp), 'CSP allows the bundled module script');
ok(html.includes('vfZoneWrap'), 'the page is the landing page, not an error page');

const immutable = await fetch(BASE + '/favicon.svg');
ok(/max-age=\d+/.test(immutable.headers.get('cache-control') || ''), 'favicon has a cache policy');

// The waitlist endpoint, both the JavaScript path and the plain-form path.
const post = (body, headers) =>
  fetch(BASE + '/api/notify', { method: 'POST', headers, body });

const good = await post(JSON.stringify({ email: 'headers.check@example.com' }), {
  'Content-Type': 'application/json',
  Accept: 'application/json',
});
ok(good.status === 200, 'POST /api/notify with a good address is 200', String(good.status));

const bad = await post(JSON.stringify({ email: 'not-an-email' }), {
  'Content-Type': 'application/json',
  Accept: 'application/json',
});
ok(bad.status === 400, 'POST /api/notify with a bad address is 400', String(bad.status));

const noJs = await post('email=noscript.check%40example.com', {
  'Content-Type': 'application/x-www-form-urlencoded',
});
ok(noJs.status === 200, 'POST /api/notify from a plain form is 200', String(noJs.status));
ok(
  (noJs.headers.get('content-type') || '').includes('text/html'),
  'the plain-form reply is a readable page, not JSON',
);

// The bare domain must reach the www one. Only meaningful against the live
// site; skipped locally, and said out loud rather than passing silently.
if (BASE.includes('vastufirst.com')) {
  try {
    const apex = await fetch('http://vastufirst.com/', { redirect: 'manual' });
    const to = apex.headers.get('location') || '';
    ok(
      apex.status >= 300 && apex.status < 400 && to.includes('www.vastufirst.com'),
      'the bare domain redirects to www over http',
      `${apex.status} -> ${to || 'no Location header'}`,
    );
    // Asserted, not merely reported. This was once a console note, on the
    // grounds that whether the registrar answers on 443 is their business —
    // which was wrong. Chrome and Safari send a typed bare domain to https
    // FIRST, so a bare domain with no certificate is a visitor staring at
    // "This site can't be reached". A quiet note let that sit behind an
    // "all good" until someone typed the address by hand.
    try {
      const s = await fetch('https://vastufirst.com/', { redirect: 'manual' });
      const sTo = s.headers.get('location') || '';
      ok(
        s.status >= 300 && s.status < 400 && sTo.includes('www.vastufirst.com'),
        'the bare domain answers on https too',
        `${s.status} -> ${sTo || 'no Location header'}`,
      );
    } catch (e) {
      ok(
        false,
        'the bare domain answers on https too',
        // A stale local resolver fails this while the world sees it working.
        // Check a public resolver before believing it: nslookup vastufirst.com 1.1.1.1
        `${e.cause?.code || e.message} — check a public resolver before believing this`,
      );
    }
  } catch (e) {
    ok(false, 'the bare domain redirects to www', String(e.cause?.code || e.message));
  }
} else {
  console.log('SKIP  the bare-domain redirect (only testable against the live site)');
}

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
