import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// --- Types ---

export interface HistoryEntry {
  t: number;
  bots: { id: string; pnl: number }[];
}

export interface UIBot {
  botId: string;
  strategy: string;
  livePnl: number;
  realizedPnl: number;
}

export type ChartVariant = "minimal" | "grid-glow" | "split-area" | "neon";

export interface PnlChartProps {
  history: HistoryEntry[];
  bots: UIBot[];
  mode: "live" | "realized";
  variant?: ChartVariant;
}

// --- Constants ---

const LINE_COLORS = [
  "#58a6ff",
  "#f0883e",
  "#3fb950",
  "#d2a8ff",
  "#f778ba",
  "#79c0ff",
  "#ffd33d",
  "#a5d6ff",
];

const BG = "#0d1117";
const GRID_COLOR = "#21262d";
const AXIS_COLOR = "#8b949e";
const ZERO_LINE_COLOR = "rgba(255,255,255,0.15)";
const MIN_HEIGHT = 200;
const MAX_HEIGHT = 800;

// --- Helpers ---

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatUsd(v: number) {
  return v >= 0 ? `$${v.toFixed(2)}` : `-$${Math.abs(v).toFixed(2)}`;
}

function pnlColor(v: number) {
  return v >= 0 ? "#3fb950" : "#f85149";
}

// --- Resize Hook ---

function useVerticalResize(initialHeight: number) {
  const [height, setHeight] = useState(initialHeight);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startY.current = e.clientY;
      startH.current = height;

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const delta = ev.clientY - startY.current;
        setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startH.current + delta)));
      };
      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [height]
  );

  return { height, onMouseDown };
}

// --- Sub-components ---

function ChartLegend({
  bots,
  mode,
  colors,
}: {
  bots: UIBot[];
  mode: "live" | "realized";
  colors: string[];
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 20px", padding: "0 0 10px 0" }}>
      {bots.map((b, i) => {
        const val = mode === "live" ? b.livePnl : b.realizedPnl;
        return (
          <div key={b.botId} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: colors[i % colors.length],
                display: "inline-block",
              }}
            />
            <span style={{ color: "#c9d1d9" }}>{b.strategy}</span>
            <span style={{ color: pnlColor(val), fontWeight: 600 }}>{formatUsd(val)}</span>
          </div>
        );
      })}
    </div>
  );
}

function ChartTooltipContent({ active, payload, label, bots }: any) {
  if (!active || !payload?.length) return null;
  const items = payload
    .map((p: any) => ({
      name: bots.find((b: UIBot) => b.botId === p.dataKey)?.strategy ?? p.dataKey,
      value: p.value as number,
      color: p.stroke,
    }))
    .sort((a: any, b: any) => b.value - a.value);

  return (
    <div
      style={{
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 6,
        padding: "8px 12px",
        fontSize: 12,
      }}
    >
      <div style={{ color: AXIS_COLOR, marginBottom: 4 }}>{formatTime(label)}</div>
      {items.map((it: any) => (
        <div key={it.name} style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
          <span style={{ color: it.color }}>{it.name}</span>
          <span style={{ color: pnlColor(it.value), fontWeight: 600 }}>{formatUsd(it.value)}</span>
        </div>
      ))}
    </div>
  );
}

function NeonDefs() {
  return (
    <defs>
      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

// --- Resize Handle ---

function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        height: 8,
        cursor: "ns-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderTop: "1px solid #21262d",
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: 40,
          height: 3,
          borderRadius: 2,
          background: "#30363d",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#58a6ff")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#30363d")}
      />
    </div>
  );
}

// --- Main Component ---

const PnlChart: React.FC<PnlChartProps> = ({
  history,
  bots,
  mode,
  variant = "minimal",
}) => {
  const botIds = useMemo(() => bots.map((b) => b.botId), [bots]);
  const { height, onMouseDown } = useVerticalResize(360);

  const data = useMemo(
    () =>
      history.map((entry) => {
        const row: Record<string, number> = { t: entry.t };
        entry.bots.forEach((b) => {
          row[b.id] = b.pnl;
        });
        return row;
      }),
    [history]
  );

  const isNeon = variant === "neon";
  const showGrid = variant === "grid-glow" || variant === "neon";
  const strokeW = isNeon ? 2.5 : 1.5;

  const sharedXAxis = (
    <XAxis
      dataKey="t"
      tickFormatter={formatTime}
      tick={{ fill: AXIS_COLOR, fontSize: 11 }}
      axisLine={{ stroke: GRID_COLOR }}
      tickLine={false}
    />
  );

  const sharedYAxis = (
    <YAxis
      tickFormatter={(v) => `$${v}`}
      tick={{ fill: AXIS_COLOR, fontSize: 11 }}
      axisLine={false}
      tickLine={false}
    />
  );

  const sharedTooltip = (
    <Tooltip
      content={(props: any) => (
        <ChartTooltipContent {...props} bots={bots} />
      )}
    />
  );

  if (variant === "split-area") {
    return (
      <div style={{ background: BG, borderRadius: 8, padding: "16px 12px 0" }}>
        <ChartLegend bots={bots} mode={mode} colors={LINE_COLORS} />
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <defs>
              {botIds.map((id) => (
                <React.Fragment key={id}>
                  <linearGradient id={`grad-pos-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3fb950" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3fb950" stopOpacity={0} />
                  </linearGradient>
                </React.Fragment>
              ))}
            </defs>
            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
            {sharedXAxis}
            {sharedYAxis}
            <ReferenceLine y={0} stroke={ZERO_LINE_COLOR} strokeWidth={1} />
            {sharedTooltip}
            {botIds.map((id, i) => (
              <Area
                key={id}
                type="monotone"
                dataKey={id}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={1.5}
                fill={`url(#grad-pos-${id})`}
                dot={false}
                isAnimationActive={false}
                activeDot={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        <ResizeHandle onMouseDown={onMouseDown} />
      </div>
    );
  }

  return (
    <div style={{ background: BG, borderRadius: 8, padding: "16px 12px 0" }}>
      <ChartLegend bots={bots} mode={mode} colors={LINE_COLORS} />
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          {isNeon && <NeonDefs />}
          {showGrid && (
            <CartesianGrid
              stroke={variant === "neon" ? "#1a2233" : GRID_COLOR}
              strokeDasharray={variant === "neon" ? undefined : "3 3"}
              vertical={false}
            />
          )}
          {sharedXAxis}
          {sharedYAxis}
          <ReferenceLine y={0} stroke={ZERO_LINE_COLOR} strokeWidth={1} />
          {sharedTooltip}
          {botIds.map((id, i) => (
            <Line
              key={id}
              type="monotone"
              dataKey={id}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={strokeW}
              dot={false}
              isAnimationActive={false}
              activeDot={false}
              style={isNeon ? { filter: "url(#neonGlow)" } : undefined}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <ResizeHandle onMouseDown={onMouseDown} />
    </div>
  );
};
export default PnlChart;
