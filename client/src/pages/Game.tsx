import { useState, useEffect, useRef, useCallback } from "react";
import { fbOptionTap, fbCorrect, fbWrong, fbCombo, fbLevelComplete, fbGameStart, fbStreakBroken, unlockAudio } from "@/lib/feedback";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import {
  loadLocalState,
  processLocalAnswer,
  consumeLocalHint,
  getRankByScore,
} from "@/lib/localGameState";
import { getTodayCalendarInfo } from "@/lib/calendarData";

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
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<GamePhase>("select");
  const [difficulty, setDifficulty] = useState(1);
  const [sessionId] = useState(() => nanoid());
  const [querySeed, setQuerySeed] = useState(() => nanoid());
  // 从 URL 读取主题标签（节日/节气/诗人专题）
  const [themeTag, setThemeTag] = useState<string | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("theme") ?? undefined;
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [timeLeft, setTimeLeft] = useState(20);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [lastScoreDelta, setLastScoreDelta] = useState<number>(0);
  const [localHints, setLocalHints] = useState(0);
  const [localTotalScore, setLocalTotalScore] = useState(0);
  const [localRankName, setLocalRankName] = useState("青铜剑·Ⅲ");
  const [localRankEmoji, setLocalRankEmoji] = useState("🗡️");
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const diffInfo = DIFFICULTY_INFO[difficulty - 1];
  const maxTime = diffInfo?.time ?? 20;

  // 加载本地状态
  useEffect(() => {
    const state = loadLocalState();
    setLocalHints(state.hintsCount);
    setLocalTotalScore(state.totalScore);
    const rank = getRankByScore(state.totalScore);
    setLocalRankName(rank.rankName);
    setLocalRankEmoji(rank.iconEmoji);
  }, []);

  const { data: questions, isLoading: loadingQ, refetch: refetchQ } = trpc.game.getQuestions.useQuery(
    { difficulty, count: 7, seed: querySeed, themeTag },
    {
      enabled: false,
      staleTime: 0,
      gcTime: 0,
    }
  );

  const submitMutation = trpc.game.submitAnswer.useMutation();

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
    // 本地处理超时
    const result = processLocalAnswer(false, currentQ.poetId ?? 0, currentQ.questionType ?? "fill", maxTime);
    setLocalTotalScore(result.newState.totalScore);
    const rank = getRankByScore(result.newState.totalScore);
    setLocalRankName(rank.rankName);
    setLocalRankEmoji(rank.iconEmoji);
    // 同时提交到服务器（游客模式，不影响本地）
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

    if (isCorrect) {
      fbCorrect();
    } else {
      fbWrong();
    }

    // 本地处理答题结果（主要逻辑）
    const localResult = processLocalAnswer(
      isCorrect,
      currentQ.poetId ?? 0,
      currentQ.questionType ?? "fill",
      responseTime,
    );
    setLocalTotalScore(localResult.newState.totalScore);
    setLocalHints(localResult.newState.hintsCount);
    const rank = getRankByScore(localResult.newState.totalScore);
    setLocalRankName(rank.rankName);
    setLocalRankEmoji(rank.iconEmoji);

    const scoreDelta = localResult.scoreDelta;
    setLastScoreDelta(scoreDelta);

    if (isCorrect) {
      setSessionCorrect((c) => c + 1);
      const newConsec = localResult.newState.consecutiveWins;
      setConsecutiveWins(newConsec);
      setSessionScore((s) => s + scoreDelta);
      if (newConsec >= 3) {
        setTimeout(() => fbCombo(newConsec), 250);
      }
    } else {
      if (consecutiveWins >= 3) {
        setTimeout(() => fbStreakBroken(), 100);
      }
      setConsecutiveWins(0);
    }

    if (localResult.reward) {
      setTimeout(() => toast.success(localResult.reward!.message), 300);
    }
    if (localResult.rankChanged) {
      setTimeout(() => toast.success(`🎉 段位晋升！${localResult.newRank.rankName}`, { duration: 3000 }), 500);
    }
    if (localResult.shouldUnlockDestiny) {
      setTimeout(() => toast.info("✨ 已答满100题！前往「本命觉醒」解锁你的本命诗人", { duration: 5000 }), 1000);
    }

    // 同时提交到服务器（游客模式，服务器会返回结果但我们主要用本地的）
    try {
      await submitMutation.mutateAsync({
        questionId: currentQ.id,
        answer,
        responseTime,
        sessionId,
        useShield: false,
      });
    } catch { /* 游客模式下服务器错误不影响本地游戏 */ }

    autoAdvanceRef.current = setTimeout(advanceToNext, AUTO_ADVANCE_DELAY);
  }, [currentQ, answerState, sessionId, submitMutation, advanceToNext, consecutiveWins]);

  const handleOptionClick = (option: string) => {
    if (answerState !== "idle" || eliminatedOptions.includes(option)) return;
    fbOptionTap();
    handleSubmit(option);
  };

  const handleUseHint = () => {
    if (!currentQ || answerState !== "idle") return;
    if (localHints <= 0) { toast.error("没有提示卡了"); return; }
    const used = consumeLocalHint();
    if (!used) { toast.error("没有提示卡了"); return; }
    setLocalHints((h) => h - 1);
    // 排除一个错误选项
    const options = currentQ.options as string[];
    const wrong = options.filter((o) => o !== currentQ.correctAnswer && !eliminatedOptions.includes(o));
    if (wrong.length > 0) {
      const toRemove = wrong[Math.floor(Math.random() * wrong.length)]!;
      setEliminatedOptions((prev) => [...prev, toRemove]);
      toast.info("已排除一个错误选项");
    }
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
    unlockAudio();
    fbGameStart();
    setCurrentIdx(0);
    setSessionScore(0);
    setSessionCorrect(0);
    setConsecutiveWins(0);
    setAnswerState("idle");
    setSelectedAnswer(null);
    setEliminatedOptions([]);
    setLastScoreDelta(0);
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
        </div>

        {/* 本地积分/段位显示 */}
        <div className="rounded-xl p-3 mb-4 flex items-center justify-between bg-card border border-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">{localRankEmoji}</span>
            <div>
              <div className="text-xs text-muted-foreground">当前段位</div>
              <div className="text-sm font-semibold text-foreground">{localRankName}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">总积分</div>
            <div className="text-sm font-semibold" style={{ color: "var(--gold)" }}>{localTotalScore}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">提示卡</div>
            <div className="text-sm font-semibold" style={{ color: "var(--vermilion)" }}>×{localHints}</div>
          </div>
        </div>

        {/* 节日/节气主题专题提示 */}
        {themeTag && (
          <div
            className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3 border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <span className="text-xl">🎯</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">「{themeTag}」主题专题</div>
              <div className="text-xs text-muted-foreground mt-0.5">将优先推送与该主题相关的诗词题目</div>
            </div>
            <button
              onClick={() => setThemeTag(undefined)}
              className="text-xs text-muted-foreground px-2 py-1 rounded-lg border border-border"
            >
              取消
            </button>
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
                <div className="flex items-stretch">
                  <div className="w-1 flex-shrink-0 rounded-l-2xl"
                    style={{ background: isSelected ? d.color : "transparent" }} />
                  <div className="flex items-center gap-3 p-4 flex-1">
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
            {/* 提示卡按钮 */}
            <button
              onClick={handleUseHint}
              disabled={answerState !== "idle" || localHints <= 0}
              className="text-sm px-2 py-1 rounded-lg transition-all disabled:opacity-40"
              style={{ background: "var(--vermilion-pale)", color: "var(--vermilion)" }}
            >
              💡×{localHints}
            </button>
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
            {/* 题目卡片 */}
            <div className="rounded-2xl mb-4 overflow-hidden"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 2px 12px oklch(0.14 0.025 55 / 0.06)",
              }}>
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
              <div className="px-5 py-5">
                <p className="font-serif-poem text-foreground"
                  style={{ fontSize: "24px", lineHeight: "2.0", fontWeight: 500, letterSpacing: "0.08em" }}>
                  {renderQuestionContent(currentQ.content)}
                </p>
              </div>
            </div>

            {/* 选项 */}
            {(() => {
              const options = currentQ.options as string[];
              const isSingleChar = options.every(o => o.length === 1);
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
                    gap: "10px",
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

            {/* 得分反馈 */}
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

        {/* 本地段位显示 */}
        <div className="rounded-xl p-3 mb-5 flex items-center gap-3 bg-card border border-border">
          <span className="text-2xl">{localRankEmoji}</span>
          <div>
            <div className="text-xs text-muted-foreground">当前段位</div>
            <div className="font-semibold text-sm text-foreground">{localRankName}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-muted-foreground">总积分</div>
            <div className="font-semibold text-sm" style={{ color: "var(--gold)" }}>{localTotalScore}</div>
          </div>
        </div>

        {/* 节日彩蛋 */}
        {(() => {
          const todayInfo = getTodayCalendarInfo();
          if (!todayInfo.hasEvent || !todayInfo.event) return null;
          const ev = todayInfo.event;
          return (
            <div
              className="rounded-2xl p-4 mb-5 text-center"
              style={{
                background: ev.bgGradient || "linear-gradient(135deg, var(--vermilion-pale), oklch(0.97 0.02 55))",
                border: `1px solid ${ev.color}30`,
              }}
            >
              <div className="text-3xl mb-2">{ev.emoji}</div>
              <div className="font-display text-base font-bold mb-1" style={{ color: ev.color }}>
                {ev.name}快乐！
              </div>
              <div className="font-serif-poem text-sm leading-relaxed mb-1" style={{ color: ev.color + "cc" }}>
                {ev.poem}
              </div>
              <div className="text-xs text-muted-foreground">—— {ev.poemAuthor}</div>
            </div>
          );
        })()}

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
              const shareText = `我在「天马行空·你的本命诗人是谁」答题得了${sessionScore}分！正确率${Math.round((sessionCorrect / (questions?.length ?? 7)) * 100)}%，快来挑战我吧！📜\nhttps://www.tianmapoet.click`;
              if (navigator.share) {
                navigator.share({ title: "天马行空·本命诗人", text: shareText, url: "https://www.tianmapoet.click" });
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
