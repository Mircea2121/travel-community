import { randomUUID } from "node:crypto";

import { getCurrentUser } from "../../utils/currentUser";
import { getPostsCollection } from "../../utils/database";
import { fileToBase64 } from "../../utils/image";
import {
  getPublicAuthorProfilesByIds,
  hydratePublicAuthor,
} from "../../utils/publicUser";

import {
  deleteImage,
  uploadImage,
} from "../../utils/cloudinary";

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE =
  10 * 1024 * 1024;

const MAX_TOTAL_COST =
  999999999;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const ALLOWED_CATEGORIES = [
  "plaja",
  "city-break",
  "munte",
  "mancare",
  "aventura",
  "cultura",
  "familie",
  "buget-redus",
];

function getTextValue(
  formData,
  fieldName
) {
  const value =
    formData.get(
      fieldName
    );

  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}
function getNumericCost(
  totalCost
) {
  if (!totalCost) {
    return null;
  }

  return Number(
    totalCost
  );
}

function validatePostData(
  postData,
  images
) {
  if (!postData.title) {
    return "Titlul postării este obligatoriu.";
  }

  if (
    postData.title.length <
      5 ||
    postData.title.length >
      120
  ) {
    return "Titlul trebuie să conțină între 5 și 120 de caractere.";
  }

  if (
    !postData.destination
  ) {
    return "Destinația este obligatorie.";
  }

  if (
    postData.destination
      .length > 100
  ) {
    return "Destinația nu poate depăși 100 de caractere.";
  }

  if (!postData.country) {
    return "Țara este obligatorie.";
  }

  if (
    postData.country
      .length > 80
  ) {
    return "Țara nu poate depăși 80 de caractere.";
  }

  if (
    postData.city.length >
    120
  ) {
    return "Orașul sau zona nu poate depăși 120 de caractere.";
  }

  if (
    !postData.category ||
    !ALLOWED_CATEGORIES.includes(
      postData.category
    )
  ) {
    return "Categoria selectată nu este validă.";
  }

  if (
    postData.travelPeriod
      .length > 100
  ) {
    return "Perioada călătoriei nu poate depăși 100 de caractere.";
  }

  if (
    postData.totalCost
  ) {
    if (
      !/^\d+$/.test(
        postData.totalCost
      )
    ) {
      return "Costul total trebuie să conțină doar cifre.";
    }

    const numericCost =
      Number(
        postData.totalCost
      );

    if (
      !Number.isSafeInteger(
        numericCost
      ) ||
      numericCost <= 0
    ) {
      return "Costul total trebuie să fie un număr mai mare decât 0.";
    }

    if (
      numericCost >
      MAX_TOTAL_COST
    ) {
      return `Costul total nu poate depăși ${MAX_TOTAL_COST} de euro.`;
    }
  }

  if (!postData.tips) {
    return "Ponturile utile sunt obligatorii.";
  }

  if (
    postData.tips.length <
      10 ||
    postData.tips.length >
      3000
  ) {
    return "Ponturile trebuie să conțină între 10 și 3000 de caractere.";
  }

  if (
    !postData.description
  ) {
    return "Povestea călătoriei este obligatorie.";
  }

  if (
    postData.description
      .length < 20 ||
    postData.description
      .length > 10000
  ) {
    return "Povestea trebuie să conțină între 20 și 10000 de caractere.";
  }

  if (
    images.length === 0
  ) {
    return "Trebuie să adaugi cel puțin o imagine.";
  }

  if (
    images.length >
    MAX_IMAGES
  ) {
    return `Poți încărca maximum ${MAX_IMAGES} imagini.`;
  }

  for (
    const image of images
  ) {
    if (
      !ALLOWED_IMAGE_TYPES.includes(
        image.type
      )
    ) {
      return "Sunt acceptate doar imagini JPG, PNG sau WEBP.";
    }

    if (
      image.size >
      MAX_IMAGE_SIZE
    ) {
      return "Fiecare imagine trebuie să aibă maximum 10 MB.";
    }
  }

  return null;
}

function serializePost(
  post
) {
  return {
    ...post,

    _id:
      post._id.toString(),

    authorId:
      post.authorId.toString(),
  };
}

export async function GET(
  request
) {
  try {
    const {
      searchParams,
    } = new URL(
      request.url
    );

    const username =
      searchParams
        .get("username")
        ?.trim()
        .toLowerCase();

    const limitValue =
      Number(
        searchParams.get(
          "limit"
        )
      ) || 20;

    const limit =
      Math.min(
        Math.max(
          limitValue,
          1
        ),
        50
      );

    const postsCollection =
      await getPostsCollection();

    const filter = {};

    if (username) {
      filter.username =
        username;
    }

    const posts =
      await postsCollection
        .find(filter)
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .toArray();

    const authorProfiles =
      await getPublicAuthorProfilesByIds(
        posts.map((post) => post.authorId)
      );

    return Response.json({
      success: true,

      posts:
        posts.map((post) =>
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
    });
  } catch (error) {
    console.error(
      "Eroare la încărcarea postărilor:",
      error
    );

    return Response.json(
      {
        success: false,

        message:
          "Postările nu au putut fi încărcate.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request
) {
  const uploadedImages =
    [];

  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        {
          success: false,

          message:
            "Trebuie să fii autentificat pentru a publica.",
        },
        {
          status: 401,
        }
      );
    }

    const formData =
      await request.formData();

    const postData = {
      title:
        getTextValue(
          formData,
          "title"
        ),

      destination:
        getTextValue(
          formData,
          "destination"
        ),

      country:
        getTextValue(
          formData,
          "country"
        ),

      city:
        getTextValue(
          formData,
          "city"
        ),

      category:
        getTextValue(
          formData,
          "category"
        ),

      travelPeriod:
        getTextValue(
          formData,
          "travelPeriod"
        ),

      totalCost:
        getTextValue(
          formData,
          "totalCost"
        ),

      tips:
        getTextValue(
          formData,
          "tips"
        ),

      description:
        getTextValue(
          formData,
          "description"
        ),
    };

    const images =
      formData
        .getAll("images")
        .filter(
          (image) =>
            image instanceof
              File &&
            image.size > 0
        );

    const validationError =
      validatePostData(
        postData,
        images
      );

    if (
      validationError
    ) {
      return Response.json(
        {
          success: false,

          message:
            validationError,
        },
        {
          status: 400,
        }
      );
    }

    for (
      const image of images
    ) {
      const base64Image =
        await fileToBase64(
          image
        );

      const publicId =
        `travel-community/posts/${currentUser._id}/${randomUUID()}`;

      const uploadResult =
        await uploadImage(
          base64Image,
          publicId
        );

      uploadedImages.push({
        url:
          uploadResult.secure_url,

        publicId:
          uploadResult.public_id,

        width:
          uploadResult.width,

        height:
          uploadResult.height,
      });
    }

    const now =
      new Date();

    const newPost = {
      authorId:
        currentUser._id,

      username:
        currentUser.username
          ?.toLowerCase() ||
        "",

      name:
        currentUser.name ||
        currentUser.username ||
        "Utilizator",

      avatar:
        currentUser.avatar ||
        null,

      title:
        postData.title,

      destination:
        postData.destination,

      country:
        postData.country,

      city:
        postData.city,

      category:
        postData.category,

      travelPeriod:
        postData.travelPeriod,

      totalCost:
        getNumericCost(
          postData.totalCost
        ),

      currency:
        "EUR",

      tips:
        postData.tips,

      description:
        postData.description,

      images:
        uploadedImages,

      likesCount: 0,
      commentsCount: 0,
      savesCount: 0,
      engagementScore: 0,

      createdAt: now,
      updatedAt: now,
    };

    const postsCollection =
      await getPostsCollection();

    const result =
      await postsCollection.insertOne(
        newPost
      );

    return Response.json(
      {
        success: true,

        message:
          "Postarea a fost publicată cu succes.",

        post: {
          ...newPost,

          _id:
            result.insertedId.toString(),

          authorId:
            newPost.authorId.toString(),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Eroare creare postare:",
      error
    );

    if (
      uploadedImages.length >
      0
    ) {
      await Promise.allSettled(
        uploadedImages.map(
          (image) =>
            deleteImage(
              image.publicId
            )
        )
      );
    }

    return Response.json(
      {
        success: false,

        message:
          "Postarea nu a putut fi publicată. Încearcă din nou.",
      },
      {
        status: 500,
      }
    );
  }
}
