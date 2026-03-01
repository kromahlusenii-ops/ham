import React from 'react';
import MetricCard from './MetricCard.jsx';

// --- Formatting helpers ---

function formatDuration(sec) {
  if (!sec || sec <= 0) return '-';
  if (sec < 60) return sec.toFixed(1) + 's';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m + 'm ' + s + 's';
}

function formatTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatPct(n) {
  return n.toFixed(1) + '%';
}

function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function formatModel(model) {
  if (!model) return 'unknown';
  return model.replace('claude-', '').split('-').slice(0, 2).join('-');
}

function changePct(val) {
  if (val === 0 || val === undefined) return '-';
  const sign = val > 0 ? '+' : '';
  return sign + val.toFixed(1) + '%';
}

// --- Component ---

export default function Performance({ benchmark, tasks, comparison }) {
  // No data at all
  if (!benchmark || (benchmark.totalTasks === 0 && benchmark.state?.mode === 'none')) {
    return (
      <div className="empty-state">
        <h3>No benchmark data yet</h3>
        <p>
          Run <strong>"go ham"</strong> to set up HAM with baseline benchmarking, or
          run <strong>"ham baseline start"</strong> to begin capturing baseline metrics.
        </p>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 13 }}>
          The baseline captures 10 tasks without HAM memory loading for an apples-to-apples comparison.
        </p>
      </div>
    );
  }

  const state = benchmark.state || { mode: 'none' };

  return (
    <>
      {/* Status banner */}
      {state.mode === 'baseline' && (
        <div className="baseline-banner">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Baseline capture in progress</span>
            <span className="mono">{state.tasks_completed || 0}/{state.tasks_target || 10} tasks</span>
          </div>
          <div className="baseline-progress">
            <div
              className="baseline-progress-fill"
              style={{ width: `${Math.round(((state.tasks_completed || 0) / (state.tasks_target || 10)) * 100)}%` }}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Keep working normally. Baseline tasks skip subdirectory CLAUDE.md loading for a clean comparison.
          </div>
        </div>
      )}

      {state.mode === 'active' && comparison?.hasData && comparison.comparison && (
        <div className="baseline-banner" style={{ borderColor: 'var(--green)' }}>
          <span style={{ color: 'var(--green)', fontWeight: 600 }}>
            Benchmark comparison available
          </span>
          <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 13 }}>
            — {comparison.baseline?.count || 0} baseline vs {comparison.active?.count || 0} active tasks
          </span>
        </div>
      )}

      {/* Metric cards */}
      <div className="metrics-grid">
        <MetricCard
          label="Total Tasks"
          value={benchmark.totalTasks}
          sub={benchmark.byMode?.baseline?.count ? `${benchmark.byMode.baseline.count} baseline + ${benchmark.byMode.active?.count || 0} active` : 'tracked tasks'}
        />
        <MetricCard
          label="Avg Task Time"
          value={formatDuration(benchmark.avgWallClockSec)}
          sub="wall clock per task"
        />
        <MetricCard
          label="Avg Tokens/Task"
          value={formatTokens(benchmark.avgTokens)}
          sub="correlated from sessions"
        />
        <MetricCard
          label="Estimated Savings"
          value={comparison?.comparison ? formatTokens(comparison.comparison.estimatedSavings) + ' tokens' : '-'}
          sub={comparison?.comparison?.tokenPct ? changePct(comparison.comparison.tokenPct) + ' vs baseline' : 'need baseline + active data'}
        />
      </div>

      {/* Comparison table */}
      {comparison?.hasData && comparison.baseline && comparison.active && (
        <div className="table-card">
          <h3>Baseline vs HAM Comparison</h3>
          <div className="comparison-grid">
            <div className="comparison-cell comparison-header">Metric</div>
            <div className="comparison-cell comparison-header">Baseline</div>
            <div className="comparison-cell comparison-header">HAM Active</div>
            <div className="comparison-cell comparison-header">Change</div>

            <div className="comparison-cell">Tasks</div>
            <div className="comparison-cell mono">{comparison.baseline.count}</div>
            <div className="comparison-cell mono">{comparison.active.count}</div>
            <div className="comparison-cell">-</div>

            <div className="comparison-cell">Avg Time</div>
            <div className="comparison-cell mono">{formatDuration(comparison.baseline.avgTimeSec)}</div>
            <div className="comparison-cell mono">{formatDuration(comparison.active.avgTimeSec)}</div>
            <div className={`comparison-cell mono ${comparison.comparison?.timePct < 0 ? 'positive' : comparison.comparison?.timePct > 0 ? 'negative' : ''}`}>
              {changePct(comparison.comparison?.timePct)}
            </div>

            <div className="comparison-cell">Avg Tokens</div>
            <div className="comparison-cell mono">{formatTokens(comparison.baseline.avgTokens)}</div>
            <div className="comparison-cell mono">{formatTokens(comparison.active.avgTokens)}</div>
            <div className={`comparison-cell mono ${comparison.comparison?.tokenPct < 0 ? 'positive' : comparison.comparison?.tokenPct > 0 ? 'negative' : ''}`}>
              {changePct(comparison.comparison?.tokenPct)}
            </div>

            <div className="comparison-cell">Avg Cache %</div>
            <div className="comparison-cell mono">{formatPct(comparison.baseline.avgCacheRate)}</div>
            <div className="comparison-cell mono">{formatPct(comparison.active.avgCacheRate)}</div>
            <div className={`comparison-cell mono ${comparison.comparison?.cacheDelta > 0 ? 'positive' : comparison.comparison?.cacheDelta < 0 ? 'negative' : ''}`}>
              {changePct(comparison.comparison?.cacheDelta)}
            </div>
          </div>
        </div>
      )}

      {/* Model breakdown table */}
      {comparison?.byModel && Object.keys(comparison.byModel).length > 0 && (
        <div className="table-card">
          <h3>Per-Model Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Tasks</th>
                <th>Avg Time</th>
                <th>Avg Tokens</th>
                <th>Avg Cache %</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(comparison.byModel).map(([model, data]) => {
                const active = data.active || data.baseline;
                return (
                  <tr key={model}>
                    <td className="mono">{formatModel(model)}</td>
                    <td className="mono">{data.total}</td>
                    <td className="mono">{active ? formatDuration(active.avgTimeSec) : '-'}</td>
                    <td className="mono">{active ? formatTokens(active.avgTokens) : '-'}</td>
                    <td className="mono">{active ? formatPct(active.avgCacheRate) : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Task log */}
      {tasks && tasks.length > 0 && (
        <div className="table-card">
          <h3>Recent Tasks</h3>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Description</th>
                  <th>Duration</th>
                  <th>Tokens</th>
                  <th>Model</th>
                  <th>Mode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td className="mono">{formatDateTime(t.timestamp)}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.description || '-'}
                    </td>
                    <td className="mono">{formatDuration(t.durationSec)}</td>
                    <td className="mono">{formatTokens(t.tokens)}</td>
                    <td className="mono">{formatModel(t.model)}</td>
                    <td>
                      <span className={`status-badge ${t.ham_active ? 'completed' : 'in-progress'}`}>
                        {t.ham_active ? 'HAM' : 'baseline'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${t.status === 'completed' ? 'completed' : 'in-progress'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
