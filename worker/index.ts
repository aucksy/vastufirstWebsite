/**
 * VastuFirst website Worker.
 *
 * Serves the built static site and handles exactly one dynamic thing: the
 * launch-list signup. Everything else is a file.
 */

interface Env {
  ASSETS: Fetcher;
  /** KV namespace holding the launch list. One key per address. */
  WAITLIST?: KVNamespace;
}

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[A-Za-z]{2,24}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });

/** The no-JavaScript path: a plain page in the site's own colours. */
function htmlReply(title: string, message: string, status: number) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — VastuFirst</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F8F6F0;color:#232A22;
font-family:system-ui,-apple-system,'Segoe UI',sans-serif;padding:32px;text-align:center}
h1{font-family:Georgia,serif;font-weight:400;font-size:34px;margin:0 0 12px}
p{color:#4B5347;line-height:1.6;margin:0 0 26px;max-width:44ch}
a{display:inline-block;background:#7A9E7E;color:#232A22;text-decoration:none;font-weight:600;
padding:14px 28px;border-radius:100px}
</style></head><body><main><h1>${esc(title)}</h1><p>${esc(message)}</p>
<a href="/">Back to VastuFirst</a></main></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );
}

async function readEmail(request: Request): Promise<string> {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    const body = (await request.json().catch(() => ({}))) as { email?: unknown };
    return typeof body.email === 'string' ? body.email : '';
  }
  const form = await request.formData().catch(() => null);
  const v = form?.get('email');
  return typeof v === 'string' ? v : '';
}

async function handleNotify(request: Request, env: Env): Promise<Response> {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');

  if (request.method !== 'POST') {
    return wantsJson
      ? json({ ok: false, error: 'method_not_allowed' }, 405)
      : htmlReply('Use the form', 'This address only accepts the launch-list form.', 405);
  }

  const email = (await readEmail(request)).trim().toLowerCase();

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return wantsJson
      ? json({ ok: false, error: 'invalid_email' }, 400)
      : htmlReply('That address did not look right', 'Please go back and check the email address.', 400);
  }

  // No KV binding means nothing would be saved. Fail loudly rather than show a
  // success message over a dropped address.
  if (!env.WAITLIST) {
    return wantsJson
      ? json({ ok: false, error: 'storage_unavailable' }, 503)
      : htmlReply('We could not save that', 'Something is wrong on our side. Please try again later.', 503);
  }

  const key = `email:${email}`;
  const existing = await env.WAITLIST.get(key);
  if (!existing) {
    await env.WAITLIST.put(
      key,
      JSON.stringify({
        email,
        at: new Date().toISOString(),
        country: (request as Request & { cf?: IncomingRequestCfProperties }).cf?.country ?? null,
        ref: request.headers.get('referer') ?? null,
      }),
    );
  }

  return wantsJson
    ? json({ ok: true, already: Boolean(existing) })
    : htmlReply(
        'You’re on the list',
        'We will send one message when VastuFirst goes live — nothing else.',
        200,
      );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/notify') return handleNotify(request, env);

    // One canonical host. www is the canonical in every meta tag on the site.
    if (url.hostname === 'vastufirst.com') {
      url.hostname = 'www.vastufirst.com';
      return Response.redirect(url.toString(), 301);
    }

    // Security and cache headers live in public/_headers, not here: a request
    // that matches a static asset is served by the asset server and never
    // reaches this Worker, so headers set here would silently do nothing.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
