"use client";

import "./popularDestinations.css";
import { destinations } from "../../data/destinations";

export default function PopularDestinations() {
  return (
    <section className="popular-destinations" id="destinations">
      <div className="section-header">
        <span>Explorează lumea</span>

        <h2>Destinații populare</h2>

        <p>
          Alege o destinație și descoperă experiențele publicate de comunitate.
          Numărul de experiențe, ratingul și orașele vor fi calculate automat
          din baza de date.
        </p>
      </div>

      <div className="destinations-grid">
        {destinations.map((destination) => (
          <article
            className="destination-card"
            key={destination.id}
          >
            <div className="destination-image">
              <img
                src={destination.coverImage}
                alt={destination.country}
              />

              <div className="destination-rating">
                ⭐ {destination.averageRating}
              </div>
            </div>

            <div className="destination-content">
              <h3>{destination.country}</h3>

              <div className="destination-stats">
                <div>
                  <strong>{destination.experiencesCount}</strong>
                  <span>Experiențe</span>
                </div>

                <div>
                  <strong>{destination.citiesCount}</strong>
                  <span>Orașe</span>
                </div>
              </div>

              <button
                onClick={() => {
                  // Mai târziu:
                  // router.push(`/destinations/${destination.slug}`)

                  alert(
                    `În viitor vei intra pe pagina ${destination.country}.`
                  );
                }}
              >
                Vezi destinația →
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}