// String renderers for the recipe page and its states. Every piece of data is
// HTML-escaped before it reaches the markup, so these are safe for innerHTML.
// view = { servings, gathered: Set<ingredient index>, done: Set<step index>, tab }

import { escapeHtml } from "./render.js";
import { formatTime } from "./recipes.js";
import { gatheredLabel, ingredientLine, nextStepIndex } from "./cooking.js";

const editHref = (recipe) => `/recipes/${encodeURIComponent(recipe.id)}/edit`;

function renderActions(recipe) {
  return `<a class="btn back" href="/">← Back</a>
    <a class="btn edit" href="${escapeHtml(editHref(recipe))}">Edit</a>`;
}

// Back + Edit sit on the photo; with no photo the hero is dropped for a plain bar.
function renderTop(recipe) {
  if (!recipe.photoUrl) {
    return `<div class="recipe-bar">
    ${renderActions(recipe)}
  </div>`;
  }
  return `<div class="hero">
    <img src="${escapeHtml(recipe.photoUrl)}" alt="" />
    <div class="hero-actions">
    ${renderActions(recipe)}
    </div>
  </div>`;
}

function renderHead(recipe) {
  const meta = [];
  if (recipe.totalMinutes != null) meta.push(formatTime(recipe.totalMinutes));
  if (recipe.addedBy) meta.push(`Added by ${recipe.addedBy}`);
  const chips = (recipe.tags ?? [])
    .map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`)
    .join("");
  return `<header class="recipe-head">
    <h1>${escapeHtml(recipe.title)}</h1>
    ${meta.length ? `<p class="meta-text">${escapeHtml(meta.join(" · "))}</p>` : ""}
    ${chips ? `<div class="chips">${chips}</div>` : ""}
  </header>`;
}

function renderTabs(tab) {
  const button = (value, label) =>
    `<button type="button" class="tab" role="tab" aria-selected="${tab === value}" aria-controls="panel-${value}" data-tab="${value}">${label}</button>`;
  return `<div class="tabs" role="tablist" aria-label="Recipe sections">
    ${button("ingredients", "Ingredients")}
    ${button("steps", "Steps")}
  </div>`;
}

function renderAddPrompt(recipe, label) {
  return `<div class="add-prompt">
      <a class="btn" href="${escapeHtml(editHref(recipe))}">${label}</a>
    </div>`;
}

function renderStepper(servings) {
  return `<div class="servings" role="group" aria-label="Servings">
      <button type="button" class="btn stepper" data-servings="-1" aria-label="Fewer servings"${servings <= 1 ? " disabled" : ""}>−</button>
      <span class="servings-count" aria-live="polite">${escapeHtml(`${servings} ${servings === 1 ? "serving" : "servings"}`)}</span>
      <button type="button" class="btn stepper" data-servings="1" aria-label="More servings">+</button>
    </div>`;
}

function renderIngredients(recipe, view) {
  const ingredients = recipe.ingredients ?? [];
  const head = `<h2>Ingredients</h2>`;
  if (!ingredients.length) {
    return `<section class="ingredients" id="panel-ingredients" role="tabpanel">
    ${head}
    ${renderAddPrompt(recipe, "Add ingredients")}
  </section>`;
  }
  const base = recipe.servings ?? 1;
  const servings = view.servings ?? base;
  const gathered = view.gathered ?? new Set();
  const rows = ingredients.map((ingredient, i) => {
    const on = gathered.has(i);
    return `<li class="ingredient-row${on ? " gathered" : ""}">
        <label><input type="checkbox" data-ingredient="${i}"${on ? " checked" : ""} /> <span>${escapeHtml(ingredientLine(ingredient, base, servings))}</span></label>
      </li>`;
  }).join("\n      ");
  const ticked = ingredients.filter((_, i) => gathered.has(i)).length;
  return `<section class="ingredients" id="panel-ingredients" role="tabpanel">
    <div class="section-head">
      ${head}
      ${renderStepper(servings)}
    </div>
    <ul class="ingredient-list" role="list">
      ${rows}
    </ul>
    <div class="gathered-bar">
      <span class="meta-text">${escapeHtml(gatheredLabel(ticked, ingredients.length))}</span>
      <button type="button" class="btn clear-checks"${ticked ? "" : " disabled"}>Clear checks</button>
    </div>
    <button type="button" class="btn go-steps" data-tab="steps">Go to steps</button>
  </section>`;
}

function renderSteps(recipe, view) {
  const steps = recipe.steps ?? [];
  const head = `<h2>Steps</h2>`;
  if (!steps.length) {
    return `<section class="steps" id="panel-steps" role="tabpanel">
    ${head}
    ${renderAddPrompt(recipe, "Add steps")}
  </section>`;
  }
  const done = view.done ?? new Set();
  const now = nextStepIndex(done, steps.length);
  const items = steps.map((step, i) => {
    const state = done.has(i) ? " done" : i === now ? " now" : "";
    return `<li class="step${state}">
        <button type="button" class="step-toggle" data-step="${i}" aria-pressed="${done.has(i)}">
          <span class="step-num" aria-hidden="true">${done.has(i) ? "✓" : i + 1}</span>
          <span class="step-text">${escapeHtml(step)}</span>
          ${i === now ? `<span class="now-mark">Now</span>` : ""}
        </button>
      </li>`;
  }).join("\n      ");
  return `<section class="steps" id="panel-steps" role="tabpanel">
    ${head}
    <ol class="step-list" role="list">
      ${items}
    </ol>
  </section>`;
}

export function renderRecipePage(recipe, view = {}) {
  const tab = view.tab === "steps" ? "steps" : "ingredients";
  return `<article class="recipe" data-tab="${tab}">
  ${renderTop(recipe)}
  ${renderHead(recipe)}
  ${renderTabs(tab)}
  <div class="recipe-body">
  ${renderIngredients(recipe, view)}
  ${renderSteps(recipe, view)}
  </div>
</article>`;
}

export function renderRecipeLoading() {
  return `<p class="visually-hidden" role="status">Loading recipe…</p>
<div class="recipe skeleton" aria-hidden="true">
  <div class="hero"></div>
  <span class="skeleton-line"></span>
  <span class="skeleton-line short"></span>
  <span class="skeleton-line"></span>
  <span class="skeleton-line"></span>
</div>`;
}

export function renderRecipeNotFound() {
  return `<div class="state not-found">
  <span class="state-icon" aria-hidden="true">🍽</span>
  <h3>Recipe not found</h3>
  <p class="meta-text">It may have been removed, or the link is wrong.</p>
  <a class="btn primary" href="/">Back to recipes</a>
</div>`;
}

export function renderRecipeError() {
  return `<div class="state error" role="alert">
  <span class="state-icon error-icon" aria-hidden="true">!</span>
  <h3>Couldn't load this recipe</h3>
  <p class="meta-text">Check your connection. Your recipes are safe.</p>
  <button type="button" class="btn retry">Try again</button>
</div>`;
}
