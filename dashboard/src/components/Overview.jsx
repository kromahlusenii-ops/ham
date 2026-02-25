import React from 'react';
import MetricCard from './MetricCard.jsx';
import Chart from './Chart.jsx';
import HealthDot from './HealthDot.jsx';

function formatTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function formatCost(n) {
  return '$' + n.toFixed(2);
}

export default function Overview({ stats, daily, health, insights }) {
  if (!stats) {
    return (
      <div className="empty-state">
        <h3>No session data</h3>
        <p>No Claude Code sessions found for this project.</p>
      </div>
    );
  }

  const tokenChartData = daily.map(d => ({
    label: d.date,
    value: d.inputTokens,
    value2: d.cacheReadTokens,
  }));

  const costChartData = daily.map(d => ({
    label: d.date,
    value: d.cost,
  }));

  return (
    <>
      {insights && (
        <div className="overview-intro">
          <p className="insight-summary">{insights.summary}</p>
          {insights.insights.length > 0 && (
            <ul className="insight-list">
              {insights.insights.map((text, i) => (
                <li key={i}>{text}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="metrics-grid">
        <MetricCard
          label="Tokens Saved"
          value={formatTokens(stats.totalTokensSaved)}
          sub={`est. ${formatCost(stats.totalCostSaved)} saved`}
          colorClass="green"
        />
        <MetricCard
          label="Total Sessions"
          value={stats.totalSessions}
          sub={`${stats.hamOnCount} HAM-on / ${stats.hamOffCount} HAM-off`}
        />
        <MetricCard
          label="HAM Coverage"
          value={stats.coveragePercent + '%'}
          sub={`${stats.hamOnCount} of ${stats.totalSessions} sessions`}
          colorClass="accent"
        />
        <MetricCard
          label="Total Cost"
          value={formatCost(stats.totalCost)}
          sub={`${formatTokens(stats.totalInputTokens)} input tokens`}
        />
      </div>

      <div className="chart-row">
        <div className="chart-card">
          <h3>Daily Input Tokens (solid) vs Cache Reads (dashed)</h3>
          <Chart
            data={tokenChartData}
            color="#6c5ce7"
            color2="#00b894"
            formatValue={formatTokens}
          />
        </div>
        <div className="chart-card">
          <h3>Daily Cost</h3>
          <Chart
            data={costChartData}
            color="#fdcb6e"
            formatValue={formatCost}
          />
        </div>
      </div>

      {health.length > 0 && (
        <div className="table-card">
          <h3>Context File Health</h3>
          <div className="health-list">
            {health.map(h => (
              <div key={h.path} className="health-item">
                <HealthDot status={h.status} />
                <span className="health-path">{h.path}/</span>
                <span className="health-meta">
                  {h.hasClaude
                    ? `CLAUDE.md (${formatBytes(h.fileSize)})`
                    : 'No CLAUDE.md'}
                  {h.sessionsTouched > 0 && ` \u00b7 ${h.sessionsTouched} sessions`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + 'B';
  return (bytes / 1024).toFixed(1) + 'KB';
}
