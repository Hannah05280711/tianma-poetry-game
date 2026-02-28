/**
 * 微信登录接口单元测试
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock ENV
vi.mock("./_core/env", () => ({
  ENV: {
    wechatAppId: "wx_test_appid",
    wechatAppSecret: "test_secret",
    cookieSecret: "test_jwt_secret_32chars_minimum!!",
    appId: "test_app_id",
  },
}));

// Mock axios
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    create: vi.fn(() => ({ post: vi.fn(), get: vi.fn() })),
  },
}));

// Mock db
vi.mock("./db", () => ({
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue({
    openId: "wx_test_openid",
    name: "测试用户",
    loginMethod: "wechat",
  }),
}));

// Mock sdk
vi.mock("./_core/sdk", () => ({
  sdk: {
    signSession: vi.fn().mockResolvedValue("mock_jwt_token"),
    verifySession: vi.fn().mockResolvedValue({
      openId: "wx_test_openid",
      appId: "wx_test_appid",
      name: "测试用户",
    }),
  },
}));

// Mock cookies
vi.mock("./_core/cookies", () => ({
  getSessionCookieOptions: vi.fn().mockReturnValue({
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: false,
  }),
}));

import axios from "axios";
import { registerWechatAuthRoutes } from "./wechatAuth";

// 创建 mock Express app
function createMockApp() {
  const routes: Record<string, Function> = {};
  return {
    post: vi.fn((path: string, handler: Function) => {
      routes[`POST:${path}`] = handler;
    }),
    get: vi.fn((path: string, handler: Function) => {
      routes[`GET:${path}`] = handler;
    }),
    getRoute: (method: string, path: string) => routes[`${method}:${path}`],
  };
}

function createMockReqRes(body = {}) {
  const req = {
    body,
    headers: {},
    protocol: "http",
  } as any;

  const cookies: Record<string, unknown> = {};
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn((name: string, value: unknown) => {
      cookies[name] = value;
    }),
    _cookies: cookies,
  } as any;

  return { req, res };
}

describe("registerWechatAuthRoutes", () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    app = createMockApp();
    vi.clearAllMocks();
  });

  it("应该注册 POST /api/auth/wechat 路由", () => {
    registerWechatAuthRoutes(app as any);
    expect(app.post).toHaveBeenCalledWith(
      "/api/auth/wechat",
      expect.any(Function)
    );
  });

  it("应该注册 POST /api/auth/wechat/session 路由", () => {
    registerWechatAuthRoutes(app as any);
    expect(app.post).toHaveBeenCalledWith(
      "/api/auth/wechat/session",
      expect.any(Function)
    );
  });

  it("应该注册 GET /api/auth/wechat/config 路由", () => {
    registerWechatAuthRoutes(app as any);
    expect(app.get).toHaveBeenCalledWith(
      "/api/auth/wechat/config",
      expect.any(Function)
    );
  });

  describe("POST /api/auth/wechat", () => {
    it("缺少 code 时应返回 400", async () => {
      registerWechatAuthRoutes(app as any);
      const handler = app.getRoute("POST", "/api/auth/wechat");
      const { req, res } = createMockReqRes({ nickName: "测试" });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("微信 code2Session 失败时应返回 401", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { errcode: 40029, errmsg: "invalid code" },
      } as any);

      registerWechatAuthRoutes(app as any);
      const handler = app.getRoute("POST", "/api/auth/wechat");
      const { req, res } = createMockReqRes({ code: "invalid_code" });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("成功登录时应返回 sessionToken 并设置 cookie", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { openid: "test_openid_123", session_key: "session_key" },
      } as any);

      registerWechatAuthRoutes(app as any);
      const handler = app.getRoute("POST", "/api/auth/wechat");
      const { req, res } = createMockReqRes({
        code: "valid_code",
        nickName: "李白粉丝",
      });

      await handler(req, res);

      expect(res.cookie).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          sessionToken: "mock_jwt_token",
          user: expect.objectContaining({
            openId: "wx_test_openid_123",
            name: "李白粉丝",
            loginMethod: "wechat",
          }),
        })
      );
    });

    it("openId 应加 wx_ 前缀", async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { openid: "abc123" },
      } as any);

      registerWechatAuthRoutes(app as any);
      const handler = app.getRoute("POST", "/api/auth/wechat");
      const { req, res } = createMockReqRes({ code: "code", nickName: "用户" });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ openId: "wx_abc123" }),
        })
      );
    });
  });

  describe("POST /api/auth/wechat/session", () => {
    it("缺少 token 时应返回 400", async () => {
      registerWechatAuthRoutes(app as any);
      const handler = app.getRoute("POST", "/api/auth/wechat/session");
      const { req, res } = createMockReqRes({});

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("有效 token 时应设置 cookie 并返回 success", async () => {
      registerWechatAuthRoutes(app as any);
      const handler = app.getRoute("POST", "/api/auth/wechat/session");
      const { req, res } = createMockReqRes({ token: "valid_jwt_token" });

      await handler(req, res);

      expect(res.cookie).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe("GET /api/auth/wechat/config", () => {
    it("应返回 appId", async () => {
      registerWechatAuthRoutes(app as any);
      const handler = app.getRoute("GET", "/api/auth/wechat/config");
      const { req, res } = createMockReqRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ appId: "wx_test_appid" })
      );
    });
  });
});
