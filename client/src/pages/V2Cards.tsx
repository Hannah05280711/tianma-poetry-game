import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface CardData {
  id: number;
  poetName: string;
  imageUrl: string | null;
  rarity: string | null;
  dynasty: string | null;
  signaturePoem: string | null;
  owned: boolean;
}

function getSessionKey(): string {
  let key = localStorage.getItem("v2_session_key");
  if (!key) {
    key = `v2_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("v2_session_key", key);
  }
  return key;
}

const RARITY_LABEL: Record<string, { label: string; color: string }> = {
  common:    { label: "普通",  color: "#CD7F32" },
  rare:      { label: "稀有",  color: "#A8A9AD" },
  epic:      { label: "史诗",  color: "#D4AF37" },
  legendary: { label: "传说",  color: "#FF6B35" },
};

export default function V2Cards() {
  const [, navigate] = useLocation();
  const sessionKey = useMemo(() => getSessionKey(), []);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);

  const { data, isLoading } = trpc.v2.getAllCards.useQuery({ sessionKey });

  const owned = data?.filter(c => c.owned) ?? [];
  const total = data?.length ?? 24;

  const rarityColor = (rarity: string | null) =>
    RARITY_LABEL[rarity ?? "common"]?.color ?? "#CD7F32";

  return (
    <div className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a0a 100%)" }}>

      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(10,10,26,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
        <button onClick={() => navigate("/v2")} className="text-sm" style={{ color: "#D4AF37" }}>
          ← 关卡地图
        </button>
        <div className="text-sm font-medium" style={{ color: "#D4AF37" }}>
          📚 诗人卡牌
        </div>
        <div className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          {owned.length}/{total}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* 收集进度 */}
        <div className="rounded-2xl p-4 mb-6 text-center"
          style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)" }}>
          <div className="text-2xl font-bold mb-1" style={{ color: "#D4AF37" }}>
            {owned.length} / {total}
          </div>
          <div className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>已收集诗人卡牌</div>
          <div className="w-full rounded-full h-2" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(owned.length / total) * 100}%`,
                background: "linear-gradient(to right, #D4AF37, #FFD700)"
              }} />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3 animate-spin">🎴</div>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>加载中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {data?.map((card) => (
              <div key={card.id}
                className="rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  border: `1px solid ${card.owned
                    ? rarityColor(card.rarity) + "60"
                    : "rgba(255,255,255,0.08)"}`,
                  opacity: card.owned ? 1 : 0.4,
                  cursor: card.owned ? "pointer" : "default",
                }}
                onClick={() => card.owned && setSelectedCard(card as CardData)}>
                {/* 图片区域：固定宽高比确保所有卡牌尺寸一致 */}
                <div className="relative" style={{ paddingTop: "133%" }}>
                  {card.owned ? (
                    <img
                      src={card.imageUrl ?? ""}
                      alt={card.poetName}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.03)" }}>
                      <span className="text-4xl opacity-30">?</span>
                    </div>
                  )}
                  {/* 稀有度标签 */}
                  {card.owned && (
                    <div className="absolute top-1 right-1 rounded px-1 py-0.5"
                      style={{
                        background: "rgba(10,10,26,0.8)",
                        color: rarityColor(card.rarity),
                        fontSize: "10px",
                      }}>
                      {RARITY_LABEL[card.rarity ?? "common"]?.label ?? "普通"}
                    </div>
                  )}
                </div>
                <div className="p-2" style={{ background: "rgba(10,10,26,0.9)" }}>
                  <div className="text-xs font-medium text-center"
                    style={{ color: card.owned ? "#D4AF37" : "rgba(255,255,255,0.3)" }}>
                    {card.owned ? card.poetName : "???"}
                  </div>
                  {card.owned && card.dynasty && (
                    <div className="text-center mt-0.5" style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
                      {card.dynasty}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {owned.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎴</div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              还没有卡牌，去闯关获得吧！<br />
              满分通关（10/10）可获得1张诗人卡牌
            </p>
          </div>
        )}

        <div className="h-8" />
      </div>

      {/* 卡牌放大弹窗 */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto px-6 py-16"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="relative w-full mx-auto"
            style={{ maxWidth: "320px" }}
            onClick={e => e.stopPropagation()}
          >
            {/* 关闭按鈕 */}
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute -top-10 right-0 text-2xl leading-none"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              ✕
            </button>

            {/* 卡牌主体 */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: `2px solid ${rarityColor(selectedCard.rarity)}`,
                boxShadow: `0 0 40px ${rarityColor(selectedCard.rarity)}60`,
              }}
            >
              {/* 图片区域：完整显示，不裁切任何部分 */}
              <div className="relative" style={{ background: "#0a0a1a" }}>
                <img
                  src={selectedCard.imageUrl ?? ""}
                  alt={selectedCard.poetName}
                  className="w-full"
                  style={{ display: "block", height: "auto" }}
                />
                <div
                  className="absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold"
                  style={{
                    background: "rgba(10,10,26,0.85)",
                    color: rarityColor(selectedCard.rarity),
                    border: `1px solid ${rarityColor(selectedCard.rarity)}60`,
                  }}
                >
                  {RARITY_LABEL[selectedCard.rarity ?? "common"]?.label ?? "普通"}
                </div>
              </div>

              {/* 信息区域 */}
              <div
                className="px-5 py-5"
                style={{ background: "linear-gradient(135deg, #0d0d24, #0a1a0a)" }}
              >
                {/* 诗人名 */}
                <div className="text-center mb-1">
                  <span
                    className="text-xl font-bold"
                    style={{
                      color: rarityColor(selectedCard.rarity),
                      fontFamily: "Huiwen-MinchoGBK, Noto Serif SC, serif",
                      letterSpacing: "0.15em",
                    }}
                  >
                    {selectedCard.poetName}
                  </span>
                </div>

                {/* 分隔线 */}
                <div
                  className="mb-4"
                  style={{
                    height: "1px",
                    background: `linear-gradient(to right, transparent, ${rarityColor(selectedCard.rarity)}60, transparent)`,
                  }}
                />

                {/* 诗句：每句独占一行，去掉末尾标点，确保完整展示 */}
                {selectedCard.signaturePoem ? (
                  <div className="text-center overflow-x-auto">
                    {selectedCard.signaturePoem
                      .split(/[，。！？、；\n]/)
                      .map(s => s.trim())
                      .filter(s => s.length > 0)
                      .map((line, i) => (
                        <div
                          key={i}
                          style={{
                            color: "rgba(255,255,255,0.88)",
                            fontSize: "15px",
                            lineHeight: "2.2",
                            fontFamily: "Huiwen-MinchoGBK, Noto Serif SC, serif",
                            letterSpacing: "0.1em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {line}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center" style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                    暂无诗句
                  </div>
                )}
              </div>
            </div>

            <p className="text-center mt-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              点击空白处关闭
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
