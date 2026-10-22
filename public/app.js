// Recipe list page: fetches the household's recipes and renders the grid.

import { sortRecipes } from "./recipes.js";
import { renderGrid, renderHeader } from "./render.js";

const app = document.getElementById("app");

function render({ household, recipes }) {
  const sorted = sortRecipes(recipes, "recent");
  const count = `${sorted.length} ${sorted.length === 1 ? "recipe" : "recipes"}`;
  app.innerHTML = `${renderHeader(household)}
<section class="list" aria-labelledby="list-title">
  <div class="list-head">
    <h2 id="list-title">Recipes</h2>
    <span class="meta-text count">${count}</span>
  </div>
  <div class="filters-slot" aria-hidden="true"></div>
  ${renderGrid(sorted)}
</section>
<a class="fab" href="/recipes/new" aria-label="Add recipe">+</a>`;
}

async function load() {
  const res = await fetch("/api/recipes");
  if (!res.ok) throw new Error(`GET /api/recipes: ${res.status}`);
  render(await res.json());
}

load();
