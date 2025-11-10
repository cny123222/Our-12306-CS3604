# 12306 首页复刻项目需求文档（Evidence-Based）

> 本需求严格依据现有证据与脚本观测结果编写：
> - 证据与参考：page_analysis_report.md、evidence/*（截图、HTML、JSON）、scripts/*（Playwright 采集脚本）
> - 目标：在本地完全复刻 https://www.12306.cn/index/ 的页面排版、页面内部功能与页面跳转链接逻辑（以证据为准），用于课程与研究目的。

---

## 1. 项目目标与范围

- 目标：
  - 复刻首页整体排版结构与交互，包括顶部导航、搜索模块（含“单程/往返/中转换乘/退改签”四个模式）、轮播区、公告/资讯区、服务入口区、页脚等。
  - 复刻搜索模块的跳转逻辑与参数拼装（fs/ts/date/flag/linktypeid 等），并在本地环境中可验证。
  - 在复刻过程中，尽量保持与原站相同的选择器与结构，确保已有 Playwright 脚本与 MCP BrowserTools 可复用进行审计与验证。

- 范围：
  - 包含：页面结构、样式近似、交互行为、跳转 URL 与查询参数、弹窗/新标签打开行为、候选列表与日期控件的基本表现（以证据为准）。
  - 不包含：真实登录、订单与支付流程；接口调用与动态数据；原站版权素材的商用复制（本项目仅用于教学与研究）。

- 环境与依赖：
  - 操作系统：macOS
  - 工作目录：/Users/od/Desktop/cs3604/Our-12306-CS3604
  - 现有工具：MCP BrowserTools（审计与截图）、Playwright（自动化交互）、Node/npm（本地开发服务器）
  - 当前本地端口：3000、3001、3002（已有服务器任务正在运行）

---

## 2. 数据与证据来源

- page_analysis_report.md：
  - 布局结构、选择器、审计发现（可访问性/SEO/性能）、交互场景、链接与参数记录。

- evidence 目录：
  - 12306_interactions.json：首页交互基础证据（选择器、顶部导航跳转、空输入与无效输入表现）。
  - 12306_date_test.json：日期负向用例（过去日期提交）跳转证据。
  - 12306_dom_inventory.json：DOM 枚举（anchors/inputs）抽样证据。
  - 12306_search_cases.json：批量查询用例的详细证据（fieldsBeforeClick/fieldsAfterClick、directApplied、suggestionLogs、dateWidget、modeInfo、popupURL、queryParams、leftTicket 页面片段）。
  - leftTicket_init_*.html/png：跳转落地页面的快照（用于本地复刻时的展示或校验）。

- scripts 目录：
  - 12306_interaction_test.js：首页交互与顶部导航测试。
  - 12306_dom_inventory_and_date_test.js：DOM 枚举与日期控件负向用例测试。
  - 12306_search_cases_test.js：批量查询用例测试（含站名字典解析、候选列表回退、日期控件覆盖层处理、不同模式的查询按钮检测）。

---

## 3. 功能需求（按区域）

### 3.1 顶部导航栏（ul#topMenu）
- 结构与选择器：与证据一致（role="menubar"、id=topMenu）。
- 菜单项及行为（以 evidence/12306_interactions.json 与报告为准）：
  - 我的12306（id=my12306）：点击跳转 https://kyfw.12306.cn/otn/resources/login.html（新标签打开）。
  - English：点击跳转 https://www.12306.cn/en/index.html（新标签打开）。
  - 敬老版（id=caringEdition）：点击后落点仍为 https://www.12306.cn/index/（本地可复刻为样式切换开关，不改变 URL）。
  - 登录/注册/退出等：按证据保持 href=javascript:; 或 data-href 行为（可作为占位，不实现真实登录）。

### 3.2 左侧功能切换（div.search-index > ul.search-side）
- 标签文案与状态：车票（active）、常用查询、订餐（last）。
- 视觉与交互：支持切换，但本项目以“车票”主区域为重点；其他项可占位。

### 3.3 搜索模块（查询 Tab 与按钮）
- Tab 结构（div.search-tab-hd > ul > li > a）：单程 / 往返 / 中转换乘 / 退改签。
- 查询按钮选择器与可见性：
  - 单程：a#search_one（文案：查    询）。
  - 往返/中转换乘/退改签：根据证据 modeInfo，实际使用的可见按钮常为 a.btn.btn-primary.form-block:visible（id 不同，如 search_two/search_three/refund_button）。
  - 需求：在激活的 Tab 内检测候选查询按钮列表（记录 candidates：selector/id/text/visible），优先使用可见按钮，并记录 usedSelector（用于可观察性）。

- 输入与隐藏字段：
  - 出发地：#fromStationText（文本框），#fromStation（隐藏值）
  - 到达地：#toStationText（文本框），#toStation（隐藏值）
  - 日期：#train_date（文本输入，可能伴随日期控件）
  - 需求：
    - 解析官方站名字典（station_name_new_v10091.js 与 station_name.js）获取电报码，直接设置隐藏字段与文本框（directApplied 记录来源、匹配方式、abbr）。
    - 候选列表交互（#ul_list1/#ul_list2）：在使用建议列表时，记录 listVisible、optionCount、anchorCount、clickedText、clickedId；若未检测到候选项，按当前证据保持“客观记录为空”。
    - 日期控件覆盖层处理：检测并隐藏覆盖层（.cal-wrap/.cal-cm/.layui-laydate/#laydate_box），记录 overlaySelectorsFound 与 hiddenOverlays；fallback 为直接填写值。

- 跳转与参数拼装（新标签页/弹出窗口）：
  - 单程：跳转 https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=<中文,电码>&ts=<中文,电码>&date=<YYYY-MM-DD>&flag=N,N,Y
  - 往返：跳转 https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=wf&...（示例 queryParams.linktypeid=wf；双日期）。
  - 中转换乘：跳转 https://kyfw.12306.cn/otn/lcQuery/init?linktypeid=lx&...
  - 退改签：跳转 https://kyfw.12306.cn/otn/view/train_order.html?...（提取到 type/query_type/begin_date/end_date/sequence_no 等）。
  - 需求：统一以 window.open 新标签打开；为本地验证可增加“本地快照展示”模式：当跨域不可达或需离线时，优先打开 evidence/leftTicket_init_*.html 对应快照。

- 输入场景行为（据 12306_search_cases.json）：
  - 有效中文输入：fs/ts 与隐藏字段一致；弹窗页面成功加载（截图与 queryParams 已记录）。
  - 无效/非中文/英文/空值/错拼：系统默认覆盖到预设站点（北京北,VAP / 北京,BJP / 上海,SHH / 新阳镇,XZJ 等）；errorText 常为 null。
  - 同城（北京→北京）：支持；以证据为准。

### 3.4 轮播区与公告/资讯区
- 轮播（div.tempWrap > ul.sowingMap > li > a）：保留结构与链接行为（部分 anchor 可能缺少可感知名称，按证据复刻）。
- 最新发布 Tab 与“更多>”（div.tab-hd/div.news-index/div.news-more > a）：复制链接与点击行为（href=javascript:; 或 data-href=...）。

### 3.5 服务入口（ul#g-service-lg-list）
- 结构与样式：按证据复刻；图片缺少 alt 的现象按原样复刻（研究目的）。
- 点击行为：保持链接或占位逻辑；可在本地路由到说明页或打开外部链接（以证据为准）。

### 3.6 页脚（div.footer）
- 文案与链接：按证据复刻（包含ICP备案、公安备案、营业执照 PDF 等）。
- 对比度等问题按原样复刻；可在后续“改进版”中提出优化建议。

---

## 4. 非功能需求

- 可访问性（按证据复刻）：
  - menubar 子项角色不匹配、颜色对比度不足、图片缺少 alt 等现象可保留（复刻原状）。
  - 可选“改进版”目标：提供更高对比度与更规范的 ARIA 角色。

- SEO（按证据复刻）：
  - 缺少 viewport、meta description、不可抓取链接（href=javascript:;）等问题按原样复刻。
  - 可选“改进版”目标：补全元信息与可抓取链接。

- 性能（按证据复刻）：
  - 保留原站审计分数与问题特征（LCP/FCP/TTI/CLS/TBT 等）。
  - 可选“改进版”目标：减少阻塞资源、优化 LCP 与图片加载。

---

## 5. 技术要求与实现建议

- 技术栈：
  - 前端：原生 HTML/CSS/JS 或任一轻量框架（为保证选择器一致，建议原生或无侵入式框架）。
  - 构建/服务：已有 npm 脚本与本地 server（端口 3000/3001/3002）。

- 选择器与结构一致性：
  - 保持关键选择器：#fromStationText、#toStationText、#train_date、#search_one、ul#topMenu、div.search-index、div.search-tab-hd、ul#g-service-lg-list、div.footer 等。
  - 搜索按钮在非单程模式下的候选选择器枚举与可见性判断（记录 candidates 与 usedSelector）。

- 站名字典解析与隐藏字段赋值：
  - 复用 scripts/12306_search_cases_test.js 的解析策略（abbr|中文|电报码|全拼|简拼|序号）。
  - 实现 directApplied 记录（中文名、代码、来源 URL、matchedBy、abbr）。

- 候选列表与日期控件：
  - #ul_list1/#ul_list2：在出现时尝试点击并记录 suggestionLogs；若未出现或无法匹配，保留客观记录为空。
  - 覆盖层处理：统一隐藏 .cal-wrap/.cal-cm/.layui-laydate/#laydate_box，记录 overlaySelectorsFound 与 hiddenOverlays。

- 跳转策略：
  - window.open 到 kyfw 域名；如跨域限制或离线环境，则打开 evidence 中对应快照 HTML，或在 local_site/ 中提供映射路由（例如 /leftTicket/init?… 映射到相应快照）。

---

## 6. 测试与验收标准

- MCP BrowserTools（本地复刻页）：
  - 跑通可访问性、SEO、性能审计；记录问题选择器；与原站审计发现应基本一致（允许近似差异）。

- Playwright 自动化脚本：
  - 复用并适配 scripts/12306_interaction_test.js 与 scripts/12306_search_cases_test.js 对本地复刻页进行交互测试。
  - 验收项：
    - 顶部导航点击落点与原证据一致（URL 或行为）。
    - 搜索模块四模式均能找到可见查询按钮（modeInfo.usedSelector 非空），并成功打开目标页（或本地快照）。
    - 有效中文输入：fieldsBeforeClick 与 fieldsAfterClick 一致；fs/ts 与弹窗 URL 参数匹配；leftTicket 快照加载成功。
    - 无效输入：默认覆盖行为与证据一致；errorText 为 null 或与证据一致。
    - 日期控件：overlaySelectorsFound 与 hiddenOverlays 有记录；直接填写值能成功提交。
    - suggestionLogs：在使用建议列表的用例中记录 listVisible/optionCount/anchorCount 与 clickedText/clickedId（若无候选项则对应为空）。

- 证据输出：
  - 生成或更新 evidence/12306_search_cases.json（或本地复刻专用 JSON），并保存截图与落地页快照（如适用）。

---

## 7. 目录结构与交付物

- 保持现有结构：
  - evidence/（快照与测试结果）
  - scripts/（Playwright 脚本）
  - page_analysis_report.md（分析与证据说明）
  - 新增：
    - local_site/（可选；用于本地落地页快照的路由映射或静态展示）
    - src/ 或 public/（复刻页面源码与静态资源）

- 交付内容：
  - 完整复刻的首页 HTML/CSS/JS（含四模式查询、候选列表/日期控件基本处理、跳转逻辑）。
  - 本地快照映射（如选择离线验证模式）。
  - 验证用 Playwright 报告与 MCP BrowserTools 审计结果。

---

## 8. 风险与注意事项

- 跨域与可达性：kyfw 域名可能限制或变更；建议提供本地快照映射备用。
- 版权与合法性：本项目仅用于教学与研究；避免直接商用复制与外部传播；素材与商标不用于商业。
- 数据更新：官方站名字典版本变更时需同步解析策略。
- UI 差异：在不同屏幕与浏览器上，颜色与布局可能存在微差；本项目以功能与结构一致为主。

---

## 9. 实施里程碑（建议）

- M1：搭建本地首页骨架与选择器一致性（顶部导航、搜索模块、轮播、资讯、服务入口、页脚）。
- M2：实现单程模式查询逻辑（station_name 解析、隐藏字段赋值、日期控件覆盖层处理、leftTicket 跳转/快照）。
- M3：扩展往返/中转换乘/退改签模式（候选按钮枚举与可见性检测、URL 参数拼装）。
- M4：候选列表交互采样与日志（suggestionLogs），同城与无效输入覆盖行为对齐证据。
- M5：审计与自动化测试（MCP 与 Playwright），生成本地证据与报告。
- M6：可选改进版（可访问性/SEO/性能优化），与“原状复刻版”并存。

---

## 10. 验收清单（Checklist）

- 布局与选择器与证据一致（关键区域与 ID/class 保持一致）。
- 四模式查询均可点击且 usedSelector 有记录，点击后产生正确弹窗 URL 或本地快照。
- 有效中文输入的 fs/ts 与隐藏字段一致；无效输入的默认覆盖行为与证据一致。
- 日期控件覆盖层被检测并隐藏，fallback 填值提交成功。
- suggestionLogs 在相关用例中有记录（若无候选项则为空但有 listVisible/optionCount/anchorCount 记录）。
- MCP BrowserTools 审计与原站发现基本一致；Playwright 脚本通过。

---

> 备注：本需求文档用于指导基于现有证据的“首页复刻”实现与验证。若需进一步复刻更深层功能（登录、订单、支付、实名校验等），需另行编写需求并进行合法性评估。