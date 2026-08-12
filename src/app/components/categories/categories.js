/* eslint-disable @next/next/no-img-element -- Imagine editorială externă cu dimensiune controlată integral prin cardul responsive. */
import { DISCOVERY_CATEGORY_GROUPS } from "@/app/utils/discovery";
import RememberScrollLink from "@/app/components/discovery/rememberScrollLink";
import "./categories.css";

const IMAGES = {
  "plaje-insule": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
  "munte-natura": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
  "city-break": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80",
  "food-travel": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
  aventura: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=1200&q=80",
};

export default function Categories() {
  return (
    <section className="categories-section" id="categories">
      <div className="categories-header">
        <span>Categorii populare</span>
        <h2>Alege ce fel de vacanta cauti</h2>
        <p>Exploreaza recomandari reale de la comunitate, organizate pe stilul tau de calatorie.</p>
      </div>
      <div className="categories-grid">
        {DISCOVERY_CATEGORY_GROUPS.map((item) => (
          <article className="category-card" key={item.slug}>
            <div className="category-image"><img src={IMAGES[item.slug]} alt="" loading="lazy" /></div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <RememberScrollLink
              className="category-card-link"
              href={`/discover/categories/${item.slug}`}
            >
              Vezi recomandari
            </RememberScrollLink>
          </article>
        ))}
      </div>
    </section>
  );
}
