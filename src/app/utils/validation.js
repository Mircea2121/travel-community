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
  CHANGE_COOLDOWN_DAYS: 15,
  CHANGE_COOLDOWN_MS:
    15 * 24 * 60 * 60 * 1000,
};

export const BIO = {
  MAX_LENGTH: 300,
};

export const LOCATION = {
  MAX_LENGTH: 100,
};

export const PASSWORD = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 64,
  MAX_BYTES: 72,
};

export function getPasswordValidation(password) {
  const value =
    typeof password === "string"
      ? password
      : "";
  const byteLength = new TextEncoder().encode(value).length;

  const rules = {
    minimumLength:
      value.length >= PASSWORD.MIN_LENGTH,
    maximumLength:
      value.length <= PASSWORD.MAX_LENGTH,
    maximumBytes:
      byteLength <= PASSWORD.MAX_BYTES,
    lowercase: /[a-z]/.test(value),
    uppercase: /[A-Z]/.test(value),
    number: /\d/.test(value),
    atSymbol: value.includes("@"),
  };

  return {
    rules,
    byteLength,
    isValid: Object.values(rules).every(Boolean),
  };
}

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
