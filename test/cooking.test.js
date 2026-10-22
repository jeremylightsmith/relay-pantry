import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scaleAmount,
  formatAmount,
  ingredientLine,
  nextStepIndex,
  gatheredLabel,
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
