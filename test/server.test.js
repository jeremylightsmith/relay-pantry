import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
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


test("GET /api/recipes/:id returns that recipe with ingredients and steps", async () => {
  await withServer(seedFile, async (base) => {
    const res = await fetch(`${base}/api/recipes/black-bean-tacos`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /application\/json/);
    const body = await res.json();
    assert.equal(body.household.name, "Pine Street Kitchen");
    assert.equal(body.recipe.id, "black-bean-tacos");
    assert.ok(body.recipe.ingredients.length > 0);
    assert.ok(body.recipe.steps.length > 0);
  });
});

test("GET /api/recipes/:id returns 404 JSON for an unknown id", async () => {
  await withServer(seedFile, async (base) => {
    const res = await fetch(`${base}/api/recipes/nope`);
    assert.equal(res.status, 404);
    assert.match(res.headers.get("content-type"), /application\/json/);
    const body = await res.json();
    assert.equal(typeof body.error, "string");
  });
});

test("GET /api/recipes/:id returns 500 JSON when the data file is missing", async () => {
  await withServer(join(scratch, "nope.json"), async (base) => {
    const res = await fetch(`${base}/api/recipes/black-bean-tacos`);
    assert.equal(res.status, 500);
    assert.match(res.headers.get("content-type"), /application\/json/);
    const body = await res.json();
    assert.equal(typeof body.error, "string");
  });
});

test("GET /recipes/:id serves public/recipe.html", async () => {
  await withServer(seedFile, async (base) => {
    const res = await fetch(`${base}/recipes/black-bean-tacos`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/html/);
    const html = await res.text();
    const expected = await readFile(new URL("../public/recipe.html", import.meta.url), "utf8");
    assert.equal(html, expected);
  });
});

test("seed data: every structured ingredient has a numeric amount and an item", async () => {
  const { recipes } = JSON.parse(await readFile(seedFile, "utf8"));
  let structured = 0;
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients ?? []) {
      if ("text" in ing) {
        assert.equal(typeof ing.text, "string", recipe.id);
        continue;
      }
      assert.equal(typeof ing.amount, "number", `${recipe.id}: ${JSON.stringify(ing)}`);
      assert.ok(Number.isFinite(ing.amount), recipe.id);
      assert.equal(typeof ing.item, "string", recipe.id);
      assert.ok(ing.item.trim(), recipe.id);
      structured++;
    }
  }
  assert.ok(structured > 0, "seed data has structured ingredients");
});
