# 天马行空诗词游戏 - 微信小程序部署指南

## 📋 部署方案概述

本方案采用**Web-view容器**方式部署，将现有的Web应用（`tianmapoet.click`）嵌入微信小程序，实现：
- ✅ 代码零修改，100%复用
- ✅ 支持微信一键登录 + Manus OAuth双登录
- ✅ 支持分享功能（分享到微信群、朋友圈、好友）
- ✅ 快速上线（1-2周）

---

## 🔧 第一步：准备工作

### 1.1 确认前置条件

- ✅ 微信小程序个人账户已注册
- ✅ 域名 `tianmapoet.click` 已备案（**必须**）
- ✅ Web应用已部署在 `https://tianmapoet.click`
- ✅ HTTPS证书已配置（微信小程序强制HTTPS）

### 1.2 获取微信小程序AppID

1. 登录 [微信小程序后台](https://mp.weixin.qq.com)
2. 点击「开发」→「基本信息」
3. 复制 **AppID**（形如：`wx1234567890abcdef`）
4. 复制 **AppSecret**（保管好，勿泄露）

---

## 📱 第二步：创建小程序项目文件

### 2.1 项目结构

```
wechat-mini-program/
├── app.json              # 小程序全局配置
├── app.js                # 小程序全局逻辑
├── app.wxss              # 小程序全局样式
├── pages/
│   ├── index/
│   │   ├── index.wxml    # 首页（Web-view容器）
│   │   ├── index.js      # 首页逻辑
│   │   └── index.wxss    # 首页样式
│   └── share/
│       ├── share.wxml    # 分享页面
│       ├── share.js
│       └── share.wxss
├── utils/
│   ├── wechatAuth.js     # 微信登录工具
│   └── share.js          # 分享工具
└── project.config.json   # 项目配置
```

### 2.2 创建 `app.json` 配置文件

```json
{
  "pages": [
    "pages/index/index",
    "pages/share/share"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#fff",
    "navigationBarTitleText": "天马行空·你的本命诗人是谁",
    "navigationBarTextStyle": "black",
    "navigationStyle": "custom"
  },
  "networkTimeout": {
    "request": 10000,
    "downloadFile": 10000
  },
  "permission": {
    "scope.userLocation": {
      "desc": "用于获取您的位置信息"
    },
    "scope.userPhoneNumber": {
      "desc": "用于快速登录"
    }
  },
  "requiredBackgroundModes": [
    "audio",
    "location"
  ]
}
```

### 2.3 创建 `app.js` 全局逻辑

```javascript
App({
  globalData: {
    userInfo: null,
    wxOpenId: null,
    accessToken: null,
    isLoggedIn: false
  },

  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus();
    
    // 获取微信用户信息（如果已授权）
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo;
            }
          });
        }
      }
    });
  },

  checkLoginStatus() {
    wx.checkSession({
      success: () => {
        // Session有效，用户已登录
        this.globalData.isLoggedIn = true;
      },
      fail: () => {
        // Session过期，需要重新登录
        this.globalData.isLoggedIn = false;
      }
    });
  },

  // 微信登录
  wechatLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: res => {
          const code = res.code;
          // 将code发送到后端，换取session_key和openid
          wx.request({
            url: 'https://tianmapoet.click/api/auth/wechat/code2session',
            method: 'POST',
            data: { code },
            success: res => {
              if (res.statusCode === 200) {
                this.globalData.wxOpenId = res.data.openid;
                this.globalData.accessToken = res.data.sessionKey;
                this.globalData.isLoggedIn = true;
                resolve(res.data);
              } else {
                reject(new Error('微信登录失败'));
              }
            },
            fail: reject
          });
        },
        fail: reject
      });
    });
  }
});
```

### 2.4 创建首页 `pages/index/index.wxml`

```xml
<view class="container">
  <!-- 导航栏 -->
  <view class="navbar" style="padding-top: {{statusBarHeight}}px;">
    <view class="navbar-title">天马行空</view>
    <view class="navbar-actions">
      <button class="navbar-btn" bindtap="onShare">分享</button>
      <button class="navbar-btn" bindtap="onMenu">菜单</button>
    </view>
  </view>

  <!-- Web-view容器 -->
  <web-view 
    src="https://tianmapoet.click?from=wechat&openid={{wxOpenId}}"
    bindmessage="onWebViewMessage"
    bindload="onWebViewLoad"
    binderror="onWebViewError"
  />

  <!-- 分享菜单 -->
  <view class="share-menu" wx:if="{{showShareMenu}}">
    <view class="share-item" bindtap="shareToFriend">
      <text>分享给好友</text>
    </view>
    <view class="share-item" bindtap="shareToMoment">
      <text>分享到朋友圈</text>
    </view>
    <view class="share-item" bindtap="shareToGroup">
      <text>分享到群聊</text>
    </view>
    <view class="share-item" bindtap="closeShareMenu">
      <text>取消</text>
    </view>
  </view>
</view>
```

### 2.5 创建首页逻辑 `pages/index/index.js`

```javascript
const app = getApp();

Page({
  data: {
    statusBarHeight: 0,
    wxOpenId: '',
    showShareMenu: false,
    webViewUrl: ''
  },

  onLoad() {
    // 获取状态栏高度
    wx.getSystemInfo({
      success: res => {
        this.setData({
          statusBarHeight: res.statusBarHeight
        });
      }
    });

    // 检查登录状态
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    if (!app.globalData.isLoggedIn) {
      // 需要登录
      app.wechatLogin()
        .then(data => {
          this.setData({
            wxOpenId: data.openid,
            webViewUrl: `https://tianmapoet.click?from=wechat&openid=${data.openid}`
          });
        })
        .catch(err => {
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'error'
          });
        });
    } else {
      this.setData({
        wxOpenId: app.globalData.wxOpenId,
        webViewUrl: `https://tianmapoet.click?from=wechat&openid=${app.globalData.wxOpenId}`
      });
    }
  },

  onWebViewMessage(e) {
    // 接收Web应用发来的消息
    const { data } = e.detail;
    console.log('Web消息:', data);

    // 处理分享请求
    if (data[0]?.action === 'share') {
      this.handleShare(data[0]);
    }
  },

  onWebViewLoad() {
    console.log('Web-view加载完成');
  },

  onWebViewError(e) {
    console.error('Web-view加载失败:', e);
    wx.showToast({
      title: '页面加载失败',
      icon: 'error'
    });
  },

  onShare() {
    this.setData({ showShareMenu: true });
  },

  shareToFriend() {
    this.performShare('friend');
  },

  shareToMoment() {
    this.performShare('moment');
  },

  shareToGroup() {
    this.performShare('group');
  },

  performShare(type) {
    wx.shareAppMessage({
      title: '天马行空·你的本命诗人是谁',
      path: '/pages/index/index',
      imageUrl: 'https://tianmapoet.click/share-image.png',
      success: () => {
        wx.showToast({
          title: '分享成功',
          icon: 'success'
        });
        // 通知Web应用分享成功
        this.webViewComponent?.postMessage({
          data: { action: 'shareSuccess', type }
        });
      },
      fail: () => {
        wx.showToast({
          title: '分享失败',
          icon: 'error'
        });
      }
    });
    this.closeShareMenu();
  },

  closeShareMenu() {
    this.setData({ showShareMenu: false });
  },

  onMenu() {
    wx.showActionSheet({
      itemList: ['关于我们', '反馈意见', '退出登录'],
      success: res => {
        switch(res.tapIndex) {
          case 0:
            // 打开关于页面
            break;
          case 1:
            // 打开反馈页面
            break;
          case 2:
            // 退出登录
            app.globalData.isLoggedIn = false;
            wx.reLaunch({
              url: '/pages/index/index'
            });
            break;
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '天马行空·你的本命诗人是谁',
      path: '/pages/index/index',
      imageUrl: 'https://tianmapoet.click/share-image.png'
    };
  }
});
```

### 2.6 创建首页样式 `pages/index/index.wxss`

```wxss
.container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  z-index: 100;
}

.navbar-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.navbar-actions {
  display: flex;
  gap: 8px;
}

.navbar-btn {
  padding: 6px 12px;
  font-size: 14px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  color: #333;
}

web-view {
  flex: 1;
  width: 100%;
}

.share-menu {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 200;
  animation: slideUp 0.3s ease-out;
}

.share-item {
  padding: 16px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  text-align: center;
  font-size: 16px;
  color: #333;
}

.share-item:last-child {
  border-bottom: none;
  color: #999;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
```

### 2.7 创建项目配置 `project.config.json`

```json
{
  "description": "天马行空诗词游戏微信小程序",
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackendCode": true,
    "minified": true,
    "newFeature": true,
    "coverView": true,
    "nodeModules": false,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": false,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    },
    "enableEngineNative": false,
    "useIsolateContext": true,
    "useCompilerModule": true,
    "userConfirmedBundleSwitch": false,
    "packNpmManually": false,
    "packNpmSearchDepth": 0,
    "minifyWXSS": true,
    "disableUseSync": false,
    "showES6CompileModule": false,
    "useStaticServer": true,
    "checkAppTxv5": true,
    "checkSiteMapIndex": true,
    "staticServerPort": 80,
    "checkMD5": true
  },
  "compileType": "miniprogram",
  "libVersion": "2.19.4",
  "appid": "wx1234567890abcdef",
  "projectname": "tianma-poetry-game",
  "debugOptions": {
    "hidedInDevtools": []
  },
  "scripts": {},
  "staticServerPort": 80,
  "qqApeture": false,
  "qcloudRoot": "",
  "condition": {
    "search": {
      "current": -1,
      "list": []
    },
    "conversation": {
      "current": -1,
      "list": []
    },
    "plugin": {
      "current": -1,
      "list": []
    },
    "gamePlugin": {
      "current": -1,
      "list": []
    },
    "miniprogram": {
      "current": -1,
      "list": []
    }
  }
}
```

---

## 🌐 第三步：配置Web应用支持微信小程序

### 3.1 在Web应用中添加微信小程序支持

编辑 `client/src/App.tsx`，添加微信小程序检测和登录支持：

```typescript
import { useEffect, useState } from 'react';

function App() {
  const [isWechatMiniProgram, setIsWechatMiniProgram] = useState(false);
  const [wxOpenId, setWxOpenId] = useState<string | null>(null);

  useEffect(() => {
    // 检测是否在微信小程序中运行
    const ua = navigator.userAgent.toLowerCase();
    const isInWechat = /micromessenger/.test(ua);
    const isInMiniProgram = /miniprogram/.test(ua);
    
    if (isInWechat && isInMiniProgram) {
      setIsWechatMiniProgram(true);
      
      // 从URL获取openid
      const params = new URLSearchParams(window.location.search);
      const openid = params.get('openid');
      if (openid) {
        setWxOpenId(openid);
        // 自动使用微信openid登录
        loginWithWechatOpenId(openid);
      }
    }
  }, []);

  const loginWithWechatOpenId = async (openid: string) => {
    try {
      const response = await fetch('/api/auth/wechat/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openid })
      });
      if (response.ok) {
        // 登录成功，重定向到首页
        window.location.href = '/';
      }
    } catch (error) {
      console.error('微信登录失败:', error);
    }
  };

  // 在小程序中隐藏某些UI元素
  return (
    <div className={isWechatMiniProgram ? 'in-wechat-mini-program' : ''}>
      {/* 您的应用内容 */}
    </div>
  );
}

export default App;
```

### 3.2 添加分享功能支持

在 `client/src/lib/wechatShare.ts` 中创建分享工具：

```typescript
/**
 * 在微信小程序中触发分享
 */
export function shareToWechat(options: {
  title: string;
  description?: string;
  imageUrl?: string;
  type?: 'friend' | 'moment' | 'group';
}) {
  // 检测是否在微信小程序中
  const ua = navigator.userAgent.toLowerCase();
  const isInMiniProgram = /miniprogram/.test(ua);

  if (isInMiniProgram && (window as any).wx) {
    // 发送消息给小程序
    (window as any).wx.postMessage({
      data: {
        action: 'share',
        title: options.title,
        description: options.description,
        imageUrl: options.imageUrl,
        type: options.type || 'friend'
      }
    });
  } else {
    // 在普通浏览器中使用Web Share API
    if (navigator.share) {
      navigator.share({
        title: options.title,
        text: options.description,
        url: window.location.href
      });
    }
  }
}
```

---

## 🔐 第四步：配置微信小程序后台

### 4.1 添加域名白名单

1. 登录 [微信小程序后台](https://mp.weixin.qq.com)
2. 点击「开发」→「开发设置」
3. 在「服务器域名」中添加：
   - **request合法域名**：`https://tianmapoet.click`
   - **downloadFile合法域名**：`https://tianmapoet.click`
   - **uploadFile合法域名**：`https://tianmapoet.click`

### 4.2 配置业务域名

1. 在「业务域名」中添加：`https://tianmapoet.click`
2. 下载验证文件，上传到您的服务器根目录
3. 验证成功后保存

### 4.3 配置分享设置

1. 点击「功能」→「分享」
2. 配置分享卡片的标题、描述、图片
3. 设置分享链接为：`https://tianmapoet.click`

---

## 📦 第五步：打包和发布

### 5.1 使用微信开发者工具

1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开项目文件夹（包含 `app.json` 的目录）
3. 点击「上传」按钮
4. 输入版本号和描述
5. 提交审核

### 5.2 审核要点

微信会审核以下内容：
- ✅ 应用功能是否完整
- ✅ 是否有违规内容（政治敏感词等）
- ✅ 用户隐私保护是否合规
- ✅ 域名是否备案

**预期审核时间**：1-3个工作日

---

## 🧪 第六步：测试

### 6.1 本地测试

1. 在微信开发者工具中点击「预览」
2. 用微信扫描二维码
3. 在真机上测试所有功能

### 6.2 测试清单

- [ ] Web应用正常加载
- [ ] 微信一键登录成功
- [ ] Manus OAuth登录正常
- [ ] 答题功能正常
- [ ] 分享功能正常
- [ ] 卡牌掉落动画正常
- [ ] 音效播放正常
- [ ] 网络请求正常

---

## 📊 监控和维护

### 7.1 监控小程序性能

在微信小程序后台可以查看：
- 日活用户数（DAU）
- 月活用户数（MAU）
- 崩溃率
- 性能指标

### 7.2 常见问题

| 问题 | 解决方案 |
|------|---------|
| Web-view加载失败 | 检查域名是否在白名单中，HTTPS证书是否有效 |
| 分享不显示卡片 | 检查分享卡片配置，确保og标签正确 |
| 登录失败 | 检查AppID和AppSecret是否正确 |
| 音效不播放 | 检查小程序权限设置，某些音频格式可能不支持 |

---

## 📞 技术支持

如有问题，请参考：
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Web-view文档](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html)
- [微信小程序API文档](https://developers.weixin.qq.com/miniprogram/dev/api/)
