// util interne: pick pondéré par "weight"
export default function pickWeighted<T extends { weight: number }>(
  items: T[]
): T {
  const total = items.reduce((s, it) => s + (it.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight ?? 1;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}
