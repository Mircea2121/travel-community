import clientPromise from "../src/app/utils/mongodb.js";

const DATABASE_NAME = "travel-community";
const USERS_INDEX_NAME = "global_users_v1";
const POSTS_INDEX_NAME = "global_posts_v1";

const autocompleteField = {
  type: "autocomplete",
  analyzer: "lucene.standard",
  tokenization: "edgeGram",
  minGrams: 2,
  maxGrams: 20,
  foldDiacritics: true,
};

const usersDefinition = {
  mappings: {
    dynamic: false,
    fields: {
      name: autocompleteField,
      username: autocompleteField,
      location: autocompleteField,
      accountStatus: {
        type: "token",
        normalizer: "lowercase",
      },
    },
  },
};

const postsDefinition = {
  mappings: {
    dynamic: false,
    fields: {
      title: autocompleteField,
      destination: autocompleteField,
      country: autocompleteField,
      city: autocompleteField,
      category: autocompleteField,
      description: {
        type: "string",
        analyzer: "lucene.standard",
        searchAnalyzer: "lucene.standard",
      },
      tips: {
        type: "string",
        analyzer: "lucene.standard",
        searchAnalyzer: "lucene.standard",
      },
    },
  },
};

async function ensureSearchIndex(collection, name, definition) {
  const existingIndexes = await collection
    .listSearchIndexes(name)
    .toArray();

  if (existingIndexes.length === 0) {
    await collection.createSearchIndex({
      name,
      definition,
    });

    console.info(`Search index ${name} was created.`);
    return;
  }

  await collection.updateSearchIndex(name, definition);
  console.info(`Search index ${name} was updated.`);
}

async function run() {
  const client = await clientPromise;
  const database = client.db(DATABASE_NAME);

  try {
    await ensureSearchIndex(
      database.collection("users"),
      USERS_INDEX_NAME,
      usersDefinition
    );

    await ensureSearchIndex(
      database.collection("posts"),
      POSTS_INDEX_NAME,
      postsDefinition
    );

    console.info(
      "Global search indexes submitted successfully. Atlas can take a few minutes to finish building them."
    );
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error("Global search index setup failed:", error);
  process.exitCode = 1;
});
