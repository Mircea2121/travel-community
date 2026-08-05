export const MESSAGE_POLICY = Object.freeze({
  MAX_TEXT_LENGTH: 2000,
  EDIT_WINDOW_MS: 15 * 60 * 1000,
  DELETE_FOR_EVERYONE_WINDOW_MS: 60 * 60 * 1000,
});

function getMessageAge(createdAt, now = new Date()) {
  const createdDate =
    createdAt instanceof Date
      ? createdAt
      : new Date(createdAt);
  const nowDate = now instanceof Date ? now : new Date(now);

  if (
    Number.isNaN(createdDate.getTime()) ||
    Number.isNaN(nowDate.getTime())
  ) {
    return null;
  }

  return Math.max(nowDate.getTime() - createdDate.getTime(), 0);
}

export function canEditMessage(createdAt, now = new Date()) {
  const age = getMessageAge(createdAt, now);

  return age !== null && age <= MESSAGE_POLICY.EDIT_WINDOW_MS;
}

export function canDeleteMessageForEveryone(
  createdAt,
  now = new Date()
) {
  const age = getMessageAge(createdAt, now);

  return (
    age !== null &&
    age <= MESSAGE_POLICY.DELETE_FOR_EVERYONE_WINDOW_MS
  );
}
