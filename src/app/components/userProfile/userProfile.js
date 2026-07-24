"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ProfileHeader from "./profileHeader";
import ProfileStats from "./profileStats";
import ProfileTabs from "./profileTabs";
import UserPostsGrid from "./userPostsGrid";
import SavedPostsGrid from "./savedPostsGrid";

import "./userProfile.css";

export default function UserProfile({
  user: initialUser,
}) {
  const router = useRouter();

  const [user, setUser] = useState(
    initialUser || null
  );

  const [currentUser, setCurrentUser] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState("posts");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfileData() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.message ||
              "Sesiunea utilizatorului nu a putut fi verificată."
          );
        }

        const authenticatedUser =
          data?.user ||
          data?.data?.user ||
          null;

        if (!authenticatedUser) {
          throw new Error(
            "Datele utilizatorului autentificat lipsesc."
          );
        }

        if (!isMounted) {
          return;
        }

        setCurrentUser(authenticatedUser);

        if (initialUser) {
          setUser(initialUser);
        } else {
          setUser(authenticatedUser);
        }
      } catch (fetchError) {
        console.error(
          "Eroare la încărcarea profilului:",
          fetchError
        );

        if (!isMounted) {
          return;
        }

        setError(
          fetchError?.message ||
            "A apărut o eroare la încărcarea profilului."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, [initialUser]);

  const displayedUserId = String(
    user?.id || user?._id || ""
  );

  const currentUserId = String(
    currentUser?.id ||
      currentUser?._id ||
      ""
  );

  const isOwnProfile =
    Boolean(displayedUserId) &&
    Boolean(currentUserId) &&
    displayedUserId === currentUserId;

  function handleEditProfile() {
    if (!isOwnProfile) {
      return;
    }

    router.push("/profile/edit");
  }

  function handleMessage() {
    if (isOwnProfile) {
      return;
    }

    if (!displayedUserId) {
      return;
    }

    router.push(
      `/messages?user=${displayedUserId}`
    );
  }

  function handleFollow() {
    if (isOwnProfile) {
      return;
    }

    console.log(
      "Funcția de urmărire va fi conectată la backend."
    );
  }

  function handleTabChange(tabKey) {
    setActiveTab(tabKey);
  }

  if (loading) {
    return (
      <main className="user-profile-page">
        <div className="user-profile-loading">
          <p>Se încarcă profilul...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="user-profile-page">
        <div className="user-profile-error">
          <h2>
            Profilul nu a putut fi încărcat
          </h2>

          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="user-profile-page">
        <div className="user-profile-error">
          <h2>Utilizator indisponibil</h2>

          <p>
            Nu am găsit datele profilului.
          </p>
        </div>
      </main>
    );
  }

  const userId =
    user.id || user._id || null;

  const userName =
    user.name ||
    user.fullName ||
    user.username ||
    "Utilizator";

  const normalizedUser = {
    ...user,

    id: userId,
    _id: userId,

    name: userName,
    fullName: userName,

    username: user.username || "",

    avatar:
      user.avatar &&
      typeof user.avatar === "object"
        ? user.avatar
        : {
            url:
              typeof user.avatar === "string"
                ? user.avatar
                : "",
            publicId: "",
          },

    coverImage:
      user.coverImage &&
      typeof user.coverImage === "object"
        ? user.coverImage
        : {
            url:
              typeof user.coverImage === "string"
                ? user.coverImage
                : "",
            publicId: "",
          },

    posts: Array.isArray(user.posts)
      ? user.posts
      : [],

    savedPosts: Array.isArray(
      user.savedPosts
    )
      ? user.savedPosts
      : [],

    destinations: Array.isArray(
      user.destinations
    )
      ? user.destinations
      : [],
  };

  return (
    <main className="user-profile-page">
      <div className="user-profile-container">
        <ProfileHeader
          user={normalizedUser}
          isOwnProfile={isOwnProfile}
          isFollowing={Boolean(
            normalizedUser.isFollowing
          )}
          onFollow={handleFollow}
          onMessage={handleMessage}
          onEditProfile={handleEditProfile}
        />

        <ProfileStats
          user={normalizedUser}
        />

        <ProfileTabs
          isOwnProfile={isOwnProfile}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <div className="user-profile-tab-content">
          {activeTab === "posts" && (
            <UserPostsGrid
              posts={normalizedUser.posts}
            />
          )}

          {activeTab === "saved" &&
            isOwnProfile && (
              <SavedPostsGrid
                posts={
                  normalizedUser.savedPosts
                }
              />
            )}

          {activeTab === "destinations" && (
            <div className="profile-empty-state">
              <div className="profile-empty-icon">
                🌍
              </div>

              <h3>
                Nu există încă destinații
              </h3>

              <p>
                Destinațiile vizitate de
                utilizator vor apărea aici.
              </p>
            </div>
          )}

          {activeTab === "about" && (
            <section className="profile-empty-state">
              <div className="profile-empty-icon">
                👤
              </div>

              <h3>Despre utilizator</h3>

              <p>
                {normalizedUser.bio ||
                  "Utilizatorul nu a adăugat încă informații suplimentare despre el."}
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}