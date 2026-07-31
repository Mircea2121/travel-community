import { getProfileStats } from "./profileStats";

export async function getPublicUser(user) {
  const profileData =
    await getProfileStats(user._id);

  return {
    id: user._id.toString(),

    name: user.name,
    username: user.username,

    bio: user.bio,
    location: user.location,

    avatar: user.avatar,
    coverImage: user.coverImage,

    stats: profileData.stats,
    level: profileData.level,

    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}