import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countLabel,
  renderCard,
  renderGrid,
  renderHeader,
  renderSortMenu,
} from "../public/render.js";

const tacos = {
  id: "black-bean-tacos",
  title: "Black bean tacos",
  photoUrl: "https://example.com/tacos.jpg",
  totalMinutes: 25,
  tags: ["Vegetarian", "Weeknight"],
  addedBy: "Maya",
  addedAt: "2026-10-18T18:30:00Z",
};

const count = (html, pattern) => (html.match(pattern) ?? []).length;

test("renderCard shows title, time, one chip per tag, initial and link", () => {
  const html = renderCard(tacos);
  assert.ok(html.includes("Black bean tacos"));
  assert.ok(html.includes("25 min"));
  assert.equal(count(html, /class="chip"/g), 2);
  assert.ok(html.includes("Vegetarian"));
  assert.ok(html.includes("Weeknight"));
  assert.match(html, /class="avatar[^"]*"[^>]*>M</);
  assert.ok(html.includes('href="/recipes/black-bean-tacos"'));
  assert.match(html, /<img [^>]*src="https:\/\/example\.com\/tacos\.jpg"/);
});

test("renderCard with no photo shows a placeholder and no <img>", () => {
  const html = renderCard({ ...tacos, photoUrl: null });
  assert.ok(html.includes('class="photo placeholder"'));
  assert.ok(!html.includes("<img"));
});

test("renderCard escapes HTML in the title", () => {
  const html = renderCard({ ...tacos, title: '<script>alert("x")</script>' });
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"));
});

test("renderHeader shows the household name and its members", () => {
  const html = renderHeader({
    name: "Pine Street Kitchen",
    members: ["Maya", "Sam", "Jo", "Alex"],
  });
  assert.ok(html.includes("Pine Street Kitchen"));
  assert.ok(html.includes("Shared by Maya, Sam, Jo &amp; Alex"));
  assert.ok(html.includes('href="/recipes/new"'));
});

test("renderGrid renders one card per recipe", () => {
  const html = renderGrid([tacos, { ...tacos, id: "other" }]);
  assert.match(html, /^<ul class="grid"/);
  assert.equal(count(html, /<li/g), 2);
});

test("renderSortMenu checks only the current option and names it on the pill", () => {
  const html = renderSortMenu("az");
  const options = html.match(/<button[^>]*role="menuitemradio"[\s\S]*?<\/button>/g) ?? [];
  assert.equal(options.length, 3);
  const checked = options.filter((o) => o.includes('aria-checked="true"'));
  assert.equal(checked.length, 1);
  assert.ok(checked[0].includes("A–Z"));
  assert.equal(count(html, /class="check"/g), 1);
  assert.ok(checked[0].includes('class="check"'));
  assert.match(html, /class="btn sort-pill"[^>]*>\s*Sort: A–Z ▾\s*</);
});

test("countLabel gives the total, or shown of total while searching", () => {
  assert.equal(countLabel(24, 24), "24 recipes");
  assert.equal(countLabel(3, 24), "3 of 24");
  assert.equal(countLabel(1, 1), "1 recipe");
});
