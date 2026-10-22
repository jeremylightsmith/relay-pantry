import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scaleAmount,
  formatAmount,
  ingredientLine,
  nextStepIndex,
  gatheredLabel,
  reduce,
} from "../public/cooking.js";

test("scaleAmount scales by the servings ratio", () => {
  assert.equal(scaleAmount(2, 4, 8), 4);
  assert.equal(scaleAmount(1, 4, 2), 0.5);
});

test("formatAmount uses common fractions, mixed numbers, else one decimal", () => {
  assert.equal(formatAmount(0.5), "½");
  assert.equal(formatAmount(1.5), "1½");
  assert.equal(formatAmount(0.333), "⅓");
  assert.equal(formatAmount(2), "2");
  assert.equal(formatAmount(0.4), "0.4");
});

test("ingredientLine leaves free text unchanged at any servings", () => {
  const salt = { text: "Salt, to taste" };
  assert.equal(ingredientLine(salt, 4, 4), "Salt, to taste");
  assert.equal(ingredientLine(salt, 4, 8), "Salt, to taste");
  assert.equal(ingredientLine(salt, 4, 1), "Salt, to taste");
});

test("ingredientLine scales structured amounts and appends the note", () => {
  const rice = { amount: 1, unit: "cup", item: "rice", note: "rinsed" };
  assert.equal(ingredientLine(rice, 4, 8), "2 cup rice, rinsed");
});

test("nextStepIndex is the first step not done, or -1 when all are", () => {
  assert.equal(nextStepIndex(new Set([0, 1]), 5), 2);
  assert.equal(nextStepIndex(new Set([0, 1, 2, 3, 4]), 5), -1);
});

test("gatheredLabel counts ticked ingredients", () => {
  assert.equal(gatheredLabel(2, 12), "2 of 12 gathered");
});

const view = (over = {}) => ({ servings: 4, gathered: new Set(), done: new Set(), tab: "ingredients", ...over });

test("reduce: toggle-ingredient twice leaves it unticked", () => {
  const once = reduce(view(), { type: "toggle-ingredient", index: 2 });
  assert.deepEqual([...once.gathered], [2]);
  const twice = reduce(once, { type: "toggle-ingredient", index: 2 });
  assert.deepEqual([...twice.gathered], []);
});

test("reduce: clear-checks empties gathered and keeps done steps", () => {
  const next = reduce(view({ gathered: new Set([0, 3]), done: new Set([1]) }), { type: "clear-checks" });
  assert.deepEqual([...next.gathered], []);
  assert.deepEqual([...next.done], [1]);
});

test("reduce: toggle-step marks a step done and back", () => {
  const once = reduce(view(), { type: "toggle-step", index: 0 });
  assert.deepEqual([...once.done], [0]);
  assert.deepEqual([...reduce(once, { type: "toggle-step", index: 0 }).done], []);
});

test("reduce: servings-down at 1 stays 1; servings-up adds one", () => {
  assert.equal(reduce(view({ servings: 1 }), { type: "servings-down" }).servings, 1);
  assert.equal(reduce(view({ servings: 3 }), { type: "servings-down" }).servings, 2);
  assert.equal(reduce(view({ servings: 3 }), { type: "servings-up" }).servings, 4);
});

test("reduce: go-to-steps switches to the steps tab; tab picks either", () => {
  assert.equal(reduce(view(), { type: "go-to-steps" }).tab, "steps");
  assert.equal(reduce(view({ tab: "steps" }), { type: "tab", tab: "ingredients" }).tab, "ingredients");
});

test("reduce does not mutate the view it is given", () => {
  const before = view({ gathered: new Set([1]) });
  reduce(before, { type: "toggle-ingredient", index: 1 });
  assert.deepEqual([...before.gathered], [1]);
});
