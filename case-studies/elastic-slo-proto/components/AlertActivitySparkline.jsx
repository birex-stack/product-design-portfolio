import React, { useMemo } from 'react';

const DEFAULT_STROKE = '#BD271E';
const DEFAULT_FILL = 'rgba(189, 39, 30, 0.18)';

/**
 * Compact SVG sparkline for table cells — no axes, markers, or chart chrome.
 */
export function AlertActivitySparkline({
  values = [],
  width = 120,
  height = 28,
  stroke = DEFAULT_STROKE,
  fill = DEFAULT_FILL,
}) {
  const path = useMemo(() => {
    const series = values || [];
    if (series.length < 2) return null;

    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const padY = 2;
    const innerH = height - padY * 2;
    const stepX = width / (series.length - 1);

    const points = series.map((y, i) => {
      const x = i * stepX;
      const py = padY + innerH - ((y - min) / range) * innerH;
      return [x, py];
    });

    const line = points
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ');
    const area = `${line} L${width},${height} L0,${height} Z`;

    return { line, area };
  }, [values, width, height]);

  if (!path) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', pointerEvents: 'none' }}
    >
      <path d={path.area} fill={fill} stroke="none" />
      <path
        d={path.line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
