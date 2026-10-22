// Pure helpers for the recipe list: sorting, title search and time labels.
// Shared by the browser page and node --test; never mutates its input.

export const SORT_OPTIONS = [
  { value: "recent", label: "Recently added", hint: "Newest first" },
  { value: "az", label: "A–Z", hint: "By title" },
  { value: "quickest", label: "Quickest", hint: "Shortest total time first" },
];

const byTitle = (a, b) =>
  a.title.localeCompare(b.title, undefined, { sensitivity: "base" });

const COMPARATORS = {
  recent: (a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt),
  az: byTitle,
  quickest: (a, b) => a.totalMinutes - b.totalMinutes || byTitle(a, b),
};

export function sortRecipes(recipes, mode) {
  const compare = COMPARATORS[mode] ?? COMPARATORS.recent;
  return [...recipes].sort(compare);
}

export function filterByTitle(recipes, query) {
  const needle = (query ?? "").trim().toLowerCase();
  if (!needle) return [...recipes];
  return recipes.filter((r) => r.title.toLowerCase().includes(needle));
}

export function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}
