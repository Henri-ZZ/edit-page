# Edit Page

让任何网页都可以一键编辑！

产品术语、功能行为和 AI Agent 修改规则见 [产品与 AI Agent 完整指南](docs/产品与AI-Agent完整指南.md)。面向用户的中文统一使用“激活码”，英文统一使用“License Key”。

## 功能

- 点击"编辑模式"按钮开启/关闭页面编辑
- 编辑模式下页面会有红色虚线边框提示
- 鼠标悬停的元素会有蓝色虚线提示
- 支持本地上传或粘贴图片 URL，并点击页面图片完成替换
- 开启“移除元素”后，点击页面元素即可移除
- 文字、图片和元素修改共享撤回/重做历史，刷新网页可完全恢复原页面
- 支持截取当前视窗，或自动滚动并拼接整张网页；可在设置中选择截图时隐藏重复元素，包括悬浮按钮和滚动条

## 目录结构

```
├── manifest.json          # 插件配置文件
├── popup/                 # 弹出页面
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/               # 内容脚本
│   ├── content.js
│   └── content.css
├── background/            # 后台脚本
│   └── background.js
├── scripts/               # 发布脚本
│   └── package-release.sh
└── icons/                 # 图标文件
    ├── icon16.png
    ├── icon48.png
    ├── icon128.png
    └── icon.svg
```

## 开发调试 (Chrome)

1. 打开 `chrome://extensions/`
2. 开启 "Developer mode"
3. 点击 "Load unpacked"
4. 选择当前目录

## 开发调试 (Firefox)

1. 打开 `about:debugging`
2. 点击 "This Firefox"
3. 点击 "Load Temporary Add-on..."
4. 选择 `manifest.json`

## 发布打包

如果需要重新提交 Chrome Web Store，可以直接运行：

```bash
./scripts/package-release.sh
```

这个脚本会：

- 读取 `manifest.json` 里手动设置的版本号，不会自动修改
- 生成带版本号的 zip 包
- 同时生成一个固定文件名的最新上传包

输出目录：

```text
/Users/conghua/code/edit-page-release/
```

生成的文件：

- `edit-page-chrome-web-store-v版本号.zip`
- `edit-page-chrome-web-store.zip`

每次准备重新上架或更新时，建议顺序：

1. 修改代码
2. 更新 `manifest.json` 里的 `version`
3. 运行 `./scripts/package-release.sh`
4. 上传新的 zip 到 Chrome Web Store
