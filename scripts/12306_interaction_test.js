const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function getFirstExisting(page, selectors) {
  for (const s of selectors) {
    try {
      const handle = await page.$(s);
      if (handle) return s;
    } catch {}
  }
  return null;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  const networkLogs = [];
  page.on('request', (req) => {
    networkLogs.push({
      type: 'request',
      url: req.url(),
      method: req.method(),
      headers: req.headers(),
      postData: req.postData(),
      resourceType: req.resourceType(),
    });
  });
  page.on('response', async (res) => {
    let bodySize = null;
    try {
      const body = await res.body();
      bodySize = body.length;
    } catch {}
    networkLogs.push({
      type: 'response',
      url: res.url(),
      status: res.status(),
      headers: await res.headers(),
      bodySize,
    });
  });

  await page.goto('https://www.12306.cn/index/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});

  fs.mkdirSync(path.join(process.cwd(), 'evidence'), { recursive: true });
  await page.screenshot({ path: path.join('evidence', '12306_home.png'), fullPage: true });

  // 顶部导航枚举
  let topNavItems = [];
  try {
    topNavItems = await page.$$eval('#topMenu a', (els) =>
      els.map((a) => ({
        text: (a.textContent || '').trim(),
        href: a.getAttribute('href'),
        target: a.getAttribute('target'),
        role: a.getAttribute('role'),
        id: a.id,
        class: a.className,
      }))
    );
  } catch {}

  // 搜索模块定位
  const fromSel = await getFirstExisting(page, ['#fromStationText', 'input[name="fromStation"]', 'input[placeholder*="出发"]']);
  const toSel = await getFirstExisting(page, ['#toStationText', 'input[name="toStation"]', 'input[placeholder*="到达"]']);
  const dateSel = await getFirstExisting(page, ['#train_date', 'input[name="train_date"]', 'input[placeholder*="日期"]', 'input[type="date"]']);
  const searchSel = await getFirstExisting(page, ['#search_one', 'a#search_one', 'button:has-text("查")', 'a:has-text("查")', '.query-btn']);

  const interactions = [];

  // 空输入点击查询
  if (searchSel) {
    try {
      await page.click(searchSel, { timeout: 10000 });
      await page.waitForTimeout(1500);
      const errText = await page.evaluate(() => {
        const cands = ['.error', '.layui-layer-content', '.dialog', '.toast', '#msg'];
        for (const s of cands) {
          const el = document.querySelector(s);
          if (el && el.innerText) return el.innerText.trim();
        }
        return null;
      });
      interactions.push({ name: 'empty_search', selector: searchSel, resultText: errText });
    } catch (e) {
      interactions.push({ name: 'empty_search', selector: searchSel, error: String(e) });
    }
  }

  // 无效站点
  if (fromSel && toSel && searchSel) {
    try {
      await page.fill(fromSel, '不存在站点');
      await page.fill(toSel, '不存在站点XYZ');
      await page.click(searchSel);
      await page.waitForTimeout(1500);
      const invalidMsg = await page.evaluate(() => {
        const cands = ['.error', '.layui-layer-content', '.dialog', '.toast', '#msg'];
        for (const s of cands) {
          const el = document.querySelector(s);
          if (el && el.innerText) return el.innerText.trim();
        }
        return null;
      });
      interactions.push({ name: 'invalid_station', fromSel, toSel, resultText: invalidMsg });
    } catch (e) {
      interactions.push({ name: 'invalid_station', fromSel, toSel, error: String(e) });
    }
  }

  // 有效站点
  if (fromSel && toSel && searchSel) {
    try {
      await page.fill(fromSel, '北京');
      await page.waitForTimeout(600);
      await page.keyboard.press('Enter');
      await page.fill(toSel, '上海');
      await page.waitForTimeout(600);
      await page.keyboard.press('Enter');

      if (dateSel) {
        const dt = new Date();
        dt.setDate(dt.getDate() + 7);
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        const val = `${yyyy}-${mm}-${dd}`;
        try {
          await page.fill(dateSel, val);
        } catch {}
      }

      const [popup] = await Promise.all([
        page.waitForEvent('popup').catch(() => null),
        page.click(searchSel),
      ]);
      await page.waitForTimeout(4000);
      const currentURL = page.url();
      const popupURL = popup ? popup.url() : null;
      interactions.push({ name: 'valid_station', pageURL: currentURL, popupURL });
    } catch (e) {
      interactions.push({ name: 'valid_station', error: String(e) });
    }
  }

  // 顶部导航点击
  const topNavTests = [];
  for (const item of ['我的12306', '登录注册', 'English', '敬老版']) {
    try {
      const locator = page.locator('#topMenu a', { hasText: item });
      if ((await locator.count()) > 0) {
        const [pop] = await Promise.all([
          page.waitForEvent('popup').catch(() => null),
          locator.first().click(),
        ]);
        await page.waitForTimeout(2000);
        topNavTests.push({ text: item, landingURL: pop ? pop.url() : page.url() });
        if (!pop) await page.goBack().catch(() => {});
      }
    } catch (e) {
      topNavTests.push({ text: item, error: String(e) });
    }
  }

  // 轮播点击
  try {
    const firstCarousel = await page.$('div.tempWrap ul.sowingMap li a');
    if (firstCarousel) {
      const [pop] = await Promise.all([
        page.waitForEvent('popup').catch(() => null),
        firstCarousel.click(),
      ]);
      await page.waitForTimeout(2000);
      interactions.push({ name: 'carousel_click', landingURL: pop ? pop.url() : page.url() });
      if (!pop) await page.goBack().catch(() => {});
    }
  } catch (e) {
    interactions.push({ name: 'carousel_click', error: String(e) });
  }

  // 公告“更多>”
  try {
    const moreLink = await page.$('div.news-index div.news-more a');
    if (moreLink) {
      const [pop] = await Promise.all([
        page.waitForEvent('popup').catch(() => null),
        moreLink.click(),
      ]);
      await page.waitForTimeout(2000);
      interactions.push({ name: 'news_more_click', landingURL: pop ? pop.url() : page.url() });
      if (!pop) await page.goBack().catch(() => {});
    }
  } catch (e) {
    interactions.push({ name: 'news_more_click', error: String(e) });
  }

  // 服务入口
  try {
    const serviceEntry = await page.$('ul#g-service-lg-list li a');
    if (serviceEntry) {
      const [pop] = await Promise.all([
        page.waitForEvent('popup').catch(() => null),
        serviceEntry.click(),
      ]);
      await page.waitForTimeout(2000);
      interactions.push({ name: 'service_entry_click', landingURL: pop ? pop.url() : page.url() });
      if (!pop) await page.goBack().catch(() => {});
    }
  } catch (e) {
    interactions.push({ name: 'service_entry_click', error: String(e) });
  }

  // 全量链接与输入枚举
  let anchors = [], inputs = [];
  try {
    anchors = await page.$$eval('a', (as) =>
      as.map((a) => ({
        text: (a.textContent || '').trim(),
        href: a.getAttribute('href'),
        target: a.getAttribute('target'),
        name: a.getAttribute('name'),
        id: a.id,
        class: a.className,
      }))
    );
  } catch {}
  try {
    inputs = await page.$$eval('input, select, button', (els) =>
      els.map((el) => ({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type'),
        name: el.getAttribute('name'),
        id: el.id,
        class: el.className,
        placeholder: el.getAttribute('placeholder'),
        value: el.value,
      }))
    );
  } catch {}

  const evidence = {
    topNavItems,
    fromSel,
    toSel,
    dateSel,
    searchSel,
    interactions,
    topNavTests,
    anchors,
    inputs,
    networkLogs,
  };

  fs.writeFileSync(path.join('evidence', '12306_interactions.json'), JSON.stringify(evidence, null, 2), 'utf-8');

  await browser.close();
}

run().catch((e) => {
  console.error('Playwright script failed:', e);
  process.exit(1);
});