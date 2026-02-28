import { useState, useEffect, useCallback, useRef } from "react";
import { fbOptionTap, fbCorrect, fbWrong, fbCombo, fbLevelComplete, fbGameStart, fbStreakBroken, unlockAudio } from "@/lib/feedback";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { nanoid } from "nanoid";

// 游客答题统计存储键
const GUEST_STATS_KEY = "tianma_guest_stats";

function loadGuestStats() {
  try {
    const raw = localStorage.getItem(GUEST_STATS_KEY);
    if (raw) return JSON.parse(raw) as {
      totalAnswered: number; totalCorrect: number;
      poetCorrectMap: Record<string, number>; typePreferMap: Record<string, number>;
      avgResponseTime: number;
    };
  } catch { /* ignore */ }
  return { totalAnswered: 0, totalCorrect: 0, poetCorrectMap: {}, typePreferMap: {}, avgResponseTime: 5.0 };
}

function saveGuestStats(stats: ReturnType<typeof loadGuestStats>) {
  try { localStorage.setItem(GUEST_STATS_KEY, JSON.stringify(stats)); } catch { /* ignore */ }
}

// 将题目内容中的 __ 替换为2字符宽度的横线
function renderQuestionContent(content: string): React.ReactNode {
  const parts = content.split("__");
  if (parts.length <= 1) return content;
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span
              style={{
                display: "inline-block",
                width: "2em",
                borderBottom: "2px solid currentColor",
                verticalAlign: "bottom",
                marginBottom: "2px",
                marginLeft: "1px",
                marginRight: "1px",
              }}
            />
          )}
        </span>
      ))}
    </>
  );
}

type GamePhase = "select" | "playing" | "result";
type AnswerState = "idle" | "correct" | "wrong";

const DIFFICULTY_INFO = [
  { level: 1, name: "青铜关", emoji: "🗡️", desc: "中小学必背古诗", color: "#B87333", time: 20 },
  { level: 2, name: "白银关", emoji: "🔱", desc: "唐诗扩展篇", color: "#8A8A8A", time: 18 },
  { level: 3, name: "黄金关", emoji: "⚔️", desc: "宋词名篇", color: "#C8960C", time: 15 },
  { level: 4, name: "铂金关", emoji: "🏆", desc: "历代名篇精选", color: "#6B7280", time: 12 },
  { level: 5, name: "王者关", emoji: "👑", desc: "飞花令·终极挑战", color: "#DC2626", time: 10 },
];

const TYPE_LABELS: Record<string, string> = {
  fill: "填空题", reorder: "重组题", error: "勘误题", chain: "接龙题", judge: "判断题",
};

const AUTO_ADVANCE_DELAY = 1200;

export default function Game() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<GamePhase>("select");
  const [difficulty, setDifficulty] = useState(1);
  const [sessionId] = useState(() => nanoid());
  const [querySeed, setQuerySeed] = useState(() => nanoid());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [timeLeft, setTimeLeft] = useState(20);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [lastScoreDelta, setLastScoreDelta] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const diffInfo = DIFFICULTY_INFO[difficulty - 1];
  const maxTime = diffInfo?.time ?? 20;

  const { data: questions, isLoading: loadingQ, refetch: refetchQ } = trpc.game.getQuestions.useQuery(
    { difficulty, count: 7, seed: querySeed },
    {
      enabled: false,
      // 禁用缓存，确保每次都从服务器获取新题目
      staleTime: 0,
      gcTime: 0,
    }
  );

  const { data: gameState, refetch: refetchState } = trpc.game.getState.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const submitMutation = trpc.game.submitAnswer.useMutation();
  const hintMutation = trpc.game.useHint.useMutation();

  const currentQ = questions?.[currentIdx];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  const advanceToNext = useCallback(() => {
    setAnswerState("idle");
    setSelectedAnswer(null);
    setEliminatedOptions([]);
    setLastScoreDelta(0);
    if (currentIdx + 1 >= (questions?.length ?? 0)) {
      setPhase("result");
      // 关卡完成庆祝音效
      setTimeout(() => fbLevelComplete(), 100);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }, [currentIdx, questions?.length]);

  const handleTimeout = useCallback(() => {
    if (!currentQ) return;
    setAnswerState("wrong");
    setSelectedAnswer("__timeout__");
    setLastScoreDelta(-10);
    fbWrong();
    submitMutation.mutate({
      questionId: currentQ.id,
      answer: "__timeout__",
      responseTime: maxTime,
      sessionId,
      useShield: false,
    });
    autoAdvanceRef.current = setTimeout(advanceToNext, AUTO_ADVANCE_DELAY);
  }, [currentQ, maxTime, sessionId, submitMutation, advanceToNext]);

  useEffect(() => {
    if (phase !== "playing" || answerState !== "idle" || !currentQ) return;
    setTimeLeft(maxTime);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIdx, phase, currentQ?.id]);

  const handleSubmit = useCallback(async (answer: string) => {
    if (!currentQ || answerState !== "idle") return;
    if (timerRef.current) clearInterval(timerRef.current);
    const responseTime = (Date.now() - startTimeRef.current) / 1000;
    const isCorrect = answer === currentQ.correctAnswer;
    setAnswerState(isCorrect ? "correct" : "wrong");
    setSelectedAnswer(answer);
    // 音效 + 震动反馈（与判题同步触发）
    if (isCorrect) {
      fbCorrect();
    } else {
      fbWrong();
    }
    try {
      const result = await submitMutation.mutateAsync({
        questionId: currentQ.id,
        answer,
        responseTime,
        sessionId,
        useShield: false,
      });
      setLastScoreDelta(result.scoreDelta);
      if (result.isCorrect) {
        setSessionCorrect((c) => c + 1);
        setConsecutiveWins(result.newConsecutive);
        setSessionScore((s) => s + result.scoreDelta);
        // 连击音效（3/5/10 连击触发）
        if (result.newConsecutive >= 3) {
          setTimeout(() => fbCombo(result.newConsecutive), 250);
        }
      } else {
        // 连胜中断音效
        if (consecutiveWins >= 3) {
          setTimeout(() => fbStreakBroken(), 100);
        }
      }
      if (result.reward) {
        setTimeout(() => toast.success(result.reward!.message), 300);
      }
      if (result.rankChanged && result.newRank) {
        setTimeout(() => toast.success(`🎉 段位晋升！${result.newRank!.rankName}`, { duration: 3000 }), 500);
      }
      if (isAuthenticated) {
        refetchState();
      } else {
        // 游客模式：将答题统计保存到 localStorage
        const prevStats = loadGuestStats();
        const newTotal = prevStats.totalAnswered + 1;
        const newCorrect = prevStats.totalCorrect + (isCorrect ? 1 : 0);
        const poetId = String(currentQ.poetId ?? 0);
        const qType = currentQ.questionType ?? "fill";
        const poetMap = { ...prevStats.poetCorrectMap };
        if (isCorrect && poetId !== "0") poetMap[poetId] = (poetMap[poetId] ?? 0) + 1;
        const typeMap = { ...prevStats.typePreferMap };
        typeMap[qType] = (typeMap[qType] ?? 0) + 1;
        // 加权平均响应时间
        const newAvg = (prevStats.avgResponseTime * prevStats.totalAnswered + responseTime) / newTotal;
        saveGuestStats({
          totalAnswered: newTotal,
          totalCorrect: newCorrect,
          poetCorrectMap: poetMap,
          typePreferMap: typeMap,
          avgResponseTime: newAvg,
        });
      }
    } catch { /* silently continue */ }
    autoAdvanceRef.current = setTimeout(advanceToNext, AUTO_ADVANCE_DELAY);
  }, [currentQ, answerState, sessionId, submitMutation, refetchState, isAuthenticated, advanceToNext]);

  const handleOptionClick = (option: string) => {
    if (answerState !== "idle" || eliminatedOptions.includes(option)) return;
    fbOptionTap();
    handleSubmit(option);
  };

  const handleUseHint = async () => {
    if (!currentQ || answerState !== "idle") return;
    if (!isAuthenticated) { toast.info("登录后可使用提示卡"); return; }
    if ((gameState?.hintsCount ?? 0) <= 0) { toast.error("没有提示卡了"); return; }
    try {
      const result = await hintMutation.mutateAsync({ questionId: currentQ.id });
      setEliminatedOptions((prev) => [...prev, result.removedOption]);
      toast.info("已排除一个错误选项");
      refetchState();
    } catch { toast.error("使用失败"); }
  };

  // 监听 seed 变化，当 seed 更新时自动重新拉取题目
  const [pendingStart, setPendingStart] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    if (pendingStart) {
      setLoadFailed(false);
      refetchQ()
        .then((result) => {
          if (result.data && result.data.length > 0) {
            setPhase("playing");
          } else {
            setLoadFailed(true);
            toast.error("题目加载失败，请点击重试");
          }
          setPendingStart(false);
        })
        .catch(() => {
          setLoadFailed(true);
          toast.error("网络异常，请点击重试");
          setPendingStart(false);
        });
    }
  }, [querySeed, pendingStart, refetchQ]);

  const startGame = () => {
    unlockAudio(); // 解锁 AudioContext（需在用户交互中调用）
    fbGameStart();
    setCurrentIdx(0);
    setSessionScore(0);
    setSessionCorrect(0);
    setConsecutiveWins(0);
    setAnswerState("idle");
    setSelectedAnswer(null);
    setEliminatedOptions([]);
    setLastScoreDelta(0);
    // 生成新 seed 会触发 useEffect 中的 refetch，确保缓存已破坏
    setQuerySeed(nanoid());
    setPendingStart(true);
  };

  // ─── Phase: Select Difficulty ─────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div className="min-h-screen page-content px-4 pt-safe bg-background">
        <div className="flex items-center gap-3 py-4 mb-2 border-b border-border">
          <button onClick={() => navigate("/")} className="text-muted-foreground text-xl leading-none">‹</button>
          <h1 className="font-semibold text-base font-display text-foreground">选择关卡</h1>
          {!isAuthenticated && (
            <span className="ml-auto text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
              游客模式
            </span>
          )}
        </div>

        {isAuthenticated && gameState && (
          <div className="rounded-xl p-3 mb-4 flex items-center justify-between bg-card border border-border">
            <div className="flex items-center gap-2">
              <span className="text-lg">{gameState.rank?.iconEmoji ?? "🗡️"}</span>
              <div>
                <div className="text-xs text-muted-foreground">当前段位</div>
                <div className="text-sm font-semibold text-foreground">{gameState.rank?.rankName ?? "青铜剑·Ⅲ"}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">总积分</div>
              <div className="text-sm font-semibold" style={{ color: "var(--gold)" }}>{gameState.totalScore}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">提示卡</div>
              <div className="text-sm font-semibold" style={{ color: "var(--vermilion)" }}>×{gameState.hintsCount}</div>
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="rounded-xl p-3 mb-4 flex items-center gap-2 bg-card border border-border">
            <span className="text-lg">💡</span>
            <p className="text-xs text-muted-foreground flex-1">游客模式可直接答题，登录后积分和段位将被保存</p>
          </div>
        )}

        <div className="space-y-2.5 mb-6">
          {DIFFICULTY_INFO.map((d) => {
            const isSelected = difficulty === d.level;
            return (
              <button
                key={d.level}
                onClick={() => setDifficulty(d.level)}
                className="w-full rounded-2xl text-left transition-all duration-150 active:scale-[0.98] overflow-hidden"
                style={{
                  border: `1.5px solid ${isSelected ? d.color + "70" : "var(--border)"}`,
                  background: isSelected
                    ? `linear-gradient(135deg, ${d.color}10, var(--card))`
                    : "var(--card)",
                  boxShadow: isSelected
                    ? `0 2px 12px ${d.color}18`
                    : "0 1px 4px oklch(0.14 0.025 55 / 0.04)",
                }}
              >
                {/* 选中时的左边色条 */}
                <div className="flex items-stretch">
                  <div className="w-1 flex-shrink-0 rounded-l-2xl"
                    style={{ background: isSelected ? d.color : "transparent" }} />
                  <div className="flex items-center gap-3 p-4 flex-1">
                    {/* 图标圆形背景 */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                      style={{
                        background: isSelected ? d.color + "18" : "var(--secondary)",
                        border: `1px solid ${isSelected ? d.color + "40" : "var(--border)"}`,
                      }}>
                      {d.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-sm mb-0.5"
                        style={{ color: isSelected ? d.color : "var(--ink)", letterSpacing: "0.04em" }}>
                        {d.name}
                      </div>
                      <div className="text-xs font-serif-poem" style={{ color: "var(--ink-pale)" }}>{d.desc}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: isSelected ? d.color + "15" : "var(--secondary)",
                          color: isSelected ? d.color : "var(--ink-pale)",
                          fontSize: "11px",
                        }}>
                        {d.time}s
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: d.color }}>
                          <span style={{ color: "white", fontSize: "11px" }}>✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {loadFailed ? (
          <div className="space-y-2">
            <p className="text-center text-sm text-muted-foreground">题目加载失败，请检查网络后重试</p>
            <button
              onClick={startGame}
              className="w-full py-3.5 rounded-2xl font-bold text-base transition-all active:scale-[0.98] text-white"
              style={{ background: "var(--vermilion)", letterSpacing: "0.06em" }}
            >
              🔄 重试
            </button>
          </div>
        ) : (
          <button
            onClick={startGame}
            disabled={loadingQ || pendingStart}
            className="w-full py-3.5 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 text-white"
            style={{
              background: "var(--vermilion)",
              boxShadow: "0 4px 14px oklch(0.55 0.20 25 / 0.28)",
              letterSpacing: "0.06em",
            }}
          >
            {(loadingQ || pendingStart) ? "加载中..." : `开始 ${diffInfo?.name}`}
          </button>
        )}
      </div>
    );
  }

  // ─── Phase: Playing ───────────────────────────────────────────────────────
  if (phase === "playing") {
    const progress = (currentIdx / (questions?.length ?? 7)) * 100;
    const timeProgress = (timeLeft / maxTime) * 100;
    const isWarning = timeLeft <= 5;

    return (
      <div className="min-h-screen flex flex-col px-4 pt-safe bg-background">
        {/* Top bar */}
        <div className="py-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
              setPhase("select");
              setCurrentIdx(0);
            }} className="text-muted-foreground text-lg leading-none">✕</button>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">{currentIdx + 1}/{questions?.length ?? 7}</span>
              <span className="font-semibold" style={{ color: "var(--gold)" }}>+{sessionScore}分</span>
              {consecutiveWins >= 2 && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "oklch(0.55 0.20 25 / 0.10)", color: "var(--vermilion)" }}>
                  🔥{consecutiveWins}连胜
                </span>
              )}
            </div>
            {isAuthenticated ? (
              <button
                onClick={handleUseHint}
                disabled={answerState !== "idle" || (gameState?.hintsCount ?? 0) <= 0}
                className="text-sm px-2 py-1 rounded-lg transition-all disabled:opacity-40"
                style={{ background: "var(--vermilion-pale)", color: "var(--vermilion)" }}
              >
                💡×{gameState?.hintsCount ?? 0}
              </button>
            ) : (
              <div className="text-xs text-muted-foreground">游客</div>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full overflow-hidden mb-1.5 bg-muted">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--vermilion), var(--gold))" }} />
          </div>

          {/* Timer bar */}
          <div className="h-1 rounded-full overflow-hidden bg-muted">
            <div className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${timeProgress}%`,
                background: isWarning
                  ? "linear-gradient(90deg, #DC2626, #EF4444)"
                  : "linear-gradient(90deg, var(--celadon), var(--vermilion))",
              }} />
          </div>
          <div className="text-right text-xs mt-0.5"
            style={{ color: isWarning ? "#DC2626" : "var(--ink-pale)" }}>
            {timeLeft}s
          </div>
        </div>

        {/* Question */}
        {currentQ ? (
          <div className="flex-1 flex flex-col">
            {/* 题目卡片 - 宋体大字风格 */}
            <div className="rounded-2xl mb-4 overflow-hidden"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 2px 12px oklch(0.14 0.025 55 / 0.06)",
              }}>
              {/* 题目头部 */}
              <div className="flex items-center gap-2 px-4 pt-4 pb-3"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="tag-seal"
                  style={{ background: "var(--vermilion-pale)", color: "var(--vermilion)" }}>
                  {TYPE_LABELS[currentQ.questionType] ?? "题目"}
                </span>
                {currentQ.sourcePoemTitle && (
                  <span className="text-xs font-serif-poem" style={{ color: "var(--ink-pale)" }}>
                    《{currentQ.sourcePoemTitle}》
                  </span>
                )}
              </div>
              {/* 题目内容 - 宋体大字，题干比选项大一号 */}
              <div className="px-5 py-5">
                <p className="font-serif-poem text-foreground"
                  style={{ fontSize: "24px", lineHeight: "2.0", fontWeight: 500, letterSpacing: "0.08em" }}>
                  {renderQuestionContent(currentQ.content)}
                </p>
              </div>
            </div>

            {/* 选项 - 无ABCD，单字一行四个，多字两行 */}
            {(() => {
              const options = currentQ.options as string[];
              // 判断是否为单字选项（所有选项都是1个字）
              const isSingleChar = options.every(o => o.length === 1);
              // 判断是否为短选项（≤3字，排一行两个）
              const isShortOpt = options.every(o => o.length <= 4);

              return (
                <div
                  className="mb-4"
                  style={{
                    display: "grid",
                    gridTemplateColumns: isSingleChar
                      ? "repeat(4, 1fr)"
                      : isShortOpt
                      ? "repeat(2, 1fr)"
                      : "repeat(1, 1fr)",
                    gap: isSingleChar ? "10px" : "10px",
                  }}
                >
                  {options.map((opt, i) => {
                    const isEliminated = eliminatedOptions.includes(opt);
                    const isSelected = selectedAnswer === opt;
                    const isCorrectOpt = opt === currentQ.correctAnswer;

                    let containerStyle: React.CSSProperties = {
                      background: "var(--card)",
                      border: "1.5px solid var(--border)",
                      color: "var(--ink)",
                    };

                    if (isEliminated) {
                      containerStyle = { ...containerStyle, opacity: 0.3, textDecoration: "line-through" };
                    } else if (answerState !== "idle") {
                      if (isCorrectOpt) {
                        containerStyle = { background: "#F0FDF4", border: "1.5px solid #16A34A", color: "#15803D" };
                      } else if (isSelected && !isCorrectOpt) {
                        containerStyle = { background: "#FEF2F2", border: "1.5px solid #DC2626", color: "#B91C1C" };
                      }
                    } else if (isSelected) {
                      containerStyle = {
                        background: "var(--vermilion-pale)",
                        border: "1.5px solid var(--vermilion)",
                        color: "var(--vermilion)",
                      };
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleOptionClick(opt)}
                        disabled={answerState !== "idle" || isEliminated}
                        className="rounded-2xl transition-all duration-150 active:scale-[0.97] relative"
                        style={{
                          ...containerStyle,
                          minHeight: isSingleChar ? "64px" : "52px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: isSingleChar ? "8px 4px" : "10px 16px",
                          boxShadow: "0 1px 4px oklch(0.14 0.025 55 / 0.05)",
                          fontFamily: "Huiwen-MinchoGBK, Noto Serif SC, STSong, serif",
                          fontSize: "20px",
                          fontWeight: 500,
                          letterSpacing: "0.06em",
                          lineHeight: "1.5",
                          textAlign: "center",
                        }}
                      >
                        <span>{opt}</span>
                        {answerState !== "idle" && isCorrectOpt && (
                          <span style={{ color: "#16A34A", fontSize: "14px", position: "absolute", top: "4px", right: "8px" }}>✓</span>
                        )}
                        {answerState !== "idle" && isSelected && !isCorrectOpt && (
                          <span style={{ color: "#DC2626", fontSize: "14px", position: "absolute", top: "4px", right: "8px" }}>✗</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()}


            {/* 得分反馈 - 更优雅的布局 */}
            {answerState !== "idle" && (
              <div className="rounded-2xl p-4 mb-4 animate-slide-up"
                style={{
                  background: answerState === "correct"
                    ? "linear-gradient(135deg, #F0FDF4, #DCFCE7)"
                    : "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
                  border: `1.5px solid ${answerState === "correct" ? "#16A34A40" : "#DC262640"}`,
                }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: "22px" }}>{answerState === "correct" ? "✅" : "❌"}</span>
                    <span className="font-bold font-display"
                      style={{ color: answerState === "correct" ? "#15803D" : "#B91C1C", fontSize: "17px" }}>
                      {answerState === "correct"
                        ? `+${lastScoreDelta}分`
                        : lastScoreDelta < 0 ? `${lastScoreDelta}分` : "答错了"}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: answerState === "correct" ? "#16A34A80" : "#DC262680" }}>
                    {currentIdx + 1 >= (questions?.length ?? 7) ? "即将查看结果" : "即将下一题"}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2 float-anim">📜</div>
              <p className="text-muted-foreground text-sm">加载题目中...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Phase: Result ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-safe bg-background">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3 float-anim">
            {sessionCorrect >= 6 ? "🏆" : sessionCorrect >= 4 ? "⭐" : "📜"}
          </div>
          <h2 className="text-xl font-bold font-display mb-1 text-foreground">
            {sessionCorrect >= 6 ? "出色！" : sessionCorrect >= 4 ? "不错！" : "继续加油！"}
          </h2>
          <p className="text-muted-foreground text-sm">本轮答题结束</p>
        </div>

        <div className="rounded-2xl p-5 mb-5 bg-card border border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--gold)" }}>{sessionScore}</div>
              <div className="text-xs text-muted-foreground mt-0.5">本轮得分</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--celadon)" }}>
                {sessionCorrect}/{questions?.length ?? 7}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">答对题数</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--vermilion)" }}>
                {Math.round((sessionCorrect / (questions?.length ?? 7)) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">正确率</div>
            </div>
          </div>
        </div>

        {isAuthenticated && gameState && (
          <div className="rounded-xl p-3 mb-5 flex items-center gap-3 bg-card border border-border">
            <span className="text-2xl">{gameState.rank?.iconEmoji ?? "🗡️"}</span>
            <div>
              <div className="text-xs text-muted-foreground">当前段位</div>
              <div className="font-semibold text-sm text-foreground">{gameState.rank?.rankName ?? "青铜剑·Ⅲ"}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs text-muted-foreground">总积分</div>
              <div className="font-semibold text-sm" style={{ color: "var(--gold)" }}>{gameState.totalScore}</div>
            </div>
          </div>
        )}



        <div className="space-y-3">
          <button
            onClick={() => { setPhase("select"); setCurrentIdx(0); setSessionScore(0); setSessionCorrect(0); }}
            className="w-full py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] text-white"
            style={{ background: "var(--vermilion)", fontSize: "16px" }}
          >
            ⚔️ 再来一局
          </button>
          <button
            onClick={() => navigate("/destiny")}
            className="w-full py-3.5 rounded-xl font-semibold transition-all active:scale-[0.98] bg-card border border-border text-foreground"
            style={{ fontSize: "16px" }}
          >
            ✨ 查看本命诗人
          </button>
          <button
            onClick={() => {
              const shareText = `我在「天马行空·你的本命诗人是谁」答题得了${sessionScore}分！正确率${Math.round((sessionCorrect / (questions?.length ?? 7)) * 100)}%，快来挑战我吧！📜
https://tianmapoet-4lhgiefm.manus.space`;
              if (navigator.share) {
                navigator.share({ title: "天马行空·本命诗人", text: shareText, url: "https://tianmapoet-4lhgiefm.manus.space" });
              } else {
                navigator.clipboard.writeText(shareText).then(() => toast.success("分享文案已复制，可粘贴到微信发送给好友！"));
              }
            }}
            className="w-full py-3.5 rounded-xl font-semibold transition-all active:scale-[0.98] border"
            style={{ fontSize: "16px", background: "#07C160", color: "white", borderColor: "#07C160" }}
          >
            📱 分享到微信
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl text-muted-foreground"
            style={{ fontSize: "15px" }}
          >
            返回主页
          </button>
        </div>
      </div>
    </div>
  );
}
