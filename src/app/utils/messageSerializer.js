function serializeId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value?.toHexString === "function") {
    return value.toHexString();
  }

  if (typeof value?.toString === "function") {
    const serializedValue = value.toString();

    return serializedValue === "[object Object]"
      ? null
      : serializedValue;
  }

  return null;
}

function serializeDate(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
}

function serializePositiveNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0
    ? number
    : null;
}

function serializeNonNegativeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : null;
}

export function serializeMessageImage(image) {
  if (!image || typeof image !== "object") {
    return null;
  }

  const url =
    typeof image.url === "string"
      ? image.url.trim()
      : "";

  if (!url) {
    return null;
  }

  return {
    url,
    publicId:
      typeof image.publicId === "string"
        ? image.publicId
        : "",
    width: serializePositiveNumber(image.width),
    height: serializePositiveNumber(image.height),
    format:
      typeof image.format === "string"
        ? image.format
        : "",
    bytes: serializeNonNegativeNumber(image.bytes),
    originalName:
      typeof image.originalName === "string"
        ? image.originalName
        : "",
    createdAt: serializeDate(image.createdAt),
  };
}

export function serializeMessageReaction(reaction) {
  if (!reaction || typeof reaction !== "object") {
    return null;
  }

  const userId = serializeId(reaction.userId);
  const type =
    typeof reaction.type === "string"
      ? reaction.type.trim()
      : "";

  if (!userId || !type) {
    return null;
  }

  return {
    userId,
    type,
    createdAt: serializeDate(reaction.createdAt),
    updatedAt: serializeDate(reaction.updatedAt),
  };
}

export function serializeMessageSeenEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const userId = serializeId(entry.userId);

  if (!userId) {
    return null;
  }

  return {
    userId,
    seenAt: serializeDate(entry.seenAt),
  };
}

export function serializeReplyPreview(message) {
  if (!message) {
    return null;
  }

  const messageId = serializeId(
    typeof message === "object" ? message._id : message
  );

  if (!messageId) {
    return null;
  }

  if (typeof message !== "object") {
    return {
      _id: messageId,
      senderId: null,
      text: "",
      images: [],
      messageType: null,
      isDeleted: false,
    };
  }

  const isDeleted = message.isDeleted === true;
  const images = isDeleted
    ? []
    : (Array.isArray(message.images) ? message.images : [])
        .map(serializeMessageImage)
        .filter(Boolean);

  return {
    _id: messageId,
    senderId: serializeId(message.senderId),
    text:
      !isDeleted && typeof message.text === "string"
        ? message.text
        : "",
    images,
    messageType:
      typeof message.messageType === "string"
        ? message.messageType
        : images.length > 0
          ? "image"
          : "text",
    isDeleted,
  };
}

export function serializeMessage(
  message,
  { replyToMessage = null } = {}
) {
  if (!message || typeof message !== "object") {
    return null;
  }

  const messageId = serializeId(message._id);
  const conversationId = serializeId(message.conversationId);
  const senderId = serializeId(message.senderId);

  if (!messageId || !conversationId || !senderId) {
    return null;
  }

  const isDeleted = message.isDeleted === true;
  const images = isDeleted
    ? []
    : (Array.isArray(message.images) ? message.images : [])
        .map(serializeMessageImage)
        .filter(Boolean);

  const reactions = (Array.isArray(message.reactions)
    ? message.reactions
    : []
  )
    .map(serializeMessageReaction)
    .filter(Boolean);

  const seenBy = (Array.isArray(message.seenBy)
    ? message.seenBy
    : []
  )
    .map(serializeMessageSeenEntry)
    .filter(Boolean);

  const deletedFor = (Array.isArray(message.deletedFor)
    ? message.deletedFor
    : []
  )
    .map(serializeId)
    .filter(Boolean);

  const replySource =
    replyToMessage || message.replyToMessage || message.replyTo;

  return {
    _id: messageId,
    conversationId,
    senderId,
    text:
      !isDeleted && typeof message.text === "string"
        ? message.text
        : "",
    images,
    messageType:
      typeof message.messageType === "string"
        ? message.messageType
        : images.length > 0
          ? "image"
          : "text",
    replyTo: serializeReplyPreview(replySource),
    reactions,
    seenBy,
    deletedFor,
    isRead:
      message.isRead === true || seenBy.length > 1,
    isEdited: message.isEdited === true,
    editedAt: serializeDate(message.editedAt),
    isDeleted,
    deletedAt: serializeDate(message.deletedAt),
    deletedBy: serializeId(message.deletedBy),
    deliveredAt: serializeDate(message.deliveredAt),
    createdAt: serializeDate(message.createdAt),
    updatedAt: serializeDate(message.updatedAt),
  };
}

export function serializeMessages(messages, replyMessagesById = new Map()) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .map((message) => {
      const replyToId = serializeId(message?.replyTo);
      const replyToMessage = replyToId
        ? replyMessagesById.get(replyToId) || null
        : null;

      return serializeMessage(message, {
        replyToMessage,
      });
    })
    .filter(Boolean);
}
