"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  Mail,
  Pencil,
  X,
  Medal,
  Compass,
  Mountain,
  Gem,
  Crown,
} from "lucide-react";

import ImageCropModal from "./imageCropModal";

import "./userProfile.css";

const MAX_BIO_LENGTH = 180;

const LEVEL_BADGES = {
  1: {
    icon: Medal,
    name: "Călător începător",
  },

  2: {
    icon: Compass,
    name: "Explorator",
  },

  3: {
    icon: Mountain,
    name: "Aventurier",
  },

  4: {
    icon: Gem,
    name: "Maestru al călătoriilor",
  },

  5: {
    icon: Crown,
    name: "Călător veteran",
  },
};

export default function ProfileHeader({
  user,
  isOwnProfile = false,
  isFollowing = false,
  isFollowLoading = false,
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

  const [
    avatarPreview,
    setAvatarPreview,
  ] = useState(
    getValidImageUrl(user?.avatar)
  );

  const [
    coverPreview,
    setCoverPreview,
  ] = useState(
    getValidImageUrl(
      user?.coverImage
    )
  );

  const [
    avatarLoadFailed,
    setAvatarLoadFailed,
  ] = useState(false);

  const [
    cropModalOpen,
    setCropModalOpen,
  ] = useState(false);

  const [
    cropImageSource,
    setCropImageSource,
  ] = useState("");

  const [
    cropType,
    setCropType,
  ] = useState("avatar");

  const [bio, setBio] = useState(
    user?.bio || ""
  );

  const [
    bioDraft,
    setBioDraft,
  ] = useState(user?.bio || "");

  const [
    isEditingBio,
    setIsEditingBio,
  ] = useState(false);

  const [
    isSavingBio,
    setIsSavingBio,
  ] = useState(false);

  const [
    bioError,
    setBioError,
  ] = useState("");

  useEffect(() => {
    setAvatarPreview(
      getValidImageUrl(user?.avatar)
    );

    setCoverPreview(
      getValidImageUrl(
        user?.coverImage
      )
    );

    setAvatarLoadFailed(false);

    setBio(user?.bio || "");
    setBioDraft(user?.bio || "");
    setIsEditingBio(false);
    setBioError("");
  }, [user]);

  useEffect(() => {
    return () => {
      if (
        avatarPreview?.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          avatarPreview
        );
      }

      if (
        coverPreview?.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          coverPreview
        );
      }
    };
  }, [
    avatarPreview,
    coverPreview,
  ]);

  useEffect(() => {
    return () => {
      if (
        cropImageSource?.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          cropImageSource
        );
      }
    };
  }, [cropImageSource]);

  if (!user) {
    return null;
  }

  const fullName =
    user.fullName ||
    user.name ||
    user.username ||
    "Utilizator";

  const levelNumber =
    Number(user?.level?.number) || 1;

  const normalizedLevelNumber =
    Math.min(
      Math.max(levelNumber, 1),
      5
    );

  const levelBadge =
    LEVEL_BADGES[
      normalizedLevelNumber
    ] || LEVEL_BADGES[1];

  const levelName =
    levelBadge?.name ||
    (
      typeof user.level ===
      "object"
        ? user.level?.name
        : user.level
    ) ||
    "Călător începător";

  const LevelIcon =
    levelBadge?.icon || Medal;

  const locationText = [
    user.city,
    user.country,
  ]
    .filter(Boolean)
    .join(", ");

  const fallbackInitial =
    fullName
      .trim()
      .charAt(0)
      .toUpperCase() || "?";

  const shouldShowAvatarImage =
    Boolean(avatarPreview) &&
    !avatarLoadFailed;

  function closeCropModal() {
    setCropModalOpen(false);

    setCropImageSource("");
  }

  function openCropModal({
    file,
    type,
  }) {
    if (
      cropImageSource?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        cropImageSource
      );
    }

    const imageUrl =
      URL.createObjectURL(file);

    setCropType(type);
    setCropImageSource(imageUrl);
    setCropModalOpen(true);
  }

  function handleAvatarChange(
    event
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      return;
    }

    openCropModal({
      file,
      type: "avatar",
    });
  }

  function handleCoverChange(
    event
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      return;
    }

    openCropModal({
      file,
      type: "cover",
    });
  }

  async function handleSaveCroppedImage(
    croppedFile
  ) {
    const isAvatar =
      cropType === "avatar";

    const endpoint = isAvatar
      ? "/api/users/avatar"
      : "/api/users/cover";

    const formData =
      new FormData();

    formData.append(
      isAvatar
        ? "avatar"
        : "cover",
      croppedFile
    );

    let response;

    try {
      response = await fetch(endpoint, {
        method: "PUT",
        body: formData,
      });
    } catch (error) {
      console.error(
        "Eroare de rețea la salvarea imaginii:",
        error
      );

      throw new Error(
        "Imaginea nu a putut fi trimisă. Verifică conexiunea și încearcă din nou."
      );
    }

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Serverul a trimis un răspuns invalid."
      );
    }

    if (
      !response.ok ||
      data?.success !== true
    ) {
      throw new Error(
        data?.message ||
          "Imaginea nu a putut fi salvată."
      );
    }

    const updatedUser =
      data?.user || {};

    if (isAvatar) {
      const savedAvatar =
        getValidImageUrl(
          updatedUser?.avatar
        );

      if (!savedAvatar) {
        throw new Error(
          "Avatarul a fost încărcat, dar adresa imaginii lipsește."
        );
      }

      setAvatarLoadFailed(false);

      setAvatarPreview(
        savedAvatar
      );
    } else {
      const savedCover =
        getValidImageUrl(
          updatedUser?.coverImage
        );

      if (!savedCover) {
        throw new Error(
          "Coperta a fost încărcată, dar adresa imaginii lipsește."
        );
      }

      setCoverPreview(
        savedCover
      );
    }

    closeCropModal();
  }

  function handleAvatarError() {
    setAvatarLoadFailed(true);
  }

  function handleMessageClick() {
    if (
      typeof onMessage ===
      "function"
    ) {
      onMessage(user);
    }
  }

  function handleFollowClick() {
    if (
      isFollowLoading ||
      typeof onFollow !==
        "function"
    ) {
      return;
    }

    onFollow(user);
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

  function handleBioChange(
    event
  ) {
    const nextValue =
      event.target.value;

    if (
      nextValue.length >
      MAX_BIO_LENGTH
    ) {
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

    const normalizedBio =
      bioDraft.trim();

    if (
      normalizedBio.length >
      MAX_BIO_LENGTH
    ) {
      setBioError(
        `Descrierea poate avea maximum ${MAX_BIO_LENGTH} de caractere.`
      );

      return;
    }

    setIsSavingBio(true);
    setBioError("");

    try {
      if (
        typeof onSaveBio !==
        "function"
      ) {
        throw new Error(
          "Salvarea descrierii nu este încă conectată."
        );
      }

      await onSaveBio(
        normalizedBio
      );

      setBio(normalizedBio);

      setBioDraft(
        normalizedBio
      );

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
    <>
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
                onChange={
                  handleCoverChange
                }
                hidden
              />
            </label>
          )}

          {!effectiveIsOwnProfile && (
            <div className="travel-profile-cover-actions">
              <button
                type="button"
                className="travel-profile-action-btn travel-profile-action-message"
                onClick={
                  handleMessageClick
                }
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
                onClick={
                  handleFollowClick
                }
                disabled={
                  isFollowLoading
                }
                aria-busy={
                  isFollowLoading
                }
              >
                {isFollowLoading
                  ? "Se actualizează..."
                  : isFollowing
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
                onError={
                  handleAvatarError
                }
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
                <span aria-hidden="true">
                  +
                </span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleAvatarChange
                  }
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

                  {user.isVerified ===
                    true && (
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

              <span
                className={`travel-profile-level travel-profile-level-${normalizedLevelNumber}`}
                title={`Nivel ${normalizedLevelNumber}`}
              >
                <LevelIcon
                  size={18}
                  strokeWidth={2.2}
                  aria-hidden="true"
                />

                <span>
                  {levelName}
                </span>
              </span>
            </div>

            {locationText && (
              <p className="travel-profile-location">
                <span aria-hidden="true">
                  📍
                </span>

                {locationText}
              </p>
            )}

            <div className="travel-profile-bio-section">
              {isEditingBio ? (
                <div className="travel-profile-bio-editor">
                  <textarea
                    value={bioDraft}
                    onChange={
                      handleBioChange
                    }
                    placeholder="Scrie o descriere scurtă despre tine..."
                    maxLength={
                      MAX_BIO_LENGTH
                    }
                    disabled={
                      isSavingBio
                    }
                    autoFocus
                  />

                  <div className="travel-profile-bio-editor-footer">
                    <span className="travel-profile-bio-counter">
                      {bioDraft.length}/
                      {MAX_BIO_LENGTH}
                    </span>

                    <div className="travel-profile-bio-editor-actions">
                      <button
                        type="button"
                        className="travel-profile-bio-cancel"
                        onClick={
                          handleCancelBioEdit
                        }
                        disabled={
                          isSavingBio
                        }
                      >
                        <X
                          size={17}
                          aria-hidden="true"
                        />

                        <span>
                          Anulează
                        </span>
                      </button>

                      <button
                        type="button"
                        className="travel-profile-bio-save"
                        onClick={
                          handleSaveBio
                        }
                        disabled={
                          isSavingBio
                        }
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
                      (
                        effectiveIsOwnProfile
                          ? "Adaugă o descriere scurtă despre tine."
                          : "Utilizatorul nu a adăugat încă o descriere."
                      )}
                  </p>

                  {effectiveIsOwnProfile && (
                    <button
                      type="button"
                      className="travel-profile-bio-edit"
                      onClick={
                        handleStartBioEdit
                      }
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

      <ImageCropModal
        isOpen={cropModalOpen}
        imageSource={
          cropImageSource
        }
        type={cropType}
        onClose={
          closeCropModal
        }
        onSave={
          handleSaveCroppedImage
        }
      />
    </>
  );
}