export function getUserInitials(
  userOrName,
  fallback = "U"
) {
  const rawName =
    typeof userOrName === "string"
      ? userOrName
      : userOrName?.name ||
        userOrName?.fullName ||
        userOrName?.displayName ||
        userOrName?.username ||
        "";

  const words = String(rawName)
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2);

  const initials = words
    .map((word) =>
      Array.from(word.replace(/^@+/u, ""))[0]
    )
    .filter(Boolean)
    .join("")
    .toLocaleUpperCase("ro-RO");

  if (initials) {
    return initials;
  }

  const normalizedFallback = String(
    fallback || "U"
  ).trim();

  return (
    Array.from(normalizedFallback)[0] || "U"
  ).toLocaleUpperCase("ro-RO");
}

export default getUserInitials;
