import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

// 微信 token 存储 key
const WECHAT_TOKEN_KEY = "wechat_session_token";

/**
 * 从 URL 参数读取微信 token 并存入 localStorage
 * 在应用启动时调用，确保 token 被持久化
 */
function initWechatToken(): void {
  if (typeof window === "undefined") return;
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get("wechat_token");
  if (tokenFromUrl) {
    localStorage.setItem(WECHAT_TOKEN_KEY, tokenFromUrl);
    // 清除 URL 中的 token 参数（避免刷新时重复处理）
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("wechat_token");
    window.history.replaceState({}, "", newUrl.toString());
    console.log("[WechatBridge] Token saved from URL params");
  }
}

/**
 * 获取当前存储的微信 token
 */
export function getWechatToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WECHAT_TOKEN_KEY);
}

/**
 * 清除微信 token（登出时调用）
 */
export function clearWechatToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WECHAT_TOKEN_KEY);
}

// 应用启动时立即读取 URL 中的 token
initWechatToken();

// 优化缓存策略：减少不必要的重新获取
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 缓存时间：5分钟（默认0）
      staleTime: 5 * 60 * 1000,
      // 垃圾回收时间：10分钟（默认5分钟）
      gcTime: 10 * 60 * 1000,
      // 禁用自动重新获取（用户离开后）
      refetchOnWindowFocus: false,
      // 禁用挂载时自动重新获取
      refetchOnMount: false,
      // 禁用连接恢复时自动重新获取
      refetchOnReconnect: false,
      // 重试次数：2次
      retry: 2,
      // 重试延迟：指数退避策略
      retryDelay: attemptIndex => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
    },
    mutations: {
      // 重试次数：1次
      retry: 1,
      // 重试延迟
      retryDelay: attemptIndex => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;
  if (!isUnauthorized) return;

  // 如果有微信 token，说明是小程序环境，不跳转 OAuth 登录页
  if (getWechatToken()) {
    console.warn("[Auth] Unauthorized with wechat token, token may be invalid");
    return;
  }

  // 如果 UA 包含微信特征，也不跳转
  const ua = navigator.userAgent.toLowerCase();
  const isWechat = ua.includes("micromessenger");
  if (isWechat) {
    console.warn("[Auth] Unauthorized in WeChat browser, skip OAuth redirect");
    return;
  }

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_BASE_URL}/api/trpc`,
      transformer: superjson,
      headers() {
        // 如果有微信 token，附加 Authorization 头（解决跨域 cookie 问题）
        const wechatToken = getWechatToken();
        if (wechatToken) {
          return { Authorization: `Bearer ${wechatToken}` };
        }
        return {};
      },
      fetch(input, init) {
        // 有微信 token 时使用 omit（跨域不发 cookie，用 Bearer token 认证）
        // 没有 token 时使用 include（Manus OAuth cookie 认证）
        const credentialsMode = getWechatToken() ? "omit" : "include";
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: credentialsMode,
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
