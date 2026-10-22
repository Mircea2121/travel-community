import "server-only";
import { cache } from "react";
import { ObjectId } from "mongodb";
import { getPostsCollection } from "./database";
import { getPublicAuthorProfilesByIds, hydratePublicAuthor } from "./publicUser";
import { getDiscoveryCategory, normalizeCountryKey, getCountryDisplayName } from "./discovery";
// Only fields already public in the post API are serialized. Never share session or account records.
const projection = { _id:1, authorId:1, title:1, destination:1, country:1, countryKey:1, city:1, category:1, travelPeriod:1, totalCost:1, currency:1, description:1, tips:1, images:1, likesCount:1, commentsCount:1, savesCount:1, createdAt:1, updatedAt:1 };
async function hydrate(rows) {
 const profiles = await getPublicAuthorProfilesByIds(rows.map(p => p.authorId));
 return rows.map(row => JSON.parse(JSON.stringify({ ...hydratePublicAuthor(row, profiles, {userIdField:"authorId"}), _id:String(row._id), id:String(row._id), authorId:String(row.authorId || ""), isLiked:false, isSaved:false })));
}
export const getPublicPost = cache(async (id) => {
 if (!/^[a-f0-9]{24}$/i.test(String(id))) return null;
 const collection = await getPostsCollection();
 const post = await collection.findOne({_id:new ObjectId(id)}, {projection});
 return post ? (await hydrate([post]))[0] : null;
});
export const getPublicCountries = cache(async () => {
 const collection = await getPostsCollection();
 const rows = await collection.aggregate([{ $group:{ _id:"$country", count:{$sum:1} } }]).toArray();
 const countries = new Map();
 for (const row of rows) { const key=normalizeCountryKey(row._id); if(!key) continue; const previous=countries.get(key); countries.set(key,{key,name:getCountryDisplayName(row._id),count:(previous?.count || 0)+row.count}); }
 return [...countries.values()].sort((a,b)=>b.count-a.count);
});
export const getPublicListing = cache(async ({mode="all", value="", page=1, limit=12, popular=false}={}) => {
 const collection = await getPostsCollection();
 const filter = {};
 if(mode==="category") { const category=getDiscoveryCategory(value); if(!category) return {posts:[],pagination:{hasMore:false,nextCursor:null}}; filter.category={$in:category.categories}; }
 if(mode==="country") {
  const country=(await getPublicCountries()).find(c=>c.key===normalizeCountryKey(value));
  if(!country) return {posts:[],pagination:{hasMore:false,nextCursor:null}};
  const escaped=country.name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  filter.$or=[{countryKey:country.key},{country:{$regex:"^"+escaped+"$",$options:"i"}}];
 }
 const sort=popular ? {engagementScore:-1,createdAt:-1,_id:-1} : {createdAt:-1,_id:-1};
 const rows=await collection.find(filter,{projection}).sort(sort).skip((page-1)*limit).limit(limit+1).toArray();
 const hasMore=rows.length>limit; const selected=rows.slice(0,limit); const last=selected.at(-1);
 const posts=await hydrate(selected);
 return {posts,pagination:{hasMore,nextCursor:hasMore && last?.createdAt ? Buffer.from(JSON.stringify({createdAt:new Date(last.createdAt).toISOString(),id:String(last._id)})).toString("base64url"):null}};
});
export async function getSitemapPosts() {
 const collection=await getPostsCollection();
 const rows=await collection.find({}, {projection:{_id:1,title:1,description:1,country:1,category:1,createdAt:1,updatedAt:1}}).toArray();
 return rows.map(p=>({...p,_id:String(p._id)}));
}
