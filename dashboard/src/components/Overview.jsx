import React from 'react';
import MetricCard from './MetricCard.jsx';
import Chart from './Chart.jsx';
import InfoTip from './InfoTip.jsx';

function formatTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function formatCost(n) {
  return '$' + n.toFixed(2);
}

function formatCO2e(grams) {
  if (grams < 1) return '< 1g';
  if (grams < 1000) return Math.round(grams) + 'g';
  return (grams / 1000).toFixed(1) + ' kg';
}

function formatDuration(sec) {
  if (!sec || sec <= 0) return '-';
  if (sec < 60) return sec.toFixed(1) + 's';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m + 'm ' + s + 's';
}

function formatPct(n) {
  return n.toFixed(1) + '%';
}

function changePct(val) {
  if (val === 0 || val === undefined) return '-';
  const sign = val > 0 ? '+' : '';
  return sign + val.toFixed(1) + '%';
}

function formatModel(model) {
  if (!model) return 'unknown';
  return model.replace('claude-', '').split('-').slice(0, 2).join('-');
}

function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function Overview({ stats, daily, carbon, benchmark, benchmarkComparison, benchmarkTasks }) {
  if (!stats) {
    return (
      <div className="empty-state">
        <h3>No session data</h3>
        <p>No Claude Code sessions found for this project.</p>
      </div>
    );
  }

  const costChartData = daily.map(d => ({
    label: d.date,
    value: d.cost,
    value2: d.sessions > 0 ? d.cost * 1.8 : 0,
  }));

  const savingsPct = stats.totalInputTokens > 0
    ? Math.round((stats.totalTokensSaved / (stats.totalInputTokens + stats.totalTokensSaved)) * 100)
    : 0;

  return (
    <>
      <div className="metrics-grid">
        <MetricCard
          label="Tokens Saved"
          value={formatTokens(stats.totalTokensSaved)}
          sub={savingsPct > 0
            ? `${savingsPct}% reduction` + (carbon?.totalCO2e?.saved_grams > 0
                ? ` \u00b7 ~${formatCO2e(carbon.totalCO2e.saved_grams)} CO\u2082e saved`
                : '')
            : 'no HAM sessions yet'}
          info={'Tokens are the "words" Claude reads each time you send a message. Without HAM, Claude re-reads your whole project context every prompt \u2014 like re-reading an entire textbook to answer one question. HAM gives Claude a cheat sheet for each folder, so it only reads what it needs. This number is how many tokens you skipped by having those cheat sheets.'}
        />
        <MetricCard
          label="Cost Saved"
          value={formatCost(stats.totalCostSaved)}
          sub={`${formatCost(stats.totalCost - stats.totalCostSaved)} of ${formatCost(stats.totalCost)} spent`}
          info={'Every token Claude reads costs money. This is the dollar amount you saved by not sending those extra tokens. Think of it like the difference between shipping a full filing cabinet vs. just the one folder you need.'}
        />
        <MetricCard
          label="Avg File Reads"
          value={stats.avgFileReads.toFixed(1)}
          sub={`${stats.hamOffCount} without HAM`}
          info={'Each session, Claude reads files to understand your code. Fewer reads per session usually means Claude already has what it needs from your CLAUDE.md files \u2014 like having a good table of contents instead of flipping through every page.'}
        />
        <MetricCard
          label="Sessions Routed"
          value={`${stats.routedPercent}%`}
          sub={`${stats.routedCount + stats.likelyRoutedCount} of ${stats.totalSessions} sessions`}
          info={'Shows how often the agent followed your Context Routing map. Routed = root CLAUDE.md was read, then the listed sub-context was loaded immediately. Likely = a listed file was loaded but not right after root. Unrouted = root wasn\'t read or the sub-context wasn\'t in the routing map.'}
        />
      </div>

      {/* Benchmark section */}
      {(!benchmark || (benchmark.totalTasks === 0 && (!benchmark.state || benchmark.state.mode === 'none'))) && (
        <div className="table-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <h3 style={{ marginBottom: 8 }}>Task Performance</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
            No benchmark data yet. Run <strong style={{ color: 'var(--text)' }}>"ham baseline start"</strong> to begin capturing per-task metrics, or <strong style={{ color: 'var(--text)' }}>"go ham"</strong> to set up HAM with automatic baseline.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            The baseline captures 10 tasks without HAM memory loading for an apples-to-apples performance comparison.
          </p>
        </div>
      )}

      {benchmark && benchmark.state?.mode === 'baseline' && (
        <div className="baseline-banner">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Baseline capture in progress</span>
            <span className="mono">{benchmark.state.tasks_completed || 0}/{benchmark.state.tasks_target || 10} tasks</span>
          </div>
          <div className="baseline-progress">
            <div
              className="baseline-progress-fill"
              style={{ width: `${Math.round(((benchmark.state.tasks_completed || 0) / (benchmark.state.tasks_target || 10)) * 100)}%` }}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Baseline tasks skip subdirectory CLAUDE.md loading for a clean comparison.
          </div>
        </div>
      )}

      {benchmark && benchmark.totalTasks > 0 && (
        <div className="table-card">
          <h3>
            Task Performance
            <InfoTip text={'Per-task metrics comparing baseline (no HAM memory) vs active (HAM enabled). Avg Time = wall clock per task. Avg Tokens = session tokens allocated proportionally by task duration. Run "ham benchmark" in CLI for detailed breakdown.'} />
          </h3>
          <div className="metrics-grid" style={{ marginBottom: 16 }}>
            <MetricCard
              label="Tasks Tracked"
              value={benchmark.totalTasks}
              sub={benchmark.byMode?.baseline?.count ? `${benchmark.byMode.baseline.count} baseline + ${benchmark.byMode.active?.count || 0} active` : 'all tasks'}
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
          </div>

          {benchmarkComparison?.hasData && benchmarkComparison.baseline && benchmarkComparison.active && (
            <div className="comparison-grid">
              <div className="comparison-cell comparison-header">Metric</div>
              <div className="comparison-cell comparison-header">Baseline</div>
              <div className="comparison-cell comparison-header">HAM Active</div>
              <div className="comparison-cell comparison-header">Change</div>

              <div className="comparison-cell">Tasks</div>
              <div className="comparison-cell mono">{benchmarkComparison.baseline.count}</div>
              <div className="comparison-cell mono">{benchmarkComparison.active.count}</div>
              <div className="comparison-cell">-</div>

              <div className="comparison-cell">Avg Time</div>
              <div className="comparison-cell mono">{formatDuration(benchmarkComparison.baseline.avgTimeSec)}</div>
              <div className="comparison-cell mono">{formatDuration(benchmarkComparison.active.avgTimeSec)}</div>
              <div className={`comparison-cell mono ${benchmarkComparison.comparison?.timePct < 0 ? 'positive' : benchmarkComparison.comparison?.timePct > 0 ? 'negative' : ''}`}>
                {changePct(benchmarkComparison.comparison?.timePct)}
              </div>

              <div className="comparison-cell">Avg Tokens</div>
              <div className="comparison-cell mono">{formatTokens(benchmarkComparison.baseline.avgTokens)}</div>
              <div className="comparison-cell mono">{formatTokens(benchmarkComparison.active.avgTokens)}</div>
              <div className={`comparison-cell mono ${benchmarkComparison.comparison?.tokenPct < 0 ? 'positive' : benchmarkComparison.comparison?.tokenPct > 0 ? 'negative' : ''}`}>
                {changePct(benchmarkComparison.comparison?.tokenPct)}
              </div>

              <div className="comparison-cell">Avg Cache %</div>
              <div className="comparison-cell mono">{formatPct(benchmarkComparison.baseline.avgCacheRate)}</div>
              <div className="comparison-cell mono">{formatPct(benchmarkComparison.active.avgCacheRate)}</div>
              <div className={`comparison-cell mono ${benchmarkComparison.comparison?.cacheDelta > 0 ? 'positive' : benchmarkComparison.comparison?.cacheDelta < 0 ? 'negative' : ''}`}>
                {changePct(benchmarkComparison.comparison?.cacheDelta)}
              </div>
            </div>
          )}

          {benchmarkTasks && benchmarkTasks.length > 0 && (
            <div style={{ marginTop: 16, maxHeight: 250, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Duration</th>
                    <th>Tokens</th>
                    <th>Model</th>
                    <th>Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkTasks.slice(0, 10).map(t => (
                    <tr key={t.id}>
                      <td className="mono">{formatDateTime(t.timestamp)}</td>
                      <td className="mono">{formatDuration(t.durationSec)}</td>
                      <td className="mono">{formatTokens(t.tokens)}</td>
                      <td className="mono">{formatModel(t.model)}</td>
                      <td>
                        <span className={`status-badge ${t.ham_active ? 'completed' : 'in-progress'}`}>
                          {t.ham_active ? 'HAM' : 'baseline'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="chart-section">
        <div className="chart-header">
          <span className="chart-title">
            Daily cost
            <InfoTip text={'Your actual API spend per day, calculated from tokens used and your model\'s pricing. The solid line is what you paid. The dashed line estimates what you would have paid without HAM \u2014 the gap between the two is your savings.'} />
          </span>
          <div className="chart-legend">
            <span className="chart-legend-item">
              <span className="legend-line" />
              HAM
            </span>
            <span className="chart-legend-item">
              <span className="legend-line dashed" />
              Without HAM
            </span>
          </div>
        </div>
        <div className="chart-box">
          <Chart
            data={costChartData}
            color="#1a1a1a"
            color2="#aaa"
            formatValue={formatCost}
          />
        </div>
      </div>

      {/* Model breakdown */}
      {benchmarkComparison?.byModel && Object.keys(benchmarkComparison.byModel).length > 0 && (
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
              {Object.entries(benchmarkComparison.byModel).map(([model, data]) => {
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
    </>
  );
}
