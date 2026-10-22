import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { once } from "node:events";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { Linter } from "eslint";
import { Server } from "socket.io";
import { io } from "socket.io-client";

const require = createRequire(import.meta.url);
const pluginPath = require.resolve("@next/eslint-plugin-next");
const { getRootDirs } = require(path.join(path.dirname(pluginPath), "utils/get-root-dirs.js"));
const nextPlugin = require("@next/eslint-plugin-next");

test("Next ESLint discovers directory globs and still rejects internal HTML links", () => {
  const prefix = path.join(tmpdir(), "travel-dependency-test-");
  const scratch = mkdtempSync(prefix);
  try {
    for (const name of ["alpha", "beta"]) {
      mkdirSync(path.join(scratch, name, "pages"), { recursive: true });
      writeFileSync(path.join(scratch, name, "pages", "about.jsx"), "export default function About() { return null; }");
    }
    writeFileSync(path.join(scratch, "plain-file"), "not a directory");
    const glob = `${scratch.replaceAll("\\", "/")}/{alpha,beta}`;
    const expected = ["alpha", "beta"].map(name => path.join(scratch, name)).sort();
    const normalize = directories => directories.map(directory => path.resolve(directory)).sort();
    const context = rootDir => ({ cwd: scratch, settings: { next: { rootDir } } });
    assert.deepEqual(normalize(getRootDirs(context(glob))), expected);
    assert.deepEqual(normalize(getRootDirs(context([glob]))), expected);
    assert.deepEqual(getRootDirs(context(path.join(scratch, "plain-file"))), []);
    assert.deepEqual(normalize(getRootDirs({ cwd: scratch, settings: {} })), [scratch]);

    const linter = new Linter();
    const config = {
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { next: nextPlugin },
      settings: { next: { rootDir: glob } },
      rules: { "next/no-html-link-for-pages": "error" },
    };
    const failures = linter.verify('const link = <a href="/about/">About</a>;', config);
    assert.equal(failures.length, 1);
    assert.equal(failures[0].ruleId, "next/no-html-link-for-pages");
    assert.equal(failures[0].severity, 2);
    assert.deepEqual(linter.verify('const link = <a href="https://example.com">External</a>;', config), []);
  } finally {
    assert.ok(path.resolve(scratch).startsWith(path.resolve(prefix)));
    rmSync(scratch, { recursive: true, force: true });
  }
});

test("Capacitor xcode retains project parsing, writing and UUID generation", () => {
  const mobileRequire = createRequire(new URL("../apps/mobile/package.json", import.meta.url));
  const xcode = mobileRequire("xcode");
  const xcodeRequire = createRequire(mobileRequire.resolve("xcode"));
  const uuid = xcodeRequire("uuid");
  const scratch = mkdtempSync(path.join(tmpdir(), "travel-dependency-test-"));
  try {
    const filename = path.join(scratch, "project.pbxproj");
    writeFileSync(filename, "// !$*UTF8*$!\n{ archiveVersion = 1; classes = {}; objectVersion = 46; objects = {}; rootObject = ABCDEF0123456789ABCDEF01; }\n");
    const project = xcode.project(filename).parseSync();
    const ids = new Set(Array.from({ length: 100 }, () => project.generateUuid()));
    assert.equal(ids.size, 100);
    for (const id of ids) assert.match(id, /^[A-F0-9]{24}$/);
    assert.equal(uuid.validate(uuid.v4()), true);
    const output = project.writeSync();
    writeFileSync(filename, output);
    assert.equal(xcode.project(filename).parseSync().hash.project.objectVersion, project.hash.project.objectVersion);
    assert.match(readFileSync(filename, "utf8"), /rootObject/);
  } finally {
    assert.ok(path.resolve(scratch).startsWith(path.join(path.resolve(tmpdir()), "travel-dependency-test-")));
    rmSync(scratch, { recursive: true, force: true });
  }
});

test("Patched Engine.IO rejects old protocols and Socket.IO retains auth and acknowledgments", { timeout: 10000 }, async () => {
  const httpServer = createServer();
  const server = new Server(httpServer);
  const clients = [];
  server.use((socket, next) => {
    next(socket.handshake.auth.token === "fixture-only" ? undefined : new Error("Unauthorized"));
  });
  server.on("connection", socket => {
    socket.on("message:send", (payload, acknowledge) => acknowledge({ text: payload.text }));
  });
  try {
    httpServer.listen(0, "127.0.0.1");
    await once(httpServer, "listening");
    const origin = `http://127.0.0.1:${httpServer.address().port}`;
    const unsupported = await fetch(`${origin}/socket.io/?EIO=3&transport=polling`);
    assert.equal(unsupported.status, 400);
    const guest = io(origin, { transports: ["websocket"], reconnection: false, timeout: 2000 });
    clients.push(guest);
    const [error] = await once(guest, "connect_error");
    assert.match(error.message, /Unauthorized/);
    const member = io(origin, { auth: { token: "fixture-only" }, transports: ["websocket"], reconnection: false, timeout: 2000 });
    clients.push(member);
    await once(member, "connect");
    assert.deepEqual(await member.timeout(2000).emitWithAck("message:send", { text: "local test" }), { text: "local test" });
  } finally {
    for (const client of clients) client.disconnect();
    await new Promise(resolve => server.close(resolve));
  }
});
