// Variant premove coverage: premoves fire in atomic games, and a premove made illegal by the opponent is discarded.
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
    await p.getByRole("textbox", { name: /Username/ }).fill("vp" + name + stamp);
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
  const play = async (p, from, to) => {
    await p.getByRole("button", { name: from, exact: true }).click();
    await expect(p.locator(".square.selected")).toHaveCount(1);
    await p.getByRole("button", { name: to, exact: true }).click();
  };
  // B queues a premove while it is still White's turn: d7d5 fires automatically
  await c.getByRole("button", { name: "d7, black pawn", exact: true }).click();
  await c.getByRole("button", { name: "d5, empty", exact: true }).click();
  await expect(c.locator(".square.premove")).toHaveCount(2);
  await expect(c.locator(".online-premove")).toContainText("Premove set");
  await play(a, "e2, white pawn", "e4, empty");
  await expect(a.locator(".online-moves")).toContainText("d5");
  await expect(c.locator(".square.premove")).toHaveCount(0);
  // B queues d5xe4; White moves the e4 pawn away, so the premove is discarded
  await c.getByRole("button", { name: "d5, black pawn", exact: true }).click();
  await c.getByRole("button", { name: "e4, white pawn", exact: true }).click();
  await expect(c.locator(".square.premove")).toHaveCount(2);
  await c.waitForTimeout(1200);
  await c.screenshot({ path: "/downloads/v9-variant-premove.png" });
  await play(a, "e4, white pawn", "e5, empty");
  await expect(a.locator(".online-moves")).toContainText("e5");
  await expect(c.locator(".online-moves")).not.toContainText("dxe4");
  await expect(c.locator(".square.premove")).toHaveCount(0);
  await expect(c.getByText("black to move", { exact: false })).toBeVisible();
  console.log(JSON.stringify({ variantPremove: true, discarded: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
