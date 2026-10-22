import { SITE_URL } from "./utils/seo";
export default function robots() { return { rules:{userAgent:"*",allow:"/",disallow:["/api/","/admin","/messages","/settings","/profile","/create-experience"]},sitemap:SITE_URL+"/sitemap.xml" }; }
