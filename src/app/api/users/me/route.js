import { NextResponse } from "next/server";

import { getCurrentUser } from "../../../utils/currentUser";
import { getUsersCollection } from "../../../utils/database";
import {
  NAME,
  BIO,
  LOCATION,
} from "../../../utils/validation";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Nu ești autentificat.",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "A apărut o eroare.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Nu ești autentificat.",
        },
        {
          status: 401,
        }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Datele trimise nu sunt valide.",
        },
        {
          status: 400,
        }
      );
    }

    const name =
      typeof body?.name === "string"
        ? body.name.trim().replace(/\s+/g, " ")
        : "";

    const bio =
      typeof body?.bio === "string"
        ? body.bio.trim()
        : "";

    const location =
      typeof body?.location === "string"
        ? body.location.trim()
        : "";

    if (
      !name ||
      name.length < NAME.MIN_LENGTH ||
      name.length > NAME.MAX_LENGTH
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Numele trebuie să conțină între ${NAME.MIN_LENGTH} și ${NAME.MAX_LENGTH} caractere.`,
        },
        {
          status: 400,
        }
      );
    }

    if (bio.length > BIO.MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Descrierea poate avea maximum ${BIO.MAX_LENGTH} caractere.`,
        },
        {
          status: 400,
        }
      );
    }

    if (location.length > LOCATION.MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Locația poate avea maximum ${LOCATION.MAX_LENGTH} caractere.`,
        },
        {
          status: 400,
        }
      );
    }

    const usersCollection =
      await getUsersCollection();

    const now = new Date();
    const currentName = String(
      user.name || ""
    )
      .trim()
      .replace(/\s+/g, " ");

    const isNameChanging =
      name !== currentName;

    if (isNameChanging) {
      const cooldownCutoff = new Date(
        now.getTime() -
          NAME.CHANGE_COOLDOWN_MS
      );

      const updateResult =
        await usersCollection.updateOne(
          {
            _id: user._id,
            $or: [
              {
                nameChangedAt: {
                  $exists: false,
                },
              },
              {
                nameChangedAt: null,
              },
              {
                nameChangedAt: {
                  $lte: cooldownCutoff,
                },
              },
            ],
          },
          {
            $set: {
              name,
              bio,
              location,
              nameChangedAt: now,
              updatedAt: now,
            },
          }
        );

      if (updateResult.matchedCount === 0) {
        const latestUser =
          await usersCollection.findOne(
            {
              _id: user._id,
            },
            {
              projection: {
                nameChangedAt: 1,
              },
            }
          );

        const lastChangedAt =
          latestUser?.nameChangedAt
            ? new Date(
                latestUser.nameChangedAt
              )
            : null;

        const nextNameChangeAt =
          lastChangedAt &&
          !Number.isNaN(
            lastChangedAt.getTime()
          )
            ? new Date(
                lastChangedAt.getTime() +
                  NAME.CHANGE_COOLDOWN_MS
              )
            : null;

        return NextResponse.json(
          {
            success: false,
            code: "NAME_CHANGE_COOLDOWN",
            message:
              "Numele poate fi schimbat o singură dată la 15 zile.",
            nextNameChangeAt,
          },
          {
            status: 429,
          }
        );
      }
    } else {
      await usersCollection.updateOne(
        {
          _id: user._id,
        },
        {
          $set: {
            bio,
            location,
            updatedAt: now,
          },
        }
      );
    }

    const updatedUser = await usersCollection.findOne(
      {
        _id: user._id,
      },
      {
        projection: {
          password: 0,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Profil actualizat cu succes.",
      user: updatedUser,
      nameChanged:
        isNameChanging,
      nextNameChangeAt:
        updatedUser?.nameChangedAt
          ? new Date(
              new Date(
                updatedUser.nameChangedAt
              ).getTime() +
                NAME.CHANGE_COOLDOWN_MS
            )
          : null,
    });
  } catch (error) {
    console.error(
      "Eroare la actualizarea profilului:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "A apărut o eroare.",
      },
      {
        status: 500,
      }
    );
  }
}
