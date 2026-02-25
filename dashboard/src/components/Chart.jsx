import React, { useRef, useEffect } from 'react';

/**
 * Canvas line chart with smooth bezier curves.
 * Light theme, matching the HAM dashboard design.
 */
export default function Chart({ data, color = '#1a1a1a', color2, formatValue }) {
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
    const pad = { top: 12, right: 16, bottom: 28, left: 56 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    // Gather all values for max calculation
    const allValues = data.map(d => d.value);
    if (color2) allValues.push(...data.map(d => d.value2 || 0));
    const maxVal = Math.max(...allValues, 0.01);

    // Nice max: round up to a clean number
    const niceMax = niceRound(maxVal);
    const gridSteps = 4;

    // Grid lines and Y labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= gridSteps; i++) {
      const y = pad.top + (plotH / gridSteps) * i;
      const val = niceMax * (1 - i / gridSteps);

      // Grid line
      ctx.strokeStyle = '#e8e8e5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      // Y label
      ctx.fillStyle = '#999';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillText(formatValue ? formatValue(val) : formatNum(val), pad.left - 10, y);
    }

    // X labels
    const labelEvery = Math.max(1, Math.floor(data.length / 6));
    ctx.fillStyle = '#999';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < data.length; i += labelEvery) {
      const x = pad.left + (i / (data.length - 1 || 1)) * plotW;
      ctx.fillText(data[i].label.slice(5), x, h - 16);
    }
    // Always show last label
    if (data.length > 1) {
      const lastX = pad.left + plotW;
      ctx.fillText(data[data.length - 1].label.slice(5), lastX, h - 16);
    }

    // Draw dashed line (baseline) first, behind the solid line
    if (color2) {
      drawSmoothLine(ctx, data.map(d => d.value2 || 0), niceMax, pad, plotW, plotH, color2, 1.5, [6, 4]);
    }

    // Draw solid line (actual)
    drawSmoothLine(ctx, data.map(d => d.value), niceMax, pad, plotW, plotH, color, 2.5);

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

/**
 * Draw a smooth bezier curve through the data points.
 */
function drawSmoothLine(ctx, values, maxVal, pad, plotW, plotH, color, lineWidth, dash) {
  if (values.length === 0) return;

  const points = values.map((v, i) => ({
    x: pad.left + (i / (values.length - 1 || 1)) * plotW,
    y: pad.top + plotH - (v / maxVal) * plotH,
  }));

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  else ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 1) {
    ctx.lineTo(points[0].x, points[0].y);
  } else if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    // Bezier smoothing
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
    }
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Round up to a "nice" chart max value.
 */
function niceRound(val) {
  if (val <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(val)));
  const normalized = val / magnitude;
  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function formatNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.round(n).toString();
}
