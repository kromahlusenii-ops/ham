import React, { useState } from 'react';
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

function buildTree(health) {
  const root = [];

  for (const entry of health) {
    const segments = entry.path === '.' ? ['.'] : entry.path.split('/');
    let children = root;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      let node = children.find(c => c.segment === segment);
      if (!node) {
        node = { segment, path: segments.slice(0, i + 1).join('/'), children: [] };
        children.push(node);
      }
      if (i === segments.length - 1) {
        node.entry = entry;
      }
      children = node.children;
    }
  }

  return root;
}

function hasRedDescendant(node) {
  if (node.entry && node.entry.status === 'red') return true;
  return node.children.some(hasRedDescendant);
}

function collectRedAncestorPaths(nodes) {
  const paths = new Set();

  function walk(node) {
    if (hasRedDescendant(node)) {
      paths.add(node.path);
    }
    node.children.forEach(walk);
  }

  nodes.forEach(walk);
  return paths;
}

function HealthTree({ tree }) {
  const [expanded, setExpanded] = useState(() => collectRedAncestorPaths(tree));

  const toggle = (path) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  function renderMeta(entry) {
    if (!entry) return null;
    return (
      <span className={`health-meta ${entry.status === 'green' ? '' : entry.status}`}>
        {entry.status === 'red' && 'missing'}
        {entry.status === 'yellow' && `inherited \u00b7 ${entry.coveredBy}/`}
        {entry.status === 'amber' && `stale \u00b7 ${estimateTokens(entry.fileSize)} tok`}
        {entry.status === 'green' && `${estimateTokens(entry.fileSize)} tok \u00b7 ${timeAgo(entry.lastModified)}`}
      </span>
    );
  }

  function renderNode(node, depth) {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.path);

    return (
      <div key={node.path}>
        <div
          className={`health-item ${hasChildren ? 'health-group-header' : ''}`}
          style={{ paddingLeft: `${24 + depth * 20}px` }}
          onClick={hasChildren ? () => toggle(node.path) : undefined}
        >
          {hasChildren ? (
            <span className={`health-chevron ${isExpanded ? '' : 'collapsed'}`}>&#9662;</span>
          ) : (
            <span className="health-chevron-spacer" />
          )}
          {node.entry ? (
            <span className={`health-dot ${node.entry.status}`} />
          ) : (
            <span className="health-dot-spacer" />
          )}
          <span className="health-path">{node.segment}/</span>
          {renderMeta(node.entry)}
        </div>
        {hasChildren && isExpanded && (
          <div className="health-children">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return <>{tree.map(node => renderNode(node, 0))}</>;
}

function formatCO2e(grams) {
  if (grams < 1) return '< 1g';
  if (grams < 1000) return Math.round(grams) + 'g';
  return (grams / 1000).toFixed(1) + ' kg';
}

export default function Overview({ stats, daily, health, carbon }) {
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

      {health.length > 0 && (() => {
        const tree = buildTree(health);
        return (
          <div className="health-section">
            <div className="health-title">
              Context file health
              <InfoTip text={'Each directory with source code should have a CLAUDE.md file \u2014 a short briefing doc that tells Claude what that folder does and how things work there. Green = has its own CLAUDE.md. Yellow = covered by a parent CLAUDE.md. Amber = has a CLAUDE.md but it may be stale. Red = no coverage at all.'} />
            </div>
            <div className="health-legend">
              <span className="health-legend-item"><span className="health-dot green" />Has CLAUDE.md</span>
              <span className="health-legend-item"><span className="health-dot yellow" />Inherited</span>
              <span className="health-legend-item"><span className="health-dot amber" />Stale</span>
              <span className="health-legend-item"><span className="health-dot red" />Missing</span>
            </div>
            <div className="health-list">
              <HealthTree tree={tree} />
            </div>
          </div>
        );
      })()}
    </>
  );
}
