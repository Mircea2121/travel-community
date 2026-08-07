import UserProfile from "../components/userProfile/userProfile";

import { getCurrentUser } from "../utils/currentUser";

export const dynamic = "force-dynamic";

function getUsername(user) {
  if (
    typeof user?.username === "string" &&
    user.username.trim()
  ) {
    return user.username
      .trim()
      .toLowerCase();
  }

  if (
    typeof user?.email === "string" &&
    user.email.includes("@")
  ) {
    return user.email
      .split("@")[0]
      .trim()
      .toLowerCase();
  }

  if (
    typeof user?.name === "string" &&
    user.name.trim()
  ) {
    return user.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ".");
  }

  return "utilizator";
}

function getLocation(user) {
  if (
    typeof user?.location !== "string"
  ) {
    return {
      city: user?.city || "",
      country: user?.country || "",
    };
  }

  const locationParts = user.location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    city:
      user?.city ||
      locationParts[0] ||
      "",

    country:
      user?.country ||
      locationParts[1] ||
      "",
  };
}

function serializeId(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const serializedValue = String(value);

  return serializedValue === "[object Object]"
    ? ""
    : serializedValue;
}

function serializeDate(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
}

function createProfileUser(user) {
  const { city, country } =
    getLocation(user);

  return {
    id: serializeId(
      user?.id || user?._id
    ),

    fullName:
      user?.fullName ||
      user?.name ||
      "Utilizator",

    username: getUsername(user),

    email: user?.email || "",
    role: user?.role || "user",

    bio:
      user?.bio ||
      "Pasionat de călătorii, experiențe noi și locuri care merită descoperite.",

    city,
    country,

    avatar: user?.avatar || "",

    coverImage:
      user?.coverImage ||
      user?.cover ||
      "",

    level:
      user?.level ||
      "Călător începător",

    photosUploaded:
      Number(user?.photosUploaded) || 0,

    stats: {
      postsCount:
        Number(
          user?.stats?.postsCount ??
            user?.postsCount
        ) || 0,

      destinationsCount:
        Number(
          user?.stats
            ?.destinationsCount ??
            user?.destinationsCount
        ) || 0,

      likesReceived:
        Number(
          user?.stats?.likesReceived ??
            user?.likesReceived
        ) || 0,

      followers:
        Number(
          user?.stats?.followers ??
            user?.followersCount
        ) || 0,

      following:
        Number(
          user?.stats?.following ??
            user?.followingCount
        ) || 0,
    },

    nextLevel: {
      currentScore:
        Number(
          user?.nextLevel?.currentScore
        ) || 0,

      pointsNeeded:
        Number(
          user?.nextLevel?.pointsNeeded
        ) || 500,

      nextLevel:
        user?.nextLevel?.nextLevel ||
        "Călător explorator",
    },

    createdAt: serializeDate(
      user?.createdAt
    ),

    updatedAt: serializeDate(
      user?.updatedAt
    ),
  };
}

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <UserProfile
        user={null}
        userPosts={[]}
        savedPosts={[]}
        isOwnProfile={true}
        isFollowing={false}
      />
    );
  }

  const profileUser =
    createProfileUser(user);

  return (
    <UserProfile
      user={profileUser}
      userPosts={[]}
      savedPosts={[]}
      isOwnProfile={true}
      isFollowing={false}
    />
  );
}
