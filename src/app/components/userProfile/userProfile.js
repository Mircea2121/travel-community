"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import ProfileHeader from "./profileHeader";
import ProfileStats from "./profileStats";
import ProfileTabs from "./profileTabs";
import UserPostsGrid from "./userPostsGrid";
import SavedPostsGrid from "./savedPostsGrid";

import "./userProfile.css";

export default function UserProfile({
  user: initialUser,
  isOwnProfile: initialIsOwnProfile = false,
  isFollowing: initialIsFollowing = false,
}) {
  const router = useRouter();

  const [user, setUser] = useState(
    initialUser || null
  );

  const [currentUser, setCurrentUser] =
    useState(null);

  const [posts, setPosts] = useState([]);

  const [activeTab, setActiveTab] =
    useState("posts");

  const [loading, setLoading] =
    useState(true);

  const [postsLoading, setPostsLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [postsError, setPostsError] =
    useState("");

  const [isFollowing, setIsFollowing] =
    useState(
      initialIsFollowing === true
    );

  const [followLoading, setFollowLoading] =
    useState(false);

  useEffect(() => {
    setIsFollowing(
      initialIsFollowing === true
    );
  }, [initialIsFollowing]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfileData() {
      try {
        setLoading(true);
        setError("");
        setPostsError("");

        const authResponse = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const authData =
          await authResponse.json();

        if (
          !authResponse.ok ||
          !authData?.success
        ) {
          throw new Error(
            authData?.message ||
              "Sesiunea utilizatorului nu a putut fi verificată."
          );
        }

        const authenticatedUser =
          authData?.user ||
          authData?.data?.user ||
          null;

        if (!authenticatedUser) {
          throw new Error(
            "Datele utilizatorului autentificat lipsesc."
          );
        }

        const displayedUser =
          initialIsOwnProfile === true
            ? authenticatedUser
            : initialUser || authenticatedUser;

        if (!isMounted) {
          return;
        }

        setCurrentUser(
          authenticatedUser
        );

        setUser((previousUser) => {
          if (!previousUser) {
            return displayedUser;
          }

          return {
            ...previousUser,
            ...displayedUser,

            stats: {
              ...(previousUser.stats ||
                {}),
              ...(displayedUser.stats ||
                {}),
            },

            level: {
              ...(previousUser.level ||
                {}),
              ...(displayedUser.level ||
                {}),
            },
          };
        });

        const profileUsername =
          displayedUser?.username
            ?.trim()
            .toLowerCase();

        if (!profileUsername) {
          setPosts([]);
          return;
        }

        setPostsLoading(true);

        const postsResponse =
          await fetch(
            `/api/posts?username=${encodeURIComponent(
              profileUsername
            )}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const postsData =
          await postsResponse.json();

        if (
          !postsResponse.ok ||
          !postsData?.success
        ) {
          throw new Error(
            postsData?.message ||
              "Postările nu au putut fi încărcate."
          );
        }

        if (!isMounted) {
          return;
        }

        setPosts(
          Array.isArray(
            postsData.posts
          )
            ? postsData.posts
            : []
        );
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
          setPostsLoading(false);
        }
      }
    }

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, [initialUser]);

  const displayedUserId = String(
    user?.id ||
      user?._id ||
      ""
  );

  const currentUserId = String(
    currentUser?.id ||
      currentUser?._id ||
      ""
  );

  const isOwnProfile =
    initialIsOwnProfile === true ||
    (
      Boolean(displayedUserId) &&
      Boolean(currentUserId) &&
      displayedUserId ===
        currentUserId
    );

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

  async function handleFollow() {
    if (
      isOwnProfile ||
      followLoading
    ) {
      return;
    }

    const username =
      user?.username
        ?.trim()
        .toLowerCase();

    if (!username) {
      window.alert(
        "Username-ul profilului lipsește."
      );

      return;
    }

    setFollowLoading(true);

    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(
          username
        )}/follow`,
        {
          method: isFollowing
            ? "DELETE"
            : "POST",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Urmărirea nu a putut fi actualizată."
        );
      }

      const nextIsFollowing =
        data.isFollowing === true;

      setIsFollowing(
        nextIsFollowing
      );

      setUser((previousUser) => {
        if (!previousUser) {
          return previousUser;
        }

        const previousStats =
          previousUser.stats || {};

        const previousFollowersCount =
          Number(
            previousStats.followersCount
          ) || 0;

        const nextFollowersCount =
          Number.isFinite(
            Number(
              data.followersCount
            )
          )
            ? Number(
                data.followersCount
              )
            : Math.max(
                previousFollowersCount +
                  (
                    nextIsFollowing
                      ? 1
                      : -1
                  ),
                0
              );

        return {
          ...previousUser,

          stats: {
            ...previousStats,

            followersCount:
              nextFollowersCount,
          },

          isFollowing:
            nextIsFollowing,
        };
      });
    } catch (followError) {
      console.error(
        "Eroare follow/unfollow:",
        followError
      );

      window.alert(
        followError?.message ||
          "Urmărirea nu a putut fi actualizată."
      );
    } finally {
      setFollowLoading(false);
    }
  }

  function handleTabChange(tabKey) {
    setActiveTab(tabKey);
  }

  if (loading) {
    return (
      <main className="user-profile-page">
        <div className="user-profile-loading">
          <p>
            Se încarcă profilul...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="user-profile-page">
        <div className="user-profile-error">
          <h2>
            Profilul nu a putut fi
            încărcat
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
          <h2>
            Utilizator indisponibil
          </h2>

          <p>
            Nu am găsit datele
            profilului.
          </p>
        </div>
      </main>
    );
  }

  const userId =
    user.id ||
    user._id ||
    null;

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

    username:
      user.username || "",

    isFollowing,

    avatar:
      user.avatar &&
      typeof user.avatar ===
        "object"
        ? user.avatar
        : {
            url:
              typeof user.avatar ===
              "string"
                ? user.avatar
                : "",

            publicId: "",
          },

    coverImage:
      user.coverImage &&
      typeof user.coverImage ===
        "object"
        ? user.coverImage
        : {
            url:
              typeof user.coverImage ===
              "string"
                ? user.coverImage
                : "",

            publicId: "",
          },

    posts,

    savedPosts:
      Array.isArray(
        user.savedPosts
      )
        ? user.savedPosts
        : [],

    destinations:
      Array.isArray(
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
          isFollowing={isFollowing}
          isFollowLoading={
            followLoading
          }
          onFollow={handleFollow}
          onMessage={handleMessage}
          onEditProfile={
            handleEditProfile
          }
        />

        <ProfileStats
          user={normalizedUser}
        />

        <ProfileTabs
          isOwnProfile={isOwnProfile}
          activeTab={activeTab}
          onTabChange={
            handleTabChange
          }
        />

        <div className="user-profile-tab-content">
          {activeTab ===
            "posts" && (
            <>
              {postsLoading ? (
                <div className="profile-empty-state">
                  <div className="profile-empty-icon">
                    ⏳
                  </div>

                  <h3>
                    Se încarcă
                    postările
                  </h3>

                  <p>
                    Pregătim
                    experiențele
                    publicate.
                  </p>
                </div>
              ) : postsError ? (
                <div className="profile-empty-state">
                  <div className="profile-empty-icon">
                    ⚠️
                  </div>

                  <h3>
                    Postările nu au
                    putut fi
                    încărcate
                  </h3>

                  <p>
                    {postsError}
                  </p>
                </div>
              ) : (
                <UserPostsGrid
                  posts={
                    normalizedUser.posts
                  }
                />
              )}
            </>
          )}

          {activeTab ===
            "saved" &&
            isOwnProfile && (
              <SavedPostsGrid
                posts={
                  normalizedUser.savedPosts
                }
              />
            )}

          {activeTab ===
            "about" && (
            <section className="profile-empty-state">
              <div className="profile-empty-icon">
                👤
              </div>

              <h3>
                Despre utilizator
              </h3>

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