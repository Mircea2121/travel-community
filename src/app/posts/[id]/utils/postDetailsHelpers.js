import { getUserInitials } from "../../../utils/getUserInitials";

const CATEGORY_LABELS = {
  plaja: "Plajă",
  "city-break": "City break",
  munte: "Munte",
  mancare: "Mâncare",
  aventura: "Aventură",
  cultura: "Cultură",
  familie: "Familie",
  "buget-redus": "Buget redus",
};

export function getAvatarUrl(avatar) {
  if (typeof avatar === "string") {
    return avatar;
  }

  if (
    avatar &&
    typeof avatar === "object" &&
    typeof avatar.url === "string"
  ) {
    return avatar.url;
  }

  return "";
}

export function getLocation(post) {
  const locationParts = [];

  const city =
    typeof post?.city === "string"
      ? post.city.trim()
      : "";

  const destination =
    typeof post?.destination === "string"
      ? post.destination.trim()
      : "";

  const country =
    typeof post?.country === "string"
      ? post.country.trim()
      : "";

  if (city) {
    locationParts.push(city);
  }

  if (
    destination &&
    destination.toLowerCase() !==
      city.toLowerCase()
  ) {
    locationParts.push(destination);
  }

  if (
    country &&
    country.toLowerCase() !==
      destination.toLowerCase() &&
    country.toLowerCase() !==
      city.toLowerCase()
  ) {
    locationParts.push(country);
  }

  return locationParts.join(", ");
}

export function getCategoryLabel(category) {
  if (
    typeof category !== "string" ||
    !category.trim()
  ) {
    return "";
  }

  const normalizedCategory =
    category.trim().toLowerCase();

  return (
    CATEGORY_LABELS[normalizedCategory] ||
    category
  );
}

export function getUserId(user) {
  return String(
    user?._id ||
      user?.id ||
      ""
  );
}

export function getUserDisplayName(user) {
  return (
    user?.name ||
    user?.username ||
    "Utilizator"
  );
}

export function getUserInitial(user) {
  return getUserInitials(
    getUserDisplayName(user)
  );
}

export function formatCommentDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "ro-RO",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

export function getPostImages(post) {
  if (!Array.isArray(post?.images)) {
    return [];
  }

  return post.images.filter((image) => {
    if (typeof image === "string") {
      return Boolean(image.trim());
    }

    return Boolean(
      image &&
        typeof image === "object" &&
        typeof image.url === "string" &&
        image.url.trim()
    );
  });
}

export function getImageUrl(image) {
  if (typeof image === "string") {
    return image;
  }

  if (
    image &&
    typeof image === "object" &&
    typeof image.url === "string"
  ) {
    return image.url;
  }

  return "";
}

export function getImageKey(
  image,
  index
) {
  if (
    image &&
    typeof image === "object" &&
    typeof image.publicId === "string" &&
    image.publicId
  ) {
    return image.publicId;
  }

  const imageUrl = getImageUrl(image);

  return `${imageUrl}-${index}`;
}
