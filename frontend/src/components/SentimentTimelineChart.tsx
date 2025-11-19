/**
 * Sentiment Timeline Chart - "Technical Observatory" Aesthetic
 *
 * A refined, technical visualization showing team sentiment trends over time.
 * Design inspired by data observatories and terminal aesthetics - where metrics
 * feel like signals being monitored, not just numbers on a screen.
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { SentimentTimelinePoint } from '@/types/api';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface SentimentTimelineChartProps {
  data: SentimentTimelinePoint[];
}

export function SentimentTimelineChart({ data }: SentimentTimelineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-['Instrument_Serif'] font-semibold text-slate-100">
            Sentiment Timeline
          </h3>
        </div>
        <p className="text-sm text-slate-400 font-['JetBrains_Mono']">
          No sentiment data available for this period
        </p>
      </div>
    );
  }

  // Calculate trend
  const firstPoint = data[0]?.avg_sentiment || 0;
  const lastPoint = data[data.length - 1]?.avg_sentiment || 0;
  const trend = lastPoint - firstPoint;
  const trendPercent = firstPoint !== 0 ? ((trend / Math.abs(firstPoint)) * 100).toFixed(1) : '0';

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
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-['Instrument_Serif'] font-semibold text-slate-100">
                Sentiment Timeline
              </h3>
            </div>
            <p className="text-sm text-slate-400 font-['JetBrains_Mono']">
              Team morale trends across {data.length} data point{data.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Trend Indicator */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/30">
            {trend > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-['JetBrains_Mono'] font-semibold text-emerald-400">
                  +{trendPercent}%
                </span>
              </>
            ) : trend < 0 ? (
              <>
                <TrendingDown className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-['JetBrains_Mono'] font-semibold text-amber-400">
                  {trendPercent}%
                </span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-['JetBrains_Mono'] font-semibold text-slate-400">
                  Stable
                </span>
              </>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="mt-8">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity={0.05} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
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
                vertical={false}
              />

              {/* Zero reference line */}
              <ReferenceLine
                y={0}
                stroke="rgb(100, 116, 139)"
                strokeDasharray="5 5"
                strokeWidth={1}
                label={{
                  value: 'Neutral',
                  fill: 'rgb(148, 163, 184)',
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono',
                  position: 'right'
                }}
              />

              {/* X Axis */}
              <XAxis
                dataKey="date"
                stroke="rgb(148, 163, 184)"
                tick={{
                  fill: 'rgb(148, 163, 184)',
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono'
                }}
                tickFormatter={(value) => {
                  try {
                    return format(parseISO(value), 'MMM d');
                  } catch {
                    return value;
                  }
                }}
                axisLine={{ stroke: 'rgb(71, 85, 105)' }}
                tickLine={{ stroke: 'rgb(71, 85, 105)' }}
              />

              {/* Y Axis */}
              <YAxis
                stroke="rgb(148, 163, 184)"
                domain={[-1, 1]}
                ticks={[-1, -0.5, 0, 0.5, 1]}
                tick={{
                  fill: 'rgb(148, 163, 184)',
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono'
                }}
                axisLine={{ stroke: 'rgb(71, 85, 105)' }}
                tickLine={{ stroke: 'rgb(71, 85, 105)' }}
                tickFormatter={(value) => value.toFixed(1)}
              />

              {/* Tooltip */}
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'rgb(34, 211, 238)', strokeWidth: 1, strokeDasharray: '5 5' }}
              />

              {/* Line with glow effect */}
              <Line
                type="monotone"
                dataKey="avg_sentiment"
                stroke="rgb(34, 211, 238)"
                strokeWidth={3}
                dot={{
                  fill: 'rgb(34, 211, 238)',
                  r: 5,
                  strokeWidth: 2,
                  stroke: 'rgb(6, 182, 212)',
                  filter: 'url(#glow)'
                }}
                activeDot={{
                  r: 7,
                  fill: 'rgb(34, 211, 238)',
                  stroke: 'rgb(240, 253, 255)',
                  strokeWidth: 2,
                  filter: 'url(#glow)'
                }}
                fill="url(#sentimentGradient)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-8 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 10px rgba(52, 211, 153, 0.5)' }} />
            <span className="font-['JetBrains_Mono'] text-slate-400">Positive (0.5+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }} />
            <span className="font-['JetBrains_Mono'] text-slate-400">Neutral (-0.5 to 0.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400" style={{ boxShadow: '0 0 10px rgba(251, 191, 36, 0.5)' }} />
            <span className="font-['JetBrains_Mono'] text-slate-400">Negative (&lt; -0.5)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom Tooltip Component
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: SentimentTimelinePoint }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  const sentiment = data.avg_sentiment;

  // Determine sentiment color
  let sentimentColor = 'rgb(34, 211, 238)'; // cyan (neutral)
  let sentimentLabel = 'Neutral';

  if (sentiment >= 0.5) {
    sentimentColor = 'rgb(52, 211, 153)'; // emerald (positive)
    sentimentLabel = 'Positive';
  } else if (sentiment <= -0.5) {
    sentimentColor = 'rgb(251, 191, 36)'; // amber (negative)
    sentimentLabel = 'Negative';
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-2xl backdrop-blur-sm">
      <div className="font-['JetBrains_Mono'] text-xs text-slate-400 mb-2">
        {format(parseISO(data.date), 'MMMM d, yyyy')}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span
          className="text-2xl font-bold font-['JetBrains_Mono']"
          style={{ color: sentimentColor }}
        >
          {sentiment.toFixed(2)}
        </span>
        <span className="text-xs text-slate-500 font-['JetBrains_Mono']">
          {sentimentLabel}
        </span>
      </div>

      <div className="text-xs text-slate-400 font-['JetBrains_Mono'] mt-2 pt-2 border-t border-slate-800">
        {data.session_count} session{data.session_count !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
