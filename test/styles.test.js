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
