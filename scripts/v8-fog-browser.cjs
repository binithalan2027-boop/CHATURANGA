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
  await expect(c.locator(".online-move-row").first()).toContainText("?"); // masked move for black
  await expect(a.locator(".online-move-row").first()).toContainText("e2-e4");
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
  // Mobile: fog board must fit 320px with no horizontal overflow
  await a.setViewportSize({ width: 320, height: 820 });
  await a.screenshot({ path: "/downloads/v8-fog-mobile.png", fullPage: true });
  const overflow = await a.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) throw Error("Mobile overflow on fog board");
  await a.setViewportSize({ width: 1366, height: 950 });
  await a.screenshot({ path: "/downloads/v8-fog-white.png" });
  await c.screenshot({ path: "/downloads/v8-fog-black.png" });
  // Fog privacy: no takeback button, no opening name (not a book game)
  if (await a.locator(".online-opening").count()) errors.push("fog: opening name visible");
  // Fog privacy: no takeback button (hidden information) and no arrow review
  if (await a.getByRole("button", { name: "Takeback", exact: true }).count()) errors.push("fog: takeback button visible");
  // Fog privacy: arrow keys must NOT open move-list review (masked list)
  await a.keyboard.press("ArrowLeft");
  await a.keyboard.press("Home");
  if (await a.locator(".online-review").count()) errors.push("fog: arrow key opened review");
  console.log(JSON.stringify({ fogOnline: true, masked: true, projection: true, noReviewKeys: true, errors }, null, 2));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
