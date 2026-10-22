// String renderers for the recipe list. Every piece of data is HTML-escaped
// before it reaches the markup, so these are safe to assign to innerHTML.

import { SORT_OPTIONS, formatTime } from "./recipes.js";

const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

// Muted avatar tones, never red (style guide: Household).
const AVATAR_TONES = 4;

function avatarTone(name) {
  let sum = 0;
  for (const c of String(name ?? "")) sum += c.codePointAt(0);
  return sum % AVATAR_TONES;
}

function joinNames(names) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
}

export function renderHeader(household) {
  const members = household.members ?? [];
  return `<header class="page-header">
  <div>
    <h1>${escapeHtml(household.name)}</h1>
    ${members.length ? `<p class="meta-text">Shared by ${escapeHtml(joinNames(members))}</p>` : ""}
  </div>
  <a class="btn primary add-header" href="/recipes/new">+ Add recipe</a>
</header>`;
}

export function renderCard(recipe) {
  const initial = String(recipe.addedBy ?? "?").charAt(0).toUpperCase() || "?";
  const photo = recipe.photoUrl
    ? `<img src="${escapeHtml(recipe.photoUrl)}" alt="" loading="lazy" />`
    : `<span class="placeholder-icon" aria-hidden="true">🍽</span>`;
  const chips = (recipe.tags ?? [])
    .map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`)
    .join("");
  return `<a class="card" href="/recipes/${encodeURIComponent(recipe.id)}">
  <div class="photo${recipe.photoUrl ? "" : " placeholder"}">
    ${photo}
    <span class="avatar tone-${avatarTone(recipe.addedBy)}" title="Added by ${escapeHtml(recipe.addedBy)}">${escapeHtml(initial)}</span>
  </div>
  <div class="card-body">
    <h3 class="card-title">${escapeHtml(recipe.title)}</h3>
    <p class="meta-text">${escapeHtml(formatTime(recipe.totalMinutes))}</p>
    ${chips ? `<div class="chips">${chips}</div>` : ""}
  </div>
</a>`;
}

export function renderGrid(recipes) {
  const items = recipes.map((r) => `<li>${renderCard(r)}</li>`).join("\n");
  return `<ul class="grid" role="list">\n${items}\n</ul>`;
}

export function countLabel(shown, total) {
  if (shown === total) return `${total} ${total === 1 ? "recipe" : "recipes"}`;
  return `${shown} of ${total}`;
}

export function renderSortMenu(current) {
  const selected = SORT_OPTIONS.find((o) => o.value === current) ?? SORT_OPTIONS[0];
  const items = SORT_OPTIONS.map((option) => {
    const on = option.value === selected.value;
    return `<button type="button" class="sort-option" role="menuitemradio" aria-checked="${on}" data-sort="${escapeHtml(option.value)}" tabindex="-1">
      <span class="sort-text"><span class="sort-label">${escapeHtml(option.label)}</span><span class="meta-text">${escapeHtml(option.hint)}</span></span>
      ${on ? `<span class="check" aria-hidden="true">✓</span>` : ""}
    </button>`;
  }).join("\n    ");
  return `<div class="sort">
  <button type="button" class="btn sort-pill" aria-haspopup="menu" aria-expanded="false" aria-controls="sort-menu">Sort: ${escapeHtml(selected.label)} ▾</button>
  <div class="sort-menu" id="sort-menu" role="menu" aria-label="Sort recipes" hidden>
    ${items}
  </div>
</div>`;
}
