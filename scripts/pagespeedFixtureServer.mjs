// Local visual/a11y test fixture only. No database writes and no authentication bypass.
// Run against an existing production build at 127.0.0.1:3000.
import http from "node:http";
import { gzipSync } from "node:zlib";

const posts = Array.from({ length: 4 }, (_, index) => ({
  id: `00000000000000000000000${index + 1}`,
  title: index === 0 ? "O experiență de călătorie cu un titlu mai lung, pentru verificarea spațiului rezervat în carusel" : "Amintiri din vacanță",
  name: "Călător de test", username: "test", avatar: "",
  city: "Atena", country: "Grecia", category: "city-break",
  images: ["/images/hero-santorini.webp"], createdAt: "2026-10-01T00:00:00Z",
  likesCount: index + 1, commentsCount: 0,
}));

http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:3100");
  let fixture;
  if (url.pathname === "/api/posts/popular") fixture = { success: true, posts };
  if (url.pathname === "/api/discovery/overview") fixture = {
    success: true,
    stats: { activeMembers: 10, accountsCreated: 1234, postsPublished: 456, countriesCount: 23 },
    popularCountries: ["Grecia", "Italia", "Spania"].map((country, index) => ({
      country, key: ["grecia", "italia", "spania"][index], postsCount: 12, citiesCount: 3,
    })),
  };
  if (fixture) {
    // Exercise late data arrival, rather than hiding it before first paint.
    await new Promise(resolve => setTimeout(resolve, 1200));
    response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    response.end(JSON.stringify(fixture));
    return;
  }
  try {
    const upstream = await fetch(`http://127.0.0.1:3000${request.url}`, {
      redirect: "manual", headers: { accept: request.headers.accept || "*/*" },
    });
    const headers = Object.fromEntries(upstream.headers);
    delete headers["content-encoding"];
    delete headers["content-length"];
    let body = Buffer.from(await upstream.arrayBuffer());
    if (request.headers["accept-encoding"]?.includes("gzip")) {
      body = gzipSync(body);
      headers["content-encoding"] = "gzip";
    }
    response.writeHead(upstream.status, headers);
    response.end(body);
  } catch {
    response.writeHead(502);
    response.end("Local build unavailable");
  }
}).listen(3100, "127.0.0.1", () => console.log("TEST FIXTURES ONLY: http://127.0.0.1:3100"));
