import React from 'react';

// ==========================================
// 1. TREND LINE CHART (SVG)
// ==========================================

export interface TrendDataPoint {
  label: string; // e.g. "Oct 18"
  value: number; // e.g. 14500
}

interface TrendLineChartProps {
  data: TrendDataPoint[];
  color?: string;
  fillColor?: string;
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  color = '#4F46E5',
  fillColor = 'rgba(99, 102, 241, 0.1)',
  height = 180,
  valuePrefix = '',
  valueSuffix = '',
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
        No trend records in selected interval
      </div>
    );
  }

  const padding = { top: 20, right: 24, bottom: 28, left: 40 };
  const width = 600; // coordinate space
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = 0;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.value - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    return `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height, display: 'block' }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padding.top + chartHeight * (1 - ratio);
          const gridVal = Math.round(minVal + ratio * (maxVal - minVal));
          return (
            <g key={`grid-${idx}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                fill="#94A3B8"
                fontSize="10"
                textAnchor="end"
                fontFamily="inherit"
              >
                {valuePrefix}
                {gridVal > 999 ? `${(gridVal / 1000).toFixed(0)}k` : gridVal}
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

        {/* Points & Labels */}
        {points.map((p, i) => (
          <g key={`pt-${i}`}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#FFFFFF" stroke={color} strokeWidth="2" />
            <text
              x={p.x}
              y={height - 8}
              fill="#64748B"
              fontSize="10.5"
              textAnchor="middle"
              fontFamily="inherit"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ==========================================
// 2. HORIZONTAL BAR CHART (SVG / CSS)
// ==========================================

export interface BarDataPoint {
  label: string;
  value: number;
  subtext?: string;
  color?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  valuePrefix?: string;
  maxBars?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  valuePrefix = '',
  maxBars = 6,
}) => {
  const displayData = data.slice(0, maxBars);
  const maxVal = Math.max(...displayData.map((d) => d.value), 1);

  if (displayData.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8' }}>
        No category metrics available
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {displayData.map((item, idx) => {
        const percentage = Math.round((item.value / maxVal) * 100);
        return (
          <div key={`bar-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>{item.label}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A' }}>
                {valuePrefix}
                {item.value.toLocaleString()} {item.subtext && <span style={{ color: '#64748B' }}>({item.subtext})</span>}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: 8,
                backgroundColor: '#F1F5F9',
                borderRadius: 9999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: item.color || '#4F46E5',
                  borderRadius: 9999,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// 3. DONUT DISTRIBUTION CHART (SVG)
// ==========================================

export interface DonutDataPoint {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDataPoint[];
  centerTitle?: string;
  centerValue?: string | number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  centerTitle,
  centerValue,
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8' }}>
        No distribution records available
      </div>
    );
  }

  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {data.map((item, idx) => {
            if (item.value <= 0) return null;
            const percent = item.value / total;
            const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
            const strokeDashoffset = -circumference * accumulatedPercent;
            accumulatedPercent += percent;

            return (
              <circle
                key={`donut-slice-${idx}`}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })}
        </svg>

        {centerValue && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{centerValue}</span>
            {centerTitle && (
              <span style={{ fontSize: 10.5, color: '#64748B', textTransform: 'uppercase' }}>
                {centerTitle}
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 160 }}>
        {data.map((item, idx) => {
          const pct = Math.round((item.value / total) * 100);
          return (
            <div key={`legend-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    display: 'inline-block',
                  }}
                />
                <span style={{ color: '#334155', fontWeight: 500 }}>{item.label}</span>
              </div>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A' }}>
                {item.value} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
