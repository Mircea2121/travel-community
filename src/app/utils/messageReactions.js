export const MESSAGE_REACTIONS = Object.freeze([
  Object.freeze({
    type: "like",
    emoji: "👍",
    label: "Îmi place",
  }),
  Object.freeze({
    type: "love",
    emoji: "❤️",
    label: "Ador",
  }),
  Object.freeze({
    type: "laugh",
    emoji: "😂",
    label: "Amuzant",
  }),
  Object.freeze({
    type: "wow",
    emoji: "😮",
    label: "Uimitor",
  }),
  Object.freeze({
    type: "sad",
    emoji: "😢",
    label: "Trist",
  }),
  Object.freeze({
    type: "angry",
    emoji: "😡",
    label: "Furios",
  }),
]);

export const MESSAGE_REACTION_TYPES = Object.freeze(
  MESSAGE_REACTIONS.map((reaction) => reaction.type)
);

const MESSAGE_REACTION_TYPE_SET = new Set(
  MESSAGE_REACTION_TYPES
);

export function isMessageReactionType(value) {
  return (
    typeof value === "string" &&
    MESSAGE_REACTION_TYPE_SET.has(value)
  );
}

export function getMessageReaction(type) {
  if (!isMessageReactionType(type)) {
    return null;
  }

  return (
    MESSAGE_REACTIONS.find(
      (reaction) => reaction.type === type
    ) || null
  );
}
