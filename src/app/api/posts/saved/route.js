import { getCurrentUser } from "../../../utils/currentUser";

import {
  getSavedPostsCollection,
} from "../../../utils/database";
import {
  getPublicAuthorProfilesByIds,
  hydratePublicAuthor,
} from "../../../utils/publicUser";

function serializePost(post) {
  return {
    ...post,

    _id:
      post?._id?.toString?.() ||
      String(post?._id || ""),

    authorId:
      post?.authorId?.toString?.() ||
      String(post?.authorId || ""),

    savedAt:
      post?.savedAt || null,
  };
}

export async function GET(request) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        {
          success: false,
          message:
            "Trebuie să fii autentificat pentru a vedea postările salvate.",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const requestedLimit =
      Number(
        searchParams.get("limit")
      ) || 20;

    const limit =
      Math.min(
        Math.max(
          requestedLimit,
          1
        ),
        50
      );

    const savedPostsCollection =
      await getSavedPostsCollection();

    const savedPosts =
      await savedPostsCollection
        .aggregate([
          {
            $match: {
              userId:
                currentUser._id,
            },
          },

          {
            $sort: {
              createdAt: -1,
              _id: -1,
            },
          },

          {
            $limit: limit,
          },

          {
            $lookup: {
              from: "posts",
              localField: "postId",
              foreignField: "_id",
              as: "post",
            },
          },

          {
            $unwind: "$post",
          },

          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  "$post",
                  {
                    savedAt:
                      "$createdAt",
                  },
                ],
              },
            },
          },
        ])
        .toArray();

    const authorProfiles =
      await getPublicAuthorProfilesByIds(
        savedPosts.map(
          (post) => post.authorId
        )
      );

    return Response.json({
      success: true,
      posts:
        savedPosts.map((post) =>
          serializePost(
            hydratePublicAuthor(
              post,
              authorProfiles,
              {
                userIdField: "authorId",
              }
            )
          )
        ),
      count:
        savedPosts.length,
    });
  } catch (error) {
    console.error(
      "Eroare la încărcarea postărilor salvate:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Postările salvate nu au putut fi încărcate.",
      },
      {
        status: 500,
      }
    );
  }
}
