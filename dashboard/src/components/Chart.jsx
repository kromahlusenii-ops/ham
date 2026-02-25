import React, { useRef, useEffect } from 'react';

/**
 * Simple canvas-based line chart (no external dependency).
 * Props:
 *   data: [{ label, value, value2? }]
 *   color: stroke color for primary line
 *   color2: stroke color for secondary line (optional)
 *   formatValue: function to format tooltip values
 */
export default function Chart({ data, color = '#6c5ce7', color2, formatValue }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 10, right: 10, bottom: 24, left: 50 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Find max value
    const values = data.map(d => d.value);
    if (color2) {
      values.push(...data.map(d => d.value2 || 0));
    }
    const maxVal = Math.max(...values, 1);

    // Draw grid lines
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#8888a0';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      const val = maxVal * (1 - i / 4);
      ctx.fillText(formatValue ? formatValue(val) : formatNum(val), pad.left - 6, y + 3);
    }

    // Draw x-axis labels (every few points)
    const labelEvery = Math.max(1, Math.floor(data.length / 6));
    ctx.fillStyle = '#8888a0';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < data.length; i += labelEvery) {
      const x = pad.left + (i / (data.length - 1 || 1)) * plotW;
      const label = data[i].label;
      ctx.fillText(label.slice(5), x, h - 4); // MM-DD
    }

    // Draw lines
    drawLine(ctx, data.map(d => d.value), maxVal, pad, plotW, plotH, color, 2);
    if (color2) {
      drawLine(ctx, data.map(d => d.value2 || 0), maxVal, pad, plotW, plotH, color2, 1.5, [4, 4]);
    }
  }, [data, color, color2, formatValue]);

  return (
    <div className="chart-container">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}

function drawLine(ctx, values, maxVal, pad, plotW, plotH, color, lineWidth, dash) {
  if (values.length === 0) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  else ctx.setLineDash([]);

  ctx.beginPath();
  for (let i = 0; i < values.length; i++) {
    const x = pad.left + (i / (values.length - 1 || 1)) * plotW;
    const y = pad.top + plotH - (values[i] / maxVal) * plotH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function formatNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return Math.round(n).toString();
}
