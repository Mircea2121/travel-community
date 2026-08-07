export const DISCOVERY_CATEGORY_GROUPS = [
  {
    slug: "plaje-insule",
    title: "Plaje & Insule",
    description:
      "Destinații cu apă turcoaz, nisip fin și apusuri spectaculoase.",
    categories: ["plaja"],
  },
  {
    slug: "munte-natura",
    title: "Munte & Natură",
    description:
      "Trasee, cabane, lacuri alpine și locuri perfecte pentru relaxare.",
    categories: ["munte"],
  },
  {
    slug: "city-break",
    title: "City Break",
    description:
      "Orașe, cafenele, muzee, arhitectură și viață de noapte.",
    categories: ["city-break", "cultura"],
  },
  {
    slug: "food-travel",
    title: "Food Travel",
    description:
      "Locuri recomandate pentru mâncare locală și experiențe culinare.",
    categories: ["mancare"],
  },
  {
    slug: "aventura",
    title: "Aventură",
    description:
      "Backpacking, road trips, camping și experiențe memorabile.",
    categories: ["aventura", "familie", "buget-redus"],
  },
];

export function normalizeDiscoveryValue(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ro-RO")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeCountryKey(value) {
  return normalizeDiscoveryValue(value);
}

export function getDiscoveryCategory(slug) {
  const normalizedSlug = normalizeDiscoveryValue(slug);

  return (
    DISCOVERY_CATEGORY_GROUPS.find(
      (group) => group.slug === normalizedSlug
    ) || null
  );
}

export function getCountryDisplayName(value) {
  const normalizedValue = String(value || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!normalizedValue) {
    return "";
  }

  return normalizedValue
    .split(" ")
    .map((part) => {
      if (!part) {
        return part;
      }

      return `${part.charAt(0).toLocaleUpperCase("ro-RO")}${part
        .slice(1)
        .toLocaleLowerCase("ro-RO")}`;
    })
    .join(" ");
}
