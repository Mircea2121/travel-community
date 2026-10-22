import { notFound } from "next/navigation";
import PostDetailsClient from "./postDetailsClient";
import { getPublicPost } from "../../utils/publicSeoData";
import { pageMetadata, isIndexablePost, absoluteUrl, jsonLd, summarize } from "../../utils/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata({params}) {
 const {id}=await params; const post=await getPublicPost(id);
 if(!post) return {title:"Postare negăsită",robots:{index:false,follow:true}};
 const image=post.images?.[0];
 return pageMetadata(post.title, summarize(post.description) || "Experiență de călătorie în "+post.country, "/posts/"+id,{image:typeof image==="string"?image:image?.url,noindex:!isIndexablePost(post)});
}
export default async function PostPage({params}) {
 const {id}=await params; const post=await getPublicPost(id); if(!post) notFound();
 const schema={"@context":"https://schema.org","@type":"SocialMediaPosting",headline:post.title,description:summarize(post.description),articleBody:post.description,inLanguage:"ro-RO",url:absoluteUrl("/posts/"+id),mainEntityOfPage:absoluteUrl("/posts/"+id),...(post.name?{author:{"@type":"Person",name:post.name,...(post.username?{url:absoluteUrl("/users/"+encodeURIComponent(post.username))}:{})}}:{}),...(post.createdAt?{datePublished:post.createdAt}:{}),...(post.updatedAt?{dateModified:post.updatedAt}:{}),image:(post.images || []).map(i=>typeof i==="string"?i:i.url).filter(Boolean)};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}} /><PostDetailsClient initialPost={post} /></>;
}
