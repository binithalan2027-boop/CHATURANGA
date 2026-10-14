// Mind Before Move coverage: question gate before every move, solved
// answers unlock the board, the move lands on both screens.
const { chromium, expect } = require("@playwright/test");
expect.configure({ timeout: 20_000 });
const solve = (text) => {
  const t = text.replace("Maths question:", "").trim();
  if (t.includes("%")) {
    const [x, y] = t.split("% of ").map(Number);
    return String((x * y) / 100);
  }
  const expr = t.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/=\s*\?$/, "").trim();
  if (!/^[\d\s+*/()\-]+$/.test(expr)) throw Error("Bad question: " + t);
  return String(Function("return " + expr)());
};
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
    await p.getByRole("textbox", { name: /Username/ }).fill("md" + name + stamp);
    await p.getByLabel("Display name", { exact: true }).fill(name);
    await p.getByRole("button", { name: "Save profile", exact: true }).click();
    await expect(p.getByRole("button", { name: "Save profile", exact: true })).toBeEnabled();
    await p.getByRole("button", { name: "PvP", exact: true }).click();
    return p;
  };
  const a = await mk("Nia"), c = await mk("Omkar");
  await a.getByLabel("Custom mode", { exact: true }).selectOption("mind");
  await a.getByRole("button", { name: "Create custom room", exact: true }).click();
  const code = (await a.locator(".custom-game code").textContent()).trim();
  await c.getByLabel("Custom room code", { exact: true }).fill(code);
  await c.getByLabel("Custom room code", { exact: true }).press("Enter");
  // White's move is gated behind a maths question; solve it, then move
  const gate = a.getByLabel("Maths question:", { exact: false });
  await expect(gate).toBeVisible();
  for (let i = 0; i < 6; i++) {
    const text = await gate.locator("..").innerText();
    await gate.fill(solve(text));
    await a.getByRole("button", { name: "Submit answer", exact: true }).click();
    if (await a.getByText("Select a piece, then its destination.", { exact: true }).count()) break;
    await expect(gate).toBeVisible();
  }
  await expect(a.getByText("Select a piece, then its destination.", { exact: true })).toBeVisible();
  await a.getByRole("button", { name: "e2, w p", exact: true }).click();
  await a.getByRole("button", { name: "e4, empty", exact: true }).click();
  await expect(a.getByRole("button", { name: "e4, w p", exact: true })).toBeVisible();
  await expect(c.getByRole("button", { name: "e4, w p", exact: true })).toBeVisible();
  await a.screenshot({ path: "/downloads/v9-mind.png", fullPage: true });
  console.log(JSON.stringify({ mind: true, gate: true, errors }, null, 2));
  await b.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
