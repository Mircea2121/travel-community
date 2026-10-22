"use client";


import Image from "next/image";
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
        <span>Explorează lumea</span>
        <h2>Destinații populare</h2>
        <p>Primele șase țări sunt calculate automat după numărul real de experiențe publicate de comunitate.</p>
      </div>

      {isLoading ? <div className="destinations-message">Se calculează destinațiile...</div> :
       error && !countries.length ? <div className="destinations-message">{error}</div> :
       !countries.length ? <div className="destinations-message">Nu există încă destinații publicate.</div> : (
        <div className="destinations-grid">
          {countries.map((destination, index) => (
            <article className="destination-card" key={destination.key}>
              <div className="destination-image">
                <Image
                  fill
                  sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                  src={getDestinationCover(destination.key)}
                  alt={`Peisaj reprezentativ din ${destination.country}`}
                  loading="lazy"
                />
                <div className="destination-rank">#{index + 1}</div>
              </div>
              <div className="destination-content">
                <h3>{destination.country}</h3>
                <div className="destination-stats">
                  <div><strong>{destination.postsCount}</strong><span>Experiențe</span></div>
                  <div><strong>{destination.citiesCount}</strong><span>Orașe</span></div>
                </div>
                <RememberScrollLink
                  href={`/discover/destinations/${destination.key}?name=${encodeURIComponent(destination.country)}`}
                >
                  Vezi destinația
                </RememberScrollLink>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
