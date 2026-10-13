const { chromium, expect } = require("@playwright/test");
(async () => {
  const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
  const errors = [], stamp = Date.now().toString().slice(-8);
  const mk = async (name) => {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 950 } });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://127.0.0.1:5173");
    await p.getByRole("button", { name: "Online PvP", exact: true }).click();
    await p.getByRole("button", { name: "Create local test player" }).click();
    await p.locator(".online-shell").getByRole("button", { name: "Profile", exact: true }).click();
    await p.getByRole("textbox", { name: /Username/ }).fill("fog" + name + stamp);
    await p.getByLabel("Display name", { exact: true }).fill(name);
    await p.getByRole("button", { name: "Save profile", exact: true }).click();
    await expect(p.getByRole("button", { name: "Save profile", exact: true })).toBeEnabled();
    await p.getByRole("button", { name: "PvP", exact: true }).click();
    return p;
  };
  const a = await mk("Arun"), c = await mk("Bela");
  // A creates a fog room
  await a.getByLabel("Variant", { exact: true }).selectOption("fog");
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
  await expect(a.getByText("Fog of War house rules", { exact: false })).toBeVisible();
  const code = await a.locator("code").first().textContent();
  // B joins
  await c.getByLabel("Room code", { exact: true }).fill(code.trim());
  await c.getByRole("button", { name: "Join room", exact: true }).click();
  await expect(c.getByText("Fog of War house rules", { exact: false })).toBeVisible();
  // Both see their own back rank; enemy king square is fog
  await expect(a.getByRole("button", { name: "e1, white king", exact: true })).toBeVisible();
  await expect(a.getByRole("button", { name: "e8, fog", exact: true })).toBeVisible();
  await expect(c.getByRole("button", { name: "e8, black king", exact: true })).toBeVisible();
  await expect(c.getByRole("button", { name: "e1, fog", exact: true })).toBeVisible();
  // A plays e2e4
  await a.getByRole("button", { name: "e2, white pawn", exact: true }).click();
  await a.getByRole("button", { name: "e4, empty", exact: true }).click();
  await expect(c.getByText("Moves: ?", { exact: false }).first()).toBeVisible(); // masked move for black
  await expect(a.getByText("Moves: e2-e4", { exact: false })).toBeVisible();
  // B's pawn on e7 stays fog for A (nothing attacks e7); B plays d7d5, landing in A's e4-pawn sight
  await expect(a.getByRole("button", { name: "e7, fog", exact: true })).toBeVisible();
  await expect(a.getByRole("button", { name: "e5, empty", exact: true })).toBeVisible(); // e4 pawn sees its push square
  await c.getByRole("button", { name: "d7, black pawn", exact: true }).click();
  await c.getByRole("button", { name: "d5, empty", exact: true }).click();
  await expect(a.getByRole("button", { name: "d5, black pawn", exact: true })).toBeVisible(); // revealed: e4 pawn attacks d5
  // A captures the revealed pawn; both see the white pawn on d5 (black queen watches the file)
  await a.getByRole("button", { name: "e4, white pawn", exact: true }).click();
  await a.getByRole("button", { name: "d5, black pawn", exact: true }).click();
  await expect(a.getByRole("button", { name: "d5, white pawn", exact: true })).toBeVisible();
  await expect(c.getByRole("button", { name: "d5, white pawn", exact: true })).toBeVisible();
  await a.screenshot({ path: "/downloads/v8-fog-white.png" });
  await c.screenshot({ path: "/downloads/v8-fog-black.png" });
  console.log(JSON.stringify({ fogOnline: true, masked: true, projection: true, errors }, null, 2));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
