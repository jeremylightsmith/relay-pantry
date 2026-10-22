import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sortRecipes,
  filterByTitle,
  formatTime,
  SORT_OPTIONS,
} from "../public/recipes.js";

const recipes = [
  { id: "a", title: "Black bean tacos", totalMinutes: 25, addedAt: "2026-10-01T10:00:00Z" },
  { id: "b", title: "apple crumble", totalMinutes: 60, addedAt: "2026-10-03T10:00:00Z" },
  { id: "c", title: "Shakshuka", totalMinutes: 25, addedAt: "2026-09-20T10:00:00Z" },
  { id: "d", title: "Chicken soup", totalMinutes: 90, addedAt: "2026-10-02T10:00:00Z" },
];

const ids = (list) => list.map((r) => r.id);

test('sort "recent" puts newest addedAt first', () => {
  assert.deepEqual(ids(sortRecipes(recipes, "recent")), ["b", "d", "a", "c"]);
});

test('sort "az" orders by title, case-insensitive', () => {
  assert.deepEqual(ids(sortRecipes(recipes, "az")), ["b", "a", "d", "c"]);
});

test('sort "quickest" puts lowest totalMinutes first, ties by title', () => {
  assert.deepEqual(ids(sortRecipes(recipes, "quickest")), ["a", "c", "b", "d"]);
});

test('unknown sort mode falls back to "recent"', () => {
  assert.deepEqual(ids(sortRecipes(recipes, "bogus")), ["b", "d", "a", "c"]);
  assert.deepEqual(ids(sortRecipes(recipes)), ["b", "d", "a", "c"]);
});

test("filterByTitle trims and ignores case; empty query returns all", () => {
  assert.deepEqual(ids(filterByTitle(recipes, "  TACO ")), ["a"]);
  assert.deepEqual(ids(filterByTitle(recipes, "")), ids(recipes));
  assert.deepEqual(ids(filterByTitle(recipes, "   ")), ids(recipes));
});

test("formatTime renders minutes and hours", () => {
  assert.equal(formatTime(25), "25 min");
  assert.equal(formatTime(70), "1 hr 10 min");
  assert.equal(formatTime(60), "1 hr");
});

test("sorting and filtering leave the input array unchanged", () => {
  const before = structuredClone(recipes);
  for (const mode of ["recent", "az", "quickest"]) sortRecipes(recipes, mode);
  filterByTitle(recipes, "");
  assert.deepEqual(recipes, before);
  assert.notEqual(sortRecipes(recipes, "recent"), recipes);
  assert.notEqual(filterByTitle(recipes, ""), recipes);
});

test("SORT_OPTIONS lists value, label and hint for each mode", () => {
  assert.deepEqual(SORT_OPTIONS, [
    { value: "recent", label: "Recently added", hint: "Newest first" },
    { value: "az", label: "A–Z", hint: "By title" },
    { value: "quickest", label: "Quickest", hint: "Shortest total time first" },
  ]);
});
