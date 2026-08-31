# Edit Page 产品与 AI Agent 完整指南

> 文档性质：产品说明、术语规范与 AI Agent 工程指南  
> 代码基准：当前仓库实现  
> 适用平台：Chrome（Manifest V3）

## 1. Canonical terminology / 固定术语

以下名称是 Edit Page 的 **Canonical terminology**。面向用户的 UI、帮助文档、商店文案、客服回复、营销材料以及 AI Agent 生成的内容，都不得随意改写成近义词。

| English canonical term | 中文固定术语 | 不应擅自替换为 |
| --- | --- | --- |
| Edit Page | Edit Page | 网页编辑器、页面修改器等临时产品名 |
| Premium | Premium | Pro、Plus、付费版等替代层级名称 |
| License Key | 激活码 | 中文：许可证密钥、许可证、授权码、序列号；英文：activation code、license code、serial number |
| Settings | 设置 | 偏好设置、配置中心等替代标题 |
| Edit text | 编辑文字 | 修改文本、文字编辑器等 |
| Change image | 更改图片 | 换图、图片编辑等 |
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

当前支持的界面与商店语言为 English、简体中文、Español、Português (Brasil) 和日本語。产品名在所有语言中均保持 `Edit Page`。Premium 凭证在新增语言中的固定术语为：

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
3. 扩展根据操作系统、CPU 架构、逻辑核心数和设备内存生成设备 fingerprint（不使用屏幕尺寸），并向 Licentra 激活接口发送激活码、fingerprint 和设备标签。
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
5. 新增运行时资源是否已经加入 `scripts/package-release.sh`。
6. 文档描述是否仍与当前代码行为一致。

## 5. AI Agent 修改规则

1. 先以当前代码行为为事实来源，再同步更新文档。
2. 不得改写第 1 节的 Canonical terminology。
3. 修改中英文文案时应同时搜索整个仓库，避免旧术语残留。
4. 内部技术名与用户术语要分开处理：不得因为 UI 使用“激活码”就随意重命名稳定的存储键、API 字段或协议字段。
5. 修改 Premium 逻辑时必须保留签名校验、check-in、离线宽限和明确拒绝处理。
6. 修改截图逻辑时必须同时覆盖当前视窗与整张网页两条路径。
7. 修改设置项时必须保持默认值、持久化行为和 Popup 实际行为一致。

## 6. 更改图片

“更改图片”支持两种图片来源：本地上传，以及粘贴 `http` 或 `https` 图片 URL。两种来源共用同一套图片预览、替换模式、撤回和重做逻辑。

URL 图片直接使用用户提供的地址，不由扩展下载或重新上传。面向用户的字段名称固定为中文“图片 URL”、英文“Image URL”。

保存图片 URL 前必须先确认浏览器能够将其加载为图片。失败提示应尽量区分：内容不是图片、来源网站拒绝访问、图片不存在、HTTP 错误、跨域或外链访问限制、请求超时；无法确认具体原因时统一提示“图片读取失败”。验证失败时不得保存 URL，也不得显示破损预览。

---

本文档描述当前代码的真实行为。实现或产品术语发生变化时，必须同步更新本文档；未经明确产品决策，不得自行创造或替换同义词。
