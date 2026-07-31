function createImage(imageSource) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => {
      resolve(image);
    });

    image.addEventListener("error", (error) => {
      reject(error);
    });

    image.setAttribute(
      "crossOrigin",
      "anonymous"
    );

    image.src = imageSource;
  });
}

function getOutputSettings(type) {
  if (type === "avatar") {
    return {
      maximumWidth: 600,
      maximumHeight: 600,
      quality: 0.9,
      fileName: "avatar.jpg",
    };
  }

  return {
    maximumWidth: 1800,
    maximumHeight: 1000,
    quality: 0.88,
    fileName: "cover.jpg",
  };
}

export async function getCroppedImage({
  imageSource,
  croppedAreaPixels,
  type = "avatar",
}) {
  if (!imageSource) {
    throw new Error(
      "Sursa imaginii lipsește."
    );
  }

  if (!croppedAreaPixels) {
    throw new Error(
      "Zona de decupare lipsește."
    );
  }

  const image = await createImage(
    imageSource
  );

  const cropWidth = Math.max(
    Math.round(
      croppedAreaPixels.width
    ),
    1
  );

  const cropHeight = Math.max(
    Math.round(
      croppedAreaPixels.height
    ),
    1
  );

  const {
    maximumWidth,
    maximumHeight,
    quality,
    fileName,
  } = getOutputSettings(type);

  const widthScale =
    maximumWidth / cropWidth;

  const heightScale =
    maximumHeight / cropHeight;

  const resizeScale = Math.min(
    widthScale,
    heightScale,
    1
  );

  const outputWidth = Math.max(
    Math.round(
      cropWidth * resizeScale
    ),
    1
  );

  const outputHeight = Math.max(
    Math.round(
      cropHeight * resizeScale
    ),
    1
  );

  const canvas =
    document.createElement("canvas");

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Imaginea nu a putut fi procesată."
    );
  }

  context.imageSmoothingEnabled =
    true;

  context.imageSmoothingQuality =
    "high";

  context.drawImage(
    image,

    Math.round(
      croppedAreaPixels.x
    ),

    Math.round(
      croppedAreaPixels.y
    ),

    cropWidth,
    cropHeight,

    0,
    0,

    outputWidth,
    outputHeight
  );

  const blob = await new Promise(
    (resolve, reject) => {
      canvas.toBlob(
        (generatedBlob) => {
          if (!generatedBlob) {
            reject(
              new Error(
                "Imaginea decupată nu a putut fi creată."
              )
            );

            return;
          }

          resolve(generatedBlob);
        },

        "image/jpeg",
        quality
      );
    }
  );

  return new File(
    [blob],
    fileName,
    {
      type: "image/jpeg",
      lastModified: Date.now(),
    }
  );
}