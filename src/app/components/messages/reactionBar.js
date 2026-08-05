"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { LoaderCircle, SmilePlus } from "lucide-react";

import { MESSAGE_REACTIONS } from "@/app/utils/messageReactions";

const LONG_PRESS_DELAY_MS = 450;
const HOVER_OPEN_DELAY_MS = 180;
const HOVER_CLOSE_DELAY_MS = 240;

export default function ReactionBar({
  currentReaction = "",
  disabled = false,
  isUpdating = false,
  placement = "left",
  onReaction,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const hoverTimerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      window.clearTimeout(longPressTimerRef.current);
      window.clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const activeReaction = MESSAGE_REACTIONS.find(
    (reaction) => reaction.type === currentReaction
  );

  function handleMouseEnter() {
    if (disabled || isUpdating) {
      return;
    }

    window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => {
      setIsOpen(true);
    }, HOVER_OPEN_DELAY_MS);
  }

  function handleMouseLeave() {
    window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, HOVER_CLOSE_DELAY_MS);
  }

  function handlePointerDown(event) {
    if (
      event.pointerType === "mouse" ||
      disabled ||
      isUpdating
    ) {
      return;
    }

    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      setIsOpen(true);
    }, LONG_PRESS_DELAY_MS);
  }

  function handlePointerEnd() {
    window.clearTimeout(longPressTimerRef.current);
  }

  function handleToggle() {
    if (disabled || isUpdating) {
      return;
    }

    setIsOpen((currentValue) => !currentValue);
  }

  function handleSelect(type) {
    if (disabled || isUpdating) {
      return;
    }

    setIsOpen(false);
    onReaction?.(currentReaction === type ? null : type);
  }

  return (
    <div
      ref={wrapperRef}
      className={`reaction-bar reaction-bar-${placement}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onContextMenu={(event) => {
        if (isOpen) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="button"
        className={`reaction-bar-trigger${
          activeReaction ? " is-active" : ""
        }`}
        onClick={handleToggle}
        disabled={disabled || isUpdating}
        aria-label={
          activeReaction
            ? `Reacție curentă: ${activeReaction.label}`
            : "Adaugă o reacție"
        }
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Adaugă o reacție"
      >
        {isUpdating ? (
          <LoaderCircle
            className="is-spinning"
            size={17}
            aria-hidden="true"
          />
        ) : activeReaction ? (
          <span aria-hidden="true">{activeReaction.emoji}</span>
        ) : (
          <SmilePlus size={17} aria-hidden="true" />
        )}
      </button>

      {isOpen ? (
        <div
          className="reaction-bar-popup"
          role="menu"
          aria-label="Alege reacția"
        >
          {MESSAGE_REACTIONS.map((reaction) => {
            const isActive = reaction.type === currentReaction;

            return (
              <button
                key={reaction.type}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                className={`reaction-bar-item${
                  isActive ? " is-active" : ""
                }`}
                onClick={() => handleSelect(reaction.type)}
                title={
                  isActive
                    ? `Elimină reacția „${reaction.label}”`
                    : reaction.label
                }
              >
                <span aria-hidden="true">{reaction.emoji}</span>
                <span className="sr-only">{reaction.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
