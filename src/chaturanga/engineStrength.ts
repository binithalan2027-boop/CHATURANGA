export const STOCKFISH_ELO_MIN = 1320,
  STOCKFISH_ELO_MAX = 3190;
export function strengthOptions(elo: number | null) {
  if (elo === null)
    return [
      "setoption name UCI_LimitStrength value false",
      "setoption name Skill Level value 20",
    ];
  if (
    !Number.isInteger(elo) ||
    elo < STOCKFISH_ELO_MIN ||
    elo > STOCKFISH_ELO_MAX
  )
    throw Error("Stockfish target outside supported range.");
  return [
    "setoption name UCI_LimitStrength value true",
    `setoption name UCI_Elo value ${elo}`,
  ];
}
export function beginnerProbability(value: number) {
  return Math.max(0.03, Math.min(0.95, (1320 - value) / 1320));
}
