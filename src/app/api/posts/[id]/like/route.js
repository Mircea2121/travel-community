import { ObjectId } from "mongodb";

import { getCurrentUser } from "../../../../utils/currentUser";
import {
  getDatabase,
  getPostsCollection,
} from "../../../../utils/database";

let likesIndexesPromise = null;

async function getLikesCollection() {
  const database = await getDatabase();
  const likesCollection = database.collection("likes");

  if (!likesIndexesPromise) {
    likesIndexesPromise = Promise.all([
      likesCollection.createIndex(
        {
          postId: 1,
          userId: 1,
        },
        {
          unique: true,
          name: "unique_post_user_like",
        }
      ),

      likesCollection.createIndex(
        {
          postId: 1,
          createdAt: -1,
        },
        {
          name: "likes_by_post",
        }
      ),

      likesCollection.createIndex(
        {
          userId: 1,
          createdAt: -1,
        },
        {
          name: "likes_by_user",
        }
      ),
    ]);
  }

  await likesIndexesPromise;

  return likesCollection;
}

function getValidPostId(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return new ObjectId(id);
}

function getUserObjectId(currentUser) {
  if (!currentUser?._id) {
    return null;
  }

  const userId = String(currentUser._id);

  if (!ObjectId.isValid(userId)) {
    return null;
  }

  return new ObjectId(userId);
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const postObjectId = getValidPostId(id);

    if (!postObjectId) {
      return Response.json(
        {
          success: false,
          message: "ID-ul postării nu este valid.",
        },
        {
          status: 400,
        }
      );
    }

    const postsCollection = await getPostsCollection();

    const post = await postsCollection.findOne(
      {
        _id: postObjectId,
      },
      {
        projection: {
          likesCount: 1,
        },
      }
    );

    if (!post) {
      return Response.json(
        {
          success: false,
          message: "Postarea nu a fost găsită.",
        },
        {
          status: 404,
        }
      );
    }

    const currentUser = await getCurrentUser();

    let isLiked = false;

    if (currentUser) {
      const userObjectId =
        getUserObjectId(currentUser);

      if (userObjectId) {
        const likesCollection =
          await getLikesCollection();

        const existingLike =
          await likesCollection.findOne({
            postId: postObjectId,
            userId: userObjectId,
          });

        isLiked = Boolean(existingLike);
      }
    }

    return Response.json({
      success: true,
      liked: isLiked,
      likesCount:
        typeof post.likesCount === "number"
          ? post.likesCount
          : 0,
    });
  } catch (error) {
    console.error(
      "Eroare la verificarea aprecierii:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Aprecierea nu a putut fi verificată.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        {
          success: false,
          message:
            "Trebuie să fii autentificat pentru a aprecia postarea.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    const postObjectId = getValidPostId(id);
    const userObjectId =
      getUserObjectId(currentUser);

    if (!postObjectId) {
      return Response.json(
        {
          success: false,
          message: "ID-ul postării nu este valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (!userObjectId) {
      return Response.json(
        {
          success: false,
          message:
            "Utilizatorul autentificat nu este valid.",
        },
        {
          status: 401,
        }
      );
    }

    const postsCollection = await getPostsCollection();

    const post = await postsCollection.findOne(
      {
        _id: postObjectId,
      },
      {
        projection: {
          likesCount: 1,
        },
      }
    );

    if (!post) {
      return Response.json(
        {
          success: false,
          message: "Postarea nu a fost găsită.",
        },
        {
          status: 404,
        }
      );
    }

    const likesCollection =
      await getLikesCollection();

    try {
      await likesCollection.insertOne({
        postId: postObjectId,
        userId: userObjectId,
        createdAt: new Date(),
      });
    } catch (error) {
      if (error?.code === 11000) {
        return Response.json({
          success: true,
          liked: true,
          likesCount:
            typeof post.likesCount === "number"
              ? post.likesCount
              : 0,
          message:
            "Ai apreciat deja această postare.",
        });
      }

      throw error;
    }

    const updatedPost =
      await postsCollection.findOneAndUpdate(
        {
          _id: postObjectId,
        },
        {
          $inc: {
            likesCount: 1,
          },
        },
        {
          returnDocument: "after",
          projection: {
            likesCount: 1,
          },
        }
      );

    if (!updatedPost) {
      await likesCollection.deleteOne({
        postId: postObjectId,
        userId: userObjectId,
      });

      return Response.json(
        {
          success: false,
          message: "Postarea nu a fost găsită.",
        },
        {
          status: 404,
        }
      );
    }

    return Response.json({
      success: true,
      liked: true,
      likesCount:
        typeof updatedPost.likesCount === "number"
          ? updatedPost.likesCount
          : 1,
      message: "Postarea a fost apreciată.",
    });
  } catch (error) {
    console.error(
      "Eroare la adăugarea aprecierii:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Aprecierea nu a putut fi adăugată.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request,
  { params }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        {
          success: false,
          message:
            "Trebuie să fii autentificat pentru a retrage aprecierea.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    const postObjectId = getValidPostId(id);
    const userObjectId =
      getUserObjectId(currentUser);

    if (!postObjectId) {
      return Response.json(
        {
          success: false,
          message: "ID-ul postării nu este valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (!userObjectId) {
      return Response.json(
        {
          success: false,
          message:
            "Utilizatorul autentificat nu este valid.",
        },
        {
          status: 401,
        }
      );
    }

    const postsCollection = await getPostsCollection();

    const post = await postsCollection.findOne(
      {
        _id: postObjectId,
      },
      {
        projection: {
          likesCount: 1,
        },
      }
    );

    if (!post) {
      return Response.json(
        {
          success: false,
          message: "Postarea nu a fost găsită.",
        },
        {
          status: 404,
        }
      );
    }

    const likesCollection =
      await getLikesCollection();

    const deleteResult =
      await likesCollection.deleteOne({
        postId: postObjectId,
        userId: userObjectId,
      });

    if (deleteResult.deletedCount === 0) {
      return Response.json({
        success: true,
        liked: false,
        likesCount:
          typeof post.likesCount === "number"
            ? post.likesCount
            : 0,
        message:
          "Postarea nu era apreciată de acest utilizator.",
      });
    }

    const updatedPost =
      await postsCollection.findOneAndUpdate(
        {
          _id: postObjectId,
        },
        [
          {
            $set: {
              likesCount: {
                $max: [
                  0,
                  {
                    $subtract: [
                      {
                        $ifNull: [
                          "$likesCount",
                          0,
                        ],
                      },
                      1,
                    ],
                  },
                ],
              },
            },
          },
        ],
        {
          returnDocument: "after",
          projection: {
            likesCount: 1,
          },
        }
      );

    return Response.json({
      success: true,
      liked: false,
      likesCount:
        typeof updatedPost?.likesCount === "number"
          ? updatedPost.likesCount
          : 0,
      message: "Aprecierea a fost retrasă.",
    });
  } catch (error) {
    console.error(
      "Eroare la retragerea aprecierii:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Aprecierea nu a putut fi retrasă.",
      },
      {
        status: 500,
      }
    );
  }
}