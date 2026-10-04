# Acrilchapas website · local prototype

Frontend repository: [Acrilchapas-Website](https://github.com/Mxrider420z/Acrilchapas-Website). The factory backend, commerce API, provider integrations and operating documentation live separately in [Acrilchapas-System](https://github.com/Mxrider420z/Acrilchapas-System). Neither repository contains runtime credentials or databases.

Responsive Portuguese, English and Spanish website with catalog, exports, dimension/area entry, quote basket, draft downloads, explicit local inquiries and a private customer portal. `/staff` provides authenticated sales review, offers, orders, demonstration stock and shipment. Orders and payment simulation work locally; no real payment, marketplace listing or automatic message is sent.

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:5173/pt. Equivalent routes: `/en`, `/es`, and `/{locale}/catalog`. The local draft is not a submitted request; catalog dimensions, colors, stock and prices need factory validation. Brand artwork is a proposed direction made with code-native SVG/CSS, not a claim to be the approved company logo or physical product photography.

To load the persistent demonstration catalog and save local inquiries, run `npm run dev:commerce` from the system project in a separate terminal. Vite development and preview proxy `/api` to `http://127.0.0.1:8001`. If that service is unavailable, the website labels its bundled examples and still supports draft download. Static build hosting must supply its own same-origin `/api` proxy; no service credentials belong in browser environment variables.

“Save local inquiry” explicitly stores contact details, delivery destination, notes and material dimensions in the system project's local commerce database and displays an opaque reference. The factory is not notified. A repeated save with identical data reuses the reference, including retries after an interrupted response; changed input creates a new inquiry. Retry state and contact details stay in page memory, so refreshing the page clears them. Browser basket clearing does not delete records already saved in the service; the environment operator controls that database. This is a local demonstration, without approved commercial stock or prices.

```bash
npm test
npm run build
npm run test:browser
npm run test:browser -- --commerce
npm run test:workflow
npm run test:workflow -- --built
```

Browser tests require Playwright Chromium. Tests cover language switching, filtering, numeric entry, quote download, storage persistence, mobile menu and horizontal overflow. `--commerce` requires the real local service and adds catalog loading, Portuguese/English/Spanish receipts, retry idempotency including a lost response after storage, changed-input submissions, private browser storage, mobile layout and offline fallback. It creates clearly named demonstration inquiries with an `example.test` email address. `npm run test:browser -- --factory` additionally checks the sibling local InvenTree application using the ignored system `.local/admin-credentials.json`. This optional factory test assumes the current staging layout; update its credentials-file path after moving the project, or run only the website tests.

There are no provider secrets in this package. The backend stages restricted factory exports for review and implements test-account Mercado Pago/Mercado Livre adapters. Staff integration actions require administrator session/CSRF and an explicit configured test account. Live operation is disabled. Factory browser tokens never enter the public website. Customer capability tokens stay in private URL fragments and scoped Authorization headers.

From the system root, `npm run build:website` and `npm run start:built` serve this build plus its API at http://127.0.0.1:8080. This is a local Gunicorn preview, with no external host/proxy configured. It uses the same persistent commerce data as Vite. Staff login credentials are in the ignored system `.local/commerce.admin.json`.

The main system documentation includes competitor research and architecture. This independent repository is currently checked out at `/home/mx/Acrilchapas System/website-staging`; the system repository ignores that directory. The intended sibling location is not writable in this workspace, so the files were not moved. Publishing source to GitHub does not deploy the applications.

For integrated local development, clone this repository into `website-staging/` inside a checkout of `Acrilchapas-System`. System npm commands and the built preview expect that layout; optional authenticated browser tests locate the system's ignored credentials at `../../.local/` relative to their scripts. In a standalone checkout, `npm ci`, `npm test` and `npm run build` work independently. Vite API features still require the system service on port 8001, and factory links target port 8000. See the system's [repository setup guide](https://github.com/Mxrider420z/Acrilchapas-System/blob/main/docs/repositories.md).

Before a public launch: approved product/media/contact content, server-rendered product SEO and hreflang/sitemap, a production quotation workflow and retention policy, legal pages, shipping/tax behavior, provider sandbox tests, and production deployment configuration. The HTML is currently `noindex,nofollow`; the prototype privacy notice describes its current local behavior only.
