# Public game deployment

Play [Babelwake](https://babelwake.jappleton.com/). The site uses Cloudflare Workers Static Assets in the existing account and `jappleton.com` zone. It contains only the built `dist/` files; there is no Worker script, backend, account system or uploaded source tree. `workers.dev` and preview URLs are disabled.

`wrangler.jsonc` records the exact hostname and static routing. Directory index handling serves `/` from `index.html`; missing files return 404. The custom domain manages its own hostname DNS and TLS certificate. Do not change unrelated records, zone settings, plans or services.

## Release procedure

Use an isolated checkout of merged `main`, Node.js 22.12 or newer, and the existing authorized Cloudflare account connection. Validate before publication:

```sh
npm ci
npm run check
PLAYWRIGHT_BROWSERS_PATH=<browser-cache> BABELWAKE_PRODUCTION=1 npm run test:e2e
```

The configuration targets Wrangler 4.156.0. With an already authorized local login or existing deployment credential, deploy the built directory:

```sh
npm exec --yes --package=wrangler@4.156.0 -- wrangler deploy --config wrangler.jsonc
```

If authentication is unavailable, use the connected Cloudflare deployment tools or obtain explicit approval for new persistent credentials. Do not silently create an API token, add CI secrets or expand account permissions. The initial release used the existing connector and the documented one-hour asset upload session, with tokens kept in memory. No persistent credential or GitHub integration was added.

After publication, compare every served asset with `dist/`, check trusted HTTPS and the initial rendered game, then test a normal note edit through reload and a service-worker-controlled offline reload. Confirm all six lazy zone chunks are cached before declaring offline play verified. Keep the source commit, Cloudflare version/deployment IDs and observed results with the release record.

Cloudflare documents static asset requests as free and unlimited, with no asset storage charge: [billing and limits](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/). This configuration has no Worker code or paid bindings. Future dynamic features or plan changes require a fresh cost check.

## Initial public release — 31 October 2026

- Game version: `1.0.0`.
- Game content and entrypoint source: [`83499449c57dc6e14850063e6387f7f62c7aa3a6`](https://github.com/hardlystandard/babelwake/commit/83499449c57dc6e14850063e6387f7f62c7aa3a6), the merge of [PR #3](https://github.com/hardlystandard/babelwake/pull/3). The public-hosting change additionally corrects the generated service worker's offline fallback.
- Final source commit, Cloudflare version/deployment IDs and observed live checks belong in the [GitHub release notes](https://github.com/hardlystandard/babelwake/releases).
- HTML SHA-256: `efcd7d8816bf1f46e7c7a8b1d65d61579840ff9c316261320dae3ea151ec2a0b`.
- Entry JavaScript SHA-256: `77712f3ec652b4ec4a8c24c069d9e1dfe44fc145ed7aab22a50f6d70dbbb5eed` (`assets/index-XyXSw7sS.js`).
- Fixed service worker SHA-256: `26ebb60ee55e004d45da8ea0636911448932e3badb4ef5fabac87420c735e123` (`sw.js`). This identifies the offline fix; HTML and game JavaScript are unchanged.

The existing local Wrangler OAuth session had expired; it was not replaced. The connected Cloudflare account performed resource creation and deployment. A temporary upload-session token uploaded the assets without writing a credential file. The only hostname created was `babelwake.jappleton.com`.

The first live offline check caught a hosting-specific problem: automatic HTML routing redirects `/index.html` to `/`. Chromium rejects that cached redirected response as an offline navigation fallback. The service worker now uses the already-precached root response instead. A real-server regression reproduces that redirect, followed by actual offline navigation and later-zone loading; the ordinary static-preview offline test remains in place.

Native-speaker and zero-French participant acceptance remain unverified; publication does not imply those outcomes. See [verification](VERIFICATION.md) and [playtest criteria](PLAYTEST.md).
