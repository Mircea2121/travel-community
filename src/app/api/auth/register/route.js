import bcrypt from "bcryptjs";

import { getUsersCollection } from "../../../utils/database";
import {
  EMAIL_PATTERN,
  USERNAME_PATTERN,
  RESERVED_USERNAMES,
} from "../../../utils/validation";

export async function POST(request) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const username = body.username?.trim().toLowerCase();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!name || !username || !email || !password) {
      return Response.json(
        {
          success: false,
          message: "Toate câmpurile sunt obligatorii.",
        },
        {
          status: 400,
        }
      );
    }

    if (!USERNAME_PATTERN.test(username)) {
      return Response.json(
        {
          success: false,
          message:
            "Username-ul poate conține doar litere mici, cifre, punct și underscore și trebuie să aibă între 3 și 20 de caractere.",
        },
        {
          status: 400,
        }
      );
    }

    if (RESERVED_USERNAMES.includes(username)) {
      return Response.json(
        {
          success: false,
          message: "Acest username este rezervat.",
        },
        {
          status: 409,
        }
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      return Response.json(
        {
          success: false,
          message: "Adresa de email nu este validă.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
      return Response.json(
        {
          success: false,
          message: "Parola trebuie să aibă cel puțin 8 caractere.",
        },
        {
          status: 400,
        }
      );
    }

    const usersCollection = await getUsersCollection();

    const existingEmail = await usersCollection.findOne({
      email,
    });

    if (existingEmail) {
      return Response.json(
        {
          success: false,
          message: "Există deja un cont cu această adresă de email.",
        },
        {
          status: 409,
        }
      );
    }

    const existingUsername = await usersCollection.findOne({
      username,
    });

    if (existingUsername) {
      return Response.json(
        {
          success: false,
          message: "Acest username este deja folosit.",
        },
        {
          status: 409,
        }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const now = new Date();

    const newUser = {
      name,
      username,
      email,
      password: hashedPassword,

      role: "user",

      bio: "",
      location: "",

      avatar: {
        url: process.env.DEFAULT_AVATAR_URL,
        publicId: null,
      },

      coverImage: {
        url: process.env.DEFAULT_COVER_URL,
        publicId: null,
      },

      followers: [],
      following: [],

      stats: {
        postsCount: 0,
        destinationsCount: 0,
        likesReceived: 0,
        followersCount: 0,
        followingCount: 0,
        photosUploaded: 0,
      },

      level: {
        name: "Călător începător",
        number: 1,
        currentXp: 0,
        nextLevelXp: 500,
      },

      createdAt: now,
      updatedAt: now,
    };

    const result = await usersCollection.insertOne(newUser);

    return Response.json(
      {
        success: true,
        message: "Contul a fost creat cu succes.",
        user: {
          id: result.insertedId.toString(),
          name,
          username,
          email,
          role: newUser.role,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Eroare la înregistrare:", error);

    return Response.json(
      {
        success: false,
        message: "A apărut o eroare la crearea contului.",
      },
      {
        status: 500,
      }
    );
  }
}