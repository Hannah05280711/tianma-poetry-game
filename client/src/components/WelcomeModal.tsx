import { useState, useEffect } from "react";
import { updateLocalNickname } from "@/lib/localGameState";

const WELCOME_KEY = "tianma_welcome_shown_v1";

// 随机生成昵称
function generateNickname(): string {
  const adjectives = ["飞花", "踏雪", "听雨", "望月", "抚琴", "煮酒", "赏梅", "问柳", "寻芳", "醉墨"];
  const nouns = ["剑客", "书生", "侠士", "词人", "墨客", "诗仙", "才子", "雅士", "隐者", "游侠"];
  const num = Math.floor(Math.random() * 9000) + 1000;
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]!;
  const noun = nouns[Math.floor(Math.random() * nouns.length)]!;
  return `${adj}${noun}_${num}`;
}

interface Step {
  emoji: string;
  title: string;
  desc: string;
}

const STEPS: Step[] = [
  {
    emoji: "📜",
    title: "答题闯关",
    desc: "从青铜到王者，共 20 级兵器谱段位，答对得分，答错扣分，连胜有加成！",
  },
  {
    emoji: "✨",
    title: "解锁本命诗人",
    desc: "累计答满 100 题，系统根据你的答题风格匹配最契合的本命诗人，并生成专属藏头诗。",
  },
  {
    emoji: "🎁",
    title: "每日任务",
    desc: "每天完成答题任务可获得提示卡和护身符道具，助你在高难度关卡中披荆斩棘。",
  },
];

export default function WelcomeModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [inputNick, setInputNick] = useState("");

  useEffect(() => {
    const shown = localStorage.getItem(WELCOME_KEY);
    if (!shown) {
      const gen = generateNickname();
      setNickname(gen);
      setInputNick(gen);
      setVisible(true);
    }
  }, []);

  function handleClose() {
    // 保存昵称
    const finalNick = inputNick.trim() || nickname;
    updateLocalNickname(finalNick);
    localStorage.setItem(WELCOME_KEY, "1");
    setVisible(false);
  }

  function handleNext() {
    if (step < STEPS.length) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  }

  if (!visible) return null;

  const isNickStep = step === STEPS.length;
  const currentStep = STEPS[step];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{
          background: "var(--background)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
      >
        {/* 顶部装饰条 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>

        {/* 步骤指示器 */}
        <div className="flex justify-center gap-1.5 py-3">
          {[...STEPS, { emoji: "", title: "", desc: "" }].map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === step ? "20px" : "6px",
                height: "6px",
                background: i === step ? "var(--vermilion)" : "var(--border)",
              }}
            />
          ))}
        </div>

        <div className="px-6 pb-6">
          {!isNickStep && currentStep ? (
            /* 玩法介绍步骤 */
            <div className="text-center">
              {step === 0 && (
                <div className="mb-4">
                  <h2
                    className="font-display mb-1"
                    style={{ fontSize: "22px", color: "var(--foreground)", letterSpacing: "0.08em" }}
                  >
                    欢迎来到天马行空
                  </h2>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    你的本命诗人正在等待觉醒
                  </p>
                </div>
              )}

              <div
                className="rounded-2xl p-5 mb-5 border"
                style={{
                  background: "linear-gradient(135deg, var(--vermilion-pale) 0%, var(--card) 100%)",
                  borderColor: "oklch(0.55 0.20 25 / 0.18)",
                }}
              >
                <div className="text-5xl mb-3">{currentStep.emoji}</div>
                <h3
                  className="font-display mb-2"
                  style={{ fontSize: "18px", color: "var(--foreground)", letterSpacing: "0.06em" }}
                >
                  {currentStep.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--muted-foreground)", lineHeight: "1.7" }}
                >
                  {currentStep.desc}
                </p>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3 rounded-2xl font-bold text-base text-white transition-all active:scale-95"
                style={{
                  background: "var(--vermilion)",
                  boxShadow: "0 4px 14px oklch(0.50 0.19 22 / 0.28)",
                  letterSpacing: "0.06em",
                }}
              >
                {step < STEPS.length - 1 ? "下一步 →" : "知道了，设置昵称"}
              </button>

              <button
                onClick={handleClose}
                className="mt-3 w-full py-2 text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                跳过引导，直接开始
              </button>
            </div>
          ) : (
            /* 昵称设置步骤 */
            <div>
              <div className="text-center mb-5">
                <div className="text-4xl mb-2">👤</div>
                <h3
                  className="font-display mb-1"
                  style={{ fontSize: "18px", color: "var(--foreground)", letterSpacing: "0.06em" }}
                >
                  给自己起个名号
                </h3>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  可随时在「个人档案」中修改
                </p>
              </div>

              <div className="mb-5">
                <input
                  type="text"
                  value={inputNick}
                  onChange={(e) => setInputNick(e.target.value)}
                  maxLength={16}
                  placeholder="输入你的江湖名号..."
                  className="w-full rounded-xl px-4 py-3 text-base border outline-none transition-all"
                  style={{
                    background: "var(--card)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--vermilion)";
                    e.target.style.boxShadow = "0 0 0 3px oklch(0.55 0.20 25 / 0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <div className="flex justify-between mt-1.5 px-1">
                  <button
                    onClick={() => {
                      const gen = generateNickname();
                      setInputNick(gen);
                    }}
                    className="text-xs"
                    style={{ color: "var(--vermilion)" }}
                  >
                    🎲 随机生成
                  </button>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {inputNick.length}/16
                  </span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-2xl font-bold text-base text-white transition-all active:scale-95"
                style={{
                  background: "var(--vermilion)",
                  boxShadow: "0 4px 14px oklch(0.50 0.19 22 / 0.28)",
                  letterSpacing: "0.06em",
                }}
              >
                开始答题 ✦
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
