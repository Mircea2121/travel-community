// În etapa actuală folosim date demo.
// După conectarea backend-ului, acest fișier va face request-uri către API.

import { demoUsers } from "../data/demoUsers";

export async function getUserById(id) {
  return demoUsers.find((user) => user.id === id) || null;
}

export async function getCurrentUser() {
  // După autentificare:
  // GET /api/users/me

  return demoUsers[0];
}

export async function followUser(userId) {
  // POST /api/users/:id/follow

  console.log("Follow:", userId);

  return {
    success: true,
  };
}

export async function unfollowUser(userId) {
  // DELETE /api/users/:id/follow

  console.log("Unfollow:", userId);

  return {
    success: true,
  };
}

export async function updateProfile(profileData) {
  // PUT /api/users/me

  console.log(profileData);

  return {
    success: true,
  };
}