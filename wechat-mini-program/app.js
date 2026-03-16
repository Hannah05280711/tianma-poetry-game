App({
  globalData: {
    userInfo: null,
    wxOpenId: null,
    sessionKey: null,
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
                this.globalData.sessionKey = res.data.sessionKey;
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
