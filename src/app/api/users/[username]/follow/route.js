import { getCurrentUser } from "../../../../utils/currentUser";
import { getUsersCollection } from "../../../../utils/database";
import { USERNAME_PATTERN } from "../../../../utils/validation";

export async function POST(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        {
          success: false,
          message: "Trebuie să fii autentificat pentru a urmări un utilizator.",
        },
        {
          status: 401,
        }
      );
    }

    const { username: rawUsername } = await params;

    const username = rawUsername?.trim().toLowerCase();

    if (!username || !USERNAME_PATTERN.test(username)) {
      return Response.json(
        {
          success: false,
          message: "Username-ul nu este valid.",
        },
        {
          status: 400,
        }
      );
    }

    const usersCollection = await getUsersCollection();

    const userToFollow = await usersCollection.findOne({
      username,
    });

    if (!userToFollow) {
      return Response.json(
        {
          success: false,
          message: "Utilizatorul nu a fost găsit.",
        },
        {
          status: 404,
        }
      );
    }

    if (currentUser._id.toString() === userToFollow._id.toString()) {
      return Response.json(
        {
          success: false,
          message: "Nu îți poți urmări propriul profil.",
        },
        {
          status: 400,
        }
      );
    }

    const now = new Date();

    const currentUserUpdate = await usersCollection.updateOne(
      {
        _id: currentUser._id,
        following: {
          $ne: userToFollow._id,
        },
      },
      {
        $addToSet: {
          following: userToFollow._id,
        },
        $inc: {
          "stats.followingCount": 1,
        },
        $set: {
          updatedAt: now,
        },
      }
    );

    if (currentUserUpdate.modifiedCount === 0) {
      return Response.json(
        {
          success: false,
          message: "Urmărești deja acest utilizator.",
        },
        {
          status: 409,
        }
      );
    }

    const followedUserUpdate = await usersCollection.updateOne(
      {
        _id: userToFollow._id,
        followers: {
          $ne: currentUser._id,
        },
      },
      {
        $addToSet: {
          followers: currentUser._id,
        },
        $inc: {
          "stats.followersCount": 1,
        },
        $set: {
          updatedAt: now,
        },
      }
    );

    if (followedUserUpdate.modifiedCount === 0) {
      await usersCollection.updateOne(
        {
          _id: currentUser._id,
        },
        {
          $pull: {
            following: userToFollow._id,
          },
          $inc: {
            "stats.followingCount": -1,
          },
          $set: {
            updatedAt: new Date(),
          },
        }
      );

      return Response.json(
        {
          success: false,
          message: "Nu s-a putut realiza urmărirea utilizatorului.",
        },
        {
          status: 409,
        }
      );
    }

    return Response.json(
      {
        success: true,
        message: `Acum îl urmărești pe ${userToFollow.name}.`,
        isFollowing: true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Eroare la urmărirea utilizatorului:", error);

    return Response.json(
      {
        success: false,
        message: "A apărut o eroare la urmărirea utilizatorului.",
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
            "Trebuie să fii autentificat pentru a nu mai urmări un utilizator.",
        },
        {
          status: 401,
        }
      );
    }

    const { username: rawUsername } = await params;

    const username = rawUsername?.trim().toLowerCase();

    if (!username || !USERNAME_PATTERN.test(username)) {
      return Response.json(
        {
          success: false,
          message: "Username-ul nu este valid.",
        },
        {
          status: 400,
        }
      );
    }

    const usersCollection = await getUsersCollection();

    const userToUnfollow = await usersCollection.findOne({
      username,
    });

    if (!userToUnfollow) {
      return Response.json(
        {
          success: false,
          message: "Utilizatorul nu a fost găsit.",
        },
        {
          status: 404,
        }
      );
    }

    if (currentUser._id.toString() === userToUnfollow._id.toString()) {
      return Response.json(
        {
          success: false,
          message: "Nu poți renunța la urmărirea propriului profil.",
        },
        {
          status: 400,
        }
      );
    }

    const now = new Date();

    const currentUserUpdate = await usersCollection.updateOne(
      {
        _id: currentUser._id,
        following: userToUnfollow._id,
      },
      {
        $pull: {
          following: userToUnfollow._id,
        },
        $inc: {
          "stats.followingCount": -1,
        },
        $set: {
          updatedAt: now,
        },
      }
    );

    if (currentUserUpdate.modifiedCount === 0) {
      return Response.json(
        {
          success: false,
          message: "Nu urmărești acest utilizator.",
        },
        {
          status: 409,
        }
      );
    }

    const unfollowedUserUpdate = await usersCollection.updateOne(
      {
        _id: userToUnfollow._id,
        followers: currentUser._id,
      },
      {
        $pull: {
          followers: currentUser._id,
        },
        $inc: {
          "stats.followersCount": -1,
        },
        $set: {
          updatedAt: now,
        },
      }
    );

    if (unfollowedUserUpdate.modifiedCount === 0) {
      await usersCollection.updateOne(
        {
          _id: currentUser._id,
        },
        {
          $addToSet: {
            following: userToUnfollow._id,
          },
          $inc: {
            "stats.followingCount": 1,
          },
          $set: {
            updatedAt: new Date(),
          },
        }
      );

      return Response.json(
        {
          success: false,
          message: "Nu s-a putut elimina urmărirea utilizatorului.",
        },
        {
          status: 409,
        }
      );
    }

    return Response.json(
      {
        success: true,
        message: `Nu îl mai urmărești pe ${userToUnfollow.name}.`,
        isFollowing: false,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Eroare la eliminarea urmăririi:", error);

    return Response.json(
      {
        success: false,
        message: "A apărut o eroare la eliminarea urmăririi utilizatorului.",
      },
      {
        status: 500,
      }
    );
  }
}