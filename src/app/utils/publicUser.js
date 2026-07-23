export function getPublicUser(user) {
  return {
    id: user._id.toString(),

    name: user.name,
    username: user.username,

    bio: user.bio,
    location: user.location,

    avatar: user.avatar,
    coverImage: user.coverImage,

    stats: user.stats,
    level: user.level,

    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}