const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function fmtDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  const networkLogs = [];
  const dialogs = [];
  page.on('request', (req) => {
    networkLogs.push({ type: 'request', url: req.url(), method: req.method(), resourceType: req.resourceType() });
  });
  page.on('response', async (res) => {
    networkLogs.push({ type: 'response', url: res.url(), status: res.status() });
  });
  page.on('dialog', async (dialog) => {
    dialogs.push({ type: dialog.type(), message: dialog.message() });
    await dialog.dismiss();
  });

  await page.goto('https://www.12306.cn/index/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});

  // DOM 全量枚举
  const anchors = await page.$$eval('a', (as) => as.map((a) => ({
    text: (a.textContent || '').trim(),
    innerText: (a.innerText || '').trim(),
    href: a.getAttribute('href'),
    dataHref: a.getAttribute('data-href'),
    name: a.getAttribute('name'),
    id: a.id,
    class: a.className,
    target: a.getAttribute('target'),
    role: a.getAttribute('role'),
    ariaLabel: a.getAttribute('aria-label'),
    title: a.getAttribute('title'),
  })));

  const inputs = await page.$$eval('input, select, textarea, button', (els) => els.map((el) => ({
    tag: el.tagName.toLowerCase(),
    type: el.getAttribute('type'),
    name: el.getAttribute('name'),
    id: el.id,
    class: el.className,
    placeholder: el.getAttribute('placeholder'),
    value: el.value,
    disabled: el.disabled || el.getAttribute('disabled') !== null,
    readonly: el.readOnly || el.getAttribute('readonly') !== null,
    ariaLabel: el.getAttribute('aria-label'),
    ariaDescribedby: el.getAttribute('aria-describedby'),
  })));

  // 日期负向用例：过去日期
  const dateNegative = { steps: [], observations: {} };
  try {
    const fromSel = '#fromStationText';
    const toSel = '#toStationText';
    const dateSel = '#train_date';
    const searchSel = '#search_one';

    // 输入并选择建议（避免弹层遮挡）
    await page.fill(fromSel, '北京');
    await page.keyboard.press('Enter');
    await page.fill(toSel, '上海');
    await page.keyboard.press('Enter');
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const pastStr = fmtDate(pastDate);
    await page.fill(dateSel, pastStr);
    dateNegative.steps.push({ action: 'fill', selector: dateSel, value: pastStr });

    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      page.click(searchSel),
    ]);
    await page.waitForTimeout(2000);
    dateNegative.observations.pageURL = page.url();
    dateNegative.observations.popupURL = popup ? popup.url() : null;

    // 侦测错误提示文案
    const errText = await page.evaluate(() => {
      const cands = ['.layui-layer-content', '.error', '#msg', '.box-tips', '.toast'];
      for (const s of cands) {
        const el = document.querySelector(s);
        if (el && el.innerText) return el.innerText.trim();
      }
      return null;
    });
    dateNegative.observations.errorText = errText;
    dateNegative.observations.dialogs = null; // 将在总体写入 dialogs
  } catch (e) {
    dateNegative.observations.error = String(e);
  }

  // 输出证据
  fs.mkdirSync(path.join(process.cwd(), 'evidence'), { recursive: true });
  fs.writeFileSync(path.join('evidence', '12306_dom_inventory.json'), JSON.stringify({ anchors, inputs }, null, 2), 'utf-8');
  fs.writeFileSync(
    path.join('evidence', '12306_date_test.json'),
    JSON.stringify({ dateNegative, dialogs, networkLogs }, null, 2),
    'utf-8'
  );

  await browser.close();
}

run().catch((e) => {
  console.error('Playwright script failed:', e);
  process.exit(1);
});