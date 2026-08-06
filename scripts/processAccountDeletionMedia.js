import { deleteImage } from "../src/app/utils/cloudinary.js";
import clientPromise from "../src/app/utils/mongodb.js";

const DATABASE_NAME =
  "travel-community";
const BATCH_SIZE = 100;
const CONCURRENCY = 5;

async function processDeletedUser(
  usersCollection,
  user
) {
  const publicIds = Array.isArray(
    user.mediaDeletionPending
  )
    ? [
        ...new Set(
          user.mediaDeletionPending
            .filter(
              (value) =>
                typeof value === "string"
            )
            .map((value) => value.trim())
            .filter(Boolean)
        ),
      ]
    : [];

  if (publicIds.length === 0) {
    await usersCollection.updateOne(
      {
        _id: user._id,
        accountStatus: "deleted",
      },
      {
        $unset: {
          mediaDeletionPending: "",
        },
      }
    );

    return;
  }

  const results = await Promise.allSettled(
    publicIds.map((publicId) =>
      deleteImage(publicId)
    )
  );

  const failedPublicIds = publicIds.filter(
    (_, index) =>
      results[index]?.status === "rejected"
  );

  await usersCollection.updateOne(
    {
      _id: user._id,
      accountStatus: "deleted",
    },
    failedPublicIds.length > 0
      ? {
          $set: {
            mediaDeletionPending:
              failedPublicIds,
            mediaDeletionLastAttemptAt:
              new Date(),
          },
        }
      : {
          $unset: {
            mediaDeletionPending: "",
            mediaDeletionLastAttemptAt: "",
          },
        }
  );
}

async function run() {
  const client = await clientPromise;
  const database = client.db(
    DATABASE_NAME
  );
  const usersCollection =
    database.collection("users");

  try {
    const users = await usersCollection
      .find(
        {
          accountStatus: "deleted",
          "mediaDeletionPending.0": {
            $exists: true,
          },
        },
        {
          projection: {
            _id: 1,
            mediaDeletionPending: 1,
          },
        }
      )
      .sort({
        deletedAt: 1,
      })
      .limit(BATCH_SIZE)
      .toArray();

    for (
      let index = 0;
      index < users.length;
      index += CONCURRENCY
    ) {
      const batch = users.slice(
        index,
        index + CONCURRENCY
      );

      await Promise.all(
        batch.map((user) =>
          processDeletedUser(
            usersCollection,
            user
          )
        )
      );
    }

    console.info(
      `Account media cleanup processed ${users.length} deleted accounts.`
    );
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error(
    "Account media cleanup failed:",
    error
  );
  process.exitCode = 1;
});
