import Hero from "./components/hero/hero";
import Stats from "./components/stats/stats";
import Categories from "./components/categories/categories";
import PopularDestinations from "./components/popularDestinations/popularDestinations";
import Feed from "./components/feed/feed";
import About from "./components/about/about";
import FlagBackground from "./components/flagBackground/flagBackground";

export default function Home() {
  return (
    <main className="home-page">
      <FlagBackground />

      <div className="home-page-content">
        <Hero />
        <Stats />
        <Categories />
        <PopularDestinations />
        <Feed />
        <About />
      </div>
    </main>
  );
}