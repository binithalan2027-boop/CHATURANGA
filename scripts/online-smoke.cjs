const { chromium, expect } = require("@playwright/test");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    args: ["--no-sandbox"],
  });
  const ca = await b.newContext({ viewport: { width: 1366, height: 900 } }),
    cb = await b.newContext({ viewport: { width: 1366, height: 900 } });
  const a = await ca.newPage(),
    c = await cb.newPage();
  const errors = [];
  for (const p of [a, c]) {
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://127.0.0.1:5173");
    await p.getByRole("button", { name: "Online PvP", exact: true }).click();
    await p.getByRole("button", { name: "Create local test player" }).click();
    await p.getByRole("button", { name: "Set up profile" }).click();
  }
  for (const [p, name] of [
    [a, "alpha"],
    [c, "bravo"],
  ]) {
    await p
      .getByRole("textbox", { name: /Username/ })
      .fill(name + Date.now().toString().slice(-6));
    await p.getByLabel("Display name", { exact: true }).fill(name);
    await p.getByLabel("Allow people").check();
    await p.getByLabel("I am 18").check();
    await p.getByRole("button", { name: "Save profile", exact: true }).click();
    await p.getByRole("button", { name: "PvP", exact: true }).click();
  }
  await a
    .getByRole("button", { name: "Create private room", exact: true })
    .click();
  await expect(a.locator("code")).toBeVisible();
  const code = await a.locator("code").textContent();
  await c.getByLabel("Room code", { exact: true }).fill(code);
  await c.getByRole("button", { name: "Join room", exact: true }).click();
  await expect(
    a.getByText("You are white. white to move.", { exact: false }),
  ).toBeVisible();
  await a.getByRole("button", { name: "e2, white pawn", exact: true }).click();
  await a.getByRole("button", { name: "e4, empty", exact: true }).click();
  await expect(
    c.getByRole("button", { name: "e4, white pawn", exact: true }),
  ).toBeVisible();
  await c.getByRole("button", { name: "e7, black pawn", exact: true }).click();
  await c.getByRole("button", { name: "e5, empty", exact: true }).click();
  await expect(
    a.getByRole("button", { name: "e5, black pawn", exact: true }),
  ).toBeVisible();
  const squares = await a.locator(".online-game .square").evaluateAll((nodes) =>
    nodes.every((n) => {
      const r = n.getBoundingClientRect(),
        b = n.parentElement.getBoundingClientRect();
      return r.left >= b.left && r.right <= b.right && r.width > 20;
    }),
  );
  if (!squares) throw Error("board clipped");
  await a.screenshot({ path: "/tmp/chaturanga-v6-pvp.png", fullPage: true });
  await a.setViewportSize({ width: 320, height: 820 });
  await a.screenshot({
    path: "/tmp/chaturanga-v6-pvp-mobile.png",
    fullPage: true,
  });
  await a.setViewportSize({ width: 1366, height: 900 });
  // reload, restore authenticated player and match
  await c.reload();
  await c.getByRole("button", { name: "Online PvP", exact: true }).click();
  await c.getByRole("button", { name: /alpha vs bravo/ }).click();
  await expect(
    c.getByRole("button", { name: "e5, black pawn", exact: true }),
  ).toBeVisible();
  await c.getByRole("button", { name: "Offer draw", exact: true }).click();
  await a.getByRole("button", { name: "Accept draw", exact: true }).click();
  await expect(
    a.getByText("Draw by agreement", { exact: false }),
  ).toBeVisible();
  await a.getByRole("button", { name: "Profile", exact: true }).last().click();
  await expect(a.getByText("1 game", { exact: false })).toBeVisible();
  await a.screenshot({
    path: "/tmp/chaturanga-v6-profile.png",
    fullPage: true,
  });
  await a.setViewportSize({ width: 320, height: 820 });
  await a.screenshot({ path: "/tmp/chaturanga-v6-mobile.png", fullPage: true });
  const overflow = await a.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  console.log(
    JSON.stringify(
      { errors, overflow, code, twoBrowserPvp: true, reload: true, draw: true },
      null,
      2,
    ),
  );
  await b.close();
})();
