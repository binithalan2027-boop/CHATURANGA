import { chooseBotMove } from "./bot";
self.onmessage = (e) => {
  const { fen, id, allowed, request } = e.data;
  try {
    self.postMessage({ request, move: chooseBotMove(fen, id, allowed) });
  } catch {
    self.postMessage({ request, move: "" });
  }
};
