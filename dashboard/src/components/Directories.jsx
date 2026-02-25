import React from 'react';

function formatTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function Directories({ directories }) {
  if (!directories || directories.length === 0) {
    return (
      <div className="empty-state">
        <h3>No directory data</h3>
        <p>No file reads attributed to directories in the selected period.</p>
      </div>
    );
  }

  const maxSessions = Math.max(...directories.map(d => d.sessions), 1);

  return (
    <>
      <div className="table-card">
        <h3>Sessions by Directory</h3>
        <div className="bar-chart">
          {directories.map(d => (
            <div key={d.directory} className="bar-row">
              <span className="bar-label" title={d.directory}>
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
                <td className="mono">{d.directory}</td>
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
    </>
  );
}
