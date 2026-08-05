import clientPromise from "../src/app/utils/mongodb.js";

const DATABASE_NAME = "travel-community";

async function createConversationIndexes(database) {
  const collection = database.collection("conversations");

  await collection.createIndex(
    {
      conversationKey: 1,
    },
    {
      name: "unique_conversation_key",
      unique: true,
    }
  );

  await collection.createIndex(
    {
      participants: 1,
      lastMessageAt: -1,
      updatedAt: -1,
    },
    {
      name: "conversations_by_participant_activity",
    }
  );
}

async function createMessageIndexes(database) {
  const collection = database.collection("messages");

  await collection.createIndex(
    {
      conversationId: 1,
      createdAt: -1,
      _id: -1,
    },
    {
      name: "messages_by_conversation_created",
    }
  );

  await collection.createIndex(
    {
      conversationId: 1,
      isRead: 1,
      senderId: 1,
      createdAt: -1,
    },
    {
      name: "messages_unread_by_conversation",
    }
  );

  await collection.createIndex(
    {
      conversationId: 1,
      replyTo: 1,
    },
    {
      name: "message_replies_by_conversation",
    }
  );

  await collection.createIndex(
    {
      senderId: 1,
      createdAt: -1,
    },
    {
      name: "messages_by_sender_created",
    }
  );
}

async function createReportIndexes(database) {
  const collection = database.collection("reports");

  await collection.createIndex(
    {
      status: 1,
      createdAt: -1,
    },
    {
      name: "reports_by_status",
    }
  );

  await collection.createIndex(
    {
      reportedBy: 1,
      createdAt: -1,
    },
    {
      name: "reports_by_user",
    }
  );

  await collection.createIndex(
    {
      targetOwnerId: 1,
      status: 1,
      createdAt: -1,
    },
    {
      name: "reports_by_target_owner",
    }
  );

  await collection.createIndex(
    {
      targetContextId: 1,
      targetType: 1,
      createdAt: -1,
    },
    {
      name: "reports_by_target_context",
    }
  );

  await collection.createIndex(
    {
      targetType: 1,
      targetId: 1,
      reportedBy: 1,
      status: 1,
    },
    {
      name: "unique_pending_report_per_user_target",
      unique: true,
      partialFilterExpression: {
        status: "pending",
      },
    }
  );
}

async function run() {
  const client = await clientPromise;
  const database = client.db(DATABASE_NAME);

  try {
    await createConversationIndexes(database);
    console.info("Conversation indexes ready.");

    await createMessageIndexes(database);
    console.info("Message indexes ready.");

    await createReportIndexes(database);
    console.info("Report indexes ready.");

    console.info("Chat database indexes created successfully.");
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error("Chat index migration failed:", error);
  process.exitCode = 1;
});
