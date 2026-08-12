const CATEGORY_LABELS = Object.freeze({
  plaja: "Plajă",
  "plaja-insule": "Plajă & Insule",
  munte: "Munte",
  "munte-natura": "Munte & Natură",
  "city-break": "City Break",
  mancare: "Mâncare",
  "food-travel": "Food Travel",
  aventura: "Aventură",
  cultura: "Cultură",
  familie: "Familie",
  "buget-redus": "Buget redus",
});

function normalizeCategoryKey(value) {
  return value
    .trim()
    .toLocaleLowerCase("ro-RO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatPostCategory(category) {
  const rawCategory =
    typeof category === "string"
      ? category
      : category?.name || category?.label || category?.slug || "";

  if (!rawCategory.trim()) {
    return "";
  }

  const normalizedCategory = normalizeCategoryKey(rawCategory);

  return CATEGORY_LABELS[normalizedCategory] || rawCategory.trim();
}
