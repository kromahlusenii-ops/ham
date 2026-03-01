import React, { useState } from 'react';
import InfoTip from './InfoTip.jsx';

function formatTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
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

export default function Directories({ directories, health }) {
  if (!directories || directories.length === 0) {
    return (
      <div className="empty-state">
        <h3>No directory data</h3>
        <p>No file reads attributed to directories in the selected period.</p>
      </div>
    );
  }

  const maxSessions = Math.max(...directories.map(d => d.sessions), 1);

  const healthMap = {};
  if (health) {
    for (const h of health) {
      healthMap[h.path] = h.status;
    }
  }

  return (
    <>
      <div className="table-card">
        <h3>
          Sessions by Directory
          <InfoTip text={'How many Claude Code sessions touched each directory. Tall bars mean that directory sees heavy activity \u2014 a good candidate for its own CLAUDE.md if it doesn\u2019t have one yet.'} />
        </h3>
        <div className="bar-chart">
          {directories.map(d => (
            <div key={d.directory} className="bar-row">
              <span className="bar-label" title={d.directory}>
                {healthMap[d.directory] && <span className={`health-dot ${healthMap[d.directory]}`} />}
                {d.directory}
              </span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(d.sessions / maxSessions) * 100}%` }}
                />
              </div>
              <span className="bar-value">{d.sessions}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="table-card">
        <h3>
          Directory breakdown
          <InfoTip text={'Per-directory stats across all sessions. Sessions = how many sessions read files there. HAM On = sessions with HAM active. File Reads = total files Claude opened. Input Tokens = tokens sent to the model. Cost = estimated API spend for that directory.'} />
        </h3>
        <table>
          <thead>
            <tr>
              <th>Directory</th>
              <th>Sessions</th>
              <th>HAM On</th>
              <th>File Reads</th>
              <th>Input Tokens</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {directories.map(d => (
              <tr key={d.directory}>
                <td className="mono">
                  {healthMap[d.directory] && <span className={`health-dot ${healthMap[d.directory]}`} style={{ width: 8, height: 8, marginRight: 8 }} />}
                  {d.directory}
                </td>
                <td>{d.sessions}</td>
                <td>{d.hamOnSessions}</td>
                <td>{d.fileReads}</td>
                <td>{formatTokens(d.inputTokens)}</td>
                <td>${d.cost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
