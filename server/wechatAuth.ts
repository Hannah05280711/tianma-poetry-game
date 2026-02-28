/**
 * 微信小程序登录路由
 *
 * 流程：
 * 1. 小程序前端调用 wx.login() 获取临时 code
 * 2. 小程序将 code POST 到 /api/auth/wechat
 * 3. 后端用 code 换取微信 openid（code2Session）
 * 4. 在本地数据库 upsert 用户
 * 5. 生成 JWT session token，写入响应
 * 6. 返回用户信息给小程序
 *
 * H5 端补充流程：
 * 7. WebView 加载时，H5 从 URL 参数读取 token
 * 8. H5 POST /api/auth/wechat/session，后端验证 token 并写入 cookie
 */

import type { Express, Request, Response } from "express";
import axios from "axios";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import * as db from "./db";

// 微信 code2Session 接口
const WECHAT_CODE2SESSION_URL =
  "https://api.weixin.qq.com/sns/jscode2session";

interface Code2SessionResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

/**
 * 通过 code 换取微信 openid
 */
async function code2Session(code: string): Promise<Code2SessionResponse> {
  const { data } = await axios.get<Code2SessionResponse>(
    WECHAT_CODE2SESSION_URL,
    {
      params: {
        appid: ENV.wechatAppId,
        secret: ENV.wechatAppSecret,
        js_code: code,
        grant_type: "authorization_code",
      },
      timeout: 10_000,
    }
  );
  return data;
}

/**
 * 注册微信登录路由到 Express app
 */
export function registerWechatAuthRoutes(app: Express): void {
  /**
   * POST /api/auth/wechat
   * Body: { code: string, nickName?: string, avatarUrl?: string }
   * 返回: { success: true, user: { openId, name }, sessionToken }
   *
   * 供微信小程序端调用
   */
  app.post("/api/auth/wechat", async (req: Request, res: Response) => {
    const { code, nickName, avatarUrl } = req.body as {
      code?: string;
      nickName?: string;
      avatarUrl?: string;
    };

    if (!code || typeof code !== "string") {
      res.status(400).json({ success: false, error: "缺少 code 参数" });
      return;
    }

    if (!ENV.wechatAppId || !ENV.wechatAppSecret) {
      console.error("[WechatAuth] WECHAT_APP_ID or WECHAT_APP_SECRET not configured");
      res.status(500).json({ success: false, error: "微信登录未配置" });
      return;
    }

    try {
      // 1. 换取 openid
      const wxResult = await code2Session(code);

      if (wxResult.errcode && wxResult.errcode !== 0) {
        console.error("[WechatAuth] code2Session error:", wxResult);
        res.status(401).json({
          success: false,
          error: `微信登录失败: ${wxResult.errmsg ?? "未知错误"} (${wxResult.errcode})`,
        });
        return;
      }

      const openId = wxResult.openid;
      if (!openId) {
        res.status(401).json({ success: false, error: "未获取到 openid" });
        return;
      }

      // 2. 构造微信专属 openId（加前缀避免与 Manus openId 冲突）
      const wechatOpenId = `wx_${openId}`;
      const displayName = nickName || `微信用户_${openId.slice(-6)}`;

      // 3. upsert 用户到数据库
      await db.upsertUser({
        openId: wechatOpenId,
        name: displayName,
        loginMethod: "wechat",
        lastSignedIn: new Date(),
      });

      // 4. 生成 JWT session token
      const sessionToken = await sdk.signSession({
        openId: wechatOpenId,
        appId: ENV.wechatAppId,
        name: displayName,
      });

      // 5. 写入 session cookie（小程序 WebView 内会自动携带）
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // 6. 返回用户信息和 sessionToken（小程序端存入 storage）
      res.json({
        success: true,
        user: {
          openId: wechatOpenId,
          name: displayName,
          loginMethod: "wechat",
        },
        sessionToken,
      });
    } catch (error) {
      console.error("[WechatAuth] Login error:", error);
      res.status(500).json({ success: false, error: "服务器内部错误" });
    }
  });

  /**
   * POST /api/auth/wechat/session
   * Body: { token: string }
   * 返回: { success: true }
   *
   * 供 H5 端（WebView 内）调用：
   * 小程序将 sessionToken 作为 URL 参数传给 WebView，
   * H5 读取后调用此接口，后端验证 token 并写入 cookie，
   * 从而让 H5 的 tRPC 请求携带正确的身份认证。
   */
  app.post("/api/auth/wechat/session", async (req: Request, res: Response) => {
    const { token } = req.body as { token?: string };

    if (!token || typeof token !== "string") {
      res.status(400).json({ success: false, error: "缺少 token 参数" });
      return;
    }

    try {
      // 验证 token 有效性
      const session = await sdk.verifySession(token);
      if (!session) {
        res.status(401).json({ success: false, error: "token 无效或已过期" });
        return;
      }

      // 写入 session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.json({ success: true, openId: session.openId });
    } catch (error) {
      console.error("[WechatAuth] Session exchange error:", error);
      res.status(500).json({ success: false, error: "服务器内部错误" });
    }
  });

  /**
   * GET /api/auth/wechat/config
   * 返回小程序需要的公开配置（AppID）
   */
  app.get("/api/auth/wechat/config", (_req: Request, res: Response) => {
    res.json({
      appId: ENV.wechatAppId || "",
    });
  });
}
