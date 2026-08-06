export const POST_ENGAGEMENT_WEIGHTS = Object.freeze({
  likes: 1,
  comments: 2,
  saves: 3,
});

const COUNTER_FIELDS = Object.freeze({
  likes: "likesCount",
  comments: "commentsCount",
  saves: "savesCount",
});

function normalizeDelta(value, fieldName) {
  const normalizedValue = Number(value ?? 0);

  if (!Number.isSafeInteger(normalizedValue)) {
    throw new TypeError(
      `${fieldName} trebuie să fie un număr întreg valid.`
    );
  }

  return normalizedValue;
}

function buildCounterExpression(fieldName, delta) {
  return {
    $max: [
      0,
      {
        $add: [
          {
            $ifNull: [`$${fieldName}`, 0],
          },
          delta,
        ],
      },
    ],
  };
}

function buildScoreExpression() {
  return {
    $add: [
      {
        $multiply: [
          `$${COUNTER_FIELDS.likes}`,
          POST_ENGAGEMENT_WEIGHTS.likes,
        ],
      },
      {
        $multiply: [
          `$${COUNTER_FIELDS.comments}`,
          POST_ENGAGEMENT_WEIGHTS.comments,
        ],
      },
      {
        $multiply: [
          `$${COUNTER_FIELDS.saves}`,
          POST_ENGAGEMENT_WEIGHTS.saves,
        ],
      },
    ],
  };
}

export function buildPostEngagementUpdatePipeline({
  likesDelta = 0,
  commentsDelta = 0,
  savesDelta = 0,
} = {}) {
  const normalizedLikesDelta = normalizeDelta(
    likesDelta,
    "likesDelta"
  );
  const normalizedCommentsDelta = normalizeDelta(
    commentsDelta,
    "commentsDelta"
  );
  const normalizedSavesDelta = normalizeDelta(
    savesDelta,
    "savesDelta"
  );

  return [
    {
      $set: {
        [COUNTER_FIELDS.likes]: buildCounterExpression(
          COUNTER_FIELDS.likes,
          normalizedLikesDelta
        ),
        [COUNTER_FIELDS.comments]: buildCounterExpression(
          COUNTER_FIELDS.comments,
          normalizedCommentsDelta
        ),
        [COUNTER_FIELDS.saves]: buildCounterExpression(
          COUNTER_FIELDS.saves,
          normalizedSavesDelta
        ),
      },
    },
    {
      $set: {
        engagementScore: buildScoreExpression(),
      },
    },
  ];
}

export async function updatePostEngagement({
  postsCollection,
  postId,
  likesDelta = 0,
  commentsDelta = 0,
  savesDelta = 0,
  projection = {
    likesCount: 1,
    commentsCount: 1,
    savesCount: 1,
    engagementScore: 1,
  },
  session,
}) {
  if (!postsCollection?.findOneAndUpdate) {
    throw new TypeError(
      "Colecția de postări nu este validă."
    );
  }

  if (!postId) {
    throw new TypeError(
      "ID-ul postării este obligatoriu."
    );
  }

  const options = {
    returnDocument: "after",
    projection,
  };

  if (session) {
    options.session = session;
  }

  return postsCollection.findOneAndUpdate(
    {
      _id: postId,
    },
    buildPostEngagementUpdatePipeline({
      likesDelta,
      commentsDelta,
      savesDelta,
    }),
    options
  );
}
