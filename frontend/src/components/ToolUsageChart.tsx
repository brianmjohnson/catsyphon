/**
 * Tool Usage Chart - "Technical Observatory" Aesthetic
 *
 * A horizontal bar chart showing tool usage frequency with terminal-inspired styling.
 * Each bar represents command/tool execution count with a sophisticated glow effect.
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Terminal } from 'lucide-react';

interface ToolUsageChartProps {
  toolUsage: Record<string, number>;
}

// Terminal-inspired color palette
const TOOL_COLORS = [
  'rgb(34, 211, 238)',   // cyan
  'rgb(52, 211, 153)',   // emerald
  'rgb(251, 191, 36)',   // amber
  'rgb(167, 139, 250)',  // purple
  'rgb(244, 114, 182)',  // pink
  'rgb(96, 165, 250)',   // blue
  'rgb(134, 239, 172)',  // green
  'rgb(253, 186, 116)',  // orange
  'rgb(196, 181, 253)',  // lavender
  'rgb(165, 243, 252)',  // light cyan
];

export function ToolUsageChart({ toolUsage }: ToolUsageChartProps) {
  if (!toolUsage || Object.keys(toolUsage).length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-['Instrument_Serif'] font-semibold text-slate-100">
            Tool Usage
          </h3>
        </div>
        <p className="text-sm text-slate-400 font-['JetBrains_Mono']">
          No tool usage data available for this period
        </p>
      </div>
    );
  }

  // Prepare data: sort by count (desc) and take top 10
  const chartData = Object.entries(toolUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tool, count], index) => ({
      tool,
      count,
      colorIndex: index % TOOL_COLORS.length,
    }));

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-8 overflow-hidden">
      {/* Subtle grid pattern background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(148, 163, 184) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(148, 163, 184) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-['Instrument_Serif'] font-semibold text-slate-100">
            Tool Usage
          </h3>
        </div>
        <p className="text-sm text-slate-400 font-['JetBrains_Mono'] mb-8">
          Top {chartData.length} most frequently used tools across all sessions
        </p>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 45)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <defs>
              {TOOL_COLORS.map((color, idx) => (
                <linearGradient key={idx} id={`toolGradient${idx}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                </linearGradient>
              ))}
              <filter id="barGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Grid */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgb(51, 65, 85)"
              opacity={0.2}
              horizontal={false}
            />

            {/* Y Axis (tool names) */}
            <YAxis
              type="category"
              dataKey="tool"
              stroke="rgb(148, 163, 184)"
              tick={{
                fill: 'rgb(148, 163, 184)',
                fontSize: 13,
                fontFamily: 'JetBrains Mono',
                fontWeight: 500
              }}
              axisLine={{ stroke: 'rgb(71, 85, 105)' }}
              tickLine={false}
              width={90}
            />

            {/* X Axis (count) */}
            <XAxis
              type="number"
              stroke="rgb(148, 163, 184)"
              tick={{
                fill: 'rgb(148, 163, 184)',
                fontSize: 11,
                fontFamily: 'JetBrains Mono'
              }}
              axisLine={{ stroke: 'rgb(71, 85, 105)' }}
              tickLine={{ stroke: 'rgb(71, 85, 105)' }}
            />

            {/* Tooltip */}
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(51, 65, 85, 0.3)' }}
            />

            {/* Bars */}
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              filter="url(#barGlow)"
            >
              {chartData.map((entry) => (
                <Cell
                  key={`cell-${entry.tool}`}
                  fill={`url(#toolGradient${entry.colorIndex})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Stats Footer */}
        <div className="mt-6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500 font-['JetBrains_Mono']">Total Tools: </span>
              <span className="text-cyan-400 font-['JetBrains_Mono'] font-semibold">
                {Object.keys(toolUsage).length}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-['JetBrains_Mono']">Total Executions: </span>
              <span className="text-emerald-400 font-['JetBrains_Mono'] font-semibold">
                {Object.values(toolUsage).reduce((sum, count) => sum + count, 0).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="text-slate-500 font-['JetBrains_Mono']">
            Showing top {chartData.length}
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom Tooltip Component
interface ToolData {
  tool: string;
  count: number;
  colorIndex: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ToolData }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  const color = TOOL_COLORS[data.colorIndex];

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-2xl backdrop-blur-sm">
      <div className="font-['JetBrains_Mono'] text-sm text-slate-400 mb-2">
        {data.tool}
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className="text-3xl font-bold font-['JetBrains_Mono']"
          style={{ color }}
        >
          {data.count.toLocaleString()}
        </span>
        <span className="text-xs text-slate-500 font-['JetBrains_Mono']">
          executions
        </span>
      </div>
    </div>
  );
}
