export const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const USERNAME_PATTERN =
  /^[a-z0-9._]{3,20}$/;

export const RESERVED_USERNAMES = [
  "admin",
  "administrator",
  "api",
  "auth",
  "login",
  "logout",
  "register",
  "support",
  "help",
  "root",
  "system",
  "user",
  "users",
  "profile",
  "profiles",
  "settings",
  "account",
  "accounts",
  "me",
];

export const NAME = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 50,
};

export const BIO = {
  MAX_LENGTH: 300,
};

export const LOCATION = {
  MAX_LENGTH: 100,
};

export const IMAGE = {
  MAX_SIZE: 5 * 1024 * 1024,

  ALLOWED_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
  ],

  MAX_AVATAR_COUNT: 1,

  MAX_COVER_COUNT: 1,

  MAX_EXPERIENCE_IMAGES: 10,
};