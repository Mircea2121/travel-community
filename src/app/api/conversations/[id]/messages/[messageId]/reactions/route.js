import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import {
  getConversationsCollection,
  getMessagesCollection,
} from "@/app/utils/database";
import { serializeMessage } from "@/app/utils/messageSerializer";
import { isMessageReactionType } from "@/app/utils/messageReactions";

function createError(message, status) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

async function getRequestContext(params) {
  const currentUser = await getCurrentUser();

  if (!currentUser?._id) {
    return {
      error: createError("Trebuie să fii autentificat.", 401),
    };
  }

  const resolvedParams = await params;
  const conversationId = String(resolvedParams?.id || "").trim();
  const messageId = String(resolvedParams?.messageId || "").trim();

  if (!ObjectId.isValid(conversationId)) {
    return {
      error: createError("Conversația este invalidă.", 400),
    };
  }

  if (!ObjectId.isValid(messageId)) {
    return {
      error: createError("Mesajul este invalid.", 400),
    };
  }

  const currentUserId =
    currentUser._id instanceof ObjectId
      ? currentUser._id
      : new ObjectId(String(currentUser._id));

  const conversationObjectId = new ObjectId(conversationId);
  const messageObjectId = new ObjectId(messageId);
  const conversationsCollection =
    await getConversationsCollection();

  const conversation = await conversationsCollection.findOne(
    {
      _id: conversationObjectId,
      participants: currentUserId,
    },
    {
      projection: {
        _id: 1,
      },
    }
  );

  if (!conversation) {
    return {
      error: createError(
        "Conversația nu există sau nu ai acces la ea.",
        404
      ),
    };
  }

  return {
    currentUserId,
    conversationObjectId,
    messageObjectId,
  };
}

async function getReplyToMessage(messagesCollection, message) {
  if (!message?.replyTo) {
    return null;
  }

  const replyToId = message.replyTo.toString?.();

  if (!replyToId || !ObjectId.isValid(replyToId)) {
    return null;
  }

  return messagesCollection.findOne(
    {
      _id: new ObjectId(replyToId),
      conversationId: message.conversationId,
    },
    {
      projection: {
        _id: 1,
        senderId: 1,
        text: 1,
        images: 1,
        messageType: 1,
        isDeleted: 1,
      },
    }
  );
}

async function getSerializedMessage(
  messagesCollection,
  messageFilter
) {
  const message = await messagesCollection.findOne(messageFilter);

  if (!message) {
    return null;
  }

  const replyToMessage = await getReplyToMessage(
    messagesCollection,
    message
  );

  return serializeMessage(message, {
    replyToMessage,
  });
}

export async function PUT(request, { params }) {
  try {
    const context = await getRequestContext(params);

    if (context.error) {
      return context.error;
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return createError("Datele reacției nu sunt valide.", 400);
    }

    const type =
      typeof body?.type === "string"
        ? body.type.trim().toLowerCase()
        : "";

    if (!isMessageReactionType(type)) {
      return createError("Reacția selectată nu este validă.", 400);
    }

    const {
      currentUserId,
      conversationObjectId,
      messageObjectId,
    } = context;

    const messagesCollection = await getMessagesCollection();
    const now = new Date();
    const messageFilter = {
      _id: messageObjectId,
      conversationId: conversationObjectId,
      isDeleted: {
        $ne: true,
      },
      deletedFor: {
        $ne: currentUserId,
      },
    };

    const updateResult = await messagesCollection.updateOne(
      messageFilter,
      [
        {
          $set: {
            reactions: {
              $concatArrays: [
                {
                  $filter: {
                    input: {
                      $cond: [
                        {
                          $isArray: "$reactions",
                        },
                        "$reactions",
                        [],
                      ],
                    },
                    as: "reaction",
                    cond: {
                      $ne: [
                        "$$reaction.userId",
                        currentUserId,
                      ],
                    },
                  },
                },
                [
                  {
                    userId: currentUserId,
                    type,
                    createdAt: now,
                    updatedAt: now,
                  },
                ],
              ],
            },
            updatedAt: now,
          },
        },
      ]
    );

    if (updateResult.matchedCount !== 1) {
      return createError(
        "Mesajul nu există sau nu mai poate primi reacții.",
        404
      );
    }

    const message = await getSerializedMessage(
      messagesCollection,
      messageFilter
    );

    if (!message) {
      return createError("Mesajul nu a putut fi actualizat.", 409);
    }

    return NextResponse.json({
      success: true,
      reaction: {
        userId: currentUserId.toString(),
        type,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      message,
    });
  } catch (error) {
    console.error(
      "PUT /api/conversations/[id]/messages/[messageId]/reactions error:",
      error
    );

    return createError("Reacția nu a putut fi salvată.", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const context = await getRequestContext(params);

    if (context.error) {
      return context.error;
    }

    const {
      currentUserId,
      conversationObjectId,
      messageObjectId,
    } = context;

    const messagesCollection = await getMessagesCollection();
    const now = new Date();
    const messageFilter = {
      _id: messageObjectId,
      conversationId: conversationObjectId,
      isDeleted: {
        $ne: true,
      },
      deletedFor: {
        $ne: currentUserId,
      },
    };

    const updateResult = await messagesCollection.updateOne(
      messageFilter,
      [
        {
          $set: {
            reactions: {
              $filter: {
                input: {
                  $cond: [
                    {
                      $isArray: "$reactions",
                    },
                    "$reactions",
                    [],
                  ],
                },
                as: "reaction",
                cond: {
                  $ne: [
                    "$$reaction.userId",
                    currentUserId,
                  ],
                },
              },
            },
            updatedAt: now,
          },
        },
      ]
    );

    if (updateResult.matchedCount !== 1) {
      return createError(
        "Mesajul nu există sau nu mai poate fi actualizat.",
        404
      );
    }

    const message = await getSerializedMessage(
      messagesCollection,
      messageFilter
    );

    if (!message) {
      return createError("Mesajul nu a putut fi actualizat.", 409);
    }

    return NextResponse.json({
      success: true,
      reaction: null,
      message,
    });
  } catch (error) {
    console.error(
      "DELETE /api/conversations/[id]/messages/[messageId]/reactions error:",
      error
    );

    return createError("Reacția nu a putut fi eliminată.", 500);
  }
}
