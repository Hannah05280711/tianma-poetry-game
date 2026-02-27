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
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4 bg-background">
        <div className="text-5xl float-anim">📅</div>
        <p className="text-muted-foreground text-sm">请先登录查看每日任务</p>
        <a href={getLoginUrl()}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
          style={{ background: "var(--vermilion)" }}>
          立即登录
        </a>
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
