import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countLabel,
  renderCard,
  renderGrid,
  renderEmpty,
  renderError,
  renderHeader,
  renderNoResults,
  renderSortMenu,
  viewState,
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

test("viewState picks loading, error, empty, no-results or list", () => {
  assert.equal(viewState({ loading: true, error: null, total: 0, shown: 0 }), "loading");
  assert.equal(viewState({ loading: false, error: new Error("x"), total: 0, shown: 0 }), "error");
  assert.equal(viewState({ loading: false, error: null, total: 0, shown: 0 }), "empty");
  assert.equal(viewState({ loading: false, error: null, total: 5, shown: 0 }), "no-results");
  assert.equal(viewState({ loading: false, error: null, total: 5, shown: 2 }), "list");
});

test("renderNoResults names the query and offers Clear search", () => {
  const html = renderNoResults("lasagne");
  assert.ok(html.includes("No recipes called “lasagne”"));
  assert.match(html, /<button[^>]*>\s*Clear search\s*<\/button>/);
});

test("renderNoResults escapes the query", () => {
  const html = renderNoResults('<img src=x onerror="alert(1)">');
  assert.ok(!html.includes("<img"));
  assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
});

test("renderEmpty has exactly one primary button: Add your first recipe", () => {
  const html = renderEmpty();
  const primaries = html.match(/<(a|button)[^>]*class="btn primary[^"]*"[^>]*>[\s\S]*?<\/\1>/g) ?? [];
  assert.equal(primaries.length, 1);
  assert.ok(primaries[0].includes("Add your first recipe"));
  assert.ok(html.includes("Your kitchen's cookbook starts here") || html.includes("Your kitchen&#39;s cookbook starts here"));
});

test("renderError shows an icon and a Try again button", () => {
  const html = renderError();
  assert.ok(html.includes("Couldn"));
  assert.match(html, /class="state-icon[^"]*"/);
  assert.match(html, /<button[^>]*>\s*Try again\s*<\/button>/);
});
