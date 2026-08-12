import clientPromise from "./mongodb";

const DATABASE_NAME = "travel-community";

export async function getDatabase() {
  const client = await clientPromise;
  return client.db(DATABASE_NAME);
}

export async function getUsersCollection() {
  return (await getDatabase()).collection("users");
}

export async function getPostsCollection() {
  return (await getDatabase()).collection("posts");
}

export async function getSavedPostsCollection() {
  return (await getDatabase()).collection("savedPosts");
}

export async function getConversationsCollection() {
  return (await getDatabase()).collection("conversations");
}

export async function getMessagesCollection() {
  return (await getDatabase()).collection("messages");
}

export async function getConversationReportsCollection() {
  return (await getDatabase()).collection("conversationReports");
}

export async function getPasswordResetTokensCollection() {
  return (await getDatabase()).collection("passwordResetTokens");
}

export async function getEmailVerificationTokensCollection() {
  return (await getDatabase()).collection("emailVerificationTokens");
}

export async function getAuthRateLimitsCollection() {
  return (await getDatabase()).collection("authRateLimits");
}

export async function getSupportRequestsCollection() {
  return (await getDatabase()).collection("supportRequests");
}

