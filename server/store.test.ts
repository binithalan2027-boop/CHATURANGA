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

describe("operator CLI visibility", () => {
  it("report and entitlement kinds reflect a second process immediately", async () => {
    const { mkdtempSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const dir = mkdtempSync(join(tmpdir(), "chaturanga-cli-"));
    const file = join(dir, "shared.sqlite");
    const server = new Store(file);
    // Prime the server cache on a hot kind and read a cold kind once.
    server.all("room");
    server.put("report", "t1", { id: "t1", status: "received" });
    // A moderation CLI in another process updates the ticket and grants access.
    const cli = new Store(file);
    cli.put("report", "t1", { id: "t1", status: "resolved" });
    cli.put("entitlement", "u1", { unlocked: true });
    // The running server must see both without a restart.
    expect(server.get<{ status: string }>("report", "t1")!.status).toBe(
      "resolved",
    );
    expect(server.get<{ unlocked: boolean }>("entitlement", "u1")!.unlocked).toBe(
      true,
    );
    expect(server.all("report")).toHaveLength(1);
    // Hot kinds stay single-writer cached (documented contract).
    cli.put("room", "r1", { id: "r1" });
    expect(server.all("room")).toHaveLength(0);
    server.close();
    cli.close();
  });
});
