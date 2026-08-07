import DiscoveryListing from "@/app/components/discovery/discoveryListing";
import { getCountryDisplayName, normalizeCountryKey } from "@/app/utils/discovery";

export default async function CountryDiscoveryPage({ params, searchParams }) {
  const { country } = await params;
  const query = await searchParams;
  const key = normalizeCountryKey(country);
  const title = getCountryDisplayName(query?.name || decodeURIComponent(country).replaceAll("-", " "));
  return <DiscoveryListing mode="country" value={title || key} title={title} description={`Experiente, recomandari si locuri publicate de comunitate din ${title}.`} />;
}
