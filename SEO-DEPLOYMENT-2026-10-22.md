# SEO deployment — 2026-10-22

Implemented directly on VPS at the user's request. Local checkout was not changed.
Active release: /var/www/travel-community/releases/seo-20261022-r2
Rollback baseline: /var/www/travel-community/releases/visual-polish-20261022-r2
Preserve public/google1acdcf11913d9841.html in future deployments to retain the approved Google verification. Future releases must carry these source changes; deploying the older local checkout would remove them.

## Implemented
- Sitemap generated from public, non-placeholder posts, populated category/country pages, and useful static pages; real content modification dates only. 18 URLs currently. Revalidation every 5 minutes.
- robots.txt with sitemap discovery and crawler rules for private/application endpoints. Account/utility pages and placeholder posts have noindex metadata. Content has not been deleted or edited in the database.
- Absolute www canonical URLs and unique title/description, Open Graph and Twitter metadata. Permanent apex-to-www redirects for document routes preserve query strings and exclude API, Next assets and Socket.IO.
- Homepage and blog have server-rendered public post cards; categories/countries and individual posts render public content from the server. Public-only projections, no session/account data caching. Existing authenticated interactions remain in client components.
- Crawlable anchor links in desktop navigation, footer, cards and homepage CTA.
- WebSite structured data including Romanian brand name and alternate name; SocialMediaPosting data describing real visible content. Script termination escaping tested.
- Original /despre-noi and /ghid-publicare pages linked in the navigation/footer.
- Post detail session reads use shared optional session; saved-state API only for authenticated users. Existing protected API authorization retained.
- Explicit Europe/Bucharest date formatting fixes SSR/browser hydration differences.

## Validation
Lint and production build passed (Next.js 16.4.2, 55 generated static pages).
node scripts/testSeo.mjs passed before/after live publication, covering all 18 sitemap URLs, canonicals, SSR content/links, JSON-LD, noindex, missing routes, query-preserving host redirect and protected/anonymous API behavior. Raw HTTP request required for custom Host testing; fetch does not preserve that override.
Six production smoke routes and public-session tests passed on https://www.comunitatea-calatorilor.ro. Web/realtime services active. Full authenticated two-user chat was not manually exercised.
Final public Lighthouse: mobile 97 performance /100 accessibility /100 best practices /100 SEO, desktop 99/100/100/100, CLS 0 on both. Initial hydration exception was corrected and absent in final audits.

## Google Search Console — observed outcomes
URL-prefix property verified by approved HTML file for the Google account explicitly confirmed by the user.
Sitemap submitted; Google processed it and discovered 18 pages.
Homepage index inspection: Discovered, currently not indexed. No previous crawl recorded in that inspection.
Google live test: URL available to Google, page can be indexed.
Homepage indexing request accepted into priority crawl queue.
Manual actions: no issues detected. Security issues: no issues detected.
Property is new; performance/indexing aggregate reports are still processing. No claim of actual indexing or first-page placement has been made.

## Remaining SEO work
Google must crawl, select canonical URLs, index and rank the content; a request is not confirmation of indexing or a ranking guarantee. The site currently has four public experiences; one clear placeholder description is excluded from the sitemap/indexing. Develop detailed original member experiences and editorial references/links. Do not invent reviews, backlinks or travel experiences. Review Search Console after it accumulates data, prioritizing indexed pages and impressions for the brand phrase.

## Rollback
Atomically point /var/www/travel-community/current at the retained baseline release and restart travel-community-web and travel-community-realtime. Preserve the Google verification HTML file if rolling back. Production shared environment and security policy were not changed by this SEO deployment.
