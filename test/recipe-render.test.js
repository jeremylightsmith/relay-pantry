import { test } from "node:test";
import assert from "node:assert/strict";
import {
  renderRecipePage,
  renderRecipeLoading,
  renderRecipeNotFound,
  renderRecipeError,
} from "../public/recipe-render.js";

const tacos = {
  id: "black-bean-tacos",
  title: "Black bean tacos",
  photoUrl: "https://example.com/tacos.jpg",
  totalMinutes: 25,
  tags: ["Vegetarian", "Weeknight"],
  addedBy: "Maya",
  addedAt: "2026-10-18T18:30:00Z",
  servings: 4,
  ingredients: [
    { amount: 2, unit: "cans", item: "black beans", note: "drained and rinsed" },
    { amount: 0.5, unit: "tsp", item: "smoked paprika", note: null },
    { amount: 8, unit: null, item: "corn tortillas", note: null },
    { text: "salt to taste" },
  ],
  steps: ["Soften the onion.", "Add the spices.", "Warm the tortillas."],
};

const view = (overrides = {}) => ({
  servings: 4,
  gathered: new Set(),
  done: new Set(),
  tab: "ingredients",
  ...overrides,
});

const count = (html, pattern) => (html.match(pattern) ?? []).length;
const steps = (html) => html.match(/<li class="step[^"]*"[\s\S]*?<\/li>/g) ?? [];

test("full recipe shows the hero photo, Back and Edit links, and every ingredient and step", () => {
  const html = renderRecipePage(tacos, view());
  assert.match(html, /class="hero"[\s\S]*<img [^>]*src="https:\/\/example\.com\/tacos\.jpg"/);
  assert.match(html, /<a [^>]*class="btn back"[^>]*href="\/"/);
  assert.match(html, /<a [^>]*class="btn edit"[^>]*href="\/recipes\/black-bean-tacos\/edit"/);
  assert.equal(count(html, /<li class="ingredient-row/g), 4);
  assert.equal(steps(html).length, 3);
  assert.ok(html.includes("Black bean tacos"));
  assert.ok(html.includes("25 min"));
  assert.ok(html.includes("Added by Maya"));
  assert.equal(count(html, /class="chip"/g), 2);
  assert.ok(html.includes("0 of 4 gathered"));
  assert.ok(html.includes("Clear checks"));
  assert.ok(html.includes("Go to steps"));
  assert.match(html, /role="tab"[^>]*aria-selected="true"[^>]*>Ingredients</);
  assert.match(html, /role="tab"[^>]*aria-selected="false"[^>]*>Steps</);
});

test("no photo drops the hero but keeps the title and actions", () => {
  const html = renderRecipePage({ ...tacos, photoUrl: null }, view());
  assert.ok(!html.includes('class="hero"'));
  assert.ok(!html.includes("<img"));
  assert.match(html, /<h1[^>]*>Black bean tacos<\/h1>/);
  assert.ok(html.includes('class="btn back"'));
  assert.ok(html.includes('class="btn edit"'));
});

test("no steps prompts to add steps; title only prompts for both", () => {
  const noSteps = renderRecipePage({ ...tacos, steps: [] }, view());
  assert.match(noSteps, /<a [^>]*href="\/recipes\/black-bean-tacos\/edit"[^>]*>Add steps<\/a>/);
  assert.ok(!noSteps.includes("Add ingredients"));

  const titleOnly = renderRecipePage(
    { id: "banana-bread", title: "Banana bread", photoUrl: null, totalMinutes: 75, tags: [], addedBy: "Jo" },
    { gathered: new Set(), done: new Set(), tab: "ingredients" },
  );
  assert.match(titleOnly, /<a [^>]*href="\/recipes\/banana-bread\/edit"[^>]*>Add ingredients<\/a>/);
  assert.match(titleOnly, /<a [^>]*href="\/recipes\/banana-bread\/edit"[^>]*>Add steps<\/a>/);
  assert.ok(titleOnly.includes("Banana bread"));
});

test("done steps are marked done and the next one is marked Now", () => {
  const [first, second, third] = steps(renderRecipePage(tacos, view({ done: new Set([0]) })));
  assert.match(first, /class="step done"/);
  assert.ok(!first.includes("Now"));
  assert.match(second, /class="step now"/);
  assert.ok(second.includes("Now"));
  assert.match(third, /class="step"/);
  assert.ok(!third.includes("Now"));
});

test("doubling servings doubles structured amounts and leaves free text alone", () => {
  const html = renderRecipePage(tacos, view({ servings: 8 }));
  assert.ok(html.includes("4 cans black beans, drained and rinsed"));
  assert.ok(html.includes("1 tsp smoked paprika"));
  assert.ok(html.includes("16 corn tortillas"));
  assert.ok(html.includes("salt to taste"));
  assert.ok(html.includes("8 servings"));
});

test("gathered ingredients are checked and counted", () => {
  const html = renderRecipePage(tacos, view({ gathered: new Set([1, 3]) }));
  assert.equal(count(html, /<input [^>]*checked/g), 2);
  assert.ok(html.includes("2 of 4 gathered"));
});

test("title with <script> is escaped", () => {
  const html = renderRecipePage({ ...tacos, title: '<script>alert("x")</script>' }, view());
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"));
});

test("not found has one primary Back to recipes; the full page has no primary button", () => {
  const notFound = renderRecipeNotFound();
  assert.equal(count(notFound, /class="btn primary"/g), 1);
  assert.match(notFound, /<a class="btn primary" href="\/">Back to recipes<\/a>/);
  assert.equal(count(renderRecipePage(tacos, view()), /btn primary/g), 0);
});

test("loading announces itself and error offers Try again", () => {
  assert.match(renderRecipeLoading(), /role="status"/);
  const error = renderRecipeError();
  assert.match(error, /role="alert"/);
  assert.match(error, /<button [^>]*class="btn retry"[^>]*>Try again<\/button>/);
});

const tabText = (html, value) =>
  html.match(new RegExp(`<button [^>]*data-tab="${value}"[^>]*>([\\s\\S]*?)</button>`))[1].replace(/<[^>]+>/g, "");

test("phone tabs show how many ingredients are gathered and steps done", () => {
  const eleven = Array.from({ length: 11 }, (_, i) => ({ amount: 1, unit: null, item: `item ${i}`, note: null }));
  const five = ["One.", "Two.", "Three.", "Four.", "Five."];
  const html = renderRecipePage(
    { ...tacos, ingredients: eleven, steps: five },
    view({ gathered: new Set([0, 4]), done: new Set([0]) }),
  );
  assert.equal(tabText(html, "ingredients"), "Ingredients 2/11");
  assert.equal(tabText(html, "steps"), "Steps 1/5");
});

test("phone tabs show zero progress when nothing is ticked", () => {
  const html = renderRecipePage(tacos, view());
  assert.equal(tabText(html, "ingredients"), "Ingredients 0/4");
  assert.equal(tabText(html, "steps"), "Steps 0/3");
});

test("phone tabs show no progress for an empty section", () => {
  const html = renderRecipePage({ ...tacos, ingredients: [], steps: [] }, view());
  assert.equal(tabText(html, "ingredients"), "Ingredients");
  assert.equal(tabText(html, "steps"), "Steps");
  assert.ok(!html.includes("0/0"));
});
