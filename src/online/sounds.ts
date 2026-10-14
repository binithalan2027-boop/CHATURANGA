/**
 * Move sounds, synthesized with WebAudio - no audio assets to ship.
 * Playback is best-effort: browsers that block or lack audio fail
 * silently. The mute preference lives in localStorage, owned by the
 * page component.
 */
export type SoundKind = "move" | "capture" | "check" | "end";

/** Pick the cue for a landed move from its SAN and the game state. */
export function soundForSan(
  san: string | null | undefined,
  finished: boolean,
): SoundKind {
  if (finished) return "end";
  if (!san || san === "?") return "move"; // fog masks hidden moves
  if (san.includes("+") || san.includes("#")) return "check";
  if (san.includes("x")) return "capture";
  return "move";
}

let ac: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    ac ??= new AudioContext();
    if (ac.state === "suspended") void ac.resume();
    return ac.state === "closed" ? null : ac;
  } catch {
    return null;
  }
}

function tone(
  ctx: AudioContext,
  at: number,
  freq: number,
  seconds: number,
  type: OscillatorType,
  volume: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + seconds + 0.02);
}

export function playSound(kind: SoundKind): void {
  try {
    const ctx = audio();
    if (!ctx || ctx.state !== "running") return;
    const t = ctx.currentTime;
    if (kind === "move") {
      tone(ctx, t, 540, 0.07, "triangle", 0.25);
    } else if (kind === "capture") {
      tone(ctx, t, 320, 0.05, "square", 0.18);
      tone(ctx, t + 0.05, 210, 0.09, "triangle", 0.25);
    } else if (kind === "check") {
      tone(ctx, t, 880, 0.08, "sine", 0.22);
      tone(ctx, t + 0.09, 660, 0.1, "sine", 0.22);
    } else {
      tone(ctx, t, 523, 0.12, "triangle", 0.22);
      tone(ctx, t + 0.12, 659, 0.12, "triangle", 0.22);
      tone(ctx, t + 0.24, 784, 0.16, "triangle", 0.22);
    }
  } catch {
    /* audio is optional */
  }
}
