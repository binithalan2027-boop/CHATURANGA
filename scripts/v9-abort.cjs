// Abort coverage: either player can abort before each side has moved; the window then closes.
const { chromium, expect } = require("@playwright/test");
expect.configure({ timeout: 20_000 });
const errors = [];
let a, c;
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
    return p;
  };
  a = await mk("Ira"), c = await mk("Jai");
  // The lobby has no polling - missed websocket pushes are never refetched,
  // so wait for both live connections before creating or joining rooms.
  await expect(a.getByText(/· Connected/)).toBeVisible();
  await expect(c.getByText(/· Connected/)).toBeVisible();
  // The banner shows at socket open, before the server authenticates the
  // socket; a join landing in that gap never reaches A (no polling, and no
  // later publish). Give the handshake a moment.
  await a.waitForTimeout(2000);
  await a.getByLabel("Variant", { exact: true }).selectOption("chess");
  await expect(a.locator(".online-variant-summary")).toContainText(/Checkmate the opposing king/);
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
  await expect(a.locator("code").first()).toBeVisible();
  const code = (await a.locator("code").first().textContent()).trim();
  await c.getByLabel("Room code", { exact: true }).fill(code);
  await c.getByLabel("Room code", { exact: true }).press("Enter");
  await expect(c.getByText("You are black.", { exact: false })).toBeVisible();
  await expect(a.getByText("white to move", { exact: false })).toBeVisible();
  // Slow-box safe: clicks can land before the board hydrates, so retry
  // the selection a few times when no highlight appears.
  const play = async (p, from, to) => {
    const src = p.getByRole("button", { name: from, exact: true });
    // Board clicks are ignored while the live socket is reconnecting, so
    // sync on the Connected banner, then retry while no selection appears.
    await expect(p.getByText(/· Connected/)).toBeVisible();
    await p.waitForTimeout(600);
    for (let attempt = 0; attempt < 5; attempt++) {
      await src.click();
      try {
        await expect(p.locator(".square.selected")).toHaveCount(1, { timeout: 2500 });
        break;
      } catch {
        if (attempt === 4)
          await expect(p.locator(".square.selected")).toHaveCount(1);
        else await p.waitForTimeout(500);
      }
    }
    await p.getByRole("button", { name: to, exact: true }).click();
  };
  // Abort is offered before any move and after a single move...
  await expect(a.getByRole("button", { name: "Abort", exact: true })).toBeVisible();
  await play(a, "e2, white pawn", "e4, empty");
  await expect(c.getByRole("button", { name: "Abort", exact: true })).toBeVisible();
  // ...but once both sides have moved the window closes
  await play(c, "e7, black pawn", "e5, empty");
  // A learns of Black's move by push; sync on the move list first
  await expect(a.locator(".online-moves")).toContainText("e5");
  await expect(a.getByRole("button", { name: "Abort", exact: true })).toHaveCount(0);
  await expect(c.getByRole("button", { name: "Abort", exact: true })).toHaveCount(0);
  // A second room: B aborts after White's first move, no result is recorded
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
  await expect(a.locator("code").first()).toBeVisible();
  const code2 = (await a.locator("code").first().textContent()).trim();
  await c.getByLabel("Room code", { exact: true }).fill(code2);
  await c.getByLabel("Room code", { exact: true }).press("Enter");
  await expect(c.getByText("You are black.", { exact: false })).toBeVisible();
  await play(a, "d2, white pawn", "d4, empty");
  await c.getByRole("button", { name: "Abort", exact: true }).click();
  await c.getByRole("button", { name: "Confirm abort", exact: true }).click();
  await expect(c.locator(".online-result")).toContainText("Game aborted");
  await expect(c.locator(".online-result")).not.toContainText("wins");
  await expect(c.getByText(/provisional private-match ratings/)).toHaveCount(0);
  await c.waitForTimeout(1200);
  await c.locator(".online-result").scrollIntoViewIfNeeded();
  await c.screenshot({ path: "/downloads/v9-abort.png" });
  console.log(JSON.stringify({ abort: true, windowCloses: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch(async (e) => {
  console.error("PAGEERRORS:", JSON.stringify(errors));
  console.error(e && e.message ? e.message.split("\n").slice(0, 5).join("\n") : e);
  process.exit(1);
});
