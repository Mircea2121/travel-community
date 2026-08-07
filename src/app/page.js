import Hero from "./components/hero/hero";
import Stats from "./components/stats/stats";
import Categories from "./components/categories/categories";
import PopularDestinations from "./components/popularDestinations/popularDestinations";
import Feed from "./components/feed/feed";
import About from "./components/about/about";
import FlagBackground from "./components/flagBackground/flagBackground";
import CommunityOverviewProvider from "./components/discovery/communityOverviewProvider";
import HomeScrollRestorer from "./components/discovery/homeScrollRestorer";

export default function Home() {
  return (
    <main className="home-page">
      <HomeScrollRestorer />
      <FlagBackground />
      <div className="home-page-content">
        <Hero />
        <CommunityOverviewProvider>
          <Stats />
          <Categories />
          <PopularDestinations />
        </CommunityOverviewProvider>
        <Feed />
        <About />
      </div>
    </main>
  );
}
