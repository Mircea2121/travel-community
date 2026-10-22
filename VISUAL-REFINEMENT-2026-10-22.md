# Live visual refinement — 2026-10-22

Implemented directly on VPS, as requested. Local checkout was not changed or synchronized.
Active release: visual-polish-20261022-r2.
Rollback baseline: pagespeed-20261022-3652fe2-r2.

Changes: desktop search stays fully usable, calmer navigation, tablet menu at 769–1220px, shorter mobile hero and compact carousel, reduced blur and shadows, consistent homepage Romanian diacritics, destination rank contrast, accessible card names and explicit logo whitespace.

Validation: lint and production build pass; six public smoke routes pass; public-session checks pass (guest/invalid session, protected API authorization, SSR hero/preload and CSP). Web and realtime services active. Search suggestions verified visually. Authenticated two-user chat was not manually exercised.

Lighthouse on public site after visual deployment: mobile 98/100/100/100, LCP 2.0s, CLS 0; desktop 99/100/100/100, LCP 0.9s, CLS 0. A subsequent logo whitespace correction was rebuilt and smoke-tested; final desktop accessibility audit 100 with no failed binary checks. These are Lighthouse lab results, not a new PageSpeed Insights field-data report.

No dependency, environment, authentication, database or security policy changes in this refinement. Previous releases retained for rollback.
