import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { nanoid } from "nanoid";

type GamePhase = "select" | "playing" | "result";
type AnswerState = "idle" | "correct" | "wrong";

const DIFFICULTY_INFO = [
  { level: 1, name: "青铜关", emoji: "🗡️", desc: "中小学必背古诗", color: "#CD7F32", time: 20 },
  { level: 2, name: "白银关", emoji: "🔱", desc: "唐诗扩展篇", color: "#C0C0C0", time: 18 },
  { level: 3, name: "黄金关", emoji: "⚔️", desc: "宋词名篇", color: "#FFD700", time: 15 },
  { level: 4, name: "铂金关", emoji: "🏆", desc: "历代名篇精选", color: "#E5E4E2", time: 12 },
  { level: 5, name: "王者关", emoji: "👑", desc: "飞花令·终极挑战", color: "#FF6B35", time: 10 },
];

const TYPE_LABELS: Record<string, string> = {
  fill: "填空题", reorder: "重组题", error: "勘误题", chain: "接龙题", judge: "判断题",
};

export default function Game() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<GamePhase>("select");
  const [difficulty, setDifficulty] = useState(1);
  const [sessionId] = useState(() => nanoid());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [timeLeft, setTimeLeft] = useState(20);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; scoreDelta: number; explanation?: string | null } | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const diffInfo = DIFFICULTY_INFO[difficulty - 1];
  const maxTime = diffInfo?.time ?? 20;

  const { data: questions, isLoading: loadingQ, refetch: refetchQ } = trpc.game.getQuestions.useQuery(
    { difficulty, count: 7 },
    { enabled: false }
  );

  const { data: gameState, refetch: refetchState } = trpc.game.getState.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const submitMutation = trpc.game.submitAnswer.useMutation();
  const hintMutation = trpc.game.useHint.useMutation();

  const currentQ = questions?.[currentIdx];

  // Timer
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

  const handleTimeout = useCallback(() => {
    if (!currentQ) return;
    setAnswerState("wrong");
    setSelectedAnswer("__timeout__");
    handleSubmit("__timeout__", true);
  }, [currentQ]);

  const handleSubmit = useCallback(async (answer: string, isTimeout = false) => {
    if (!currentQ || answerState !== "idle") return;
    if (timerRef.current) clearInterval(timerRef.current);

    const responseTime = (Date.now() - startTimeRef.current) / 1000;
    const isCorrect = answer === currentQ.correctAnswer;

    setAnswerState(isCorrect ? "correct" : "wrong");
    setShowExplanation(true);

    try {
      const result = await submitMutation.mutateAsync({
        questionId: currentQ.id,
        answer,
        responseTime,
        sessionId,
        useShield: false,
      });

      setLastResult({
        isCorrect: result.isCorrect,
        scoreDelta: result.scoreDelta,
        explanation: result.explanation,
      });

      if (result.isCorrect) {
        setSessionCorrect((c) => c + 1);
        setConsecutiveWins(result.newConsecutive);
        toast.success(`+${result.scoreDelta}分`, { duration: 1500 });
      } else if (!isTimeout) {
        toast.error(`-${Math.abs(result.scoreDelta)}分`, { duration: 1500 });
      }

      if (result.reward) {
        setTimeout(() => toast.success(result.reward!.message), 500);
      }
      if (result.rankChanged && result.newRank) {
        setTimeout(() => toast.success(`🎉 段位晋升！${result.newRank!.rankName}`, { duration: 3000 }), 800);
      }
      if (result.scoreDelta > 0) setSessionScore((s) => s + result.scoreDelta);

      refetchState();
    } catch {
      toast.error("提交失败，请重试");
    }
  }, [currentQ, answerState, sessionId, submitMutation, refetchState]);

  const handleOptionClick = (option: string) => {
    if (answerState !== "idle" || eliminatedOptions.includes(option)) return;
    setSelectedAnswer(option);
    handleSubmit(option);
  };

  const handleNext = () => {
    setAnswerState("idle");
    setSelectedAnswer(null);
    setEliminatedOptions([]);
    setShowExplanation(false);
    setLastResult(null);

    if (currentIdx + 1 >= (questions?.length ?? 0)) {
      setPhase("result");
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  const handleUseHint = async () => {
    if (!currentQ || answerState !== "idle") return;
    if ((gameState?.hintsCount ?? 0) <= 0) {
      toast.error("没有提示卡了");
      return;
    }
    try {
      const result = await hintMutation.mutateAsync({ questionId: currentQ.id });
      setEliminatedOptions((prev) => [...prev, result.removedOption]);
      toast.info("已排除一个错误选项");
      refetchState();
    } catch {
      toast.error("使用失败");
    }
  };

  const startGame = async () => {
    setCurrentIdx(0);
    setSessionScore(0);
    setSessionCorrect(0);
    setConsecutiveWins(0);
    setAnswerState("idle");
    setSelectedAnswer(null);
    setEliminatedOptions([]);
    setShowExplanation(false);
    await refetchQ();
    setPhase("playing");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4"
        style={{ background: "oklch(0.10 0.025 270)" }}>
        <div className="text-5xl float-anim">🔒</div>
        <p className="text-muted-foreground text-sm">请先登录开始答题</p>
        <a href={getLoginUrl()}
          className="px-6 py-2.5 rounded-xl font-bold text-sm"
          style={{ background: "oklch(0.72 0.18 35)", color: "oklch(0.10 0.02 270)" }}>
          立即登录
        </a>
      </div>
    );
  }

  // ─── Phase: Select Difficulty ─────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div className="min-h-screen page-content px-4 pt-safe" style={{ background: "oklch(0.10 0.025 270)" }}>
        <div className="flex items-center gap-3 py-4 mb-2">
          <button onClick={() => navigate("/")} className="text-muted-foreground text-xl">‹</button>
          <h1 className="font-bold text-lg font-display">选择关卡</h1>
        </div>

        {/* Current state */}
        {gameState && (
          <div className="rounded-xl p-3 mb-4 flex items-center justify-between"
            style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{gameState.rank?.iconEmoji ?? "🗡️"}</span>
              <div>
                <div className="text-xs text-muted-foreground">当前段位</div>
                <div className="text-sm font-bold">{gameState.rank?.rankName ?? "青铜剑·Ⅲ"}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">总积分</div>
              <div className="text-sm font-bold" style={{ color: "oklch(0.78 0.18 85)" }}>{gameState.totalScore}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">提示卡</div>
              <div className="text-sm font-bold" style={{ color: "oklch(0.72 0.18 35)" }}>×{gameState.hintsCount}</div>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {DIFFICULTY_INFO.map((d) => (
            <button
              key={d.level}
              onClick={() => setDifficulty(d.level)}
              className="w-full rounded-2xl p-4 text-left transition-all active:scale-98"
              style={{
                background: difficulty === d.level ? `${d.color}18` : "oklch(0.16 0.03 270)",
                border: `1px solid ${difficulty === d.level ? d.color + "80" : "oklch(0.26 0.05 270)"}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{d.emoji}</div>
                <div className="flex-1">
                  <div className="font-bold text-sm" style={{ color: difficulty === d.level ? d.color : undefined }}>
                    {d.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{d.desc}</div>
                </div>
                <div className="text-xs text-muted-foreground">限时{d.time}秒</div>
                {difficulty === d.level && <span style={{ color: d.color }}>✓</span>}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={startGame}
          disabled={loadingQ}
          className="w-full py-3.5 rounded-2xl font-bold text-base transition-all active:scale-98 disabled:opacity-50"
          style={{ background: "oklch(0.72 0.18 35)", color: "oklch(0.10 0.02 270)", boxShadow: "0 4px 20px oklch(0.72 0.18 35 / 0.4)" }}
        >
          {loadingQ ? "加载中..." : `⚔️ 开始 ${diffInfo?.name}`}
        </button>
      </div>
    );
  }

  // ─── Phase: Playing ───────────────────────────────────────────────────────
  if (phase === "playing") {
    const progress = ((currentIdx) / (questions?.length ?? 7)) * 100;
    const timeProgress = (timeLeft / maxTime) * 100;
    const isWarning = timeLeft <= 5;

    return (
      <div className="min-h-screen flex flex-col px-4 pt-safe" style={{ background: "oklch(0.10 0.025 270)" }}>
        {/* Header */}
        <div className="py-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => { setPhase("select"); setCurrentIdx(0); }} className="text-muted-foreground">✕</button>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">{currentIdx + 1}/{questions?.length ?? 7}</span>
              <span style={{ color: "oklch(0.78 0.18 85)" }}>+{sessionScore}分</span>
              {consecutiveWins >= 2 && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.62 0.22 25 / 0.2)", color: "oklch(0.72 0.22 40)" }}>
                  🔥{consecutiveWins}连胜
                </span>
              )}
            </div>
            <button
              onClick={handleUseHint}
              disabled={answerState !== "idle" || (gameState?.hintsCount ?? 0) <= 0}
              className="text-sm px-2 py-1 rounded-lg transition-all disabled:opacity-40"
              style={{ background: "oklch(0.72 0.18 35 / 0.15)", color: "oklch(0.72 0.18 35)" }}
            >
              💡×{gameState?.hintsCount ?? 0}
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "oklch(0.22 0.04 270)" }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, oklch(0.72 0.18 35), oklch(0.78 0.18 85))" }} />
          </div>

          {/* Timer bar */}
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.04 270)" }}>
            <div className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${timeProgress}%`,
                background: isWarning
                  ? "linear-gradient(90deg, oklch(0.62 0.22 25), oklch(0.72 0.22 40))"
                  : "linear-gradient(90deg, oklch(0.62 0.18 190), oklch(0.72 0.18 35))",
              }} />
          </div>
          <div className="text-right text-xs mt-0.5" style={{ color: isWarning ? "oklch(0.72 0.22 40)" : "oklch(0.55 0.05 80)" }}>
            {timeLeft}s
          </div>
        </div>

        {/* Question */}
        {currentQ ? (
          <div className="flex-1 flex flex-col">
            <div className="rounded-2xl p-4 mb-4"
              style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "oklch(0.72 0.18 35 / 0.15)", color: "oklch(0.72 0.18 35)" }}>
                  {TYPE_LABELS[currentQ.questionType] ?? "题目"}
                </span>
                {currentQ.sourcePoemTitle && (
                  <span className="text-xs text-muted-foreground">《{currentQ.sourcePoemTitle}》</span>
                )}
              </div>
              <p className="text-base leading-relaxed font-display" style={{ color: "oklch(0.92 0.01 80)" }}>
                {currentQ.content}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2.5 mb-4">
              {(currentQ.options as string[]).map((opt, i) => {
                const isEliminated = eliminatedOptions.includes(opt);
                const isSelected = selectedAnswer === opt;
                const isCorrectOpt = opt === currentQ.correctAnswer;
                let btnStyle: React.CSSProperties = {
                  background: "oklch(0.16 0.03 270)",
                  border: "1px solid oklch(0.26 0.05 270)",
                  color: "oklch(0.90 0.01 80)",
                };
                if (isEliminated) {
                  btnStyle = { ...btnStyle, opacity: 0.3, textDecoration: "line-through" };
                } else if (answerState !== "idle") {
                  if (isCorrectOpt) {
                    btnStyle = { background: "oklch(0.62 0.18 190 / 0.2)", border: "1px solid oklch(0.62 0.18 190)", color: "oklch(0.80 0.12 190)" };
                  } else if (isSelected && !isCorrectOpt) {
                    btnStyle = { background: "oklch(0.62 0.22 25 / 0.2)", border: "1px solid oklch(0.62 0.22 25)", color: "oklch(0.75 0.15 25)" };
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleOptionClick(opt)}
                    disabled={answerState !== "idle" || isEliminated}
                    className="w-full text-left px-4 py-3 rounded-xl transition-all duration-200 text-sm"
                    style={btnStyle}
                  >
                    <span className="mr-2 font-bold" style={{ color: "oklch(0.55 0.05 80)" }}>
                      {["A", "B", "C", "D"][i]}
                    </span>
                    {opt}
                    {answerState !== "idle" && isCorrectOpt && <span className="float-right">✓</span>}
                    {answerState !== "idle" && isSelected && !isCorrectOpt && <span className="float-right">✗</span>}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && lastResult && (
              <div className="rounded-xl p-3 mb-4 animate-slide-up"
                style={{
                  background: lastResult.isCorrect ? "oklch(0.62 0.18 190 / 0.1)" : "oklch(0.62 0.22 25 / 0.1)",
                  border: `1px solid ${lastResult.isCorrect ? "oklch(0.62 0.18 190 / 0.3)" : "oklch(0.62 0.22 25 / 0.3)"}`,
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{lastResult.isCorrect ? "✅" : "❌"}</span>
                  <span className="text-sm font-bold" style={{ color: lastResult.isCorrect ? "oklch(0.72 0.15 160)" : "oklch(0.72 0.18 25)" }}>
                    {lastResult.isCorrect ? `答对了！+${lastResult.scoreDelta}分` : `答错了 ${lastResult.scoreDelta}分`}
                  </span>
                </div>
                {lastResult.explanation && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{lastResult.explanation}</p>
                )}
              </div>
            )}

            {/* Next button */}
            {answerState !== "idle" && (
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-98 animate-slide-up"
                style={{ background: "oklch(0.72 0.18 35)", color: "oklch(0.10 0.02 270)" }}
              >
                {currentIdx + 1 >= (questions?.length ?? 7) ? "查看结果 →" : "下一题 →"}
              </button>
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-safe"
      style={{ background: "oklch(0.10 0.025 270)" }}>
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3 float-anim">
            {sessionCorrect >= 6 ? "🏆" : sessionCorrect >= 4 ? "⭐" : "📜"}
          </div>
          <h2 className="text-2xl font-bold font-display mb-1">
            {sessionCorrect >= 6 ? "出色！" : sessionCorrect >= 4 ? "不错！" : "继续加油！"}
          </h2>
          <p className="text-muted-foreground text-sm">本轮答题结束</p>
        </div>

        <div className="rounded-2xl p-5 mb-5"
          style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold" style={{ color: "oklch(0.78 0.18 85)" }}>{sessionScore}</div>
              <div className="text-xs text-muted-foreground mt-0.5">本轮得分</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "oklch(0.62 0.18 190)" }}>
                {sessionCorrect}/{questions?.length ?? 7}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">答对题数</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "oklch(0.72 0.18 35)" }}>
                {Math.round((sessionCorrect / (questions?.length ?? 7)) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">正确率</div>
            </div>
          </div>
        </div>

        {gameState && (
          <div className="rounded-xl p-3 mb-5 flex items-center gap-3"
            style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
            <span className="text-2xl">{gameState.rank?.iconEmoji ?? "🗡️"}</span>
            <div>
              <div className="text-xs text-muted-foreground">当前段位</div>
              <div className="font-bold text-sm">{gameState.rank?.rankName ?? "青铜剑·Ⅲ"}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs text-muted-foreground">总积分</div>
              <div className="font-bold text-sm" style={{ color: "oklch(0.78 0.18 85)" }}>{gameState.totalScore}</div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => { setPhase("select"); setCurrentIdx(0); setSessionScore(0); setSessionCorrect(0); }}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-98"
            style={{ background: "oklch(0.72 0.18 35)", color: "oklch(0.10 0.02 270)" }}
          >
            ⚔️ 再来一局
          </button>
          <button
            onClick={() => navigate("/destiny")}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-98"
            style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}
          >
            ✨ 查看本命诗人
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl text-sm text-muted-foreground"
          >
            返回主页
          </button>
        </div>
      </div>
    </div>
  );
}
