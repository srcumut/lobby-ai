const { CDPBrowser } = require('C:\\Users\\Umut\\.gemini\\antigravity\\brain\\f37e161a-11f3-4f14-876c-eb6f3b4ded11\\scratch\\cdp-client.js');
const path = require('path');
const fs = require('fs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE_URL = 'http://localhost:3000';

async function setReactInput(page, selector, value) {
  await page.evaluate(`
    (() => {
      const el = document.querySelector('${selector}');
      if (!el) return;
      const proto = window.HTMLInputElement.prototype;
      const setVal = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setVal.call(el, '${value}');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    })()
  `);
}

async function run() {
  console.log('=== VERIFYING NO SOUND & WINDOW THEMES (TOP & SIDE PANELS) ===');
  const browser = new CDPBrowser(9290);
  await browser.launch({ width: 1400, height: 900 });
  const page = await browser.newPage();

  const shotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });

  try {
    console.log('1. Logging in as alperen_k...');
    await page.navigate(`${BASE_URL}/login`);
    await sleep(1500);
    await setReactInput(page, '#email', 'alperen_k');
    await setReactInput(page, '#password', 'Password123!');
    await sleep(300);
    await page.evaluate(`document.querySelector('button[type="submit"]')?.click();`);
    await sleep(2500);

    // TEST 1: Open Settings Modal and verify NO sound tab exists
    console.log('2. Checking Settings Modal (Verifying "Sesler" tab is REMOVED)...');
    await page.evaluate(`document.querySelector('[data-testid="sidebar-settings-button"]')?.click();`);
    await sleep(1200);

    const hasAudioTab = await page.evaluate(`
      (() => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        return tabs.some(t => (t.innerText || '').toLowerCase().includes('ses'));
      })()
    `);
    console.log(`  -> "Sesler" tab present? ${hasAudioTab} (Expected: false)`);
    await page.screenshot(path.join(shotsDir, '10_settings_modal_no_sound.png'));
    console.log('  📸 Screenshot saved: 10_settings_modal_no_sound.png');

    // Close Settings Modal
    await page.evaluate(`document.querySelector('[data-slot="dialog-close"]')?.click();`);
    await sleep(800);

    // TEST 2: Navigate to DM (/messages)
    console.log('3. Navigating to /messages...');
    await page.navigate(`${BASE_URL}/messages`);
    await sleep(2500);

    // Verify NO sound toggle button in DM header
    const hasSoundButton = await page.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.some(b => (b.getAttribute('title') || '').toLowerCase().includes('ses'));
      })()
    `);
    console.log(`  -> DM sound toggle button present? ${hasSoundButton} (Expected: false)`);

    // Select first conversation so full chat view opens
    await page.evaluate(`
      (() => {
        const items = Array.from(document.querySelectorAll('h4'));
        const target = items.find(h => h.innerText.includes('Can Demir') || h.innerText.includes('Dilara'));
        target?.closest('div[class*="cursor-pointer"]')?.click();
      })()
    `);
    await sleep(1500);

    // Switch DM theme to Midnight Purple
    console.log('4. Switching DM theme to Midnight Purple (Gece Moru)...');
    await page.evaluate(`
      (() => {
        const key = 'lobby-ai:equipped-cosmetics';
        let cur = {};
        try { cur = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
        cur.dm_theme = 'dm_theme_midnight_purple';
        localStorage.setItem(key, JSON.stringify(cur));
        window.dispatchEvent(new CustomEvent('lobby:cosmetics_updated', { detail: cur }));
      })()
    `);
    await sleep(1200);

    await page.screenshot(path.join(shotsDir, '11_dm_midnight_purple_full_window.png'));
    console.log('  📸 Screenshot saved: 11_dm_midnight_purple_full_window.png');

    // Switch DM theme to Emerald Secure
    console.log('5. Switching DM theme to Emerald Secure (Zümrüt Yeşili)...');
    await page.evaluate(`
      (() => {
        const key = 'lobby-ai:equipped-cosmetics';
        let cur = {};
        try { cur = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
        cur.dm_theme = 'dm_theme_emerald_secure';
        localStorage.setItem(key, JSON.stringify(cur));
        window.dispatchEvent(new CustomEvent('lobby:cosmetics_updated', { detail: cur }));
      })()
    `);
    await sleep(1200);

    await page.screenshot(path.join(shotsDir, '12_dm_emerald_full_window.png'));
    console.log('  📸 Screenshot saved: 12_dm_emerald_full_window.png');

    // TEST 3: Navigate to Lobby (/lobby/6cb62276-a4a9-4844-9e98-cf5a073ff885)
    console.log('6. Navigating to Lobby...');
    await page.navigate(`${BASE_URL}/lobby/6cb62276-a4a9-4844-9e98-cf5a073ff885`);
    await sleep(3500);

    // Switch Lobby theme to Cyber Neon
    console.log('7. Switching Lobby theme to Cyber Neon (Top banner, Right sidebar, Bottom input)...');
    await page.evaluate(`
      (() => {
        const key = 'lobby-ai:equipped-cosmetics';
        let cur = {};
        try { cur = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
        cur.lobby_theme = 'lobby_theme_cyber_neon';
        localStorage.setItem(key, JSON.stringify(cur));
        window.dispatchEvent(new CustomEvent('lobby:cosmetics_updated', { detail: cur }));
      })()
    `);
    await sleep(1500);

    await page.screenshot(path.join(shotsDir, '13_lobby_cyber_neon_full_window.png'));
    console.log('  📸 Screenshot saved: 13_lobby_cyber_neon_full_window.png');

    // Switch Lobby theme to Matrix Hacker
    console.log('8. Switching Lobby theme to Matrix Hacker (Top banner, Right sidebar, Bottom input)...');
    await page.evaluate(`
      (() => {
        const key = 'lobby-ai:equipped-cosmetics';
        let cur = {};
        try { cur = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
        cur.lobby_theme = 'lobby_theme_matrix_hacker';
        localStorage.setItem(key, JSON.stringify(cur));
        window.dispatchEvent(new CustomEvent('lobby:cosmetics_updated', { detail: cur }));
      })()
    `);
    await sleep(1500);

    await page.screenshot(path.join(shotsDir, '14_lobby_matrix_full_window.png'));
    console.log('  📸 Screenshot saved: 14_lobby_matrix_full_window.png');

    console.log('\n=== ALL VERIFICATIONS COMPLETE ===');
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    await browser.close();
  }
}

run();
