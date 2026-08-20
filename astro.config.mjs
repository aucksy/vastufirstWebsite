// @ts-check
import { defineConfig } from 'astro/config';

// Static output. The page is one route plus a couple of legal pages; there is no
// server rendering to do. The only dynamic thing on the site — the waitlist POST —
// is handled by the Worker in ../worker/index.ts, which serves this dist/ folder.
export default defineConfig({
  site: 'https://www.vastufirst.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    // One page, one stylesheet — inlining beats a second round trip.
    inlineStylesheets: 'always',
    format: 'file',
  },
  compressHTML: true,
  devToolbar: { enabled: false },
});
