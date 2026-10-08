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
| Edit text | 编辑文字 | 修改文本、文字编辑器等 |
| Text formatting | 文本格式 | 文字样式、字体设置、排版等 |
| Text formatting toolbar | 文字格式工具栏 | 格式面板、样式菜单、浮动菜单等自造名 |
| Show toolbar when text is selected | 选择文本时显示工具栏 | 选中文字弹出菜单、格式面板等自造名 |
| Change image | 更改图片 | 换图、图片编辑等 |
| After replacing an image | 替换图片后 | 替换后、换图后等 |
| Keep the original size and crop | 保持原尺寸并裁剪填满 | 保持原大小、按原框裁切等 |
| Use the new image's size | 使用新图自己的尺寸 | 使用新尺寸、按新图大小等 |
| Resize | 调整大小 | 缩放、拉伸、改尺寸等 |
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

## 6. 编辑文字与文字格式工具栏

「编辑文字」（英文 Edit text）在编辑模式中进行：Popup 进入编辑模式后，页面正文变为可编辑，页面内出现历史工具栏（撤回、重做、完成、修改计数与提示），并按设置注入文字格式工具栏。Dashboard 的 Tips 给出了「点击文字会打开链接时如何先定位光标」的操作建议。

规则：

1. 浮动工具栏本身**没有用户可见名称**，它只通过 Settings 的开关文案出现（见第 8 条）；文档与客服提到它时统一使用 §1 登记的「文字格式工具栏」。
2. 出现条件（三条同时成立）：编辑模式已开启（页面正文可编辑）、有非折叠选区、选区位于页面内容内。条件不成立立即隐藏；选区变化、滚动、窗口尺寸变化时重新定位，靠近视口顶部时改在选区下方显示。
3. 按钮从左到右：字号 −、当前字号、字号 +、B（粗体）、S（删除线）、I（斜体）、U（下划线）、A（文字颜色与背景色浮层）、恢复原始格式（纯图标，无文字）。字号显示为选区计算结果；选区内不一致时显示 `Mixed`。浮层的背景色第一格是斜杠图标，语义是「不使用工具栏背景色」，即**移除**已应用的背景色（写入 `transparent` 会让宿主页面的底色透出来，看起来像没反应）；浮层默认开在工具栏上方以免遮挡正在编辑的文字，只有在工具栏已贴近视口顶部、上方放不下时才落到下方。
4. 格式只作用于选中的文字：每个文本节点被包进 `<edit-page-format>` 内联包裹层，该元素先 `all: unset !important` 再写入单条属性 `!important`，用于压过宿主页面的 `span`、`*`、框架工具类等宽泛样式。不得改成直接修改元素 `style`，那会被站点 CSS 反过来覆盖。
5. 每次格式操作都写入历史栈（`type: "format"`），撤回与重做逐步回退；工具栏按钮的激活态由选区实际计算样式推导，混合选区单独标示。
6. 还原类动作（再次点击 B/I/U/S 关闭格式、恢复原始格式、颜色浮层的 Reset）只还原样式，**不上报遥测**；只有「应用格式」才计数。
7. 配额：免费版「文本格式」上限 30 次，按**工具栏动作**计数（包含恢复原始格式、Reset 这类还原动作，也包含字号 ±）。达到上限后工具栏的后续动作静默不生效，工具栏本身不给提示；锁定状态在下次打开 Dashboard 或 Popup 时可见。任何一项配额用尽都会锁定全部高级功能，见 §9。
8. 设置项：Dashboard → 「编辑文字」→「选择文本时显示工具栏」，默认开启；关闭后不再注入工具栏，已注入的会被移除。
9. 遥测口径：`edit.start` 在编辑模式由未激活转为激活时计一次（重复点击不计）；`text.edit` 在一段文字编辑提交时计一次（同一元素 900 毫秒内的连续输入合并为一条，不按按键计数）；`format.bold`、`format.italic`、`format.underline`、`format.strikethrough`、`format.font_size`、`format.text_color`、`format.background_color` 各在对应格式**应用成功**时计一次；`history.undo`、`history.redo` 每次计一次。事件目录与语义以 edit-page-web/docs/EDIT_PAGE_TELEMETRY_SPEC.md 为准。
10. i18n 现状：Dashboard 的「编辑文字」区块与开关文案已有 30 种语言（`i18n/edit-text-settings.js`，配额标签为 `quotaTextFormatting`）；**工具栏浮层文案目前只有英文兜底**，即 `content/selection-toolbar.js` 里的 Text color、Background color、Custom、Reset、Restore original formatting。将来翻译时应通过 `window._editPageSelectionToolbarInit(labels)` 传入，而不是改动硬编码的兜底值。

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

配额：每次**导入**计一次「更改图片」（本地上传与图片 URL 各计一次），与这张图随后替换了几个元素无关；被配额拦下的导入不计数，改由 `monetization.free_limit_reached` 反映。详见 §9。

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

1. 免费版按功能分别计数：更改图片 5 次（每次导入，本地上传与图片 URL 各计一次）、整张网页截图 3 次、移除元素 5 次（按进入移除模式计，不按移除的元素个数）、文本格式 30 次（按工具栏动作计）。
2. 各上限是**或**的关系：任意一项用尽，全部高级功能立即锁定 12 小时；锁定期结束时所有计数清零。
3. Premium 完全不受配额限制。
4. 不消耗配额的操作：撤回与重做、调整已替换图片的大小、进入或退出编辑模式、编辑文字本身、当前视窗截图。
5. Dashboard 显示各项用量与解锁时间；锁定期间 Popup 顶部徽标显示已达上限。

---

本文档描述当前代码的真实行为。实现或产品术语发生变化时，必须同步更新本文档；未经明确产品决策，不得自行创造或替换同义词。
