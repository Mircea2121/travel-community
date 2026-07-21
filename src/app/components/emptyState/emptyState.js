import Link from "next/link";

import {
  Bookmark,
  Camera,
  Compass,
  MessageCircle,
  SearchX,
} from "lucide-react";

import "./emptyState.css";

const EMPTY_STATE_TYPES = {
  posts: {
    icon: Camera,
    title: "Nu există postări încă",
    description:
      "Experiențele de călătorie publicate vor apărea aici.",
    buttonText: "Creează o experiență",
    buttonHref: "/create-experience",
  },

  saved: {
    icon: Bookmark,
    title: "Nu ai salvat nimic încă",
    description:
      "Salvează experiențele care te inspiră pentru a le găsi mai ușor.",
    buttonText: "Descoperă experiențe",
    buttonHref: "/",
  },

  comments: {
    icon: MessageCircle,
    title: "Niciun comentariu încă",
    description:
      "Fii primul care își împărtășește opinia despre această experiență.",
  },

  search: {
    icon: SearchX,
    title: "Nu am găsit rezultate",
    description:
      "Încearcă un alt termen de căutare sau verifică dacă ai scris corect.",
  },

  destinations: {
    icon: Compass,
    title: "Nicio destinație găsită",
    description:
      "Momentan nu există destinații care să corespundă selecției tale.",
    buttonText: "Vezi toate destinațiile",
    buttonHref: "/",
  },
};

export default function EmptyState({
  type = "posts",
  title,
  description,
  buttonText,
  buttonHref,
  onButtonClick,
}) {
  const selectedState =
    EMPTY_STATE_TYPES[type] || EMPTY_STATE_TYPES.posts;

  const Icon = selectedState.icon;

  const finalTitle = title || selectedState.title;

  const finalDescription =
    description || selectedState.description;

  const finalButtonText =
    buttonText || selectedState.buttonText;

  const finalButtonHref =
    buttonHref || selectedState.buttonHref;

  return (
    <section
      className="empty-state"
      role="status"
      aria-live="polite"
    >
      <div className="empty-state-icon">
        <Icon size={34} strokeWidth={1.8} />
      </div>

      <div className="empty-state-content">
        <h3>{finalTitle}</h3>

        <p>{finalDescription}</p>
      </div>

      {finalButtonText &&
        (onButtonClick ? (
          <button
            type="button"
            className="empty-state-button"
            onClick={onButtonClick}
          >
            {finalButtonText}
          </button>
        ) : (
          finalButtonHref && (
            <Link
              href={finalButtonHref}
              className="empty-state-button"
            >
              {finalButtonText}
            </Link>
          )
        ))}
    </section>
  );
}