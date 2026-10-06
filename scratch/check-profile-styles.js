const { CDPBrowser } = require('C:\\Users\\Umut\\.gemini\\antigravity\\brain\\f37e161a-11f3-4f14-876c-eb6f3b4ded11\\scratch\\cdp-client.js');

async function run() {
  const browser = new CDPBrowser(9248);
  await browser.launch({ width: 1366, height: 900 });
  const page = await browser.newPage();
  await page.navigate('http://localhost:3000/login');
  await new Promise(r => setTimeout(r, 1500));
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
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(`
    (() => {
      const key = 'lobby-ai:equipped-cosmetics';
      let cur = { global_theme: 'global_theme_deep_galaxy', border: 'border_gold_brutal', avatar_animation: 'anim_breathe' };
      localStorage.setItem(key, JSON.stringify(cur));
      window.dispatchEvent(new CustomEvent('lobby:cosmetics_updated', { detail: cur }));
    })()
  `);
  await page.navigate('http://localhost:3000/profile');
  await new Promise(r => setTimeout(r, 2000));

  const issues = await page.evaluate(`
    (() => {
      const results = [];
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const el of buttons) {
        if (!el.offsetParent) continue;
        const text = el.innerText?.trim();
        const style = window.getComputedStyle(el);
        results.push({
          text: text ? text.replace(/\\n/g, ' ').slice(0, 35) : '(icon)',
          color: style.color,
          bg: style.backgroundColor,
          border: style.borderColor,
          classes: el.className
        });
      }
      return results;
    })()
  `);
  console.log('BUTTONS ON /profile:');
  console.table(issues);

  const inputs = await page.evaluate(`
    (() => {
      const results = [];
      const els = Array.from(document.querySelectorAll('input, textarea'));
      for (const el of els) {
        if (!el.offsetParent) continue;
        const style = window.getComputedStyle(el);
        results.push({
          id: el.id,
          placeholder: el.placeholder,
          color: style.color,
          bg: style.backgroundColor,
          border: style.borderColor
        });
      }
      return results;
    })()
  `);
  console.log('INPUTS ON /profile:');
  console.table(inputs);

  await browser.close();
}

run().catch(console.error);
