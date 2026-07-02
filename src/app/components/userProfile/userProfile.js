"use client";

import { useSearchParams } from "next/navigation";

import "./userProfile.css";

import ProfileHeader from "./profileHeader";
import ProfileStats from "./profileStats";
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
  const activeTab = searchParams.get("tab") || "posts";

  if (!user) {
    return (
      <main className="travel-profile-page">
        <div className="profile-empty-state">
          <div className="profile-empty-icon">👤</div>
          <h3>Utilizator negăsit</h3>
          <p>Profilul pe care îl cauți nu există sau a fost șters.</p>
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

      <section className="travel-profile-content">
        {activeTab === "posts" && <UserPostsGrid posts={userPosts} />}

        {activeTab === "saved" && isOwnProfile && (
          <SavedPostsGrid posts={savedPosts} />
        )}

        {activeTab === "destinations" && (
          <div className="profile-empty-state">
            <div className="profile-empty-icon">🌍</div>
            <h3>Destinații</h3>
            <p>Aici vor apărea destinațiile utilizatorului.</p>
          </div>
        )}

        {activeTab === "about" && (
          <div className="profile-empty-state">
            <div className="profile-empty-icon">ⓘ</div>
            <h3>Despre {user.fullName}</h3>
            <p>{user.bio}</p>
          </div>
        )}
      </section>
    </main>
  );
}