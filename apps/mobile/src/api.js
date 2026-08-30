const productionApiUrl =
  import.meta.env.VITE_API_URL?.trim() ||
  "https://comunitatea-calatorilor.ro";

export const API_BASE_URL = import.meta.env.DEV ? "" : productionApiUrl;

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-Client-Platform": "mobile",
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      payload?.message || "Cererea nu a putut fi finalizată."
    );
    error.status = response.status;
    error.code = payload?.code;
    throw error;
  }

  return payload;
}

export function getFeed() {
  return apiRequest("/api/posts/feed?scope=all&limit=12");
}
