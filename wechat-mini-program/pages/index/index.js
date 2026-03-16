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
          console.error('登录失败:', err);
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
