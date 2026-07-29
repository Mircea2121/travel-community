"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Mail,
  Pencil,
  X,
} from "lucide-react";

import "./userProfile.css";

const MAX_BIO_LENGTH = 180;

export default function ProfileHeader({
  user,
  isOwnProfile = false,
  isFollowing = false,
  onFollow,
  onMessage,
  onSaveBio,
}) {
  const effectiveIsOwnProfile =
    isOwnProfile === true ||
    user?.isOwnProfile === true;

  function getValidImageUrl(image) {
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
  }

  const [avatarPreview, setAvatarPreview] = useState(
    getValidImageUrl(user?.avatar)
  );

  const [coverPreview, setCoverPreview] = useState(
    getValidImageUrl(user?.coverImage)
  );

  const [avatarLoadFailed, setAvatarLoadFailed] =
    useState(false);

  const [bio, setBio] = useState(user?.bio || "");
  const [bioDraft, setBioDraft] = useState(user?.bio || "");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [bioError, setBioError] = useState("");

  useEffect(() => {
    setAvatarPreview(getValidImageUrl(user?.avatar));
    setCoverPreview(getValidImageUrl(user?.coverImage));
    setAvatarLoadFailed(false);

    setBio(user?.bio || "");
    setBioDraft(user?.bio || "");
    setIsEditingBio(false);
    setBioError("");
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

  const shouldShowAvatarImage =
    Boolean(avatarPreview) && !avatarLoadFailed;

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

  function handleStartBioEdit() {
    setBioDraft(bio);
    setBioError("");
    setIsEditingBio(true);
  }

  function handleCancelBioEdit() {
    setBioDraft(bio);
    setBioError("");
    setIsEditingBio(false);
  }

  function handleBioChange(event) {
    const nextValue = event.target.value;

    if (nextValue.length > MAX_BIO_LENGTH) {
      return;
    }

    setBioDraft(nextValue);

    if (bioError) {
      setBioError("");
    }
  }

  async function handleSaveBio() {
    if (isSavingBio) {
      return;
    }

    const normalizedBio = bioDraft.trim();

    if (normalizedBio.length > MAX_BIO_LENGTH) {
      setBioError(
        `Descrierea poate avea maximum ${MAX_BIO_LENGTH} de caractere.`
      );

      return;
    }

    setIsSavingBio(true);
    setBioError("");

    try {
      if (typeof onSaveBio !== "function") {
        throw new Error(
          "Salvarea descrierii nu este încă conectată."
        );
      }

      await onSaveBio(normalizedBio);

      setBio(normalizedBio);
      setBioDraft(normalizedBio);
      setIsEditingBio(false);
    } catch (error) {
      setBioError(
        error?.message ||
          "Descrierea nu a putut fi salvată."
      );
    } finally {
      setIsSavingBio(false);
    }
  }

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

        {!effectiveIsOwnProfile && (
          <div className="travel-profile-cover-actions">
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

            <button
              type="button"
              className="travel-profile-action-btn travel-profile-action-primary"
              onClick={handleFollowClick}
            >
              {isFollowing
                ? "Urmărești"
                : "Urmărește"}
            </button>
          </div>
        )}
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

          <div className="travel-profile-bio-section">
            {isEditingBio ? (
              <div className="travel-profile-bio-editor">
                <textarea
                  value={bioDraft}
                  onChange={handleBioChange}
                  placeholder="Scrie o descriere scurtă despre tine..."
                  maxLength={MAX_BIO_LENGTH}
                  disabled={isSavingBio}
                  autoFocus
                />

                <div className="travel-profile-bio-editor-footer">
                  <span className="travel-profile-bio-counter">
                    {bioDraft.length}/{MAX_BIO_LENGTH}
                  </span>

                  <div className="travel-profile-bio-editor-actions">
                    <button
                      type="button"
                      className="travel-profile-bio-cancel"
                      onClick={handleCancelBioEdit}
                      disabled={isSavingBio}
                    >
                      <X
                        size={17}
                        aria-hidden="true"
                      />

                      <span>Anulează</span>
                    </button>

                    <button
                      type="button"
                      className="travel-profile-bio-save"
                      onClick={handleSaveBio}
                      disabled={isSavingBio}
                    >
                      <Check
                        size={17}
                        aria-hidden="true"
                      />

                      <span>
                        {isSavingBio
                          ? "Se salvează..."
                          : "Salvează"}
                      </span>
                    </button>
                  </div>
                </div>

                {bioError && (
                  <p
                    className="travel-profile-bio-error"
                    role="alert"
                  >
                    {bioError}
                  </p>
                )}
              </div>
            ) : (
              <div className="travel-profile-bio-display">
                <p className="travel-profile-bio">
                  {bio ||
                    (effectiveIsOwnProfile
                      ? "Adaugă o descriere scurtă despre tine."
                      : "Utilizatorul nu a adăugat încă o descriere.")}
                </p>

                {effectiveIsOwnProfile && (
                  <button
                    type="button"
                    className="travel-profile-bio-edit"
                    onClick={handleStartBioEdit}
                    aria-label="Editează descrierea scurtă"
                    title="Editează descrierea"
                  >
                    <Pencil
                      size={17}
                      strokeWidth={2.2}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}