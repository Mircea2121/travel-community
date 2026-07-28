import { cookies, headers } from "next/headers";

import { demoUsers } from "../data/demoUsers";

async function getApplicationUrl() {
  const headersStore = await headers();

  const host =
    headersStore.get("x-forwarded-host") ||
    headersStore.get("host");

  const protocol =
    headersStore.get("x-forwarded-proto") ||
    (host?.includes("localhost")
      ? "http"
      : "https");

  if (!host) {
    return null;
  }

  return `${protocol}://${host}`;
}

export async function getUserById(id) {
  return (
    demoUsers.find(
      (user) =>
        String(user.id) === String(id)
    ) || null
  );
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const applicationUrl =
      await getApplicationUrl();

    if (!applicationUrl) {
      console.error(
        "Nu s-a putut determina adresa aplicației."
      );

      return null;
    }

    const response = await fetch(
      `${applicationUrl}/api/auth/me`,
      {
        method: "GET",

        headers: {
          Cookie: `token=${encodeURIComponent(
            token
          )}`,
        },

        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data?.success || !data?.user) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.error(
      "Eroare la obținerea utilizatorului autentificat:",
      error
    );

    return null;
  }
}

export async function followUser(userId) {
  // Temporar, până construim:
  // POST /api/users/:id/follow

  console.log("Follow:", userId);

  return {
    success: true,
  };
}

export async function unfollowUser(userId) {
  // Temporar, până construim:
  // DELETE /api/users/:id/follow

  console.log("Unfollow:", userId);

  return {
    success: true,
  };
}

export async function updateProfile(
  profileData
) {
  // Temporar, până construim:
  // PUT /api/users/me

  console.log(
    "Update profile:",
    profileData
  );

  return {
    success: true,
  };
}