const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function fmtDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function ensureSelectSuggestion(page, inputSel, strategy = 'enter') {
  try {
    const pop = await page.$('#choice_div');
    if (pop) {
      if (strategy === 'enter') {
        await page.keyboard.press('Enter');
      } else if (strategy === 'tab') {
        await page.keyboard.press('Tab');
      } else {
        await page.click('body', { position: { x: 10, y: 10 } });
      }
      await page.waitForTimeout(300);
    }
  } catch {}
}

// 获取站名代码映射（解析官网 JS station_name）
async function getStationCode(page, name) {
  const sources = [
    'https://www.12306.cn/index/script/core/common/station_name_new_v10091.js',
    'https://kyfw.12306.cn/otn/resources/js/framework/station_name.js',
  ];
  for (const url of sources) {
    try {
      const text = await page.evaluate(async (u) => {
        const res = await fetch(u, { cache: 'no-cache' });
        return await res.text();
      }, url);
      if (!text) continue;
      const items = text.split('@').slice(1);
      for (const it of items) {
        const parts = it.split('|');
        // 形如：abbr|中文|电报码|全拼|简拼|序号
        if (parts.length >= 6) {
          const abbr = parts[0];
          const zh = parts[1];
          const code = parts[2];
          const pinyin = parts[3];
          const short = parts[4];
          let matchedBy = null;
          if (name === zh) matchedBy = 'zh';
          else if (name === pinyin) matchedBy = 'pinyin';
          else if (name === short) matchedBy = 'short';
          if (matchedBy) {
            return { name: zh, code, source: url, matchedBy, abbr };
          }
        }
      }
    } catch (e) {
      // ignore and try next source
    }
  }
  return null;
}

// 直接设置隐藏字段与文本（避免选择弹层干扰）
async function setStationsDirectly(page, fromName, toName) {
  const from = fromName ? await getStationCode(page, fromName) : null;
  const to = toName ? await getStationCode(page, toName) : null;
  const applied = { from, to };
  await page.evaluate(({ from, to }) => {
    const setPair = (hidId, txtId, pair) => {
      const hid = document.getElementById(hidId);
      const txt = document.getElementById(txtId);
      if (pair && hid && txt) {
        hid.value = pair.code;
        txt.value = pair.name;
        // 触发必要事件
        txt.dispatchEvent(new Event('input', { bubbles: true }));
        txt.dispatchEvent(new Event('change', { bubbles: true }));
        txt.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    };
    setPair('fromStation', 'fromStationText', from);
    setPair('toStation', 'toStationText', to);
  }, applied);
  return applied;
}
// 选择站点建议：分别针对出发（#ul_list1）与到达（#ul_list2）列表，尽量点击与输入文本匹配的项
async function selectStationFromList(page, field, text, logRef) {
  const inputSel = field === 'from' ? '#fromStationText' : '#toStationText';
  const listSel = field === 'from' ? '#ul_list1' : '#ul_list2';

  await page.fill(inputSel, text);
  await page.waitForTimeout(400);

  const list = page.locator(listSel);
  const visible = await list.isVisible().catch(() => false);
  if (visible) {
    // 尝试根据中文文本匹配候选项
    const option = page.locator(`${listSel} .cityline, ${listSel} .citylineover`, { hasText: text });
    const anchor = page.locator(`${listSel} li a`, { hasText: text });
    const count = await option.count();
    const acount = await anchor.count();
    if (logRef) {
      logRef[field] = {
        listVisible: true,
        optionCount: count,
        anchorCount: acount,
        clickedText: null,
        clickedId: null,
      };
    }
    if (count > 0) {
      const el = option.first();
      const txt = await el.innerText().catch(() => null);
      const id = await el.getAttribute('id').catch(() => null);
      if (logRef && logRef[field]) { logRef[field].clickedText = txt; logRef[field].clickedId = id; }
      await el.click();
    } else if (acount > 0) {
      const el = anchor.first();
      const txt = await el.innerText().catch(() => null);
      const id = await el.getAttribute('id').catch(() => null);
      if (logRef && logRef[field]) { logRef[field].clickedText = txt; logRef[field].clickedId = id; }
      await el.click();
    } else {
      // 若无精确匹配，则按键选择第一个
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }
  } else {
    // 列表不可见，直接回车尝试选中
    if (logRef) {
      logRef[field] = { listVisible: false };
    }
    await page.keyboard.press('Enter');
  }
  // 关闭弹层，避免点击查询时被遮挡
  await page.keyboard.press('Escape').catch(() => {});
  await page.click('body', { position: { x: 1, y: 1 } }).catch(() => {});
  await page.waitForTimeout(200);
}

// 日期控件：尝试打开并点击目标日期；检测并记录覆盖层，失败则回退填值
async function setDateWithWidget(page, dateStr) {
  const result = { requested: dateStr, widgetVisible: null, clickedDay: null, overlaySelectorsFound: [], hiddenOverlays: [] };
  try {
    await page.click('#train_date').catch(() => {});
    await page.waitForTimeout(300);
    const overlaySelectors = ['.layui-laydate', '.laydate-box', '.laydate', '#laydate_box', '.cal-wrap', '.cal-cm'];
    for (const sel of overlaySelectors) {
      const cnt = await page.locator(sel).count().catch(() => 0);
      if (cnt > 0) result.overlaySelectorsFound.push(sel);
    }
    const widget = page.locator('.layui-laydate, .laydate-box, .laydate, #laydate_box');
    const vis = await widget.first().isVisible().catch(() => false);
    result.widgetVisible = !!vis;
    if (vis) {
      const dd = Number(dateStr.split('-')[2]);
      const cand = page.locator(`.layui-laydate .laydate-day, .laydate .day, td`, { hasText: String(dd) });
      const count = await cand.count().catch(() => 0);
      if (count > 0) {
        await cand.first().click().catch(() => {});
        result.clickedDay = dd;
      }
    }
  } catch {}
  // 无论控件是否可用，都将值写入输入框，确保后续流程
  await page.fill('#train_date', dateStr).catch(() => {});
  // 记录：隐藏覆盖层，避免后续点击被拦截
  try {
    const hidden = await page.evaluate(() => {
      const sels = ['.cal-wrap', '.cal-cm', '.layui-laydate', '#laydate_box'];
      const applied = [];
      sels.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.pointerEvents = 'none';
          applied.push(sel);
        });
      });
      return applied;
    });
    result.hiddenOverlays = hidden || [];
  } catch {}
  return result;
}

// 查询模式切换与按钮探测（选择可见“查询”按钮）
async function switchModeAndDetectSearch(page, modeLabel) {
  const info = { mode: modeLabel, tabClicked: false, searchBtnSelector: '#search_one', candidates: [], usedSelector: null };
  try {
    if (modeLabel && modeLabel !== '单程') {
      const tab = page.locator('div.search-tab-hd >> text=' + modeLabel);
      const exists = await tab.count();
      if (exists > 0) {
        await tab.first().click().catch(() => {});
        info.tabClicked = true;
        await page.waitForTimeout(300);
      }
    }
    // 候选按钮选择器集合（猜测不同模式的可能 id），并记录哪些可见
    const candidates = [
      '#search_one',
      '#search_rt',
      '#search_round',
      '#search_transfer',
      '#search_refund',
      'a.btn.btn-primary.form-block:visible',
      'button.btn.btn-primary.form-block:visible',
      'a:has-text("查询"):visible',
    ];
    for (const sel of candidates) {
      const loc = page.locator(sel);
      const count = await loc.count().catch(() => 0);
      const visible = count > 0 ? await loc.first().isVisible().catch(() => false) : false;
      const id = count > 0 ? await loc.first().getAttribute('id').catch(() => null) : null;
      const text = count > 0 ? await loc.first().innerText().catch(() => null) : null;
      info.candidates.push({ selector: sel, id, text, visible });
      if (!info.usedSelector && visible) {
        info.usedSelector = sel;
        info.searchBtnSelector = sel;
      }
    }
    // 若未发现可见按钮，则回退为默认选择器
    if (!info.usedSelector) info.searchBtnSelector = '#search_one';
  } catch {}
  return info;
}

function parseQueryParams(u) {
  try {
    const url = new URL(u);
    const out = {};
    for (const [k, v] of url.searchParams.entries()) out[k] = v;
    return out;
  } catch { return {}; }
}

async function runCase(page, from, to, label, mode = '单程', opts = {}) {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const dateStr = fmtDate(date);

  const record = { label, input: { from, to, date: dateStr, mode }, meta: {}, result: {} };

  try {
    await page.goto('https://www.12306.cn/index/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});

    // 优先：直接设置隐藏字段与文本，避免弹层选择误选/遮挡（除非指定使用候选列表）
    let directApplied = null;
    if (!opts.useSuggestion && ((from && from.trim()) || (to && to.trim()))) {
      directApplied = await setStationsDirectly(page, from || '', to || '');
    }
    record.meta.directApplied = directApplied;
    // 回退或采样：弹层选择建议项
    const suggestLogs = {};
    if (opts.useSuggestion || !directApplied || !directApplied.from) {
      if (from && from.trim().length > 0) {
        await selectStationFromList(page, 'from', from, suggestLogs);
      } else {
        await ensureSelectSuggestion(page, '#fromStationText', 'tab');
      }
    }
    if (opts.useSuggestion || !directApplied || !directApplied.to) {
      if (to && to.trim().length > 0) {
        await selectStationFromList(page, 'to', to, suggestLogs);
      } else {
        await ensureSelectSuggestion(page, '#toStationText', 'tab');
      }
    }
    record.meta.suggestionLogs = suggestLogs;

    const dateWidgetRes = await setDateWithWidget(page, dateStr);
    record.meta.dateWidget = dateWidgetRes;

    // 切换查询模式并探测按钮
    const modeInfo = await switchModeAndDetectSearch(page, mode);
    record.meta.modeInfo = modeInfo;

    // 记录提交前的文本与隐藏字段值
    try {
      record.result.fieldsBeforeClick = await page.evaluate(() => ({
        fromHidden: document.getElementById('fromStation')?.value || null,
        fromText: document.getElementById('fromStationText')?.value || null,
        toHidden: document.getElementById('toStation')?.value || null,
        toText: document.getElementById('toStationText')?.value || null,
      }));
    } catch {}

    // 再次确保弹层隐藏，避免点击被拦截
    await page.evaluate(() => {
      const ids = ['choice_div', 'panel_cities'];
      const sels = ['.cal-wrap', '.cal-cm', '.layui-laydate', '#laydate_box'];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.pointerEvents = 'none';
        }
      });
      sels.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.pointerEvents = 'none';
        });
      });
    }).catch(() => {});

    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      page.locator(modeInfo.searchBtnSelector).click().catch((e) => { record.result.clickError = String(e); }),
    ]);
    await page.waitForTimeout(2000);

    record.result.pageURL = page.url();
    record.result.popupURL = popup ? popup.url() : null;

    // 弹窗页面采集：截图与参数解析
    if (popup) {
      try {
        await popup.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
        await popup.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
        const shotPath = path.join('evidence', `leftTicket_init_${label}.png`);
        fs.mkdirSync(path.join(process.cwd(), 'evidence'), { recursive: true });
        await popup.screenshot({ path: shotPath, fullPage: true }).catch(() => {});
        const title = await popup.title().catch(() => null);
        const bodyHTML = await popup.evaluate(() => document.body ? document.body.innerHTML.slice(0, 2000) : null).catch(() => null);
        record.result.leftTicket = {
          screenshot: shotPath,
          title,
          bodySnippetLen: bodyHTML ? bodyHTML.length : 0,
          queryParams: parseQueryParams(record.result.popupURL || ''),
        };
        // 可选：保存 HTML 片段
        if (bodyHTML) {
          fs.writeFileSync(path.join('evidence', `leftTicket_init_${label}.html`), bodyHTML, 'utf-8');
        }
      } catch (e) {
        record.result.leftTicketError = String(e);
      }
    }

    // 记录提交后的文本与隐藏字段值（若仍在原页）
    try {
      record.result.fieldsAfterClick = await page.evaluate(() => ({
        fromHidden: document.getElementById('fromStation')?.value || null,
        fromText: document.getElementById('fromStationText')?.value || null,
        toHidden: document.getElementById('toStation')?.value || null,
        toText: document.getElementById('toStationText')?.value || null,
      }));
    } catch {}

    record.result.errorText = await page.evaluate(() => {
      const cands = ['.layui-layer-content', '.error', '#msg', '.box-tips', '.toast'];
      for (const s of cands) {
        const el = document.querySelector(s);
        if (el && el.innerText) return el.innerText.trim();
      }
      return null;
    });
  } catch (e) {
    record.result.exception = String(e);
  }
  return record;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  const cases = [
    // 有效中文站名组合
    { from: '北京', to: '上海', label: 'BJ-SH', mode: '单程' },
    { from: '北京西', to: '上海虹桥', label: 'BJX-SHHQ', mode: '单程' },
    { from: '广州南', to: '深圳北', label: 'GZN-SZB', mode: '单程' },
    { from: '成都东', to: '重庆北', label: 'CDO-CQB', mode: '单程' },
    { from: '南京', to: '合肥', label: 'NJ-HF', mode: '单程' },
    { from: '杭州东', to: '苏州', label: 'HZE-SZ', mode: '单程' },
    { from: '武汉', to: '郑州', label: 'WH-ZZ', mode: '单程' },
    { from: '西安北', to: '成都东', label: 'XAB-CDO', mode: '单程' },
    { from: '长沙南', to: '南宁东', label: 'CSN-NND', mode: '单程' },
    { from: '天津', to: '北京', label: 'TJ-BJ', mode: '单程' },
    { from: '重庆北', to: '贵阳北', label: 'CQB-GYN', mode: '单程' },
    { from: '青岛', to: '济南', label: 'QD-JN', mode: '单程' },
    { from: '福州', to: '厦门北', label: 'FZ-XMB', mode: '单程' },
    { from: '厦门北', to: '上海虹桥', label: 'XMB-SHHQ', mode: '单程' },
    { from: '兰州', to: '乌鲁木齐', label: 'LZ-WLMQ', mode: '单程' },
    { from: '沈阳北', to: '大连', label: 'SYB-DL', mode: '单程' },
    // 采样：使用候选列表进行选择（不直接设置隐藏字段）
    { from: '北京', to: '上海', label: 'BJ-SH-suggest', mode: '单程', opts: { useSuggestion: true } },
    { from: '广州南', to: '深圳北', label: 'GZN-SZB-suggest', mode: '单程', opts: { useSuggestion: true } },
    { from: '杭州东', to: '苏州', label: 'HZE-SZ-suggest', mode: '单程', opts: { useSuggestion: true } },
    // 边界/无效
    { from: '北京', to: '北京', label: 'same_city', mode: '单程' },
    { from: '不存在站点', to: '上海', label: 'invalid_from', mode: '单程' },
    { from: '北京', to: '不存在站点', label: 'invalid_to', mode: '单程' },
    { from: 'Beijing', to: 'Shanghai', label: 'english_names', mode: '单程' },
    { from: 'abc', to: 'xyz', label: 'non_chinese', mode: '单程' },
    { from: '', to: '上海', label: 'empty_from', mode: '单程' },
    { from: '北京', to: '', label: 'empty_to', mode: '单程' },
    { from: '北京', to: '上海X', label: 'typo_to', mode: '单程' },
    // 其他模式（采样）：往返/中转换乘/退改签
    { from: '北京', to: '上海', label: 'BJ-SH-roundtrip', mode: '往返' },
    { from: '广州南', to: '深圳北', label: 'GZN-SZB-transfer', mode: '中转换乘' },
    { from: '南京', to: '合肥', label: 'NJ-HF-refund', mode: '退改签' },
  ];

  const records = [];
  for (const c of cases) {
    const rec = await runCase(page, c.from, c.to, c.label, c.mode, c.opts || {});
    records.push(rec);
  }

  fs.mkdirSync(path.join(process.cwd(), 'evidence'), { recursive: true });
  fs.writeFileSync(path.join('evidence', '12306_search_cases.json'), JSON.stringify(records, null, 2), 'utf-8');

  await browser.close();
}

run().catch((e) => {
  console.error('Playwright script failed:', e);
  process.exit(1);
});