# 📌 小黑盒网页社区优化脚本使用说明

> **脚本名称**：小黑盒网页社区优化 - 高信息密度版  
> **适用网站**：`https://www.xiaoheihe.cn/*`  
> **核心功能**：隐藏左右侧边栏 + 全屏内容流 + 紧凑排版，一屏查看更多帖子！

---

## ✅ 功能亮点

| 功能 | 说明 |
|------|------|
| 🔲 **隐藏左侧边栏** | 移除“社区内容”“创作者中心”“开发者中心”等导航区域 |
| 🔲 **隐藏右侧边栏** | 移除“热门社区”“APP下载”“平台入口”“备案信息”等干扰内容 |
| 🖥️ **主内容全屏化** | 帖子列表横向拉满，充分利用屏幕宽度 |
| 📏 **高信息密度布局** | 头像缩小、文字压缩、图片中等尺寸（100~120px）、最多显示3张图 |
| ⏱️ **动态适配** | 自动处理滚动加载的新帖子，确保优化效果持续生效 |
| 🎨 **视觉精简** | 隐藏Logo、分割线、多余按钮，界面更干净专注 |

---

## 🛠️ 安装步骤

### 1. 安装 Tampermonkey（油猴）
- Chrome / Edge / Firefox 用户请前往对应扩展商店安装：
  - [Tampermonkey for Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
  - [Tampermonkey for Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/)

### 2. 安装本脚本
- 点击下方链接（或复制脚本代码）：
  ```text
  https://github.com/yourname/xiaoheihe-optimizer/raw/main/xiaoheihe-compact.user.js
  ```
  > 💡 若无公开链接，请将下方【脚本代码】手动导入。
- 或者：
  1. 打开 Tampermonkey → 点击「+」创建新脚本
  2. 全选默认内容，**粘贴本脚本完整代码**
  3. 按 `Ctrl+S` 保存

### 3. 访问小黑盒
- 打开 [小黑盒社区主页](https://www.xiaoheihe.cn/app/bbs/home)
- 刷新页面，即可看到优化效果！

---

## 🖼️ 效果对比

| 优化前 | 优化后 |
|--------|--------|
| 左右留白大，侧边栏占位明显 | 内容区全屏，无干扰元素 |
| 单屏显示约 6~8 条帖子 | 单屏可显示 **10~12 条** 帖子 |
| 图片过大，文字冗长 | 中等图 + 双行摘要，信息更聚焦 |

> 💬 **用户反馈**：“终于不用左右扫视了，眼睛舒服多了！”

---

## ⚙️ 脚本原理简述

- 使用 `GM_addStyle()` 注入全局 CSS，强制隐藏指定容器：
  ```css
  .hb-layout-main__container--left,
  .hb-layout__content--right {
      display: none !important;
  }
  ```
- 通过 `MutationObserver` 监听 DOM 变化，对动态加载的帖子实时应用紧凑样式
- 所有修改均为 **前端覆盖**，不影响账号安全与网站功能

---

## ❓ 常见问题

### Q：会影响发帖或评论吗？
> **不会**。所有交互功能（点赞、评论、发帖按钮）均保留，仅视觉优化。

### Q：如何临时恢复原始布局？
> 在浏览器中 **禁用 Tampermonkey 脚本** 或 **暂时关闭该脚本** 即可。

### Q：为什么有些元素没隐藏？
> 小黑盒可能更新了 HTML 结构。请提供截图，作者将尽快适配。

### Q：支持手机浏览器吗？
> 本脚本仅适用于 **桌面端浏览器**（Chrome/Firefox/Edge 等）。

---

## 📜 脚本代码（可选复制）

> 完整代码已包含在文件 `黑盒油猴侧边栏关闭.js` 中，此处略。  
> 如需查看，请打开脚本文件或访问项目仓库。

---

## 🙏 致谢

- 感谢 [Tampermonkey](https://www.tampermonkey.net/) 提供强大脚本平台
- 感谢小黑盒用户社区的反馈与建议
- 本脚本为 **非官方工具**，仅供个人学习与使用

---

> 📅 最后更新：2026年2月  
> 👤 作者：Haorain-Li
> 📩 问题反馈：可通过 GitHub Issues 提交

---

✅ **现在就去享受清爽、高效的小黑盒浏览体验吧！**
