import dns from "node:dns/promises";
import tls from "node:tls";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI?.trim();
if (!uri) throw new Error("MONGODB_URI lipsește; încarcă mediul cu --env-file.");
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("Elimină NODE_TLS_REJECT_UNAUTHORIZED=0 înainte de diagnostic.");
}
const parsed = new URL(uri);
for (const [key, value] of parsed.searchParams) {
  if ((/^(tlsInsecure|tlsAllowInvalidCertificates|tlsAllowInvalidHostnames)$/i.test(key) && value.toLowerCase() === "true") ||
      (/^(tls|ssl)$/i.test(key) && value.toLowerCase() === "false")) {
    throw new Error("Diagnosticul necesită TLS cu validarea certificatelor și a hostname-ului activă.");
  }
}

// Never print the URI, user, password, tokens, or query values.
console.log(JSON.stringify({ node: process.version, openssl: process.versions.openssl, host: parsed.hostname, dnsServers: dns.getServers() }));

function checkTls(host, port, version) {
  return new Promise(resolve => {
    const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: true,
      ...(version ? { minVersion: version, maxVersion: version } : {}),
    });
    socket.setTimeout(5000, () => socket.destroy(Object.assign(new Error("Timeout"), { code: "TIMEOUT" })));
    socket.once("secureConnect", () => {
      const certificate = socket.getPeerCertificate();
      resolve({ host, version: version || "default", ok: socket.authorized,
        protocol: socket.getProtocol(), issuer: certificate.issuer?.O, validTo: certificate.valid_to });
      socket.end();
    });
    socket.once("error", error => resolve({ host, version: version || "default", ok: false, code: error.code }));
  });
}

try {
  const nodes = parsed.protocol === "mongodb+srv:"
    ? await dns.resolveSrv(`_mongodb._tcp.${parsed.hostname}`)
    : [{ name: parsed.hostname, port: Number(parsed.port) || 27017 }];
  console.log("DNS SRV", JSON.stringify(nodes));
  const probes = await Promise.all(nodes.flatMap(({ name, port }) =>
    ["TLSv1.2", "TLSv1.3"].map(version => checkTls(name, port, version))));
  for (const probe of probes) console.log("TLS", JSON.stringify(probe));
  if (probes.every(probe => probe.code === "ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR")) {
    console.log("Atlas respinge negocierea TLS. Verifică IP Access List și starea clusterului; nu dezactiva validarea certificatelor.");
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 5000,
    tls: true, tlsAllowInvalidCertificates: false, tlsAllowInvalidHostnames: false });
  try {
    await client.connect();
    await client.db("travel-community").command({ ping: 1 });
    console.log("PASS MongoDB ping (read-only)");
  } catch (error) {
    const authenticationFailed = error.code === 18 ||
      (error.code === 8000 && /bad auth|authentication failed/i.test(error.message));
    console.error("FAIL MongoDB ping", JSON.stringify({ name: error.name, code: error.code,
      authenticationFailed,
      serverErrors: [...(error.reason?.servers?.values() || [])].map(server => server.error?.cause?.code || server.error?.code).filter(Boolean) }));
    if (authenticationFailed) {
      console.error("TLS este disponibil, dar credențialele MongoDB sunt respinse. Verifică MONGODB_URI și authSource; nu afișa parola în loguri.");
    }
    process.exitCode = 1;
  } finally {
    await client.close();
  }
} catch (error) {
  console.error("FAIL MongoDB diagnostic", JSON.stringify({ name: error.name, code: error.code }));
  process.exitCode = 1;
}
