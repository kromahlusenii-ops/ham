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

function timeAgo(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  return days + 'd ago';
}

function estimateTokens(bytes) {
  return Math.round(bytes / 4);
}

export default function Overview({ stats, daily, health }) {
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
          sub={savingsPct > 0 ? `${savingsPct}% reduction` : 'no HAM sessions yet'}
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
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <span className="chart-title">
            Daily input tokens
            <InfoTip text={'The solid line shows how many tokens Claude actually read each day. The dashed line shows your cache reads \u2014 tokens Claude remembered from recent conversations instead of re-reading. When the dashed line is high relative to the solid line, your caching is working well, like Claude keeping notes between conversations instead of starting from scratch.'} />
          </span>
          <div className="chart-legend">
            <span className="chart-legend-item">
              <span className="legend-line" />
              Actual
            </span>
            <span className="chart-legend-item">
              <span className="legend-line dashed" />
              Baseline
            </span>
          </div>
        </div>
        <div className="chart-box">
          <Chart
            data={tokenChartData}
            color="#1a1a1a"
            color2="#aaa"
            formatValue={formatTokens}
          />
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <span className="chart-title">
            Daily cost
            <InfoTip text={'Your actual API spend per day, calculated from tokens used and your model\'s pricing. The solid line is what you paid. The dashed line estimates what you would have paid without HAM \u2014 the gap between the two is your savings.'} />
          </span>
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

      {health.length > 0 && (
        <div className="health-section">
          <div className="health-title">
            Context file health
            <InfoTip text={'Each directory with source code should have a CLAUDE.md file \u2014 a short briefing doc that tells Claude what that folder does and how things work there. Green means the file exists and is recent. Amber means it exists but hasn\'t been updated in a while, so Claude might be working from outdated info. Red means no file exists \u2014 Claude has to figure out that folder from scratch every time.'} />
          </div>
          <div className="health-list">
            {health.map(h => (
              <div key={h.path} className="health-item">
                <span className={`health-dot ${h.status}`} />
                <span className="health-path">{h.path}/</span>
                <span className={`health-meta ${h.status === 'green' ? '' : h.status}`}>
                  {h.status === 'red' && 'missing'}
                  {h.status === 'amber' && `stale \u00b7 ${estimateTokens(h.fileSize)} tok`}
                  {h.status === 'green' && `${estimateTokens(h.fileSize)} tok \u00b7 ${timeAgo(h.lastModified)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
