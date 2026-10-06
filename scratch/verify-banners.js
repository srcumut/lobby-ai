const { CDPBrowser } = require('C:\\Users\\Umut\\.gemini\\antigravity\\brain\\f37e161a-11f3-4f14-876c-eb6f3b4ded11\\scratch\\cdp-client.js');
const path = require('path');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function testBanners() {
  const browser = new CDPBrowser(9262);
  await browser.launch({ width: 1366, height: 900 });
  const page = await browser.newPage();
  await page.navigate('http://localhost:3000/login');
  await sleep(1500);
  await page.evaluate(`
    (() => {
      const el1 = document.querySelector('#email');
      const el2 = document.querySelector('#password');
      const proto = window.HTMLInputElement.prototype;
      const setVal = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setVal.call(el1, 'qa_gold_tester@example.com');
      el1.dispatchEvent(new Event('input', { bubbles: true }));
      setVal.call(el2, 'Password123!');
      el2.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('button[type="submit"]').click();
    })()
  `);
  await sleep(2000);
  await page.evaluate(`
    (() => {
      const key = 'lobby-ai:equipped-cosmetics';
      let cur = { global_theme: 'global_theme_deep_galaxy', border: 'border_gold_brutal', avatar_animation: 'anim_breathe' };
      localStorage.setItem(key, JSON.stringify(cur));
      window.dispatchEvent(new CustomEvent('lobby:cosmetics_updated', { detail: cur }));
    })()
  `);

  // Shop page
  await page.navigate('http://localhost:3000/shop');
  await sleep(2000);
  await page.screenshot(path.join(__dirname, 'screenshots', 'verify_shop.png'));

  // Agents page
  await page.navigate('http://localhost:3000/agents');
  await sleep(2000);
  await page.screenshot(path.join(__dirname, 'screenshots', 'verify_agents.png'));

  await browser.close();
}

testBanners().catch(console.error);
