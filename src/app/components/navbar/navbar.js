"use client";

import "./navbar.css";

import {
  Search,
  MapPin,
  Compass,
  LoaderCircle,
  ArrowRight,
  CircleUserRound,
  Menu,
  X,
  UserRound,
  Settings,
  MessageCircle,
  LogOut,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { getUserInitials } from "../../utils/getUserInitials";
import { useRealtime } from "../messages/realtimeProvider";
import { REALTIME_EVENTS } from "../../utils/realtimeEvents";

function getAvatarUrl(avatar) {
  if (typeof avatar === "string") {
    return avatar.trim();
  }

  if (
    avatar &&
    typeof avatar === "object" &&
    typeof avatar.url === "string"
  ) {
    return avatar.url.trim();
  }

  return "";
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { socket } = useRealtime();

  const [searchQuery, setSearchQuery] =
    useState("");

  const [searchSuggestions, setSearchSuggestions] =
    useState([]);

  const [isSearchLoading, setIsSearchLoading] =
    useState(false);

  const [isSearchFocused, setIsSearchFocused] =
    useState(false);

  const [activeSuggestionIndex, setActiveSuggestionIndex] =
    useState(-1);

  const [
    isMobileSearchOpen,
    setIsMobileSearchOpen,
  ] = useState(false);

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] = useState(false);

  const [
    isProfileMenuOpen,
    setIsProfileMenuOpen,
  ] = useState(false);

  const [user, setUser] = useState(null);

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const [failedAvatarUrl, setFailedAvatarUrl] =
    useState("");

  const [
    isLoadingUser,
    setIsLoadingUser,
  ] = useState(true);

  const searchInputRef = useRef(null);
  const searchFormRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const cleanQuery = searchQuery.trim().replace(/\s+/g, " ");

    if (cleanQuery.length < 2) {
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setIsSearchLoading(true);

      try {
        const params = new URLSearchParams({
          q: cleanQuery,
          type: "all",
          limit: "4",
        });

        const response = await fetch(`/api/search?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = await response.json();

        if (!response.ok || !payload.success) {
          setSearchSuggestions([]);
          return;
        }

        const profileSuggestions = (payload.results?.profiles || []).map(
          (profile) => ({
            id: `profile-${profile.id}`,
            type: "profile",
            title: profile.name,
            subtitle: `@${profile.username}`,
            href: `/users/${profile.username}`,
          })
        );

        const destinationSuggestions = (
          payload.results?.destinations || []
        ).map((destination) => ({
          id: `destination-${destination.id}`,
          type: "destination",
          title: destination.country,
          subtitle: "Destinație",
          href: `/search?q=${encodeURIComponent(
            destination.country
          )}&type=experiences`,
        }));

        const experienceSuggestions = (
          payload.results?.experiences || []
        ).map((experience) => ({
          id: `experience-${experience.id}`,
          type: "experience",
          title: experience.title,
          subtitle:
            [experience.city, experience.country]
              .filter(Boolean)
              .join(", ") || experience.destination,
          href: `/posts/${experience.id}`,
        }));

        setSearchSuggestions(
          [
            ...profileSuggestions,
            ...destinationSuggestions,
            ...experienceSuggestions,
          ].slice(0, 8)
        );
        setActiveSuggestionIndex(-1);
      } catch (error) {
        if (error.name !== "AbortError") {
          setSearchSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchLoading(false);
        }
      }
    }, 280);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        if (data.success) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const controller = new AbortController();

    const loadUnreadMessageCount = async () => {
      try {
        const response = await fetch("/api/conversations/unread-count", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();

        if (response.ok && data.success) {
          setUnreadMessageCount(
            Math.max(0, Number(data.unreadCount) || 0)
          );
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Unread message count error:", error);
        }
      }
    };

    loadUnreadMessageCount();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadUnreadMessageCount();
      }
    };

    window.addEventListener("focus", loadUnreadMessageCount);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      controller.abort();
      window.removeEventListener("focus", loadUnreadMessageCount);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, user]);

  useEffect(() => {
    if (!socket || !user) {
      return undefined;
    }

    let refreshTimeout;

    const refreshUnreadMessageCount = () => {
      window.clearTimeout(refreshTimeout);
      refreshTimeout = window.setTimeout(async () => {
        try {
          const response = await fetch("/api/conversations/unread-count", {
            credentials: "include",
            cache: "no-store",
          });
          const data = await response.json();

          if (response.ok && data.success) {
            setUnreadMessageCount(
              Math.max(0, Number(data.unreadCount) || 0)
            );
          }
        } catch {
          // The next realtime event, focus or navigation retries the count.
        }
      }, 150);
    };

    socket.on(
      REALTIME_EVENTS.CONVERSATION_UPDATED,
      refreshUnreadMessageCount
    );

    return () => {
      window.clearTimeout(refreshTimeout);
      socket.off(
        REALTIME_EVENTS.CONVERSATION_UPDATED,
        refreshUnreadMessageCount
      );
    };
  }, [socket, user]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(
          event.target
        )
      ) {
        setIsProfileMenuOpen(false);
      }

      if (
        searchFormRef.current &&
        !searchFormRef.current.contains(event.target)
      ) {
        setIsSearchFocused(false);
        setActiveSuggestionIndex(-1);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
        setIsSearchFocused(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  function closeNavigationMenus() {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
    setIsProfileMenuOpen(false);
    setIsSearchFocused(false);
    setActiveSuggestionIndex(-1);
  }

  function removeCurrentHash() {
    if (
      typeof window === "undefined" ||
      !window.location.hash
    ) {
      return;
    }

    const cleanUrl =
      window.location.pathname +
      window.location.search;

    window.history.replaceState(
      window.history.state,
      "",
      cleanUrl
    );
  }

  const navigateTo = (path) => {
    closeNavigationMenus();
    removeCurrentHash();

    router.push(path);
  };

  const handleCreatePost = () => {
    closeNavigationMenus();
    removeCurrentHash();

    router.push(
      user
        ? "/create-experience"
        : "/login"
    );
  };

  const handleLogoClick = () => {
    closeNavigationMenus();

    if (window.location.pathname === "/") {
      window.history.replaceState(
        window.history.state,
        "",
        "/"
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    router.push("/");
  };

  const scrollToSection = (id) => {
    closeNavigationMenus();

    if (window.location.pathname !== "/") {
      router.push(`/#${id}`);
      return;
    }

    removeCurrentHash();

    window.requestAnimationFrame(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  };

  const openMobileSearch = () => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsMobileSearchOpen(true);

    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
    setSearchQuery("");
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const cleanQuery =
      searchQuery.trim();

    if (!cleanQuery) {
      searchInputRef.current?.focus();
      return;
    }

    closeNavigationMenus();
    removeCurrentHash();

    router.push(
      `/search?q=${encodeURIComponent(
        cleanQuery
      )}`
    );
  };

  const handleSearchQueryChange = (event) => {
    const value = event.target.value;
    setSearchQuery(value);

    if (value.trim().length < 2) {
      setSearchSuggestions([]);
      setIsSearchLoading(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const openSuggestion = (suggestion) => {
    closeNavigationMenus();
    setIsSearchFocused(false);
    setActiveSuggestionIndex(-1);
    router.push(suggestion.href);
  };

  const handleSearchKeyDown = (event) => {
    if (!isSearchFocused || searchSuggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex >= searchSuggestions.length - 1
          ? 0
          : currentIndex + 1
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((currentIndex) =>
        currentIndex <= 0
          ? searchSuggestions.length - 1
          : currentIndex - 1
      );
      return;
    }

    if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      openSuggestion(searchSuggestions[activeSuggestionIndex]);
    }
  };

  const showSearchSuggestions =
    isSearchFocused &&
    searchQuery.trim().length >= 2 &&
    (isSearchLoading || searchSuggestions.length > 0);

  const toggleMobileMenu = () => {
    setIsMobileSearchOpen(false);
    setIsProfileMenuOpen(false);

    setIsMobileMenuOpen(
      (currentState) => !currentState
    );
  };

  const handleProfileButton = () => {
    if (!user) {
      navigateTo("/login");
      return;
    }

    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);

    setIsProfileMenuOpen(
      (currentState) => !currentState
    );
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
        return;
      }

      setUser(null);
      setUnreadMessageCount(0);
      closeNavigationMenus();

      window.location.href = "/";
    } catch (error) {
      console.error(
        "Eroare la delogare:",
        error
      );
    }
  };

  const getUserInitial = () => {
    return getUserInitials(user);
  };

  const avatarUrl = getAvatarUrl(user?.avatar);
  const shouldShowAvatar =
    Boolean(avatarUrl) && failedAvatarUrl !== avatarUrl;

  return (
    <>
      <header className="navbar">
        <button
          type="button"
          className="nav-logo"
          onClick={handleLogoClick}
          aria-label="Mergi la pagina principală"
        >
          <div className="nav-logo-icon">
            <svg
              className="nav-globe"
              viewBox="0 0 64 64"
              aria-hidden="true"
            >
              <circle
                className="globe-main"
                cx="32"
                cy="32"
                r="23"
              />

              <path
                className="globe-line"
                d="M9 32h46M32 9c7 7 10 15 10 23s-3 16-10 23M32 9c-7 7-10 15-10 23s3 16 10 23"
              />

              <path
                className="globe-land"
                d="M24 18c-4 1-8 4-9 8 3 1 6 0 8 2 2 2 0 5 3 7 2 1 5-1 6-4 1-4-3-5-2-8 1-3 5-2 6-5-3-2-8-2-12 0Z"
              />

              <path
                className="globe-land"
                d="M39 34c-4 1-8 4-8 8 0 4 4 7 8 8 5-3 9-8 10-14-3-2-6-3-10-2Z"
              />
            </svg>
          </div>

          <div className="nav-logo-text">
            <strong>
              Comunitatea
            </strong>

            <span>
              Călătorilor
            </span>
          </div>
        </button>

        <nav className="nav-menu">
          <button
            type="button"
            onClick={() =>
              scrollToSection("hero")
            }
          >
            Explorează
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "destinations"
              )
            }
          >
            Destinații
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection("reviews")
            }
          >
            Recomandări
          </button>

          <button
            type="button"
            onClick={() => navigateTo("/blog")}
          >
            Blog
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection("about")
            }
          >
            Despre noi
          </button>
        </nav>

        <div className="nav-actions">
          <form
            ref={searchFormRef}
            className={`nav-search ${
              isMobileSearchOpen
                ? "nav-search-open"
                : ""
            }`}
            onSubmit={handleSearch}
            onKeyDown={handleSearchKeyDown}
            role="search"
          >
            <button
              type="button"
              className="nav-search-toggle"
              onClick={
                openMobileSearch
              }
              aria-label="Deschide căutarea"
            >
              <Search
                size={20}
                strokeWidth={2}
              />
            </button>

            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={handleSearchQueryChange}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Caută în comunitate"
              aria-label="Caută profiluri, destinații și experiențe"
              aria-autocomplete="list"
              role="combobox"
              aria-controls="global-search-suggestions"
              aria-expanded={showSearchSuggestions}
              aria-activedescendant={
                activeSuggestionIndex >= 0
                  ? `global-search-option-${activeSuggestionIndex}`
                  : undefined
              }
              maxLength={80}
            />

            <button
              type="submit"
              className="nav-search-submit"
              aria-label="Caută"
            >
              <Search
                size={18}
                strokeWidth={2.2}
              />
            </button>

            <button
              type="button"
              className="nav-search-close"
              onClick={
                closeMobileSearch
              }
              aria-label="Închide căutarea"
            >
              <X
                size={20}
                strokeWidth={2.2}
              />
            </button>

            {showSearchSuggestions && (
              <div
                id="global-search-suggestions"
                className="nav-search-suggestions"
                role="listbox"
                aria-label="Sugestii de căutare"
              >
                {isSearchLoading && searchSuggestions.length === 0 ? (
                  <div className="nav-search-loading">
                    <LoaderCircle size={18} />
                    <span>Căutăm...</span>
                  </div>
                ) : (
                  <>
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.id}
                        id={`global-search-option-${index}`}
                        type="button"
                        className={
                          index === activeSuggestionIndex ? "active" : ""
                        }
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setActiveSuggestionIndex(index)}
                        onClick={() => openSuggestion(suggestion)}
                        role="option"
                        aria-selected={index === activeSuggestionIndex}
                      >
                        <span className={`nav-search-result-icon ${suggestion.type}`}>
                          {suggestion.type === "profile" ? (
                            <UserRound size={17} />
                          ) : suggestion.type === "destination" ? (
                            <MapPin size={17} />
                          ) : (
                            <Compass size={17} />
                          )}
                        </span>
                        <span className="nav-search-result-copy">
                          <strong>{suggestion.title}</strong>
                          <small>{suggestion.subtitle}</small>
                        </span>
                        <ArrowRight size={16} />
                      </button>
                    ))}

                    <button
                      type="submit"
                      className="nav-search-all-results"
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      <Search size={16} />
                      Vezi toate rezultatele
                    </button>
                  </>
                )}
              </div>
            )}
          </form>

          {!isLoadingUser && (
            <div
              className="nav-profile-wrapper"
              ref={profileMenuRef}
            >
              <button
                type="button"
                className={`nav-login ${
                  isProfileMenuOpen
                    ? "nav-login-active"
                    : ""
                }`}
                onClick={
                  handleProfileButton
                }
                aria-label={
                  user
                    ? "Deschide meniul contului"
                    : "Autentificare"
                }
                aria-expanded={
                  user
                    ? isProfileMenuOpen
                    : undefined
                }
                title={
                  user
                    ? user.name
                    : "Autentificare"
                }
              >
                <CircleUserRound
                  size={24}
                  strokeWidth={2}
                />
                {user && unreadMessageCount > 0 ? (
                  <span className="nav-unread-badge" aria-hidden="true">
                    {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                  </span>
                ) : null}
              </button>

              {user &&
                isProfileMenuOpen && (
                  <div className="profile-dropdown">
                    <div className="profile-dropdown-header">
                      <div className="profile-dropdown-avatar">
                        {shouldShowAvatar ? (
                          <Image
                            src={avatarUrl}
                            alt={`Avatar ${user.name || "utilizator"}`}
                            width={58}
                            height={58}
                            sizes="58px"
                            onError={() =>
                              setFailedAvatarUrl(avatarUrl)
                            }
                          />
                        ) : (
                          getUserInitial()
                        )}
                      </div>

                      <div className="profile-dropdown-identity">
                        <strong>
                          {user.name}
                        </strong>

                        <span>
                          {user.email}
                        </span>
                      </div>
                    </div>

                    <div className="profile-dropdown-divider" />

                    <div className="profile-dropdown-links">
                      <button
                        type="button"
                        onClick={() =>
                          navigateTo(
                            "/profile"
                          )
                        }
                      >
                        <span className="profile-dropdown-icon">
                          <UserRound
                            size={19}
                            strokeWidth={2}
                          />
                        </span>

                        <span>
                          Profilul meu
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigateTo(
                            "/messages"
                          )
                        }
                      >
                        <span className="profile-dropdown-icon">
                          <MessageCircle
                            size={19}
                            strokeWidth={2}
                          />
                        </span>

                        <span className="profile-dropdown-link-label">
                          Mesaje
                          {unreadMessageCount > 0 ? (
                            <span
                              className="profile-dropdown-unread-badge"
                              aria-label={`${unreadMessageCount} mesaje necitite`}
                            >
                              {unreadMessageCount > 99
                                ? "99+"
                                : unreadMessageCount}
                            </span>
                          ) : null}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigateTo(
                            "/settings"
                          )
                        }
                      >
                        <span className="profile-dropdown-icon">
                          <Settings
                            size={19}
                            strokeWidth={2}
                          />
                        </span>

                        <span>
                          Setări cont
                        </span>
                      </button>
                    </div>

                    <div className="profile-dropdown-divider" />

                    <button
                      type="button"
                      className="profile-dropdown-logout"
                      onClick={
                        handleLogout
                      }
                    >
                      <span className="profile-dropdown-icon">
                        <LogOut
                          size={19}
                          strokeWidth={2}
                        />
                      </span>

                      <span>
                        Deconectare
                      </span>
                    </button>
                  </div>
                )}
            </div>
          )}

          <button
            type="button"
            className="nav-create"
            onClick={handleCreatePost}
          >
            Creează postare
          </button>

          <button
            type="button"
            className="nav-burger"
            onClick={
              toggleMobileMenu
            }
            aria-label={
              isMobileMenuOpen
                ? "Închide meniul"
                : "Deschide meniul"
            }
            aria-expanded={
              isMobileMenuOpen
            }
          >
            {isMobileMenuOpen ? (
              <X
                size={25}
                strokeWidth={2.2}
              />
            ) : (
              <Menu
                size={25}
                strokeWidth={2.2}
              />
            )}
          </button>
        </div>
      </header>

      <div
        className={`mobile-menu ${
          isMobileMenuOpen
            ? "mobile-menu-open"
            : ""
        }`}
      >
        <nav className="mobile-menu-links">
          <button
            type="button"
            onClick={() =>
              scrollToSection("hero")
            }
          >
            Explorează
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "destinations"
              )
            }
          >
            Destinații
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection("reviews")
            }
          >
            Recomandări
          </button>

          <button
            type="button"
            onClick={() => navigateTo("/blog")}
          >
            Blog
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection("about")
            }
          >
            Despre noi
          </button>
        </nav>

        <div className="mobile-menu-actions">
          {!isLoadingUser && (
            <button
              type="button"
              className="mobile-login-button"
              onClick={() =>
                navigateTo(
                  user
                    ? "/profile"
                    : "/login"
                )
              }
            >
              <CircleUserRound
                size={21}
                strokeWidth={2}
              />

              <span>
                {user
                  ? user.name
                  : "Autentificare"}
              </span>
            </button>
          )}

          <button
            type="button"
            className="mobile-create-button"
            onClick={handleCreatePost}
          >
            Creează postare
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <button
          type="button"
          className="mobile-menu-overlay"
          onClick={() =>
            setIsMobileMenuOpen(
              false
            )
          }
          aria-label="Închide meniul"
        />
      )}
    </>
  );
}
