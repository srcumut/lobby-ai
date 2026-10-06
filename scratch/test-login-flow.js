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

async function main() {
  const browser = new CDPBrowser(9225);
  await browser.launch({ width: 1280, height: 800 });
  const page = await browser.newPage();

  console.log('Testing simple login at /login:');
  await page.navigate('http://localhost:3000/login');
  await sleep(1000);
  await page.evaluate(`localStorage.clear(); sessionStorage.clear();`);
  await page.navigate('http://localhost:3000/login');
  await sleep(1500);

  // Fill credentials and click submit
  await setReactInput(page, '#email', 'qa_test123@example.com');
  await setReactInput(page, '#password', 'Password123!');
  await sleep(500);

  await page.evaluate(`
    document.querySelector('button[type="submit"]').click();
  `);

  console.log('Submitted form. Waiting for navigation/result...');
  for (let i = 0; i < 8; i++) {
    await sleep(500);
    const state = await page.evaluate(`({
      url: window.location.href,
      path: window.location.pathname,
      token: !!localStorage.getItem('access_token'),
      h1: document.querySelector('h1, h2, .font-black')?.innerText
    })`);
    console.log(`Step ${i} (${(i+1)*500}ms):`, state);
  }

  // Now test with query parameter: /login?redirect=/profile
  console.log('\n--- Testing with ?redirect=/profile ---');
  await page.evaluate(`localStorage.clear(); sessionStorage.clear();`);
  await page.navigate('http://localhost:3000/login?redirect=/profile');
  await sleep(1500);

  await setReactInput(page, '#email', 'qa_test123@example.com');
  await setReactInput(page, '#password', 'Password123!');
  await sleep(500);

  await page.evaluate(`
    document.querySelector('button[type="submit"]').click();
  `);

  for (let i = 0; i < 8; i++) {
    await sleep(500);
    const state = await page.evaluate(`({
      url: window.location.href,
      path: window.location.pathname,
      token: !!localStorage.getItem('access_token'),
      h1: document.querySelector('h1, h2, .font-black')?.innerText
    })`);
    console.log(`Step ${i} (${(i+1)*500}ms):`, state);
  }

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
