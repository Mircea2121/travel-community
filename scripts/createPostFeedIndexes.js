import clientPromise from "../src/app/utils/mongodb.js";

const DATABASE_NAME = "travel-community";

async function createPostIndexes(database) {
  const postsCollection = database.collection("posts");

  await postsCollection.createIndex(
    {
      createdAt: -1,
      _id: -1,
    },
    {
      name: "posts_by_created",
    }
  );

  await postsCollection.createIndex(
    {
      authorId: 1,
      createdAt: -1,
      _id: -1,
    },
    {
      name: "posts_by_author_created",
    }
  );
}

async function createLikeIndexes(database) {
  const likesCollection = database.collection("likes");

  await likesCollection.createIndex(
    {
      postId: 1,
      userId: 1,
    },
    {
      name: "unique_post_user_like",
      unique: true,
    }
  );

  await likesCollection.createIndex(
    {
      userId: 1,
      postId: 1,
    },
    {
      name: "likes_by_user_and_post",
    }
  );

  await likesCollection.createIndex(
    {
      postId: 1,
      createdAt: -1,
    },
    {
      name: "likes_by_post",
    }
  );
}

async function createSavedPostIndexes(database) {
  const savedPostsCollection =
    database.collection("savedPosts");

  await savedPostsCollection.createIndex(
    {
      userId: 1,
      postId: 1,
    },
    {
      name: "unique_saved_post_per_user",
      unique: true,
    }
  );

  await savedPostsCollection.createIndex(
    {
      userId: 1,
      createdAt: -1,
      _id: -1,
    },
    {
      name: "saved_posts_by_user_created",
    }
  );

  await savedPostsCollection.createIndex(
    {
      postId: 1,
    },
    {
      name: "saved_posts_by_post",
    }
  );
}

async function run() {
  const client = await clientPromise;
  const database = client.db(DATABASE_NAME);

  try {
    await createPostIndexes(database);
    console.info("Post feed indexes ready.");

    await createLikeIndexes(database);
    console.info("Post like indexes ready.");

    await createSavedPostIndexes(database);
    console.info("Saved post indexes ready.");

    console.info(
      "Post feed database indexes created successfully."
    );
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error(
    "Post feed index migration failed:",
    error
  );
  process.exitCode = 1;
});
