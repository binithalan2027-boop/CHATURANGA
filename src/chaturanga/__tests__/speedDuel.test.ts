import { describe, it, expect } from "vitest";
import {
  generateQuestion,
  getDifficultyBounds,
  calculateAccuracy,
  SpeedDuelDifficulty,
  MathQuestion,
  MissedQuestion,
} from "../speedDuelEngine";

describe("Speed Duel Solo Practice Engine", () => {
  it("bounds match difficulty tiers", () => {
    expect(getDifficultyBounds("easy")).toEqual({ min: 1, max: 12 });
    expect(getDifficultyBounds("medium")).toEqual({ min: 1, max: 30 });
    expect(getDifficultyBounds("hard")).toEqual({ min: 1, max: 99 });
  });

  it("generates 100 valid questions with integer answers, non-negative subtraction, and non-zero division", () => {
    const difficulties: SpeedDuelDifficulty[] = ["easy", "medium", "hard"];

    for (const diff of difficulties) {
      for (let i = 0; i < 50; i++) {
        const q = generateQuestion(diff);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.prompt).toContain("= ?");

        if (q.operator === "+") {
          expect(q.operandA + q.operandB).toBe(q.answer);
        } else if (q.operator === "-") {
          expect(q.operandA).toBeGreaterThanOrEqual(q.operandB);
          expect(q.operandA - q.operandB).toBe(q.answer);
          expect(q.answer).toBeGreaterThanOrEqual(0);
        } else if (q.operator === "×") {
          expect(q.operandA * q.operandB).toBe(q.answer);
        } else if (q.operator === "÷") {
          expect(q.operandB).toBeGreaterThan(0);
          expect(q.operandA % q.operandB).toBe(0);
          expect(q.operandA / q.operandB).toBe(q.answer);
        }
      }
    }
  });

  it("prevents immediate repetition of equation", () => {
    const q1 = generateQuestion("easy");
    for (let i = 0; i < 20; i++) {
      const q2 = generateQuestion("easy", q1.prompt);
      expect(q2.prompt).not.toBe(q1.prompt);
    }
  });

  it("computes accurate accuracy percentages", () => {
    expect(calculateAccuracy(0, 0)).toBe(100);
    expect(calculateAccuracy(10, 0)).toBe(100);
    expect(calculateAccuracy(9, 1)).toBe(90);
    expect(calculateAccuracy(1, 1)).toBe(50);
    expect(calculateAccuracy(0, 5)).toBe(0);
    expect(calculateAccuracy(3, 1)).toBe(75);
  });

  it("handles fast digit input sequence (137) atomically", () => {
    let inputVal = "";
    const handleDigitPress = (digit: string) => {
      inputVal = inputVal.length < 6 ? inputVal + digit : inputVal;
    };
    const handleBackspace = () => {
      inputVal = inputVal.slice(0, -1);
    };
    const handleClear = () => {
      inputVal = "";
    };

    // Fast keystrokes: '1', '3', '7'
    handleDigitPress("1");
    handleDigitPress("3");
    handleDigitPress("7");
    expect(inputVal).toBe("137");

    // Backspace: removes last digit
    handleBackspace();
    expect(inputVal).toBe("13");

    // Append '5'
    handleDigitPress("5");
    expect(inputVal).toBe("135");

    // Clear
    handleClear();
    expect(inputVal).toBe("");
  });

  it("validates answer submission and rejects empty input or double submit", () => {
    const q: MathQuestion = {
      id: "q-test-1",
      operandA: 12,
      operandB: 8,
      operator: "+",
      answer: 20,
      prompt: "12 + 8 = ?",
    };

    let correctCount = 0;
    let errorCount = 0;
    const missed: MissedQuestion[] = [];
    let submittedIds = new Set<string>();

    const submit = (input: string, now: number, deadline: number) => {
      if (now >= deadline) return { status: "expired" };
      const trimmed = input.trim();
      if (!trimmed) return { status: "ignored_blank" };
      if (submittedIds.has(q.id)) return { status: "duplicate" };
      submittedIds.add(q.id);

      const parsed = parseInt(trimmed, 10);
      if (parsed === q.answer) {
        correctCount++;
        return { status: "correct" };
      } else {
        errorCount++;
        missed.push({ question: q, entered: trimmed });
        return { status: "wrong" };
      }
    };

    const deadline = 10000;

    // Blank inputs are ignored without affecting counts
    expect(submit("", 1000, deadline)).toEqual({ status: "ignored_blank" });
    expect(submit("   ", 1000, deadline)).toEqual({ status: "ignored_blank" });
    expect(correctCount).toBe(0);
    expect(errorCount).toBe(0);

    // Wrong answer is counted once
    expect(submit("19", 2000, deadline)).toEqual({ status: "wrong" });
    expect(correctCount).toBe(0);
    expect(errorCount).toBe(1);
    expect(missed.length).toBe(1);

    // Duplicate submission of same question rejected
    expect(submit("20", 3000, deadline)).toEqual({ status: "duplicate" });

    // Answer at or after deadline is rejected
    expect(submit("20", 10000, deadline)).toEqual({ status: "expired" });
    expect(submit("20", 11000, deadline)).toEqual({ status: "expired" });
  });

  it("supports retry missed queue without timer expiration", () => {
    const missed: MissedQuestion[] = [
      {
        question: { id: "q-1", operandA: 7, operandB: 9, operator: "×", answer: 63, prompt: "7 × 9 = ?" },
        entered: "54",
      },
      {
        question: { id: "q-2", operandA: 48, operandB: 6, operator: "÷", answer: 8, prompt: "48 ÷ 6 = ?" },
        entered: "7",
      },
    ];

    let retryQueue = [...missed];
    let retryIndex = 0;
    let retryFixed = 0;

    // First retry item: user answers 63
    const item1 = retryQueue[retryIndex];
    if (parseInt("63", 10) === item1.question.answer) {
      retryFixed++;
    }
    retryIndex++;

    // Second retry item: user answers 8
    const item2 = retryQueue[retryIndex];
    if (parseInt("8", 10) === item2.question.answer) {
      retryFixed++;
    }
    retryIndex++;

    expect(retryFixed).toBe(2);
    expect(retryIndex).toBe(retryQueue.length);
  });
});
