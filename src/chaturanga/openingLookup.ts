import data from "./data/eco.json";
export function findOpening(fens: string[]) {
  for (let i = fens.length - 1; i >= 0; i--) {
    const key = fens[i].split(" ").slice(0, 4).join(" ");
    const hit = data.find((o) => o.key === key);
    if (hit) return hit;
  }
  return null;
}
