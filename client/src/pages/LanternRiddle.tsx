import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { getLanternFestivalRiddles, shouldShowLanternEgg, type LanternRiddle } from "@/lib/lanternRiddleData";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { playFireworkSound, playFirecrackerSound, initAudio } from "@/lib/soundEffects";
import { loadLocalState, updateLocalState } from "@/lib/localGameState";

// 灯笼颜色
const LANTERN_COLORS = ["#E84545", "#FF8C00", "#E84545", "#C0392B", "#FF6B35"];

// 烟花粒子
interface Particle {
  x: number; y: number; vx: number; vy: number;
  color: string; life: number; maxLife: number;
}

const FIREWORK_COLORS = ["#FFD700", "#FF6B35", "#E84545", "#FF8C00", "#FFF176", "#FFAB40"];

function useFireworks() {
  const [particles, setParticles] = useState<Particle[]>([]);

  const burst = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = Array.from({ length: 24 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)]!,
        life: 1,
        maxLife: 1,
      };
    });
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;
    const id = requestAnimationFrame(() => {
      setParticles(prev =>
        prev
          .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.15, life: p.life - 0.035 }))
          .filter(p => p.life > 0)
      );
    });
    return () => cancelAnimationFrame(id);
  }, [particles]);

  return { particles, burst };
}

type GamePhase = "intro" | "playing" | "result";

export default function LanternRiddle() {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [riddles, setRiddles] = useState<LanternRiddle[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerActive, setTimerActive] = useState(false);
  const { particles, burst } = useFireworks();
  const isLanternDay = shouldShowLanternEgg();

  // 初始化灯谜
  const initGame = useCallback(() => {
    const newRiddles = getLanternFestivalRiddles();
    setRiddles(newRiddles);
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setScore(0);
    setShowExplanation(false);
    setTimeLeft(20);
    setTimerActive(true);
    setPhase("playing");
  }, []);

  // 倒计时
  useEffect(() => {
    if (!timerActive || phase !== "playing") return;
    if (timeLeft <= 0) {
      // 超时自动判错
      handleAnswer("__timeout__");
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, timerActive, phase]);

  const handleAnswer = useCallback((option: string) => {
    if (selectedOption !== null) return; // 已选择
    setTimerActive(false);
    setSelectedOption(option);
    const riddle = riddles[currentIdx];
    if (!riddle) return;
    const correct = option === riddle.answer;
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + (timeLeft > 10 ? 20 : timeLeft > 5 ? 15 : 10));
      // 触发烟花动画
      burst(window.innerWidth / 2, window.innerHeight / 3);
      setTimeout(() => burst(window.innerWidth * 0.3, window.innerHeight * 0.4), 150);
      setTimeout(() => burst(window.innerWidth * 0.7, window.innerHeight * 0.4), 300);
      // 播放烟花声效（欢快升调）
      playFireworkSound();
    } else if (option !== "__timeout__") {
      // 播放鹭炮声效（降调）
      playFirecrackerSound();
    }
    setShowExplanation(true);
  }, [selectedOption, riddles, currentIdx, timeLeft, burst]);

  const handleNext = useCallback(() => {
    if (currentIdx >= riddles.length - 1) {
      setPhase("result");
      setTimerActive(false);
    } else {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setShowExplanation(false);
      setTimeLeft(20);
      setTimerActive(true);
    }
  }, [currentIdx, riddles.length]);

  const riddle = riddles[currentIdx];
  const totalRiddles = riddles.length;

  // 答对题数计算（基于分数估算）
  const correctCount = Math.round(score / 15);

  // 结果页保存灯谜达人数据 + 解锁成就
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  useEffect(() => {
    if (phase !== "result") return;
    const RIDDLE_ACHIEVEMENTS = [
      { id: "riddle_10", label: "灯谜初探", desc: "累计猜对 10 道灯谜", icon: "🎏", threshold: 10 },
      { id: "riddle_30", label: "灯谜達人", desc: "累计猜对 30 道灯谜", icon: "🏶", threshold: 30 },
      { id: "riddle_50", label: "灯谜大师", desc: "累计猜对 50 道灯谜", icon: "🌟", threshold: 50 },
    ];
    const newState = updateLocalState(prev => ({
      ...prev,
      riddleCorrectTotal: (prev.riddleCorrectTotal || 0) + correctCount,
      riddlePlayCount: (prev.riddlePlayCount || 0) + 1,
    }));
    const currentTotal = newState.riddleCorrectTotal;
    const alreadyUnlocked = newState.riddleAchievements || [];
    const toUnlock = RIDDLE_ACHIEVEMENTS.filter(
      a => currentTotal >= a.threshold && !alreadyUnlocked.includes(a.id)
    );
    if (toUnlock.length > 0) {
      updateLocalState(prev => ({
        ...prev,
        riddleAchievements: [...(prev.riddleAchievements || []), ...toUnlock.map(a => a.id)],
      }));
      setNewAchievements(toUnlock.map(a => `${a.icon} ${a.label}`));
    }
  }, [phase]);

  // 结果评语
  const maxScore = totalRiddles * 20;
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const resultTitle = pct >= 90 ? "灯谜状元 🏮" : pct >= 70 ? "猜谜高手 🎉" : pct >= 50 ? "小有所成 ✨" : "继续努力 💪";
  const resultMsg = pct >= 90
    ? "才思敏捷，灯谜全通！元宵佳节，与君共赏花灯。"
    : pct >= 70
    ? "博学多才，猜中大半！再接再厉，来年必夺状元。"
    : pct >= 50
    ? "略知一二，尚有进步空间，多读诗书，方能通晓灯谜。"
    : "灯谜难倒英雄汉，不妨再试一次，熟能生巧！";

  const typeLabel: Record<string, string> = {
    poetry: "诗词谜", word: "文字谜", poet: "诗人谜", classic: "典故谜",
    feihua: "飞花令", couplet: "对对联"
  };
  const diffLabel = ["", "简单", "中等", "困难"];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #1A0A00 0%, #3D1500 40%, #1A0A00 100%)" }}>
      {/* 烟花粒子层 */}
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <svg className="w-full h-full">
            {particles.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3 * p.life} fill={p.color} opacity={p.life} />
            ))}
          </svg>
        </div>
      )}

      {/* 顶部装饰灯笼 */}
      <div className="flex justify-center gap-4 pt-4 pb-2">
        {LANTERN_COLORS.map((color, i) => (
          <div key={i} className="flex flex-col items-center" style={{ animation: `swing ${1.5 + i * 0.3}s ease-in-out infinite alternate` }}>
            <div className="w-1 h-3" style={{ background: "#C8A000" }} />
            <div className="rounded-full flex items-center justify-center text-white font-bold"
              style={{
                width: 36, height: 44,
                background: `radial-gradient(ellipse at 35% 35%, ${color}EE, ${color}88)`,
                boxShadow: `0 0 12px ${color}88, 0 0 24px ${color}44`,
                fontSize: 18,
              }}>
              灯
            </div>
            <div className="w-1 h-2" style={{ background: "#C8A000" }} />
            <div className="w-3 h-1 rounded" style={{ background: "#C8A000" }} />
          </div>
        ))}
      </div>

      {/* 主内容 */}
      <div className="flex-1 flex flex-col items-center px-4 pb-24">

        {/* ===== 引导页 ===== */}
        {phase === "intro" && (
          <div className="w-full max-w-md mt-4">
              <div className="rounded-2xl overflow-hidden"
              style={{
                background: isLanternDay ? "rgba(255,200,50,0.12)" : "rgba(255,200,50,0.08)",
                border: isLanternDay ? "1px solid rgba(255,200,50,0.5)" : "1px solid rgba(255,200,50,0.3)",
                boxShadow: isLanternDay ? "0 0 30px rgba(255,150,0,0.15)" : undefined,
              }}>
              <div className="p-6 text-center">
                <div className="text-6xl mb-3">{isLanternDay ? "🏮" : "🏮"}</div>
                {isLanternDay && (
                  <div className="text-xs px-3 py-1 rounded-full inline-block mb-2 font-semibold animate-pulse"
                    style={{ background: "rgba(232,69,69,0.3)", color: "#FF8C00", border: "1px solid rgba(232,69,69,0.5)" }}>
                    正月十五 · 元宵节
                  </div>
                )}
                <h1 className="text-2xl font-bold mb-1" style={{ color: "#FFD700", letterSpacing: "0.12em" }}>
                  诗词灯谜馆
                </h1>
                <p className="text-sm mb-4" style={{ color: "#FFA040", letterSpacing: "0.06em" }}>
                  {isLanternDay
                    ? "🏮 元宵节快乐！灯谜大会正式开始"
                    : "传统文化趣味问答 · 元宵节专属彩蛋"}
                </p>
                <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <p className="text-sm leading-relaxed" style={{ color: "#FFD090" }}>
                    猜灯谜是中华千年传统，趣味无穷。<br />
                    本次共 <span style={{ color: "#FFD700" }}>12</span> 道题，<br />
                    涵盖诗词谜、文字谜、飞花令、对对联。<br />
                    每题限时 <span style={{ color: "#FFD700" }}>20</span> 秒，越快答越高分！
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { icon: "📜", label: "诗词谜", desc: "以诗句为谜面" },
                    { icon: "🔤", label: "文字谜", desc: "拆字组字猜谜" },
                    { icon: "🌸", label: "飞花令", desc: "含指定字的诗句" },
                    { icon: "🏷️", label: "对对联", desc: "上联对下联" },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl p-3 text-center"
                      style={{ background: "rgba(255,200,50,0.08)", border: "1px solid rgba(255,200,50,0.15)" }}>
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="text-xs font-semibold" style={{ color: "#FFD700" }}>{item.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#FFA040" }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { initAudio(); initGame(); }}
                  className="w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #E84545, #FF8C00)",
                    color: "white",
                    letterSpacing: "0.1em",
                    boxShadow: "0 4px 20px rgba(232,69,69,0.5)",
                  }}
                >
                  🏮 开始猜灯谜
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full py-2.5 mt-3 text-sm transition-all"
                  style={{ color: "#FFA04088" }}
                >
                  返回首页
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== 答题页 ===== */}
        {phase === "playing" && riddle && (
          <div className="w-full max-w-md mt-2">
            {/* 进度条 */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,200,50,0.15)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${((currentIdx + 1) / totalRiddles) * 100}%`,
                    background: "linear-gradient(90deg, #E84545, #FF8C00)",
                  }} />
              </div>
              <span className="text-xs font-mono" style={{ color: "#FFD700", minWidth: 40 }}>
                {currentIdx + 1}/{totalRiddles}
              </span>
              {/* 倒计时 */}
              <div className="flex items-center justify-center rounded-full font-bold text-sm"
                style={{
                  width: 36, height: 36,
                  background: timeLeft <= 5 ? "rgba(232,69,69,0.3)" : "rgba(255,200,50,0.15)",
                  border: `2px solid ${timeLeft <= 5 ? "#E84545" : "#FFD700"}`,
                  color: timeLeft <= 5 ? "#E84545" : "#FFD700",
                  transition: "all 0.3s",
                }}>
                {timeLeft}
              </div>
            </div>

            {/* 积分 */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(255,200,50,0.12)", color: "#FFD700" }}>
                  {typeLabel[riddle.type] ?? riddle.type}
                </span>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(255,200,50,0.08)", color: "#FFA040" }}>
                  {diffLabel[riddle.difficulty]}
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: "#FFD700" }}>
                🏮 {score} 分
              </span>
            </div>

            {/* 谜面卡片 */}
            <div className="rounded-2xl p-5 mb-4"
              style={{ background: "rgba(255,200,50,0.06)", border: "1px solid rgba(255,200,50,0.25)" }}>
              <p className="text-xs mb-2" style={{ color: "#FFA04088" }}>
                {riddle.hint ?? "请猜谜底"}
              </p>
              <p className="text-xl font-bold leading-relaxed text-center"
                style={{ color: "#FFE090", letterSpacing: "0.06em", lineHeight: "1.8" }}>
                {riddle.riddle}
              </p>
            </div>

            {/* 选项：飞花令/对对联用单列，其他用两列 */}
            {(() => {
              const isLongOption = riddle.type === "feihua" || riddle.type === "couplet";
              return (
                <div className={`${isLongOption ? "flex flex-col" : "grid grid-cols-2"} gap-3 mb-4`}>
                  {riddle.options.map((opt) => {
                    let bg = "rgba(255,200,50,0.06)";
                    let border = "rgba(255,200,50,0.2)";
                    let textColor = "#FFD090";
                    if (selectedOption !== null) {
                      if (opt === riddle.answer) {
                        bg = "rgba(34,197,94,0.15)"; border = "#22C55E"; textColor = "#4ADE80";
                      } else if (opt === selectedOption && !isCorrect) {
                        bg = "rgba(239,68,68,0.15)"; border = "#EF4444"; textColor = "#FCA5A5";
                      }
                    }
                    return (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(opt)}
                        disabled={selectedOption !== null}
                        className="w-full rounded-xl text-center font-semibold transition-all active:scale-95 disabled:cursor-default"
                        style={{
                          background: bg,
                          border: `1.5px solid ${border}`,
                          color: textColor,
                          fontSize: isLongOption ? "14px" : "16px",
                          letterSpacing: isLongOption ? "0.02em" : "0.04em",
                          padding: isLongOption ? "12px 14px" : "16px 12px",
                          minHeight: isLongOption ? 48 : 60,
                          textAlign: "left",
                          lineHeight: "1.6",
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* 解析 */}
            {showExplanation && (
              <div className="rounded-xl p-4 mb-4"
                style={{
                  background: isCorrect ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                  border: `1px solid ${isCorrect ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{isCorrect ? "✅" : "❌"}</span>
                  <span className="font-semibold text-sm" style={{ color: isCorrect ? "#4ADE80" : "#FCA5A5" }}>
                    {isCorrect ? `答对了！+${timeLeft > 10 ? 20 : timeLeft > 5 ? 15 : 10}分` : `正确答案：${riddle.answer}`}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#FFD09099", lineHeight: "1.7" }}>
                  {riddle.explanation}
                </p>
              </div>
            )}

            {/* 下一题按钮 */}
            {showExplanation && (
              <button
                onClick={handleNext}
                className="w-full py-4 rounded-xl font-bold text-base transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #E84545, #FF8C00)",
                  color: "white",
                  letterSpacing: "0.08em",
                  boxShadow: "0 4px 16px rgba(232,69,69,0.4)",
                }}
              >
                {currentIdx >= riddles.length - 1 ? "🏮 查看结果" : "下一题 →"}
              </button>
            )}
          </div>
        )}

        {/* ===== 结果页 ===== */}
        {phase === "result" && (
          <div className="w-full max-w-md mt-4">
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,200,50,0.06)", border: "1px solid rgba(255,200,50,0.3)" }}>
              <div className="p-6 text-center">
                <div className="text-5xl mb-3">🏮</div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: "#FFD700", letterSpacing: "0.1em" }}>
                  {resultTitle}
                </h2>
                <div className="text-4xl font-bold my-4" style={{ color: "#FF8C00" }}>
                  {score} <span className="text-lg" style={{ color: "#FFD070" }}>/ {maxScore} 分</span>
                </div>
                <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(0,0,0,0.25)" }}>
                  <p className="text-sm leading-relaxed" style={{ color: "#FFD090", lineHeight: "1.8" }}>
                    {resultMsg}
                  </p>
                </div>

                {/* 新解锁成就 */}
                {newAchievements.length > 0 && (
                  <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.4)" }}>
                    <div className="text-xs font-semibold mb-2" style={{ color: "#FFD700" }}>🏆 解锁新成就！</div>
                    {newAchievements.map((a, i) => (
                      <div key={i} className="text-sm font-bold" style={{ color: "#FFF176" }}>{a}</div>
                    ))}
                  </div>
                )}

                {/* 统计 */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="rounded-xl p-3" style={{ background: "rgba(255,200,50,0.08)" }}>
                    <div className="text-xl font-bold" style={{ color: "#FFD700" }}>{totalRiddles}</div>
                    <div className="text-xs mt-1" style={{ color: "#FFA040" }}>共答题</div>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: "rgba(34,197,94,0.08)" }}>
                    <div className="text-xl font-bold" style={{ color: "#4ADE80" }}>{Math.round(score / 15)}</div>
                    <div className="text-xs mt-1" style={{ color: "#86EFAC" }}>答对约</div>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: "rgba(255,200,50,0.08)" }}>
                    <div className="text-xl font-bold" style={{ color: "#FFD700" }}>{pct}%</div>
                    <div className="text-xs mt-1" style={{ color: "#FFA040" }}>正确率</div>
                  </div>
                </div>

                <button
                  onClick={initGame}
                  className="w-full py-4 rounded-xl font-bold text-base mb-3 transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #E84545, #FF8C00)",
                    color: "white",
                    letterSpacing: "0.08em",
                    boxShadow: "0 4px 16px rgba(232,69,69,0.4)",
                  }}
                >
                  🔄 再猜一轮
                </button>
                <button
                  onClick={() => navigate("/game")}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm mb-2 transition-all active:scale-95"
                  style={{
                    background: "rgba(255,200,50,0.1)",
                    border: "1px solid rgba(255,200,50,0.3)",
                    color: "#FFD700",
                    letterSpacing: "0.06em",
                  }}
                >
                  📜 去诗词答题
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full py-2.5 text-sm transition-all"
                  style={{ color: "#FFA04066" }}
                >
                  返回首页
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <BottomNav />

      {/* 灯笼摇摆动画 */}
      <style>{`
        @keyframes swing {
          from { transform: rotate(-5deg); }
          to { transform: rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
