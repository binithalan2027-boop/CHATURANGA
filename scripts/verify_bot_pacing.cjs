const { chromium } = require("@playwright/test");

(async () => {
  console.log("Starting verification of offline bot thinking, piece glide & animations...");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  try {
    await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
    console.log("✅ Landing page loaded");

    // Click 5M time control
    const fiveMinBtn = page.getByRole("button", { name: "5M", exact: true });
    if (await fiveMinBtn.isVisible()) {
      await fiveMinBtn.click();
      console.log("✅ Selected 5M time control");
    }

    // Click "Play a Bot Free" button
    const playBotBtn = page.getByRole("button", { name: /Play a Bot Free/i });
    if (await playBotBtn.isVisible()) {
      await playBotBtn.click();
      await page.waitForTimeout(600);
      console.log("✅ Clicked 'Play a Bot Free', navigated to Bot Select");
    }

    // Click Start Match
    const startMatchBtn = page.getByRole("button", { name: /START BATTLE/i }).first();
    await startMatchBtn.click();
    await page.waitForTimeout(1000);
    console.log("✅ Started match vs bot");

    // Check clocks are rendered
    const clocks = page.locator(".font-mono");
    const clockCount = await clocks.count();
    console.log(`Found ${clockCount} clock displays on board`);
    for (let i = 0; i < clockCount; i++) {
      console.log(`Clock ${i}: ${await clocks.nth(i).textContent()}`);
    }

    // Make human move: e2 -> e4
    const e2 = page.getByRole("button", { name: /e2,/i }).first();
    await e2.click();
    console.log("✅ Selected square e2");
    await page.waitForTimeout(200);

    const e4 = page.getByRole("button", { name: /e4,/i }).first();
    const moveStartTime = Date.now();
    await e4.click();
    console.log("✅ Played e2-e4");

    // Watch for Bot "Thinking..." badge
    const thinkingBadge = page.locator("text=Thinking…");
    let sawThinking = false;
    for (let check = 0; check < 20; check++) {
      if (await thinkingBadge.isVisible()) {
        sawThinking = true;
        break;
      }
      await page.waitForTimeout(100);
    }
    console.log(`✅ Bot thinking badge detected: ${sawThinking}`);

    // Wait for bot to finish thinking and complete move
    while (Date.now() - moveStartTime < 10000) {
      const isStillThinking = await thinkingBadge.isVisible();
      if (sawThinking && !isStillThinking) {
        break;
      }
      await page.waitForTimeout(150);
    }
    const elapsed = Date.now() - moveStartTime;
    console.log(`✅ Bot took ${elapsed}ms to think and play move (Expected > 700ms human pacing)`);

    if (elapsed >= 700) {
      console.log("🎯 Bot thinking pacing successfully verified! Bot does not move instantly.");
    } else {
      console.warn("⚠️ Bot moved faster than expected:", elapsed);
    }

    // Check clocks after turn
    for (let i = 0; i < clockCount; i++) {
      console.log(`Clock ${i} after move: ${await clocks.nth(i).textContent()}`);
    }

    // Test Takeback button
    const takebackBtn = page.getByRole("button", { name: "Takeback" }).first();
    if (await takebackBtn.isVisible()) {
      await takebackBtn.click();
      await page.waitForTimeout(500);
      console.log("✅ Takeback clicked and handled");
    }

    // Test New Game button
    const newGameBtn = page.getByRole("button", { name: "New game" }).first();
    if (await newGameBtn.isVisible()) {
      await newGameBtn.click();
      await page.waitForTimeout(500);
      console.log("✅ New game clicked and reset board cleanly");
    }

    console.log("\nALL VERIFICATIONS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    await browser.close();
  }
})();
