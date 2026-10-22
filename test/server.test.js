import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "../server.js";

const seedFile = new URL("../data/recipes.json", import.meta.url).pathname;

async function withServer(dataFile, fn) {
  const server = createServer({ dataFile });
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://localhost:${server.address().port}`;
  try {
    return await fn(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

let scratch;
before(async () => {
  scratch = await mkdtemp(join(tmpdir(), "pantry-server-"));
});

test("GET /api/recipes returns the household and recipes", async () => {
  await withServer(seedFile, async (base) => {
    const res = await fetch(`${base}/api/recipes`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /application\/json/);
    const body = await res.json();
    assert.equal(body.household.name, "Pine Street Kitchen");
    assert.ok(Array.isArray(body.recipes));
    assert.ok(body.recipes.length > 0);
  });
});

test("GET /api/recipes returns 500 JSON when the data file is missing", async () => {
  await withServer(join(scratch, "nope.json"), async (base) => {
    const res = await fetch(`${base}/api/recipes`);
    assert.equal(res.status, 500);
    assert.match(res.headers.get("content-type"), /application\/json/);
    const body = await res.json();
    assert.equal(typeof body.error, "string");
  });
});

test("GET /api/recipes returns 500 JSON when the data file is invalid", async () => {
  const bad = join(scratch, "bad.json");
  await writeFile(bad, "{ not json");
  await withServer(bad, async (base) => {
    const res = await fetch(`${base}/api/recipes`);
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(typeof body.error, "string");
  });
});

test("GET / serves public/index.html", async () => {
  await withServer(seedFile, async (base) => {
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/html/);
    assert.match(await res.text(), /<!doctype html>/i);
  });
});

test("path traversal outside public/ is 404", async () => {
  await withServer(seedFile, async (base) => {
    for (const path of ["/../package.json", "/%2e%2e/package.json", "/..%2fpackage.json"]) {
      const res = await fetch(`${base}${path}`);
      assert.equal(res.status, 404, path);
    }
  });
});

test("unknown path is 404", async () => {
  await withServer(seedFile, async (base) => {
    const res = await fetch(`${base}/no-such-thing.html`);
    assert.equal(res.status, 404);
  });
});

