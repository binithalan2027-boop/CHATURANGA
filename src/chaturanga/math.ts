export type Difficulty = "easy" | "medium" | "hard";
export interface Question {
  id: number;
  text: string;
  answer: number;
}
export function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
export function questions(
  seed: number,
  difficulty: Difficulty,
  count = 5,
): Question[] {
  const rng = random(seed),
    pick = (min: number, max: number) =>
      min + Math.floor(rng() * (max - min + 1));
  const out: Question[] = [],
    seen = new Set<string>();
  while (out.length < count) {
    const kind = pick(0, 4);
    let text: string, answer: number;
    if (difficulty === "hard") {
      const a = pick(12, 25),
        b = pick(12, 29),
        c = pick(2, 9);
      if (kind === 0) {
        text = `${a}²`;
        answer = a * a;
      } else if (kind === 1) {
        text = `(${a} + ${b}) × ${c}`;
        answer = (a + b) * c;
      } else if (kind === 2) {
        text = `${a * b} ÷ ${a}`;
        answer = b;
      } else {
        text = `${a} × ${b}`;
        answer = a * b;
      }
    } else {
      const a = pick(10, difficulty === "easy" ? 50 : 99),
        b = pick(10, difficulty === "easy" ? 49 : 99);
      if (kind === 0) {
        text = `${a} + ${b}`;
        answer = a + b;
      } else if (kind === 1) {
        text = `${Math.max(a, b)} − ${Math.min(a, b)}`;
        answer = Math.abs(a - b);
      } else if (kind === 2) {
        const c = pick(2, 12),
          d = pick(2, 12);
        text = `${c * d} ÷ ${c}`;
        answer = d;
      } else if (kind === 3 || difficulty === "easy") {
        const c = pick(2, 9),
          d = difficulty === "easy" ? pick(2, 12) : a;
        text = `${d} × ${c}`;
        answer = d * c;
      } else {
        const p = [10, 20, 25, 50][pick(0, 3)],
          n = pick(1, 20) * 20;
        text = `${p}% of ${n}`;
        answer = (p * n) / 100;
      }
    }
    if (!seen.has(text)) {
      seen.add(text);
      out.push({ id: seed + out.length, text, answer });
    }
  }
  return out;
}
export function parseAnswer(raw: string): number | null {
  const normalized = raw
    .trim()
    .replace(/[०-९]/g, (ch) => String(ch.charCodeAt(0) - 0x0966));
  if (!/^[+]?\d{1,9}$/.test(normalized)) return null;
  return Number(normalized);
}
export interface DuelScore {
  correct: number;
  wrong: number;
  completed: boolean;
  elapsed: number;
}
export function duelWinner(w: DuelScore, b: DuelScore): "w" | "b" | null {
  if (!w.correct && !b.correct) return null;
  if (w.correct !== b.correct) return w.correct > b.correct ? "w" : "b";
  if (w.wrong !== b.wrong) return w.wrong < b.wrong ? "w" : "b";
  if (w.completed && b.completed && Math.abs(w.elapsed - b.elapsed) >= 300)
    return w.elapsed < b.elapsed ? "w" : "b";
  return null;
}
