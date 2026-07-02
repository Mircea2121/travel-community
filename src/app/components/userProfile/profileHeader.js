"use client";

import { useState } from "react";
import "./userProfile.css";

export default function ProfileHeader({
  user,
  isOwnProfile = false,
  isFollowing = false,
  onFollow,
  onMessage,
  onEditProfile,
}) {
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [coverPreview, setCoverPreview] = useState(user?.coverImage || "");

  if (!user) return null;

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  }

  function handleCoverChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
  }

  return (
    <section className="travel-profile-hero">
      <div
        className="travel-profile-cover"
        style={{ backgroundImage: `url(${coverPreview})` }}
      >
        {isOwnProfile && (
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
          <button
            type="button"
            className="travel-profile-action-btn travel-profile-action-message"
            onClick={onMessage}
          >
            <span className="travel-profile-action-icon">✉</span>
            <span>Mesaj</span>
          </button>

          <button
            type="button"
            className="travel-profile-action-btn travel-profile-action-primary"
            onClick={isOwnProfile ? onEditProfile : onFollow}
          >
            <span>{isOwnProfile ? "Editează profilul" : isFollowing ? "Urmărești" : "Urmărește"}</span>
          </button>
        </div>
      </div>

      <div className="travel-profile-info-card">
        <div className="travel-profile-avatar-wrap">
          <img
            src={avatarPreview}
            alt={user.fullName}
            className="travel-profile-avatar"
          />

          {isOwnProfile && (
          <label className="travel-profile-avatar-upload">
            <span>+</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              hidden
            />
          </label>
          )}

          <span className="travel-profile-online" />
        </div>

        <div className="travel-profile-details">
          <div className="travel-profile-details-top">
            <div>
              <div className="travel-profile-name-row">
                <h1>{user.fullName}</h1>
                <span className="travel-profile-verified">✓</span>
              </div>

              <p className="travel-profile-username">@{user.username}</p>
            </div>

            <span className="travel-profile-level">{user.level}</span>
          </div>

          <p className="travel-profile-location">
            <span>📍</span>
            {user.city}, {user.country}
          </p>

          <p className="travel-profile-bio">{user.bio}</p>
        </div>
      </div>
    </section>
  );
}