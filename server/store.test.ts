import { describe, it, expect } from "vitest";
import { Store } from "./store";

describe("online backup", () => {
  it("writes a consistent copy that opens independently", async () => {
    const { mkdtempSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const dir = mkdtempSync(join(tmpdir(), "chaturanga-backup-"));
    const store = new Store(join(dir, "main.sqlite"));
    store.put("profile", "u1", { id: "u1", displayName: "One" });
    const copy = join(dir, "copy.sqlite");
    store.backup(copy);
    const restored = new Store(copy);
    expect(restored.get("profile", "u1")).toEqual({
      id: "u1",
      displayName: "One",
    });
    store.close();
    restored.close();
  });
});
