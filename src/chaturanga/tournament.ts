export interface Fixture {
  id: string;
  round: number;
  white: string;
  black: string;
  result: "1-0" | "0-1" | "1/2-1/2" | null;
}
export interface LocalTournament {
  id: string;
  name: string;
  players: string[];
  fixtures: Fixture[];
  createdAt: number;
}
export function makeTournament(
  name: string,
  names: string[],
  now = Date.now(),
): LocalTournament {
  const players = names.map((n) => n.trim()).filter(Boolean);
  if (!name.trim() || players.length < 2 || players.length > 16)
    throw new Error("Enter a name and 2–16 players.");
  if (new Set(players.map((n) => n.toLowerCase())).size !== players.length)
    throw new Error("Player names must be distinct.");
  if (players.some((n) => n.length > 60) || name.length > 100)
    throw new Error("Keep tournament/player names short.");
  const seats: (string | null)[] = [...players];
  if (seats.length % 2) seats.push(null);
  const fixtures: Fixture[] = [];
  for (let round = 1; round < seats.length; round++) {
    for (let i = 0; i < seats.length / 2; i++) {
      const a = seats[i],
        b = seats[seats.length - 1 - i];
      if (a && b) {
        const invert = (round + i) % 2 === 0;
        fixtures.push({
          id: `${round}-${i}`,
          round,
          white: invert ? b : a,
          black: invert ? a : b,
          result: null,
        });
      }
    }
    seats.splice(1, 0, seats.pop()!);
  }
  return {
    id: `local-${now}`,
    name: name.trim(),
    players,
    fixtures,
    createdAt: now,
  };
}
export function standings(t: LocalTournament) {
  return t.players
    .map((name) => {
      let points = 0,
        played = 0,
        wins = 0;
      for (const f of t.fixtures) {
        if (!f.result || ![f.white, f.black].includes(name)) continue;
        played++;
        const win =
          (f.result === "1-0" && f.white === name) ||
          (f.result === "0-1" && f.black === name);
        if (win) {
          points++;
          wins++;
        } else if (f.result === "1/2-1/2") points += 0.5;
      }
      return { name, points, played, wins };
    })
    .sort(
      (a, b) =>
        b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name),
    );
}
export function joinLocalTournament(
  t: LocalTournament,
  name: string,
): LocalTournament {
  if (t.fixtures.some((f) => f.result))
    throw new Error("Players cannot join after results are recorded.");
  return makeTournament(t.name, [...t.players, name], t.createdAt);
}
