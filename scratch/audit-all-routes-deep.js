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

// Helper to check element contrast
async function inspectPageContrast(page, routeName) {
  return await page.evaluate(`
    (() => {
      const issues = [];
      const els = Array.from(document.querySelectorAll('button, a, input, h1, h2, h3, h4, p, span, div'));
      
      function parseRgb(str) {
        if (!str || str === 'transparent' || str === 'rgba(0, 0, 0, 0)') return null;
        const m = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
        return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : null;
      }

      function getEffectiveBg(el) {
        let cur = el;
        while (cur && cur !== document.documentElement) {
          const bg = window.getComputedStyle(cur).backgroundColor;
          const parsed = parseRgb(bg);
          if (parsed) return { rgb: parsed, str: bg, el: cur };
          cur = cur.parentElement;
        }
        return { rgb: [7, 11, 20], str: 'rgb(7, 11, 20)', el: document.body };
      }

      function isLight(rgb) {
        // luminance approx
        return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) > 140;
      }

      for (const el of els) {
        // Only inspect visible elements with actual text
        if (!el.offsetParent && el.tagName !== 'BODY') continue;
        const text = el.innerText?.trim();
        if (!text || text.length === 0 || text.length > 80) continue;
        // Avoid checking containers with many children
        if (el.children.length > 2) continue;

        const style = window.getComputedStyle(el);
        const textRgb = parseRgb(style.color);
        if (!textRgb) continue;

        const bg = getEffectiveBg(el);
        const textIsLight = isLight(textRgb);
        const bgIsLight = isLight(bg.rgb);

        // Conflict: light text on light bg OR dark text on dark bg
        if (textIsLight === bgIsLight) {
          issues.push({
            tag: el.tagName,
            text: text.slice(0, 30),
            textColor: style.color,
            bgColor: bg.str,
            className: el.className?.toString().slice(0, 50) || ''
          });
        }
      }
      return issues;
    })()
  `);
}

async function auditAll() {
  const browser = new CDPBrowser(9270);
  await browser.launch({ width: 1366, height: 900 });
  const page = await browser.newPage();

  const shotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });

  const auditReport = {};

  try {
    console.log('1. Logging in...');
    await page.navigate(`${BASE_URL}/login`);
    await sleep(1500);
    await setReactInput(page, '#email', 'qa_gold_tester@example.com');
    await setReactInput(page, '#password', 'Password123!');
    await sleep(300);
    await page.evaluate(`document.querySelector('button[type="submit"]')?.click();`);
    await sleep(2000);

    console.log('2. Setting global theme...');
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

    const routes = [
      { name: 'dashboard', url: `${BASE_URL}/` },
      { name: 'lobbies', url: `${BASE_URL}/lobbies` },
      { name: 'community', url: `${BASE_URL}/community` },
      { name: 'messages', url: `${BASE_URL}/messages` },
      { name: 'shop', url: `${BASE_URL}/shop` },
      { name: 'profile', url: `${BASE_URL}/profile` },
      { name: 'agents', url: `${BASE_URL}/agents` },
      { name: 'agents_builder', url: `${BASE_URL}/agents/builder` },
    ];

    for (const r of routes) {
      console.log(`\nAuditing route: ${r.name} (${r.url})...`);
      await page.navigate(r.url);
      await sleep(1500);

      const shotPath = path.join(shotsDir, `audit_${r.name}.png`);
      await page.screenshot(shotPath);
      console.log(`  📸 Screenshot saved: audit_${r.name}.png`);

      const issues = await inspectPageContrast(page, r.name);
      auditReport[r.name] = issues;
      console.log(`  Found ${issues.length} potential contrast issues on ${r.name}`);
      if (issues.length > 0) {
        console.table(issues.slice(0, 5));
      }
    }

    // Now test Modals
    console.log('\nAuditing Modals...');

    // 1. Quests Modal
    console.log('Opening Quests Modal...');
    await page.evaluate(`document.querySelector('[data-testid="nav-quests-button"]')?.click();`);
    await sleep(1000);
    await page.screenshot(path.join(shotsDir, 'audit_modal_quests.png'));
    const questIssues = await inspectPageContrast(page, 'modal_quests');
    auditReport['modal_quests'] = questIssues;
    await page.evaluate(`document.querySelector('[data-testid="quests-close-button"], [role="dialog"] button')?.click();`);
    await sleep(500);

    // 2. Profile Card Modal on /profile
    console.log('Opening Profile Card Modal...');
    await page.navigate(`${BASE_URL}/profile`);
    await sleep(1500);
    await page.evaluate(`document.querySelector('[data-testid="profile-card-modal-button"]')?.click();`);
    await sleep(1000);
    await page.screenshot(path.join(shotsDir, 'audit_modal_profile_card.png'));
    const profileCardIssues = await inspectPageContrast(page, 'modal_profile_card');
    auditReport['modal_profile_card'] = profileCardIssues;
    await page.evaluate(`document.querySelector('[role="dialog"] button')?.click();`);
    await sleep(500);

    // 3. Create Lobby Modal on /lobbies
    console.log('Opening Create Lobby Modal on /lobbies...');
    await page.navigate(`${BASE_URL}/lobbies`);
    await sleep(1500);
    await page.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const createBtn = btns.find(b => b.innerText.includes('Lobi Oluştur') || b.innerText.includes('Yeni Lobi'));
        if (createBtn) createBtn.click();
      })()
    `);
    await sleep(1000);
    await page.screenshot(path.join(shotsDir, 'audit_modal_create_lobby.png'));
    const createLobbyIssues = await inspectPageContrast(page, 'modal_create_lobby');
    auditReport['modal_create_lobby'] = createLobbyIssues;

    // Check Lobby Room (Active Chat)
    console.log('\nAuditing an active Lobby Room /lobby/[id]...');
    await page.navigate(`${BASE_URL}/lobbies`);
    await sleep(1500);
    const clicked = await page.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const joinBtn = btns.find(b => b.innerText.includes('LOBİYE KATIL'));
        if (joinBtn) {
          joinBtn.click();
          return true;
        }
        return false;
      })()
    `);
    if (clicked) {
      await sleep(3000);
      console.log('Navigated into lobby room, capturing screenshot...');
      await page.screenshot(path.join(shotsDir, 'audit_lobby_room.png'));
      const lobbyIssues = await inspectPageContrast(page, 'lobby_room');
      auditReport['lobby_room'] = lobbyIssues;
    } else {
      console.log('No join button found on /lobbies.');
    }

    fs.writeFileSync(path.join(__dirname, 'audit_report.json'), JSON.stringify(auditReport, null, 2));
    console.log('\nAudit complete! Saved audit_report.json.');

  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    await browser.close();
  }
}

auditAll();
