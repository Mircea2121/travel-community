import Hero from "./components/hero/hero";
import Stats from "./components/stats/stats";
import Categories from "./components/categories/categories";
import PopularDestinations from "./components/popularDestinations/popularDestinations";
import Feed from "./components/feed/feed";

export default function Home() {
  return (
    <main>
      <Hero />
      <Stats />
      <Categories />
      <PopularDestinations />
      <Feed />
    </main>
  );
}