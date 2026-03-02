import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { fbTaskComplete } from "@/lib/feedback";
import { loadLocalState, type LocalGameState } from "@/lib/localGameState";

// 本地每日任务存储
const DAILY_TASKS_KEY = "tianma_daily_tasks";
const DAILY_DATE_KEY = "tianma_daily_date";

interface LocalTask {
  taskKey: string;
  taskName: string;
  description: string;
  iconEmoji: string;
  rewardScore: number;
  rewardHints: number;
  rewardInk: number;
  completed: boolean;
  claimed: boolean;
  progress: number;
  targetCount: number;
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultTasks(state: LocalGameState): LocalTask[] {
  const answered = state.totalAnswered;
  const correct = state.totalCorrect;
  return [
    {
      taskKey: "daily_visit",
      taskName: "今日到访",
      description: "打开游戏即可领取",
      iconEmoji: "🌅",
      rewardScore: 10,
      rewardHints: 1,
      rewardInk: 0,
      completed: true, // 打开页面即完成
      claimed: false,
      progress: 1,
      targetCount: 1,
    },
    {
      taskKey: "answer_5",
      taskName: "答题达人",
      description: "今日完成 5 道题目",
      iconEmoji: "✏️",
      rewardScore: 20,
      rewardHints: 0,
      rewardInk: 1,
      completed: answered >= 5,
      claimed: false,
      progress: Math.min(answered, 5),
      targetCount: 5,
    },
    {
      taskKey: "correct_3",
      taskName: "连对三题",
      description: "今日连续答对 3 道",
      iconEmoji: "🔥",
      rewardScore: 30,
      rewardHints: 1,
      rewardInk: 0,
      completed: correct >= 3,
      claimed: false,
      progress: Math.min(correct, 3),
      targetCount: 3,
    },
  ];
}

function loadDailyTasks(state: LocalGameState): LocalTask[] {
  try {
    const today = getTodayStr();
    const savedDate = localStorage.getItem(DAILY_DATE_KEY);
    if (savedDate === today) {
      const raw = localStorage.getItem(DAILY_TASKS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as LocalTask[];
        // 更新进度（答题数可能已增加）
        return saved.map((t) => {
          if (t.claimed) return t;
          if (t.taskKey === "answer_5") {
            const prog = Math.min(state.totalAnswered, 5);
            return { ...t, progress: prog, completed: prog >= 5 };
          }
          if (t.taskKey === "correct_3") {
            const prog = Math.min(state.totalCorrect, 3);
            return { ...t, progress: prog, completed: prog >= 3 };
          }
          return t;
        });
      }
    }
    // 新的一天，重置
    const tasks = getDefaultTasks(state);
    localStorage.setItem(DAILY_DATE_KEY, today);
    localStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(tasks));
    return tasks;
  } catch {
    return getDefaultTasks(state);
  }
}

function saveDailyTasks(tasks: LocalTask[]) {
  try {
    localStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(tasks));
  } catch { /* ignore */ }
}

export default function Daily() {
  const [, navigate] = useLocation();
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [localState, setLocalState] = useState<LocalGameState | null>(null);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    const state = loadLocalState();
    setLocalState(state);
    setStreakDays(state.dailyStreak ?? 0);
    const t = loadDailyTasks(state);
    setTasks(t);
  }, []);

  // 刷新本地状态（答题后回来）
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        const state = loadLocalState();
        setLocalState(state);
        const t = loadDailyTasks(state);
        setTasks(t);
      }
    };
    document.addEventListener("visibilitychange", handleVisible);
    return () => document.removeEventListener("visibilitychange", handleVisible);
  }, []);

  const handleClaim = (taskKey: string) => {
    const task = tasks.find((t) => t.taskKey === taskKey);
    if (!task || !task.completed || task.claimed) return;

    // 本地发放奖励
    try {
      const raw = localStorage.getItem("tianma_game_state");
      if (raw) {
        const state = JSON.parse(raw);
        state.totalScore = (state.totalScore ?? 0) + task.rewardScore;
        state.hintsCount = (state.hintsCount ?? 0) + task.rewardHints;
        state.inkDrops = (state.inkDrops ?? 0) + task.rewardInk;
        localStorage.setItem("tianma_game_state", JSON.stringify(state));
      }
    } catch { /* ignore */ }

    const updated = tasks.map((t) =>
      t.taskKey === taskKey ? { ...t, claimed: true } : t
    );
    setTasks(updated);
    saveDailyTasks(updated);

    const msgs: string[] = [];
    if (task.rewardScore > 0) msgs.push(`+${task.rewardScore}分`);
    if (task.rewardHints > 0) msgs.push(`+${task.rewardHints}💡`);
    if (task.rewardInk > 0) msgs.push(`+${task.rewardInk}💧`);
    toast.success(`🎉 领取成功！${msgs.join(" ")}`);
    fbTaskComplete();
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen page-content px-4 pt-safe bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 mb-2 border-b border-border">
        <button onClick={() => navigate("/")} className="text-muted-foreground text-xl leading-none">‹</button>
        <h1 className="font-semibold text-base font-display text-foreground">📅 每日任务</h1>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl p-4 mb-4 border"
        style={{
          background: "linear-gradient(135deg, #FFF5F5 0%, #FFFDF9 100%)",
          borderColor: "oklch(0.55 0.20 25 / 0.18)",
        }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-foreground">今日进度</div>
            <div className="text-xs text-muted-foreground">{completedCount}/{totalCount} 任务完成</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">连续签到</div>
            <div className="text-lg font-bold" style={{ color: "var(--gold)" }}>
              {streakDays} 天
            </div>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-muted">
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%",
              background: "linear-gradient(90deg, var(--vermilion), var(--gold))",
            }} />
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-3 mb-6">
        {tasks.map((task) => (
          <div key={task.taskKey}
            className="rounded-2xl p-4 transition-all border"
            style={{
              background: task.completed ? "oklch(0.55 0.20 25 / 0.05)" : "var(--card)",
              borderColor: task.completed ? "oklch(0.55 0.20 25 / 0.25)" : "var(--border)",
            }}>
            <div className="flex items-center gap-3">
              <div className="text-2xl flex-shrink-0">{task.iconEmoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{task.taskName}</span>
                  {task.completed && !task.claimed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold animate-pulse"
                      style={{ background: "var(--vermilion-pale)", color: "var(--vermilion)" }}>
                      可领取
                    </span>
                  )}
                  {task.claimed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      已领取
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{task.description}</div>

                {task.targetCount > 1 && (
                  <div className="mt-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                      <span>{task.progress}/{task.targetCount}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (task.progress / task.targetCount) * 100)}%`,
                          background: "var(--vermilion)",
                        }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-muted-foreground mb-1">
                  {task.rewardScore > 0 && <span style={{ color: "var(--gold)" }}>+{task.rewardScore}分</span>}
                  {task.rewardHints > 0 && <span className="ml-1" style={{ color: "var(--vermilion)" }}>+{task.rewardHints}💡</span>}
                  {task.rewardInk > 0 && <span className="ml-1" style={{ color: "var(--celadon)" }}>+{task.rewardInk}💧</span>}
                </div>
                {task.completed && !task.claimed ? (
                  <button
                    onClick={() => handleClaim(task.taskKey)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95 text-white"
                    style={{ background: "var(--vermilion)" }}
                  >
                    领取
                  </button>
                ) : task.claimed ? (
                  <div className="text-xl">✅</div>
                ) : (
                  <button
                    onClick={() => navigate("/game")}
                    className="px-3 py-1 rounded-lg text-xs transition-all bg-muted text-muted-foreground"
                  >
                    去完成
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sign-in streak */}
      <div className="rounded-2xl p-4 mb-4 bg-card border border-border">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-foreground">
          <span>🔥</span> 连续签到奖励
        </h3>
        <div className="flex gap-2">
          {[1, 3, 7, 14, 30].map((day) => {
            const achieved = streakDays >= day;
            return (
              <div key={day}
                className="flex-1 text-center py-2 rounded-xl border"
                style={{
                  background: achieved ? "var(--vermilion-pale)" : "var(--muted)",
                  borderColor: achieved ? "oklch(0.55 0.20 25 / 0.30)" : "var(--border)",
                }}>
                <div className="text-lg">{achieved ? "✅" : "🔒"}</div>
                <div className="text-[10px] font-semibold mt-0.5"
                  style={{ color: achieved ? "var(--vermilion)" : "var(--ink-pale)" }}>
                  {day}天
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
