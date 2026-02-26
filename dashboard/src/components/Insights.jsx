import React from 'react';

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

function severityClass(item) {
  if (item.type === 'positive') return 'type-positive';
  return `severity-${item.severity}`;
}

function severityBadgeClass(item) {
  if (item.type === 'positive') return 'positive';
  return item.severity;
}

export default function Insights({ insights }) {
  if (!insights || !insights.items || insights.items.length === 0) {
    return (
      <div className="empty-state">
        <h3>No insights available</h3>
        <p>Insights will appear here once session data is collected.</p>
      </div>
    );
  }

  const items = [...insights.items].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3)
  );

  const actionable = items.filter(i => i.type === 'action').length;
  const positive = items.filter(i => i.type === 'positive').length;
  const observation = items.filter(i => i.type === 'observation').length;

  return (
    <div>
      <div className="insights-header">
        <span className="insights-count">{items.length} insight{items.length !== 1 ? 's' : ''}</span>
        <div className="insights-badges">
          {actionable > 0 && <span className="insight-badge actionable">{actionable} actionable</span>}
          {positive > 0 && <span className="insight-badge positive">{positive} positive</span>}
          {observation > 0 && <span className="insight-badge observation">{observation} observation</span>}
        </div>
      </div>

      {items.map((item, i) => (
        <div key={i} className={`insight-card ${severityClass(item)}`}>
          <span className={`insight-severity ${severityBadgeClass(item)}`}>
            {item.type === 'positive' ? 'POSITIVE' : item.severity.toUpperCase()}
          </span>
          <div className="insight-title">{item.title}</div>
          <div className="insight-detail">{item.detail}</div>
          {item.type === 'action' && item.action && (
            <div className="insight-action">{item.action}</div>
          )}
          <span className="insight-category">{item.category}</span>
        </div>
      ))}
    </div>
  );
}
