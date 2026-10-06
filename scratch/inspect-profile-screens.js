const { CDPBrowser } = require('C:\\Users\\Umut\\.gemini\\antigravity\\brain\\f37e161a-11f3-4f14-876c-eb6f3b4ded11\\scratch\\cdp-client.js');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE_URL = 'http://localhost:3000';

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

async function capture() {
  const browser = new CDPBrowser(9240);
  await browser.launch({ width: 1366, height: 900 });
  const page = await browser.newPage();

  try {
    console.log('1. Logging in...');
    await page.navigate(`${BASE_URL}/login`);
    await sleep(1500);
    await setReactInput(page, '#email', 'qa_gold_tester@example.com');
    await setReactInput(page, '#password', 'Password123!');
    await sleep(300);
    await page.evaluate(`document.querySelector('button[type="submit"]')?.click();`);
    await sleep(2000);

    console.log('2. Equipping galaxy theme & gold zigzag border...');
    await page.evaluate(`
      (() => {
        const key = 'lobby-ai:equipped-cosmetics';
        let cur = {};
        try { cur = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
        cur.global_theme = 'global_theme_deep_galaxy';
        cur.border = 'border_gold_brutal';
        cur.avatar_animation = 'anim_breathe';
        localStorage.setItem(key, JSON.stringify(cur));
        window.dispatchEvent(new CustomEvent('lobby:cosmetics_updated', { detail: cur }));
      })()
    `);
    await sleep(500);

    console.log('3. Navigating to /profile...');
    await page.navigate(`${BASE_URL}/profile`);
    await sleep(2000);

    console.log('3b. Selecting ready avatar 1...');
    await page.evaluate(`
      (() => {
        const btn = document.querySelector('[data-testid="ready-avatar-avatar-1"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(2000);

    const shotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });

    const shot1Path = path.join(shotsDir, 'inspect_profile_page.png');
    console.log('4. Capturing profile page screenshot...');
    await page.screenshot(shot1Path);
    console.log('Saved', shot1Path);

    // Scroll down to see middle and bottom of profile page
    await page.evaluate(`window.scrollTo(0, 500);`);
    await sleep(500);
    const shot1bPath = path.join(shotsDir, 'inspect_profile_page_scrolled1.png');
    await page.screenshot(shot1bPath);

    await page.evaluate(`window.scrollTo(0, 1200);`);
    await sleep(500);
    const shot1cPath = path.join(shotsDir, 'inspect_profile_page_scrolled2.png');
    await page.screenshot(shot1cPath);

    await page.evaluate(`window.scrollTo(0, 0);`);
    await sleep(500);

    console.log('5. Clicking Profil Kartı button...');
    await page.evaluate(`document.querySelector('[data-testid="profile-card-modal-button"]')?.click();`);
    await sleep(1500);

    const shot2Path = path.join(shotsDir, 'inspect_profile_modal.png');
    console.log('6. Capturing profile card modal screenshot...');
    await page.screenshot(shot2Path);
    console.log('Saved', shot2Path);

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

capture();
