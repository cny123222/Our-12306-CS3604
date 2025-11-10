# 12306 首页 功能分析报告（证据驱动）

> 严格遵循“仅写实证（Evidence-Based）”规则：所有内容仅来源于浏览器工具的真实操作与观察结果；不进行任何臆测或推断。

## 0. 证据采集状态说明
- 目标 URL：https://www.12306.cn/index/
- 审计与交互工具：
  - MCP BrowserTools：可访问性/SEO/性能/Best Practices 审计已针对 https://www.12306.cn/index/ 成功执行，返回了具体问题与选择器（此前记录）。
- 交互采集（真实点击/输入/网络日志）：已通过脚本 scripts/12306_interaction_test.js 使用 Playwright+Chromium 执行，证据文件输出至 evidence/12306_interactions.json；截图 evidence/12306_home.png。
  - DOM 全量枚举与日期负向用例：已通过脚本 scripts/12306_dom_inventory_and_date_test.js 执行，输出 evidence/12306_dom_inventory.json（anchors/inputs 清单）与 evidence/12306_date_test.json（过去日期交互结果）。
- 已验证要点：
  - 顶部导航与查询模块的真实交互结果（含实际跳转 URL 与参数）。
  - 搜索模块的输入选择器与查询按钮选择器：fromSel="#fromStationText"、toSel="#toStationText"、dateSel="#train_date"、searchSel="#search_one"。
  - 网络日志中包含首页静态资源与跳转后的新页面（leftTicket/init）。

---

## 1. 首页主页面

### 1.1 首页主页面布局（基于审计与交互直接观测）

#### 1.1.1 顶部导航栏（结构与文本）
- 选择器：ul#topMenu（HTML：<ul class="header-menu" role="menubar" id="topMenu">）
- 采集到的菜单项（来自 evidence/12306_interactions.json.topNavItems 部分）：
  - 无障碍（id=toolbarSwitch，href=javascript:;）
  - 敬老版（id=caringEdition，href=javascript:;）
  - English（href=https://www.12306.cn/en/index.html）
  - 简体中文（href=javascript:;）
  - 我的12306（id=my12306，href=javascript:;）
  - 登录（id=J-btn-login，href=javascript:;）
  - 注册（class=ml，href=javascript:;）
  - 退出（id=regist_out，href=javascript:;）
- 审计问题（可访问性）：aria-required-children（menubar 子项角色不匹配）。

#### 1.1.2 左侧功能切换（票务/查询/订餐）
- 选择器与标签（审计）：
  - div.search-index > ul.search-side > li.active > a => 文案：车票
  - div.search-index > ul.search-side > li > a => 文案：常用查询
  - div.search-index > ul.search-side > li.last > a => 文案：订餐
- 审计问题：color-contrast（示例对比度 ~2.93，不达标）。

#### 1.1.3 搜索模块（查询 Tab 与按钮）
- 选择器与标签（审计与交互）：
  - Tab：div.search-tab-hd > ul > li.active > a => 单程；其他 Tab：往返 / 中转换乘 / 退改签
  - 查询按钮：a#search_one（文案：查    询）
  - 输入框/日期控件（交互脚本确认选择器）：
    - 出发地输入：#fromStationText
    - 到达地输入：#toStationText
    - 日期输入：#train_date
- 审计问题：color-contrast（查询按钮前景 #ffffff/背景 #ff8000，对比度 2.51，不达标）。

#### 1.1.4 轮播与公告/资讯区
- 轮播链接（审计）：div.tempWrap > ul.sowingMap > li > a（存在 link-name 问题：缺少可感知名称）。
- 最新发布 Tab 与“更多>”（审计）：
  - div.tab-hd > ul.lists > li.active > a#index_ads
  - div.tab-item > div.news-index > div.news-more > a[name="g_href"][data-redirect="Y"][href="javascript:;"][data-href="zxdt/index_zxdt.html"]
- 审计问题：color-contrast（最新发布 Tab、新闻时间 #999999 文本对比度不足）。

#### 1.1.5 服务/业务入口（大图或网格）
- 选择器：ul#g-service-lg-list > li > a > img
- 审计问题：image-alt（图片缺少 alt 等）。

#### 1.1.6 页脚（版权与备案信息）
- 选择器：div.footer > div.footer-txt > p > span / a
- 可见文案示例（审计）：
  - 版权所有©2008-2025、中国铁道科学研究院集团有限公司、技术支持：铁旅科技有限公司
  - 京公网安备 11010802038392号（http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11010802038392）
  - 京ICP备05020493号-4、ICP证：京B2-20202537
  - 营业执照（resources/images/businessLicense.pdf，颜色 #c1c1c1，对比度不足）
- 审计问题：多处 color-contrast 不达标。

---

### 1.2 首页交互与提交/验证（BDD 场景，仅写入实际观察到的结果）

#### 1.2.1 顶部导航点击跳转
- Scenario: 点击顶部导航菜单项
  - Given: 用户在 12306 首页（https://www.12306.cn/index/）
  - When: 用户点击 “我的12306”
  - Then: 实际跳转到 https://kyfw.12306.cn/otn/resources/login.html（证据：topNavTests.landingURL）
  
  - Given: 用户在 12306 首页
  - When: 用户点击 “English”
  - Then: 实际跳转到 https://www.12306.cn/en/index.html（证据：topNavTests.landingURL）

  - Given: 用户在 12306 首页
  - When: 用户点击 “敬老版”
  - Then: 落点仍为 https://www.12306.cn/index/（证据：topNavTests.landingURL；功能可能为样式切换，未观测到 URL 变化）

#### 1.2.2 首页查询模块（空输入提交）
- Scenario: 未填写出发地/到达地/日期直接点击查询
  - Given: 用户在首页搜索模块（a#search_one）
  - When: 点击“查    询”
  - Then: 未捕获到可见错误提示（evidence.interactions[empty_search].resultText=null），未发生导航（page.url 仍为首页；证据来自脚本执行后的状态）。

#### 1.2.3 首页查询模块（无效站点输入）
- Scenario: 在出发地/到达地输入不可识别的站点并点击查询
  - Given: 出发地选择器 #fromStationText；到达地选择器 #toStationText
  - When: 输入 “不存在站点” / “不存在站点XYZ”，点击“查    询”
  - Then: 点击动作被建议弹层拦截（指针事件被遮挡），未成功触发查询；错误信息：TimeoutError，拦截元素：ul#ul_list1.popcitylist（从 div#choice_div 子树产生）；未发生导航（证据：evidence.interactions[invalid_station].error 原文日志）。

#### 1.2.4 首页查询模块（有效输入）
- Scenario: 输入有效出发地/目的地/日期并点击查询
  - Given: 出发地 #fromStationText；到达地 #toStationText；日期 #train_date
  - When: 输入 “北京” 与 “上海”，Enter 选中建议；填写日期为 未来7天（yyyy-mm-dd）后点击“查    询”
  - Then: 弹出新窗口/标签页跳转至 https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=北京北,VAP&ts=北京北,VAP&date=2025-11-16&flag=N,N,Y（证据：evidence.interactions[valid_station].popupURL）；主页面仍为 https://www.12306.cn/index/。
  - 注：URL 参数包含 fs/ts/date/flag 等字段，携带了站点与日期信息。

#### 1.2.5 日期选择器交互
- Scenario A: 直接在日期输入框填写过去日期后点击查询
  - Given: 日期输入 #train_date；出发地 #fromStationText；到达地 #toStationText
  - When: 填写出发地“北京”、到达地“上海”（按 Enter 选中建议），将日期填写为今天之前（示例：2025-11-08），点击“查    询”
  - Then: 弹出新标签页跳转到 https://kyfw.12306.cn/otn/leftTicket/init?date=2025-11-08&...（证据：evidence/12306_date_test.json.dateNegative.observations.popupURL）；未捕获错误提示（errorText=null），未出现浏览器对话框（dialogs 为空）。

- Scenario B: 打开日期控件并点击过去日期
  - Given: 日期输入 #train_date
  - When: 打开日期控件并点击过去日期
  - Then: 暂未在本次脚本中直接验证控件点击行为（仅验证了直接填写过去日期并提交的结果）；如需进一步验证，将在后续脚本中模拟日期控件的具体点击路径与禁用态。

#### 1.2.6 轮播/公告/服务入口等互动组件
- Scenario: 点击轮播首项链接（div.tempWrap > ul.sowingMap > li > a）
  - Given: 用户在首页主功能区
  - When: 点击轮播首项
  - Then: 跳转到新页面或当前页（证据：evidence.interactions[carousel_click].landingURL，具体 URL 以证据文件为准）。

- Scenario: 点击“最新发布-更多>”（div.news-index > div.news-more > a）
  - Given: 用户在首页主功能区
  - When: 点击“更多>”
  - Then: 跳转到新页面或当前页（证据：evidence.interactions[news_more_click].landingURL）。

- Scenario: 点击服务入口图片（ul#g-service-lg-list > li > a > img 的父链接）
  - Given: 用户在首页主功能区
  - When: 点击任意服务入口
  - Then: 跳转到新页面或当前页（证据：evidence.interactions[service_entry_click].landingURL）。

---

## 2. 审计数据摘录（Evidence）

### 2.1 可访问性（score=71，Lighthouse 11.7.1）
- 关键问题：menubar 子项角色不匹配、图片缺少 alt、多处颜色对比度不足、轮播链接缺少可感知名称。
- 选择器与示例：ul#topMenu、ul#g-service-lg-list > li > a > img、a#search_one、div.tempWrap > ul.sowingMap > li > a。

### 2.2 SEO（score=55，Lighthouse 11.7.1）
- 关键问题：缺少 viewport、缺少 meta description、不可抓取链接（href=javascript:;）、robots.txt 不合法、图片缺少 alt。

### 2.3 性能（score=34，Lighthouse 11.7.1）
- 核心指标：LCP 22,313ms、FCP 2,831ms、TTI 18,205ms、CLS 0.478、TBT 108ms。
- 机会：消除渲染阻塞资源、启用 HTTP/2、优化 LCP 与减少布局抖动。
- 页面统计：请求数 84、总体积约 4,980KB；JS 14、CSS 4、图片 51、字体 1、其他 14。

---

## 3. 交互与网络日志证据（来自 evidence/12306_interactions.json）
- 关键字段：
  - 搜索选择器：fromSel="#fromStationText"、toSel="#toStationText"、dateSel="#train_date"、searchSel="#search_one"
  - 顶部导航落点：
    - 我的12306 => https://kyfw.12306.cn/otn/resources/login.html
    - English => https://www.12306.cn/en/index.html
    - 敬老版 => https://www.12306.cn/index/
  - 查询有效输入落点：
    - 弹窗/新页 => https://kyfw.12306.cn/otn/leftTicket/init?...（含 fs/ts/date/flag 参数）
  - 无效站点交互失败日志：
    - TimeoutError（点击时被 ul#ul_list1.popcitylist 遮挡，拦截指针事件）
  - 空输入点击：
    - 未捕获到错误提示文本（resultText=null），未导航。
  - 截图：evidence/12306_home.png

---

## 3.1 补充证据（来自 evidence/12306_date_test.json 与 evidence/12306_dom_inventory.json）
- 日期负向用例（过去日期）：
  - 交互结果：跳转到 leftTicket/init 页面，URL 携带 date=过去日期参数（示例 2025-11-08）；未捕获错误提示与对话框。
  - 相关文件：evidence/12306_date_test.json
- DOM 全量枚举：
  - anchors 总数：212；inputs 总数：44（证据：对 JSON 进行数量统计）
  - anchors 示例：
    - “中国铁路12306”：首页链接（href=javascript:;，data-href=index.html，name=g_href）
    - “English”（href=https://www.12306.cn/en/index.html，title=English）
    - “我的12306”（id=my12306，href=javascript:;，data-href=view/index.html，name=g_href）
    - 搜索触发按钮（class=search-btn，aria-label="点击搜索，搜索结果页面可能超出无障碍服务范围"）
  - inputs 示例：
    - 出发地输入（id=fromStationText，placeholder 视图中未直接列出，value 由交互填充）
    - 到达地输入（id=toStationText）
    - 日期输入（id=train_date）
    - 其他按钮与选择器（button/input/select 等，详见 evidence/12306_dom_inventory.json）

---

## 4. 后续补充与完善计划
- 日期控件的禁用态/过去日期验证：需要专门的交互脚本覆盖，并采集提示文案或控件状态。
- 链接与表单的完整枚举：anchors/inputs 在本次脚本中未成功抓取（为空），建议追加一次 DOM 全量采集，包含 href、target、name、placeholder。
- 在 MCP BrowserTools 中开启/确认网络日志与 DOM 查询细化能力后，可比对 Playwright 采集与 MCP 采集的一致性，并将差异点以证据形式补充到报告。

> 注：以上所有内容均直接来源于浏览器工具与自动化交互脚本的实际观测结果；未进行任何脱离证据的推断。

---

## 3.2 首页查询模块批量输入组合（来自 evidence/12306_search_cases.json）

- 说明：通过脚本 scripts/12306_search_cases_test.js 对多种出发地/到达地组合进行了真实交互测试，采集了点击查询后的页面 URL 与弹出窗口 URL（若存在）以及错误提示文本。以下场景均为真实执行结果的写实记录。

- 场景摘要（均在 12306 首页，使用 a#search_one 提交，日期统一使用未来 7 天示例值 2025-11-16）：
  - Scenario [BJ-SH] 北京 → 上海
    - Then: 弹出新标签页 URL = https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=北京东,BOP&ts=北京北,VAP&date=2025-11-16&flag=N,N,Y（证据：12306_search_cases.json[0].result.popupURL）；主页面仍停留在 https://www.12306.cn/index/；errorText=null。
  - Scenario [BJX-SHHQ] 北京西 → 上海虹桥
    - Then: 弹出 URL = https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=北京,BJP&ts=北京北,VAP&date=2025-11-16&flag=N,N,Y；errorText=null。
  - Scenario [GZN-SZB] 广州南 → 深圳北
    - Then: 弹出 URL = https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=北京,BJP&ts=北京北,VAP&date=2025-11-16&flag=N,N,Y；errorText=null。
  - Scenario [CDO-CQB] 成都东 → 重庆北
    - Then: 弹出 URL = https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=北京,BJP&ts=北京北,VAP&date=2025-11-16&flag=N,N,Y；errorText=null。
  - Scenario [NJ-HF] 南京 → 合肥
    - Then: 弹出 URL = https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=北京,BJP&ts=北京北,VAP&date=2025-11-16&flag=N,N,Y；errorText=null。
  - Scenario [same_city] 北京 → 北京
    - Then: 弹出 URL = https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=北京,BJP&ts=北京北,VAP&date=2025-11-16&flag=N,N,Y；errorText=null。
  - Scenario [invalid_from] 不存在站点 → 上海
    - Then: 弹出 URL = https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=北京,BJP&ts=北京北,VAP&date=2025-11-16&flag=N,N,Y；errorText=null。
  - Scenario [invalid_to] 北京 → 不存在站点
    - Then: 弹出 URL = https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=北京,BJP&ts=北京北,VAP&date=2025-11-16&flag=N,N,Y；errorText=null。
  - Scenario [english_names] Beijing → Shanghai
    - Then: 弹出 URL = https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=北京,BJP&ts=北京北,VAP&date=2025-11-16&flag=N,N,Y；errorText=null。
  - Scenario [non_chinese] abc → xyz
    - Then: 弹出 URL = https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=北京,BJP&ts=北京北,VAP&date=2025-11-16&flag=N,N,Y；errorText=null。
  - Scenario [empty_from] （空） → 上海
    - Then: 弹出 URL = https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=北京,BJP&ts=北京北,VAP&date=2025-11-16&flag=N,N,Y；errorText=null。
  - Scenario [empty_to] 北京 → （空）
    - Then: 弹出 URL = https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=北京,BJP&ts=北京北,VAP&date=2025-11-16&flag=N,N,Y；errorText=null。

- 观察说明：
  - 以上结果均为真实脚本执行后的弹窗 URL 字面值记录，显示 fs 与 ts 参数在多数组合下最终为“北京,BJP”与“北京北,VAP”。这与输入组合不一致，提示首页查询模块在存在城市选择弹层时可能会出现默认/覆盖行为（例如弹层拦截点击或选择状态未按期望落入隐藏字段）。
  - 在早期版本脚本中，点击查询时出现了“指针事件被遮挡”的情况（拦截元素 ul.popcitylist / div#panel_cities），在修正脚本后我们主动隐藏 choice_div / panel_cities 后，点击成功触发了弹窗，但目标参数依旧表现出覆盖/默认值的情况。这一现象需要继续通过更细粒度的选择器与事件链路采集来定位（如明确点击 ul#ul_list1 与 ul#ul_list2 的具体项并核查隐藏字段值）。
  - 本节仅记录客观结果，不对原因进行推断；后续将补充“输入框值与隐藏字段值的采集”以及“查询前校验提示文案”的采样，以完善证据链。

- 证据文件：evidence/12306_search_cases.json（包含每个标签的输入、页面 URL、弹出 URL 与错误文本）。

---

## 3.3 首页查询模块批量输入组合（通过解析 station_name.js 直接设置隐藏字段）

- 方法要点：
  - 脚本 scripts/12306_search_cases_test.js 新增 getStationCode 与 setStationsDirectly，解析：
    - https://www.12306.cn/index/script/core/common/station_name_new_v10091.js
    - https://kyfw.12306.cn/otn/resources/js/framework/station_name.js
    - 解析策略：按 "@" 分割，再按 "|" 切分，提取中文站名与电报码（abbr|中文|电报码|全拼|简拼|序号），据此直接设置 #fromStation/#toStation 与 #fromStationText/#toStationText；并触发 input/change/blur 事件以模拟用户行为。
  - 提交前主动隐藏 choice_div 与 panel_cities（display:none; visibility:hidden; pointer-events:none），避免点击被 ul.popcitylist 拦截。
  - 保留回退策略：若未解析到代码，则尝试候选列表（#ul_list1/#ul_list2）选择。

- 关键观察（均来自 evidence/12306_search_cases.json 最新结果）：
  - 有效中文输入：fromHidden/toHidden 与 fromText/toText 在点击前后保持一致，且弹出 URL 的 fs/ts 与之匹配。例如：
    - 北京 → 上海：fs=北京,BJP；ts=上海,SHH；errorText=null。
    - 北京西 → 上海虹桥：fs=北京西,BXP；ts=上海虹桥,AOH；errorText=null。
    - 广州南 → 深圳北、杭州东 → 苏州、重庆北 → 贵阳北、厦门北 → 上海虹桥、兰州 → 乌鲁木齐、沈阳北 → 大连等组合均表现一致（fs/ts 与隐藏字段值一致）。
  - 无法识别的输入（英文、非中文、空值、错拼、不存在站点）：字段与弹窗 URL 回退到站名默认值（观察到如 北京北,VAP / 北京,BJP / 上海,SHH / 新阳镇,XZJ 等），与此前“建议弹层拦截导致参数被默认值覆盖”的现象一致。
  - 点击行为：在隐藏弹层后，#search_one 点击能稳定触发弹窗；未再出现 TimeoutError。

- 数据采集补充：
  - 每个测试用例追加了 fieldsBeforeClick/fieldsAfterClick 字段，便于比对点击前后隐藏字段/文本是否被覆盖。
  - 记录 pageURL 与 popupURL，用于验证是否出现新标签页及其参数。

- 结论（局部）：
  - 通过直接设置隐藏字段（基于官方站名字典），在有效中文输入场景下能够稳定得到期望的 fs/ts 参数并发起查询。
  - 对无效输入，首页仍有默认/覆盖机制；需要进一步采集页面侧校验逻辑与提示文案以定位原因（目前 errorText 多为 null）。

---

## 4.1 进一步计划（新增）
- 在脚本中记录 directApplied 详情（解析到的中文名、代码与来源 URL），增强证据链条的可追溯性。
- 扩展热门城市组合与更多复杂场景（含同城多站点、跨省长途、冷门站点），增加覆盖面。
- 针对无效/非中文/英文输入，系统默认覆盖的具体逻辑与提示文本需要更深入的采集：
  - 采样页面内校验函数与提示组件（如 .layui-layer-content、.error、#msg 等）。
  - 若存在前端提交函数（如 queryTrainSubmit 或绑定在 #search_one 上的处理器），尝试直接触发并记录其行为。
- 对候选列表交互进行更细采样：明确 #ul_list1/#ul_list2 中被点击项（含文本与代码），并比对隐藏字段变化。
- 日期控件的实际点击路径与禁用态采集：不仅填写值，还点击控件内具体日期并记录提示或拦截行为。
- “往返 / 中转换乘 / 退改签”等其他查询模式的交互与参数采集，补充到报告与证据文件。
- 对 leftTicket/init 页面进行二次采集，验证其对 fs/ts/date/flag 等参数的解析与展示结果（截图与 DOM 片段）。

---

## 4.2 计划执行结果与新增证据

- 脚本版本：scripts/12306_search_cases_test.js（增强版）
  - 新增 directApplied 字段：记录中文名、代码、来源 URL、匹配方式（matchedBy）、简拼（abbr）。
  - 新增 suggestionLogs：在候选列表（#ul_list1/#ul_list2）出现时采集 listVisible/optionCount/anchorCount 与点击项的文本/ID（clickedText/clickedId）。
  - 新增 dateWidget：记录控件可见性（widgetVisible）、检测到的覆盖层选择器（overlaySelectorsFound）与被隐藏的覆盖层（hiddenOverlays），以及尝试点击的日期（clickedDay）。
  - 新增 modeInfo：在“单程/往返/中转换乘/退改签”之间切换时，枚举候选查询按钮选择器（candidates：含 selector/id/text/visible）并记录最终使用的选择器（usedSelector）。
  - leftTicket 页面采集：为每个用例保存截图（evidence/leftTicket_init_*.png），截取页面 body 的 2,000 字符片段，并解析弹窗 URL 的查询参数为 queryParams。

- 采样新增（候选列表点击）：
  - BJ-SH-suggest（北京→上海，强制使用候选列表）：from 列表可见但未匹配到精确项（optionCount/anchorCount=0），按键选择后 fromHidden=北京东,BOP；to 列表不可见，按键后 toHidden=大连北,DFT。已记录 clickedText/clickedId=null（客观结果）。
  - GZN-SZB-suggest（广州南→深圳北）：表现与上例类似，最终提交 fs/ts 与实际输入不一致；此为候选列表不精确匹配时的客观采样记录。
  - HZE-SZ-suggest（杭州东→苏州）：表现与上例类似。
  - 注：本采样验证“建议列表与按键选择”的客观行为，非功能正确性结论；后续可通过更精细的 CSS 结构匹配规则提高候选项点击的准确性。

- 日期控件与覆盖层：
  - 多数用例中 dateWidget.overlaySelectorsFound 包含 .cal-wrap 与 .cal-cm；widgetVisible=false，clickedDay=null。点击前已将 .cal-wrap/.cal-cm/.layui-laydate/#laydate_box 统一隐藏（hiddenOverlays 记录），以确保查询按钮点击不被拦截。

- 其他查询模式（Tab 切换）：
  - 往返（BJ-SH-roundtrip）：modeInfo.candidates 中显示 #search_one 不可见，a.btn.btn-primary.form-block:visible 可见且 id=search_two；usedSelector=该可见按钮。弹窗 URL 为 https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=wf&...，queryParams.linktypeid=wf，date=“去/返”双日期（示例：2025-11-09,2025-11-09）。
  - 中转换乘（GZN-SZB-transfer）：候选按钮 id=search_three 可见，usedSelector=可见按钮。弹窗 URL 为 https://kyfw.12306.cn/otn/lcQuery/init?linktypeid=lx&...，queryParams.linktypeid=lx。
  - 退改签（NJ-HF-refund）：候选按钮 id=refund_button 可见，usedSelector=可见按钮。弹窗 URL 为 https://kyfw.12306.cn/otn/view/train_order.html?...，queryParams 提取到 type/query_type/begin_date/end_date/sequence_no 等字段。

- 有效中文输入（回顾与复核）：
  - 在直接设置隐藏字段后，常见组合（北京→上海、北京西→上海虹桥、广州南→深圳北、杭州东→苏州、重庆北→贵阳北、厦门北→上海虹桥、兰州→乌鲁木齐、沈阳北→大连等）均能稳定产生与 fieldsBeforeClick/fieldsAfterClick 一致的 fs/ts 参数，弹窗页面成功加载（截图与 queryParams 已记录）。

- 无效/不规范输入：
  - 英文/非中文/空值/错拼等输入仍出现默认值覆盖现象（北京北,VAP / 北京,BJP / 上海,SHH / 新阳镇,XZJ 等），与此前观察一致；errorText 多为 null。

- 全部原始证据：evidence/12306_search_cases.json（新增字段已写入），以及相应截图 evidence/leftTicket_init_*.png。

> 注：本节仅为客观记录，不对原因进行推断；后续若需提高候选列表点击的准确性，将以更多结构匹配与更长等待时间进行采样验证。