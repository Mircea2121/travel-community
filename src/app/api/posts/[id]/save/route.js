import { ObjectId } from "mongodb";

import { getCurrentUser } from "../../../../utils/currentUser";
import {
  getPostsCollection,
  getSavedPostsCollection,
} from "../../../../utils/database";
import { updatePostEngagement } from "../../../../utils/postEngagement";

function serializeSavedPost(savedPost) {
  return {
    ...savedPost,
    _id: String(savedPost._id),
    userId: String(savedPost.userId),
    postId: String(savedPost.postId),
  };
}

function getUserObjectId(currentUser) {
  const userId = String(currentUser?._id || "");

  if (!ObjectId.isValid(userId)) {
    return null;
  }

  return new ObjectId(userId);
}

function getSavesCount(post, fallback = 0) {
  return typeof post?.savesCount === "number"
    ? post.savesCount
    : fallback;
}

async function restoreSavedPost(
  savedPostsCollection,
  savedPost
) {
  try {
    await savedPostsCollection.insertOne(savedPost);
  } catch (rollbackError) {
    if (rollbackError?.code !== 11000) {
      console.error(
        "Rollback-ul salvării eliminate a eșuat:",
        rollbackError
      );
    }
  }
}

export async function GET(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        {
          success: false,
          message:
            "Trebuie să fii autentificat pentru a verifica postarea salvată.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
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

    const userObjectId = getUserObjectId(currentUser);

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

    const savedPostsCollection =
      await getSavedPostsCollection();

    const savedPost = await savedPostsCollection.findOne(
      {
        userId: userObjectId,
        postId: new ObjectId(id),
      },
      {
        projection: {
          _id: 1,
        },
      }
    );

    return Response.json({
      success: true,
      isSaved: Boolean(savedPost),
    });
  } catch (error) {
    console.error(
      "Eroare la verificarea postării salvate:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Starea postării salvate nu a putut fi verificată.",
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
            "Trebuie să fii autentificat pentru a salva o postare.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
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

    const userObjectId = getUserObjectId(currentUser);

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

    const postId = new ObjectId(id);

    const [postsCollection, savedPostsCollection] =
      await Promise.all([
        getPostsCollection(),
        getSavedPostsCollection(),
      ]);

    const post = await postsCollection.findOne(
      {
        _id: postId,
      },
      {
        projection: {
          _id: 1,
          savesCount: 1,
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

    const savedPostFilter = {
      userId: userObjectId,
      postId,
    };

    const deletedSavedPost =
      await savedPostsCollection.findOneAndDelete(
        savedPostFilter
      );

    if (deletedSavedPost) {
      let updatedPost;

      try {
        updatedPost = await updatePostEngagement({
          postsCollection,
          postId,
          savesDelta: -1,
          projection: {
            savesCount: 1,
            engagementScore: 1,
          },
        });
      } catch (error) {
        await restoreSavedPost(
          savedPostsCollection,
          deletedSavedPost
        );

        throw error;
      }

      if (!updatedPost) {
        await restoreSavedPost(
          savedPostsCollection,
          deletedSavedPost
        );

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
        isSaved: false,
        savesCount: getSavesCount(updatedPost),
        message: "Postarea a fost eliminată din salvate.",
      });
    }

    const newSavedPost = {
      userId: userObjectId,
      postId,
      createdAt: new Date(),
    };

    let insertResult;

    try {
      insertResult = await savedPostsCollection.insertOne(
        newSavedPost
      );
    } catch (error) {
      if (error?.code === 11000) {
        return Response.json({
          success: true,
          isSaved: true,
          savesCount: getSavesCount(post),
          message: "Postarea este deja salvată.",
        });
      }

      throw error;
    }

    let updatedPost;

    try {
      updatedPost = await updatePostEngagement({
        postsCollection,
        postId,
        savesDelta: 1,
        projection: {
          savesCount: 1,
          engagementScore: 1,
        },
      });
    } catch (error) {
      await savedPostsCollection.deleteOne({
        _id: insertResult.insertedId,
      });

      throw error;
    }

    if (!updatedPost) {
      await savedPostsCollection.deleteOne({
        _id: insertResult.insertedId,
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

    return Response.json(
      {
        success: true,
        isSaved: true,
        savesCount: getSavesCount(updatedPost, 1),
        message: "Postarea a fost salvată.",
        savedPost: serializeSavedPost({
          ...newSavedPost,
          _id: insertResult.insertedId,
        }),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Eroare la salvarea postării:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Postarea nu a putut fi salvată. Încearcă din nou.",
      },
      {
        status: 500,
      }
    );
  }
}
