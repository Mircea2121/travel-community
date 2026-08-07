import clientPromise from "../src/app/utils/mongodb.js";
import { normalizeCountryKey } from "../src/app/utils/discovery.js";

const DATABASE_NAME = "travel-community";
const BATCH_SIZE = 500;

async function run() {
  const client = await clientPromise;
  const database = client.db(DATABASE_NAME);
  const posts = database.collection("posts");
  const users = database.collection("users");
  const cursor = posts.find({}, { projection: { country: 1, countryKey: 1 } });
  let operations = [];

  for await (const post of cursor) {
    const countryKey = normalizeCountryKey(post.country);
    if (countryKey && countryKey !== post.countryKey) {
      operations.push({ updateOne: { filter: { _id: post._id }, update: { $set: { countryKey } } } });
    }
    if (operations.length >= BATCH_SIZE) {
      await posts.bulkWrite(operations, { ordered: false });
      operations = [];
    }
  }

  if (operations.length) await posts.bulkWrite(operations, { ordered: false });

  await Promise.all([
    posts.createIndex({ countryKey: 1, createdAt: -1, _id: -1 }, { name: "discovery_country_newest" }),
    posts.createIndex({ category: 1, createdAt: -1, _id: -1 }, { name: "discovery_category_newest" }),
    users.createIndex({ lastSeenAt: -1 }, { name: "presence_last_seen" }),
  ]);

  console.log("Discovery country keys rebuilt.");
  console.log("Discovery and presence indexes ready.");
  await client.close();
}

run().catch((error) => {
  console.error("Discovery migration failed:", error);
  process.exitCode = 1;
});
