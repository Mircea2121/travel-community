import { notFound } from "next/navigation";
import DiscoveryListing from "@/app/components/discovery/discoveryListing";
import { getDiscoveryCategory } from "@/app/utils/discovery";

export default async function CategoryDiscoveryPage({ params }) {
  const { slug } = await params;
  const category = getDiscoveryCategory(slug);
  if (!category) notFound();
  return <DiscoveryListing mode="category" value={category.slug} title={category.title} description={category.description} />;
}
