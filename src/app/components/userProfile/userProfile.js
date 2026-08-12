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

  const [savedPosts, setSavedPosts] =
    useState([]);

  const [activeTab, setActiveTab] =
    useState("posts");

  const [loading, setLoading] =
    useState(true);

  const [postsLoading, setPostsLoading] =
    useState(false);

  const [
    savedPostsLoading,
    setSavedPostsLoading,
  ] = useState(false);

  const [error, setError] = useState("");

  const [postsError, setPostsError] =
    useState("");

  const [
    savedPostsError,
    setSavedPostsError,
  ] = useState("");

  const [isFollowing, setIsFollowing] =
    useState(
      initialIsFollowing === true
    );

  const [followLoading, setFollowLoading] =
    useState(false);

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      setIsFollowing(
        initialIsFollowing === true
      );
    }, 0);

    return () => window.clearTimeout(syncTimer);
  }, [initialIsFollowing]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfileData() {
      try {
        setLoading(true);
        setError("");
        setPostsError("");
        setSavedPostsError("");

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
          setSavedPosts([]);
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

        if (initialIsOwnProfile === true) {
          try {
            setSavedPostsLoading(true);
            setSavedPostsError("");

            const savedResponse =
              await fetch(
                "/api/posts/saved",
                {
                  method: "GET",
                  credentials: "include",
                  cache: "no-store",
                }
              );

            const savedData =
              await savedResponse.json();

            if (
              !savedResponse.ok ||
              !savedData?.success
            ) {
              throw new Error(
                savedData?.message ||
                  "Postările salvate nu au putut fi încărcate."
              );
            }

            if (!isMounted) {
              return;
            }

            setSavedPosts(
              Array.isArray(
                savedData.posts
              )
                ? savedData.posts
                : []
            );
          } catch (savedError) {
            console.error(
              "Eroare la încărcarea postărilor salvate:",
              savedError
            );

            if (!isMounted) {
              return;
            }

            setSavedPosts([]);

            setSavedPostsError(
              savedError?.message ||
                "Postările salvate nu au putut fi încărcate."
            );
          } finally {
            if (isMounted) {
              setSavedPostsLoading(false);
            }
          }
        } else {
          setSavedPosts([]);
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
          setPostsLoading(false);
        }
      }
    }

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, [
    initialUser,
    initialIsOwnProfile,
  ]);

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

  async function updateOwnProfile({
    name,
    bio,
  }) {
    if (!isOwnProfile) {
      throw new Error(
        "Nu poți modifica acest profil."
      );
    }

    if (!name) {
      throw new Error(
        "Numele profilului lipsește. Reîncarcă pagina și încearcă din nou."
      );
    }

    const existingLocation =
      typeof user?.location ===
        "string"
        ? user.location.trim()
        : "";

    const location =
      existingLocation ||
      [user?.city, user?.country]
        .filter(
          (value) =>
            typeof value ===
              "string" &&
            value.trim()
        )
        .map((value) => value.trim())
        .join(", ");

    const response = await fetch(
      "/api/users/me",
      {
        method: "PUT",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type":
            "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          bio,
          location,
        }),
      }
    );

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    let data = null;

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      data = await response.json();
    }

    if (
      !response.ok ||
      !data?.success
    ) {
      const requestError = new Error(
        data?.message ||
          "Profilul nu a putut fi salvat. Încearcă din nou."
      );

      requestError.code =
        data?.code || "";
      requestError.nextNameChangeAt =
        data?.nextNameChangeAt || null;

      throw requestError;
    }

    const updatedUser =
      data?.user || {};

    setUser((previousUser) => {
      if (!previousUser) {
        return previousUser;
      }

      return {
        ...previousUser,
        ...updatedUser,
        id:
          updatedUser.id ||
          updatedUser._id ||
          previousUser.id ||
          previousUser._id,
        fullName:
          updatedUser.fullName ||
          updatedUser.name ||
          previousUser.fullName ||
          previousUser.name,
        bio:
          typeof updatedUser.bio ===
          "string"
            ? updatedUser.bio
            : bio,
        stats: {
          ...(previousUser.stats ||
            {}),
          ...(updatedUser.stats ||
            {}),
        },
      };
    });

    setCurrentUser(
      (previousUser) => ({
        ...(previousUser || {}),
        ...updatedUser,
        bio:
          typeof updatedUser.bio ===
          "string"
            ? updatedUser.bio
            : bio,
      })
    );

    router.refresh();

    return updatedUser;
  }

  async function handleSaveBio(nextBio) {
    const name = String(
      user?.name ||
        user?.fullName ||
        currentUser?.name ||
        currentUser?.fullName ||
        ""
    )
      .trim()
      .replace(/\s+/g, " ");

    return updateOwnProfile({
      name,
      bio: nextBio,
    });
  }

  async function handleSaveName(nextName) {
    const bio = String(
      user?.bio || ""
    ).trim();

    return updateOwnProfile({
      name: nextName,
      bio,
    });
  }

  function handleEditProfile() {
    if (!isOwnProfile) {
      return;
    }

    router.push("/profile/edit");
  }

 async function handleMessage() {
    if (isOwnProfile) {
      return;
    }

    if (!displayedUserId) {
      window.alert(
        "Utilizatorul nu poate fi identificat."
      );

      return;
    }

    try {
      const response = await fetch(
        "/api/conversations/start",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            userId: displayedUserId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Conversația nu a putut fi creată."
        );
      }

      const conversationId =
        data?.conversation?._id;

      if (!conversationId) {
        throw new Error(
          "ID-ul conversației lipsește din răspunsul serverului."
        );
      }

      router.push(
        `/messages?conversation=${conversationId}`
      );
    } catch (messageError) {
      console.error(
        "Eroare la deschiderea conversației:",
        messageError
      );

      window.alert(
        messageError?.message ||
          "Conversația nu a putut fi pornită."
      );
    }
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

    savedPosts,

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
          onSaveName={handleSaveName}
          onSaveBio={handleSaveBio}
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
              <>
                {savedPostsLoading ? (
                  <div className="profile-empty-state">
                    <div className="profile-empty-icon">
                      ⏳
                    </div>

                    <h3>
                      Se încarcă
                      postările salvate
                    </h3>

                    <p>
                      Pregătim
                      experiențele
                      salvate.
                    </p>
                  </div>
                ) : savedPostsError ? (
                  <div className="profile-empty-state">
                    <div className="profile-empty-icon">
                      ⚠️
                    </div>

                    <h3>
                      Postările salvate
                      nu au putut fi
                      încărcate
                    </h3>

                    <p>
                      {savedPostsError}
                    </p>
                  </div>
                ) : (
                  <SavedPostsGrid
                    posts={
                      normalizedUser.savedPosts
                    }
                  />
                )}
              </>
            )}

        </div>
      </div>
    </main>
  );
}
