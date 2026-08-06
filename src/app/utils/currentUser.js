import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import {
  isAuthTokenCurrent,
  verifyToken,
} from "./auth";
import { getUsersCollection } from "./database";

export async function getCurrentUser(
  { includePassword = false } = {}
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  let payload;

  try {
    payload = await verifyToken(token);
  } catch {
    return null;
  }

  if (
    typeof payload?.userId !== "string" ||
    !ObjectId.isValid(payload.userId)
  ) {
    return null;
  }

  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne(
    {
      _id: new ObjectId(payload.userId),
    },
    includePassword
      ? {}
      : {
          projection: {
            password: 0,
          },
        }
  );

  if (!user || !isAuthTokenCurrent(payload, user)) {
    return null;
  }

  return user;
}
