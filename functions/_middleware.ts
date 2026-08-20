/**
 * One canonical hostname.
 *
 * www.vastufirst.com is what every canonical tag, every Open Graph URL and the
 * sitemap point at. If someone types the bare domain, send them there rather
 * than serving the same page on two hostnames.
 *
 * This has to be code: Cloudflare's `_redirects` file matches on path, not on
 * host, so it cannot express "apex to www".
 *
 * Everything else falls straight through to the asset server, which applies
 * public/_headers as usual — verified by tools/check-headers.mjs.
 */
export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = new URL(request.url);

  if (url.hostname === 'vastufirst.com') {
    url.hostname = 'www.vastufirst.com';
    return Response.redirect(url.toString(), 301);
  }

  return next();
};
