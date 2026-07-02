"use client";

import "./hero.css";

export default function Hero() {
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="hero" id="hero">
      <div className="hero-left">
        <div className="hero-badge">
          👥 Comunitate pentru românii care călătoresc
        </div>

        <h1>
          Descoperă lumea prin{" "}
          <span>experiențe reale</span>
        </h1>

        <p>
          Postează poze, lasă recenzii, cere păreri și ajută alți români să
          aleagă următoarea destinație.
        </p>

        <div className="hero-buttons">
          <button
            className="hero-primary"
            onClick={() => scrollToSection("community")}
          >
            Intră în comunitate →
          </button>

          <button
            className="hero-secondary"
            onClick={() => scrollToSection("destinations")}
          >
            Explorează destinații ⌾
          </button>
        </div>

        <div className="hero-social">
          <div className="hero-avatars">
            <span>👩</span>
            <span>👨</span>
            <span>🧑</span>
            <span>👩‍🦱</span>
            <strong>2.5K+</strong>
          </div>

          <div>
            <p>Călători activi în comunitate</p>
            <div className="hero-rating">★★★★★ <b>4.8/5</b></div>
          </div>
        </div>
      </div>

      <div className="hero-right">
        <img
          src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1400&q=80"
          alt="Santorini travel"
        />

        <div className="hero-review-card">
          <div className="quote">“</div>
          <p>„Cea mai frumoasă experiență din viața mea!”</p>
          <span>— Andreea, Sardinia</span>
          <div className="review-dots">
            <b></b>
            <b></b>
            <b></b>
            <b></b>
          </div>
        </div>
      </div>
    </section>
  );
}