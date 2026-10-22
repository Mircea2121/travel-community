# Premium experience composer and post presentation

Implemented directly on VPS, with local checkout untouched.
Active release: /var/www/travel-community/releases/premium-posts-20261022
Rollback: /var/www/travel-community/releases/seo-20261022-r2

## Scope
Create form retains all nine original field names, required flags, character limits, category values, image types/count/size limits and original change/image/remove/submit handlers. Presentation grouped into three sections with guide sidebar and keyboard-accessible photo selection. No data model or API changes.
Image preview cleanup now releases only the removed/replaced URLs and cleans the remaining URLs on unmount; it no longer revokes all surviving previews after removing one.
Post title and trip metadata precede the author/gallery. Existing public story and tips appear alongside a trip summary with formatted cost. Action/comment styles are scoped to the post page.
Gallery arrows, wrapping, fullscreen, originals, Escape and keyboard arrows retained. Fullscreen gains initial focus, Tab containment and focus restoration. Main Cloudinary image uses Next Image optimization; original URL remains in fullscreen, non-Cloudinary images retain the original rendering fallback.
Author heading changed to text for correct document outline; labels match visible content. No new font downloads or dependencies.

## Preservation checks
API, realtime/chat, edit page, post hooks, comment/reply/report modules were compared against baseline and unchanged. Owner edit/delete callbacks remain unchanged; author presentation alone changed semantically. Exact form fields/validation and full handler block were compared and match baseline.
No environment, certificate, authentication, database, user content or security policy changes.

## Validation
Lint and production build pass. SEO integration test covers all 18 sitemap URLs, SSR, canonicals, noindex, redirects and script escaping. All six public smoke routes and public-session tests pass after deployment; web and realtime services active.
Browser checks: two-photo selection and previews; removal of first photo leaves remaining preview loaded and updates cover; native required validation blocks submission; gallery next image; optimized second image loads; fullscreen; keyboard arrow; Shift+Tab focus containment; Escape restores focus.
Mobile layouts checked at default Lighthouse mobile viewport and narrow 320px.
Composer preview mobile: 98 performance /100 accessibility /100 best practices.
Final public example post: 99 performance /100 accessibility /100 best practices /100 SEO; LCP 1.9s, CLS 0, total transfer 271 KiB. This is a Lighthouse lab test on /posts/6aa598dfe2ae326a86e78120, not a new PageSpeed Insights report.
No test posts/comments were created in production. Full authenticated publish/edit/delete/comment/reply/report/save/like/chat flows were not exercised end to end; unchanged logic and API contracts were verified instead.

## Future deployments
Carry this release's source changes and previous SEO changes forward; an older local checkout does not include them. Preserve the Google verification file. Previous release is retained for atomic symlink rollback followed by restarting travel-community-web and travel-community-realtime.
