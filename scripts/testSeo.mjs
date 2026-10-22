import { request } from "node:http";
import assert from "node:assert/strict";
import { jsonLd, isIndexablePost } from "../src/app/utils/seo.js";
const base=process.env.SMOKE_BASE_URL || "http://127.0.0.1:3002";
const origin="https://www.comunitatea-calatorilor.ro";
const get=async path=>{const r=await fetch(new URL(path,base));return {r,html:await r.text()};};
const canonical=html=>html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
const title=html=>html.match(/<title>(.*?)<\/title>/s)?.[1];
const documentOnly=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,"");
const {r:robots,html:rules}=await get('/robots.txt');assert.equal(robots.status,200);assert.match(rules,/Sitemap: https:\/\/www\.comunitatea-calatorilor\.ro\/sitemap\.xml/);assert.doesNotMatch(rules,/Disallow: \/\s*$/m);
const {r:mapResponse,html:map}=await get('/sitemap.xml');assert.equal(mapResponse.status,200);assert.match(mapResponse.headers.get('content-type'),/xml/);
const urls=[...map.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);assert.equal(new Set(urls).size,urls.length);assert.ok(urls.length>=10);
for(const url of urls) {assert.ok(url.startsWith(origin+'/'));assert.doesNotMatch(url,/\?|\/api\/|\/login|\/messages/);const {r,html}=await get(new URL(url).pathname);assert.equal(r.status,200,url);assert.equal(new URL(canonical(html)).href,new URL(url).href,url);assert.ok(title(html),url);assert.doesNotMatch(html,/<meta name="robots" content="[^"]*noindex/,url);}
const {html:home}=await get('/');assert.match(documentOnly(home),/href="\/posts\/[a-f0-9]{24}"/);assert.match(home,/"@type":"WebSite"/);assert.match(title(home),/Comunitatea Călătorilor/);
const {html:blog}=await get('/blog');assert.match(documentOnly(blog),/href="\/posts\/[a-f0-9]{24}"/);assert.equal((blog.match(/<main\b/g)||[]).length,1);
const postUrls=urls.filter(url=>url.includes('/posts/'));assert.ok(postUrls.length);
for(const url of postUrls) {const {html}=await get(new URL(url).pathname);assert.match(documentOnly(html),/<h1[^>]*>[^<]+/);assert.match(html,/"@type":"SocialMediaPosting"/);assert.notEqual(title(html),title(home));for(const script of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(script[1]);}
const publicPosts=await (await fetch(base+'/api/posts/popular?limit=12')).json();
for(const post of publicPosts.posts) { const expected=new Intl.DateTimeFormat("ro-RO",{day:"numeric",month:"short",year:"numeric",timeZone:"Europe/Bucharest"}).format(new Date(post.createdAt)); assert.ok(home.includes(expected),'Stable Romanian date: '+expected); }
for(const post of publicPosts.posts)if(!isIndexablePost(post)){const {html}=await get('/posts/'+post._id);assert.match(html,/<meta name="robots" content="[^"]*noindex/);assert.ok(!map.includes('/posts/'+post._id));}
for(const route of ['/login','/register','/messages','/search','/settings']){const {html}=await get(route);assert.match(html,/<meta name="robots" content="[^"]*noindex/,route);assert.notEqual(canonical(html),origin+'/');}
for(const route of ['/posts/invalid','/posts/000000000000000000000000','/discover/categories/no-such-category','/discover/destinations/no-such-country']){const {r,html}=await get(route);assert.ok(r.status===404 || /<meta name="robots" content="[^"]*noindex/.test(html),route+' must be 404 or streamed noindex');}
const session=await fetch(base+'/api/auth/session');assert.equal(session.status,200);assert.equal((await session.json()).user,null);
const protectedApi=await fetch(base+'/api/auth/me');assert.equal(protectedApi.status,401);
const encoded=jsonLd({headline:'</script><script>alert(1)</script>'});assert.ok(!encoded.includes('<'));assert.equal(JSON.parse(encoded).headline,'</script><script>alert(1)</script>');
const verify=await get('/google1acdcf11913d9841.html');assert.equal(verify.r.status,200);assert.equal(verify.html.trim(),'google-site-verification: google1acdcf11913d9841.html');
if(new URL(base).hostname==='127.0.0.1'){
 const raw=path=>new Promise((resolve,reject)=>{const req=request(new URL(path,base),{headers:{Host:'comunitatea-calatorilor.ro'}},res=>{res.resume();resolve(res);});req.on('error',reject);req.end();});
 const redirect=await raw('/blog?source=seo');assert.equal(redirect.statusCode,308);assert.equal(redirect.headers.location,origin+'/blog?source=seo');
 const api=await raw('/api/auth/session');assert.equal(api.statusCode,200);
}

console.log('PASS SEO: '+urls.length+' sitemap URLs, canonicals, server-rendered links/content, structured data, noindex, missing pages, domain redirect, guest auth and script escaping');
