import "./components/navbar/navbar.css";
import "./components/hero/hero.css";
import "./components/footer/footer.css";

import Navbar from "./components/navbar/navbar";
import Hero from "./components/hero/hero";
import Footer from "./components/footer/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Footer />
    </>
  );
}