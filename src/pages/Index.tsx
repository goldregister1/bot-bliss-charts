import PnlChart, { HistoryEntry, UIBot, ChartVariant } from "@/components/PnlChart";
import { useState } from "react";

const BOTS: UIBot[] = [
  { botId: "bot1", strategy: "Momentum Alpha", livePnl: 342.5, realizedPnl: 280.1 },
  { botId: "bot2", strategy: "Mean Reversion", livePnl: -124.3, realizedPnl: -89.7 },
  { botId: "bot3", strategy: "Scalper V2", livePnl: 78.9, realizedPnl: 156.2 },
  { botId: "bot4", strategy: "Grid Trader", livePnl: -45.2, realizedPnl: 12.4 },
];

function generateHistory(): HistoryEntry[] {
  const now = Date.now();
  const entries: HistoryEntry[] = [];
  const pnls = [0, 0, 0, 0];
  for (let i = 0; i < 60; i++) {
    pnls[0] += (Math.random() - 0.4) * 15;
    pnls[1] += (Math.random() - 0.55) * 12;
    pnls[2] += (Math.random() - 0.45) * 8;
    pnls[3] += (Math.random() - 0.52) * 10;
    entries.push({
      t: now - (60 - i) * 60000,
      bots: BOTS.map((b, j) => ({ id: b.botId, pnl: Math.round(pnls[j] * 100) / 100 })),
    });
  }
  return entries;
}

const HISTORY = generateHistory();
const VARIANTS: { key: ChartVariant; label: string }[] = [
  { key: "minimal", label: "Minimal" },
  { key: "grid-glow", label: "Grid Glow" },
  { key: "split-area", label: "Split Area" },
  { key: "neon", label: "Neon" },
];

const Index = () => {
  const [variant, setVariant] = useState<ChartVariant>("minimal");

  return (
    <div style={{ background: "#0d1117", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ color: "#c9d1d9", fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
          PnL Chart — Variants
        </h1>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {VARIANTS.map((v) => (
            <button
              key={v.key}
              onClick={() => setVariant(v.key)}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 13,
                border: "1px solid #30363d",
                background: variant === v.key ? "#58a6ff" : "#161b22",
                color: variant === v.key ? "#0d1117" : "#8b949e",
                cursor: "pointer",
                fontWeight: variant === v.key ? 600 : 400,
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <PnlChart history={HISTORY} bots={BOTS} mode="live" variant={variant} />
      </div>
    </div>
  );
};

export default Index;
