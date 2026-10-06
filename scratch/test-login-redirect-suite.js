const { CDPBrowser } = require('C:\\Users\\Umut\\.gemini\\antigravity\\brain\\f37e161a-11f3-4f14-876c-eb6f3b4ded11\\scratch\\cdp-client.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function setReactInput(page, selector, value) {
  await page.evaluate(`
    (() => {
      const el = document.querySelector('${selector}');
      if (!el) throw new Error('Element not found: ${selector}');
      const proto = window.HTMLInputElement.prototype;
      const setVal = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setVal.call(el, '${value}');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    })()
  `);
}

async function waitForPath(page, expectedPath, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const currentPath = await page.evaluate(`window.location.pathname`);
    if (currentPath === expectedPath) {
      return true;
    }
    await sleep(300);
  }
  const actual = await page.evaluate(`window.location.pathname`);
  throw new Error(`Timeout waiting for path "${expectedPath}". Current path is "${actual}".`);
}

async function runLoginSuite() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPREHENSIVE LOGIN & REDIRECT QA SUITE');
  console.log('====================================================\n');

  const browser = new CDPBrowser(9226);
  await browser.launch({ width: 1280, height: 800 });
  const page = await browser.newPage();

  const report = {
    test1_normalLogin: false,
    test2_validRedirect: false,
    test3_loopPreventionDirect: false,
    test4_loopPreventionMultiEncoded: false,
    test5_openRedirectBlocked: false,
    test6_protectedRoutePreservesRedirect: false,
    test7_alreadyAuthenticatedAutoRedirect: false,
    test8_registerPreservesRedirect: false,
  };

  try {
    // -------------------------------------------------------------
    // TEST 1: Normal Login without query parameters -> /lobbies
    // -------------------------------------------------------------
    console.log('--- TEST 1: Normal Login without query parameters ---');
    await page.navigate('http://localhost:3000/login');
    await sleep(1000);
    await page.evaluate(`localStorage.clear(); sessionStorage.clear();`);
    await page.navigate('http://localhost:3000/login');
    await sleep(1500);

    await setReactInput(page, '#email', 'qa_test123@example.com');
    await setReactInput(page, '#password', 'Password123!');
    await sleep(300);
    await page.evaluate(`document.querySelector('button[type="submit"]').click()`);

    await waitForPath(page, '/lobbies');
    const token1 = await page.evaluate(`localStorage.getItem('access_token')`);
    if (token1) {
      console.log('✅ PASS: Normal login successfully navigated to /lobbies with valid token.\n');
      report.test1_normalLogin = true;
    } else {
      console.error('❌ FAIL: Normal login navigated to /lobbies but token is missing.\n');
    }

    // -------------------------------------------------------------
    // TEST 2: Valid Redirect Target (?redirect=/profile) -> /profile
    // -------------------------------------------------------------
    console.log('--- TEST 2: Valid Redirect Target (?redirect=/profile) ---');
    await page.evaluate(`localStorage.clear(); sessionStorage.clear();`);
    await page.navigate('http://localhost:3000/login?redirect=/profile');
    await sleep(1500);

    await setReactInput(page, '#email', 'qa_test123@example.com');
    await setReactInput(page, '#password', 'Password123!');
    await sleep(300);
    await page.evaluate(`document.querySelector('button[type="submit"]').click()`);

    await waitForPath(page, '/profile');
    await sleep(1000); // Verify it stays on /profile without bouncing back
    const pathAfterWait = await page.evaluate(`window.location.pathname`);
    if (pathAfterWait === '/profile') {
      console.log('✅ PASS: ?redirect=/profile navigated to /profile and stayed there.\n');
      report.test2_validRedirect = true;
    } else {
      console.error(`❌ FAIL: Bounced away from /profile to ${pathAfterWait}.\n`);
    }

    // -------------------------------------------------------------
    // TEST 3: Loop Prevention - Direct Self-Reference (?redirect=/login) -> /lobbies
    // -------------------------------------------------------------
    console.log('--- TEST 3: Loop Prevention - Direct Self-Reference (?redirect=/login) ---');
    await page.evaluate(`localStorage.clear(); sessionStorage.clear();`);
    await page.navigate('http://localhost:3000/login?redirect=/login');
    await sleep(1500);

    await setReactInput(page, '#email', 'qa_test123@example.com');
    await setReactInput(page, '#password', 'Password123!');
    await sleep(300);
    await page.evaluate(`document.querySelector('button[type="submit"]').click()`);

    await waitForPath(page, '/lobbies');
    const path3 = await page.evaluate(`window.location.pathname`);
    if (path3 === '/lobbies') {
      console.log('✅ PASS: ?redirect=/login intercepted by loop prevention; safely navigated to /lobbies.\n');
      report.test3_loopPreventionDirect = true;
    } else {
      console.error(`❌ FAIL: Expected /lobbies, got ${path3}.\n`);
    }

    // -------------------------------------------------------------
    // TEST 4: Loop Prevention - Multi-Encoded Self-Reference -> /lobbies
    // -------------------------------------------------------------
    console.log('--- TEST 4: Loop Prevention - Multi-Encoded Self-Reference ---');
    await page.evaluate(`localStorage.clear(); sessionStorage.clear();`);
    await page.navigate('http://localhost:3000/login?redirect=%252Flogin%253Fredirect%253D%252Flogin');
    await sleep(1500);

    await setReactInput(page, '#email', 'qa_test123@example.com');
    await setReactInput(page, '#password', 'Password123!');
    await sleep(300);
    await page.evaluate(`document.querySelector('button[type="submit"]').click()`);

    await waitForPath(page, '/lobbies');
    const path4 = await page.evaluate(`window.location.pathname`);
    if (path4 === '/lobbies') {
      console.log('✅ PASS: Multi-encoded ?redirect=%252Flogin... decoded & loop prevented; navigated to /lobbies.\n');
      report.test4_loopPreventionMultiEncoded = true;
    } else {
      console.error(`❌ FAIL: Expected /lobbies, got ${path4}.\n`);
    }

    // -------------------------------------------------------------
    // TEST 5: Open Redirect Attack Prevention (?redirect=https://evil.com) -> /lobbies
    // -------------------------------------------------------------
    console.log('--- TEST 5: Open Redirect Attack Prevention ---');
    await page.evaluate(`localStorage.clear(); sessionStorage.clear();`);
    await page.navigate('http://localhost:3000/login?redirect=https://evil.com');
    await sleep(1500);

    await setReactInput(page, '#email', 'qa_test123@example.com');
    await setReactInput(page, '#password', 'Password123!');
    await sleep(300);
    await page.evaluate(`document.querySelector('button[type="submit"]').click()`);

    await waitForPath(page, '/lobbies');
    const path5 = await page.evaluate(`window.location.pathname`);
    if (path5 === '/lobbies') {
      console.log('✅ PASS: External URL blocked; safely navigated to /lobbies.\n');
      report.test5_openRedirectBlocked = true;
    } else {
      console.error(`❌ FAIL: Expected /lobbies, got ${path5}.\n`);
    }

    // -------------------------------------------------------------
    // TEST 6: Protected Route Interception Flow (/profile unauthenticated)
    // -------------------------------------------------------------
    console.log('--- TEST 6: Protected Route Interception Flow ---');
    await page.evaluate(`localStorage.clear(); sessionStorage.clear();`);
    await page.navigate('http://localhost:3000/profile');
    await sleep(1500);

    const interceptedUrl = await page.evaluate(`window.location.href`);
    console.log('Intercepted unauthenticated URL:', interceptedUrl);
    if (interceptedUrl.includes('/login?redirect=') && interceptedUrl.includes('%2Fprofile')) {
      console.log('✅ ProtectedRoute attached ?redirect=%2Fprofile correctly.');

      // Now complete the login and ensure return to /profile
      await setReactInput(page, '#email', 'qa_test123@example.com');
      await setReactInput(page, '#password', 'Password123!');
      await sleep(300);
      await page.evaluate(`document.querySelector('button[type="submit"]').click()`);

      await waitForPath(page, '/profile');
      await sleep(1000);
      const finalPath = await page.evaluate(`window.location.pathname`);
      if (finalPath === '/profile') {
        console.log('✅ PASS: Full interception-login-return cycle completed at /profile.\n');
        report.test6_protectedRoutePreservesRedirect = true;
      } else {
        console.error(`❌ FAIL: Failed to return to /profile, landed on ${finalPath}.\n`);
      }
    } else {
      console.error('❌ FAIL: ProtectedRoute did not redirect with ?redirect=%2Fprofile:', interceptedUrl);
    }

    // -------------------------------------------------------------
    // TEST 7: Already Authenticated Auto-Redirect
    // -------------------------------------------------------------
    console.log('--- TEST 7: Already Authenticated Auto-Redirect ---');
    // Currently authenticated as qa_test123
    await page.navigate('http://localhost:3000/login?redirect=/shop');
    await waitForPath(page, '/shop');
    const path7 = await page.evaluate(`window.location.pathname`);
    if (path7 === '/shop') {
      console.log('✅ PASS: Authenticated user was auto-redirected from /login to /shop.\n');
      report.test7_alreadyAuthenticatedAutoRedirect = true;
    } else {
      console.error(`❌ FAIL: Expected /shop, got ${path7}.\n`);
    }

    // -------------------------------------------------------------
    // TEST 8: Register Page Redirect Flow
    // -------------------------------------------------------------
    console.log('--- TEST 8: Register Page Redirect Flow ---');
    await page.evaluate(`localStorage.clear(); sessionStorage.clear();`);
    await page.navigate('http://localhost:3000/register?redirect=/profile');
    await sleep(1500);

    const rand = Math.floor(Math.random() * 900000) + 100000;
    await setReactInput(page, '#username', `reg_user_${rand}`);
    await setReactInput(page, '#email', `reg_user_${rand}@example.com`);
    await setReactInput(page, '#password', 'Password123!');
    await sleep(300);
    await page.evaluate(`document.querySelector('button[type="submit"]').click()`);

    await waitForPath(page, '/profile');
    await sleep(1000);
    const path8 = await page.evaluate(`window.location.pathname`);
    if (path8 === '/profile') {
      console.log('✅ PASS: Register preserved ?redirect=/profile and safely navigated to /profile.\n');
      report.test8_registerPreservesRedirect = true;
    } else {
      console.error(`❌ FAIL: Expected /profile, got ${path8}.\n`);
    }

  } finally {
    await browser.close();
  }

  console.log('====================================================');
  console.log('📊 LOGIN SUITE RESULTS SUMMARY');
  console.log('====================================================');
  console.log(JSON.stringify(report, null, 2));

  const allPassed = Object.values(report).every((v) => v === true);
  if (allPassed) {
    console.log('\n🎉 ALL 8 LOGIN & REDIRECT QA TESTS PASSED SUCCESSFULLY! (100%)');
  } else {
    console.error('\n❌ SOME TESTS FAILED IN LOGIN SUITE!');
    process.exit(1);
  }
}

runLoginSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
