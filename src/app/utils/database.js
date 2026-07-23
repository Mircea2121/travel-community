import clientPromise from "./mongodb";

const DATABASE_NAME = "travel-community";

export async function getDatabase() {
  const client = await clientPromise;

  return client.db(DATABASE_NAME);
}

export async function getUsersCollection() {
  const database = await getDatabase();

  return database.collection("users");
}