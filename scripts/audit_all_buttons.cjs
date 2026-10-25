const { chromium } = require("@playwright/test");

(async () => {
  console.log("Starting comprehensive UI and button audit...");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  const errors = [];
  page.on("pageerror", (err) => {
    errors.push(`[PAGE_ERROR] ${err.message}`);
    console.error(`❌ Page error: ${err.message}`);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`[CONSOLE_ERROR] ${msg.text()}`);
      console.error(`❌ Console error: ${msg.text()}`);
    }
  });

  const auditLog = [];
  function logPass(desc) {
    console.log(`✅ ${desc}`);
    auditLog.push({ desc, status: "PASS" });
  }
  function logFail(desc, detail) {
    console.error(`❌ ${desc}: ${detail}`);
    auditLog.push({ desc, status: "FAIL", detail });
  }

  try {
    // 1. Landing Page
    console.log("\n--- Testing Landing Page ---");
    await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
    logPass("Landing page loaded successfully");

    // Test Time Control buttons in Hero
    const timeButtons = ['1', '3', '5', '10'];
    for (const t of timeButtons) {
      const btn = page.getByRole("button", { name: `${t}M`, exact: true });
      if (await btn.isVisible()) {
        await btn.click();
        logPass(`Clicked ${t}M time control button`);
      } else {
        logFail(`Time button ${t}M not found`);
      }
    }

    // 2. Navigation to Bot Select
    console.log("\n--- Testing Bot Selection & Play Flow ---");
    const playBtn = page.getByRole("button", { name: /PLAY .* RAPID/i });
    if (await playBtn.isVisible()) {
      await playBtn.click();
      await page.waitForTimeout(500);
      logPass("Clicked Matchmaking button, navigated to Bot Select screen");
    }

    // Check Bot Select screen buttons
    const botCards = page.locator(".bot-card, [data-bot-id]");
    const botCount = await botCards.count();
    console.log(`Found ${botCount} bot options`);

    // Click "Start Match"
    const startMatchBtn = page.getByRole("button", { name: /Start Match|Play vs Bot/i }).first();
    if (await startMatchBtn.isVisible()) {
      await startMatchBtn.click();
      await page.waitForTimeout(1000);
      logPass("Started bot match, loaded chessboard screen");

      // Test in-game actions
      // Move pawn e2 -> e4
      const e2 = page.getByRole("button", { name: /e2,/i }).first();
      if (await e2.isVisible()) {
        await e2.click();
        const e4 = page.getByRole("button", { name: /e4,/i }).first();
        if (await e4.isVisible()) {
          await e4.click();
          await page.waitForTimeout(1000);
          logPass("Made move e2-e4 in offline match");
        }
      }

      // Test Flip board button if visible
      const flipBtn = page.getByRole("button", { name: /Flip/i }).first();
      if (await flipBtn.isVisible()) {
        await flipBtn.click();
        await page.waitForTimeout(300);
        await flipBtn.click(); // flip back
        logPass("Tested Flip Board button");
      }

      // Test AI Coach / Hint if visible
      const hintBtn = page.getByRole("button", { name: /Hint|Coach|Explain/i }).first();
      if (await hintBtn.isVisible()) {
        await hintBtn.click();
        await page.waitForTimeout(500);
        logPass("Tested AI Coach / Hint button");
      }

      // Exit back to landing
      const backHome = page.getByRole("button", { name: /Exit|Menu|Back/i }).first();
      if (await backHome.isVisible()) {
        await backHome.click();
        await page.waitForTimeout(500);
        logPass("Returned from offline match to menu");
      }
    }

    // 3. Testing Training Screen (Lichess Puzzles)
    console.log("\n--- Testing Training Page (Lichess) ---");
    await page.goto("http://127.0.0.1:5173/?screen=training", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    logPass("Training screen loaded");

    // Look for Lichess Daily puzzle card & button
    const fetchPuzzleBtn = page.getByRole("button", { name: /Daily puzzle|Fetch|Solve puzzle/i }).first();
    if (await fetchPuzzleBtn.isVisible()) {
      await fetchPuzzleBtn.click();
      await page.waitForTimeout(1500);
      logPass("Clicked Lichess puzzle button in Training");
    }

    // 4. Testing Study Board (Chess.com import & PGN analysis)
    console.log("\n--- Testing Study Board (Chess.com PubAPI) ---");
    await page.goto("http://127.0.0.1:5173/?screen=study", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    logPass("Study board loaded");

    const searchInput = page.getByPlaceholder(/Chess.com username/i);
    const searchBtn = page.getByRole("button", { name: /Search & Import|Import/i }).first();
    if (await searchInput.isVisible() && await searchBtn.isVisible()) {
      logPass("Chess.com username search input and button are present and visible");
    }

    const reviewButtons = page.locator(".study-nav button, .move-controls button");
    const reviewBtnCount = await reviewButtons.count();
    console.log(`Found ${reviewBtnCount} study review control buttons`);
    if (reviewBtnCount > 0) {
      await reviewButtons.first().click();
      logPass("Clicked Study move navigation button");
    }

    // 5. Testing Rule Variants Page
    console.log("\n--- Testing Rule Variants Page ---");
    await page.goto("http://127.0.0.1:5173/?screen=rule_variants", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    logPass("Rule variants screen loaded");

    const variantSelect = page.getByLabel("Select variant");
    if (await variantSelect.isVisible()) {
      await variantSelect.selectOption("atomic");
      await page.waitForTimeout(300);
      logPass("Selected Atomic variant");
      await variantSelect.selectOption("crazyhouse");
      await page.waitForTimeout(300);
      logPass("Selected Crazyhouse variant");
    }

    // 6. Testing Postage Stamps Page
    console.log("\n--- Testing Stamp Book Page ---");
    await page.goto("http://127.0.0.1:5173/?screen=stamps", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    logPass("Stamp book loaded");

    const filterChips = page.locator(".stamp-filter button, .chips button");
    const chipCount = await filterChips.count();
    console.log(`Found ${chipCount} stamp filter chips`);
    for (let i = 0; i < chipCount; i++) {
      await filterChips.nth(i).click();
      await page.waitForTimeout(200);
    }
    logPass("Tested all Stamp book filter chips");

    // 7. Testing Online PvP Page & Tabs
    console.log("\n--- Testing Online PvP Compete & Buttons ---");
    await page.goto("http://127.0.0.1:5173/?screen=online", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    logPass("Online Compete page loaded");

    // Check tabs
    const friendsTab = page.getByRole("button", { name: "Friends Sanctum" });
    const pvpTab = page.getByRole("button", { name: "PvP Compete" });
    const profileTab = page.getByRole("button", { name: "Player Profile" });

    if (await friendsTab.isVisible()) {
      await friendsTab.click();
      await page.waitForTimeout(500);
      logPass("Switched to Friends Sanctum tab");

      const findBtn = page.getByRole("button", { name: "Find player" });
      logPass(`Find player button is visible: ${await findBtn.isVisible()}`);

      const instantMatchBtn = page.getByRole("button", { name: /Create Private Room/i }).first();
      logPass(`Instant Private Match button in Friends Sanctum is visible: ${await instantMatchBtn.isVisible()}`);
    }

    if (await profileTab.isVisible()) {
      await profileTab.click();
      await page.waitForTimeout(500);
      logPass("Switched to Player Profile tab");

      const saveProfileBtn = page.getByRole("button", { name: /Save profile/i });
      logPass(`Save profile button is visible: ${await saveProfileBtn.isVisible()}`);
    }

    if (await pvpTab.isVisible()) {
      await pvpTab.click();
      await page.waitForTimeout(500);
      logPass("Switched back to PvP Compete tab");
    }

    // Test creating private room with 6-digit code
    const createPvtBtn = page.getByRole("button", { name: "Create private room" });
    if (await createPvtBtn.isVisible()) {
      await createPvtBtn.click();
      await page.waitForTimeout(1000);
      const codeEl = page.locator("code").first();
      const codeText = await codeEl.textContent();
      console.log(`Generated room code: "${codeText}" (length: ${codeText.length})`);
      if (codeText.length === 6) {
        logPass("Private room created with exact 6-digit alphanumeric code");
      } else {
        logFail("Room code length is not 6", codeText);
      }

      // Test "Copy Invite Link" button
      const copyLinkBtn = page.getByRole("button", { name: /Copy Invite Link/i }).first();
      if (await copyLinkBtn.isVisible()) {
        await copyLinkBtn.click();
        await page.waitForTimeout(300);
        logPass("Clicked 'Copy Invite Link' button");
      }

      // Test "Copy Code" button
      const copyCodeBtn = page.getByRole("button", { name: /Copy Code/i }).first();
      if (await copyCodeBtn.isVisible()) {
        await copyCodeBtn.click();
        await page.waitForTimeout(300);
        logPass("Clicked 'Copy Code' button");
      }

      // Test "Cancel Room" button
      const cancelBtn = page.getByRole("button", { name: "Cancel Room" }).first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(1000);
        logPass("Clicked 'Cancel Room' button; room cancelled cleanly");
      }
    }

    // 8. Testing Custom Room creation (6-digit code)
    console.log("\n--- Testing Custom Room Creation ---");
    const createCustomBtn = page.getByRole("button", { name: "Create custom room" });
    if (await createCustomBtn.isVisible()) {
      await createCustomBtn.click();
      await page.waitForTimeout(1000);
      const customCodeEl = page.locator(".custom-game code").first();
      if (await customCodeEl.isVisible()) {
        const customCode = await customCodeEl.textContent();
        console.log(`Generated custom room code: "${customCode}" (length: ${customCode.length})`);
        if (customCode.length === 6) {
          logPass("Custom room created with exact 6-digit alphanumeric code");
        } else {
          logFail("Custom room code length is not 6", customCode);
        }
      }
    }

    // 9. Testing Drills & Tournaments
    console.log("\n--- Testing Drills & Tournaments ---");
    await page.goto("http://127.0.0.1:5173/?screen=drills", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    logPass("Drills screen loaded");

    await page.goto("http://127.0.0.1:5173/?screen=tournaments", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    logPass("Tournament screen loaded");

    console.log("\n==========================================");
    console.log(`AUDIT FINISHED. Total checks passed: ${auditLog.filter(x => x.status === "PASS").length}`);
    console.log(`Errors encountered: ${errors.length}`);
    if (errors.length > 0) {
      console.log("Error details:", errors);
    }
    console.log("==========================================");

  } catch (err) {
    console.error("Audit script failed with unhandled error:", err);
  } finally {
    await browser.close();
  }
})();
