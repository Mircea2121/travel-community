const baseUrl = (process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

const checks = [
  { path: "/", expected: [200] },
  { path: "/login", expected: [200] },
  { path: "/register", expected: [200] },
  { path: "/verify-email", expected: [200] },
  { path: "/api/auth/me", expected: [200, 401, 404] },
  { path: "/api/posts/feed?scope=all&limit=1", expected: [200] },
];

let failed = false;

for (const check of checks) {
  try {
    const startedAt = performance.now();
    const response = await fetch(`${baseUrl}${check.path}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });
    const elapsed = Math.round(performance.now() - startedAt);
    const passed = check.expected.includes(response.status);

    console.log(
      `${passed ? "PASS" : "FAIL"} ${response.status} ${elapsed}ms ${check.path}`
    );
    failed ||= !passed;
  } catch (error) {
    failed = true;
    console.error(`FAIL ${check.path}: ${error.message}`);
  }
}

if (failed) {
  process.exitCode = 1;
}

