"use client";

import { useCommunityOverview } from "@/app/components/discovery/communityOverviewProvider";
import RememberScrollLink from "@/app/components/discovery/rememberScrollLink";
import { getDestinationCover } from "@/app/utils/destinationCovers";
import "./popularDestinations.css";

export default function PopularDestinations() {
  const { data, isLoading, error } = useCommunityOverview();
  const countries = data.popularCountries;

  return (
    <section className="popular-destinations" id="destinations">
      <div className="section-header">
        <span>Exploreaza lumea</span>
        <h2>Destinatii populare</h2>
        <p>Primele sase tari sunt calculate automat dupa numarul real de experiente publicate de comunitate.</p>
      </div>

      {isLoading ? <div className="destinations-message">Se calculeaza destinatiile...</div> :
       error && !countries.length ? <div className="destinations-message">{error}</div> :
       !countries.length ? <div className="destinations-message">Nu exista inca destinatii publicate.</div> : (
        <div className="destinations-grid">
          {countries.map((destination, index) => (
            <article className="destination-card" key={destination.key}>
              <div className="destination-image">
                <img
                  src={getDestinationCover(destination.key)}
                  alt={`Peisaj reprezentativ din ${destination.country}`}
                  loading="lazy"
                />
                <div className="destination-rank">#{index + 1}</div>
              </div>
              <div className="destination-content">
                <h3>{destination.country}</h3>
                <div className="destination-stats">
                  <div><strong>{destination.postsCount}</strong><span>Experiente</span></div>
                  <div><strong>{destination.citiesCount}</strong><span>Orase</span></div>
                </div>
                <RememberScrollLink
                  href={`/discover/destinations/${destination.key}?name=${encodeURIComponent(destination.country)}`}
                >
                  Vezi destinatia
                </RememberScrollLink>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
