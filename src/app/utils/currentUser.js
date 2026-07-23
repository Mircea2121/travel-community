import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { verifyToken } from "./auth";
import { getUsersCollection } from "./database";

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);

  if (!payload?.userId || !ObjectId.isValid(payload.userId)) {
    return null;
  }

  const usersCollection = await getUsersCollection();

  const user = await usersCollection.findOne(
    {
      _id: new ObjectId(payload.userId),
    },
    {
      projection: {
        password: 0,
      },
    }
  );

  return user;
}