import { ObjectId } from "mongodb";

import { getCurrentUser } from "../../../../utils/currentUser";
import {
  getDatabase,
  getPostsCollection,
} from "../../../../utils/database";
import { updatePostEngagement } from "../../../../utils/postEngagement";

async function getLikesCollection() {
  const database = await getDatabase();

  return database.collection("likes");
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

function getLikesCount(post, fallback = 0) {
  return typeof post?.likesCount === "number"
    ? post.likesCount
    : fallback;
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
      const userObjectId = getUserObjectId(currentUser);

      if (userObjectId) {
        const likesCollection = await getLikesCollection();

        const existingLike = await likesCollection.findOne(
          {
            postId: postObjectId,
            userId: userObjectId,
          },
          {
            projection: {
              _id: 1,
            },
          }
        );

        isLiked = Boolean(existingLike);
      }
    }

    return Response.json({
      success: true,
      liked: isLiked,
      likesCount: getLikesCount(post),
    });
  } catch (error) {
    console.error(
      "Eroare la verificarea aprecierii:",
      error
    );

    return Response.json(
      {
        success: false,
        message: "Aprecierea nu a putut fi verificată.",
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
    const userObjectId = getUserObjectId(currentUser);

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
          message: "Utilizatorul autentificat nu este valid.",
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

    const likesCollection = await getLikesCollection();
    const likeDocument = {
      postId: postObjectId,
      userId: userObjectId,
      createdAt: new Date(),
    };

    try {
      await likesCollection.insertOne(likeDocument);
    } catch (error) {
      if (error?.code === 11000) {
        return Response.json({
          success: true,
          liked: true,
          likesCount: getLikesCount(post),
          message: "Ai apreciat deja această postare.",
        });
      }

      throw error;
    }

    let updatedPost;

    try {
      updatedPost = await updatePostEngagement({
        postsCollection,
        postId: postObjectId,
        likesDelta: 1,
        projection: {
          likesCount: 1,
          engagementScore: 1,
        },
      });
    } catch (error) {
      await likesCollection.deleteOne({
        postId: postObjectId,
        userId: userObjectId,
      });

      throw error;
    }

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
      likesCount: getLikesCount(updatedPost, 1),
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
        message: "Aprecierea nu a putut fi adăugată.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request, { params }) {
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
    const userObjectId = getUserObjectId(currentUser);

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
          message: "Utilizatorul autentificat nu este valid.",
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

    const likesCollection = await getLikesCollection();

    const deletedLike = await likesCollection.findOneAndDelete({
      postId: postObjectId,
      userId: userObjectId,
    });

    if (!deletedLike) {
      return Response.json({
        success: true,
        liked: false,
        likesCount: getLikesCount(post),
        message:
          "Postarea nu era apreciată de acest utilizator.",
      });
    }

    let updatedPost;

    try {
      updatedPost = await updatePostEngagement({
        postsCollection,
        postId: postObjectId,
        likesDelta: -1,
        projection: {
          likesCount: 1,
          engagementScore: 1,
        },
      });
    } catch (error) {
      try {
        await likesCollection.insertOne(deletedLike);
      } catch (rollbackError) {
        if (rollbackError?.code !== 11000) {
          console.error(
            "Rollback-ul aprecierii retrase a eșuat:",
            rollbackError
          );
        }
      }

      throw error;
    }

    return Response.json({
      success: true,
      liked: false,
      likesCount: getLikesCount(updatedPost),
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
        message: "Aprecierea nu a putut fi retrasă.",
      },
      {
        status: 500,
      }
    );
  }
}
