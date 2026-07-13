"use client";

import "./categories.css";

export default function Categories() {
  const categories = [
    {
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
      title: "Plaje & Insule",
      text: "Destinații cu apă turcoaz, nisip fin și apusuri spectaculoase.",
    },
    {
      image:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
      title: "Munte & Natură",
      text: "Trasee, cabane, lacuri alpine și locuri perfecte pentru relaxare.",
    },
    {
      image:
        "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80",
      title: "City Break",
      text: "Orașe europene, cafenele, muzee, arhitectură și viață de noapte.",
    },
    {
      image:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
      title: "Food Travel",
      text: "Locuri recomandate pentru mâncare locală și experiențe culinare.",
    },
    {
      image:
        "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=1200&q=80",
      title: "Aventură",
      text: "Backpacking, road trips, camping și experiențe memorabile.",
    },
  ];

  return (
    <section className="categories-section" id="categories">
      <div className="categories-header">
        <span>Categorii populare</span>
        <h2>Alege ce fel de vacanță cauți</h2>
        <p>
          Explorează recomandări reale de la comunitate, organizate pe stilul
          tău de călătorie.
        </p>
      </div>

      <div className="categories-grid">
        {categories.map((item) => (
          <article className="category-card" key={item.title}>
            <div className="category-image">
              <img src={item.image} alt={item.title} />
            </div>

            <h3>{item.title}</h3>
            <p>{item.text}</p>

            <button onClick={() => alert(`Ai ales categoria: ${item.title}`)}>
              Vezi recomandări 
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}