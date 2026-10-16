// Racing Kings coverage: kings race up the board and checks are illegal.
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
    await p.getByRole("textbox", { name: /Username/ }).fill("rk" + name + stamp);
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
  await a.getByLabel("Variant", { exact: true }).selectOption("racingkings");
  await expect(a.locator(".online-variant-summary")).toContainText(/Race kings/);
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
  await expect(a.locator("code").first()).toBeVisible();
  const code = (await a.locator("code").first().textContent()).trim();
  await c.getByLabel("Room code", { exact: true }).fill(code);
  await c.getByLabel("Room code", { exact: true }).press("Enter");
  await expect(a.getByText("white to move", { exact: false })).toBeVisible();
  // Kings start hemmed in on the back ranks and race upward
  await expect(a.getByRole("button", { name: "a2, black king", exact: true })).toBeVisible();
  await expect(a.getByRole("button", { name: "h2, white king", exact: true })).toBeVisible();
  await expect(a.getByRole("button", { name: "a1, black queen", exact: true })).toBeVisible();
  const play = async (p, from, to) => {
    await p.getByRole("button", { name: from, exact: true }).click();
    await expect(p.locator(".square.selected")).toHaveCount(1);
    await p.getByRole("button", { name: to, exact: true }).click();
  };
  // 1.Nxc2 Rb4 2.Kg3 Kb3 - both kings climb; no check is ever given
  await play(a, "e1, white knight", "c2, black bishop");
  await play(c, "b2, black rook", "b4, empty");
  await play(a, "h2, white king", "g3, empty");
  await play(c, "a2, black king", "b3, empty");
  await expect(a.getByRole("button", { name: "g3, white king", exact: true })).toBeVisible();
  await expect(a.getByRole("button", { name: "b3, black king", exact: true })).toBeVisible();
  await expect(a.locator(".online-moves")).toContainText("Kg3");
  await a.waitForTimeout(1200);
  await a.screenshot({ path: "/downloads/v9-racing.png" });
  console.log(JSON.stringify({ racing: true, kingsClimb: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
