import React from 'react';
import InfoTip from './InfoTip.jsx';

export default function MetricCard({ label, value, sub, info }) {
  return (
    <div className="metric-card">
      <div className="label">
        {label}
        {info && <InfoTip text={info} />}
      </div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}
