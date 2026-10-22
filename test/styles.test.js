import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const COLOURS = {
  "--bg": "#FFFFFF",
  "--ink": "#1F1F23",
  "--muted": "#62626B",
  "--line": "#E7E7EA",
  "--accent": "#D7372B",
  "--accent-soft": "#FCE9E7",
  "--danger": "#B3261E",
};

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("styles.css defines every colour token with its style-guide hex", () => {
  const css = read("../public/styles.css");
  for (const [token, hex] of Object.entries(COLOURS)) {
    assert.match(css, new RegExp(`${escape(token)}\\s*:\\s*${hex}\\b`, "i"), token);
  }
});

test("styles.css sets 3 grid columns at 720px and 4 at 1080px", () => {
  const css = read("../public/styles.css");
  for (const [width, cols] of [[720, 3], [1080, 4]]) {
    const block = css.match(
      new RegExp(`@media\\s*\\(min-width:\\s*${width}px\\)\\s*\\{([\\s\\S]*?)\\n\\}`),
    );
    assert.ok(block, `no @media (min-width: ${width}px) block`);
    assert.match(
      block[1],
      new RegExp(`\\.grid\\s*\\{[^}]*grid-template-columns:\\s*repeat\\(${cols},`),
      `${width}px should set ${cols} columns`,
    );
  }
});

test("docs/style-guide.md lists all seven colour tokens", () => {
  const doc = read("../docs/style-guide.md");
  for (const [token, hex] of Object.entries(COLOURS)) {
    assert.ok(doc.includes(`\`${token}\``), `${token} missing`);
    assert.ok(doc.includes(hex), `${hex} missing`);
  }
});

// Crude CSS reading for the recipe page: rules as { selectors, body }, the
// contents of every @media block for one query, and var() resolved from :root.
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

function rules(css) {
  const out = [];
  for (const [, selectors, body] of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    out.push({ selectors: selectors.split(",").map((s) => s.trim()), body });
  }
  return out;
}

function mediaBlocks(css, minWidth) {
  const text = stripComments(css);
  const blocks = [];
  const head = new RegExp(`@media\\s*\\(min-width:\\s*${minWidth}px\\)\\s*\\{`, "g");
  for (const match of text.matchAll(head)) {
    let depth = 1;
    let i = match.index + match[0].length;
    const start = i;
    while (depth && i < text.length) {
      if (text[i] === "{") depth++;
      if (text[i] === "}") depth--;
      i++;
    }
    blocks.push(text.slice(start, i - 1));
  }
  return blocks.join("\n");
}

function declarations(css, selector, property) {
  const values = [];
  for (const rule of rules(css)) {
    if (!rule.selectors.includes(selector)) continue;
    for (const [, prop, value] of rule.body.matchAll(/([\w-]+)\s*:\s*([^;]+)/g)) {
      if (prop === property) values.push(value.trim());
    }
  }
  return values;
}

function resolve(css, value) {
  return value.replace(/var\((--[\w-]+)\)/g, (whole, token) => {
    const found = stripComments(css).match(new RegExp(`${escape(token)}\\s*:\\s*([^;]+);`));
    return found ? resolve(css, found[1].trim()) : whole;
  });
}

const fontSizes = (css, selector) =>
  [...declarations(css, selector, "font"), ...declarations(css, selector, "font-size")]
    .map((value) => resolve(css, value).match(/(\d+(?:\.\d+)?)px/)?.[1])
    .filter(Boolean)
    .map(Number);

test("styles.css: ingredient text 17px and step text 18px", () => {
  const css = read("../public/styles.css");
  assert.ok(fontSizes(css, ".ingredient-row").includes(17), ".ingredient-row should be 17px");
  assert.ok(fontSizes(css, ".step-toggle").includes(18), ".step-toggle should be 18px");
  const stepFont = declarations(css, ".step-toggle", "font").map((v) => resolve(css, v));
  assert.ok(stepFont.some((v) => /18px\s*\/\s*1\.6\b/.test(v)), "step line height 1.6");
});

test("styles.css: ingredient and step rows have min-height ≥ 52px", () => {
  const css = read("../public/styles.css");
  for (const selector of [".ingredient-row label", ".step-toggle"]) {
    const heights = declarations(css, selector, "min-height")
      .map((value) => Number(resolve(css, value).match(/(\d+)px/)?.[1]));
    assert.ok(heights.some((h) => h >= 52), `${selector} min-height ≥ 52px`);
  }
});

test("styles.css: a 720px media block lays ingredients and steps side by side and hides the tabs", () => {
  const css = read("../public/styles.css");
  const wide = mediaBlocks(css, 720);
  const columns = declarations(wide, ".recipe-body", "grid-template-columns");
  assert.ok(columns.some((v) => v.split(/\s+(?![^(]*\))/).length === 2), ".recipe-body has two columns");
  assert.ok(declarations(wide, ".tabs", "display").includes("none"), ".tabs hidden");
  for (const panel of [".ingredients", ".steps"]) {
    const shown = rules(wide).some((r) =>
      r.selectors.some((s) => s.endsWith(panel)) && /display\s*:\s*block/.test(r.body));
    assert.ok(shown, `${panel} shown whatever the tab`);
  }
  assert.ok(declarations(wide, ".ingredients", "position").includes("sticky"), "ingredients sticky");
});
