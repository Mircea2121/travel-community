import UserProfile from "../components/userProfile/userProfile";
import { getCurrentUser } from "../services/users";

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

  const username =
    user.email?.split("@")[0] ||
    user.name?.toLowerCase().replace(/\s+/g, ".") ||
    "utilizator";

  const locationParts = user.location
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const city = locationParts?.[0] || "";
  const country = locationParts?.[1] || "";

  const profileUser = {
    id: user.id,

    fullName: user.name || "Utilizator",
    username,

    email: user.email || "",
    role: user.role || "user",

    bio:
      user.bio ||
      "Pasionat de călătorii, experiențe noi și locuri care merită descoperite.",

    city,
    country,

    avatar: user.avatar || "",
    coverImage: user.coverImage || "",

    level: "Călător începător",

    photosUploaded: 0,

    stats: {
      postsCount: user.postsCount || 0,
      destinationsCount: 0,
      likesReceived: 0,
      followers: user.followersCount || 0,
      following: user.followingCount || 0,
    },

    nextLevel: {
      currentScore: 0,
      pointsNeeded: 500,
      nextLevel: "Călător explorator",
    },

    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };

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