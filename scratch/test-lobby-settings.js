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
  console.log('=== TESTING LOBBY SETTINGS THEME TAB ===');
  const browser = new CDPBrowser(9285);
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

    // Set deep galaxy theme
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
    await sleep(500);

    console.log('2. Navigating directly to lobby 6cb62276-a4a9-4844-9e98-cf5a073ff885...');
    await page.navigate(`${BASE_URL}/lobby/6cb62276-a4a9-4844-9e98-cf5a073ff885`);
    await sleep(3500);

    console.log('3. Inside lobby, opening Lobby Settings Dialog...');
    await page.evaluate(`
      (() => {
        const settingsBtn = document.querySelector('[data-testid="lobby-room-settings-btn"]');
        if (settingsBtn) {
          settingsBtn.click();
        } else {
          console.error('lobby-room-settings-btn not found!');
        }
      })()
    `);
    await sleep(1500);

    console.log('4. Clicking Görünüm & Tema tab...');
    await page.evaluate(`
      (() => {
        const tab = document.querySelector('[data-testid="lobby-theme-tab-trigger"]');
        if (tab) {
          tab.click();
        } else {
          const triggers = Array.from(document.querySelectorAll('[role="tab"]'));
          const themeTrigger = triggers.find(t => (t.innerText || '').includes('Tema') || (t.innerText || '').includes('Görünüm'));
          if (themeTrigger) themeTrigger.click();
        }
      })()
    `);
    await sleep(1000);

    const shotLobbyTab = path.join(shotsDir, '07_lobby_settings_theme_tab.png');
    await page.screenshot(shotLobbyTab);
    console.log('  📸 Screenshot saved: 07_lobby_settings_theme_tab.png');

    console.log('6. Selecting Cyber Neon personal theme...');
    await page.evaluate(`
      (() => {
        const items = Array.from(document.querySelectorAll('[class*="border-2"][class*="cursor-pointer"]'));
        const cyber = items.find(el => el.innerText.includes('Siber Neon'));
        if (cyber) cyber.click();
      })()
    `);
    await sleep(800);

    // Close settings dialog
    await page.evaluate(`
      (() => {
        const closeBtn = document.querySelector('[data-slot="dialog-close"]');
        if (closeBtn) closeBtn.click();
      })()
    `);
    await sleep(1000);

    // Send a test message in the lobby
    console.log('7. Sending test message in lobby...');
    await setReactInput(page, 'input[placeholder*="mesaj"]', 'Galaksi ve Siber Neon teması kusursuz çalışıyor! 🚀');
    await sleep(300);
    await page.evaluate(`
      (() => {
        const sendBtn = document.querySelector('button[type="submit"]') ||
                        document.querySelector('button[aria-label="Gönder"]');
        if (sendBtn) sendBtn.click();
      })()
    `);
    await sleep(1500);

    const shotLobbyChat = path.join(shotsDir, '08_lobby_cyber_neon_chat.png');
    await page.screenshot(shotLobbyChat);
    console.log('  📸 Screenshot saved: 08_lobby_cyber_neon_chat.png');

    // Retake 01_settings_modal_appearance with new cosmic header
    console.log('8. Retaking 01_settings_modal_appearance with cosmic header...');
    await page.evaluate(`
      (() => {
        const btn = document.querySelector('[data-testid="sidebar-settings-button"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(1000);
    const shotSettings = path.join(shotsDir, '01_settings_modal_appearance.png');
    await page.screenshot(shotSettings);
    console.log('  📸 Screenshot saved: 01_settings_modal_appearance.png');

    console.log('\n=== LOBBY THEME TEST COMPLETE ===');
  } catch (err) {
    console.error('Lobby theme test error:', err);
  } finally {
    await browser.close();
  }
}

run();
