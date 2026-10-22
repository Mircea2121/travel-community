import { notFound } from "next/navigation";
import DiscoveryListing from "@/app/components/discovery/discoveryListing";
import { getDiscoveryCategory } from "@/app/utils/discovery";
import { getPublicListing } from "@/app/utils/publicSeoData";
import { pageMetadata } from "@/app/utils/seo";
export const revalidate=120;
export async function generateMetadata({params}) {
 const {slug}=await params; const category=getDiscoveryCategory(slug); if(!category) return {robots:{index:false,follow:true}};
 const data=await getPublicListing({mode:"category",value:category.slug});
 return pageMetadata(category.title+" – experiențe și recomandări",category.description,"/discover/categories/"+category.slug,{noindex:!data.posts.length});
}
export default async function CategoryDiscoveryPage({params}) {
 const {slug}=await params; const category=getDiscoveryCategory(slug); if(!category) notFound();
 const initialData=await getPublicListing({mode:"category",value:category.slug});
 return <DiscoveryListing key={category.slug} initialData={initialData} mode="category" value={category.slug} title={category.title} description={category.description} />;
}
