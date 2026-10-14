// Promotion picker: reaching the last rank offers named choices and an
// underpromotion (knight) lands on both screens.
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
    await p.getByRole("textbox", { name: /Username/ }).fill("pr" + name + stamp);
    await p.getByLabel("Display name", { exact: true }).fill(name);
    await p.getByRole("button", { name: "Save profile", exact: true }).click();
    await expect(p.getByRole("button", { name: "Save profile", exact: true })).toBeEnabled();
    await p.getByRole("button", { name: "PvP", exact: true }).click();
    return p;
  };
  const a = await mk("Pia"), c = await mk("Raj");
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
  const code = (await a.locator("code").first().textContent()).trim();
  await c.getByLabel("Room code", { exact: true }).fill(code);
  await c.getByLabel("Room code", { exact: true }).press("Enter");
  await expect(a.getByText("white to move", { exact: false })).toBeVisible();
  const play = async (p, san) => {
    console.log("playing", san);
    await expect(p.getByLabel("Type a move", { exact: true })).toBeVisible();
    await p.getByLabel("Type a move", { exact: true }).fill(san);
    await p.getByRole("button", { name: "Play move", exact: true }).click();
  };
  // 1.h4 g5 2.hxg5 h6 3.gxh6 Nf6 4.h7 Rg8 - then hxg8 promotes
  const line = [
    [a, "h4"], [c, "g5"], [a, "hxg5"], [c, "h6"],
    [a, "gxh6"], [c, "Nf6"], [a, "h7"], [c, "Rg8"],
  ];
  let plies = 0;
  for (const [p, san] of line) {
    await play(p, san);
    plies += 1;
    await expect(a.locator(".online-move-row")).toHaveCount(Math.ceil(plies / 2));
  }
  // Clicking the promoting pawn's destination opens the named picker
  await a.getByRole("button", { name: "h7, white pawn", exact: true }).click();
  await a.getByRole("button", { name: "g8, black rook", exact: true }).click();
  await expect(a.getByRole("button", { name: "Promote to queen", exact: true })).toBeVisible();
  await expect(a.getByRole("button", { name: "Promote to knight", exact: true })).toBeVisible();
  await a.getByRole("button", { name: "Promote to knight", exact: true }).click();
  await expect(a.locator(".online-move-row").last()).toContainText("xg8=N");
  await expect(c.locator(".online-move-row").last()).toContainText("xg8=N");
  await expect(a.getByRole("button", { name: "g8, white knight", exact: true })).toBeVisible();
  await a.screenshot({ path: "/downloads/v9-promotion.png" });
  console.log(JSON.stringify({ promotion: true, underpromotion: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
