// Batch-2/3 UX verification: live clocks, piece glide, move list, material
// strip, flip board, copy code, result banner, rematch with colour swap,
// last-move ring, check ring, lobby status labels.
const { chromium, expect } = require("@playwright/test");
// This box is slow under load: give every web-first assertion room.
expect.configure({ timeout: 20_000 });
(async () => {
  const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
  const announce = async (page) =>
    (await page.locator(".sr-only[role=status]").textContent())?.trim() ?? "";
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
  // First-run hints: visible for a fresh player, dismiss persists on reload
  await expect(c.locator(".online-hints")).toBeVisible();
  await c.screenshot({ path: "/downloads/v9-hints.png" });
  await c.locator(".online-hints").getByRole("button", { name: "Got it", exact: true }).click();
  await expect(c.locator(".online-hints")).toHaveCount(0);
  await c.reload();
  await c.getByRole("button", { name: "Online PvP", exact: true }).click();
  await expect(c.locator(".online-shell")).toBeVisible();
  await expect(c.locator(".online-hints")).toHaveCount(0);
  // A creates a standard room, B joins
  await a.getByLabel("Variant", { exact: true }).selectOption("chess");
  await a.getByLabel("Time per side", { exact: true }).selectOption("5|3");
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
  // Increment: A spent a few seconds but gained 3s back, so White's
  // clock reads at or above 5:00 right after the move.
  await expect(a.locator(".online-clocks")).toContainText(/White 5:0/, { timeout: 5000 });
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
  // A plays d4 through the keyboard input (SAN form); a bad input errors
  await a.getByLabel("Type a move", { exact: true }).fill("Ke3");
  await a.getByRole("button", { name: "Play move", exact: true }).click();
  await expect(a.locator(".online-keyboard-error")).toHaveText("Not a legal move here.");
  await a.getByLabel("Type a move", { exact: true }).fill("d4");
  await a.getByRole("button", { name: "Play move", exact: true }).click();
  await c.getByRole("button", { name: "e5, black pawn", exact: true }).click();
  await c.getByRole("button", { name: "d4, white pawn", exact: true }).click();
  await expect(a.locator(".online-material-lead")).toHaveText("Black +1");
  await expect(c.locator(".online-material-lead")).toHaveText("Black +1");
  // Opening name follows the book line (ECO table)
  await expect(a.locator(".online-opening")).toContainText("Center Game Accepted");
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
  // Arrow-key review: Left from live enters one move back, Home/End jump
  await a.keyboard.press("ArrowLeft");
  await expect(a.locator(".online-review")).toContainText("Viewing move 3 of 4");
  await a.keyboard.press("ArrowLeft");
  await expect(a.locator(".online-review")).toContainText("Viewing move 2 of 4");
  await a.keyboard.press("Home");
  await expect(a.locator(".online-review")).toContainText("Viewing move 1 of 4");
  await a.keyboard.press("ArrowRight");
  await expect(a.locator(".online-review")).toContainText("Viewing move 2 of 4");
  await a.keyboard.press("End");
  await expect(a.locator(".online-review")).toHaveCount(0);
  await expect(a.locator(".online-material-lead")).toHaveText("Black +1");
  await a.keyboard.press("ArrowLeft");
  await expect(a.locator(".online-review")).toContainText("Viewing move 3 of 4");
  await a.keyboard.press("Escape");
  await expect(a.locator(".online-review")).toHaveCount(0);
  await a.screenshot({ path: "/downloads/v9-review-keys.png" });
  // Flip board: first square becomes h1 for A
  await a.getByRole("button", { name: "Flip board", exact: true }).click();
  await expect(a.locator(".court-board button").first()).toHaveAccessibleName(/h1/);
  // Takeback: A asks, C accepts, last move (exd4) is undone; C replays it
  await a.getByRole("button", { name: "Takeback", exact: true }).click();
  await expect(a.locator(".online-draw")).toContainText("You asked to undo the last move");
  await expect(c.locator(".online-draw")).toContainText("asks to undo the last move");
  await a.screenshot({ path: "/downloads/v9-takeback.png" });
  await c.locator(".online-draw").getByRole("button", { name: "Accept", exact: true }).click();
  await expect(a.locator(".online-move-row")).toHaveCount(2);
  await expect(a.locator(".online-material-lead")).toHaveText("Level material");
  await expect(c.getByText("black to move", { exact: false })).toBeVisible();
  await c.getByRole("button", { name: "e5, black pawn", exact: true }).click();
  await c.getByRole("button", { name: "d4, white pawn", exact: true }).click();
  await expect(a.locator(".online-material-lead")).toHaveText("Black +1");
  // Takeback again, this time C declines and the request clears
  await a.getByRole("button", { name: "Takeback", exact: true }).click();
  await c.locator(".online-draw").getByRole("button", { name: "Decline", exact: true }).click();
  await expect(a.locator(".online-draw")).toHaveCount(0);
  // Sound toggle: flips both ways and shows its state
  await a.getByRole("button", { name: "Sound on", exact: true }).click();
  await expect(a.getByRole("button", { name: "Sound off", exact: true })).toBeVisible();
  await a.getByRole("button", { name: "Sound off", exact: true }).click();
  await expect(a.getByRole("button", { name: "Sound on", exact: true })).toBeVisible();
  // Keyboard board play: arrows move square focus (no wrap at the h-file),
  // Enter selects and plays; arrows on the board must not open review.
  // (The board was flipped earlier - flip it back to White's view first.)
  await a.getByRole("button", { name: "Flip board", exact: true }).click();
  await a.getByRole("button", { name: "h3, empty", exact: true }).focus();
  await a.keyboard.press("ArrowRight"); // edge: stays on h3, no wrap
  await expect(a.locator(":focus")).toHaveAccessibleName("h3, empty");
  await a.keyboard.press("ArrowLeft");
  await expect(a.locator(":focus")).toHaveAccessibleName("g3, empty");
  await expect(a.locator(".online-review")).toHaveCount(0);
  await a.getByRole("button", { name: "g1, white knight", exact: true }).focus();
  await a.keyboard.press("Enter");
  await expect(a.locator(".square.selected")).toHaveCount(1);
  await a.screenshot({ path: "/downloads/v9-keyboard-board.png" });
  await a.getByRole("button", { name: "f3, empty", exact: true }).focus();
  await a.keyboard.press("Enter");
  await expect(a.locator(".online-move-row").nth(2)).toContainText("Nf3");
  await expect(a.locator(".online-opening")).toContainText("Center Game: Kieseritzky Variation");
  // Screen-reader live region announces the latest move on both screens
  await expect.poll(() => announce(c), { timeout: 20_000 }).toMatch(/played Nf3\.$/);
  await expect.poll(() => announce(a), { timeout: 20_000 }).toMatch(/played Nf3\.$/);
  // Draw offer banner: A offers, B sees and declines; A re-offers, withdraws
  await a.getByRole("button", { name: "Offer draw", exact: true }).click();
  await expect(c.locator(".online-draw")).toContainText("offers a draw");
  await c.locator(".online-draw").getByRole("button", { name: "Decline", exact: true }).click();
  await expect(c.locator(".online-draw")).toHaveCount(0);
  await expect(a.locator(".online-draw")).toHaveCount(0);
  await a.getByRole("button", { name: "Offer draw", exact: true }).click();
  await expect(a.locator(".online-draw")).toContainText("You offered a draw", { timeout: 20_000 });
  await a.locator(".online-draw").getByRole("button", { name: "Withdraw offer", exact: true }).click();
  await expect(a.locator(".online-draw")).toHaveCount(0);
  // Resign is a two-step inline confirm: first step can be cancelled
  await a.getByRole("button", { name: "Resign", exact: true }).click();
  await a.getByRole("button", { name: "Keep playing", exact: true }).click();
  await expect(a.locator(".online-result")).toHaveCount(0);
  await a.getByRole("button", { name: "Resign", exact: true }).click();
  await a.getByRole("button", { name: "Confirm resign", exact: true }).click();
  await expect(a.locator(".online-result")).toContainText("black wins by resignation");
  await expect(c.locator(".online-result")).toContainText("black wins by resignation");
  await expect.poll(() => announce(c), { timeout: 20_000 }).toMatch(/Game over: black wins by resignation/);
  // Game-end summary: move count and the opening the game followed
  await expect(a.locator(".online-result")).toContainText("5 moves played");
  await expect(a.locator(".online-result")).toContainText("Center Game: Kieseritzky Variation");
  await a.screenshot({ path: "/downloads/v9-gameover.png" });
  // Copy PGN: exports the game score; button flips to "PGN copied"
  await a.locator(".online-result").getByRole("button", { name: "Copy PGN", exact: true }).click();
  await expect(a.locator(".online-result").getByRole("button", { name: "PGN copied", exact: true })).toBeVisible();
  const pgn = await a.evaluate(() => navigator.clipboard.readText());
  if (!pgn.includes('[Result "0-1"]') || !pgn.includes("1. e4 e5") || !pgn.trimEnd().endsWith("0-1")) errors.push("pgn export missing result or moves");
  if (pgn.includes("[Variant")) errors.push("standard chess PGN should not carry a Variant header");
  if (!pgn.includes('[White "') || !pgn.includes("[TimeControl ")) errors.push("pgn export missing headers");
  await a.screenshot({ path: "/downloads/v9-pgn.png" });
  // A requests a rematch; B accepts; A is now Black
  await a.locator(".online-result").getByRole("button", { name: /Rematch/ }).click();
  await c.getByRole("button", { name: "Accept challenge", exact: true }).click();
  await expect(a.getByText("You are black.", { exact: false })).toBeVisible();
  await expect(c.getByText("You are white.", { exact: false })).toBeVisible();
  await expect(a.locator(".online-material-lead")).toHaveText("Level material");
  // Lobby labels: C (white) is to move in the rematch, A (black) waits
  await expect(c.getByRole("button", { name: /Biru vs Asha · Standard chess · 5 min \+ 3s · your turn/ })).toBeVisible();
  await expect(a.getByRole("button", { name: /Biru vs Asha · Standard chess · 5 min \+ 3s · opponent's turn/ })).toBeVisible();
  // Lobby rows carry a valid relative time - never NaN (regression: rooms
  // persisted before activityAt existed produced "NaNd ago")
  await expect(a.getByText("NaN", { exact: false })).toHaveCount(0);
  await expect(c.getByText("NaN", { exact: false })).toHaveCount(0);
  // (two lobby rows match - strict mode needs .first())
  await expect(c.getByRole("button", { name: /just now|ago/ }).first()).toBeVisible();
  // Lobby filter chips: Finished shows only the resigned game; Needs you
  // shows the active rematch for C (white to move)
  await c.getByRole("button", { name: "Finished", exact: true }).click();
  await expect(c.getByRole("button", { name: /black wins by resignation/ })).toBeVisible();
  await expect(c.getByRole("button", { name: /your turn/ })).toHaveCount(0);
  await c.getByRole("button", { name: "Needs you", exact: true }).click();
  await expect(c.getByRole("button", { name: /Biru vs Asha · Standard chess · 5 min \+ 3s · your turn/ })).toBeVisible();
  await expect(c.getByRole("button", { name: /resignation/ })).toHaveCount(0);
  await c.getByRole("button", { name: "All", exact: true }).click();
  await expect(c.getByRole("button", { name: /resignation/ })).toBeVisible();
  // Fool's mate in the rematch: 1.f3 e5 2.g4 Qh4# -> check ring + result
  await c.getByRole("button", { name: "f2, white pawn", exact: true }).click();
  await c.getByRole("button", { name: "f3, empty", exact: true }).click();
  await expect(a.locator(".square.last-move")).toHaveCount(2);
  await a.getByRole("button", { name: "e7, black pawn", exact: true }).click();
  await a.getByRole("button", { name: "e5, empty", exact: true }).click();
  // Sync: C must see e5 played before moving (avoids racing the board)
  await expect(c.getByRole("button", { name: "e5, black pawn", exact: true })).toBeVisible();
  await c.getByRole("button", { name: "g2, white pawn", exact: true }).click();
  await c.getByRole("button", { name: "g4, empty", exact: true }).click();
  // Sync: A must see g4 before the mating move
  await expect(a.getByRole("button", { name: "g4, white pawn", exact: true })).toBeVisible();
  await a.getByRole("button", { name: "d8, black queen", exact: true }).click();
  await a.getByRole("button", { name: "h4, empty", exact: true }).click();
  // Checkmate: white king square flagged, result banner on both screens
  await expect(a.locator(".square.in-check")).toHaveCount(1);
  await expect(c.locator(".square.in-check")).toHaveCount(1);
  await expect(a.locator(".online-result")).toContainText("black wins");
  await expect(c.locator(".online-result")).toContainText("black wins");
  await a.screenshot({ path: "/downloads/v9-checkmate.png" });
  // Crazyhouse: captures fill the pocket; pieces drop back onto the board
  await a.getByLabel("Variant", { exact: true }).selectOption("crazyhouse");
  // The create panel explains the selected variant under the select
  await expect(a.locator(".online-variant-summary")).toContainText(/captured|Captured/);
  await a.screenshot({ path: "/downloads/v9-variant-summary.png" });
  await a.getByLabel("Time per side", { exact: true }).selectOption("5|0");
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
  // Wait for the NEW waiting room to render before reading its code -
  // the finished rematch game still shows its own (dead) code.
  await expect(a.getByText("Share the room code.", { exact: false })).toBeVisible();
  const zcode = (await a.locator("code").first().textContent()).trim();
  await c.getByLabel("Room code", { exact: true }).fill(zcode);
  await c.getByRole("button", { name: "Join room", exact: true }).click();
  await expect(c.getByText("You are black.", { exact: false })).toBeVisible();
  await a.getByRole("button", { name: "e2, white pawn", exact: true }).click();
  await a.getByRole("button", { name: "e4, empty", exact: true }).click();
  await c.getByRole("button", { name: "d7, black pawn", exact: true }).click();
  await c.getByRole("button", { name: "d5, empty", exact: true }).click();
  await a.getByRole("button", { name: "e4, white pawn", exact: true }).click();
  await a.getByRole("button", { name: "d5, black pawn", exact: true }).click();
  // A's pocket now holds the captured pawn
  await expect(a.getByLabel("Drop from your pocket", { exact: false })).toBeVisible();
  await c.getByRole("button", { name: "d8, black queen", exact: true }).click();
  await c.getByRole("button", { name: "d5, white pawn", exact: true }).click();
  await a.getByLabel("Drop from your pocket", { exact: false }).selectOption("P");
  await a.getByRole("button", { name: "d6, empty", exact: true }).click();
  await expect(a.locator(".online-move-row").nth(2)).toContainText("@d6");
  await expect(c.getByRole("button", { name: "d6, white pawn", exact: true })).toBeVisible();
  // A resigns the crazyhouse game through the inline confirm
  await a.getByRole("button", { name: "Resign", exact: true }).click();
  await a.getByRole("button", { name: "Confirm resign", exact: true }).click();
  await expect(a.locator(".online-result")).toContainText("resignation");
  // Mobile: standard game fits 375px with no horizontal overflow
  await a.setViewportSize({ width: 375, height: 780 });
  await a.screenshot({ path: "/downloads/v9-mobile.png", fullPage: true });
  if (await a.evaluate(() => document.documentElement.scrollWidth > innerWidth)) errors.push("mobile overflow on standard game");
  await a.setViewportSize({ width: 1366, height: 950 });
  console.log(JSON.stringify({ ux: true, glide: true, clocks: true, material: true, rematch: true, lastMove: true, check: true, lobby: true, review: true, premove: true, drawBanner: true, lobbyChips: true, keyboard: true, pgn: true, reviewKeys: true, takeback: true, sound: true, boardKeys: true, hints: true, opening: true, endSummary: true, mobile: true, increment: true, resignInline: true, crazyhouse: true, announce: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
