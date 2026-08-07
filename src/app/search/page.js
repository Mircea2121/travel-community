"use client";

import "./search.css";

import {
  ArrowRight,
  Compass,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getUserInitials } from "../utils/getUserInitials";

const RESULT_LIMIT = 18;

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function SearchAvatar({ profile, size = 58 }) {
  const [failedUrl, setFailedUrl] = useState("");
  const avatar = profile?.avatar || "";
  const showImage = Boolean(avatar) && avatar !== failedUrl;

  return (
    <span
      className="search-result-avatar"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {showImage ? (
        <Image
          src={avatar}
          alt=""
          width={size}
          height={size}
          sizes={`${size}px`}
          onError={() => setFailedUrl(avatar)}
        />
      ) : (
        getUserInitials(profile)
      )}
    </span>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q")?.trim() || "";
  const typeFromUrl = searchParams.get("type") || "all";

  const [inputValue, setInputValue] = useState(queryFromUrl);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedType = ["all", "profiles", "experiences"].includes(
    typeFromUrl
  )
    ? typeFromUrl
    : "all";

  const loadResults = useCallback(async (signal) => {
    if (queryFromUrl.length < 2) {
      setData(null);
      setError("");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        q: queryFromUrl,
        type: selectedType,
        limit: String(RESULT_LIMIT),
      });

      const response = await fetch(`/api/search?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        signal,
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Căutarea nu a reușit.");
      }

      setData(payload);
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setData(null);
        setError(requestError.message || "Căutarea nu este disponibilă.");
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [queryFromUrl, selectedType]);

  useEffect(() => {
    const effectTimeout = window.setTimeout(() => {
      setInputValue(queryFromUrl);
      loadResults(controller.signal);
    }, 0);
    const controller = new AbortController();

    return () => {
      window.clearTimeout(effectTimeout);
      controller.abort();
    };
  }, [loadResults, queryFromUrl]);

  const resultCount = data?.counts?.total || 0;
  const profiles = data?.results?.profiles || [];
  const destinations = data?.results?.destinations || [];
  const experiences = data?.results?.experiences || [];

  const tabs = useMemo(
    () => [
      { value: "all", label: "Toate" },
      { value: "profiles", label: "Profiluri" },
      { value: "experiences", label: "Destinații și experiențe" },
    ],
    []
  );

  function submitSearch(event) {
    event.preventDefault();
    const query = inputValue.trim().replace(/\s+/g, " ");

    if (query.length < 2) {
      setError("Scrie cel puțin 2 caractere.");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(query)}&type=${selectedType}`);
  }

  function selectType(type) {
    if (queryFromUrl) {
      router.push(
        `/search?q=${encodeURIComponent(queryFromUrl)}&type=${type}`,
        { scroll: false }
      );
    }
  }

  return (
      <div className="search-page">
        <section className="search-hero">
          <span className="search-hero-label">
            <Search size={17} /> Căutare comunitatea-calatorilor
          </span>

          <h1>Descoperă oameni și experiențe</h1>
          <p>
            Caută după nume, username, țară, oraș, destinație sau conținutul
            unei experiențe.
          </p>

          <form className="search-page-form" onSubmit={submitSearch}>
            <Search size={22} aria-hidden="true" />
            <input
              type="search"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Exemplu: Roma, Italia sau Nume Utilizatori"
              aria-label="Caută în comunitate"
              maxLength={80}
              autoFocus
            />
            <button type="submit">Caută</button>
          </form>
        </section>

        {queryFromUrl.length >= 2 && (
          <section className="search-results-shell" aria-live="polite">
            <div className="search-results-header">
              <div>
                <span>Rezultate pentru</span>
                <h2>„{queryFromUrl}”</h2>
              </div>

              {!isLoading && !error && (
                <strong>
                  {resultCount} {resultCount === 1 ? "rezultat" : "rezultate"}
                </strong>
              )}
            </div>

            <div className="search-tabs" role="tablist" aria-label="Tip rezultate">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={selectedType === tab.value ? "active" : ""}
                  onClick={() => selectType(tab.value)}
                  role="tab"
                  aria-selected={selectedType === tab.value}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {isLoading && (
              <div className="search-state">
                <span className="search-spinner" />
                <h3>Căutăm cele mai relevante rezultate...</h3>
              </div>
            )}

            {!isLoading && error && (
              <div className="search-state search-state-error">
                <Search size={34} />
                <h3>Căutarea nu a putut fi finalizată</h3>
                <p>{error}</p>
                <button type="button" onClick={() => loadResults(new AbortController().signal)}>
                  Încearcă din nou
                </button>
              </div>
            )}

            {!isLoading && !error && data && resultCount === 0 && (
              <div className="search-state">
                <Compass size={38} />
                <h3>Nu am găsit rezultate</h3>
                <p>Încearcă alt nume, oraș, țară sau un termen mai scurt.</p>
              </div>
            )}

            {!isLoading && !error && profiles.length > 0 && (
              <section className="search-group">
                <div className="search-group-title">
                  <UserRound size={21} />
                  <h3>Profiluri</h3>
                </div>

                <div className="search-profile-grid">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      className="search-profile-card"
                      onClick={() => router.push(`/users/${profile.username}`)}
                    >
                      <SearchAvatar profile={profile} />
                      <span className="search-profile-copy">
                        <strong>{profile.name}</strong>
                        <span>@{profile.username}</span>
                        {profile.location && <small>{profile.location}</small>}
                      </span>
                      <ArrowRight size={19} />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {!isLoading && !error && destinations.length > 0 && (
              <section className="search-group">
                <div className="search-group-title">
                  <MapPin size={21} />
                  <h3>Destinații recomandate</h3>
                </div>

                <div className="search-destination-grid">
                  {destinations.map((destination) => (
                    <button
                      key={destination.id}
                      type="button"
                      className="search-destination-card"
                      onClick={() =>
                        router.push(
                          `/search?q=${encodeURIComponent(destination.country)}&type=experiences`
                        )
                      }
                    >
                      <Image
                        src={destination.coverImage}
                        alt={destination.country}
                        fill
                        sizes="(max-width: 700px) 100vw, 300px"
                      />
                      <span />
                      <strong>{destination.country}</strong>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {!isLoading && !error && experiences.length > 0 && (
              <section className="search-group">
                <div className="search-group-title">
                  <Compass size={21} />
                  <h3>Experiențe și locuri</h3>
                </div>

                <div className="search-experience-grid">
                  {experiences.map((experience) => (
                    <article key={experience.id} className="search-experience-card">
                      <button
                        type="button"
                        className="search-experience-image"
                        onClick={() => router.push(`/posts/${experience.id}`)}
                        aria-label={`Deschide ${experience.title}`}
                      >
                        {experience.image ? (
                          <Image
                            src={experience.image}
                            alt=""
                            fill
                            sizes="(max-width: 700px) 100vw, 420px"
                          />
                        ) : (
                          <Compass size={40} />
                        )}
                      </button>

                      <div className="search-experience-body">
                        <button
                          type="button"
                          className="search-experience-author"
                          onClick={() => router.push(`/users/${experience.username}`)}
                        >
                          <SearchAvatar profile={experience} size={38} />
                          <span>
                            <strong>{experience.name}</strong>
                            <small>@{experience.username}</small>
                          </span>
                        </button>

                        <button
                          type="button"
                          className="search-experience-content"
                          onClick={() => router.push(`/posts/${experience.id}`)}
                        >
                          <span className="search-experience-location">
                            <MapPin size={15} />
                            {[experience.city, experience.country]
                              .filter(Boolean)
                              .join(", ") || experience.destination}
                          </span>
                          <h4>{experience.title}</h4>
                          {experience.description && <p>{experience.description}</p>}
                          <small>{formatDate(experience.createdAt)}</small>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </section>
        )}
      </div>
  );
}

function SearchLoading() {
  return (
      <div className="search-page">
        <div className="search-state search-page-loading">
          <span className="search-spinner" />
        </div>
      </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}
