/**
 * Sparkline component - renders a small inline line chart for time-series data.
 */

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  fillOpacity?: number;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = 'currentColor',
  strokeWidth = 2,
  fillOpacity = 0.1,
}: SparklineProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Calculate min/max for scaling
  const validData = data.filter((d) => d !== null && !isNaN(d));
  if (validData.length === 0) {
    return null;
  }

  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min || 1; // Avoid division by zero

  // Generate SVG path data
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      className="inline-block"
      style={{ verticalAlign: 'middle' }}
    >
      {/* Fill area under the line */}
      <path
        d={areaPath}
        fill={color}
        fillOpacity={fillOpacity}
        stroke="none"
      />
      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
