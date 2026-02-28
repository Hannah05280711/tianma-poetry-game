import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { fbTaskComplete } from "@/lib/feedback";

export default function Daily() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: tasks, refetch } = trpc.game.getDailyTasks.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: gameState } = trpc.game.getState.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const claimMutation = trpc.game.claimTaskReward.useMutation({
    onSuccess: (data) => {
      toast.success(`🎉 领取成功！+${data.rewardScore}分`);
      fbTaskComplete();
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  // 示例任务数据（未登录时展示）
  const mockTasks = [
    { taskKey: "daily_login", taskName: "每日登录", description: "登录即可领取奖励", iconEmoji: "🌅", rewardScore: 10, rewardHints: 1, rewardInk: 0, completed: false, claimed: false, progress: 0, targetCount: 1 },
    { taskKey: "answer_5", taskName: "答题达人", description: "完成 5 道题目", iconEmoji: "✏️", rewardScore: 20, rewardHints: 0, rewardInk: 1, completed: false, claimed: false, progress: 0, targetCount: 5 },
    { taskKey: "correct_3", taskName: "连对三题", description: "连续答对 3 道", iconEmoji: "🔥", rewardScore: 30, rewardHints: 1, rewardInk: 0, completed: false, claimed: false, progress: 0, targetCount: 3 },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen page-content px-4 pt-safe bg-background">
        {/* Header */}
        <div className="flex items-center gap-3 py-4 mb-2 border-b border-border">
          <button onClick={() => navigate("/")} className="text-muted-foreground text-xl leading-none">‹</button>
          <h1 className="font-semibold text-base font-display text-foreground">📅 每日任务</h1>
        </div>

        {/* 示例内容（模糊遗罩） */}
        <div className="relative">
          <div className="opacity-40 pointer-events-none select-none">
            {/* Summary card preview */}
            <div className="rounded-2xl p-4 mb-4 border"
              style={{ background: "linear-gradient(135deg, #FFF5F5 0%, #FFFDF9 100%)", borderColor: "oklch(0.55 0.20 25 / 0.18)" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">今日进度</div>
                  <div className="text-xs text-muted-foreground">0/3 任务完成</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">连续签到</div>
                  <div className="text-lg font-bold" style={{ color: "var(--gold)" }}>0 天</div>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-muted">
                <div className="h-full rounded-full w-0" style={{ background: "linear-gradient(90deg, var(--vermilion), var(--gold))" }} />
              </div>
            </div>

            {/* Task list preview */}
            <div className="space-y-3 mb-4">
              {mockTasks.map((task) => (
                <div key={task.taskKey} className="rounded-2xl p-4 border bg-white"
                  style={{ borderColor: "oklch(0.90 0.01 80)" }}>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl flex-shrink-0">{task.iconEmoji}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-foreground">{task.taskName}</div>
                      <div className="text-xs text-muted-foreground">{task.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs" style={{ color: "var(--gold)" }}>+{task.rewardScore}分</div>
                      <div className="px-3 py-1 rounded-lg text-xs bg-muted text-muted-foreground mt-1">去完成</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 登录引导覆盖层 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(to bottom, transparent 0%, oklch(0.97 0.01 80 / 0.85) 40%, oklch(0.97 0.01 80) 100%)" }}>
            <div className="mt-32 text-center px-6">
              <div className="text-4xl mb-3">📅</div>
              <p className="font-semibold text-base text-foreground mb-1">登录后解锁每日任务</p>
              <p className="text-sm text-muted-foreground">完成任务可获得积分和道具奖励</p>
              <p className="text-xs text-muted-foreground mt-2">小程序登录后自动同步</p>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  const completedCount = tasks?.filter(t => t.completed).length ?? 0;
  const totalCount = tasks?.length ?? 0;

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
              {gameState?.consecutiveLoginDays ?? 0} 天
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
        {tasks?.map((task) => (
          <div key={task.taskKey}
            className="rounded-2xl p-4 transition-all border"
            style={{
              background: task.completed ? "oklch(0.55 0.20 25 / 0.05)" : "white",
              borderColor: task.completed ? "oklch(0.55 0.20 25 / 0.25)" : "oklch(0.90 0.01 80)",
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

                {(task.targetCount ?? 1) > 1 && (
                  <div className="mt-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                      <span>{task.progress ?? 0}/{task.targetCount ?? 1}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, ((task.progress ?? 0) / (task.targetCount ?? 1)) * 100)}%`,
                          background: "var(--vermilion)",
                        }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-muted-foreground mb-1">
                  {(task.rewardScore ?? 0) > 0 && <span style={{ color: "var(--gold)" }}>+{task.rewardScore}分</span>}
                  {(task.rewardHints ?? 0) > 0 && <span className="ml-1" style={{ color: "var(--vermilion)" }}>+{task.rewardHints}💡</span>}
                  {(task.rewardInk ?? 0) > 0 && <span className="ml-1" style={{ color: "var(--celadon)" }}>+{task.rewardInk}💧</span>}
                </div>
                {task.completed && !task.claimed ? (
                  <button
                    onClick={() => claimMutation.mutate({ taskKey: task.taskKey })}
                    disabled={claimMutation.isPending}
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
            const current = gameState?.consecutiveLoginDays ?? 0;
            const achieved = current >= day;
            return (
              <div key={day}
                className="flex-1 text-center py-2 rounded-xl border"
                style={{
                  background: achieved ? "var(--vermilion-pale)" : "oklch(0.96 0.01 80)",
                  borderColor: achieved ? "oklch(0.55 0.20 25 / 0.30)" : "oklch(0.90 0.01 80)",
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
