export const SUPPORT_REQUEST_TYPES = Object.freeze([
  { value: "technical", label: "Problemă tehnică" },
  { value: "account", label: "Cont și autentificare" },
  { value: "privacy", label: "Date personale și confidențialitate" },
  { value: "feedback", label: "Sugestie sau feedback" },
  { value: "partnership", label: "Parteneriat" },
  { value: "other", label: "Alt subiect" },
]);

export const SUPPORT_LIMITS = Object.freeze({
  name: 100,
  email: 254,
  subject: 160,
  message: 5000,
});

const TYPE_SET = new Set(SUPPORT_REQUEST_TYPES.map((item) => item.value));

export function isSupportRequestType(value) {
  return typeof value === "string" && TYPE_SET.has(value);
}

