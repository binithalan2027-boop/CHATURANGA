export interface EngineInfo {
  cp?: number;
  mate?: number;
  depth?: number;
  pv: string[];
}
export function parseEngineInfo(text: string): EngineInfo | null {
  if (!text.startsWith("info ") || !text.includes("score ")) return null;
  const cp = text.match(/score cp (-?\d+)/),
    mate = text.match(/score mate (-?\d+)/),
    depth = text.match(/\bdepth (\d+)/),
    pv = text.match(/\bpv (.+)/);
  return {
    cp: cp ? Number(cp[1]) : undefined,
    mate: mate ? Number(mate[1]) : undefined,
    depth: depth ? Number(depth[1]) : undefined,
    pv: pv ? pv[1].trim().split(/\s+/) : [],
  };
}
