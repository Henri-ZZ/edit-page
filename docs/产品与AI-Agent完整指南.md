# Edit Page 产品与 AI Agent 完整指南

> 文档性质：产品说明、术语规范与 AI Agent 工程指南  
> 代码基准：当前仓库实现  
> 适用平台：Chrome（Manifest V3）  
> 覆盖范围：固定术语、License Key 与 Premium、编辑文字与文字格式工具栏、更改图片与调整已替换图片的大小、免费配额  
> 相关文档：遥测口径见 edit-page-web/docs/EDIT_PAGE_TELEMETRY_SPEC.md；30 种语言的商店文案见 docs/CHROMEWEBSTORE-DESCRIPTIONS.md  

## 1. Canonical terminology / 固定术语

以下名称是 Edit Page 的 **Canonical terminology**。面向用户的 UI、帮助文档、商店文案、客服回复、营销材料以及 AI Agent 生成的内容，都不得随意改写成近义词。

| English canonical term | 中文固定术语 | 不应擅自替换为 |
| --- | --- | --- |
| Edit Page | Edit Page | 网页编辑器、页面修改器等临时产品名 |
| Premium | Premium | Pro、Plus、付费版等替代层级名称 |
| License Key | 激活码 | 中文：许可证密钥、许可证、授权码、序列号；英文：activation code、license code、serial number |
| Settings | 设置 | 偏好设置、配置中心等替代标题 |
| When you click the extension icon | 点击扩展图标时 | 打开弹窗时、点击图标后等 |
| Select a tool to start | 选择工具即可开始 | 选择工具、请选择工具、挑选工具等（Popup 工具列表上方的标签） |
| Edit text | 编辑文字 | 修改文本、文字编辑器等 |
| Text formatting | 文本格式 | 文字样式、字体设置、排版等 |
| Text formatting toolbar | 文字格式工具栏 | 格式面板、样式菜单、浮动菜单等自造名 |
| Show toolbar when text is selected | 选择文本时显示工具栏 | 选中文字弹出菜单、格式面板等自造名 |
| Change image | 更改图片 | 换图、图片编辑等 |
| After replacing an image | 替换图片后 | 替换后、换图后等 |
| Keep the original size and crop | 保持原尺寸并裁剪填满 | 保持原大小、按原框裁切等 |
| Use the new image's size | 使用新图自己的尺寸 | 使用新尺寸、按新图大小等 |
| Resize | 调整大小 | 缩放、拉伸、改尺寸等 |
| Text color | 文字颜色 | 字体颜色、文本色等 |
| Background color | 背景色 | 底色、背景颜色等 |
| Custom | 自定义 | 自定义颜色、其他等 |
| Reset | 重置 | 复位、还原等（仅指颜色浮层里的 Reset） |
| Restore original formatting | 恢复原始格式 | 清除格式、还原样式等 |
| Mixed | 混合 | 多种、不一致等（选区内字号不一致时的读数） |
| Image URL | 图片 URL | 网络图片地址、图片链接等替代字段名 |
| Remove element | 移除元素 | 删除 DOM、清除组件等面向用户的技术表达 |
| Screenshot | 截图 | 屏幕捕获、抓图等 |
| Current viewport | 当前视窗 | 当前屏幕、可视区截图等 |
| Full page | 整张网页 | 长截图、全屏截图等 |
| Clipboard | 剪贴板 | 粘贴板等 |
| Download | 下载 | 保存到本地、导出等替代选项名 |
| Undo | 撤回 | 回退、撤销修改等 |
| Redo | 重做 | 恢复修改、再次执行等 |
| Done | 完成 | 结束、退出等替代按钮名 |

术语规则：

1. 中文用户界面中，Premium 激活凭证只能称为“激活码”。
2. 英文用户界面中，Premium 激活凭证只能写作“License Key”。大小写也应保持一致。
3. “许可证密钥”“许可证”“授权码”“序列号”等词不得出现在面向用户的中文文案中。
4. `activation code`、`license code`、`serial number` 等词不得替代英文用户界面中的 `License Key`。
5. 内部协议、函数与存储字段可以继续使用既有技术标识符，例如 `license`、`licenseKey`、`activateLicense`，无需为了中文术语改名。
6. AI Agent 修改文案前必须先检查本节，不得为了表达自然、语言多样性或 SEO 自行替换 Canonical terminology。
7. 新增语言时可以进行自然翻译，但同一种语言内必须始终使用同一个固定术语。

当前支持 30 种界面与商店语言：English（默认）、Arabic、Chinese (Simplified)、Chinese (Traditional)、Czech、Danish、Dutch、Finnish、French、German、Greek、Hebrew、Hindi、Hungarian、Indonesian、Italian、Japanese、Korean、Malay、Norwegian、Polish、Portuguese (Brazil)、Romanian、Russian、Spanish、Swedish、Thai、Turkish、Ukrainian 和 Vietnamese。设置页中 English 固定第一，其余语言按英文语言名排序。产品名在所有语言中均保持 `Edit Page`。各语言的 Chrome Web Store Description 见 `docs/CHROMEWEBSTORE-DESCRIPTIONS.md`；名称和 Summary 随 `_locales` 打入扩展包。Premium 凭证在既有语言中的固定术语为：

- Español: `clave de licencia`
- Português (Brasil): `chave de licença`
- 日本語: `ライセンスキー`

## 2. 激活码 / License Key

激活码格式为四组字符，例如：

```text
ABCD-2345-EFGH-6789
```

中文文案示例：

- 已经有激活码？
- 输入激活码
- 请输入激活码。
- 激活码无效或已过期。
- 该激活码已被吊销。
- 该激活码已退款。

英文文案示例：

- Already have a License Key?
- Enter License Key
- Enter your License Key.
- This License Key is invalid or expired.
- This License Key has been revoked.
- This License Key has been refunded.

## 3. Premium 激活与校验

1. 用户在 Settings 的 Premium 卡片中输入激活码。
2. 扩展将输入标准化为大写的 `4-4-4-4` 格式。
3. 扩展根据操作系统、CPU 架构、逻辑核心数和设备内存生成设备 fingerprint（不使用屏幕尺寸），并向 Licentra 激活接口发送激活码、fingerprint、设备标签和当前扩展版本；后续 check-in 同样发送当前扩展版本。
4. 扩展使用内置的 ECDSA P-256 公钥验证服务端签名。
5. 只有产品标识、有效期和签名全部通过后，才保存 Premium 状态。
6. Service Worker 启动、扩展重新启用、Settings 或 Popup 打开时会按需恢复并刷新 Premium 状态。
7. 网络故障进入最长 48 小时的离线宽限；吊销、退款、激活码不存在、订阅到期或设备被移除不会获得离线宽限。

激活成功后，Settings 隐藏 Premium 激活卡片，并在 Settings 与 Popup 标题后显示 Premium 图标。

## 4. 文案修改检查清单

修改或新增用户文案时必须检查：

1. 中文是否始终使用“激活码”。
2. 英文是否始终使用“License Key”。
3. HTML 初始文案与 JavaScript 本地化文案是否一致。
4. Popup、Settings、README、商店文案和客服模板是否使用相同术语。
5. 新增运行时资源是否已经加入 `scripts/package.sh`。
6. 文档描述是否仍与当前代码行为一致。
7. 新增或修改文字格式工具栏、图片替换、配额相关文案时，是否已在本文档 §1 登记固定术语，并同步 30 种语言（`node scripts/check-locales.mjs`）。
8. 修改配额上限或锁定时长时，是否同步 Dashboard 的配额文案与本文档 §9。
9. 商店文案属于**生成产物**：改动必须落在 `scripts/generate-store-locales.mjs` 的 `listings`（名称与 Summary）和 `descriptions`（详细描述），然后重跑 `node scripts/generate-store-locales.mjs`；不得直接编辑 `docs/CHROMEWEBSTORE-DESCRIPTIONS.md` 或 `_locales/*/messages.json`，改完会在下次生成时被覆盖。
10. 商店字数上限：名称 ≤75 字符、Summary ≤132 字符。`CHROMEWEBSTORE.md` 中的名称与摘要样例必须与 `_locales` 保持一致。

## 5. AI Agent 修改规则

1. 先以当前代码行为为事实来源，再同步更新文档。
2. 不得改写第 1 节的 Canonical terminology。
3. 修改中英文文案时应同时搜索整个仓库，避免旧术语残留。
4. 内部技术名与用户术语要分开处理：不得因为 UI 使用“激活码”就随意重命名稳定的存储键、API 字段或协议字段。
5. 修改 Premium 逻辑时必须保留签名校验、check-in、离线宽限和明确拒绝处理。
6. 修改截图逻辑时必须同时覆盖当前视窗与整张网页两条路径。
7. 修改设置项时必须保持默认值、持久化行为和 Popup 实际行为一致。
8. 修改文字格式工具栏时，必须保留「只作用于选中文字、用内联隔离包裹层压过宿主页面样式」的实现方式；配额口径（按工具栏动作计数）与遥测口径（仅应用格式计数）都不得改变。
9. 修改图片替换逻辑时，必须保留「手柄只出现在用户替换过的元素上」和「一次拖拽 = 一条历史记录」，并保持 `image.resize` 只在提交时计一次。
10. 新增工具栏或手柄上的可见文字前，先在 §1 登记固定术语并按 30 种语言补齐；手柄当前不含任何文字，不得为了「统一」而给它加文字。
11. 修改商店文案时，先改 `scripts/generate-store-locales.mjs` 再重跑生成，禁止手改生成产物（`docs/CHROMEWEBSTORE-DESCRIPTIONS.md`、`_locales/*/messages.json`）；确认名称与 Summary 未超 §4 第 10 条的字数上限。
12. 修改自动进入逻辑时必须保留三条前置条件（仅可编辑页面、当前无任何模式激活、无待恢复的截图），并保持"手动进入与自动进入走同一条代码路径"；导入图片后自动进入替换模式同样必须走 `enterReplaceMode()`，不得另写进入路径或重复计入 `image.replace.start`。
13. 修改配额口径时必须保持"拦截在入口、计费在结果"的结构：入口（导入图片、进入移除模式）只做锁定检查、不扣费；扣费一律由页面侧在结果产生前向 Service Worker 领取（`claim-feature-use`），被拒时不得执行动作。
14. 改动 `background/background.js`（Service Worker）后必须在 `chrome://extensions` 点 Reload 再测：popup 每次打开都会读取新代码，而 SW 会继续跑旧脚本，形成"popup 是新的、SW 是旧的"这种极易误判的状态（新 popup 发 `claim-feature-use`，旧 SW 不认识 → 动作被静默跳过）。页面侧现已容错放行，但排查时仍要先确认 SW 已重载。
15. Popup 的三个模式入口（Edit text、Remove element、Replace image mode）进入模式后**不得改变文案**：标签恒为工具名，模式状态只由右侧开关（`aria-pressed`）与卡片高亮表达，且标签的取值必须与同一元素的 `data-i18n` 键一致。`exitEdit`、`exitRemoveMode`、`exitReplaceMode` 三条文案已随本次收尾从 30 种语言和 `scripts/check-locales.mjs` 的键清单中一并删除；新增或删除任何被界面渲染的文案键，都必须同时改键清单，否则 `check-locales.mjs` 会直接报错（见下条）。

16. 任何新增的界面文案都必须在 `scripts/check-locales.mjs` 的键清单里登记：该脚本现在除了检查 25 种附加语言是否缺键，还会合并设置页的三个文案模块一并校验，并比对 popup.html / options.html 里出现的每个 `data-i18n*` 键是否已登记，未登记即报错。历史上 `autoEnter*` 四条与 `clipboardPermissionDenied` / `downloadPermissionDenied` 两条就是因为没登记，导致 29 种语言长期静默回退英文。
17. 遥测口径的判定边界（**不要扩大适用范围**）：只有"用户可主动点击的入口"在自动触发时**不计数**，即 `edit.start`、`remove.start`、`image.replace.start` 三个工具入口计数器（实现上分别靠 `event.isTrusted` 与 `enterReplaceMode(false)` 区分手动与自动）。其余事件一律**按发生次数照常记录**：`popup.open` 包含额度锁定时 Service Worker 主动打开 Popup 的那次；`monetization.checkin_succeeded`、`monetization.upgrade_shown` 本身就不是用户动作，也照常记录。不得因为"自动的操作不计数"而把这三类一并排除。

## 6. 编辑文字与文字格式工具栏

「编辑文字」（英文 Edit text）在编辑模式中进行：Popup 进入编辑模式后，页面正文变为可编辑，页面内出现历史工具栏（撤回、重做、完成、修改计数与提示），并按设置注入文字格式工具栏。Dashboard 的 Tips 给出了「点击文字会打开链接时如何先定位光标」的操作建议。

规则：

1. 浮动工具栏本身**没有用户可见名称**，它只通过 Settings 的开关文案出现（见第 8 条）；文档与客服提到它时统一使用 §1 登记的「文字格式工具栏」。
2. 出现条件（三条同时成立）：编辑模式已开启（页面正文可编辑）、有非折叠选区、选区位于页面内容内。条件不成立立即隐藏；选区变化、滚动、窗口尺寸变化时重新定位，靠近视口顶部时改在选区下方显示。
3. 按钮从左到右：字号 −、当前字号、字号 +、B（粗体）、S（删除线）、I（斜体）、U（下划线）、A（文字颜色与背景色浮层）、恢复原始格式（纯图标，无文字）。字号显示为选区计算结果；选区内不一致时显示 `Mixed`。浮层的背景色第一格是斜杠图标，语义是「不使用工具栏背景色」，即**移除**已应用的背景色（写入 `transparent` 会让宿主页面的底色透出来，看起来像没反应）；浮层默认开在工具栏上方以免遮挡正在编辑的文字，只有在工具栏已贴近视口顶部、上方放不下时才落到下方。
4. 格式只作用于选中的文字：每个文本节点被包进 `<edit-page-format>` 内联包裹层，该元素先 `all: unset !important` 再写入单条属性 `!important`，用于压过宿主页面的 `span`、`*`、框架工具类等宽泛样式。不得改成直接修改元素 `style`，那会被站点 CSS 反过来覆盖。
5. 每次格式操作都写入历史栈（`type: "format"`），撤回与重做逐步回退；工具栏按钮的激活态由选区实际计算样式推导，混合选区单独标示。
6. 还原类动作（再次点击 B/I/U/S 关闭格式、恢复原始格式、颜色浮层的 Reset）只还原样式，**不上报遥测**；只有「应用格式」才计数。
7. 配额：免费版「文本格式」上限 30 次，按**工具栏动作**计数（包含恢复原始格式、Reset 这类还原动作，也包含字号 ±）。额度已锁定时工具栏**整体置灰**（`opacity .55` + `grayscale`，指针 `not-allowed`），鼠标悬停在整条工具栏上显示提示气泡（文案取 Popup 的 `quotaExhaustedBadge`，经 `_editPageSelectionToolbarInit(labels)` 传入，见第 10 条），此时点击任何按钮都**不产生动作**（包括颜色浮层不展开）；进入编辑模式时若已锁定，工具栏一开始就是置灰态。任何一项配额用尽都会锁定全部高级功能，见 §9。
8. 设置项：Dashboard → 「编辑文字」→「选择文本时显示工具栏」，默认开启；关闭后不再注入工具栏，已注入的会被移除。
9. 遥测口径：`popup.open` 在 Popup 打开时计一次（每次打开一次，早于任何提前返回，因此在无法编辑的页面上打开也计）；`edit.start` 在**文字编辑**模式由未激活转为激活时计一次（重复点击不计，**自动进入不计**）。它与 `remove.start`（进入移除模式）、`image.replace.start`（进入替换模式）是仅有的三个**工具入口**计数，**只统计用户手动触发的进入**：Dashboard 的「点击图标时自动进入」与「导入图片后自动进入替换模式」即使模式真的启动了也**不得**计数（实现上分别靠 `event.isTrusted` 与 `enterReplaceMode(false)` 区分）；**不得**用 `text.edit`、`element.remove`、`image.replace` 这些**动作**计数反推入口次数；`text.edit` 在一段文字编辑提交时计一次（同一元素 900 毫秒内的连续输入合并为一条，不按按键计数）；`format.bold`、`format.italic`、`format.underline`、`format.strikethrough`、`format.font_size`、`format.text_color`、`format.background_color` 各在对应格式**应用成功**时计一次；`history.undo`、`history.redo` 每次计一次。事件目录与语义以 edit-page-web/docs/EDIT_PAGE_TELEMETRY_SPEC.md 为准。
10. i18n：Dashboard 的「编辑文字」区块与开关文案见 `i18n/edit-text-settings.js`（配额标签为 `quotaTextFormatting`）。页面内工具栏的 8 条文案（textColor、backgroundColor、customColor、customTextColor、customBackgroundColor、reset、restoreOriginalFormatting、mixed）已有 30 种语言，**由 Popup 在注入时通过 `window._editPageSelectionToolbarInit(labels)` 传入**；`content/selection-toolbar.js` 里那套英文值只是最后兜底，**不得**改它们当翻译，也不得新增硬编码文案——新文案一律先登记 §1、补 30 种语言、再走 labels 传入（`mixed` 是选区内字号不一致时的读数）

## 7. 更改图片

“更改图片”支持两种图片来源：本地上传，以及粘贴 `http` 或 `https` 图片 URL。两种来源共用同一套图片预览、替换模式、撤回和重做逻辑。

URL 图片直接使用用户提供的地址，不由扩展下载或重新上传。面向用户的字段名称固定为中文“图片 URL”、英文“Image URL”。

保存图片 URL 前必须先确认浏览器能够将其加载为图片。失败提示应尽量区分：内容不是图片、来源网站拒绝访问、图片不存在、HTTP 错误、跨域或外链访问限制、请求超时；无法确认具体原因时统一提示“图片读取失败”。验证失败时不得保存 URL，也不得显示破损预览。

替换后的显示尺寸由 Dashboard 的「替换图片后」设置决定，默认「保持原尺寸并裁剪填满」：

| 设置项（英文 / 中文） | 行为 |
| --- | --- |
| Keep the original size and crop / 保持原尺寸并裁剪填满 | 保留被替换元素原有的盒子尺寸，新图按 `cover` 填充并裁剪，页面布局不变 |
| Use the new image's size / 使用新图自己的尺寸 | 使用新图自身的尺寸，页面可能因此重新排版 |

被替换的元素（`<img>` 与背景图元素都算）会在替换成功后立刻获得调整大小的手柄，见 §8。`<picture>` 的 `<source>` 与 `srcset` 在替换时会被清掉，撤回时按原值还原。

Popup 结构：「更改图片」是可展开的卡片，「上传」「图片 URL」「已选图片预览」三者都是**展开区的内容物**。预览的清除按钮固定在缩略图**右上角**；「替换图片模式」是预览行右侧的开关（与 Edit text、Remove element 用同一套开关样式）。进入替换模式时**整张「更改图片」卡片高亮**（`is-replacing`），不是只高亮那一行。选完图片后展开区**保持展开**，**不得**收起——否则预览会被一并隐藏。**不要**给这一行加 `active` 类：`popup.css` 顶部仍有遗留的全局 `button.active`（红底）、`button:active`（深蓝底）规则，会直接染到这行和清除按钮上；模式状态一律只用 `aria-pressed` 表达。

替换模式的状态归属：页面侧持有自己的副本（`window._editPageReplaceImage`、`window._editPageReplaceFit`），**只在进入替换模式时写入一次**，替换发生时按点击实时读取。因此当替换模式已经开启、用户又重新导入图片或改了「替换图片后」设置时，Popup 必须调用 `syncReplaceSelectionToPage()` 把新值推给页面——否则会出现"换成新图却替换成旧图""改了尺寸设置却不生效"这类故障（Popup 已关闭，用户看不到页面手里是哪一张）。该同步函数带守卫，只在页面确实处于替换模式时写入，不在其它页面凭空创建全局变量。另外，本地图片输入框每次 `change` 后必须立刻清空 `value`：否则重新选择同一个文件不会再触发事件，表现为"重新上传了但没生效"。

导入即替换与自动展开：本地图片读取成功、或图片 URL 校验通过后，Popup **自动进入替换模式**，走的是与开关完全相同的 `enterReplaceMode()`（配额闸门、历史管理器、退出其它模式、`image.replace.start` 只计一次），不得另写一条进入路径。已在替换模式时不重入、不重复计数；免费额度已锁定时提示并保留原有文案。替换模式处于激活状态时再次打开 Popup，「更改图片」区域**自动展开**，让图片与已打开的开关都可见。

配额：每次**成功替换到元素**计一次「更改图片」（同一张图替换 3 个元素 = 3 次）；导入本身不消耗额度，但免费额度已锁定时无法导入，改由 `monetization.free_limit_reached` 反映。调整已替换图片的大小不计费。详见 §9。

锁定期间 Popup 的入口行为：点「更改图片」**当场提示**（不再等展开后选图或上传），点「替换图片模式」同样当场提示；「更改图片」与「移除元素」两个入口**置灰但可点**（类名 `is-locked`，`opacity .55` + `grayscale`，**不使用 `disabled`**，因为点击本身就是提示入口）。

## 8. 调整已替换图片的大小

「调整大小」只对用户刚替换过的元素提供，页面原有的图片不会被改变。

1. 手柄出现的时机与范围：替换成功后立即出现，不需要额外点击；点击别处手柄消失，点击该元素本身手柄保留，可以接着调整。
2. 手柄与光标：四角四边共八个方向手柄，光标为双向箭头（nwse-resize、nesw-resize、ns-resize、ew-resize）。覆盖层固定定位，随滚动、窗口尺寸变化，以及元素自身尺寸变化（例如新图加载完成）重新贴合。
3. 缩放规则：拖四角默认保持宽高比；拖四边默认只改一个方向；按住 Alt 反转当前默认（角变自由拉伸，边按比例）。
4. 提交与取消：松开鼠标提交为**一条**历史记录（`type: "resize"`），一次拖拽 = 一步撤回，拖动过程中的每一帧都不写历史；按 Esc 取消并还原；尺寸没有变化时不写历史。
5. 尺寸下限 16 像素；元素本身小于该值时以它自身为下限，拖拽不会把元素意外放大。使用两位小数的亚像素精度，避免反复拖拽角点侵蚀宽高比。
6. 站点常用的 `max-width: 100%` 之类上限会被临时解除（内联 `max-width`、`max-height` 置为 `none`），并随撤回逐字还原；元素是背景图（非 `<img>`）时，拖动会把 `background-size` 设为 `100% 100%`，同样纳入撤销快照。
7. 撤回或重做之后，手柄自动重新贴合到元素上。
8. 不消耗配额：只有「导入图片」计数，调整大小不计。
9. 遥测口径：每次**提交**一次拖拽计一次 `image.resize`；拖动过程、按 Esc 取消、尺寸未变化的拖拽都不计。不上报像素尺寸、手柄方向或元素身份。
10. i18n：手柄与覆盖层没有任何文字，因此不引入新的语言字符串。

## 9. 免费配额与锁定期

1. 免费版按功能分别计数：更改图片 7 次（每次**成功替换到元素**）、整张网页截图 3 次、移除元素 12 次（每次**成功移除一个元素**）、文本格式 30 次（按工具栏动作计）。
2. 各上限是**或**的关系：任意一项用尽，全部高级功能立即锁定 12 小时；锁定期结束时所有计数清零。
3. Premium 完全不受配额限制。
4. 不消耗配额的操作：撤回与重做、调整已替换图片的大小、导入图片、进入或退出编辑模式与移除模式、编辑文字本身、当前视窗截图。
5. 拦截在入口、计费在结果：额度已锁定时，**导入图片**与**进入移除模式**会被拒绝并提示；而计费只发生在结果真正产生时（成功替换到元素、成功移除元素）——由注入的页面脚本在动作前向 Service Worker 领取一次额度（`claim-feature-use`），被拒则不做该动作。因此：打开自动进入、选了图没应用、进了移除模式却没删，都不再消耗额度。
   - 锁定期间 Popup 的入口：点「更改图片」**当场提示并且不展开**（不再等展开后选图或上传），点「替换图片模式」同样当场提示；「更改图片」「移除元素」「整张网页截图」三个入口**置灰但可点**（类名 `is-locked`，`opacity .55` + `grayscale`，**不得使用 `disabled`**，因为点击本身就是提示入口）。
   - 「当前视窗」截图是免费操作，**不得**置灰；「编辑文字」入口保持可用，但其页面内的文字格式工具栏锁定时整条置灰并悬停提示，见 §6.7。
6. 被拒时页面侧没有提示（Popup 已关闭），表现为"点了没反应"；下次打开 Popup 会看到已达上限的说明。已被记入的额度不因撤回而退回，计数不回滚。
7. Dashboard 显示各项用量与解锁时间；锁定期间 Popup 顶部徽标显示已达上限。
8. 配额通道故障时**放行且不扣费**：页面侧领取额度的调用带 1.5 秒超时，Service Worker 无响应、仍是旧版本或抛错时一律放行该动作；只有明确收到 `allowed: false` 才拒绝。配额服务绝不能把功能本身弄坏——"点了元素没反应"这类问题，先怀疑配额通道而不是 DOM 逻辑。
9. 达到限额时会**主动收尾**：Service Worker 在"动作被拒"或"某次动作刚好用尽额度"时，写一张会话级待提示标记（`pendingQuotaNotice`，3 分钟 TTL）并尝试 `chrome.action.openPopup()` 打开 Popup；Popup 打开后**退出当前所处的模式**（文字编辑 / 替换图片 / 移除元素）并显示额度提示。因此免费额度用尽时用户不会停在"点了没反应"的模式里。
   - 只有**被拒**的那次才算 `monetization.free_limit_reached`；"刚好用尽"只提示、不计数。
   - 后续再次尝试进入已锁定的模式时，仍由入口拦截并提示（不再弹 Popup）。
   - Chrome 126 及更早版本无法程序化打开 Popup：标记会保留，用户下次手动打开 Popup 时仍能看到提示。

## 10. 自动进入（Start automatically）

Dashboard 的「自动进入」决定**打开 Popup 时自动进入哪个工具**，卡片位于 Language 模块上方：

| 值 | 选择方式 | 行为 |
| --- | --- | --- |
| `edit`（默认） | 选中「Edit text」 | 点击扩展图标时自动进入文字编辑模式 |
| `remove` | 选中「Remove element」 | 点击扩展图标时自动进入移除元素模式 |
| `none` | **两个都不选中**（再次点击已选中的那个即清空） | 不自动进入，保持现状 |

规则：

1. 只在**可编辑页面**上自动进入；浏览器内部页等不支持编辑的页面不进入。
2. 只在**当前没有任何模式激活**时进入；已在文字编辑 / 移除元素 / 替换图片模式时一律不动，避免把用户从正在使用的模式里拽出来。
3. **存在待恢复的截图请求时跳过**：权限弹窗会关闭 Popup，重开后若自动进入，紧随其后的截图流程会立刻撤销它，因此这种情况直接不进入。
4. `remove` 会消耗一次「移除元素」免费额度（与手动进入同口径）；额度已耗尽时**静默跳过**、不弹提示，Premium 不受限——否则每次打开 Popup 都会弹一次提示。
5. 自动进入与手动进入走**同一条代码路径**，因此配额与历史栈完全一致；遥测按"只有手动触发才计数"的规则区分——自动进入不计入工具入口，见第 6 条。
6. 遥测影响：自动进入**不计数**。`edit.start`、`remove.start`、`image.replace.start` 三个工具入口计数器只统计用户手动触发的进入（实现靠 `event.isTrusted` 与 `enterReplaceMode(false)`，详见 §6 第 9 条）。因此"工具入口"仍然等同于"用户主动进入"，不需要再用动作计数折算。
7. 清空方式：卡片只有两个选项，**再次点击已选中的那个工具即清空**（存储值 `none`，UI 上两个都不选中），帮助文案里用一句 "Click the selected tool again to turn this off." 提示这一交互；刻意不设第三个「不自动进入」选项。
8. i18n：4 个键（`autoEnterHeading`、`autoEnterHelp`、`autoEnterEdit`、`autoEnterRemove`）**已有 30 种语言**，并已登记进 `scripts/check-locales.mjs` 的选项键清单——未登记时校验不会覆盖它们，这 4 个键此前正是因此长期只显示英文。其中 `autoEnterEdit` / `autoEnterRemove` 复用各语言自己的 `editText` / `removeElement` 措辞，保证与它命名的工具同词。

---

本文档描述当前代码的真实行为。实现或产品术语发生变化时，必须同步更新本文档；未经明确产品决策，不得自行创造或替换同义词。
