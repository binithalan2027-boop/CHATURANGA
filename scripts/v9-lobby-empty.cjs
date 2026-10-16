// Lobby empty states: onboarding copy for new players, per-filter explanations.
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
    await p.getByRole("textbox", { name: /Username/ }).fill("le" + name + stamp);
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
  // A brand-new profile gets onboarding copy instead of a blank list
  const emptyMsg = a.getByText("No games yet. Create a private room above, or join one with a friend's code.", { exact: true });
  await expect(emptyMsg).toBeVisible();
  await emptyMsg.scrollIntoViewIfNeeded();
  await a.screenshot({ path: "/downloads/v9-lobby-empty.png" });
  // With one room waiting for an opponent, filters explain themselves
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
  await expect(a.locator("code").first()).toBeVisible();
  const code = (await a.locator("code").first().textContent()).trim();
  await a.getByRole("button", { name: "Needs you", exact: true }).click();
  await expect(a.getByText("Nothing waiting on your move.", { exact: true })).toBeVisible();
  await a.getByRole("button", { name: "Finished", exact: true }).click();
  await expect(a.getByText("No finished games yet.", { exact: true })).toBeVisible();
  await a.getByRole("button", { name: "Waiting", exact: true }).click();
  await expect(a.locator(".online-person").getByText(/vs waiting/)).toBeVisible();
  await expect(a.getByText("No games waiting on your opponent.", { exact: true })).toHaveCount(0);
  // Once the opponent joins and it is White's move, the Waiting filter empties too
  await c.getByLabel("Room code", { exact: true }).fill(code);
  await c.getByLabel("Room code", { exact: true }).press("Enter");
  await expect(a.getByText("white to move", { exact: false })).toBeVisible();
  await expect(a.getByText("No games waiting on your opponent.", { exact: true })).toBeVisible();
  console.log(JSON.stringify({ lobbyEmpty: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
