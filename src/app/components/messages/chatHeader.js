"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Flag,
  MessageSquareWarning,
  MoreVertical,
  Trash2,
  WifiOff,
} from "lucide-react";

import AvatarViewer from "./avatarViewer";
import { getUserInitials } from "../../utils/getUserInitials";

function getAvatarUrl(avatar) {
  if (typeof avatar === "string") {
    return avatar.trim();
  }

  return typeof avatar?.url === "string" ? avatar.url.trim() : "";
}

function isSameCalendarDay(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function formatLastSeen(value, now) {
  if (!value) {
    return "Offline";
  }

  const lastSeenDate = new Date(value);

  if (Number.isNaN(lastSeenDate.getTime())) {
    return "Offline";
  }

  const elapsedMilliseconds = Math.max(
    now.getTime() - lastSeenDate.getTime(),
    0
  );
  const elapsedMinutes = Math.floor(elapsedMilliseconds / 60_000);

  if (elapsedMinutes < 1) {
    return "Activ acum câteva secunde";
  }

  if (elapsedMinutes < 60) {
    return `Activ acum ${elapsedMinutes} ${
      elapsedMinutes === 1 ? "minut" : "minute"
    }`;
  }

  const time = new Intl.DateTimeFormat("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(lastSeenDate);

  if (isSameCalendarDay(lastSeenDate, now)) {
    return `Ultima activitate azi la ${time}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameCalendarDay(lastSeenDate, yesterday)) {
    return `Ultima activitate ieri la ${time}`;
  }

  const date = new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year:
      lastSeenDate.getFullYear() !== now.getFullYear()
        ? "numeric"
        : undefined,
  }).format(lastSeenDate);

  return `Ultima activitate ${date}, ${time}`;
}

export default function ChatHeader({
  user = null,
  isTyping = false,
  realtimeStatus = "idle",
  isDeleting = false,
  onBack,
  onDeleteConversation,
  onReportConversation,
  onReportUser,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState("");
  const [now, setNow] = useState(() => new Date());
  const menuRef = useRef(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const displayName =
    user?.name || user?.fullName || user?.username || "Utilizator";
  const username =
    typeof user?.username === "string" ? user.username.trim() : "";
  const profileHref = username
    ? `/users/${encodeURIComponent(username)}`
    : null;
  const avatarUrl = getAvatarUrl(user?.avatar || user?.avatarData);
  const shouldShowAvatar =
    Boolean(avatarUrl) &&
    failedAvatarUrl !== avatarUrl;
  const initials = getUserInitials(displayName);
  const isOnline = user?.isOnline === true;
  const hasRealtimeProblem =
    realtimeStatus === "unavailable" || realtimeStatus === "reconnecting";

  let statusText = formatLastSeen(user?.lastSeenAt, now);

  if (isOnline) {
    statusText = "Online";
  }

  if (hasRealtimeProblem) {
    statusText =
      realtimeStatus === "reconnecting"
        ? "Se reconectează..."
        : statusText;
  }

  if (isTyping) {
    statusText = "Scrie...";
  }

  function runMenuAction(callback) {
    setIsMenuOpen(false);
    callback?.();
  }

  return (
    <>
      <header className="chat-header">
      <div className="chat-header-left">
        <button
          type="button"
          className="chat-header-back"
          onClick={onBack}
          aria-label="Înapoi la conversații"
          title="Înapoi"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>

        <div className="chat-header-avatar-wrapper">
          <button
            type="button"
            className="chat-header-avatar chat-header-avatar-button"
            onClick={() => setIsAvatarOpen(true)}
            aria-label={
              `Mărește avatarul utilizatorului ${displayName}`
            }
            title={
              shouldShowAvatar
                ? "Vezi fotografia de profil"
                : "Vezi avatarul"
            }
          >
            {shouldShowAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={`Avatar ${displayName}`}
                onError={() =>
                  setFailedAvatarUrl(avatarUrl)
                }
              />
            ) : (
              <span className="chat-avatar-initials" aria-hidden="true">
                {initials}
              </span>
            )}
          </button>

          <span
            className={`chat-header-presence-dot${
              isOnline ? " is-online" : ""
            }`}
            aria-label={isOnline ? "Utilizator online" : "Utilizator offline"}
          />
        </div>

        <div className="chat-header-user-info">
          <h2>
            {profileHref ? (
              <Link
                href={profileHref}
                className="chat-header-profile-link"
                title={`Deschide profilul ${displayName}`}
              >
                {displayName}
              </Link>
            ) : (
              displayName
            )}
          </h2>

          <div className="chat-header-user-status">
            <span
              className={`chat-header-status-text${
                isTyping ? " is-typing" : isOnline ? " is-online" : ""
              }`}
            >
              {hasRealtimeProblem && !isTyping ? (
                <WifiOff size={13} aria-hidden="true" />
              ) : null}
              {statusText}
            </span>

            {profileHref ? (
              <Link
                href={profileHref}
                className="chat-header-username"
                title={`Deschide profilul @${username}`}
              >
                @{username}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="chat-header-menu-wrapper" ref={menuRef}>
        <button
          type="button"
          className="chat-header-menu-button"
          onClick={() => setIsMenuOpen((value) => !value)}
          aria-label="Deschide opțiunile conversației"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          title="Opțiuni"
        >
          <MoreVertical size={22} aria-hidden="true" />
        </button>

        {isMenuOpen ? (
          <div className="chat-header-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => runMenuAction(onReportUser)}
            >
              <Flag size={17} aria-hidden="true" />
              <span>Raportează utilizatorul</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => runMenuAction(onReportConversation)}
            >
              <MessageSquareWarning size={17} aria-hidden="true" />
              <span>Raportează conversația</span>
            </button>

            <button
              type="button"
              role="menuitem"
              className="is-danger"
              disabled={isDeleting}
              onClick={() => runMenuAction(onDeleteConversation)}
            >
              <Trash2 size={17} aria-hidden="true" />
              <span>
                {isDeleting ? "Se șterge..." : "Șterge conversația"}
              </span>
            </button>
          </div>
        ) : null}
      </div>
      </header>

      <AvatarViewer
        isOpen={isAvatarOpen}
        imageUrl={shouldShowAvatar ? avatarUrl : ""}
        displayName={displayName}
        onClose={() => setIsAvatarOpen(false)}
      />
    </>
  );
}


