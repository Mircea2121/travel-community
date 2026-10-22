import { notFound, permanentRedirect } from "next/navigation";
import DiscoveryListing from "@/app/components/discovery/discoveryListing";
import { normalizeCountryKey } from "@/app/utils/discovery";
import { getPublicCountries, getPublicListing } from "@/app/utils/publicSeoData";
import { pageMetadata } from "@/app/utils/seo";
export const revalidate=120;
async function countryFor(slug) { return (await getPublicCountries()).find(c=>c.key===normalizeCountryKey(slug)); }
export async function generateMetadata({params}) {
 const {country}=await params; const item=await countryFor(country); if(!item) return {robots:{index:false,follow:true}};
 return pageMetadata(item.name+" – experiențe de vacanță și recomandări","Experiențe, fotografii, bugete și sfaturi de călătorie din "+item.name+", publicate de membrii comunității.","/discover/destinations/"+item.key);
}
export default async function CountryDiscoveryPage({params}) {
 const {country}=await params; const item=await countryFor(country); if(!item) notFound();
 if(country!==item.key) permanentRedirect("/discover/destinations/"+item.key);
 const initialData=await getPublicListing({mode:"country",value:item.name});
 return <DiscoveryListing key={item.key} initialData={initialData} mode="country" value={item.name} title={item.name} description={"Experiențe, recomandări și locuri publicate de comunitate din "+item.name+"."} />;
}
