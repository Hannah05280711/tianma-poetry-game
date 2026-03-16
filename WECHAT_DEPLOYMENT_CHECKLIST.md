# 微信小程序部署快速清单

## ✅ 前置准备（1天）

- [ ] **注册微信小程序账户**
  - 访问 https://mp.weixin.qq.com
  - 使用个人身份认证
  - 获取 AppID 和 AppSecret

- [ ] **域名备案**
  - 确保 `tianmapoet.click` 已备案
  - HTTPS 证书有效期 > 3个月

- [ ] **获取AppID**
  - 登录小程序后台
  - 复制 AppID（形如：`wx1234567890abcdef`）
  - 保管好 AppSecret

## 📱 小程序项目准备（1天）

- [ ] **下载微信开发者工具**
  - 访问 https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
  - 安装稳定版本

- [ ] **准备小程序文件**
  - 复制 `wechat-mini-program/` 目录下的所有文件
  - 修改 `project.config.json` 中的 AppID
  - 确保文件结构完整：
    ```
    ├── app.json
    ├── app.js
    ├── app.wxss
    ├── pages/
    │   └── index/
    │       ├── index.wxml
    │       ├── index.js
    │       └── index.wxss
    └── project.config.json
    ```

## 🔧 微信小程序后台配置（1天）

- [ ] **添加服务器域名**
  1. 登录小程序后台
  2. 点击「开发」→「开发设置」
  3. 在「服务器域名」中添加：
     - Request：`https://tianmapoet.click`
     - Download：`https://tianmapoet.click`
     - Upload：`https://tianmapoet.click`

- [ ] **配置业务域名**
  1. 在「业务域名」中添加：`https://tianmapoet.click`
  2. 下载验证文件
  3. 上传到服务器根目录：`/public/MP_verify_xxxxx.txt`
  4. 验证成功

- [ ] **配置分享设置**
  1. 点击「功能」→「分享」
  2. 配置分享卡片：
     - 标题：「天马行空·你的本命诗人是谁」
     - 描述：「找到你的本命诗人，收集诗词卡牌」
     - 图片：上传 `share-image.png`（建议 1200x627px）

## 🌐 Web应用配置（1天）

- [ ] **添加微信小程序支持**
  - 在 `client/src/App.tsx` 中添加微信小程序检测
  - 支持从URL参数获取 `openid`
  - 自动使用微信openid登录

- [ ] **创建分享工具**
  - 在 `client/src/lib/wechatShare.ts` 中实现分享功能
  - 支持分享到微信群、朋友圈、好友

- [ ] **添加og标签**
  - 在 `client/index.html` 中添加：
    ```html
    <meta property="og:title" content="天马行空·你的本命诗人是谁" />
    <meta property="og:description" content="找到你的本命诗人，收集诗词卡牌" />
    <meta property="og:image" content="https://tianmapoet.click/share-image.png" />
    <meta property="og:url" content="https://tianmapoet.click" />
    ```

## 📦 本地测试（1天）

- [ ] **在微信开发者工具中打开项目**
  1. 打开微信开发者工具
  2. 选择「小程序」→「+」
  3. 选择 `wechat-mini-program/` 目录
  4. 输入 AppID
  5. 点击「打开」

- [ ] **在开发工具中测试**
  - [ ] Web-view 正常加载
  - [ ] 微信登录成功
  - [ ] Manus OAuth 登录正常
  - [ ] 答题功能正常
  - [ ] 分享功能正常
  - [ ] 音效播放正常

- [ ] **真机测试**
  1. 点击「预览」生成二维码
  2. 用微信扫描二维码
  3. 在真机上完整测试所有功能

## 🚀 提交审核（1天）

- [ ] **上传小程序**
  1. 在微信开发者工具中点击「上传」
  2. 输入版本号（如 1.0.0）
  3. 输入更新说明
  4. 点击「上传」

- [ ] **在小程序后台提交审核**
  1. 登录小程序后台
  2. 点击「版本管理」→「提交审核」
  3. 填写审核信息：
     - 功能描述：「诗词答题游戏，收集诗人卡牌」
     - 测试账号：（可选）
     - 测试密码：（可选）
  4. 点击「提交」

## ⏳ 等待审核（3-5个工作日）

- [ ] **监控审核状态**
  - 定期登录小程序后台查看审核进度
  - 如有问题，微信会发送邮件通知

- [ ] **审核失败处理**
  - 查看拒绝原因
  - 修改相应内容
  - 重新提交审核

## ✨ 发布上线（1天）

- [ ] **审核通过后发布**
  1. 登录小程序后台
  2. 点击「版本管理」→「已通过」
  3. 点击「发布」
  4. 确认发布

- [ ] **验证上线**
  1. 在微信中搜索「天马行空」
  2. 点击进入小程序
  3. 完整测试所有功能

## 📊 上线后监控

- [ ] **监控关键指标**
  - DAU（日活用户数）
  - MAU（月活用户数）
  - 崩溃率
  - 性能指标

- [ ] **收集用户反馈**
  - 在小程序后台查看用户评价
  - 定期修复bug
  - 发布更新版本

---

## 🆘 常见问题排查

| 问题 | 解决方案 |
|------|---------|
| Web-view加载失败 | 检查域名是否在白名单，HTTPS是否有效 |
| 分享不显示卡片 | 检查og标签，确保分享图片URL正确 |
| 登录失败 | 检查AppID/AppSecret，后端API是否正常 |
| 审核被拒 | 查看拒绝原因，修改相应内容重新提交 |

---

## 📞 技术支持链接

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Web-view文档](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html)
- [微信小程序API文档](https://developers.weixin.qq.com/miniprogram/dev/api/)
- [小程序审核指南](https://developers.weixin.qq.com/miniprogram/product/material/audit.html)

---

**预期总耗时**：1-2周（主要是微信审核）
