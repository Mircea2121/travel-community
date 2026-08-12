import { getCurrentUser } from "./currentUser";

export async function getVerifiedCurrentUser(options) {
  const user = await getCurrentUser(options);

  if (!user) {
    return {
      user: null,
      error: {
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Trebuie să fii autentificat.",
      },
    };
  }

  if (!user.emailVerifiedAt) {
    return {
      user: null,
      error: {
        status: 403,
        code: "EMAIL_VERIFICATION_REQUIRED",
        message:
          "Confirmă adresa de email înainte de a publica sau trimite mesaje.",
      },
    };
  }

  return { user, error: null };
}

