// Horde coverage: 36 white pawns, no white king, captures thin the horde.
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
    await p.getByRole("textbox", { name: /Username/ }).fill("hd" + name + stamp);
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
  await a.getByLabel("Variant", { exact: true }).selectOption("horde");
  await expect(a.locator(".online-variant-summary")).toContainText(/pawn horde/);
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
  await expect(a.locator("code").first()).toBeVisible();
  const code = (await a.locator("code").first().textContent()).trim();
  await c.getByLabel("Room code", { exact: true }).fill(code);
  await c.getByLabel("Room code", { exact: true }).press("Enter");
  await expect(a.getByText("white to move", { exact: false })).toBeVisible();
  // White starts with a 36-pawn horde and no king; Black has a standard army
  await expect(a.getByRole("button", { name: "e1, white pawn", exact: true })).toBeVisible();
  await expect(a.getByRole("button", { name: "b5, white pawn", exact: true })).toBeVisible();
  await expect(a.getByRole("button", { name: "e8, black king", exact: true })).toBeVisible();
  await expect(a.getByRole("button", { name: "a8, black rook", exact: true })).toBeVisible();
  if (await a.getByRole("button", { name: /white king/ }).count())
    errors.push("horde rendered a white king");
  const play = async (p, from, to) => {
    await p.getByRole("button", { name: from, exact: true }).click();
    await expect(p.locator(".square.selected")).toHaveCount(1);
    await p.getByRole("button", { name: to, exact: true }).click();
  };
  // 1.a5 e5 2.h5 exf4 - Black wins material by taking horde pawns
  await play(a, "a4, white pawn", "a5, empty");
  await play(c, "e7, black pawn", "e5, empty");
  await play(a, "h4, white pawn", "h5, empty");
  await play(c, "e5, black pawn", "f4, white pawn");
  await expect(a.getByRole("button", { name: "f4, black pawn", exact: true })).toBeVisible();
  await expect(a.getByText("white to move", { exact: false })).toBeVisible();
  await a.waitForTimeout(1200);
  await a.screenshot({ path: "/downloads/v9-horde.png" });
  console.log(JSON.stringify({ horde: true, noWhiteKing: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
