// Abandonment: when a player closes every tab and stays gone past the
// grace window, the game is awarded to the opponent, chess.com style.
const { chromium, expect } = require("@playwright/test");
expect.configure({ timeout: 25_000 });
const errors = [];
let a, c, cctx;
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    args: ["--no-sandbox"],
  });
  const stamp = Date.now().toString().slice(-8);
  const mk = async (name) => {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 950 } });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://127.0.0.1:5173");
    await p.getByRole("button", { name: "Online PvP", exact: true }).click();
    await p.getByRole("button", { name: "Create local test player" }).click();
    await p.locator(".online-shell").getByRole("button", { name: "Profile", exact: true }).click();
    await p.getByRole("textbox", { name: /Username/ }).fill("ab" + name + stamp);
    await p.getByLabel("Display name", { exact: true }).fill(name);
    const profileResp = p.waitForResponse((r) => r.url().includes("/api/profile"), { timeout: 20_000 });
    await p.getByRole("button", { name: "Save profile", exact: true }).click();
    const pr = await profileResp;
    if (pr.status() !== 200) console.log("PROFILE SAVE FAILED:", name, pr.status(), await pr.text());
    await expect(p.getByRole("button", { name: "Save profile", exact: true })).toBeEnabled();
    await p.getByRole("button", { name: "PvP", exact: true }).click();
    return [p, ctx];
  };
  [a] = await mk("Ada");
  [c, cctx] = await mk("Cam");
  await expect(a.getByText(/· Connected/)).toBeVisible();
  await expect(c.getByText(/· Connected/)).toBeVisible();
  await a.waitForTimeout(2000);
  await a.getByLabel("Variant", { exact: true }).selectOption("chess");
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
  await expect(a.locator("code").first()).toBeVisible();
  const code = (await a.locator("code").first().textContent()).trim();
  await c.getByLabel("Room code", { exact: true }).fill(code);
  await c.getByLabel("Room code", { exact: true }).press("Enter");
  await expect(c.getByText("You are black.", { exact: false })).toBeVisible();
  await expect(a.getByText("white to move", { exact: false })).toBeVisible();
  // Cam closes every tab. Inside the grace window the game waits; past
  // it, the server awards Ada the win (verify server: 8s window).
  await cctx.close();
  await expect(a.locator(".online-result")).toContainText(
    "white wins (opponent disconnected)",
    { timeout: 25_000 },
  );
  await a.waitForTimeout(1200);
  await a.locator(".online-result").scrollIntoViewIfNeeded();
  await a.screenshot({ path: "/downloads/v9-abandon.png" });
  console.log(JSON.stringify({ abandon: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch(async (e) => {
  console.error("PAGEERRORS:", JSON.stringify(errors));
  try { console.error("A TEXT:", (await a.locator("main").innerText()).replace(/\n/g, " | ").slice(0, 1600)); } catch {}
  console.error(e && e.message ? e.message.split("\n").slice(0, 5).join("\n") : e);
  process.exit(1);
});
