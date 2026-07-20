import { chromium } from "playwright";

const ADMIN_URL = "https://00pal.vercel.app/admin/login";
const EMAIL = "mainasaraa377@gmail.com";
const PASSWORD = "OpalAdmin2026!";

console.log("Launching browser...");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  // Step 1: Go to login page
  console.log("Navigating to admin login...");
  await page.goto(ADMIN_URL, { waitUntil: "networkidle" });
  console.log("Page title:", await page.title());

  // Step 2: Fill in credentials
  console.log("Filling credentials...");
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);

  // Step 3: Click sign in
  console.log("Clicking Sign In...");
  await page.click('button[type="submit"]');

  // Step 4: Wait for navigation to dashboard
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  console.log("Current URL:", currentUrl);

  if (currentUrl.includes("/admin/dashboard")) {
    console.log("✅ SUCCESS - Logged into admin dashboard!");
    const title = await page.title();
    console.log("Dashboard title:", title);

    // Grab a snippet of dashboard content
    const heading = await page.textContent("h1").catch(() => "(no h1)");
    console.log("Dashboard heading:", heading);
  } else if (currentUrl.includes("/admin/login")) {
    console.log("❌ Still on login page - check for error message");
    const error = await page.textContent(".text-red-400, [role='alert'], .error").catch(() => "none");
    console.log("Error displayed:", error);
  } else {
    console.log("Unexpected URL after login:", currentUrl);
  }
} catch (err) {
  console.error("Error:", err.message);
} finally {
  await browser.close();
  console.log("Browser closed.");
}
