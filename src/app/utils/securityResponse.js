const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
};

export function jsonResponse(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      ...NO_STORE_HEADERS,
      ...headers,
    },
  });
}

export function rateLimitResponse(rateLimit) {
  return jsonResponse(
    {
      success: false,
      code: "RATE_LIMITED",
      message:
        "Ai trimis prea multe cereri. Așteaptă puțin și încearcă din nou.",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    },
    429,
    {
      "Retry-After": String(rateLimit.retryAfterSeconds),
      "X-RateLimit-Limit": String(rateLimit.limit),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(
        Math.ceil(rateLimit.resetAt.getTime() / 1000)
      ),
    }
  );
}

