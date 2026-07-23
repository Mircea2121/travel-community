export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
};

export const DEFAULT_USER_LEVEL = {
  number: 1,
  name: "Călător începător",
  currentXp: 0,
  nextLevelXp: 500,
};

export const DEFAULT_USER_STATS = {
  postsCount: 0,
  destinationsCount: 0,
  followersCount: 0,
  followingCount: 0,
  likesReceived: 0,
  photosUploaded: 0,
};

export const DEFAULT_AVATAR = "";

export const DEFAULT_COVER_IMAGE = "";

export const USERNAME = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
};

export const PASSWORD = {
  MIN_LENGTH: 8,
};

export const JWT = {
  COOKIE_NAME: "token",
  EXPIRES_IN_DAYS: 7,
};