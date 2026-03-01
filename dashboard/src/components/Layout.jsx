import React from 'react';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'directories', label: 'Directories' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'efficiency', label: 'Efficiency' },
];

const TIME_OPTIONS = [7, 14, 30];

export default function Layout({ tab, setTab, days, setDays, stats, children }) {
  const projectName = stats?.projectName || 'project';
  const sessionCount = stats?.totalSessions ?? '-';

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header-left">
          <span className="header-label">HAM</span>
          <span className="header-project">{projectName}</span>
        </div>
        <div className="header-right">
          {sessionCount} sessions &middot; Claude Code<br />
          {days} day window
        </div>
      </header>

      {children.summary}

      <div className="tab-bar">
        <nav className="tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="time-filter">
          {TIME_OPTIONS.map(d => (
            <button
              key={d}
              className={`time-btn ${days === d ? 'active' : ''}`}
              onClick={() => setDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {children.content}

      <div className="footer">ham v{stats?.hamVersion || '0.2.0'}</div>
    </div>
  );
}
