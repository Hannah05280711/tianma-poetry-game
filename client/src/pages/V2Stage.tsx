import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

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
      if (result.isCorrect) setCorrectCount(c => c + 1);
      else setWrongCount(c => c + 1);

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

      // 刷新关卡列表
      utils.v2.getStages.invalidate({ sessionKey });

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
              <div>🎴 全对可获得2张诗人卡牌，答对8题以上获得1张</div>
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

  // ── 答题页 ──────────────────────────────────────────────────
  if (phase === "playing" && currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col"
        style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a0a 100%)" }}>

        {/* 顶部进度条 */}
        <div className="sticky top-0 z-10"
          style={{ background: "rgba(10,10,26,0.95)", borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={() => navigate("/v2")} style={{ color: "rgba(212,175,55,0.7)" }} className="text-sm">
              ← 退出
            </button>
            <div className="text-sm font-medium" style={{ color: "#D4AF37" }}>
              {gamePhaseType === "debt" ? "📜 还清诗债" : `第${currentIndex + 1}/${questions.length}题`}
            </div>
            <div className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              ✅{correctCount} ❌{wrongCount}
            </div>
          </div>
          {/* 进度条 */}
          <div className="h-1 w-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full transition-all duration-300"
              style={{ width: `${progress}%`, background: "linear-gradient(to right, #D4AF37, #FFD700)" }} />
          </div>
        </div>

        {/* 诗债提示 */}
        {gamePhaseType === "debt" && (
          <div className="mx-4 mt-4 rounded-xl p-3 text-center"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <p className="text-sm" style={{ color: "#EF4444" }}>
              📜 你有 {debtCount} 道诗债未还，答对所有题目方能通关！
            </p>
          </div>
        )}

        <div className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full">
          {/* 题目 */}
          <div className="rounded-2xl p-5 mb-6"
            style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)" }}>
            {currentQuestion.sourcePoemTitle && (
              <div className="text-xs mb-3" style={{ color: "rgba(212,175,55,0.6)" }}>
                {currentQuestion.sourcePoemAuthor} · 《{currentQuestion.sourcePoemTitle}》
              </div>
            )}
            <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.9)" }}>
              {currentQuestion.content}
            </p>
          </div>

          {/* 选项 */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === answerResult?.correctAnswer;
              const isWrong = isSelected && !answerResult?.isCorrect;

              let bgStyle = "rgba(255,255,255,0.05)";
              let borderStyle = "rgba(255,255,255,0.1)";
              let textColor = "rgba(255,255,255,0.85)";

              if (answerResult) {
                if (isCorrect) {
                  bgStyle = "rgba(74,222,128,0.15)";
                  borderStyle = "rgba(74,222,128,0.5)";
                  textColor = "#4ADE80";
                } else if (isWrong) {
                  bgStyle = "rgba(239,68,68,0.15)";
                  borderStyle = "rgba(239,68,68,0.5)";
                  textColor = "#EF4444";
                }
              } else if (isSelected) {
                bgStyle = "rgba(212,175,55,0.15)";
                borderStyle = "rgba(212,175,55,0.5)";
                textColor = "#D4AF37";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(option)}
                  disabled={selectedAnswer !== null}
                  className="w-full text-left rounded-xl p-4 transition-all duration-200"
                  style={{ background: bgStyle, border: `1px solid ${borderStyle}`, color: textColor }}>
                  <span className="text-xs mr-2 opacity-60">{String.fromCharCode(65 + idx)}.</span>
                  {option}
                </button>
              );
            })}
          </div>

          {/* 答案解析 */}
          {answerResult && (
            <div className="mt-4 rounded-xl p-4"
              style={{
                background: answerResult.isCorrect ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)",
                border: `1px solid ${answerResult.isCorrect ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}`,
              }}>
              <div className="font-medium text-sm mb-1"
                style={{ color: answerResult.isCorrect ? "#4ADE80" : "#EF4444" }}>
                {answerResult.isCorrect ? "✅ 答对了！" : `❌ 正确答案：${answerResult.correctAnswer}`}
              </div>
              {answerResult.explanation && (
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {answerResult.explanation}
                </p>
              )}
              {isAutoAdvancing && (
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  即将进入下一题...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── 卡牌掉落页 ──────────────────────────────────────────────
  if (phase === "card_drop") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a0a 100%)" }}>
        <div className="text-4xl mb-4 animate-bounce">🎴</div>
        <h2 className="text-xl font-bold mb-2 text-center" style={{ color: "#D4AF37" }}>
          获得诗人卡牌！
        </h2>
        <p className="text-sm mb-6 text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
          {correctCount === 10 ? "满分通关！获得2张卡牌" : "优秀！获得1张卡牌"}
        </p>

        <div className="flex gap-4 flex-wrap justify-center mb-8">
          {droppedCards.map((card) => (
            <div key={card.id} className="rounded-2xl overflow-hidden text-center"
              style={{ width: 140, border: `2px solid ${card.rarity === "epic" ? "#D4AF37" : card.rarity === "rare" ? "#A8A9AD" : "#CD7F32"}` }}>
              <img src={card.imageUrl} alt={card.poetName}
                className="w-full object-cover" style={{ height: 180 }} />
              <div className="p-2" style={{ background: "rgba(10,10,26,0.9)" }}>
                <div className="font-bold text-sm" style={{ color: "#D4AF37" }}>{card.poetName}</div>
                {card.signaturePoem && (
                  <div className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {card.signaturePoem}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={() => setPhase("result")}
          style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)", color: "#0a0a1a", border: "none" }}>
          继续 →
        </Button>
      </div>
    );
  }

  // ── 结算页 ──────────────────────────────────────────────────
  if (phase === "result") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a0a 100%)" }}>
        <div className="text-5xl mb-4">{passed ? "🎉" : "📜"}</div>
        <h2 className="text-2xl font-bold mb-2 text-center"
          style={{ color: passed ? "#D4AF37" : "#EF4444" }}>
          {passed ? "通关成功！" : "尚有诗债未还"}
        </h2>

        <div className="flex gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: "#4ADE80" }}>{correctCount}</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>答对</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: "#EF4444" }}>{wrongCount}</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>答错</div>
          </div>
        </div>

        {/* 通关后剧情 */}
        {passed && storyAfter && (
          <div className="rounded-2xl p-5 mb-6 max-w-sm w-full"
            style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)" }}>
            <p className="text-sm leading-relaxed whitespace-pre-line text-center"
              style={{ color: "rgba(255,255,255,0.85)" }}>
              {storyAfter}
            </p>
          </div>
        )}

        {/* 诗债提示 */}
        {!passed && wrongCount > 0 && (
          <div className="rounded-xl p-4 mb-6 max-w-sm w-full text-center"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <p className="text-sm" style={{ color: "#EF4444" }}>
              📜 你欠下了 {wrongCount} 道诗债<br />
              <span style={{ color: "rgba(255,255,255,0.6)" }}>
                下次挑战前，必须先还清诗债才能通关
              </span>
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/v2")}
            style={{ borderColor: "rgba(212,175,55,0.3)", color: "#D4AF37", background: "transparent" }}>
            关卡地图
          </Button>
          <Button
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
            style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)", color: "#0a0a1a", border: "none" }}>
            {passed ? "下一关" : "再次挑战"}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
