import bcrypt from "bcryptjs";
import clientPromise from "../../../utils/mongodb";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!name || !email || !password) {
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

    const client = await clientPromise;
    const database = client.db("travel-community");
    const usersCollection = database.collection("users");

    const existingUser = await usersCollection.findOne({
      email,
    });

    if (existingUser) {
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

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    return Response.json(
      {
        success: true,
        message: "Contul a fost creat cu succes.",
        user: {
          id: result.insertedId.toString(),
          name,
          email,
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