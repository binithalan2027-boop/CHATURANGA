// King of the Hill coverage: marching the king to the centre ends the game.
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
    await p.getByRole("textbox", { name: /Username/ }).fill("kh" + name + stamp);
    await p.getByLabel("Display name", { exact: true }).fill(name);
    await p.getByRole("button", { name: "Save profile", exact: true }).click();
    await expect(p.getByRole("button", { name: "Save profile", exact: true })).toBeEnabled();
    await p.getByRole("button", { name: "PvP", exact: true }).click();
    return p;
  };
  const a = await mk("Uma"), c = await mk("Veer");
  await a.getByLabel("Variant", { exact: true }).selectOption("kingofthehill");
  await expect(a.locator(".online-variant-summary")).toContainText(/reaching d4/);
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
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
  // 1.d4 d5 2.e4 dxe4 3.Ke2 c5 4.Ke3 Qc7 5.Ke4 - the king reaches e4
  const line = [
    [a, "d4"], [c, "d5"], [a, "e4"], [c, "dxe4"],
    [a, "Ke2"], [c, "c5"], [a, "Ke3"], [c, "Qc7"],
  ];
  let plies = 0;
  for (const [p, san] of line) {
    await play(p, san);
    plies += 1;
    await expect(a.locator(".online-move-row")).toHaveCount(Math.ceil(plies / 2));
  }
  await play(a, "Ke4");
  await expect(a.locator(".online-result")).toContainText("white wins");
  await expect(c.locator(".online-result")).toContainText("white wins");
  await expect(a.locator(".online-result")).toContainText("9 moves played");
  await a.screenshot({ path: "/downloads/v9-koth.png" });
  console.log(JSON.stringify({ koth: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
