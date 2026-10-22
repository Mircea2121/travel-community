export const SITE_URL = "https://www.comunitatea-calatorilor.ro";
export const SITE_NAME = "Comunitatea Călătorilor";
export const SITE_DESCRIPTION = "Comunitatea Călătorilor: experiențe de vacanță, fotografii, bugete și recomandări împărtășite de călători români.";
export function absoluteUrl(path = "/") { return new URL(path, SITE_URL).href; }
export function summarize(text, limit = 160) { const value = String(text || "").replace(/\s+/g, " ").trim(); return value.length > limit ? value.slice(0, limit - 1).replace(/\s+\S*$/, "") + "…" : value; }
export function isIndexablePost(post) { return Boolean(post?.title?.trim() && /[\p{L}]{2}/u.test(post?.description || "")); }
export function pageMetadata(title, description, pathname, options = {}) {
 const image = options.image || absoluteUrl("/images/hero-santorini.webp");
 return { title: { absolute: title.includes(SITE_NAME) ? title : title + " | " + SITE_NAME }, description: summarize(description), alternates: { canonical: absoluteUrl(pathname) }, robots: options.noindex ? { index: false, follow: true } : { index: true, follow: true }, openGraph: { type: "website", locale: "ro_RO", siteName: SITE_NAME, title, description: summarize(description), url: absoluteUrl(pathname), images: [{ url: image }] }, twitter: { card: "summary_large_image", title, description: summarize(description), images: [image] } };
}
export function jsonLd(data) { return JSON.stringify(data).replace(/</g, String.fromCharCode(92) + "u003c"); }
