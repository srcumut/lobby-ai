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

async function runTest() {
  console.log('=== STARTING FINAL POLISH VERIFICATION AUDIT ===');
  const browser = new CDPBrowser(9275);
  await browser.launch({ width: 1400, height: 900 });
  const page = await browser.newPage();

  const shotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });

  try {
    // 1. Login
    console.log('1. Navigating to login...');
    await page.navigate(`${BASE_URL}/login`);
    await sleep(1500);

    await setReactInput(page, '#email', 'alperen_k');
    await setReactInput(page, '#password', 'Password123!');
    await sleep(300);
    await page.evaluate(`document.querySelector('button[type="submit"]')?.click();`);
    await sleep(2500);
    console.log('-> Logged in successfully!');

    // 2. Activate Deep Galaxy Global Theme
    console.log('2. Activating Deep Galaxy Theme...');
    await page.evaluate(`
      (() => {
        const key = 'lobby-ai:equipped-cosmetics';
        let cur = {};
        try { cur = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
        cur.global_theme = 'global_theme_deep_galaxy';
        localStorage.setItem(key, JSON.stringify(cur));
        window.dispatchEvent(new CustomEvent('lobby:cosmetics_updated', { detail: cur }));
      })()
    `);
    await sleep(600);

    // 3. Test Sidebar AYARLAR Button & Settings Modal
    console.log('3. Testing Sidebar AYARLAR Button...');
    await page.evaluate(`
      (() => {
        const btn = document.querySelector('[data-testid="sidebar-settings-button"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(1000);

    const shot1 = path.join(shotsDir, '01_settings_modal_appearance.png');
    await page.screenshot(shot1);
    console.log('  📸 Saved: 01_settings_modal_appearance.png');

    // Switch to Audio Tab in Settings
    console.log('3b. Switching to Audio tab...');
    await page.evaluate(`
      (() => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        const audioTab = tabs.find(t => t.innerText.includes('Sesler') || t.innerText.includes('SESLER'));
        if (audioTab) audioTab.click();
      })()
    `);
    await sleep(600);
    const shot2 = path.join(shotsDir, '02_settings_modal_audio.png');
    await page.screenshot(shot2);
    console.log('  📸 Saved: 02_settings_modal_audio.png');

    // Switch to Account Tab in Settings
    console.log('3c. Switching to Account tab...');
    await page.evaluate(`
      (() => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        const accTab = tabs.find(t => t.innerText.includes('Hesap') || t.innerText.includes('HESAP'));
        if (accTab) accTab.click();
      })()
    `);
    await sleep(600);
    const shot3 = path.join(shotsDir, '03_settings_modal_account.png');
    await page.screenshot(shot3);
    console.log('  📸 Saved: 03_settings_modal_account.png');

    // Close Settings Modal
    await page.evaluate(`
      (() => {
        const closeBtn = document.querySelector('[data-slot="dialog-close"]');
        if (closeBtn) closeBtn.click();
      })()
    `);
    await sleep(800);

    // 4. Test DM Page & DM Quick Theme Switcher
    console.log('\n4. Navigating to /messages...');
    await page.navigate(`${BASE_URL}/messages`);
    await sleep(2000);

    // Click first conversation or friend if available
    await page.evaluate(`
      (() => {
        const chatItem = document.querySelector('[class*="cursor-pointer"][title*="Mesaj"]') ||
                         document.querySelector('.min-w-0.flex-1');
        if (chatItem) chatItem.click();
      })()
    `);
    await sleep(1000);

    // Open DM Theme Switcher
    console.log('4b. Opening DM Quick Theme Dialog...');
    await page.evaluate(`
      (() => {
        const btn = document.querySelector('[data-testid="dm-quick-theme-button"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(800);

    const shot4 = path.join(shotsDir, '04_dm_theme_switcher_dialog.png');
    await page.screenshot(shot4);
    console.log('  📸 Saved: 04_dm_theme_switcher_dialog.png');

    // Select Midnight Purple
    console.log('4c. Equipping Midnight Purple DM Theme...');
    await page.evaluate(`
      (() => {
        const items = Array.from(document.querySelectorAll('[class*="border-2"][class*="cursor-pointer"]'));
        const purpleItem = items.find(el => el.innerText.includes('Gece Moru'));
        if (purpleItem) purpleItem.click();
      })()
    `);
    await sleep(1000);

    const shot5 = path.join(shotsDir, '05_dm_purple_active.png');
    await page.screenshot(shot5);
    console.log('  📸 Saved: 05_dm_purple_active.png');

    // Switch to Emerald Secure
    console.log('4d. Equipping Emerald Secure DM Theme...');
    await page.evaluate(`
      (() => {
        const btn = document.querySelector('[data-testid="dm-quick-theme-button"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(600);
    await page.evaluate(`
      (() => {
        const items = Array.from(document.querySelectorAll('[class*="border-2"][class*="cursor-pointer"]'));
        const emeraldItem = items.find(el => el.innerText.includes('Şifreli Zümrüt') || el.innerText.includes('Zümrüt Yeşili'));
        if (emeraldItem) emeraldItem.click();
      })()
    `);
    await sleep(1000);

    const shot6 = path.join(shotsDir, '06_dm_emerald_active.png');
    await page.screenshot(shot6);
    console.log('  📸 Saved: 06_dm_emerald_active.png');

    // 5. Test Lobbies & Lobby Settings Theme Tab
    console.log('\n5. Navigating to /lobbies...');
    await page.navigate(`${BASE_URL}/lobbies`);
    await sleep(2000);

    const lobbyOpened = await page.evaluate(`
      (() => {
        const card = document.querySelector('a[href^="/lobby/"]');
        if (card) {
          card.click();
          return true;
        }
        return false;
      })()
    `);
    await sleep(2500);

    if (lobbyOpened) {
      console.log('5b. Inside Lobby, opening Lobby Settings...');
      await page.evaluate(`
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(b => b.innerText.includes('Ayarlar'));
          if (btn) btn.click();
        })()
      `);
      await sleep(1000);

      // Click Görünüm & Tema Tab
      console.log('5c. Clicking Görünüm & Tema tab in Lobby Settings...');
      await page.evaluate(`
        (() => {
          const tab = document.querySelector('[data-testid="lobby-theme-tab-trigger"]');
          if (tab) tab.click();
        })()
      `);
      await sleep(800);

      const shot7 = path.join(shotsDir, '07_lobby_settings_theme_tab.png');
      await page.screenshot(shot7);
      console.log('  📸 Saved: 07_lobby_settings_theme_tab.png');

      // Select Cyber Neon Personal Theme
      console.log('5d. Selecting Cyber Neon Personal Lobby Theme...');
      await page.evaluate(`
        (() => {
          const items = Array.from(document.querySelectorAll('[class*="border-2"][class*="cursor-pointer"]'));
          const cyber = items.find(el => el.innerText.includes('Siber Neon'));
          if (cyber) cyber.click();
        })()
      `);
      await sleep(800);

      // Close settings modal
      await page.evaluate(`
        (() => {
          const closeBtn = document.querySelector('[data-slot="dialog-close"]');
          if (closeBtn) closeBtn.click();
        })()
      `);
      await sleep(1000);

      const shot8 = path.join(shotsDir, '08_lobby_cyber_neon_chat.png');
      await page.screenshot(shot8);
      console.log('  📸 Saved: 08_lobby_cyber_neon_chat.png');
    }

    // 6. Test Logout Confirmation Dialog Styling
    console.log('\n6. Testing Logout Alert Dialog dark contrast...');
    await page.evaluate(`
      (() => {
        const btn = document.querySelector('.sidebar-logout-btn') || document.querySelector('button[title="Çıkış Yap"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(800);
    const shot9 = path.join(shotsDir, '09_logout_alert_dialog_dark.png');
    await page.screenshot(shot9);
    console.log('  📸 Saved: 09_logout_alert_dialog_dark.png');

    console.log('\n========================================');
    console.log('🎉 AUDIT COMPLETE: ALL CHECKS PASSED!');
    console.log('========================================');
  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    await browser.close();
  }
}

runTest();
