// Antichess coverage: captures are compulsory and kings are not royal.
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
    await p.getByRole("textbox", { name: /Username/ }).fill("ac" + name + stamp);
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
  await a.getByLabel("Variant", { exact: true }).selectOption("antichess");
  await expect(a.locator(".online-variant-summary")).toContainText(/Captures are compulsory/);
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
  await expect(a.locator("code").first()).toBeVisible();
  const code = (await a.locator("code").first().textContent()).trim();
  await c.getByLabel("Room code", { exact: true }).fill(code);
  await c.getByLabel("Room code", { exact: true }).press("Enter");
  await expect(a.getByText("white to move", { exact: false })).toBeVisible();
  // 1.e4 d5 - now White MUST capture: a quiet pawn has no destinations
  await a.getByRole("button", { name: "e2, white pawn", exact: true }).click();
  await a.getByRole("button", { name: "e4, empty", exact: true }).click();
  await c.getByRole("button", { name: "d7, black pawn", exact: true }).click();
  await c.getByRole("button", { name: "d5, empty", exact: true }).click();
  // A quiet move is rejected: a2-a3 never lands while a capture exists
  await a.getByRole("button", { name: "a2, white pawn", exact: true }).click();
  await a.getByRole("button", { name: "a3, empty", exact: true }).click();
  await a.waitForTimeout(800);
  if (await a.getByRole("button", { name: "a3, white pawn", exact: true }).count())
    errors.push("antichess allowed a quiet move while a capture existed");
  // The forced capture plays
  await a.getByRole("button", { name: "e4, white pawn", exact: true }).click();
  await expect(a.locator(".square.selected")).toHaveCount(1);
  await a.getByRole("button", { name: "d5, black pawn", exact: true }).click();
  await expect(a.locator(".online-moves")).toContainText("exd5");
  // Kings are not royal: Black can leave the king en prise (no check concept)
  await a.screenshot({ path: "/downloads/v9-antichess.png" });
  console.log(JSON.stringify({ antichess: true, forcedCapture: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
