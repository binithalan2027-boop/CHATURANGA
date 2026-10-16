// Three-check coverage: three checks by one side ends the game.
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
    await p.getByRole("textbox", { name: /Username/ }).fill("tc" + name + stamp);
    await p.getByLabel("Display name", { exact: true }).fill(name);
    const profileResp = p.waitForResponse((r) => r.url().includes("/api/profile"), { timeout: 20_000 });
    await p.getByRole("button", { name: "Save profile", exact: true }).click();
    const pr = await profileResp;
    if (pr.status() !== 200) console.log("PROFILE SAVE FAILED:", name, pr.status(), await pr.text());
    await expect(p.getByRole("button", { name: "Save profile", exact: true })).toBeEnabled();
    await p.getByRole("button", { name: "PvP", exact: true }).click();
    return p;
  };
  const a = await mk("Gita"), c = await mk("Hari");
  await a.getByLabel("Variant", { exact: true }).selectOption("3check");
  await expect(a.locator(".online-variant-summary")).toContainText(/three checks/i);
  const createResp = a.waitForResponse(
    (r) => r.url().includes("/api/create"),
    { timeout: 20_000 },
  );
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
  const resp = await createResp;
  if (resp.status() !== 200) console.log("CREATE FAILED:", resp.status(), await resp.text());
  await expect(a.locator("code").first()).toBeVisible();
  const code = (await a.locator("code").first().textContent()).trim();
  await c.getByLabel("Room code", { exact: true }).fill(code);
  await c.getByLabel("Room code", { exact: true }).press("Enter");
  await expect(a.getByText("white to move", { exact: false })).toBeVisible();
  const play = async (p, san) => {
    const input = p.getByLabel("Type a move", { exact: true });
    await expect(input).toBeVisible();
    await input.fill(san);
    await p.getByRole("button", { name: "Play move", exact: true }).click();
  };
  // 1.e4 e5 2.Qh5 d6 3.Bb5+ c6 4.Qxe5+ Qe7 5.Qxe7 - the third check wins
  const line = [
    [a, "e4"], [c, "e5"], [a, "Qh5"], [c, "d6"],
    [a, "Bb5+"], [c, "c6"], [a, "Qxe5+"], [c, "Qe7"],
  ];
  let plies = 0;
  for (const [p, san] of line) {
    await play(p, san);
    plies += 1;
    await expect(a.locator(".online-move-row")).toHaveCount(Math.ceil(plies / 2));
  }
  await play(a, "Qxe7+");
  await expect(a.locator(".online-result")).toContainText("white wins");
  await expect(c.locator(".online-result")).toContainText("white wins");
  await expect(a.locator(".online-result")).toContainText("9 moves played");
  await a.screenshot({ path: "/downloads/v9-3check.png" });
  console.log(JSON.stringify({ threeCheck: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
