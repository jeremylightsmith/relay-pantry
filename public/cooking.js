// Pure helpers for cooking from a recipe: scaling, amount display and
// progress through ingredients and steps. Shared by the page and node --test.

const FRACTIONS = [
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [1 / 2, "½"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
];

const TOLERANCE = 0.01;

export function scaleAmount(amount, from, to) {
  return (amount * to) / from;
}

export function formatAmount(n) {
  const whole = Math.floor(n);
  const part = n - whole;
  if (part < TOLERANCE) return String(whole);
  if (1 - part < TOLERANCE) return String(whole + 1);
  const match = FRACTIONS.find(([value]) => Math.abs(part - value) < TOLERANCE);
  if (match) return whole === 0 ? match[1] : `${whole}${match[1]}`;
  return String(Math.round(n * 10) / 10);
}

export function ingredientLine(ingredient, from, to) {
  if (ingredient.text != null) return ingredient.text;
  const { amount, unit, item, note } = ingredient;
  const parts = [];
  if (amount != null) parts.push(formatAmount(scaleAmount(amount, from, to)));
  if (unit) parts.push(unit);
  parts.push(item);
  const line = parts.join(" ");
  return note ? `${line}, ${note}` : line;
}

export function nextStepIndex(doneSet, total) {
  for (let i = 0; i < total; i++) {
    if (!doneSet.has(i)) return i;
  }
  return -1;
}

export function gatheredLabel(n, total) {
  return `${n} of ${total} gathered`;
}

function toggle(set, index) {
  const next = new Set(set);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  return next;
}

// The recipe page's cooking state: view = { servings, gathered, done, tab }.
// Returns a new view; the one given is left untouched.
export function reduce(view, action) {
  switch (action.type) {
    case "toggle-ingredient":
      return { ...view, gathered: toggle(view.gathered, action.index) };
    case "clear-checks":
      return { ...view, gathered: new Set() };
    case "toggle-step":
      return { ...view, done: toggle(view.done, action.index) };
    case "servings-down":
      return { ...view, servings: Math.max(1, view.servings - 1) };
    case "servings-up":
      return { ...view, servings: view.servings + 1 };
    case "tab":
      return { ...view, tab: action.tab };
    case "go-to-steps":
      return { ...view, tab: "steps" };
    default:
      return view;
  }
}
