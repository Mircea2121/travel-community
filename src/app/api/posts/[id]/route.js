import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "../../../utils/currentUser";
import {
  getPublicAuthorProfilesByIds,
  hydratePublicAuthor,
} from "../../../utils/publicUser";
import { getPostsCollection } from "../../../utils/database";
import { fileToBase64 } from "../../../utils/image";
import { normalizeCountryKey } from "../../../utils/discovery";
import {
  deleteImage,
  uploadImage,
} from "../../../utils/cloudinary";

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

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

function serializePost(post) {
  return {
    ...post,
    _id: String(post._id),
    authorId: String(post.authorId),
  };
}

function getTextValue(formData, fieldName) {
  const value = formData.get(fieldName);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getImagePublicId(image) {
  if (
    image &&
    typeof image === "object" &&
    typeof image.publicId === "string"
  ) {
    return image.publicId;
  }

  return "";
}

function isPostOwner(post, currentUser) {
  if (!post || !currentUser) {
    return false;
  }

  return (
    String(post.authorId) ===
    String(currentUser._id)
  );
}

function validatePostData(postData, imagesCount) {
  if (!postData.title) {
    return "Titlul postării este obligatoriu.";
  }

  if (
    postData.title.length < 5 ||
    postData.title.length > 120
  ) {
    return "Titlul trebuie să conțină între 5 și 120 de caractere.";
  }

  if (!postData.destination) {
    return "Destinația este obligatorie.";
  }

  if (postData.destination.length > 100) {
    return "Destinația nu poate depăși 100 de caractere.";
  }

  if (!postData.country) {
    return "Țara este obligatorie.";
  }

  if (postData.country.length > 80) {
    return "Țara nu poate depăși 80 de caractere.";
  }

  if (postData.city.length > 120) {
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

  if (postData.travelPeriod.length > 100) {
    return "Perioada călătoriei nu poate depăși 100 de caractere.";
  }

  if (postData.totalCost.length > 100) {
    return "Costul total nu poate depăși 100 de caractere.";
  }

  if (!postData.tips) {
    return "Ponturile utile sunt obligatorii.";
  }

  if (
    postData.tips.length < 10 ||
    postData.tips.length > 3000
  ) {
    return "Ponturile trebuie să conțină între 10 și 3000 de caractere.";
  }

  if (!postData.description) {
    return "Povestea călătoriei este obligatorie.";
  }

  if (
    postData.description.length < 20 ||
    postData.description.length > 10000
  ) {
    return "Povestea trebuie să conțină între 20 și 10000 de caractere.";
  }

  if (imagesCount < 1) {
    return "Postarea trebuie să conțină cel puțin o imagine.";
  }

  if (imagesCount > MAX_IMAGES) {
    return `Postarea poate conține maximum ${MAX_IMAGES} imagini.`;
  }

  return null;
}

function validateNewImages(images) {
  for (const image of images) {
    if (
      !ALLOWED_IMAGE_TYPES.includes(image.type)
    ) {
      return "Sunt acceptate doar imagini JPG, PNG sau WEBP.";
    }

    if (image.size > MAX_IMAGE_SIZE) {
      return "Fiecare imagine trebuie să aibă maximum 10 MB.";
    }
  }

  return null;
}

function parseRetainedImages(
  existingImagesValue,
  currentImages
) {
  if (typeof existingImagesValue !== "string") {
    return currentImages;
  }

  const parsedImages = JSON.parse(
    existingImagesValue
  );

  if (!Array.isArray(parsedImages)) {
    throw new Error(
      "Lista imaginilor existente nu este validă."
    );
  }

  const currentImagesByPublicId = new Map();

  for (const image of currentImages) {
    const publicId = getImagePublicId(image);

    if (publicId) {
      currentImagesByPublicId.set(
        publicId,
        image
      );
    }
  }

  const retainedImages = [];

  for (const requestedImage of parsedImages) {
    const publicId =
      typeof requestedImage === "string"
        ? requestedImage
        : getImagePublicId(requestedImage);

    if (
      publicId &&
      currentImagesByPublicId.has(publicId)
    ) {
      retainedImages.push(
        currentImagesByPublicId.get(publicId)
      );
    }
  }

  return retainedImages;
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          message:
            "ID-ul postării nu este valid.",
        },
        {
          status: 400,
        }
      );
    }

    const postsCollection =
      await getPostsCollection();

    const post = await postsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!post) {
      return Response.json(
        {
          success: false,
          message:
            "Postarea nu a fost găsită.",
        },
        {
          status: 404,
        }
      );
    }

    const authorProfiles =
      await getPublicAuthorProfilesByIds([
        post.authorId,
      ]);

    const hydratedPost =
      hydratePublicAuthor(
        post,
        authorProfiles,
        {
          userIdField: "authorId",
        }
      );

    return Response.json({
      success: true,
      post: serializePost(hydratedPost),
    });
  } catch (error) {
    console.error(
      "Eroare la încărcarea postării:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Postarea nu a putut fi încărcată.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request,
  { params }
) {
  const newlyUploadedImages = [];

  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        {
          success: false,
          message:
            "Trebuie să fii autentificat pentru a edita postarea.",
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
          message:
            "ID-ul postării nu este valid.",
        },
        {
          status: 400,
        }
      );
    }

    const postObjectId = new ObjectId(id);

    const postsCollection =
      await getPostsCollection();

    const existingPost =
      await postsCollection.findOne({
        _id: postObjectId,
      });

    if (!existingPost) {
      return Response.json(
        {
          success: false,
          message:
            "Postarea nu a fost găsită.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !isPostOwner(
        existingPost,
        currentUser
      )
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Nu ai permisiunea să editezi această postare.",
        },
        {
          status: 403,
        }
      );
    }

    const formData =
      await request.formData();

    const postData = {
      title: getTextValue(
        formData,
        "title"
      ),

      destination: getTextValue(
        formData,
        "destination"
      ),

      country: getTextValue(
        formData,
        "country"
      ),

      city: getTextValue(
        formData,
        "city"
      ),

      category: getTextValue(
        formData,
        "category"
      ),

      travelPeriod: getTextValue(
        formData,
        "travelPeriod"
      ),

      totalCost: getTextValue(
        formData,
        "totalCost"
      ),

      tips: getTextValue(
        formData,
        "tips"
      ),

      description: getTextValue(
        formData,
        "description"
      ),
    };

    const currentImages =
      Array.isArray(existingPost.images)
        ? existingPost.images
        : [];

    let retainedImages;

    try {
      retainedImages = parseRetainedImages(
        formData.get("existingImages"),
        currentImages
      );
    } catch (parseError) {
      return Response.json(
        {
          success: false,
          message:
            parseError.message ||
            "Lista imaginilor existente nu este validă.",
        },
        {
          status: 400,
        }
      );
    }

    const newImages = formData
      .getAll("images")
      .filter(
        (image) =>
          image instanceof File &&
          image.size > 0
      );

    const imagesValidationError =
      validateNewImages(newImages);

    if (imagesValidationError) {
      return Response.json(
        {
          success: false,
          message:
            imagesValidationError,
        },
        {
          status: 400,
        }
      );
    }

    const finalImagesCount =
      retainedImages.length +
      newImages.length;

    const validationError =
      validatePostData(
        postData,
        finalImagesCount
      );

    if (validationError) {
      return Response.json(
        {
          success: false,
          message: validationError,
        },
        {
          status: 400,
        }
      );
    }

    for (const image of newImages) {
      const base64Image =
        await fileToBase64(image);

      const publicId =
        `travel-community/posts/${currentUser._id}/${randomUUID()}`;

      const uploadResult =
        await uploadImage(
          base64Image,
          publicId
        );

      newlyUploadedImages.push({
        url: uploadResult.secure_url,
        publicId:
          uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
      });
    }

    const finalImages = [
      ...retainedImages,
      ...newlyUploadedImages,
    ];

    const retainedPublicIds = new Set(
      retainedImages
        .map(getImagePublicId)
        .filter(Boolean)
    );

    const imagesToDelete =
      currentImages.filter((image) => {
        const publicId =
          getImagePublicId(image);

        return (
          publicId &&
          !retainedPublicIds.has(publicId)
        );
      });

    const updatedPost =
      await postsCollection.findOneAndUpdate(
        {
          _id: postObjectId,
          authorId: currentUser._id,
        },
        {
          $set: {
            ...postData,
            countryKey: normalizeCountryKey(postData.country),
            images: finalImages,
            updatedAt: new Date(),
          },
        },
        {
          returnDocument: "after",
        }
      );

    if (!updatedPost) {
      throw new Error(
        "Postarea nu a putut fi actualizată în baza de date."
      );
    }

    await Promise.allSettled(
      imagesToDelete.map((image) =>
        deleteImage(
          getImagePublicId(image)
        )
      )
    );

    return Response.json({
      success: true,
      message:
        "Postarea a fost actualizată cu succes.",
      post: serializePost(updatedPost),
    });
  } catch (error) {
    console.error(
      "Eroare la editarea postării:",
      error
    );

    if (
      newlyUploadedImages.length > 0
    ) {
      await Promise.allSettled(
        newlyUploadedImages.map((image) =>
          deleteImage(image.publicId)
        )
      );
    }

    return Response.json(
      {
        success: false,
        message:
          "Postarea nu a putut fi actualizată.",
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
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        {
          success: false,
          message:
            "Trebuie să fii autentificat pentru a șterge postarea.",
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
          message:
            "ID-ul postării nu este valid.",
        },
        {
          status: 400,
        }
      );
    }

    const postObjectId = new ObjectId(id);

    const postsCollection =
      await getPostsCollection();

    const post = await postsCollection.findOne({
      _id: postObjectId,
    });

    if (!post) {
      return Response.json(
        {
          success: false,
          message:
            "Postarea nu a fost găsită.",
        },
        {
          status: 404,
        }
      );
    }

    if (!isPostOwner(post, currentUser)) {
      return Response.json(
        {
          success: false,
          message:
            "Nu ai permisiunea să ștergi această postare.",
        },
        {
          status: 403,
        }
      );
    }

    const deleteResult =
      await postsCollection.deleteOne({
        _id: postObjectId,
        authorId: currentUser._id,
      });

    if (deleteResult.deletedCount !== 1) {
      throw new Error(
        "Postarea nu a fost ștearsă din MongoDB."
      );
    }

    const postImages = Array.isArray(
      post.images
    )
      ? post.images
      : [];

    const cloudinaryResults =
      await Promise.allSettled(
        postImages
          .map(getImagePublicId)
          .filter(Boolean)
          .map((publicId) =>
            deleteImage(publicId)
          )
      );

    const failedCloudinaryDeletions =
      cloudinaryResults.filter(
        (result) =>
          result.status === "rejected"
      );

    if (
      failedCloudinaryDeletions.length > 0
    ) {
      console.error(
        "Unele imagini nu au putut fi șterse din Cloudinary:",
        failedCloudinaryDeletions
      );
    }

    return Response.json({
      success: true,
      message:
        "Postarea a fost ștearsă cu succes.",
    });
  } catch (error) {
    console.error(
      "Eroare la ștergerea postării:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Postarea nu a putut fi ștearsă.",
      },
      {
        status: 500,
      }
    );
  }
}
