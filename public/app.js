// Recipe list page: fetches the household's recipes and renders the grid,
// with a title search and a sort menu, plus the loading, error, empty and
// no-results states.

import { filterByTitle, sortRecipes } from "./recipes.js";
import {
  countLabel,
  renderEmpty,
  renderError,
  renderGrid,
  renderHeader,
  renderLoading,
  renderNoResults,
  renderSortMenu,
  viewState,
} from "./render.js";

const app = document.getElementById("app");

const state = { household: null, recipes: [], query: "", sort: "recent", loading: true, error: null };

function renderShell(household) {
  app.innerHTML = `${renderHeader(household)}
<section class="list" aria-labelledby="list-title">
  <div class="list-head">
    <h2 id="list-title">Recipes</h2>
    <span class="meta-text count" aria-live="polite"></span>
  </div>
  <div class="toolbar">
    <label class="search">
      <span class="search-icon" aria-hidden="true">⌕</span>
      <input type="search" placeholder="Search recipes" aria-label="Search recipes by title" autocomplete="off" />
    </label>
    <div class="filters-slot" aria-hidden="true"></div>
    ${renderSortMenu(state.sort)}
  </div>
  <div class="results"></div>
</section>
<a class="fab" href="/recipes/new" aria-label="Add recipe">+</a>`;

  app.querySelector(".search input").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderResults();
  });
  bindSortMenu();
}

// Before the first successful load there is no household to head the page,
// so loading and error show in a bare results area.
function renderBareShell() {
  app.innerHTML = `<section class="list"><div class="results"></div></section>`;
}

function renderResults() {
  const shown = sortRecipes(filterByTitle(state.recipes, state.query), state.sort);
  const total = state.recipes.length;
  const view = viewState({ loading: state.loading, error: state.error, total, shown: shown.length });
  app.dataset.view = view;

  const count = app.querySelector(".count");
  if (count) count.textContent = view === "list" || view === "no-results" ? countLabel(shown.length, total) : "";

  const results = app.querySelector(".results");
  if (view === "loading") results.innerHTML = renderLoading();
  else if (view === "error") results.innerHTML = renderError();
  else if (view === "empty") results.innerHTML = renderEmpty();
  else if (view === "no-results") results.innerHTML = renderNoResults(state.query.trim());
  else results.innerHTML = renderGrid(shown);

  results.querySelector(".retry")?.addEventListener("click", load);
  results.querySelector(".clear-search")?.addEventListener("click", clearSearch);
}

function clearSearch() {
  const input = app.querySelector(".search input");
  input.value = "";
  state.query = "";
  renderResults();
  input.focus();
}

// Sort menu: opens from the pill, closes on choose, outside click or Escape.
// Arrow keys move between options; focus returns to the pill on close.

function bindSortMenu() {
  const sort = app.querySelector(".sort");
  const pill = sort.querySelector(".sort-pill");
  const menu = sort.querySelector(".sort-menu");
  const options = [...menu.querySelectorAll(".sort-option")];

  const isOpen = () => !menu.hidden;

  function open(focusIndex) {
    menu.hidden = false;
    pill.setAttribute("aria-expanded", "true");
    const current = options.findIndex((o) => o.getAttribute("aria-checked") === "true");
    options[focusIndex ?? Math.max(current, 0)].focus();
    document.addEventListener("pointerdown", onOutside);
  }

  function close({ refocus = true } = {}) {
    menu.hidden = true;
    pill.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", onOutside);
    if (refocus) pill.focus();
  }

  function onOutside(event) {
    if (!sort.contains(event.target)) close({ refocus: false });
  }

  function choose(value) {
    close({ refocus: false });
    state.sort = value;
    sort.outerHTML = renderSortMenu(state.sort);
    bindSortMenu();
    app.querySelector(".sort-pill").focus();
    renderResults();
  }

  pill.addEventListener("click", () => (isOpen() ? close() : open()));
  pill.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      open(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      open(options.length - 1);
    }
  });

  menu.addEventListener("click", (event) => {
    const option = event.target.closest(".sort-option");
    if (option) choose(option.dataset.sort);
  });

  menu.addEventListener("keydown", (event) => {
    const index = options.indexOf(document.activeElement);
    const move = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (move) {
      event.preventDefault();
      options[(index + move + options.length) % options.length].focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      options[0].focus();
    } else if (event.key === "End") {
      event.preventDefault();
      options.at(-1).focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      close({ refocus: false });
    }
  });
}

async function load() {
  state.loading = true;
  state.error = null;
  if (!state.household) renderBareShell();
  renderResults();
  try {
    const res = await fetch("/api/recipes");
    if (!res.ok) throw new Error(`GET /api/recipes: ${res.status}`);
    const { household, recipes } = await res.json();
    state.recipes = recipes;
    if (!state.household) renderShell(household);
    state.household = household;
  } catch (error) {
    state.error = error;
  }
  state.loading = false;
  renderResults();
}

load();
