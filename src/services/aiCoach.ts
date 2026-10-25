/**
 * Gemini AI Chess Coach Service
 * Explains chess positions and Stockfish moves in plain English.
 * Only sends public FEN/SAN board data (zero private user data).
 * https://aistudio.google.com/docs/pricing
 */

export interface CoachExplanationRequest {
  fen: string;
  previousFen?: string;
  san?: string;
  bestMove?: string;
  evaluation?: string;
}

export interface CoachExplanationResponse {
  explanation: string;
  source: "gemini" | "heuristic" | "error";
  available: boolean;
}

/**
 * Ask the AI Coach to explain the position or candidate move
 */
export async function explainWithAICoach(
  req: CoachExplanationRequest
): Promise<CoachExplanationResponse> {
  const { fen, previousFen, san, bestMove, evaluation } = req;

  // 1. Try server endpoint first (so key can live safely in server .env)
  try {
    const serverRes = await fetch("/api/ai-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fen, previousFen, san, bestMove, evaluation }),
    });

    if (serverRes.ok) {
      const data = await serverRes.json();
      if (data.explanation) {
        return {
          explanation: data.explanation,
          source: data.source || "gemini",
          available: true,
        };
      }
    }
  } catch {
    // Server not running or endpoint not reachable, try client fallback if client key configured
  }

  // 2. Direct client fallback if VITE_GEMINI_API_KEY is configured in Vite env
  const clientKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (clientKey) {
    try {
      const prompt = `You are a supportive, insightful chess master coach. 
Explain this chess situation in 1-2 clear, punchy sentences in plain English for a club player. 
No private data, only chess concepts.
Position FEN: ${fen}
${san ? `Move played: ${san}` : ""}
${bestMove ? `Recommended engine move: ${bestMove}` : ""}
${evaluation ? `Stockfish evaluation: ${evaluation}` : ""}
Focus on the practical tactical motive (e.g. pin, fork, outpost, control of file, king safety).`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${clientKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 120,
              temperature: 0.3,
            },
          }),
        }
      );

      if (geminiRes.ok) {
        const result = await geminiRes.json();
        const text =
          result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return {
            explanation: text,
            source: "gemini",
            available: true,
          };
        }
      }
    } catch (err) {
      console.warn("Direct Gemini coach query failed:", err);
    }
  }

  return {
    explanation:
      "AI Coach is waiting for a GEMINI_API_KEY in .env. Engine calculates positions; Gemini explains the master idea in plain English.",
    source: "heuristic",
    available: false,
  };
}
