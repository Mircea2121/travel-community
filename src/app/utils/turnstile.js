const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const CLOUDFLARE_ALWAYS_PASS_TEST_SECRET =
  "1x0000000000000000000000000000000AA";

function getSecret() {
  return process.env.TURNSTILE_SECRET_KEY?.trim() || "";
}

function getExpectedHostnames() {
  const configuredHostname =
    process.env.TURNSTILE_EXPECTED_HOSTNAME?.trim().toLowerCase();

  if (!configuredHostname) {
    return new Set();
  }

  const hostnames = new Set([configuredHostname]);

  if (configuredHostname.startsWith("www.")) {
    hostnames.add(configuredHostname.slice(4));
  } else {
    hostnames.add(`www.${configuredHostname}`);
  }

  return hostnames;
}

export async function verifyTurnstile({ token, remoteIp, action }) {
  const secret = getSecret();

  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return {
        success: true,
        skipped: true,
      };
    }

    console.error("TURNSTILE_SECRET_KEY lipsește în producție.");
    return {
      success: false,
      code: "TURNSTILE_NOT_CONFIGURED",
    };
  }

  const normalizedToken =
    typeof token === "string" ? token.trim() : "";

  if (!normalizedToken || normalizedToken.length > 2048) {
    return {
      success: false,
      code: "TURNSTILE_TOKEN_MISSING",
    };
  }

  const formData = new URLSearchParams({
    secret,
    response: normalizedToken,
  });

  if (remoteIp && remoteIp !== "unknown") {
    formData.set("remoteip", remoteIp);
  }

  let response;

  try {
    response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error("Verificarea Turnstile nu este disponibilă:", error);
    return {
      success: false,
      code: "TURNSTILE_UNAVAILABLE",
    };
  }

  if (!response.ok) {
    return {
      success: false,
      code: "TURNSTILE_UNAVAILABLE",
    };
  }

  const result = await response.json().catch(() => null);

  if (!result?.success) {
    console.warn("Turnstile rejected the verification", {
      errors: Array.isArray(result?.["error-codes"])
        ? result["error-codes"]
        : [],
    });

    return {
      success: false,
      code: "TURNSTILE_REJECTED",
      errors: Array.isArray(result?.["error-codes"])
        ? result["error-codes"]
        : [],
    };
  }

  if (action && result.action && result.action !== action) {
    console.warn("Turnstile action mismatch", {
      expectedAction: action,
      receivedAction: result.action,
    });

    return {
      success: false,
      code: "TURNSTILE_ACTION_MISMATCH",
    };
  }

  const expectedHostnames = getExpectedHostnames();
  const usesOfficialTestSecret =
    process.env.NODE_ENV !== "production" &&
    secret === CLOUDFLARE_ALWAYS_PASS_TEST_SECRET;

  if (
    !usesOfficialTestSecret &&
    expectedHostnames.size > 0 &&
    !expectedHostnames.has(result.hostname?.toLowerCase())
  ) {
    console.warn("Turnstile hostname mismatch", {
      expectedHostnames: [...expectedHostnames],
      receivedHostname: result.hostname || null,
    });

    return {
      success: false,
      code: "TURNSTILE_HOSTNAME_MISMATCH",
    };
  }

  return {
    success: true,
    hostname: result.hostname || null,
    action: result.action || null,
  };
}

