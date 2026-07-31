import { ObjectId } from "mongodb";

import { getCurrentUser } from "../../../../utils/currentUser";

import {
  getPostsCollection,
  getSavedPostsCollection,
} from "../../../../utils/database";

function serializeSavedPost(savedPost) {
  return {
    ...savedPost,
    _id: String(savedPost._id),
    userId: String(savedPost.userId),
    postId: String(savedPost.postId),
  };
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

    const savedPostsCollection =
      await getSavedPostsCollection();

    const savedPost =
      await savedPostsCollection.findOne({
        userId: currentUser._id,
        postId: new ObjectId(id),
      });

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

    const postId = new ObjectId(id);

    const [
      postsCollection,
      savedPostsCollection,
    ] = await Promise.all([
      getPostsCollection(),
      getSavedPostsCollection(),
    ]);

    const postExists =
      await postsCollection.findOne(
        {
          _id: postId,
        },
        {
          projection: {
            _id: 1,
          },
        }
      );

    if (!postExists) {
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
      userId: currentUser._id,
      postId,
    };

    const deletedSavedPost =
      await savedPostsCollection.findOneAndDelete(
        savedPostFilter
      );

    if (deletedSavedPost) {
      return Response.json({
        success: true,
        isSaved: false,
        message:
          "Postarea a fost eliminată din salvate.",
      });
    }

    const newSavedPost = {
      userId: currentUser._id,
      postId,
      createdAt: new Date(),
    };

    try {
      const result =
        await savedPostsCollection.insertOne(
          newSavedPost
        );

      return Response.json(
        {
          success: true,
          isSaved: true,
          message:
            "Postarea a fost salvată.",
          savedPost: serializeSavedPost({
            ...newSavedPost,
            _id: result.insertedId,
          }),
        },
        {
          status: 201,
        }
      );
    } catch (error) {
      /*
       * Codul 11000 apare atunci când indexul unic
       * userId + postId oprește o salvare duplicată.
       *
       * Situația poate apărea dacă utilizatorul apasă
       * foarte repede de două ori sau trimite două
       * cereri simultan.
       */
      if (error?.code === 11000) {
        return Response.json({
          success: true,
          isSaved: true,
          message:
            "Postarea este deja salvată.",
        });
      }

      throw error;
    }
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