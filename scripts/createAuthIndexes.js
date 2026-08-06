import clientPromise from "../src/app/utils/mongodb.js";

const DATABASE_NAME = "travel-community";

async function createUserAuthenticationIndexes(database) {
  const collection = database.collection("users");

  await collection.createIndex(
    {
      email: 1,
    },
    {
      name: "unique_user_email",
      unique: true,
      partialFilterExpression: {
        email: {
          $type: "string",
        },
      },
    }
  );

  await collection.createIndex(
    {
      username: 1,
    },
    {
      name: "unique_username",
      unique: true,
      partialFilterExpression: {
        username: {
          $type: "string",
        },
      },
    }
  );

  await collection.createIndex(
    {
      accountStatus: 1,
      deletedAt: 1,
    },
    {
      name: "deleted_accounts_media_cleanup",
      partialFilterExpression: {
        accountStatus: "deleted",
      },
    }
  );
}

async function createPasswordResetTokenIndexes(database) {
  const collection = database.collection(
    "passwordResetTokens"
  );

  await collection.createIndex(
    {
      tokenHash: 1,
    },
    {
      name: "unique_password_reset_token_hash",
      unique: true,
    }
  );

  await collection.createIndex(
    {
      userId: 1,
      createdAt: -1,
    },
    {
      name: "password_reset_tokens_by_user",
    }
  );

  await collection.createIndex(
    {
      expiresAt: 1,
    },
    {
      name: "expire_password_reset_tokens",
      expireAfterSeconds: 0,
    }
  );
}

async function createAuthRateLimitIndexes(database) {
  const collection = database.collection(
    "authRateLimits"
  );

  await collection.createIndex(
    {
      key: 1,
    },
    {
      name: "unique_auth_rate_limit_key",
      unique: true,
    }
  );

  await collection.createIndex(
    {
      expiresAt: 1,
    },
    {
      name: "expire_auth_rate_limits",
      expireAfterSeconds: 0,
    }
  );
}

async function run() {
  const client = await clientPromise;
  const database = client.db(DATABASE_NAME);

  try {
    await createUserAuthenticationIndexes(database);
    console.info("User authentication indexes ready.");

    await createPasswordResetTokenIndexes(database);
    console.info("Password reset token indexes ready.");

    await createAuthRateLimitIndexes(database);
    console.info("Authentication rate limit indexes ready.");

    console.info(
      "Authentication database indexes created successfully."
    );
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error(
    "Authentication index migration failed:",
    error
  );
  process.exitCode = 1;
});
