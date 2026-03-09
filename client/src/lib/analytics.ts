/**
 * 前端事件追踪库
 * 用于记录用户行为、性能指标、错误等
 */

// 从环境变量读取分析端点
const VITE_ANALYTICS_ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT || "";
const VITE_ANALYTICS_WEBSITE_ID = import.meta.env.VITE_ANALYTICS_WEBSITE_ID || "";

export interface EventPayload {
  eventType: string;
  eventData?: Record<string, any>;
  metadata?: Record<string, any>;
}

class Analytics {
  private sessionKey: string;
  private endpoint: string;
  private websiteId: string;
  private queue: EventPayload[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionKey = this.getOrCreateSessionKey();
    this.endpoint = VITE_ANALYTICS_ENDPOINT || "";
    this.websiteId = VITE_ANALYTICS_WEBSITE_ID || "";
  }

  /**
   * 获取或创建会话ID
   */
  private getOrCreateSessionKey(): string {
    let sessionKey = sessionStorage.getItem("__analytics_session_key");
    if (!sessionKey) {
      sessionKey = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("__analytics_session_key", sessionKey);
    }
    return sessionKey;
  }

  /**
   * 记录事件
   */
  public async trackEvent(
    eventType: string,
    eventData?: Record<string, any>,
    metadata?: Record<string, any>
  ) {
    const payload: EventPayload = {
      eventType,
      eventData,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
      },
    };

    this.queue.push(payload);

    // 批量发送（防止频繁请求）
    this.scheduleFlush();
  }

  /**
   * 记录页面浏览
   */
  public trackPageView(pageName: string) {
    this.trackEvent("page_view", {
      pageName,
      referrer: document.referrer,
    });
  }

  /**
   * 记录按钮点击
   */
  public trackButtonClick(buttonName: string, buttonId?: string) {
    this.trackEvent("button_click", {
      buttonName,
      buttonId,
    });
  }

  /**
   * 记录游戏开始
   */
  public trackGameStart(difficulty: number, gameMode?: string) {
    this.trackEvent("game_start", {
      difficulty,
      gameMode,
    });
  }

  /**
   * 记录游戏完成
   */
  public trackGameComplete(
    difficulty: number,
    score: number,
    correctCount: number,
    totalQuestions: number
  ) {
    this.trackEvent("game_complete", {
      difficulty,
      score,
      correctCount,
      totalQuestions,
      accuracy: totalQuestions > 0 ? correctCount / totalQuestions : 0,
    });
  }

  /**
   * 记录答题
   */
  public trackQuestionAnswer(
    questionId: number,
    isCorrect: boolean,
    responseTime: number
  ) {
    this.trackEvent("question_answer", {
      questionId,
      isCorrect,
      responseTime,
    });
  }

  /**
   * 记录段位晋升
   */
  public trackRankUp(newRank: string, score: number) {
    this.trackEvent("rank_up", {
      newRank,
      score,
    });
  }

  /**
   * 记录卡牌掉落
   */
  public trackCardDrop(cardId: number, cardName: string, rarity: string) {
    this.trackEvent("card_drop", {
      cardId,
      cardName,
      rarity,
    });
  }

  /**
   * 记录分享
   */
  public trackShare(shareType: string, shareContent?: string) {
    this.trackEvent("share", {
      shareType,
      shareContent,
    });
  }

  /**
   * 记录本命诗人解锁
   */
  public trackDestinyUnlock(poetId: number, poetName: string, matchScore: number) {
    this.trackEvent("destiny_unlock", {
      poetId,
      poetName,
      matchScore,
    });
  }

  /**
   * 记录错误
   */
  public trackError(errorMessage: string, errorStack?: string, context?: string) {
    this.trackEvent("error", {
      errorMessage,
      errorStack,
      context,
    });
  }

  /**
   * 记录Web Vitals
   */
  public trackWebVital(metricName: string, value: number) {
    this.trackEvent("web_vital", {
      metricName,
      value,
    });
  }

  /**
   * 批量发送事件
   */
  private async flush() {
    if (this.queue.length === 0) return;

    const events = this.queue.splice(0, this.queue.length);

    try {
      // 如果有自定义端点，发送到自定义端点
      if (this.endpoint) {
        await fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionKey: this.sessionKey,
            websiteId: this.websiteId,
            events,
          }),
        });
      }
    } catch (error) {
      console.error("[Analytics] Failed to flush events:", error);
      // 重新加入队列，稍后重试
      this.queue.unshift(...events);
    }
  }

  /**
   * 调度批量发送
   */
  private scheduleFlush() {
    if (this.flushTimer) clearTimeout(this.flushTimer);

    // 如果队列达到100个事件，立即发送
    if (this.queue.length >= 100) {
      this.flush();
      return;
    }

    // 否则，5秒后发送
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, 5000);
  }

  /**
   * 立即发送所有事件（在页面卸载时调用）
   */
  public async flushSync() {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    await this.flush();
  }
}

// 全局单例
export const analytics = new Analytics();

// 页面卸载时发送所有事件
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    analytics.flushSync();
  });
}

/**
 * 初始化Web Vitals监控
 */
export function initWebVitals() {
  // LCP (Largest Contentful Paint)
  if ("PerformanceObserver" in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        analytics.trackWebVital("LCP", lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (e) {
      console.error("[Analytics] Failed to observe LCP:", e);
    }

    // FID (First Input Delay)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          analytics.trackWebVital("FID", entry.processingDuration);
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });
    } catch (e) {
      console.error("[Analytics] Failed to observe FID:", e);
    }

    // CLS (Cumulative Layout Shift)
    try {
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let clsValue = 0;
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        if (clsValue > 0) {
          analytics.trackWebVital("CLS", clsValue);
        }
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (e) {
      console.error("[Analytics] Failed to observe CLS:", e);
    }
  }

  // TTFB (Time to First Byte)
  if ("performance" in window && "getEntriesByType" in window.performance) {
    const navigationTiming = window.performance.getEntriesByType("navigation")[0] as any;
    if (navigationTiming) {
      const ttfb = navigationTiming.responseStart - navigationTiming.requestStart;
      analytics.trackWebVital("TTFB", ttfb);
    }
  }
}
