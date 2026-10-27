export type SpeedDuelDifficulty = "easy" | "medium" | "hard";
export type SpeedDuelDuration = 30 | 60 | 120;
export type MathOperator = "+" | "-" | "×" | "÷";

export interface MathQuestion {
  id: string;
  operandA: number;
  operandB: number;
  operator: MathOperator;
  answer: number;
  prompt: string;
}

export interface MissedQuestion {
  question: MathQuestion;
  entered: string;
}

export interface SpeedDuelResult {
  durationSeconds: number;
  difficulty: SpeedDuelDifficulty;
  correct: number;
  errors: number;
  accuracy: number;
  missed: MissedQuestion[];
  completedAt: number;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getDifficultyBounds(difficulty: SpeedDuelDifficulty): {
  min: number;
  max: number;
} {
  switch (difficulty) {
    case "easy":
      return { min: 1, max: 12 };
    case "medium":
      return { min: 1, max: 30 };
    case "hard":
      return { min: 1, max: 99 };
    default:
      return { min: 1, max: 12 };
  }
}

let questionCounter = 0;

/**
 * Generates an integer math question based on chosen difficulty.
 * - Addition: a + b
 * - Subtraction: non-negative (a - b where a >= b)
 * - Multiplication: a × b
 * - Division: exact integer division with nonzero divisor (product ÷ b = a)
 * - Prevents immediate repeat of the previous equation.
 */
export function generateQuestion(
  difficulty: SpeedDuelDifficulty,
  previousPrompt?: string,
): MathQuestion {
  const { min, max } = getDifficultyBounds(difficulty);
  const operators: MathOperator[] = ["+", "-", "×", "÷"];

  for (let attempt = 0; attempt < 20; attempt++) {
    const op = operators[getRandomInt(0, operators.length - 1)];
    let a = 0;
    let b = 0;
    let ans = 0;
    let prompt = "";

    if (op === "+") {
      a = getRandomInt(min, max);
      b = getRandomInt(min, max);
      ans = a + b;
      prompt = `${a} + ${b} = ?`;
    } else if (op === "-") {
      const v1 = getRandomInt(min, max);
      const v2 = getRandomInt(min, max);
      a = Math.max(v1, v2);
      b = Math.min(v1, v2);
      ans = a - b;
      prompt = `${a} - ${b} = ?`;
    } else if (op === "×") {
      // For hard difficulty, keep multiplication within manageable mental-math bounds (e.g. up to 25x12 or 12x12 for easy)
      const maxMult = difficulty === "hard" ? 30 : max;
      a = getRandomInt(min, maxMult);
      b = getRandomInt(min, difficulty === "hard" ? 15 : max);
      ans = a * b;
      prompt = `${a} × ${b} = ?`;
    } else if (op === "÷") {
      // Exact division with nonzero divisor
      const divisor = getRandomInt(Math.max(2, min), difficulty === "hard" ? 15 : max);
      const quotient = getRandomInt(min, difficulty === "hard" ? 30 : max);
      const dividend = divisor * quotient;
      a = dividend;
      b = divisor;
      ans = quotient;
      prompt = `${a} ÷ ${b} = ?`;
    }

    if (prompt !== previousPrompt) {
      questionCounter++;
      return {
        id: `q-${Date.now()}-${questionCounter}`,
        operandA: a,
        operandB: b,
        operator: op,
        answer: ans,
        prompt,
      };
    }
  }

  // Fallback if loop finishes
  questionCounter++;
  return {
    id: `q-${Date.now()}-${questionCounter}`,
    operandA: 7,
    operandB: 8,
    operator: "×",
    answer: 56,
    prompt: "7 × 8 = ?",
  };
}

export function calculateAccuracy(correct: number, errors: number): number {
  const total = correct + errors;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((correct / total) * 100)));
}
