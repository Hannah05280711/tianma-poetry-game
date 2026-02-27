import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

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
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4"
        style={{ background: "oklch(0.10 0.025 270)" }}>
        <div className="text-5xl float-anim">📅</div>
        <p className="text-muted-foreground text-sm">请先登录查看每日任务</p>
        <a href={getLoginUrl()}
          className="px-6 py-2.5 rounded-xl font-bold text-sm"
          style={{ background: "oklch(0.72 0.18 35)", color: "oklch(0.10 0.02 270)" }}>
          立即登录
        </a>
      </div>
    );
  }

  const completedCount = tasks?.filter(t => t.completed).length ?? 0;
  const totalCount = tasks?.length ?? 0;

  return (
    <div className="min-h-screen page-content px-4 pt-safe" style={{ background: "oklch(0.10 0.025 270)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 py-4 mb-2">
        <button onClick={() => navigate("/")} className="text-muted-foreground text-xl">‹</button>
        <h1 className="font-bold text-lg font-display">📅 每日任务</h1>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl p-4 mb-4"
        style={{ background: "linear-gradient(135deg, oklch(0.18 0.06 290), oklch(0.14 0.04 270))", border: "1px solid oklch(0.30 0.08 290 / 0.5)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-bold">今日进度</div>
            <div className="text-xs text-muted-foreground">{completedCount}/{totalCount} 任务完成</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">连续签到</div>
            <div className="text-lg font-bold" style={{ color: "oklch(0.78 0.18 85)" }}>
              {gameState?.consecutiveLoginDays ?? 0} 天
            </div>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.04 270)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%",
              background: "linear-gradient(90deg, oklch(0.72 0.18 35), oklch(0.78 0.18 85))",
            }} />
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-3 mb-6">
        {tasks?.map((task) => (
          <div key={task.taskKey}
            className="rounded-2xl p-4 transition-all"
            style={{
              background: task.completed ? "oklch(0.72 0.18 35 / 0.08)" : "oklch(0.16 0.03 270)",
              border: `1px solid ${task.completed ? "oklch(0.72 0.18 35 / 0.3)" : "oklch(0.26 0.05 270)"}`,
            }}>
            <div className="flex items-center gap-3">
              <div className="text-2xl flex-shrink-0">{task.iconEmoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{task.taskName}</span>
                  {task.completed && !task.claimed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse"
                      style={{ background: "oklch(0.72 0.18 35 / 0.2)", color: "oklch(0.72 0.18 35)" }}>
                      可领取
                    </span>
                  )}
                  {task.claimed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: "oklch(0.22 0.04 270)", color: "oklch(0.55 0.05 80)" }}>
                      已领取
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{task.description}</div>

                {/* Progress bar for multi-step tasks */}
                {(task.targetCount ?? 1) > 1 && (
                  <div className="mt-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                      <span>{task.progress ?? 0}/{task.targetCount ?? 1}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.04 270)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, ((task.progress ?? 0) / (task.targetCount ?? 1)) * 100)}%`,
                          background: "oklch(0.72 0.18 35)",
                        }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Reward & action */}
              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-muted-foreground mb-1">
                  {(task.rewardScore ?? 0) > 0 && <span style={{ color: "oklch(0.78 0.18 85)" }}>+{task.rewardScore}分</span>}
                  {(task.rewardHints ?? 0) > 0 && <span className="ml-1" style={{ color: "oklch(0.72 0.18 35)" }}>+{task.rewardHints}💡</span>}
                  {(task.rewardInk ?? 0) > 0 && <span className="ml-1" style={{ color: "oklch(0.62 0.18 190)" }}>+{task.rewardInk}💧</span>}
                </div>
                {task.completed && !task.claimed ? (
                  <button
                    onClick={() => claimMutation.mutate({ taskKey: task.taskKey })}
                    disabled={claimMutation.isPending}
                    className="px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95"
                    style={{ background: "oklch(0.72 0.18 35)", color: "oklch(0.10 0.02 270)" }}
                  >
                    领取
                  </button>
                ) : task.claimed ? (
                  <div className="text-xl">✅</div>
                ) : (
                  <button
                    onClick={() => navigate("/game")}
                    className="px-3 py-1 rounded-lg text-xs transition-all"
                    style={{ background: "oklch(0.20 0.04 270)", color: "oklch(0.60 0.05 80)" }}
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
      <div className="rounded-2xl p-4 mb-4"
        style={{ background: "oklch(0.16 0.03 270)", border: "1px solid oklch(0.26 0.05 270)" }}>
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <span>🔥</span> 连续签到奖励
        </h3>
        <div className="flex gap-2">
          {[1, 3, 7, 14, 30].map((day) => {
            const current = gameState?.consecutiveLoginDays ?? 0;
            const achieved = current >= day;
            return (
              <div key={day}
                className="flex-1 text-center py-2 rounded-xl"
                style={{
                  background: achieved ? "oklch(0.72 0.18 35 / 0.15)" : "oklch(0.20 0.04 270)",
                  border: `1px solid ${achieved ? "oklch(0.72 0.18 35 / 0.4)" : "oklch(0.26 0.05 270)"}`,
                }}>
                <div className="text-lg">{achieved ? "✅" : "🔒"}</div>
                <div className="text-[10px] font-bold mt-0.5" style={{ color: achieved ? "oklch(0.72 0.18 35)" : "oklch(0.45 0.05 80)" }}>
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
