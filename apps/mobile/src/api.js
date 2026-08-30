const productionApiUrl =
  import.meta.env.VITE_API_URL?.trim() ||
  "https://comunitatea-calatorilor.ro";

export const API_BASE_URL = import.meta.env.DEV ? "" : productionApiUrl;

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    Accept: "application/json",
    "X-Client-Platform": "android",
    ...options.headers,
  };

  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.request({
      url,
      method: options.method || "GET",
      headers,
      data: options.body ? JSON.parse(options.body) : undefined,
      connectTimeout: 10000,
      readTimeout: 15000,
    });
    const payload =
      typeof response.data === "string"
        ? JSON.parse(response.data || "null")
        : response.data;

    if (response.status < 200 || response.status >= 300) {
      const error = new Error(
        payload?.message || "Cererea nu a putut fi finalizată."
      );
      error.status = response.status;
      error.code = payload?.code;
      throw error;
    }

    return payload;
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
    signal: options.signal || AbortSignal.timeout(15000),
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

export function getSession() {
  return apiRequest("/api/auth/me");
}

export function login({ email, password, turnstileToken }) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, turnstileToken }),
  });
}

export function register({ name, username, email, password, turnstileToken }) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, username, email, password, turnstileToken }),
  });
}

export function requestPasswordReset({ email, turnstileToken }) {
  return apiRequest("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, turnstileToken }),
  });
}

export function logout() {
  return apiRequest("/api/auth/logout", {
    method: "POST",
  });
}
import { Capacitor, CapacitorHttp } from "@capacitor/core";
