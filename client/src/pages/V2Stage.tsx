import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { getChapterSounds } from "@/lib/soundEffects";


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


function getSessionKey(): string {
  let key = localStorage.getItem("v2_session_key");
  if (!key) {
    key = `v2_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("v2_session_key", key);
  }
  return key;
}

type GamePhase =
  | "story_before"    // 关卡前剧情
  | "playing"         // 答题中
  | "result"          // 通关/失败结算
  | "card_drop";      // 卡牌掉落动画

interface Question {
  id: number;
  content: string;
  options: string[];
  correctAnswer: string;
  sourcePoemTitle: string | null;
  sourcePoemAuthor: string | null;
}

interface DroppedCard {
  id: number;
  poetName: string;
  imageUrl: string;
  rarity: string;
  signaturePoem: string | null;
}

export default function V2Stage() {
  const { stageId } = useParams<{ stageId: string }>();
  const [, navigate] = useLocation();
  const sessionKey = useMemo(() => getSessionKey(), []);
  const stageIdNum = parseInt(stageId ?? "0");
  
  // 根据关卡ID计算章节ID（1-3为第一章，4-6为第二章，以此类推）
  const chapterId = Math.ceil(stageIdNum / 3);
  const sounds = useMemo(() => getChapterSounds(chapterId), [chapterId]);

  const [phase, setPhase] = useState<GamePhase>("story_before");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [gamePhaseType, setGamePhaseType] = useState<"main" | "debt">("main");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; correctAnswer: string; explanation: string | null } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [passed, setPassed] = useState(false);
  const [droppedCards, setDroppedCards] = useState<DroppedCard[]>([]);
  const [storyAfter, setStoryAfter] = useState<string | null>(null);
  const [debtCount, setDebtCount] = useState(0);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [nextStageId, setNextStageId] = useState<number | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [isChapterDrop, setIsChapterDrop] = useState(false);

  // 当 stageId 变化时（进入下一关），重置所有状态
  useEffect(() => {
    setPhase("story_before");
    setSessionId(null);
    setGamePhaseType("main");
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswerResult(null);
    setCorrectCount(0);
    setWrongCount(0);
    setPassed(false);
        setDroppedCards([]);
        setStoryAfter(null);
        setDebtCount(0);
        setIsAutoAdvancing(false);
        setNextStageId(null);
        setIsChapterDrop(false);
        setFlippedCards(new Set());
  }, [stageIdNum]);

  const { data: stageInfo } = trpc.v2.getStageStory.useQuery({ stageId: stageIdNum });

  const startStageMutation = trpc.v2.startStage.useMutation();
  const submitAnswerMutation = trpc.v2.submitAnswer.useMutation();
  const completeStageMutation = trpc.v2.completeStage.useMutation();
  const utils = trpc.useUtils();

  // 开始答题
  const handleStartGame = async () => {
    try {
      const result = await startStageMutation.mutateAsync({ sessionKey, stageId: stageIdNum });
      setSessionId(result.sessionId);
      setGamePhaseType(result.phase);
      setQuestions(result.questions);
      setDebtCount(result.debtCount);
      setCurrentIndex(0);
      setCorrectCount(0);
      setWrongCount(0);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setPhase("playing");
    } catch (err: unknown) {
      alert((err as Error).message ?? "开始失败，请重试");
    }
  };

  // 提交答案
  const handleSelectAnswer = async (answer: string) => {
    if (selectedAnswer !== null || !sessionId) return;
    setSelectedAnswer(answer);

    try {
      const result = await submitAnswerMutation.mutateAsync({
        sessionKey,
        sessionId,
        questionId: questions[currentIndex].id,
        answer,
      });
      setAnswerResult(result);
      if (result.isCorrect) {
        setCorrectCount(c => c + 1);
        sounds.correct(); // 播放答对音效
      } else {
        setWrongCount(c => c + 1);
        sounds.incorrect(); // 播放答错音效
      }

      // 1.5秒后自动进入下一题
      setIsAutoAdvancing(true);
      setTimeout(() => {
        setIsAutoAdvancing(false);
        handleNextQuestion(result.isCorrect);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextQuestion = async (lastCorrect?: boolean) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      // 所有题目完成，提交结算
      await handleComplete();
    } else {
      setCurrentIndex(nextIndex);
      setSelectedAnswer(null);
      setAnswerResult(null);
    }
  };

  // 完成一关
  const handleComplete = async () => {
    if (!sessionId) return;
    try {
      const result = await completeStageMutation.mutateAsync({ sessionKey, sessionId });
      setPassed(result.passed);
      setStoryAfter(result.storyAfter);
      setDroppedCards(result.droppedCards);
      setNextStageId(result.nextStageId ?? null);
      setIsChapterDrop((result as unknown as { isChapterDrop?: boolean }).isChapterDrop ?? false);
      setFlippedCards(new Set());

      // 刷新关卡列表
      utils.v2.getStages.invalidate({ sessionKey });

      // 播放晒级音效
      if (result.passed) {
        sounds.levelUp();
      }

      if (result.passed && result.droppedCards.length > 0) {
        setPhase("card_drop");
      } else {
        setPhase("result");
      }
    } catch (err) {
      console.error(err);
      setPhase("result");
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  // ── 剧情前页 ──────────────────────────────────────────────
  if (phase === "story_before") {
    return (
      <div className="min-h-screen flex flex-col"
        style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a0a 100%)" }}>
        <div className="sticky top-0 px-4 py-3 flex items-center"
          style={{ background: "rgba(10,10,26,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
          <button onClick={() => navigate("/v2")} style={{ color: "#D4AF37" }} className="text-sm">
            ← 关卡地图
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-lg mx-auto w-full">
          <div className="text-5xl mb-4">{stageInfo?.weaponEmoji ?? "⚔️"}</div>
          <div className="text-xs mb-2" style={{ color: "rgba(212,175,55,0.6)" }}>
            第{stageInfo?.stageNumber}关
          </div>
          <h1 className="text-xl font-bold text-center mb-6" style={{ color: "#D4AF37" }}>
            {stageInfo?.stageName}
          </h1>

          {/* 剧情文案 */}
          <div className="rounded-2xl p-5 mb-6 w-full"
            style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)" }}>
            <div className="text-sm leading-relaxed whitespace-pre-line"
              style={{ color: "rgba(255,255,255,0.85)" }}>
              {stageInfo?.storyBefore ?? "准备好了吗？"}
            </div>
          </div>

          {/* 规则说明 */}
          <div className="rounded-xl p-4 mb-6 w-full"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-xs space-y-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              <div>📝 共10道诗词填空题，全部答对方能通关</div>
              <div>📜 答错的题目将成为「诗债」，通关前必须还清</div>
              <div>🎴 满分通关（10/10）可获得1张诗人卡牌</div>
            </div>
          </div>

          <Button
            className="w-full py-4 text-base font-bold"
            onClick={handleStartGame}
            disabled={startStageMutation.isPending}
            style={{
              background: "linear-gradient(135deg, #D4AF37, #B8860B)",
              color: "#0a0a1a",
              border: "none",
            }}>
            {startStageMutation.isPending ? "准备中..." : "⚔️ 开始挑战"}
          </Button>
        </div>
      </div>
    );
  }

  // ── 答题页（与主游戏Game.tsx一致的白色背景+宋体字风格）────────
  if (phase === "playing" && currentQuestion) {
    const options = currentQuestion.options;
    const isSingleChar = options.every(o => o.length === 1);
    const isShortOpt = options.every(o => o.length <= 4);

    return (
      <div className="min-h-screen flex flex-col px-4 pt-safe bg-background">
        {/* 顶部栏 */}
        <div className="py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate("/v2")}
              className="text-muted-foreground text-lg leading-none">✕</button>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">{currentIndex + 1}/{questions.length}</span>
              {gamePhaseType === "debt" && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#DC2626" }}>
                  📜 还清诗债
                </span>
              )}
              <span className="font-semibold text-sm" style={{ color: "var(--celadon)" }}>
                ✅{correctCount} ❌{wrongCount}
              </span>
            </div>
            <div className="w-8" />
          </div>
          {/* 进度条 */}
          <div className="h-1.5 rounded-full overflow-hidden bg-muted">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--vermilion), var(--gold))" }} />
          </div>
        </div>

        {/* 诗债提示 */}
        {gamePhaseType === "debt" && (
          <div className="rounded-xl p-3 mb-3 text-center"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-sm" style={{ color: "#DC2626" }}>
              📜 你有 {debtCount} 道诗债未还，答对所有题目方能通关！
            </p>
          </div>
        )}

        {/* 题目区域 */}
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
                填空题
              </span>
              {currentQuestion.sourcePoemTitle && (
                <span className="text-xs font-serif-poem" style={{ color: "var(--ink-pale)" }}>
                  {currentQuestion.sourcePoemAuthor && `${currentQuestion.sourcePoemAuthor} · `}《{currentQuestion.sourcePoemTitle}》
                </span>
              )}
            </div>
            <div className="px-5 py-5">
              <p className="font-serif-poem text-foreground"
                style={{ fontSize: "24px", lineHeight: "2.0", fontWeight: 500, letterSpacing: "0.08em" }}>
                {renderQuestionContent(currentQuestion.content)}
              </p>
            </div>
          </div>

          {/* 选项 */}
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
              const isSelected = selectedAnswer === opt;
              const isCorrectOpt = opt === answerResult?.correctAnswer;
              const isWrongSelected = isSelected && answerResult !== null && !answerResult.isCorrect;

              let containerStyle: React.CSSProperties = {
                background: "var(--card)",
                border: "1.5px solid var(--border)",
                color: "var(--ink)",
              };
              if (answerResult !== null) {
                if (isCorrectOpt) {
                  containerStyle = { background: "#F0FDF4", border: "1.5px solid #16A34A", color: "#15803D" };
                } else if (isWrongSelected) {
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
                  onClick={() => handleSelectAnswer(opt)}
                  disabled={selectedAnswer !== null}
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
                  {answerResult !== null && isCorrectOpt && (
                    <span style={{ color: "#16A34A", fontSize: "14px", position: "absolute", top: "4px", right: "8px" }}>✓</span>
                  )}
                  {answerResult !== null && isWrongSelected && (
                    <span style={{ color: "#DC2626", fontSize: "14px", position: "absolute", top: "4px", right: "8px" }}>✗</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 答题反馈 */}
          {answerResult !== null && (
            <div className="rounded-2xl p-4 mb-4 animate-slide-up"
              style={{
                background: answerResult.isCorrect
                  ? "linear-gradient(135deg, #F0FDF4, #DCFCE7)"
                  : "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
                border: `1.5px solid ${answerResult.isCorrect ? "#16A34A40" : "#DC262640"}`,
              }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "22px" }}>{answerResult.isCorrect ? "✅" : "❌"}</span>
                  <span className="font-bold font-display"
                    style={{ color: answerResult.isCorrect ? "#15803D" : "#B91C1C", fontSize: "17px" }}>
                    {answerResult.isCorrect ? "答对了！" : `正确答案：${answerResult.correctAnswer}`}
                  </span>
                </div>
                {isAutoAdvancing && (
                  <p className="text-xs" style={{ color: answerResult.isCorrect ? "#16A34A80" : "#DC262680" }}>
                    {currentIndex + 1 >= questions.length ? "即将查看结果" : "即将下一题"}
                  </p>
                )}
              </div>
              {answerResult.explanation && (
                <p className="text-xs mt-2 text-muted-foreground">{answerResult.explanation}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── 卡牌掉落页 ────────────────────────────────────────────────────────
  if (phase === "card_drop") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
        style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a0a 100%)" }}>
        <div className="text-4xl mb-4 animate-bounce">🂴</div>
        {isChapterDrop && droppedCards.length > 1 ? (
          <>
            <h2 className="text-xl font-bold mb-1 text-center" style={{ color: "#D4AF37" }}>
              章节全通！双重奖励！
            </h2>
            <p className="text-sm mb-1 text-center" style={{ color: "rgba(255,255,255,0.7)" }}>
              满分通关 + 章节全章通关，共获得 {droppedCards.length} 张诗人卡牌！
            </p>
          </>
        ) : isChapterDrop ? (
          <>
            <h2 className="text-xl font-bold mb-1 text-center" style={{ color: "#D4AF37" }}>
              章节全通！获得章节奖励卡牌！
            </h2>
            <p className="text-sm mb-1 text-center" style={{ color: "rgba(255,255,255,0.7)" }}>
              完成本章全部3关，额外获得诗人卡牌！
            </p>
          </>
        ) : (
          <h2 className="text-xl font-bold mb-1 text-center" style={{ color: "#D4AF37" }}>
            满分通关！获得诗人卡牌！
          </h2>
        )}
        <p className="text-sm mb-8 text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
          点击卡牌查看诗句
        </p>

        {/* 卡牌展示：正面图片，点击翻转显示诗句 */}
        <div className="flex gap-6 flex-wrap justify-center mb-10">
          {droppedCards.map((card) => {
            const isFlipped = flippedCards.has(card.id);
            const rarityColor = card.rarity === "epic" ? "#D4AF37" : card.rarity === "rare" ? "#A8A9AD" : "#CD7F32";
            return (
              <div
                key={card.id}
                onClick={() => setFlippedCards(prev => {
                  const next = new Set(prev);
                  if (next.has(card.id)) next.delete(card.id);
                  else next.add(card.id);
                  return next;
                })}
                className="cursor-pointer select-none"
                style={{ width: 160, height: 240, perspective: "800px" }}
              >
                <div style={{
                  width: "100%", height: "100%",
                  position: "relative",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.6s ease",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}>
                  {/* 正面：卡牌图片 */}
                  <div style={{
                    position: "absolute", width: "100%", height: "100%",
                    backfaceVisibility: "hidden",
                    borderRadius: "12px", overflow: "hidden",
                    border: `2px solid ${rarityColor}`,
                    boxShadow: `0 0 20px ${rarityColor}40`,
                  }}>
                    <img src={card.imageUrl} alt={card.poetName}
                      style={{ width: "100%", height: "100%", objectFit: "contain", background: "#0a0a1a" }} />
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      padding: "8px 10px",
                      background: "linear-gradient(transparent, rgba(10,10,26,0.95))",
                      textAlign: "center",
                    }}>
                      <div style={{ color: rarityColor, fontWeight: "bold", fontSize: "14px" }}>{card.poetName}</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", marginTop: "2px" }}>点击查看诗句</div>
                    </div>
                  </div>
                  {/* 背面：诗句 */}
                  <div style={{
                    position: "absolute", width: "100%", height: "100%",
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    borderRadius: "12px",
                    border: `2px solid ${rarityColor}`,
                    background: "linear-gradient(135deg, #1a0a2e, #0a1a0a)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    padding: "16px",
                    boxShadow: `0 0 20px ${rarityColor}40`,
                  }}>
                    <div style={{ color: rarityColor, fontSize: "22px", marginBottom: "12px" }}>📜</div>
                    <div style={{
                      color: "rgba(255,255,255,0.9)", fontSize: "13px",
                      lineHeight: "1.9", textAlign: "center",
                      fontFamily: "Huiwen-MinchoGBK, Noto Serif SC, serif",
                    }}>
                      {card.signaturePoem ?? card.poetName}
                    </div>
                    <div style={{ color: rarityColor, fontSize: "12px", marginTop: "12px", fontWeight: "bold" }}>{card.poetName}</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", marginTop: "4px" }}>点击翻回</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          onClick={() => setPhase("result")}
          style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)", color: "#0a0a1a", border: "none" }}>
          继续 →
        </Button>
      </div>
    );
  }  // ── 结算页（与主游戏一致的白色背景风格）────────────────────────
  if (phase === "result") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-safe bg-background">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3 float-anim">
              {passed ? (correctCount === 10 ? "🏆" : "⭐") : "📜"}
            </div>
            <h2 className="text-xl font-bold font-display mb-1 text-foreground">
              {passed ? (correctCount === 10 ? "满分通关！" : "通关成功！") : "尚有诗债未还"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {stageInfo?.stageName ?? "本关结束"}
            </p>
          </div>

          {/* 成绩卡片 */}
          <div className="rounded-2xl p-5 mb-5 bg-card border border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold" style={{ color: "var(--celadon)" }}>{correctCount}</div>
                <div className="text-xs text-muted-foreground mt-0.5">答对</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: "#DC2626" }}>{wrongCount}</div>
                <div className="text-xs text-muted-foreground mt-0.5">答错</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: "var(--gold)" }}>
                  {questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0}%
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">正确率</div>
              </div>
            </div>
          </div>

          {/* 通关后剧情 */}
          {passed && storyAfter && (
            <div className="rounded-2xl p-5 mb-5 bg-card border border-border">
              <p className="text-sm leading-loose whitespace-pre-line font-serif-poem text-center text-foreground"
                style={{ letterSpacing: "0.04em" }}>
                {storyAfter}
              </p>
            </div>
          )}

          {/* 诗债提示 */}
          {!passed && wrongCount > 0 && (
            <div className="rounded-xl p-4 mb-5"
              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-sm text-center" style={{ color: "#DC2626" }}>
                📜 你欠下了 {wrongCount} 道诗债<br />
                <span className="text-muted-foreground text-xs">
                  下次挑战前，必须先还清诗债才能通关
                </span>
              </p>
            </div>
          )}

          {/* 通关后引导进入下一关 */}
          {passed && nextStageId && (
            <div className="rounded-2xl p-4 mb-4 text-center"
              style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(255,107,53,0.08))", border: "1px solid rgba(212,175,55,0.3)" }}>
              <div className="text-lg mb-1">✨</div>
              <p className="text-sm font-medium mb-3" style={{ color: "#D4AF37" }}>下一关已解锁！</p>
              <Button
                className="w-full font-bold"
                onClick={() => navigate(`/v2/stage/${nextStageId}`)}
                style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)", color: "#0a0a1a", border: "none" }}>
                进入下一关 →
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/v2")}>
              关卡地图
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setPhase("story_before");
                setSessionId(null);
                setQuestions([]);
                setCurrentIndex(0);
                setCorrectCount(0);
                setWrongCount(0);
                setSelectedAnswer(null);
                setAnswerResult(null);
              }}
              style={{ background: "linear-gradient(135deg, var(--vermilion), var(--gold))", color: "white", border: "none" }}>
              {passed ? "再次挑战" : "去还诗债"}
            </Button>
          </div>
        </div>
      </div>
    );
  }


  return null;
}
