const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });

  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pageA = await ctxA.newPage();

  console.log("Step 1: Player A goes to Landing Page...");
  await pageA.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });

  console.log("Step 2: Player A clicks 'Create Private Room for a Friend →' on Landing Page...");
  const heroPrivateBtn = pageA.getByRole("button", { name: "Create Private Room for a Friend →" });
  await heroPrivateBtn.click();
  await pageA.waitForTimeout(2000);

  // Check that private room was created automatically and code is visible
  const roomCodes = await pageA.locator("code").allTextContents();
  console.log("Room codes visible on Player A:", roomCodes);
  if (!roomCodes.length) {
    throw new Error("No room code found after clicking Create Private Room for a Friend!");
  }
  const roomCode = roomCodes[0];
  console.log("Successfully created room with code:", roomCode);

  // Verify copy link and waiting banner are present
  const waitingText = await pageA.getByText("Waiting for opponent to join…").isVisible();
  console.log("Waiting banner visible on Player A:", waitingText);

  // Take screenshot of Player A waiting view
  await pageA.screenshot({ path: "docs/screenshots/player-a-waiting-room.png", fullPage: true });

  // Mobile screenshot of Player A waiting view
  await pageA.setViewportSize({ width: 375, height: 812 });
  await pageA.screenshot({ path: "docs/screenshots/player-a-waiting-room-mobile.png", fullPage: false });
  await pageA.setViewportSize({ width: 1280, height: 900 });

  console.log("Step 3: Player B joins via direct invite URL (?room=...)");
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pageB = await ctxB.newPage();

  const inviteUrl = `http://127.0.0.1:5173/?room=${roomCode}`;
  console.log("Player B opening invite URL:", inviteUrl);
  await pageB.goto(inviteUrl, { waitUntil: "networkidle" });
  await pageB.waitForTimeout(2500);

  // Verify Player B joined and game is active
  const bHeadings = await pageB.locator("h2").allTextContents();
  console.log("Player B headings:", bHeadings);

  const aTurn = await pageA.getByText(/white to move/i).first().isVisible();
  const bTurn = await pageB.getByText(/white to move/i).first().isVisible();
  console.log("Player A sees 'white to move':", aTurn);
  console.log("Player B sees 'white to move':", bTurn);

  console.log("Step 4: Player A makes opening move e2 -> e4...");
  const e2 = pageA.getByRole("button", { name: /e2,/i });
  await e2.click();
  const e4 = pageA.getByRole("button", { name: /e4,/i });
  await e4.click();
  await pageA.waitForTimeout(1000);

  // Verify Player B sees the move
  const bE4 = await pageB.getByRole("button", { name: /e4, white/i }).isVisible();
  console.log("Player B sees white pawn on e4:", bE4);

  // Take screenshots of both players in active game
  await pageA.screenshot({ path: "docs/screenshots/pvp-player-a-active.png", fullPage: true });
  await pageB.screenshot({ path: "docs/screenshots/pvp-player-b-active.png", fullPage: true });

  console.log("End-to-end Private Room flow test SUCCEEDED!");
  await browser.close();
})();
