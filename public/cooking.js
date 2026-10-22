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
