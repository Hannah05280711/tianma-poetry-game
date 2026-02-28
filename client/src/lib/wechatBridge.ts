/**
 * wechatBridge.ts
 *
 * 微信小程序 WebView 桥接工具
 *
 * 功能：
 * 1. 检测是否在微信小程序 WebView 中运行
 * 2. 从 URL 参数读取微信 session token，存入 localStorage
 *    （main.tsx 中的 tRPC 客户端会自动读取并附加 Authorization 头）
 * 3. 提供向小程序发送消息的方法（分享、登出等）
 *
 * 注意：由于前端（tcloudbaseapp.com）和后端（tcloudbase.com）跨域，
 * 不能依赖 cookie，改用 Authorization: Bearer <token> 头。
 * token 存储在 localStorage 中，由 main.tsx 的 tRPC 客户端读取。
 */

export const WECHAT_TOKEN_KEY = "wechat_session_token";

/**
 * 检测是否在微信小程序 WebView 中运行
 */
export function isInMiniProgram(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("miniprogram") || window.__wxjs_environment === "miniprogram";
}

/**
 * 从 localStorage 获取微信 token
 */
export function getWechatToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WECHAT_TOKEN_KEY);
}

/**
 * 保存微信 token 到 localStorage
 */
export function saveWechatToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WECHAT_TOKEN_KEY, token);
}

/**
 * 清除微信 token（登出时调用）
 */
export function clearWechatToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WECHAT_TOKEN_KEY);
}

/**
 * 检查是否已有有效的微信 token
 */
export function hasWechatToken(): boolean {
  return !!getWechatToken();
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
