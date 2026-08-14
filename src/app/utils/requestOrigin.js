function normalizeOrigin(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins() {
  const origins = new Set();
  const appOrigin = normalizeOrigin(process.env.APP_URL);

  if (appOrigin) {
    origins.add(appOrigin);

    const appUrl = new URL(appOrigin);

    if (appUrl.hostname.startsWith("www.")) {
      appUrl.hostname = appUrl.hostname.slice(4);
    } else {
      appUrl.hostname = `www.${appUrl.hostname}`;
    }

    origins.add(appUrl.origin);
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }

  return origins;
}

export function isTrustedMutationRequest(request) {
  const headers = request?.headers;

  if (!headers || typeof headers.get !== "function") {
    return false;
  }

  const fetchSite = headers.get("sec-fetch-site")?.toLowerCase();

  if (fetchSite === "cross-site") {
    return false;
  }

  const originHeader = headers.get("origin");
  const origin = normalizeOrigin(originHeader);

  if (!origin) {
    return process.env.NODE_ENV !== "production";
  }

  return getAllowedOrigins().has(origin);
}

