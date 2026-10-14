// Batch-2 UX verification: live clocks, piece glide, move list, material
// strip, flip board, copy code, result banner, rematch with colour swap.
const { chromium, expect } = require("@playwright/test");
(async () => {
  const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
  const errors = [], stamp = Date.now().toString().slice(-8);
  const mk = async (name) => {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 950 }, permissions: ["clipboard-read", "clipboard-write"] });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("dialog", (d) => void d.accept());
    await p.goto("http://127.0.0.1:5173");
    await p.getByRole("button", { name: "Online PvP", exact: true }).click();
    await p.getByRole("button", { name: "Create local test player" }).click();
    await p.locator(".online-shell").getByRole("button", { name: "Profile", exact: true }).click();
    await p.getByRole("textbox", { name: /Username/ }).fill("ux" + name + stamp);
    await p.getByLabel("Display name", { exact: true }).fill(name);
    await p.getByRole("button", { name: "Save profile", exact: true }).click();
    await expect(p.getByRole("button", { name: "Save profile", exact: true })).toBeEnabled();
    await p.getByRole("button", { name: "PvP", exact: true }).click();
    return p;
  };
  const a = await mk("Asha"), c = await mk("Biru");
  // A creates a standard room, B joins
  await a.getByLabel("Variant", { exact: true }).selectOption("chess");
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
  const code = (await a.locator("code").first().textContent()).trim();
  await c.getByLabel("Room code", { exact: true }).fill(code);
  await c.getByRole("button", { name: "Join room", exact: true }).click();
  await expect(c.getByText("You are black.", { exact: false })).toBeVisible();
  // Copy code button
  await a.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect(a.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  // Material strip starts level
  await expect(a.locator(".online-material-lead")).toHaveText("Level material");
  // A plays e2e4; the glide overlay must appear, starting at the from-square
  await a.evaluate(() => {
    window.__glides = [];
    const iv = setInterval(() => {
      const el = document.querySelector(".piece-glide");
      if (el && !window.__glides.length)
        window.__glides.push({ transform: el.style.transform });
      if (window.__glides.length > 2) clearInterval(iv);
    }, 15);
  });
  await a.getByRole("button", { name: "e2, white pawn", exact: true }).click();
  await a.getByRole("button", { name: "e4, empty", exact: true }).click();
  await a.waitForTimeout(700);
  const glides = await a.evaluate(() => window.__glides);
  if (!glides.length) errors.push("glide overlay never rendered");
  await a.screenshot({ path: "/downloads/v9-glide-check.png" });
  // Numbered move list
  await expect(a.locator(".online-move-row").first()).toContainText("1.");
  await expect(a.locator(".online-move-row").first()).toContainText("e4");
  // Live clock: it is Black's turn, so Black's clock must tick down
  const read = async () => (await c.locator(".online-clocks span").nth(1).textContent()).trim();
  const t1 = await read();
  await c.waitForTimeout(1600);
  const t2 = await read();
  if (t1 === t2) errors.push(`black clock did not tick (${t1})`);
  // B plays e7e5, A d2d4, B captures exd4 -> Black up a pawn
  await c.getByRole("button", { name: "e7, black pawn", exact: true }).click();
  await c.getByRole("button", { name: "e5, empty", exact: true }).click();
  await a.getByRole("button", { name: "d2, white pawn", exact: true }).click();
  await a.getByRole("button", { name: "d4, empty", exact: true }).click();
  await c.getByRole("button", { name: "e5, black pawn", exact: true }).click();
  await c.getByRole("button", { name: "d4, white pawn", exact: true }).click();
  await expect(a.locator(".online-material-lead")).toHaveText("Black +1");
  await expect(c.locator(".online-material-lead")).toHaveText("Black +1");
  await expect(a.locator(".online-captured").nth(1).locator("img")).toHaveCount(1);
  // Move list shows both rows
  await expect(a.locator(".online-move-row").nth(1)).toContainText("d4");
  await expect(a.locator(".online-move-row").nth(1)).toContainText("xd4");
  // Flip board: first square becomes h1 for A
  await a.getByRole("button", { name: "Flip board", exact: true }).click();
  await expect(a.locator(".court-board button").first()).toHaveAccessibleName(/h1/);
  // A resigns; result banner with rematch appears on both screens
  await a.getByRole("button", { name: "Resign", exact: true }).click();
  await expect(a.locator(".online-result")).toContainText("black wins by resignation");
  await expect(c.locator(".online-result")).toContainText("black wins by resignation");
  await a.screenshot({ path: "/downloads/v9-gameover.png" });
  // A requests a rematch; B accepts; A is now Black
  await a.locator(".online-result").getByRole("button", { name: /Rematch/ }).click();
  await c.getByRole("button", { name: "Accept challenge", exact: true }).click();
  await expect(a.getByText("You are black.", { exact: false })).toBeVisible();
  await expect(c.getByText("You are white.", { exact: false })).toBeVisible();
  await expect(a.locator(".online-material-lead")).toHaveText("Level material");
  console.log(JSON.stringify({ ux: true, glide: true, clocks: true, material: true, rematch: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
