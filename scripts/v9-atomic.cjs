// Atomic coverage: captures explode, and exploding the king wins.
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
    await p.getByRole("textbox", { name: /Username/ }).fill("at" + name + stamp);
    await p.getByLabel("Display name", { exact: true }).fill(name);
    const profileResp = p.waitForResponse((r) => r.url().includes("/api/profile"), { timeout: 20_000 });
    await p.getByRole("button", { name: "Save profile", exact: true }).click();
    const pr = await profileResp;
    if (pr.status() !== 200) console.log("PROFILE SAVE FAILED:", name, pr.status(), await pr.text());
    await expect(p.getByRole("button", { name: "Save profile", exact: true })).toBeEnabled();
    await p.getByRole("button", { name: "PvP", exact: true }).click();
    return p;
  };
  const a = await mk("Ira"), c = await mk("Jai");
  await a.getByLabel("Variant", { exact: true }).selectOption("atomic");
  await expect(a.locator(".online-variant-summary")).toContainText(/Captures explode/);
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
  await expect(a.locator("code").first()).toBeVisible();
  const code = (await a.locator("code").first().textContent()).trim();
  await c.getByLabel("Room code", { exact: true }).fill(code);
  await c.getByLabel("Room code", { exact: true }).press("Enter");
  await expect(a.getByText("white to move", { exact: false })).toBeVisible();
  // 1.Nf3 d5 2.Ne5 d4 3.Nxf7 - the capture explodes the e8 king: white wins
  const play = async (p, from, to) => {
    await p.getByRole("button", { name: from, exact: true }).click();
    await expect(p.locator(".square.selected")).toHaveCount(1);
    await p.getByRole("button", { name: to, exact: true }).click();
  };
  await play(a, "g1, white knight", "f3, empty");
  await play(c, "d7, black pawn", "d5, empty");
  await play(a, "f3, white knight", "e5, empty");
  await play(c, "d5, black pawn", "d4, empty");
  await play(a, "e5, white knight", "f7, black pawn");
  // The explosion removes the e8 king, f8 bishop, g8 knight and f7 pawn
  await expect(a.getByRole("button", { name: "e8, empty", exact: true })).toBeVisible();
  await expect(a.getByRole("button", { name: "f8, empty", exact: true })).toBeVisible();
  await expect(a.getByRole("button", { name: "g8, empty", exact: true })).toBeVisible();
  await expect(a.locator(".online-moves")).toContainText("Nxf7");
  await expect(a.locator(".online-result")).toContainText("white wins");
  await expect(c.locator(".online-result")).toContainText("white wins");
  await expect(a.locator(".online-result")).toContainText("5 moves played");
  await a.screenshot({ path: "/downloads/v9-atomic.png" });
  console.log(JSON.stringify({ atomic: true, kingExplosion: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
