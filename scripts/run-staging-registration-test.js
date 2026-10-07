#!/usr/bin/env node
/**
 * Automated E2E test: Register a new school user on staging with Vericant school.
 *
 * Drives a real (headless) browser through the registration form so that the
 * Next.js Server Action actually runs end-to-end against staging.
 *
 * Prerequisites (Playwright is a test-only dependency, not part of the app):
 *   npm i -D playwright && npx playwright install chromium
 *
 * Usage: node scripts/run-staging-registration-test.js
 */

const { chromium } = require("playwright")
const fs = require("fs")
const path = require("path")

const STAGING_URL = "https://staging.guided.vericant.com"
const SCREENSHOT_DIR = path.join(__dirname, "..", "test-artifacts")

const timestamp = Date.now()
const TEST_EMAIL = `test-user-${timestamp}@vericant.com`
const TEST_PASSWORD = "TestPass123!"
const TEST_NAME = `Test User ${timestamp}`

function log(step, msg) {
  console.log(`[${new Date().toISOString()}] ${step} ${msg}`)
}

async function shot(page, name) {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  const file = path.join(SCREENSHOT_DIR, name)
  await page.screenshot({ path: file, fullPage: true })
  log("📸", `Saved screenshot: ${file}`)
}

async function main() {
  console.log("======================================")
  console.log("Staging Registration E2E Test (Vericant)")
  console.log("======================================")
  console.log("URL:      ", STAGING_URL)
  console.log("Email:    ", TEST_EMAIL)
  console.log("Name:     ", TEST_NAME)
  console.log("School:    Vericant")
  console.log("")

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  // Capture browser console + page errors for debugging.
  page.on("console", (m) => log("  console>", `${m.type()}: ${m.text()}`))
  page.on("pageerror", (e) => log("  pageerror>", e.message))

  let passed = false
  try {
    // 1. Open registration page
    log("Step 1", "Opening registration page...")
    await page.goto(`${STAGING_URL}/school/register`, { waitUntil: "networkidle", timeout: 60000 })
    await page.waitForSelector("text=Register School Account", { timeout: 30000 })
    log("✓", "Registration page loaded")
    await shot(page, "01-register-page.png")

    // 2. Wait for schools to finish loading (the school search input is disabled until loaded)
    log("Step 2", "Waiting for schools list to load...")
    // School level buttons must be enabled once loading completes
    await page.waitForFunction(
      () => {
        const btns = Array.from(document.querySelectorAll("button"))
        const k12 = btns.find((b) => b.textContent && b.textContent.trim() === "K-12")
        return k12 && !k12.disabled
      },
      { timeout: 60000 }
    )
    log("✓", "Schools loaded, level buttons enabled")

    // 3. Choose a school level. Vericant level is set via 260611_set_school_levels_staging.sql.
    //    We'll try Higher Education first, then K-12 as fallback, picking whichever finds Vericant.
    async function tryLevelAndSearch(levelLabel) {
      log("Step 3", `Selecting school level: ${levelLabel}`)
      await page.getByRole("button", { name: levelLabel, exact: true }).click()

      const searchInput = page.locator("#schoolSearch")
      await searchInput.click()
      await searchInput.fill("")
      await searchInput.type("vericant", { delay: 50 })

      // Wait for dropdown results to render
      await page.waitForTimeout(1500)

      // Look for a result button containing "Vericant" (case-insensitive)
      const option = page.locator("button", { hasText: /vericant/i }).filter({
        hasNot: page.locator("svg"),
      })
      const count = await option.count()
      log("  info", `Found ${count} candidate option(s) for '${levelLabel}'`)
      return count > 0
    }

    let levelUsed = null
    for (const level of ["Higher Education", "K-12"]) {
      const found = await tryLevelAndSearch(level)
      await shot(page, `02-search-${level.replace(/\s+/g, "-").toLowerCase()}.png`)
      if (found) {
        levelUsed = level
        break
      }
    }

    if (!levelUsed) {
      throw new Error("Could not find 'Vericant' school in the dropdown under any level")
    }
    log("✓", `Vericant found under level: ${levelUsed}`)

    // 4. Click the Vericant option in the dropdown
    log("Step 4", "Selecting Vericant from dropdown...")
    const vericantOption = page
      .locator("div.absolute button", { hasText: /vericant/i })
      .first()
    await vericantOption.click()
    await page.waitForTimeout(500)
    // Confirm selection text appears
    await page.waitForSelector("text=/Selected:/i", { timeout: 10000 })
    log("✓", "Vericant selected")
    await shot(page, "03-school-selected.png")

    // 5. Fill in name, email, password
    log("Step 5", "Filling in account details...")
    await page.locator("#name").fill(TEST_NAME)
    await page.locator("#email").fill(TEST_EMAIL)
    await page.locator("#password").fill(TEST_PASSWORD)
    await page.locator("#confirmPassword").fill(TEST_PASSWORD)
    log("✓", "Form filled")
    await shot(page, "04-form-filled.png")

    // 6. Submit
    log("Step 6", "Submitting registration...")
    await page.getByRole("button", { name: /Create Account/i }).click()

    // 7. Wait for the real outcome by polling the page for up to 40s.
    //    Success => "Registration Successful!" heading.
    //    Failure => a destructive alert with non-empty text.
    log("Step 7", "Waiting for result...")
    let result = "timeout: no result detected"
    const deadline = Date.now() + 40000
    while (Date.now() < deadline) {
      const successVisible = await page
        .locator("text=Registration Successful!")
        .count()
        .then((c) => c > 0)
        .catch(() => false)
      if (successVisible) {
        result = "success"
        break
      }

      const alertText = await page
        .locator('[role="alert"]')
        .first()
        .textContent()
        .catch(() => null)
      if (alertText && alertText.trim().length > 0) {
        result = `error: ${alertText.trim()}`
        break
      }

      // Also treat a redirect to the login page as success (post-success redirect).
      if (page.url().includes("/school/login")) {
        result = "success"
        break
      }

      await page.waitForTimeout(1000)
    }

    await shot(page, "05-result.png")

    if (result === "success") {
      passed = true
      log("✓✓✓", "REGISTRATION SUCCESSFUL")
    } else {
      log("✗", `Registration did not succeed -> ${result}`)
    }

    // Write result summary
    const summary = {
      timestamp: new Date().toISOString(),
      staging_url: STAGING_URL,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: TEST_NAME,
      school: "Vericant",
      level_used: levelUsed,
      result,
      passed,
    }
    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, "result.json"),
      JSON.stringify(summary, null, 2)
    )
  } catch (err) {
    log("✗ ERROR", err.message)
    try {
      await shot(page, "99-error.png")
    } catch {}
  } finally {
    await browser.close()
  }

  console.log("")
  console.log("======================================")
  console.log(passed ? "RESULT: PASSED ✓" : "RESULT: FAILED ✗")
  console.log("======================================")
  console.log("Email:   ", TEST_EMAIL)
  console.log("Password:", TEST_PASSWORD)
  console.log("Artifacts in:", SCREENSHOT_DIR)
  process.exit(passed ? 0 : 1)
}

main()
