// Recipe page: reads the id from /recipes/:id, fetches the recipe and renders
// it, with the loading, not-found and couldn't-load states. Tick-offs, done
// steps, servings and the open tab live in memory only; a reload starts fresh.

import { reduce } from "./cooking.js";
import {
  renderRecipeError,
  renderRecipeLoading,
  renderRecipeNotFound,
  renderRecipePage,
} from "./recipe-render.js";

const app = document.getElementById("app");
const id = decodeURIComponent(location.pathname.split("/")[2] ?? "");

let recipe = null;
let view = null;

// Controls are rebuilt on every render, so focus is carried over by the
// data attribute that names the control.
const FOCUS_KEYS = ["ingredient", "step", "servings", "tab"];

function focusKey(el) {
  if (!el || !app.contains(el)) return null;
  if (el.classList.contains("clear-checks")) return ".clear-checks";
  const key = FOCUS_KEYS.find((k) => el.dataset[k] != null);
  return key ? `[data-${key}="${el.dataset[key]}"]` : null;
}

function render() {
  const key = focusKey(document.activeElement);
  app.innerHTML = renderRecipePage(recipe, view);
  if (key) app.querySelector(key)?.focus();
}

function dispatch(action) {
  view = reduce(view, action);
  render();
}

app.addEventListener("change", (event) => {
  const index = event.target.dataset.ingredient;
  if (index != null) dispatch({ type: "toggle-ingredient", index: Number(index) });
});

app.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.classList.contains("retry")) return load();
  if (!recipe) return;
  if (target.classList.contains("clear-checks")) dispatch({ type: "clear-checks" });
  else if (target.classList.contains("go-steps")) {
    dispatch({ type: "go-to-steps" });
    app.querySelector('.tab[data-tab="steps"]')?.focus();
  } else if (target.dataset.tab) dispatch({ type: "tab", tab: target.dataset.tab });
  else if (target.dataset.step != null) dispatch({ type: "toggle-step", index: Number(target.dataset.step) });
  else if (target.dataset.servings) {
    dispatch({ type: Number(target.dataset.servings) < 0 ? "servings-down" : "servings-up" });
  }
});

async function load() {
  recipe = null;
  app.innerHTML = renderRecipeLoading();
  try {
    const res = await fetch(`/api/recipes/${encodeURIComponent(id)}`);
    if (res.status === 404) {
      document.title = "Recipe not found";
      app.innerHTML = renderRecipeNotFound();
      return;
    }
    if (!res.ok) throw new Error(`GET /api/recipes/${id}: ${res.status}`);
    ({ recipe } = await res.json());
  } catch {
    recipe = null;
    app.innerHTML = renderRecipeError();
    app.querySelector(".retry")?.focus();
    return;
  }
  view = { servings: recipe.servings ?? 1, gathered: new Set(), done: new Set(), tab: "ingredients" };
  document.title = recipe.title;
  render();
}

load();
