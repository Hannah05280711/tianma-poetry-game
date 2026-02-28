/**
 * wechatBridge.ts
 *
 * 微信小程序 WebView 桥接工具
 *
 * 功能：
 * 1. 检测是否在微信小程序 WebView 中运行
 * 2. 从 URL 参数读取微信 session token，通过后端接口写入 cookie
 * 3. 提供向小程序发送消息的方法（分享、登出等）
 */

/**
 * 检测是否在微信小程序 WebView 中运行
 */
export function isInMiniProgram(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("miniprogram") || window.__wxjs_environment === "miniprogram";
}

/**
 * 从 URL 参数中读取微信 token 并通过后端接口建立 session
 * 调用时机：应用启动时（main.tsx 或 App.tsx）
 */
export async function initWechatSession(): Promise<boolean> {
  if (!isInMiniProgram()) return false;

  const urlParams = new URLSearchParams(window.location.search);
  const wechatToken = urlParams.get("wechat_token");

  if (!wechatToken) return false;

  try {
    // 调用后端接口，用 token 建立 session cookie
    const res = await fetch("/api/auth/wechat/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: wechatToken }),
      credentials: "include",
    });

    if (res.ok) {
      // 清除 URL 中的 token 参数（避免刷新时重复处理）
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("wechat_token");
      window.history.replaceState({}, "", newUrl.toString());
      return true;
    }
  } catch (err) {
    console.error("[WechatBridge] Failed to init session:", err);
  }

  return false;
}

/**
 * 向小程序发送消息
 * 注意：消息只在特定时机传递（小程序后退、销毁、分享时）
 */
export function postMessageToMiniProgram(data: Record<string, unknown>): void {
  if (!isInMiniProgram()) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wx = (window as any).wx;
    if (wx && wx.miniProgram) {
      wx.miniProgram.postMessage({ data });
    }
  } catch (err) {
    console.error("[WechatBridge] postMessage failed:", err);
  }
}

/**
 * 通知小程序执行登出
 */
export function notifyMiniProgramLogout(): void {
  postMessageToMiniProgram({ type: "logout" });
}

// 扩展 window 类型
declare global {
  interface Window {
    __wxjs_environment?: string;
  }
}
