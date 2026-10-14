// Draw offers (offer/decline/withdraw/accept) and takebacks
// (ask/decline/withdraw/accept) work end to end, chess.com style.
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
    await p.getByRole("textbox", { name: /Username/ }).fill("dt" + name + stamp);
    await p.getByLabel("Display name", { exact: true }).fill(name);
    const profileResp = p.waitForResponse((r) => r.url().includes("/api/profile"), { timeout: 20_000 });
    await p.getByRole("button", { name: "Save profile", exact: true }).click();
    const pr = await profileResp;
    if (pr.status() !== 200) console.log("PROFILE SAVE FAILED:", name, pr.status(), await pr.text());
    await expect(p.getByRole("button", { name: "Save profile", exact: true })).toBeEnabled();
    await p.getByRole("button", { name: "PvP", exact: true }).click();
    return p;
  };
  a = await mk("Diya"), c = await mk("Ravi");
  // The lobby has no polling - missed websocket pushes are never refetched,
  // so wait for both live connections before creating or joining rooms.
  await expect(a.getByText(/· Connected/)).toBeVisible();
  await expect(c.getByText(/· Connected/)).toBeVisible();
  // The banner shows at socket open, before the server authenticates the
  // socket; a join landing in that gap never reaches A (no polling, and no
  // later publish). Give the handshake a moment.
  await a.waitForTimeout(2000);
  await a.getByLabel("Variant", { exact: true }).selectOption("chess");
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
  await expect(a.locator("code").first()).toBeVisible();
  const code = (await a.locator("code").first().textContent()).trim();
  await c.getByLabel("Room code", { exact: true }).fill(code);
  await c.getByLabel("Room code", { exact: true }).press("Enter");
  await expect(c.getByText("You are black.", { exact: false })).toBeVisible();
  await expect(a.getByText("white to move", { exact: false })).toBeVisible();
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
  // Draw offers: offer, decline, withdraw, then accept ends the game.
  await a.getByRole("button", { name: "Offer draw", exact: true }).click();
  await expect(a.getByText("You offered a draw.")).toBeVisible();
  await expect(c.getByText("Diya offers a draw.")).toBeVisible();
  await c.getByRole("button", { name: "Decline", exact: true }).click();
  await expect(a.getByText("You offered a draw.")).toHaveCount(0);
  await a.getByRole("button", { name: "Offer draw", exact: true }).click();
  await expect(a.getByText("You offered a draw.")).toBeVisible();
  await a.getByRole("button", { name: "Withdraw offer", exact: true }).click();
  await expect(a.getByText("You offered a draw.")).toHaveCount(0);
  await expect(c.getByText("Diya offers a draw.")).toHaveCount(0);
  await a.getByRole("button", { name: "Offer draw", exact: true }).click();
  await c.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(a.locator(".online-result")).toContainText("Draw by agreement");
  await expect(c.locator(".online-result")).toContainText("Draw by agreement");
  // Takebacks: rematch (colours swap), then ask, decline, withdraw, accept.
  await a.getByRole("button", { name: /Rematch/ }).click();
  await c.getByRole("button", { name: "Accept challenge", exact: true }).click();
  await expect(c.getByText("You are white.", { exact: false })).toBeVisible();
  await a.reload();
  await a.getByRole("button", { name: "Online PvP", exact: true }).click();
  await a.locator(".online-person").getByText(/Ravi vs Diya/).first().click();
  await expect(a.getByText("white to move", { exact: false })).toBeVisible();
  await play(c, "e2, white pawn", "e4, empty");
  await expect(c.getByRole("button", { name: "Takeback", exact: true })).toBeVisible();
  await c.getByRole("button", { name: "Takeback", exact: true }).click();
  await expect(c.getByText("You asked to undo the last move.")).toBeVisible();
  await expect(a.getByText("Ravi asks to undo the last move.")).toBeVisible();
  await a.getByRole("button", { name: "Decline", exact: true }).click();
  await expect(c.getByText("You asked to undo the last move.")).toHaveCount(0);
  await expect(c.locator(".online-moves")).toContainText("e4");
  await c.getByRole("button", { name: "Takeback", exact: true }).click();
  await expect(c.getByText("You asked to undo the last move.")).toBeVisible();
  await c.getByRole("button", { name: "Withdraw request", exact: true }).click();
  await expect(a.getByText("Ravi asks to undo the last move.")).toHaveCount(0);
  await c.getByRole("button", { name: "Takeback", exact: true }).click();
  await a.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(c.locator(".online-moves")).not.toContainText("e4");
  await expect(c.getByText("white to move", { exact: false })).toBeVisible();
  await expect(c.getByRole("button", { name: "Takeback", exact: true })).toHaveCount(0);
  // Mutual offers settle at once, chess.com style: offering back accepts.
  await a.getByRole("button", { name: "Offer draw", exact: true }).click();
  await expect(c.getByText("Diya offers a draw.")).toBeVisible();
  await c.getByRole("button", { name: "Offer draw", exact: true }).click();
  await expect(a.locator(".online-result")).toContainText("Draw by agreement");
  await expect(c.locator(".online-result")).toContainText("Draw by agreement");
  await c.waitForTimeout(1200);
  await c.locator(".online-result").scrollIntoViewIfNeeded();
  await c.screenshot({ path: "/downloads/v9-draw-takeback.png" });
  console.log(JSON.stringify({ drawTakeback: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch(async (e) => {
  console.error("PAGEERRORS:", JSON.stringify(errors));
  try { console.error("A TEXT:", (await a.locator("main").innerText()).replace(/\n/g, " | ").slice(0, 1600)); } catch {}
  try { console.error("C TEXT:", (await c.locator("main").innerText()).replace(/\n/g, " | ").slice(0, 1600)); } catch {}
  console.error(e && e.message ? e.message.split("\n").slice(0, 5).join("\n") : e);
  process.exit(1);
});
