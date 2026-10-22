import { getSitemapPosts } from "./utils/publicSeoData";
import { absoluteUrl, isIndexablePost } from "./utils/seo";
import { DISCOVERY_CATEGORY_GROUPS, normalizeCountryKey } from "./utils/discovery";
export const revalidate = 300;
export default async function sitemap() {
 const posts=(await getSitemapPosts()).filter(isIndexablePost);
 const entries=["/","/blog","/despre-noi","/ghid-publicare","/contact","/regulament","/termeni","/confidentialitate","/cookies"].map(p=>({url:absoluteUrl(p)}));
 for(const category of DISCOVERY_CATEGORY_GROUPS) if(posts.some(p=>category.categories.includes(p.category))) entries.push({url:absoluteUrl("/discover/categories/"+category.slug)});
 for(const key of new Set(posts.map(p=>normalizeCountryKey(p.country)).filter(Boolean))) entries.push({url:absoluteUrl("/discover/destinations/"+key)});
 for(const post of posts) { const date=post.updatedAt || post.createdAt; entries.push({url:absoluteUrl("/posts/"+post._id),...(date && !Number.isNaN(new Date(date).getTime()) ? {lastModified:new Date(date)} : {})}); }
 return entries;
}
