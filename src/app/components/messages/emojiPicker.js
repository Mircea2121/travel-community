"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search, X } from "lucide-react";

const RECENT_EMOJIS_STORAGE_KEY =
  "travel-community:recent-emojis";
const MAX_RECENT_EMOJIS = 16;

const EMOJI_CATEGORIES = Object.freeze([
  {
    id: "smileys",
    label: "Emoții",
    icon: "😊",
    emojis: [
      ["😀", "zâmbet fericit"],
      ["😃", "bucurie"],
      ["😄", "râs fericit"],
      ["😁", "zâmbet larg"],
      ["😂", "râs cu lacrimi"],
      ["🤣", "râs puternic"],
      ["😊", "zâmbet cald"],
      ["🙂", "zâmbet simplu"],
      ["😉", "face cu ochiul"],
      ["😍", "îndrăgostit"],
      ["🥰", "dragoste"],
      ["😘", "pupic"],
      ["😎", "cool"],
      ["🤩", "uimit fericit"],
      ["🥳", "petrecere"],
      ["🤔", "gânditor"],
      ["😮", "surprins"],
      ["😢", "trist"],
      ["😭", "plâns"],
      ["😡", "furios"],
      ["😴", "somn"],
      ["🤗", "îmbrățișare"],
      ["🤭", "chicotit"],
      ["🫶", "inimă din mâini"],
    ],
  },
  {
    id: "gestures",
    label: "Gesturi",
    icon: "👍",
    emojis: [
      ["👍", "îmi place aprobare"],
      ["👎", "nu îmi place"],
      ["👏", "aplauze"],
      ["🙌", "sărbătoare"],
      ["🙏", "mulțumesc rugăciune"],
      ["🤝", "strângere de mână"],
      ["👌", "ok perfect"],
      ["✌️", "victorie pace"],
      ["🤞", "noroc"],
      ["💪", "putere"],
      ["👋", "salut"],
      ["🤙", "sună-mă"],
      ["☝️", "atenție sus"],
      ["👉", "dreapta"],
      ["👈", "stânga"],
      ["💯", "sută perfect"],
    ],
  },
  {
    id: "hearts",
    label: "Inimi",
    icon: "❤️",
    emojis: [
      ["❤️", "inimă roșie dragoste"],
      ["🧡", "inimă portocalie"],
      ["💛", "inimă galbenă"],
      ["💚", "inimă verde"],
      ["💙", "inimă albastră"],
      ["💜", "inimă mov"],
      ["🖤", "inimă neagră"],
      ["🤍", "inimă albă"],
      ["🤎", "inimă maro"],
      ["💖", "inimă strălucitoare"],
      ["💔", "inimă frântă"],
      ["💕", "două inimi"],
      ["💞", "inimi rotitoare"],
      ["💓", "inimă care bate"],
      ["✨", "sclipici"],
      ["🔥", "foc"],
    ],
  },
  {
    id: "travel",
    label: "Călătorii",
    icon: "✈️",
    emojis: [
      ["✈️", "avion zbor"],
      ["🛫", "decolare"],
      ["🛬", "aterizare"],
      ["🧳", "bagaj vacanță"],
      ["🗺️", "hartă"],
      ["📍", "locație pin"],
      ["🧭", "busolă"],
      ["🌍", "glob Europa Africa"],
      ["🌎", "glob America"],
      ["🌏", "glob Asia Australia"],
      ["🏖️", "plajă vacanță"],
      ["🏝️", "insulă"],
      ["🏔️", "munte"],
      ["⛺", "cort camping"],
      ["🏕️", "camping"],
      ["🌅", "răsărit"],
      ["🌄", "răsărit munte"],
      ["🌇", "apus oraș"],
      ["🏙️", "oraș"],
      ["🏛️", "monument"],
      ["🏰", "castel"],
      ["🗼", "turn"],
      ["🚗", "mașină"],
      ["🚆", "tren"],
      ["🚲", "bicicletă"],
      ["⛵", "velier"],
      ["🚢", "vapor croazieră"],
      ["📸", "cameră fotografie"],
    ],
  },
  {
    id: "nature",
    label: "Natură",
    icon: "🌿",
    emojis: [
      ["☀️", "soare"],
      ["🌤️", "soare cu nori"],
      ["🌧️", "ploaie"],
      ["❄️", "zăpadă"],
      ["🌈", "curcubeu"],
      ["🌊", "val mare"],
      ["🌲", "brad pădure"],
      ["🌴", "palmier"],
      ["🌵", "cactus"],
      ["🌿", "frunză natură"],
      ["🌸", "floare"],
      ["🦋", "fluture"],
      ["🐚", "scoică"],
      ["🐬", "delfin"],
      ["🦅", "vultur"],
      ["🐾", "urme animal"],
    ],
  },
  {
    id: "food",
    label: "Mâncare",
    icon: "🍕",
    emojis: [
      ["🍕", "pizza"],
      ["🍔", "burger"],
      ["🍝", "paste"],
      ["🥗", "salată"],
      ["🍣", "sushi"],
      ["🥐", "croissant"],
      ["🧀", "brânză"],
      ["🍦", "înghețată"],
      ["☕", "cafea"],
      ["🍵", "ceai"],
      ["🍺", "bere"],
      ["🍷", "vin"],
      ["🍹", "cocktail"],
      ["🥂", "noroc pahare"],
      ["🎂", "tort"],
      ["🍽️", "restaurant"],
    ],
  },
]);

const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap((category) =>
  category.emojis.map(([emoji, keywords]) => ({
    emoji,
    keywords,
    categoryId: category.id,
  }))
);

const EMOJI_BY_VALUE = new Map(
  ALL_EMOJIS.map((item) => [item.emoji, item])
);

function normalizeSearch(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function loadRecentEmojis() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const value = JSON.parse(
      window.localStorage.getItem(RECENT_EMOJIS_STORAGE_KEY) || "[]"
    );

    return Array.isArray(value)
      ? value.filter((emoji) => EMOJI_BY_VALUE.has(emoji)).slice(
          0,
          MAX_RECENT_EMOJIS
        )
      : [];
  } catch {
    return [];
  }
}

export default function EmojiPicker({
  isOpen = false,
  onSelect,
  onClose,
}) {
  const [activeCategory, setActiveCategory] = useState("smileys");
  const [search, setSearch] = useState("");
  const [recentEmojis, setRecentEmojis] = useState([]);
  const pickerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const openTimer = window.setTimeout(() => {
      setRecentEmojis(loadRecentEmojis());
      setSearch("");
      searchInputRef.current?.focus();
    }, 0);

    function handlePointerDown(event) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target)
      ) {
        onClose?.();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(openTimer);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const displayedEmojis = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);

    if (normalizedSearch) {
      return ALL_EMOJIS.filter((item) =>
        normalizeSearch(item.keywords).includes(normalizedSearch)
      );
    }

    if (activeCategory === "recent") {
      return recentEmojis
        .map((emoji) => EMOJI_BY_VALUE.get(emoji))
        .filter(Boolean);
    }

    return ALL_EMOJIS.filter(
      (item) => item.categoryId === activeCategory
    );
  }, [activeCategory, recentEmojis, search]);

  if (!isOpen) {
    return null;
  }

  function handleEmojiSelect(emoji) {
    const nextRecentEmojis = [
      emoji,
      ...recentEmojis.filter((item) => item !== emoji),
    ].slice(0, MAX_RECENT_EMOJIS);

    setRecentEmojis(nextRecentEmojis);

    try {
      window.localStorage.setItem(
        RECENT_EMOJIS_STORAGE_KEY,
        JSON.stringify(nextRecentEmojis)
      );
    } catch {}

    onSelect?.(emoji);
  }

  return (
    <section
      ref={pickerRef}
      className="emoji-picker"
      role="dialog"
      aria-modal="false"
      aria-label="Alege un emoji"
    >
      <header className="emoji-picker-header">
        <strong>Emoji</strong>

        <button
          type="button"
          className="emoji-picker-close"
          onClick={onClose}
          aria-label="Închide selectorul de emoji"
        >
          <X size={18} />
        </button>
      </header>

      <label className="emoji-picker-search">
        <Search size={17} aria-hidden="true" />
        <span className="sr-only">Caută emoji</span>
        <input
          ref={searchInputRef}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Caută emoji..."
          autoComplete="off"
        />
      </label>

      <nav className="emoji-picker-categories" aria-label="Categorii emoji">
        {recentEmojis.length > 0 ? (
          <button
            type="button"
            className={
              activeCategory === "recent" && !search
                ? "is-active"
                : ""
            }
            onClick={() => {
              setSearch("");
              setActiveCategory("recent");
            }}
            title="Recente"
            aria-label="Emoji recente"
          >
            🕘
          </button>
        ) : null}

        {EMOJI_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className={
              activeCategory === category.id && !search
                ? "is-active"
                : ""
            }
            onClick={() => {
              setSearch("");
              setActiveCategory(category.id);
            }}
            title={category.label}
            aria-label={category.label}
          >
            {category.icon}
          </button>
        ))}
      </nav>

      <div className="emoji-picker-content">
        {displayedEmojis.length > 0 ? (
          <div className="emoji-picker-grid">
            {displayedEmojis.map((item) => (
              <button
                key={item.emoji}
                type="button"
                className="emoji-picker-button"
                onClick={() => handleEmojiSelect(item.emoji)}
                title={item.keywords}
                aria-label={item.keywords}
              >
                {item.emoji}
              </button>
            ))}
          </div>
        ) : (
          <div className="emoji-picker-empty">
            Nu am găsit niciun emoji.
          </div>
        )}
      </div>
    </section>
  );
}
