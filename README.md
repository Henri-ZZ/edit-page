# Edit Page

让任何网页都可以一键编辑！

## 功能

- 点击"编辑模式"按钮开启/关闭页面编辑
- 编辑模式下页面会有红色虚线边框提示
- 鼠标悬停的元素会有蓝色虚线提示

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
├── options/               # 选项页面
│   ├── options.html
│   ├── options.css
│   └── options.js
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

