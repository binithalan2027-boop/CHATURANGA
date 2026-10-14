// Batch-2/3 UX verification: live clocks, piece glide, move list, material
// strip, flip board, copy code, result banner, rematch with colour swap,
// last-move ring, check ring, lobby status labels.
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
  // B queues a premove while it is still A's turn: e7e5 fires automatically
  await c.getByRole("button", { name: "e7, black pawn", exact: true }).click();
  await c.getByRole("button", { name: "e5, empty", exact: true }).click();
  await expect(c.locator(".square.premove")).toHaveCount(2);
  await expect(c.locator(".online-premove")).toContainText("Premove set");
  // A plays e2e4 (this is A's first move; B's premove fires right after)
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
  // Last-move ring highlights both touched squares (e2 and e4)
  await expect(a.locator(".square.last-move")).toHaveCount(2);
  // Numbered move list: B's premove fired right after A's move
  await expect(a.locator(".online-move-row").first()).toContainText("1.");
  await expect(a.locator(".online-move-row").first()).toContainText("e4");
  await expect(a.locator(".online-move-row").first()).toContainText("e5");
  await expect(c.locator(".square.premove")).toHaveCount(0);
  // Live clock: after 1.e4 e5 it is White's turn, so White's clock ticks
  const read = async () => (await a.locator(".online-clocks span").nth(0).textContent()).trim();
  const t1 = await read();
  await c.waitForTimeout(1600);
  const t2 = await read();
  if (t1 === t2) errors.push(`black clock did not tick (${t1})`);
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
  // Move-list step-through: click "e4" (ply 1) -> board rewinds read-only
  await a.locator(".online-moves").getByRole("button", { name: "e4", exact: true }).click();
  await expect(a.locator(".online-review")).toContainText("Viewing move 1 of 4");
  await expect(a.locator(".online-material-lead")).toHaveText("Level material");
  // Read-only while reviewing: board clicks must not select a piece
  await a.getByRole("button", { name: "e4, white pawn", exact: true }).click();
  await expect(a.locator(".square.selected")).toHaveCount(0);
  // Last-move ring follows the reviewed ply (e2/e4)
  await expect(a.locator(".square.last-move")).toHaveCount(2);
  await a.screenshot({ path: "/downloads/v9-review.png" });
  // Back to live restores the real board and material
  await a.getByRole("button", { name: "Back to live", exact: true }).click();
  await expect(a.locator(".online-material-lead")).toHaveText("Black +1");
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
  // Lobby labels: C (white) is to move in the rematch, A (black) waits
  await expect(c.getByRole("button", { name: /Biru vs Asha · chess · your turn/ })).toBeVisible();
  await expect(a.getByRole("button", { name: /Biru vs Asha · chess · opponent's turn/ })).toBeVisible();
  // Lobby rows carry a valid relative time - never NaN (regression: rooms
  // persisted before activityAt existed produced "NaNd ago")
  await expect(a.getByText("NaN", { exact: false })).toHaveCount(0);
  await expect(c.getByText("NaN", { exact: false })).toHaveCount(0);
  await expect(c.getByRole("button", { name: /just now|ago/ })).toBeVisible();
  // Fool's mate in the rematch: 1.f3 e5 2.g4 Qh4# -> check ring + result
  await c.getByRole("button", { name: "f2, white pawn", exact: true }).click();
  await c.getByRole("button", { name: "f3, empty", exact: true }).click();
  await expect(a.locator(".square.last-move")).toHaveCount(2);
  await a.getByRole("button", { name: "e7, black pawn", exact: true }).click();
  await a.getByRole("button", { name: "e5, empty", exact: true }).click();
  await c.getByRole("button", { name: "g2, white pawn", exact: true }).click();
  await c.getByRole("button", { name: "g4, empty", exact: true }).click();
  await a.getByRole("button", { name: "d8, black queen", exact: true }).click();
  await a.getByRole("button", { name: "h4, empty", exact: true }).click();
  // Checkmate: white king square flagged, result banner on both screens
  await expect(a.locator(".square.in-check")).toHaveCount(1);
  await expect(c.locator(".square.in-check")).toHaveCount(1);
  await expect(a.locator(".online-result")).toContainText("black wins");
  await expect(c.locator(".online-result")).toContainText("black wins");
  await a.screenshot({ path: "/downloads/v9-checkmate.png" });
  console.log(JSON.stringify({ ux: true, glide: true, clocks: true, material: true, rematch: true, lastMove: true, check: true, lobby: true, review: true, premove: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
