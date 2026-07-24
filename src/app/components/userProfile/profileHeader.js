"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";

import "./userProfile.css";

export default function ProfileHeader({
  user,
  isOwnProfile = false,
  isFollowing = false,
  onFollow,
  onMessage,
  onEditProfile,
}) {
  const effectiveIsOwnProfile =
    isOwnProfile === true || user?.isOwnProfile === true;

  const getValidImageUrl = (image) => {
    if (!image) {
      return null;
    }

    const imageUrl =
      typeof image === "string"
        ? image
        : image?.url;

    if (
      typeof imageUrl !== "string" ||
      imageUrl.trim() === ""
    ) {
      return null;
    }

    return imageUrl.trim();
  };

  const [avatarPreview, setAvatarPreview] = useState(
    getValidImageUrl(user?.avatar)
  );

  const [coverPreview, setCoverPreview] = useState(
    getValidImageUrl(user?.coverImage)
  );

  const [avatarLoadFailed, setAvatarLoadFailed] =
    useState(false);

  useEffect(() => {
    setAvatarPreview(getValidImageUrl(user?.avatar));
    setCoverPreview(getValidImageUrl(user?.coverImage));
    setAvatarLoadFailed(false);
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }

      if (coverPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [avatarPreview, coverPreview]);

  if (!user) {
    return null;
  }

  const fullName =
    user.fullName ||
    user.name ||
    user.username ||
    "Utilizator";

  const levelName =
    typeof user.level === "object"
      ? user.level?.name
      : user.level;

  const locationText = [user.city, user.country]
    .filter(Boolean)
    .join(", ");

  const fallbackInitial =
    fullName.trim().charAt(0).toUpperCase() || "?";

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setAvatarLoadFailed(false);
    setAvatarPreview(previewUrl);

    event.target.value = "";
  }

  function handleCoverChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    if (coverPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setCoverPreview(previewUrl);

    event.target.value = "";
  }

  function handleAvatarError() {
    setAvatarLoadFailed(true);
  }

  function handleMessageClick() {
    if (typeof onMessage === "function") {
      onMessage(user);
    }
  }

  function handleFollowClick() {
    if (typeof onFollow === "function") {
      onFollow(user);
    }
  }

  function handleEditProfileClick() {
    if (typeof onEditProfile === "function") {
      onEditProfile(user);
    }
  }

  const shouldShowAvatarImage =
    Boolean(avatarPreview) && !avatarLoadFailed;

  return (
    <section className="travel-profile-hero">
      <div
        className={`travel-profile-cover ${
          coverPreview
            ? ""
            : "travel-profile-cover-empty"
        }`}
        style={
          coverPreview
            ? {
                backgroundImage: `url("${coverPreview}")`,
              }
            : undefined
        }
      >
        {effectiveIsOwnProfile && (
          <label className="travel-profile-cover-upload">
            Schimbă coperta

            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              hidden
            />
          </label>
        )}

        <div className="travel-profile-cover-actions">
          {!effectiveIsOwnProfile && (
            <button
              type="button"
              className="travel-profile-action-btn travel-profile-action-message"
              onClick={handleMessageClick}
            >
              <Mail
                size={17}
                strokeWidth={2.2}
                aria-hidden="true"
              />

              <span>Mesaj</span>
            </button>
          )}

          <button
            type="button"
            className="travel-profile-action-btn travel-profile-action-primary"
            onClick={
              effectiveIsOwnProfile
                ? handleEditProfileClick
                : handleFollowClick
            }
          >
            {effectiveIsOwnProfile
              ? "Editează profilul"
              : isFollowing
                ? "Urmărești"
                : "Urmărește"}
          </button>
        </div>
      </div>

      <div className="travel-profile-info-card">
        <div className="travel-profile-avatar-wrap">
          {shouldShowAvatarImage ? (
            <img
              src={avatarPreview}
              alt={`Avatar ${fullName}`}
              className="travel-profile-avatar"
              onError={handleAvatarError}
            />
          ) : (
            <div
              className="travel-profile-avatar travel-profile-avatar-fallback"
              aria-label={`Avatar ${fullName}`}
            >
              {fallbackInitial}
            </div>
          )}

          {effectiveIsOwnProfile ? (
            <label
              className="travel-profile-avatar-upload"
              aria-label="Schimbă fotografia de profil"
            >
              <span aria-hidden="true">+</span>

              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                hidden
              />
            </label>
          ) : (
            <span
              className="travel-profile-online"
              aria-label="Utilizator online"
            />
          )}
        </div>

        <div className="travel-profile-details">
          <div className="travel-profile-details-top">
            <div>
              <div className="travel-profile-name-row">
                <h1>{fullName}</h1>

                {user.isVerified === true && (
                  <span
                    className="travel-profile-verified"
                    aria-label="Profil verificat"
                  >
                    ✓
                  </span>
                )}
              </div>

              {user.username && (
                <p className="travel-profile-username">
                  @{user.username}
                </p>
              )}
            </div>

            {levelName && (
              <span className="travel-profile-level">
                {levelName}
              </span>
            )}
          </div>

          {locationText && (
            <p className="travel-profile-location">
              <span aria-hidden="true">📍</span>

              {locationText}
            </p>
          )}

          {user.bio && (
            <p className="travel-profile-bio">
              {user.bio}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}