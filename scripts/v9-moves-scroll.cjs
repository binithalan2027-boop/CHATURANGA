// Move-list scroll behaviour: long games auto-scroll the move list to the
// newest move; clicking a move to review scrolls that move into view;
// leaving review returns to the live tail.
const { chromium, expect } = require("@playwright/test");
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
    await p.getByRole("textbox", { name: /Username/ }).fill("sc" + name + stamp);
    await p.getByLabel("Display name", { exact: true }).fill(name);
    await p.getByRole("button", { name: "Save profile", exact: true }).click();
    await expect(p.getByRole("button", { name: "Save profile", exact: true })).toBeEnabled();
    await p.getByRole("button", { name: "PvP", exact: true }).click();
    return p;
  };
  const a = await mk("Isha"), c = await mk("Jai");
  await a.getByRole("button", { name: "Create private room", exact: true }).click();
  const code = await a.locator("code").first().textContent();
  await c.getByLabel("Room code", { exact: true }).fill(code.trim());
  await c.getByRole("button", { name: "Join room", exact: true }).click();
  await expect(a.getByText("white to move", { exact: false })).toBeVisible();
  const play = async (p, san) => {
    await p.getByLabel("Type a move", { exact: true }).fill(san);
    await p.getByRole("button", { name: "Play move", exact: true }).click();
  };
  const white = ["e4", "Nf3", "Bb5", "Ba4", "O-O", "Re1", "Bb3", "c3", "d4", "h3"];
  const black = ["e5", "Nc6", "a6", "Nf6", "Be7", "b5", "d6", "O-O", "Bg4", "Bh5"];
  for (let i = 0; i < white.length; i++) {
    await play(a, white[i]);
    await play(c, black[i]);
  }
  // 20 plies = 10 rows: the list overflows its 10rem box and must pin to the tail
  await expect(a.locator(".online-move-row")).toHaveCount(10);
  const atBottom = () =>
    a.locator(".online-moves").evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight);
  await expect.poll(atBottom, { timeout: 10_000 }).toBeLessThan(4);
  // Review the very first move: the list scrolls up to show it
  await a.locator(".online-move-row").first().getByRole("button", { name: "e4", exact: true }).click();
  await expect(a.locator(".online-review")).toContainText("Viewing move 1 of 20");
  await expect.poll(atBottom, { timeout: 10_000 }).toBeGreaterThan(30);
  // Back to live pins the tail again
  await a.getByRole("button", { name: "Back to live", exact: true }).click();
  await expect.poll(atBottom, { timeout: 10_000 }).toBeLessThan(4);
  // Presence: closing B's tab marks the seat offline on A's screen within a few seconds
  await c.context().close();
  await expect(a.locator(".online-offline")).toContainText("Jai is offline", { timeout: 20_000 });
  console.log(JSON.stringify({ movesScroll: true, presence: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
