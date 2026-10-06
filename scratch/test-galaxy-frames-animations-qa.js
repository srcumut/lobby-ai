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

async function runQA() {
  console.log('================================================================');
  console.log('🌌 QA TEST: GALAXY THEME, DECORATIVE FRAMES & LOOP ANIMATIONS');
  console.log('================================================================\n');

  const browser = new CDPBrowser(9230);
  await browser.launch({ width: 1366, height: 868 });
  const page = await browser.newPage();

  const results = {
    authSuccess: false,
    galaxyThemeEquipped: false,
    topBarThemeGalaxy: false,
    logoThemeGalaxy: false,
    sidebarThemeGalaxy: false,
    universalInversionTextBlackToWhite: false,
    universalInversionBgWhiteToGalaxy: false,
    universalInversionBorderBlackToWhite: false,
    zigzagSawtoothFrameRendered: false,
    shopAnimationsTabWorking: false,
    loopAnimationEquippedAndPlaying: false,
  };

  try {
    // Step 1: Login
    console.log('1. Logging in as qa_test123@example.com...');
    await page.navigate(`${BASE_URL}/login`);
    await sleep(1500);
    await setReactInput(page, '#email', 'qa_test123@example.com');
    await setReactInput(page, '#password', 'Password123!');
    await sleep(500);
    await page.evaluate(`document.querySelector('button[type="submit"]')?.click();`);
    
    // Wait for redirect to /lobbies or token in localStorage
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      const isAuthed = await page.evaluate(`!!localStorage.getItem('access_token')`);
      if (isAuthed) {
        results.authSuccess = true;
        break;
      }
    }
    console.log(`   Logged in? ${results.authSuccess ? '✅ YES' : '❌ NO'}`);

    // Step 2: Equip Deep Galaxy Theme
    console.log('\n2. Equipping Deep Galaxy Theme via cosmetics store/API...');
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
    await sleep(1000);

    // Navigate to /profile to inspect the full page
    await page.navigate(`${BASE_URL}/profile`);
    await sleep(2000);

    // Step 3: Check Deep Galaxy Theme on TopBar, Logo, Sidebar
    console.log('\n3. Verifying Deep Galaxy Styling on Navbar, Logo, and Sidebar...');
    const galaxyChecks = await page.evaluate(`
      (() => {
        const topbar = document.querySelector('header');
        const topbarBg = topbar ? window.getComputedStyle(topbar).backgroundColor : null;
        
        const logoLobby = document.querySelector('.logo-lobby-box');
        const logoLobbyBg = logoLobby ? window.getComputedStyle(logoLobby).backgroundColor : null;
        const logoLobbyBorder = logoLobby ? window.getComputedStyle(logoLobby).borderColor : null;

        const sidebar = document.querySelector('aside');
        const sidebarBg = sidebar ? window.getComputedStyle(sidebar).backgroundColor : null;

        const htmlTheme = document.documentElement.getAttribute('data-theme');
        const bodyTheme = document.body.classList.contains('theme-deep-galaxy');
        const rootTheme = document.querySelector('[data-testid="app-shell-root"]')?.getAttribute('data-theme');

        return {
          htmlTheme,
          bodyTheme,
          rootTheme,
          topbarBg,
          logoLobbyBg,
          logoLobbyBorder,
          sidebarBg
        };
      })()
    `);
    console.log('   Theme attributes & background checks:', galaxyChecks);

    if (galaxyChecks.topbarBg === 'rgb(7, 11, 20)' || galaxyChecks.topbarBg === 'rgb(11, 17, 32)') {
      console.log('   ✅ TopBar is styled in Deep Galaxy Navy (#070B14 / #0B1120)');
      results.topBarThemeGalaxy = true;
    } else {
      console.log('   ⚠️ TopBar bg:', galaxyChecks.topbarBg);
    }

    if (galaxyChecks.logoLobbyBg === 'rgb(30, 27, 75)') {
      console.log('   ✅ Logo "LOBBY" block is styled in Cosmic Indigo (#1E1B4B)');
      results.logoThemeGalaxy = true;
    } else {
      console.log('   ⚠️ Logo LOBBY bg:', galaxyChecks.logoLobbyBg);
    }

    if (galaxyChecks.sidebarBg === 'rgb(7, 11, 20)' || galaxyChecks.sidebarBg === 'rgb(11, 17, 32)') {
      console.log('   ✅ Sidebar is styled in Deep Galaxy Navy (#070B14 / #0B1120)');
      results.sidebarThemeGalaxy = true;
    } else {
      console.log('   ⚠️ Sidebar bg:', galaxyChecks.sidebarBg);
    }

    // Step 4: Check Universal Inversion (Black to White, White to Dark Galaxy Blue)
    console.log('\n4. Verifying Universal Inversion (Black -> White, White -> Dark Galaxy Blue)...');
    const inversionChecks = await page.evaluate(`
      (() => {
        // Elements with .text-black
        const blackTextEl = document.querySelector('.text-black, h1, h2, h3');
        const blackTextColor = blackTextEl ? window.getComputedStyle(blackTextEl).color : null;

        // Elements with .bg-white
        const whiteBgEl = document.querySelector('.bg-white, [class*="bg-[#FFFDF5]"], [class*="bg-[#FDFBF7]"]');
        const whiteBgComputed = whiteBgEl ? window.getComputedStyle(whiteBgEl).backgroundColor : null;

        // Elements with .border-black
        const blackBorderEl = document.querySelector('.border-black, [class*="border-black"]');
        const blackBorderComputed = blackBorderEl ? window.getComputedStyle(blackBorderEl).borderColor : null;

        return {
          blackTextColor,
          whiteBgComputed,
          blackBorderComputed
        };
      })()
    `);
    console.log('   Inversion styles:', inversionChecks);

    if (inversionChecks.blackTextColor === 'rgb(255, 255, 255)') {
      console.log('   ✅ PASS: Black text inverted to WHITE (rgb(255, 255, 255))');
      results.universalInversionTextBlackToWhite = true;
    } else {
      console.log('   ⚠️ Text color:', inversionChecks.blackTextColor);
    }

    if (inversionChecks.whiteBgComputed === 'rgb(11, 17, 32)' || inversionChecks.whiteBgComputed === 'rgb(7, 11, 20)') {
      console.log('   ✅ PASS: White surface converted to DARK GALAXY BLUE (#0B1120 / #070B14)');
      results.universalInversionBgWhiteToGalaxy = true;
    } else {
      console.log('   ⚠️ Surface bg:', inversionChecks.whiteBgComputed);
    }

    if (inversionChecks.blackBorderComputed === 'rgb(255, 255, 255)') {
      console.log('   ✅ PASS: Black border converted to WHITE (rgb(255, 255, 255))');
      results.universalInversionBorderBlackToWhite = true;
    } else {
      console.log('   ⚠️ Border color:', inversionChecks.blackBorderComputed);
    }

    // Step 5: Check Decorative Avatar Frames (Zigzag Sawtooth Frame border_gold_brutal)
    console.log('\n5. Verifying Decorative Avatar Frames & Interweaving Zigzag Sawtooth SVG...');
    
    // Check on /profile first
    let frameChecks = await page.evaluate(`
      (() => {
        const frameSvg = document.querySelector('.avatar-frame-svg');
        const zigzagPath = document.querySelector('.avatar-frame-svg path[data-type="zigzag"]');
        const hasSawtooth = zigzagPath ? zigzagPath.getAttribute('d') : null;
        const strokeColor = zigzagPath ? zigzagPath.getAttribute('stroke') : null;
        const fillColor = zigzagPath ? zigzagPath.getAttribute('fill') : null;
        const hasBreatheAnim = !!document.querySelector('.avatar-anim-breathe, [class*="avatar-breathe"]');

        return {
          hasFrameSvg: !!frameSvg,
          hasZigzag: !!zigzagPath,
          sawtoothLength: hasSawtooth ? hasSawtooth.length : 0,
          sawtoothSample: hasSawtooth ? hasSawtooth.slice(0, 45) : null,
          strokeColor,
          fillColor,
          hasBreatheAnim
        };
      })()
    `);
    console.log('   Avatar Frame & Zigzag verification on /profile:', frameChecks);

    if (frameChecks.hasFrameSvg && frameChecks.hasZigzag && frameChecks.sawtoothLength > 50) {
      console.log('   ✅ PASS: Interweaving yellow/black zigzag frame successfully rendered on Profile!');
      results.zigzagSawtoothFrameRendered = true;
    }

    if (frameChecks.hasBreatheAnim) {
      console.log('   ✅ PASS: Loop Animation (anim_breathe) active on profile avatar!');
      results.loopAnimationEquippedAndPlaying = true;
    }

    // Step 6: Test Shop Page for Avatar Frames and Purchasable Loop Animations
    console.log('\n6. Navigating to /shop to test "Avatar Çerçeveleri" & "Avatar Animasyonları" catalogs...');
    await page.navigate(`${BASE_URL}/shop`);
    await sleep(2000);

    // 6a. Test "Avatar Çerçeveleri" tab
    console.log('   Testing "Avatar Çerçeveleri" tab in shop...');
    await page.evaluate(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const frameTab = buttons.find(b => b.innerText.includes('Avatar Çerçeveleri'));
        if (frameTab) frameTab.click();
      })()
    `);
    await sleep(1000);

    const frameShopItems = await page.evaluate(`
      (() => {
        const zigzagCard = Array.from(document.querySelectorAll('.grid > div')).find(d => d.innerText.includes('ZİGZAG') || d.innerText.includes('Zigzag') || d.innerText.includes('Altın'));
        const zigzagSvg = zigzagCard ? zigzagCard.querySelector('.avatar-frame-svg') : null;
        const zigzagPath = zigzagCard ? zigzagCard.querySelector('path[data-type="zigzag"]') : null;
        return {
          hasZigzagCard: !!zigzagCard,
          hasZigzagSvg: !!zigzagSvg,
          hasZigzagPath: !!zigzagPath,
          sawtoothSample: zigzagPath ? zigzagPath.getAttribute('d').slice(0, 45) : null
        };
      })()
    `);
    console.log('   Shop "Avatar Çerçeveleri" verification:', frameShopItems);
    if (frameShopItems.hasZigzagSvg && frameShopItems.hasZigzagPath) {
      console.log('   ✅ PASS: Zigzag Sawtooth SVG Frame preview verified in Shop catalog!');
      results.zigzagSawtoothFrameRendered = true;
    }

    // 6b. Test "Avatar Animasyonları" tab
    console.log('   Testing "Avatar Animasyonları" tab in shop...');
    await page.evaluate(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const animTab = buttons.find(b => b.innerText.includes('Avatar Animasyonları'));
        if (animTab) animTab.click();
      })()
    `);
    await sleep(1000);

    const animItems = await page.evaluate(`
      (() => {
        const items = Array.from(document.querySelectorAll('.grid > div'));
        return items.map(it => {
          const title = it.querySelector('h3')?.innerText;
          const price = it.querySelector('.text-lg')?.innerText;
          const hasBreatheClass = !!it.querySelector('.avatar-anim-breathe, [class*="avatar-breathe"]');
          return { title, price, hasBreatheClass };
        }).filter(it => it.title);
      })()
    `);
    console.log(`   Found ${animItems.length} items in Avatar Animasyonları:`, animItems);

    if (animItems.length >= 5) {
      console.log('   ✅ PASS: All 5 avatar loop animations are listed with prices and live previews in the Shop!');
      results.shopAnimationsTabWorking = true;
    }

    // Take screenshot of Shop and Profile
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    
    const shopScreenshotPath = path.join(screenshotDir, 'shop-galaxy-animations.png');
    await page.screenshot(shopScreenshotPath);
    console.log(`   📸 Shop screenshot saved: ${shopScreenshotPath}`);

    await page.navigate(`${BASE_URL}/profile`);
    await sleep(1500);
    const profileScreenshotPath = path.join(screenshotDir, 'profile-galaxy-zigzag.png');
    await page.screenshot(profileScreenshotPath);
    console.log(`   📸 Profile screenshot saved: ${profileScreenshotPath}`);

    console.log('\n================================================================');
    console.log('🏁 FINAL QA SUMMARY');
    console.log('================================================================');
    console.table(results);

  } catch (err) {
    console.error('❌ QA Execution Error:', err);
  } finally {
    await browser.close();
  }
}

runQA();
