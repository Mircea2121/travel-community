"use client";

import { useSearchParams } from "next/navigation";

import "./userProfile.css";

import ProfileHeader from "./profileHeader";
import ProfileStats from "./profileStats";
import ProfileTabs from "./profileTabs";
import UserPostsGrid from "./userPostsGrid";
import SavedPostsGrid from "./savedPostsGrid";

export default function UserProfile({
  user,
  userPosts = [],
  savedPosts = [],
  isOwnProfile = false,
  isFollowing = false,
}) {
  const searchParams = useSearchParams();

  const requestedTab = searchParams.get("tab") || "posts";

  const activeTab =
    requestedTab === "saved" && !isOwnProfile
      ? "posts"
      : requestedTab;

  if (!user) {
    return (
      <main className="travel-profile-page">
        <div className="profile-empty-state">
          <div className="profile-empty-icon">👤</div>

          <h3>Utilizator negăsit</h3>

          <p>
            Profilul pe care îl cauți nu există sau nu mai este disponibil.
          </p>
        </div>
      </main>
    );
  }

  function handleFollow() {
    console.log("Follow / unfollow user:", user.id);
  }

  function handleMessage() {
    console.log("Open message with user:", user.id);
  }

  function handleEditProfile() {
    console.log("Open edit profile:", user.id);
  }

  return (
    <main className="travel-profile-page">
      <ProfileHeader
        user={user}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onMessage={handleMessage}
        onEditProfile={handleEditProfile}
      />

      <ProfileStats user={user} />

      <ProfileTabs isOwnProfile={isOwnProfile} />

      <section className="travel-profile-content">
        {activeTab === "posts" && (
          <UserPostsGrid posts={userPosts} />
        )}

        {activeTab === "saved" && isOwnProfile && (
          <SavedPostsGrid posts={savedPosts} />
        )}

        {activeTab === "destinations" && (
          <div className="profile-empty-state">
            <div className="profile-empty-icon">🌍</div>

            <h3>Destinații</h3>

            <p>
              Aici vor apărea destinațiile vizitate de acest utilizator.
            </p>
          </div>
        )}

        {activeTab === "about" && (
          <div className="profile-empty-state">
            <div className="profile-empty-icon">ⓘ</div>

            <h3>Despre {user.fullName}</h3>

            <p>
              {user.bio ||
                "Acest utilizator nu a adăugat încă o descriere."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}