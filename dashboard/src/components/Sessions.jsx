import React from 'react';
import InfoTip from './InfoTip.jsx';

function formatTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '-';
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return '<1m';
  if (mins < 60) return mins + 'm';
  const hours = Math.floor(mins / 60);
  return hours + 'h ' + (mins % 60) + 'm';
}

function formatTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function modelShort(model) {
  if (!model) return '-';
  if (model.includes('opus')) return 'Opus';
  if (model.includes('sonnet')) return 'Sonnet';
  if (model.includes('haiku')) return 'Haiku';
  return model.split('-').slice(-1)[0];
}

export default function Sessions({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="empty-state">
        <h3>No sessions</h3>
        <p>No Claude Code sessions found for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <h3>
        Session history
        <InfoTip text={'Every Claude Code session in the selected period. Duration is wall-clock time. HAM shows whether hierarchical memory was active \u2014 ON sessions typically use fewer tokens and cost less. Cache Read is tokens Claude remembered from recent context instead of re-reading files.'} />
      </h3>
      <table>
        <thead>
          <tr>
            <th>Started</th>
            <th>Duration</th>
            <th>Model</th>
            <th>HAM</th>
            <th>Routing</th>
            <th>Messages</th>
            <th>Tools</th>
            <th>File Reads</th>
            <th>Input Tokens</th>
            <th>Cache Read</th>
            <th>Directory</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(s => (
            <tr key={s.sessionId}>
              <td className="mono">{formatTime(s.startTime)}</td>
              <td>{formatDuration(s.durationMs)}</td>
              <td>{modelShort(s.model)}</td>
              <td>
                <span className={`ham-badge ${s.isHamOn ? 'on' : 'off'}`}>
                  {s.isHamOn ? 'ON' : 'OFF'}
                </span>
              </td>
              <td>
                <span className={`routing-badge ${s.routingStatus || 'unrouted'}`}>
                  {s.routingStatus === 'routed' ? 'Routed'
                    : s.routingStatus === 'likely' ? 'Likely'
                    : 'Unrouted'}
                </span>
              </td>
              <td>{s.messageCount}</td>
              <td>{s.toolCallCount}</td>
              <td>{s.fileReads}</td>
              <td>{formatTokens(s.inputTokens)}</td>
              <td>{formatTokens(s.cacheReadTokens)}</td>
              <td className="mono">{s.primaryDirectory || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
