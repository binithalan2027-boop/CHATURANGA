import { chooseBotMove } from "./bot";
self.onmessage = (e) => {
  const { fen, id, allowed, request, level } = e.data;
  try {
    self.postMessage({ request, move: chooseBotMove(fen, id, allowed, 15000, level) });
  } catch {
    self.postMessage({ request, move: "" });
  }
};
