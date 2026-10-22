import assert from "node:assert/strict";

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
for (const cookie of ["", "token=invalid"] ) {
  const headers = cookie ? { Cookie: cookie } : {};
  const response = await fetch(`${baseUrl}/api/auth/session`, { headers });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.deepEqual(await response.json(), { success: true, user: null });
  const protectedResponse = await fetch(`${baseUrl}/api/auth/me`, { headers });
  assert.equal(protectedResponse.status, 401);
}
const presence = await fetch(`${baseUrl}/api/users/presence`, { method: "POST" });
assert.equal(presence.status, 401);
const homepage = await fetch(baseUrl);
const html = await homepage.text();
assert.match(html, /Descoperă lumea prin/);
assert.match(html, /rel="preload"[^>]*as="image"/);
assert.match(html, /fetchPriority="high"/);
assert.match(html, /hero-santorini/);
assert.doesNotMatch(html, /randomuser\.me/);
assert.doesNotMatch(html, /page-loader/);
const policy = homepage.headers.get("content-security-policy");
assert.match(policy, /object-src 'none'/);
assert.match(policy, /frame-ancestors 'none'/);
assert.doesNotMatch(policy, /randomuser/);
console.log("PASS guest/invalid session, protected API authorization, SSR hero/preload and CSP");
