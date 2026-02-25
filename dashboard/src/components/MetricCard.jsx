import React from 'react';

export default function MetricCard({ label, value, sub, colorClass }) {
  return (
    <div className="metric-card">
      <div className="label">{label}</div>
      <div className={`value ${colorClass || ''}`}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}
