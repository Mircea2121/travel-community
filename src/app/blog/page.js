import BlogClient from "../components/blog/blogClient";
import { getPublicListing } from "../utils/publicSeoData";
import { pageMetadata } from "../utils/seo";
import "./blog.css";
export const revalidate=120;
export const metadata=pageMetadata("Postări de călătorie și experiențe de vacanță","Descoperă povești de vacanță, fotografii, bugete și recomandări publicate de călători români.","/blog");
export default async function BlogPage(){ const initialData=await getPublicListing(); return <BlogClient initialData={initialData} />; }
