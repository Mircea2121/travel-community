import { getPublicListing } from "./utils/publicSeoData";
import { pageMetadata, SITE_NAME, SITE_DESCRIPTION, SITE_URL, jsonLd } from "./utils/seo";
import Hero from "./components/hero/hero";
import Stats from "./components/stats/stats";
import Categories from "./components/categories/categories";
import PopularDestinations from "./components/popularDestinations/popularDestinations";
import Feed from "./components/feed/feed";
import About from "./components/about/about";
import FlagBackground from "./components/flagBackground/flagBackground";
import CommunityOverviewProvider from "./components/discovery/communityOverviewProvider";
import HomeScrollRestorer from "./components/discovery/homeScrollRestorer";

export const revalidate = 120;
export const metadata = pageMetadata("Comunitatea Călătorilor – experiențe și recomandări de vacanță", SITE_DESCRIPTION, "/");
export default async function Home() {
 const {posts} = await getPublicListing({limit:6,popular:true});
  return (
    <div className="home-page">
      <HomeScrollRestorer />
      <FlagBackground />
      <div className="home-page-content">
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd({"@context":"https://schema.org","@type":"WebSite","@id":SITE_URL+"/#website",url:SITE_URL+"/",name:SITE_NAME,alternateName:"Comunitatea Calatorilor",description:SITE_DESCRIPTION,inLanguage:"ro-RO"})}} />
        <Hero />
        <CommunityOverviewProvider>
          <Stats />
          <Categories />
          <PopularDestinations />
        </CommunityOverviewProvider>
        <Feed initialPosts={posts} />
        <About />
      </div>
    </div>
  );
}
