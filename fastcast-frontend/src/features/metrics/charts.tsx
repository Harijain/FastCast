import { Area, AreaChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const grid = "oklch(1 0 0 / 0.05)";
const axis = "oklch(0.74 0.04 265 / 0.5)";

const tooltipStyle = {
  background: "oklch(0.17 0.04 265)",
  border: "1px solid oklch(1 0 0 / 0.08)",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "var(--font-mono)",
};

export function LatencyAreaChart({ data }: { data: { t: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="lat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.65 0.21 285)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="oklch(0.65 0.21 285)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="t" stroke={axis} tickLine={false} axisLine={false} fontSize={10} tickFormatter={(v) => new Date(v).getHours() + "h"} />
        <YAxis stroke={axis} tickLine={false} axisLine={false} fontSize={10} width={32} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(0)} ms`, "Latency"]} labelFormatter={(v) => new Date(v).toLocaleTimeString()} />
        <Area type="monotone" dataKey="value" stroke="oklch(0.65 0.21 285)" strokeWidth={2} fill="url(#lat)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ThroughputLineChart({ data }: { data: { t: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="t" stroke={axis} tickLine={false} axisLine={false} fontSize={10} tickFormatter={(v) => new Date(v).getHours() + "h"} />
        <YAxis stroke={axis} tickLine={false} axisLine={false} fontSize={10} width={36} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(0)} Mbps`, "Throughput"]} labelFormatter={(v) => new Date(v).toLocaleTimeString()} />
        <Line type="monotone" dataKey="value" stroke="oklch(0.78 0.17 220)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CacheDonut({ hit }: { hit: number }) {
  const data = [
    { name: "Hit", value: hit },
    { name: "Miss", value: 100 - hit },
  ];
  const colors = ["oklch(0.72 0.18 145)", "oklch(1 0 0 / 0.06)"];
  return (
    <div className="relative h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={70} outerRadius={95} startAngle={90} endAngle={-270} stroke="none">
            {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-mono text-3xl font-semibold tabular-nums">{hit.toFixed(1)}<span className="text-lg text-muted-foreground">%</span></div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">cache hit</div>
        </div>
      </div>
    </div>
  );
}