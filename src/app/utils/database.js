import clientPromise from "./mongodb";

const DATABASE_NAME =
  "travel-community";

export async function getDatabase() {
  const client =
    await clientPromise;

  return client.db(
    DATABASE_NAME
  );
}

export async function getUsersCollection() {
  const database =
    await getDatabase();

  return database.collection(
    "users"
  );
}

export async function getPostsCollection() {
  const database =
    await getDatabase();

  return database.collection(
    "posts"
  );
}

export async function getSavedPostsCollection() {
  const database =
    await getDatabase();

  return database.collection(
    "savedPosts"
  );
}

export async function getConversationsCollection() {
  const database =
    await getDatabase();

  return database.collection(
    "conversations"
  );
}

export async function getMessagesCollection() {
  const database =
    await getDatabase();

  return database.collection(
    "messages"
  );
}

export async function getConversationReportsCollection() {
  const database =
    await getDatabase();

  return database.collection(
    "conversationReports"
  );
}

export async function getPasswordResetTokensCollection() {
  const database =
    await getDatabase();

  return database.collection(
    "passwordResetTokens"
  );
}

export async function getAuthRateLimitsCollection() {
  const database =
    await getDatabase();

  return database.collection(
    "authRateLimits"
  );
}
