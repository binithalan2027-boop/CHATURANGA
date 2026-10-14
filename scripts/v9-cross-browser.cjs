// Three-player cross-board coverage: create, two joins (Enter + case
// normalization), south moves, turn passes to west on every screen.
const { chromium, expect } = require("@playwright/test");
expect.configure({ timeout: 20_000 });
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    args: ["--no-sandbox"],
  });
  const errors = [], stamp = Date.now().toString().slice(-8);
  const mk = async (name) => {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 950 } });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://127.0.0.1:5173");
    await p.getByRole("button", { name: "Online PvP", exact: true }).click();
    await p.getByRole("button", { name: "Create local test player" }).click();
    await p.locator(".online-shell").getByRole("button", { name: "Profile", exact: true }).click();
    await p.getByRole("textbox", { name: /Username/ }).fill("xb" + name + stamp);
    await p.getByLabel("Display name", { exact: true }).fill(name);
    await p.getByRole("button", { name: "Save profile", exact: true }).click();
    await expect(p.getByRole("button", { name: "Save profile", exact: true })).toBeEnabled();
    await p.getByRole("button", { name: "PvP", exact: true }).click();
    return p;
  };
  const a = await mk("Ravi"), c = await mk("Sana"), d = await mk("Tej");
  // A creates a three-player cross-board room
  await a.getByLabel("Custom mode", { exact: true }).selectOption("cross3");
  await a.getByRole("button", { name: "Create custom room", exact: true }).click();
  await expect(a.locator(".custom-game")).toContainText("Waiting for 2 players");
  const code = (await a.locator(".custom-game code").textContent()).trim();
  // B and C join by code - uppercase, via Enter (case is normalized)
  await c.getByLabel("Custom room code", { exact: true }).fill(code.toUpperCase());
  await c.getByLabel("Custom room code", { exact: true }).press("Enter");
  await expect(c.locator(".custom-game")).toContainText("You are west");
  await d.getByLabel("Custom room code", { exact: true }).fill(code);
  await d.getByLabel("Custom room code", { exact: true }).press("Enter");
  await expect(d.locator(".custom-game")).toContainText("You are east");
  // Game starts: south (A) to act on all three screens
  await expect(a.locator(".custom-game")).toContainText("You are south. south to act");
  await expect(c.locator(".custom-game")).toContainText("south to act");
  // Roster names all three seats
  await expect(a.locator(".seat-roster").first()).toContainText("south: Ravi");
  // A moves: pick a south pawn, then one of its legal destinations
  await a.getByRole("button", { name: /, south p$/ }).first().click();
  const dest = a.locator(".cross-cell.destination").first();
  await dest.click();
  // Turn passes to west on every screen
  await expect(a.locator(".custom-game")).toContainText("west to act");
  await expect(c.locator(".custom-game")).toContainText("You are west. west to act");
  await expect(d.locator(".custom-game")).toContainText("west to act");
  await a.screenshot({ path: "/downloads/v9-cross.png", fullPage: true });
  // C resigns inline: two-step, cancellable
  await c.getByRole("button", { name: "Resign custom game", exact: true }).click();
  await c.getByRole("button", { name: "Keep playing", exact: true }).click();
  await expect(c.locator(".custom-game")).not.toContainText("(out)");
  await c.getByRole("button", { name: "Resign custom game", exact: true }).click();
  await c.getByRole("button", { name: "Confirm resign", exact: true }).click();
  await expect(c.locator(".custom-game")).toContainText("(out)");
  // Four-player cross-board: north joins too, turn order south -> west
  const e = await mk("Vik");
  await a.getByLabel("Custom mode", { exact: true }).selectOption("cross4");
  await a.getByRole("button", { name: "Create custom room", exact: true }).click();
  await expect(a.locator(".custom-game")).toContainText("Waiting for 3 players");
  const code4 = (await a.locator(".custom-game code").textContent()).trim();
  await c.getByLabel("Custom room code", { exact: true }).fill(code4);
  await c.getByLabel("Custom room code", { exact: true }).press("Enter");
  await d.getByLabel("Custom room code", { exact: true }).fill(code4);
  await d.getByLabel("Custom room code", { exact: true }).press("Enter");
  await e.getByLabel("Custom room code", { exact: true }).fill(code4);
  await e.getByLabel("Custom room code", { exact: true }).press("Enter");
  await expect(a.locator(".custom-game")).toContainText("You are south. south to act");
  await expect(e.locator(".custom-game")).toContainText("You are east");
  await expect(d.locator(".custom-game")).toContainText("You are north");
  await expect(a.locator(".seat-roster").first()).toContainText("east: Vik");
  await a.getByRole("button", { name: /, south p$/ }).first().click();
  await a.locator(".cross-cell.destination").first().click();
  await expect(c.locator(".custom-game")).toContainText("You are west. west to act");
  await expect(d.locator(".custom-game")).toContainText("west to act");
  await a.screenshot({ path: "/downloads/v9-cross4.png", fullPage: true });
  console.log(JSON.stringify({ cross3: true, cross4: true, inlineResign: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
