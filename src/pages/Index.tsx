import PnlChart, { HistoryEntry, UIBot, ChartVariant } from "@/components/PnlChart";
import { useState, useMemo } from "react";

const BOTS: UIBot[] = [
  { botId: "bot1", strategy: "Momentum Alpha", livePnl: 342.5, realizedPnl: 280.1 },
  { botId: "bot2", strategy: "Mean Reversion", livePnl: -124.3, realizedPnl: -89.7 },
  { botId: "bot3", strategy: "Scalper V2", livePnl: 78.9, realizedPnl: 156.2 },
  { botId: "bot4", strategy: "Grid Trader", livePnl: -45.2, realizedPnl: 12.4 },
];

// Generate ~1 week of data at 1-minute intervals (10080 points)
function generateHistory(): HistoryEntry[] {
  const now = Date.now();
  const count = 10080;
  const entries: HistoryEntry[] = [];
  const pnls = [0, 0, 0, 0];
  for (let i = 0; i < count; i++) {
    pnls[0] += (Math.random() - 0.4) * 15;
    pnls[1] += (Math.random() - 0.55) * 12;
    pnls[2] += (Math.random() - 0.45) * 8;
    pnls[3] += (Math.random() - 0.52) * 10;
    entries.push({
      t: now - (count - i) * 60000,
      bots: BOTS.map((b, j) => ({ id: b.botId, pnl: Math.round(pnls[j] * 100) / 100 })),
    });
  }
  return entries;
}

const HISTORY = generateHistory();

type TimeRange = "1H" | "4H" | "1D" | "1W";
const TIME_RANGES: { key: TimeRange; label: string; ms: number }[] = [
  { key: "1H", label: "1H", ms: 60 * 60 * 1000 },
  { key: "4H", label: "4H", ms: 4 * 60 * 60 * 1000 },
  { key: "1D", label: "1D", ms: 24 * 60 * 60 * 1000 },
  { key: "1W", label: "1W", ms: 7 * 24 * 60 * 60 * 1000 },
];

const VARIANTS: { key: ChartVariant; label: string }[] = [
  { key: "minimal", label: "Minimal" },
  { key: "grid-glow", label: "Grid Glow" },
  { key: "split-area", label: "Split Area" },
  { key: "neon", label: "Neon" },
];

const btnStyle = (active: boolean) => ({
  padding: "6px 14px",
  borderRadius: 6,
  fontSize: 13,
  border: "1px solid #30363d",
  background: active ? "#58a6ff" : "#161b22",
  color: active ? "#0d1117" : "#8b949e",
  cursor: "pointer" as const,
  fontWeight: active ? 600 : 400,
});

const Index = () => {
  const [variant, setVariant] = useState<ChartVariant>("minimal");
  const [range, setRange] = useState<TimeRange>("1H");

  const filteredHistory = useMemo(() => {
    const cutoff = Date.now() - TIME_RANGES.find((r) => r.key === range)!.ms;
    return HISTORY.filter((e) => e.t >= cutoff);
  }, [range]);

  return (
    <div style={{ background: "#0d1117", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ color: "#c9d1d9", fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
          PnL Chart — Variants
        </h1>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          {VARIANTS.map((v) => (
            <button key={v.key} onClick={() => setVariant(v.key)} style={btnStyle(variant === v.key)}>
              {v.label}
            </button>
          ))}
          <span style={{ width: 1, height: 20, background: "#30363d", margin: "0 6px" }} />
          {TIME_RANGES.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)} style={btnStyle(range === r.key)}>
              {r.label}
            </button>
          ))}
        </div>
        <PnlChart history={filteredHistory} bots={BOTS} mode="live" variant={variant} />
      </div>
    </div>
  );
};

export default Index;
