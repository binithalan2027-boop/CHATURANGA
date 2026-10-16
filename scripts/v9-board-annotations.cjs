// Board annotations: right-click highlights a square, right-drag draws an
// arrow, and drawings clear on the next left-click or move (chess.com style).
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
    await p.getByRole("textbox", { name: /Username/ }).fill("ba" + name + stamp);
    await p.getByLabel("Display name", { exact: true }).fill(name);
    const profileResp = p.waitForResponse((r) => r.url().includes("/api/profile"), { timeout: 20_000 });
    await p.getByRole("button", { name: "Save profile", exact: true }).click();
    const pr = await profileResp;
    if (pr.status() !== 200) console.log("PROFILE SAVE FAILED:", name, pr.status(), await pr.text());
    await expect(p.getByRole("button", { name: "Save profile", exact: true })).toBeEnabled();
    await p.getByRole("button", { name: "PvP", exact: true }).click();
    return p;
  };
  a = await mk("Ana"), c = await mk("Ben");
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
  const sq = (name) => a.getByRole("button", { name: new RegExp("^" + name + ",") });
  // Right-click highlights, right-click again clears the highlight.
  await sq("e2").click({ button: "right" });
  await expect(a.locator(".draw-mark")).toHaveCount(1);
  await sq("e2").click({ button: "right" });
  await expect(a.locator(".draw-mark")).toHaveCount(0);
  // Right-drag e2 -> e4 draws an arrow; repeating the drag removes it.
  const e2 = await sq("e2").boundingBox();
  const e4 = await sq("e4").boundingBox();
  const centre = (bx) => ({ x: bx.x + bx.width / 2, y: bx.y + bx.height / 2 });
  const from = centre(e2), to = centre(e4);
  await a.mouse.move(from.x, from.y);
  await a.mouse.down({ button: "right" });
  await a.mouse.move(to.x, to.y, { steps: 6 });
  await a.mouse.up({ button: "right" });
  await expect(a.locator(".draw-arrow")).toHaveCount(1);
  await sq("e4").click({ button: "right" });
  await expect(a.locator(".draw-mark")).toHaveCount(1);
  await a.screenshot({ path: "/downloads/v9-annotations.png" });
  // A left-click clears the drawings, like clicking the board on chess.com.
  await sq("d2").click();
  await expect(a.locator(".draw-arrow")).toHaveCount(0);
  await expect(a.locator(".draw-mark")).toHaveCount(0);
  // A fresh arrow also clears once the position changes.
  await a.mouse.move(from.x, from.y);
  await a.mouse.down({ button: "right" });
  await a.mouse.move(to.x, to.y, { steps: 6 });
  await a.mouse.up({ button: "right" });
  await expect(a.locator(".draw-arrow")).toHaveCount(1);
  const play = async (p, fromSq, toSq) => {
    const src = p.getByRole("button", { name: fromSq, exact: true });
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
    await p.getByRole("button", { name: toSq, exact: true }).click();
  };
  await play(a, "e2, white pawn", "e4, empty");
  await expect(a.locator(".draw-arrow")).toHaveCount(0);
  console.log(JSON.stringify({ annotations: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch(async (e) => {
  console.error("PAGEERRORS:", JSON.stringify(errors));
  try { console.error("A TEXT:", (await a.locator("main").innerText()).replace(/\n/g, " | ").slice(0, 1600)); } catch {}
  console.error(e && e.message ? e.message.split("\n").slice(0, 5).join("\n") : e);
  process.exit(1);
});
